import { Container, Sprite, type Application } from "pixi.js";
import { TILE_SIZE, VIEW_TILES_H, setViewTilesH, recomputeCameraZoom } from "../shared/constants";
import type { ClientTransport, EntityState, Snapshot } from "../shared/protocol";
import { BODY_TYPES } from "../shared/outfits";
import { UI_SCALE } from "./ui/theme";
import { TileId, type MapData } from "../shared/types";
import { createSprites, type SpriteLibrary } from "./assets/sprites";
import { Camera } from "./Camera";
import { EntityRenderer } from "./render/EntityRenderer";
import { Lighting } from "./render/Lighting";
import { WorldRenderer } from "./render/WorldRenderer";
import { Keyboard } from "./input/Keyboard";
import { Mouse } from "./input/Mouse";
import { Hud } from "./ui/Hud";
import { DialogueWindow } from "./ui/DialogueWindow";
import { ShopWindow } from "./ui/ShopWindow";
import { CookingWindow } from "./ui/CookingWindow";
import { JournalPanel } from "./ui/JournalPanel";
import { EquipPanel } from "./ui/EquipPanel";
import { ContainerWindow } from "./ui/ContainerWindow";
import { ItemDnD } from "./ui/dnd";
import { ChatWindow } from "./ui/ChatWindow";
import { Minimap } from "./ui/Minimap";
import { Tooltip } from "./ui/Tooltip";
import { CharacterPanel } from "./ui/dom/CharacterPanel";
import { OutfitPanel } from "./ui/OutfitPanel";
import { SkillBar } from "./ui/SkillBar";
import { TrackingToast } from "./ui/TrackingToast";
import { ALL_SKILL_IDS, T2_SKILL_IDS, skillMeta } from "./ui/skillMeta";

/**
 * Topo da COLUNA DIREITA de janelas (estilo Tibia): abaixo do minimapa (~192px)
 * + dock de equipamento (~250px) ancorados no topo-direito. Janelas de container
 * (mochila/cadáver) empilham a partir daqui pra não SOBREPOR o equip.
 */
const RIGHT_COLUMN_TOP = 474;

/** Hotkeys 1–9 → índice de slot da barra de skills (Digit0 é o cicla-outfit). */
const SKILL_HOTKEYS: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
  Digit7: 6,
  Digit8: 7,
  Digit9: 8,
};

/**
 * Monta um MapData renderizável do ANDAR ativo (Fase 1 dos andares): o andar base
 * (z=0) é o próprio mapa; um subsolo (z<0) vira um mapa do TAMANHO do base com os
 * tiles do andar estampados na posição de mundo (ox+lx) e Void (breu) no resto.
 * Assim o WorldRenderer renderiza qualquer andar sem saber de offset.
 */
function floorAsMap(base: MapData, z: number): { map: MapData; ambient?: number } {
  if (z === (base.z ?? 0)) return { map: base };
  const f = (base.floors ?? []).find((fl) => fl.z === z);
  if (!f) return { map: base };
  const tiles: TileId[] = new Array(base.width * base.height).fill(TileId.Void);
  for (let ly = 0; ly < f.height; ly++) {
    for (let lx = 0; lx < f.width; lx++) {
      const wx = f.ox + lx, wy = f.oy + ly;
      if (wx >= 0 && wy >= 0 && wx < base.width && wy < base.height) {
        tiles[wy * base.width + wx] = f.tiles[ly * f.width + lx];
      }
    }
  }
  return {
    map: { ...base, tiles, decor: f.decor, lights: f.lights, portals: f.portals, buildings: undefined, z: f.z },
    ambient: f.ambient,
  };
}

/**
 * Orquestra o lado do cliente: recebe mensagens do "servidor",
 * renderiza o mundo e envia input. Não contém NENHUMA regra de jogo.
 */
export class Game {
  private sprites: SpriteLibrary;
  private camera = new Camera();
  private hud = new Hud();
  private charPanel = new CharacterPanel(
    document.getElementById("ui-root")!,
    (attr) => this.transport.send({ type: "allocateStatPoint", attr }),
  );
  private outfitPanel = new OutfitPanel((outfit) =>
    this.transport.send({ type: "setOutfit", outfit }),
  );
  private skillBar = new SkillBar();
  private trackingToast = new TrackingToast();
  private dnd = new ItemDnD(
    (from, to) => this.transport.send({ type: "moveItem", from, to }),
    // Soltou o item sobre o MUNDO (fora de qualquer painel) = largar no chão.
    (from, sx, sy) => {
      if (this.uiBlocksClick(sx, sy)) return;
      this.transport.send({ type: "moveItem", from, to: { kind: "ground" } });
    },
  );
  private dialogueWin = new DialogueWindow((optionId) =>
    this.transport.send({ type: "dialogueChoice", optionId }),
  );
  private shopWin = new ShopWindow({
    buy: (templateId) => this.transport.send({ type: "buyItem", templateId }),
    sell: (instanceId) => this.transport.send({ type: "sellItem", instanceId }),
    close: () => this.transport.send({ type: "closeShop" }),
  });
  /** Janela de cozinha (tecla C). Estado de abertura é do client (não trafega). */
  private cookingOpen = false;
  private cookWin = new CookingWindow({
    cook: (recipeId) => this.transport.send({ type: "cook", recipeId }),
    close: () => (this.cookingOpen = false),
  });
  private journal = new JournalPanel();
  private tooltip = new Tooltip();
  private equipPanel = new EquipPanel(this.dnd, this.tooltip);
  private minimap!: Minimap;
  /** Janelas de container abertas, por containerId. */
  private containerWins = new Map<number, ContainerWindow>();
  private lastCorpses: Snapshot["corpses"] = [];
  /** Baús/portas do andar atual (do snapshot) — alvos do clique→comando. */
  private lastChests: Snapshot["chests"] = [];
  private lastDoors: Snapshot["doors"] = [];
  /** Itens no chão do andar atual (do snapshot) — alvos do clique→pegar. */
  private lastGroundItems: Snapshot["groundItems"] = [];
  /** Item no chão clicado de longe: anda até ele e pega ao chegar (≤1 tile). */
  private pendingPickupId: number | null = null;
  private keyboard!: Keyboard;
  private chat = new ChatWindow((text) => this.transport.send({ type: "say", text }));
  /** NPC que o jogador clicou de longe: anda até ele e conversa ao chegar. */
  private pendingTalkNpcId: number | null = null;
  /** Baú clicado de longe: anda até ele e manda `openChest` ao chegar (≤2 tiles). */
  private pendingChestId: string | null = null;
  /** Porta clicada de longe: anda até ela e manda `interact` ao chegar (≤2 tiles). */
  private pendingDoorId: string | null = null;

  private worldContainer = new Container();
  /** Camada de UI — SEMPRE acima da iluminação (que é multiply sobre o mundo). */
  private uiLayer = new Container();
  private worldRenderer: WorldRenderer | null = null;
  /** Cache de render por ANDAR (z): construir os chunks de RenderTexture é caro, então
   *  cada andar é montado UMA vez e depois só alterna visibilidade — troca de andar
   *  vira O(1) (antes destruía+reconstruía os ~484 chunks da superfície = hitch). */
  private floorCache = new Map<number, { world: WorldRenderer; entities: EntityRenderer }>();
  /** Mapa base (z=0, com floors) e o andar atualmente renderizado. */
  private baseMap: MapData | null = null;
  private renderZ = 0;
  private entityRenderer: EntityRenderer | null = null;
  private lighting: Lighting | null = null;
  private tileCursor: Sprite;
  private mouse: Mouse;

  private playerId = -1;
  private playerState: EntityState | null = null;
  /** Tile do jogador no snapshot anterior (detecta teleporte → corta a câmera). */
  private lastPlayerTile: { x: number; y: number } | null = null;
  private lastEntities: EntityState[] = [];
  /** Alvo selecionado atual (do snapshot) — usado pelas hotkeys de skill. */
  private targetId: number | null = null;
  /**
   * Skill de chão (groundTarget) ARMADA esperando a mira: a hotkey arma o id; o
   * PRÓXIMO clique no mundo manda `useSkill` com `aim` = tile clicado. Esc/2ª
   * hotkey cancela. Apresentação pura — a sim valida tudo.
   */
  private aimingSkillId: string | null = null;
  private started = false;
  /** Último level visto no snapshot — para detectar subida (só apresentação). */
  private lastLevel = 0;

  constructor(
    private app: Application,
    private transport: ClientTransport,
  ) {
    this.sprites = createSprites();
    // Minimapa desenha no GPU (RenderTexture do andar) → precisa do renderer já pronto.
    this.minimap = new Minimap(this.app.renderer);
    // minimapa empurra/puxa o equip ao redimensionar (só se estiver colado nele)
    this.minimap.onResized = (before, after) => this.equipPanel.shiftIfDockedAt(before, after);

    this.tileCursor = new Sprite(this.sprites.tileCursor);
    this.tileCursor.alpha = 0.55;

    // input
    this.keyboard = new Keyboard((dir) => this.transport.send({ type: "setDir", dir }));
    // WASD/hotkeys suspensos enquanto o chat está com foco de digitação.
    this.keyboard.setSuspendGate(() => this.chat.inputFocused);
    // Teclas de UI/skills (apresentação pura — só envia comandos).
    window.addEventListener("keydown", (ev) => {
      if (ev.repeat) return;
      if (this.chat.inputFocused) return; // chat captura tudo enquanto digita
      // C: abre/fecha o painel de personagem.
      if (ev.code === "KeyC") {
        ev.preventDefault();
        this.charPanel.toggle();
        return;
      }
      // O: janela de outfit (peças + cores — estilo Tibia).
      if (ev.code === "KeyO") {
        ev.preventDefault();
        this.outfitPanel.toggle();
        return;
      }
      // K: abre/fecha a janela de cozinha (kitchen — COZINHA.md).
      if (ev.code === "KeyK") {
        ev.preventDefault();
        this.cookingOpen = !this.cookingOpen;
        return;
      }
      // J: diário de quests.
      if (ev.code === "KeyJ") {
        ev.preventDefault();
        this.journal.toggle();
        return;
      }
      // E / Tab / I: abre-fecha a mochila (o equipamento agora é dock fixo à direita).
      if (ev.code === "KeyE" || ev.code === "Tab" || ev.code === "KeyI") {
        ev.preventDefault();
        const bid = this.playerState?.backpackContainerId;
        if (bid == null) return;
        if (this.containerWins.has(bid)) this.transport.send({ type: "closeContainer", containerId: bid });
        else this.transport.send({ type: "openContainer", containerId: bid });
        return;
      }
      // Esc: fecha loja/diálogo se abertos; senão cancela o alvo (estilo Tibia).
      if (ev.code === "Escape") {
        ev.preventDefault();
        if (this.aimingSkillId) {
          this.aimingSkillId = null; // cancela a mira de skillshot armada
        } else if (this.cookingOpen) {
          this.cookingOpen = false;
        } else if (this.playerState?.shop) {
          this.transport.send({ type: "closeShop" });
        } else if (this.playerState?.dialogue) {
          this.transport.send({ type: "closeDialogue" });
        } else {
          this.transport.send({ type: "selectTarget", entityId: null });
        }
        return;
      }
      // 1–6: usa a skill do slot correspondente.
      const slot = SKILL_HOTKEYS[ev.code];
      if (slot !== undefined) {
        ev.preventDefault();
        this.useSkillSlot(slot);
        return;
      }
      // F9 (DEV): concede as 6 skills do kit M1 ao player p/ testar a barra.
      if (ev.code === "F9") {
        ev.preventDefault();
        for (const id of ALL_SKILL_IDS) {
          this.transport.send({ type: "debugGrantSkill", skillId: id });
        }
      }
      // F10 (DEV): concede o kit T2+ (skillshot/burst/cadeia/dreno) p/ testar o
      // render novo. Caem nos slots após o M1 (hotkeys 7–9 alcançam os 3 primeiros).
      if (ev.code === "F10") {
        ev.preventDefault();
        for (const id of T2_SKILL_IDS) {
          this.transport.send({ type: "debugGrantSkill", skillId: id });
        }
      }
      // 0: cicla SETS completos possuídos (atalho rápido; mix fino é na
      // janela de outfit). A sim valida posse — o client só pede.
      if (ev.code === "Digit0") {
        ev.preventDefault();
        this.cycleBody();
      }
      // F8 (DEV): desbloqueia o catálogo inteiro de peças no guarda-roupa.
      if (ev.code === "F8") {
        ev.preventDefault();
        this.transport.send({ type: "debugGrantOutfit" });
      }
      // -/= (TUNING): alvo de tiles verticais ao vivo (FOV estilo Tibia). Mais
      // tiles = tiles menores na tela. Achar o ponto e travar VIEW_TILES_H em
      // constants.ts. O zoom é derivado disso a cada frame.
      if (ev.code === "Minus") {
        ev.preventDefault();
        setViewTilesH(VIEW_TILES_H - 1);
        console.log(`[fov] VIEW_TILES_H = ${VIEW_TILES_H}`);
      }
      if (ev.code === "Equal") {
        ev.preventDefault();
        setViewTilesH(VIEW_TILES_H + 1);
        console.log(`[fov] VIEW_TILES_H = ${VIEW_TILES_H}`);
      }
    });
    this.mouse = new Mouse(this.app.canvas, (sx, sy) => {
      // Clique sobre painel de UI NÃO vaza para o mundo (anti click-through):
      // o boneco não anda quando o jogador interage com uma janela.
      if (this.uiBlocksClick(sx, sy)) return;
      const tile = this.camera.screenToTile(sx, sy, this.app.screen.width, this.app.screen.height);
      // Skillshot armada (groundTarget): o clique MIRA o tile e conjura — não anda
      // nem seleciona alvo. A sim valida alcance/mana/cooldown.
      if (this.aimingSkillId) {
        this.transport.send({ type: "useSkill", skillId: this.aimingSkillId, aim: { x: tile.x, y: tile.y } });
        this.aimingSkillId = null;
        return;
      }
      // Click num monstro = seleciona alvo (re-click no alvo atual = cancela,
      // toggle estilo Tibia); click no chão = só anda — andar NÃO cancela o
      // ataque (kitar/reposicionar mantendo o auto-attack, como em Tibia).
      const monster = this.lastEntities.find(
        (e) => e.kind === "monster" && e.pos.x === tile.x && e.pos.y === tile.y,
      );
      const npc = this.lastEntities.find(
        (e) => e.kind === "npc" && e.pos.x === tile.x && e.pos.y === tile.y,
      );
      const corpse = this.lastCorpses.find((c) => c.pos.x === tile.x && c.pos.y === tile.y);
      const chest = this.lastChests.find((c) => c.pos.x === tile.x && c.pos.y === tile.y);
      // Só portas FECHADAS são alvo de interação; aberta = tile passável (anda).
      const door = this.lastDoors.find((d) => !d.open && d.pos.x === tile.x && d.pos.y === tile.y);
      if (monster) {
        this.transport.send({
          type: "selectTarget",
          entityId: monster.id === this.targetId ? null : monster.id,
        });
      } else if (npc) {
        const me = this.playerState;
        const near = me && Math.max(Math.abs(me.pos.x - npc.pos.x), Math.abs(me.pos.y - npc.pos.y)) <= 3;
        this.clearPendingInteractions();
        if (near) {
          this.transport.send({ type: "talk", npcId: npc.id });
        } else {
          // anda até um tile adjacente e conversa ao chegar (próximo snapshot)
          this.pendingTalkNpcId = npc.id;
          this.transport.send({ type: "walkTo", x: npc.pos.x, y: npc.pos.y });
        }
      } else if (corpse) {
        this.transport.send({ type: "openContainer", containerId: corpse.id });
      } else if (chest) {
        // Baú: em alcance (≤2, régua da sim) abre já; senão anda até lá e abre ao
        // chegar. O sprite aberto/vazio vem do snapshot — aqui só o comando.
        this.clearPendingInteractions();
        if (this.inReach(chest.pos)) this.transport.send({ type: "openChest", chestId: chest.id });
        else { this.pendingChestId = chest.id; this.transport.send({ type: "walkTo", x: chest.pos.x, y: chest.pos.y }); }
      } else if (door) {
        // Porta fechada: mesmo padrão — `interact` (a sim abre com a chave certa).
        this.clearPendingInteractions();
        if (this.inReach(door.pos)) this.transport.send({ type: "interact", interactableId: door.id });
        else { this.pendingDoorId = door.id; this.transport.send({ type: "walkTo", x: door.pos.x, y: door.pos.y }); }
      } else {
        this.clearPendingInteractions();
        this.transport.send({ type: "walkTo", x: tile.x, y: tile.y });
      }
    });

    this.transport.onMessage((msg) => {
      if (msg.type === "welcome") {
        this.playerId = msg.playerId;
        this.buildWorld(msg.map);
      } else if (msg.type === "snapshot") {
        this.onSnapshot(msg.snap);
      }
    });

    window.addEventListener("resize", () => this.onResize());
    // Drag & drop: fantasma segue o mouse; soltar tenta o drop nos slots registrados.
    this.app.canvas.addEventListener("pointermove", (ev: PointerEvent) => {
      if (this.dnd.dragging) this.dnd.move(ev.offsetX, ev.offsetY);
    });
    this.app.canvas.addEventListener("pointerup", (ev: PointerEvent) => {
      if (this.dnd.dragging) this.dnd.drop(ev.offsetX, ev.offsetY);
    });
  }

  /**
   * Usa a skill do slot (hotkey). Decide o `targetId` pela semântica de
   * apresentação: ofensivas mandam o alvo selecionado atual; cura sem alvo =
   * self (omite). A sim valida conhecida/mana/cooldown/alcance — aqui ZERO regra.
   */
  private useSkillSlot(slot: number): void {
    const skillId = this.skillBar.skillIdForSlot(slot);
    if (!skillId) return;
    const mode = skillMeta(skillId).target;
    if (mode === "ground") {
      // Skillshot: arma a mira. Apertar de novo a MESMA arma → cancela (toggle).
      this.aimingSkillId = this.aimingSkillId === skillId ? null : skillId;
    } else if (mode === "self" || mode === "selfBurst") {
      // Cura/burst centrado no caster: sem alvo nem aim.
      this.aimingSkillId = null;
      this.transport.send({ type: "useSkill", skillId });
    } else {
      this.aimingSkillId = null;
      this.transport.send({ type: "useSkill", skillId, targetId: this.targetId });
    }
  }

  /** Jogador está a ≤2 tiles (Chebyshev) de `t`? Mesma régua reach-based que a
   *  sim usa p/ baú/porta — só pra decidir abrir já vs. andar até lá (a sim revalida). */
  private inReach(t: { x: number; y: number }): boolean {
    const me = this.playerState;
    return !!me && Math.max(Math.abs(me.pos.x - t.x), Math.abs(me.pos.y - t.y)) <= 2;
  }

  /** Limpa os alvos de interação pendentes (novo clique cancela o anterior). */
  private clearPendingInteractions(): void {
    this.pendingTalkNpcId = null;
    this.pendingChestId = null;
    this.pendingDoorId = null;
  }

  /** True se (sx,sy) está sobre um painel de UI visível (janelas clicáveis). */
  private uiBlocksClick(sx: number, sy: number): boolean {
    const panels = [
      this.outfitPanel.container,
      this.equipPanel.container,
      this.journal.container,
      this.dialogueWin.container,
      ...[...this.containerWins.values()].map((w) => w.container),
    ];
    for (const c of panels) {
      if (c.visible && c.getBounds().rectangle.contains(sx, sy)) return true;
    }
    if (this.chat.hitTest(sx, sy)) return true;
    if (this.hud.hitTest(sx, sy)) return true;
    if (this.minimap.hitTest(sx, sy)) return true;
    return this.dnd.dragging;
  }

  /**
   * Hotkey 0: cicla o CORPO/avatar do herói (homem↔mulher). A aparência é estado
   * da sim (no online todos veem): o client manda `setBody`, a sim valida e projeta.
   */
  private cycleBody(): void {
    const me = this.playerState;
    if (!me) return;
    const list = BODY_TYPES as readonly string[];
    const idx = list.indexOf(me.bodyType ?? list[0]);
    const next = list[(idx + 1) % list.length];
    this.transport.send({ type: "setBody", body: next });
  }

  private buildWorld(map: MapData): void {
    this.baseMap = map;
    this.renderZ = map.z ?? 0;
    this.worldRenderer = new WorldRenderer(this.sprites, map, this.app.renderer);
    this.worldContainer.addChild(this.worldRenderer.ground);
    this.worldContainer.addChild(this.worldRenderer.shadows);
    this.worldContainer.addChild(this.tileCursor);
    this.worldContainer.addChild(this.worldRenderer.objects);
    this.worldContainer.addChild(this.worldRenderer.roofs); // telhados acima de tudo no mundo
    this.app.stage.addChild(this.worldContainer);

    this.entityRenderer = new EntityRenderer(this.sprites, this.worldRenderer.objects, this.playerId);
    this.floorCache.set(this.renderZ, { world: this.worldRenderer, entities: this.entityRenderer });

    this.lighting = new Lighting(this.sprites, this.app.screen.width, this.app.screen.height);
    this.lighting.setMapLights(map.lights);
    this.app.stage.addChild(this.lighting.overlay);
    this.app.stage.addChild(this.uiLayer); // UI acima da luz
    // UI menor: a camada inteira escala por UI_SCALE; os painéis recebem o "espaço
    // virtual" (tela / UI_SCALE) p/ ancorar nas bordas certas após o downscale. O
    // input segue 1:1 (eventos Pixi + getBounds/ev.global respeitam o scale).
    this.uiLayer.scale.set(UI_SCALE);
    const uw = this.app.screen.width / UI_SCALE;
    const uh = this.app.screen.height / UI_SCALE;

    this.uiLayer.addChild(this.hud.container);
    this.hud.resize(uw, uh);

    // Barra de skills (embaixo-centro).
    this.uiLayer.addChild(this.skillBar.container);
    this.skillBar.resize(uw, uh);

    // Painel de personagem: migrado p/ DOM (#ui-root), auto-anexado no constructor.
    this.charPanel.resize(uh);

    // Janela de outfit (oculta até apertar O).
    this.uiLayer.addChild(this.outfitPanel.container);
    this.outfitPanel.resize(uw, uh);

    // Toast da camada emergente (hint/unlock) — por cima de tudo.
    this.uiLayer.addChild(this.trackingToast.container);
    this.uiLayer.addChild(this.journal.container);
    this.uiLayer.addChild(this.minimap.container);
    this.uiLayer.addChild(this.equipPanel.container);
    this.uiLayer.addChild(this.dialogueWin.container);
    this.uiLayer.addChild(this.shopWin.container);
    this.uiLayer.addChild(this.cookWin.container);
    this.uiLayer.addChild(this.chat.container);
    // Tooltip e ghost do DnD vão FORA da camada escalada (no stage, escala 1): ambos
    // recebem coords de TELA (getGlobalPosition / ev.global), então aparecem 1:1 no
    // cursor/slot — dentro do uiLayer escalado ficariam deslocados.
    this.app.stage.addChild(this.tooltip.container);
    this.app.stage.addChild(this.dnd.ghostLayer);
    this.tooltip.resize(this.app.screen.width, this.app.screen.height);
    this.trackingToast.resize(uw, uh);
    this.chat.resize(uw, uh);
    // Painéis novos precisam das dimensões de tela JÁ no startup (sem isso a
    // janela de diálogo nasce em coordenada negativa = invisível).
    this.dialogueWin.resize(uw, uh);
    this.shopWin.resize(uw, uh);
    this.cookWin.resize(uw, uh);
    this.journal.resize(uw, uh);
    this.equipPanel.resize(uw, uh);
    this.equipPanel.setState(this.playerState ?? undefined);
    this.chat.resize(uw, uh);
    this.minimap.setMap(map);
    this.minimap.resize(uw, uh);

    this.camera.setMapSize(map.width, map.height);
    this.camera.snapTo((map.spawn.x + 0.5) * TILE_SIZE, (map.spawn.y + 0.5) * TILE_SIZE);
    // Prime síncrono dos chunks ao redor do spawn (sem teto) → primeiro frame já
    // tem o chão pronto, sem flash de breu. Depois o streaming roda no frame loop.
    this.worldRenderer.updateStreaming(
      this.camera.x, this.camera.y, this.app.screen.width, this.app.screen.height, Infinity,
    );

    if (!this.started) {
      this.started = true;
      this.app.ticker.add((ticker) => this.frame(ticker.deltaMS));
    }
  }

  /**
   * Troca o ANDAR renderizado (Fase 1) por VISIBILIDADE, não rebuild: destaca os
   * containers do andar atual do mundo (sem destruir os chunks) e anexa os do andar
   * `z` — construído UMA vez e cacheado em `floorCache`. Recria só a luz/ambiente e
   * aponta o EntityRenderer cacheado do andar. Troca vira O(1) (era o hitch da descida/
   * subida, que destruía+reconstruía centenas de RenderTextures por troca).
   */
  private rebuildWorldFor(z: number): void {
    if (!this.baseMap) return;
    const { map: fmap, ambient } = floorAsMap(this.baseMap, z);
    const wc = this.worldContainer;
    // destaca o andar atual (NÃO destrói — fica vivo no cache pra voltar instantâneo)
    const cur = this.worldRenderer;
    if (cur) { wc.removeChild(cur.ground, cur.shadows, cur.objects, cur.roofs); }
    wc.removeChild(this.tileCursor);

    let cached = this.floorCache.get(z);
    if (!cached) {
      const world = new WorldRenderer(this.sprites, fmap, this.app.renderer);
      const entities = new EntityRenderer(this.sprites, world.objects, this.playerId);
      cached = { world, entities };
      this.floorCache.set(z, cached);
    }
    this.worldRenderer = cached.world;
    this.entityRenderer = cached.entities;
    wc.addChild(cached.world.ground);
    wc.addChild(cached.world.shadows);
    wc.addChild(this.tileCursor);
    wc.addChild(cached.world.objects);
    wc.addChild(cached.world.roofs);

    this.lighting?.setMapLights(fmap.lights);
    this.lighting?.setAmbient(ambient);
    this.minimap.setMap(fmap); // minimapa segue o andar ativo (névoa por z)
    this.renderZ = z;
    // Prime os chunks do andar novo ao redor da câmera (sem teto) → sem flash de
    // breu na descida/subida. O cache de andar guarda os chunks já streamados.
    cached.world.updateStreaming(
      this.camera.x, this.camera.y, this.app.screen.width, this.app.screen.height, Infinity,
    );
  }

  private onSnapshot(snap: Snapshot): void {
    // ANDAR do jogador: tudo que se vê/interage é filtrado por z (SISTEMA-ANDARES
    // §8 — você só recebe/enxerga entidades do seu andar). O render de TILES do
    // andar ativo entra na Fase 1 (junto do layout dos esgotos); por ora o filtro
    // de entidades já torna a sim z-aware observável.
    const me = snap.entities.find((e) => e.id === this.playerId) ?? null;
    const pz = me?.z ?? 0;
    // Mudou de andar → reconstrói o mundo com os tiles do andar ativo (Fase 1).
    if (pz !== this.renderZ) this.rebuildWorldFor(pz);
    const viewSnap: Snapshot = {
      ...snap,
      entities: snap.entities.filter((e) => e.z === pz),
      corpses: snap.corpses.filter((c) => c.z === pz),
      chests: snap.chests.filter((c) => c.z === pz),
      doors: snap.doors.filter((d) => d.z === pz),
    };
    this.entityRenderer?.apply(viewSnap);
    // Baús/portas do andar ativo: o WorldRenderer desenha o estado (saqueado/aberto)
    // no container y-sorted; o client SÓ projeta o snapshot (zero regra).
    this.worldRenderer?.setChests(viewSnap.chests);
    this.worldRenderer?.setDoors(viewSnap.doors);
    this.lastChests = viewSnap.chests;
    this.lastDoors = viewSnap.doors;
    // Camada emergente (DESIGN-EVOLUCAO.md §"Visibilidade"): hint/unlock chegam
    // como eventos one-shot SEM progresso numérico. O toast só ENCENA o evento
    // (sussurro no hint, momento épico no unlock) — ZERO regra de jogo aqui.
    for (const ev of snap.events) {
      if (ev.kind === "trackingHint") {
        this.trackingToast.enqueueHint(ev.text);
      } else if (ev.kind === "trackingUnlock") {
        this.trackingToast.enqueueUnlock(ev.category, ev.name, ev.flavorText);
      } else if (ev.kind === "chat") {
        // privada? só o destinatário vê (loot/level/quest)
        if (ev.recipientId != null && ev.recipientId !== this.playerId) continue;
        const line = ev.speakerName ? `${ev.speakerName}: ${ev.text}` : ev.text;
        this.chat.push(ev.channel, line);
        // balão sobre a cabeça (fala local e NPC)
        if (ev.speakerId != null && (ev.channel === "local" || ev.channel === "npc")) {
          this.entityRenderer?.spawnSpeech(ev.speakerId, ev.text);
        }
      }
    }
    this.lastEntities = viewSnap.entities;
    this.playerState = me;
    // talk pendente: chegou perto do NPC clicado → conversa e limpa
    if (this.pendingTalkNpcId != null && this.playerState) {
      const npc = snap.entities.find((e) => e.id === this.pendingTalkNpcId);
      if (!npc) {
        this.pendingTalkNpcId = null;
      } else {
        const d = Math.max(Math.abs(this.playerState.pos.x - npc.pos.x), Math.abs(this.playerState.pos.y - npc.pos.y));
        if (d <= 3) {
          this.transport.send({ type: "talk", npcId: npc.id });
          this.pendingTalkNpcId = null;
        }
      }
    }
    // baú/porta pendente: andou até lá e chegou em alcance → manda o comando e
    // limpa. Some do snapshot (andar diferente) → cancela. A sim revalida o reach.
    if (this.pendingChestId != null && this.playerState) {
      const c = this.lastChests.find((x) => x.id === this.pendingChestId);
      if (!c) this.pendingChestId = null;
      else if (this.inReach(c.pos)) {
        this.transport.send({ type: "openChest", chestId: c.id });
        this.pendingChestId = null;
      }
    }
    if (this.pendingDoorId != null && this.playerState) {
      const d = this.lastDoors.find((x) => x.id === this.pendingDoorId);
      if (!d || d.open) this.pendingDoorId = null; // sumiu ou já abriu
      else if (this.inReach(d.pos)) {
        this.transport.send({ type: "interact", interactableId: d.id });
        this.pendingDoorId = null;
      }
    }
    // Alvo vem da PRÓPRIA entidade do jogador (targetId é por-jogador no protocolo).
    this.targetId = this.playerState?.targetId ?? null;
    if (this.playerState) {
      // Teleporte (respawn de morte): corta a câmera junto com o sprite —
      // sem isso ela atravessaria o mapa "voando" até o spawn.
      const t = this.playerState.pos;
      if (
        this.lastPlayerTile &&
        Math.max(Math.abs(t.x - this.lastPlayerTile.x), Math.abs(t.y - this.lastPlayerTile.y)) > 1
      ) {
        const p = this.entityRenderer?.playerWorldPos();
        if (p) {
          this.camera.snapTo(p.x, p.y);
          // Teleporte cobre distância grande de uma vez → prime sem teto no destino
          // pra não aparecer breu enquanto o orçamento por frame alcança a câmera.
          this.worldRenderer?.updateStreaming(
            this.camera.x, this.camera.y, this.app.screen.width, this.app.screen.height, Infinity,
          );
        }
      }
      this.lastPlayerTile = { x: t.x, y: t.y };
    }
    if (this.playerState) {
      this.hud.setName(this.playerState.name);
      this.hud.setStats(this.playerState.hp, this.playerState.maxHp, this.playerState.mp, this.playerState.maxMp);
      this.skillBar.setSkills(this.playerState.skills);
      const progress = this.playerState.progress;
      if (progress) {
        this.hud.setProgress(progress);
        this.charPanel.setProgress(progress);
        // Subiu de nível? Texto flutuante dourado (apresentação, não regra).
        if (this.lastLevel > 0 && progress.level > this.lastLevel) {
          this.entityRenderer?.spawnLevelUpText();
        }
        this.lastLevel = progress.level;
      }
      this.outfitPanel.setState(this.playerState.outfit, this.playerState.wardrobe);
      this.dialogueWin.update(this.playerState.dialogue);
      // Loja: o bolso vem no snapshot quando há loja aberta (a sim garante).
      const bpId = this.playerState.backpackContainerId;
      const backpackView = this.playerState.containers?.find((c) => c.containerId === bpId);
      this.shopWin.update(this.playerState.shop, backpackView);
      this.cookWin.update(this.playerState.recipes, this.cookingOpen);
      this.journal.setState(this.playerState.quests);
      this.equipPanel.setState(this.playerState);
      this.minimap.update(this.playerState.pos.x, this.playerState.pos.y);
      this.syncContainerWindows(this.playerState.containers ?? []);
    }
    this.lastCorpses = viewSnap.corpses;
    this.entityRenderer?.setCorpses(snap.corpses);
  }

  /** Sincroniza janelas de container com as views do snapshot (abre/fecha/atualiza). */
  private syncContainerWindows(views: NonNullable<EntityState["containers"]>): void {
    const seen = new Set<number>();
    // Empilha na COLUNA DIREITA abaixo do dock (minimapa + equip), sem sobrepor —
    // organização estilo Tibia. O usuário ainda pode arrastar cada janela depois.
    // espaço virtual (tela / UI_SCALE): as janelas vivem no uiLayer escalado.
    const rightX = this.app.screen.width / UI_SCALE - ContainerWindow.WIDTH - 12;
    let stackY = RIGHT_COLUMN_TOP;
    for (const v of views) {
      seen.add(v.containerId);
      let win = this.containerWins.get(v.containerId);
      if (!win) {
        win = new ContainerWindow(
          v.containerId,
          this.dnd,
          {
            close: (id) => this.transport.send({ type: "closeContainer", containerId: id }),
            lootGold: (id, slot) => this.transport.send({ type: "lootGold", containerId: id, slot }),
            useItem: (ref) => this.transport.send({ type: "useItem", ref }),
          },
          this.tooltip,
          { x: rightX, y: stackY },
        );
        this.containerWins.set(v.containerId, win);
        this.uiLayer.addChild(win.container);
      }
      win.update(v);
      stackY += ContainerWindow.heightFor(v.capacity) + 6;
    }
    for (const [id, win] of [...this.containerWins]) {
      if (!seen.has(id)) {
        win.destroy();
        this.containerWins.delete(id);
      }
    }
  }

  private frame(deltaMS: number): void {
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    // zoom derivado do FOV (Tibia-like): caber VIEW_TILES_H tiles na altura da
    // tela. Recalcula antes de follow/streaming/apply, que leem CAMERA_ZOOM.
    recomputeCameraZoom(screenW, screenH);

    this.worldRenderer?.tick(deltaMS);
    this.entityRenderer?.tick(deltaMS);
    this.hud.tick(deltaMS); // pulso do badge de pontos livres
    this.trackingToast.tick(deltaMS); // fila + animação de hint/unlock

    // câmera segue a posição visual (interpolada) do jogador
    const p = this.entityRenderer?.playerWorldPos();
    if (p) {
      this.camera.follow(p.x, p.y, deltaMS, screenW, screenH);
      this.lighting?.setPlayerLightPos(p.x, p.y);
    }
    // STREAMING de chunks de chão: constrói os visíveis (+margem), recicla os
    // distantes. Orçamento por frame (default) evita hitch ao cruzar fronteira.
    this.worldRenderer?.updateStreaming(this.camera.x, this.camera.y, screenW, screenH);
    this.camera.apply(this.worldContainer, screenW, screenH);

    // telhados: somem quando o player entra no edifício (tile autoritativo)
    if (this.playerState) {
      this.worldRenderer?.updateRoofs(this.playerState.pos.x, this.playerState.pos.y, deltaMS);
    }

    // cursor de tile sob o mouse — tingido quando há skillshot armada (mira de chão)
    if (this.mouse.insideCanvas) {
      const t = this.camera.screenToTile(this.mouse.screenX, this.mouse.screenY, screenW, screenH);
      this.tileCursor.visible = true;
      this.tileCursor.position.set(t.x * TILE_SIZE, t.y * TILE_SIZE);
      if (this.aimingSkillId) {
        this.tileCursor.tint = skillMeta(this.aimingSkillId).color;
        this.tileCursor.alpha = 0.85;
      } else {
        this.tileCursor.tint = 0xffffff;
        this.tileCursor.alpha = 0.55;
      }
    } else {
      this.tileCursor.visible = false;
    }

    // iluminação
    if (this.lighting) {
      this.lighting.update(deltaMS, this.camera, screenW, screenH);
      this.lighting.render(this.app.renderer);
    }

    // debug
    if (this.playerState) {
      const fps = Math.round(this.app.ticker.FPS);
      this.hud.setDebug(`${fps} fps · tile ${this.playerState.pos.x},${this.playerState.pos.y}`);
    }
  }

  private onResize(): void {
    const uw = this.app.screen.width / UI_SCALE;
    const uh = this.app.screen.height / UI_SCALE;
    this.dialogueWin.resize(uw, uh);
    this.shopWin.resize(uw, uh);
    this.cookWin.resize(uw, uh);
    this.journal.resize(uw, uh);
    this.equipPanel.resize(uw, uh);
    this.minimap.resize(uw, uh);
    // Tooltip vive no stage (escala 1) → clamp em TELA REAL.
    this.tooltip.resize(this.app.screen.width, this.app.screen.height);
    // Lighting é overlay de TELA REAL (cobre o mundo) — NÃO escala com a UI.
    this.lighting?.resize(this.app.screen.width, this.app.screen.height);
    this.hud.resize(uw, uh);
    this.skillBar.resize(uw, uh);
    this.charPanel.resize(uh);
    this.outfitPanel.resize(uw, uh);
    this.trackingToast.resize(uw, uh);
  }
}
