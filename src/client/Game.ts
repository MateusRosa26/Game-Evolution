import { Container, Sprite, type Application } from "pixi.js";
import { TILE_SIZE } from "../shared/constants";
import type { ClientTransport, EntityState, Snapshot } from "../shared/protocol";
import { OUTFIT_PART_BY_ID, OUTFIT_PARTS } from "../shared/outfits";
import type { MapData } from "../shared/types";
import { createSprites, type SpriteLibrary } from "./assets/sprites";
import { Camera } from "./Camera";
import { EntityRenderer } from "./render/EntityRenderer";
import { Lighting } from "./render/Lighting";
import { WorldRenderer } from "./render/WorldRenderer";
import { Keyboard } from "./input/Keyboard";
import { Mouse } from "./input/Mouse";
import { Hud } from "./ui/Hud";
import { DialogueWindow } from "./ui/DialogueWindow";
import { JournalPanel } from "./ui/JournalPanel";
import { EquipPanel } from "./ui/EquipPanel";
import { ContainerWindow } from "./ui/ContainerWindow";
import { ItemDnD } from "./ui/dnd";
import { ChatWindow } from "./ui/ChatWindow";
import { Minimap } from "./ui/Minimap";
import { Tooltip } from "./ui/Tooltip";
import { CharacterPanel } from "./ui/CharacterPanel";
import { OutfitPanel } from "./ui/OutfitPanel";
import { SkillBar } from "./ui/SkillBar";
import { TrackingToast } from "./ui/TrackingToast";
import { ALL_SKILL_IDS, skillMeta } from "./ui/skillMeta";

/**
 * Topo da COLUNA DIREITA de janelas (estilo Tibia): abaixo do minimapa (~192px)
 * + dock de equipamento (~250px) ancorados no topo-direito. Janelas de container
 * (mochila/cadáver) empilham a partir daqui pra não SOBREPOR o equip.
 */
const RIGHT_COLUMN_TOP = 474;

/** Hotkeys 1–6 → índice de slot da barra de skills. */
const SKILL_HOTKEYS: Record<string, number> = {
  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
};

/**
 * Orquestra o lado do cliente: recebe mensagens do "servidor",
 * renderiza o mundo e envia input. Não contém NENHUMA regra de jogo.
 */
export class Game {
  private sprites: SpriteLibrary;
  private camera = new Camera();
  private hud = new Hud();
  private charPanel = new CharacterPanel((attr) =>
    this.transport.send({ type: "allocateStatPoint", attr }),
  );
  private outfitPanel = new OutfitPanel((outfit) =>
    this.transport.send({ type: "setOutfit", outfit }),
  );
  private skillBar = new SkillBar();
  private trackingToast = new TrackingToast();
  private dnd = new ItemDnD((from, to) => this.transport.send({ type: "moveItem", from, to }));
  private dialogueWin = new DialogueWindow((optionId) =>
    this.transport.send({ type: "dialogueChoice", optionId }),
  );
  private journal = new JournalPanel();
  private tooltip = new Tooltip();
  private equipPanel = new EquipPanel(this.dnd, this.tooltip);
  private minimap = new Minimap();
  /** Janelas de container abertas, por containerId. */
  private containerWins = new Map<number, ContainerWindow>();
  private lastCorpses: Snapshot["corpses"] = [];
  private keyboard!: Keyboard;
  private chat = new ChatWindow((text) => this.transport.send({ type: "say", text }));
  /** NPC que o jogador clicou de longe: anda até ele e conversa ao chegar. */
  private pendingTalkNpcId: number | null = null;

  private worldContainer = new Container();
  /** Camada de UI — SEMPRE acima da iluminação (que é multiply sobre o mundo). */
  private uiLayer = new Container();
  private worldRenderer: WorldRenderer | null = null;
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
  private started = false;
  /** Último level visto no snapshot — para detectar subida (só apresentação). */
  private lastLevel = 0;

  constructor(
    private app: Application,
    private transport: ClientTransport,
  ) {
    this.sprites = createSprites();

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
      // Esc: fecha diálogo se aberto; senão cancela o alvo (estilo Tibia).
      if (ev.code === "Escape") {
        ev.preventDefault();
        if (this.playerState?.dialogue) {
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
      // F9 (DEV): concede as 6 skills ao player p/ testar a barra cheia.
      if (ev.code === "F9") {
        ev.preventDefault();
        for (const id of ALL_SKILL_IDS) {
          this.transport.send({ type: "debugGrantSkill", skillId: id });
        }
      }
      // 0: cicla SETS completos possuídos (atalho rápido; mix fino é na
      // janela de outfit). A sim valida posse — o client só pede.
      if (ev.code === "Digit0") {
        ev.preventDefault();
        this.cycleOutfitSet();
      }
      // F8 (DEV): desbloqueia o catálogo inteiro de peças no guarda-roupa.
      if (ev.code === "F8") {
        ev.preventDefault();
        this.transport.send({ type: "debugGrantOutfit" });
      }
    });
    this.mouse = new Mouse(this.app.canvas, (sx, sy) => {
      // Clique sobre painel de UI NÃO vaza para o mundo (anti click-through):
      // o boneco não anda quando o jogador interage com uma janela.
      if (this.uiBlocksClick(sx, sy)) return;
      const tile = this.camera.screenToTile(sx, sy, this.app.screen.width, this.app.screen.height);
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
      if (monster) {
        this.transport.send({
          type: "selectTarget",
          entityId: monster.id === this.targetId ? null : monster.id,
        });
      } else if (npc) {
        const me = this.playerState;
        const near = me && Math.max(Math.abs(me.pos.x - npc.pos.x), Math.abs(me.pos.y - npc.pos.y)) <= 3;
        if (near) {
          this.transport.send({ type: "talk", npcId: npc.id });
        } else {
          // anda até um tile adjacente e conversa ao chegar (próximo snapshot)
          this.pendingTalkNpcId = npc.id;
          this.transport.send({ type: "walkTo", x: npc.pos.x, y: npc.pos.y });
        }
      } else if (corpse) {
        this.transport.send({ type: "openContainer", containerId: corpse.id });
      } else {
        this.pendingTalkNpcId = null;
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
    if (skillMeta(skillId).target === "self") {
      this.transport.send({ type: "useSkill", skillId });
    } else {
      this.transport.send({ type: "useSkill", skillId, targetId: this.targetId });
    }
  }

  /** True se (sx,sy) está sobre um painel de UI visível (janelas clicáveis). */
  private uiBlocksClick(sx: number, sy: number): boolean {
    const panels = [
      this.charPanel.container,
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
   * Hotkey 0: veste o próximo SET completo possuído (mantendo as cores atuais
   * por slot). Apresentação/atalho — a sim valida posse de cada peça.
   */
  private cycleOutfitSet(): void {
    const me = this.playerState;
    if (!me?.outfit || !me.wardrobe) return;
    const owned = new Set(me.wardrobe);
    // sets dos quais o jogador possui as 3 peças, na ordem do catálogo
    const fullSets: string[] = [];
    for (const part of OUTFIT_PARTS) {
      if (fullSets.includes(part.set)) continue;
      const pieces = OUTFIT_PARTS.filter((q) => q.set === part.set);
      if (pieces.length === 3 && pieces.every((q) => owned.has(q.id))) fullSets.push(part.set);
    }
    if (fullSets.length === 0) return;
    const currentSet = OUTFIT_PART_BY_ID[me.outfit.torso.part]?.set;
    const next = fullSets[(fullSets.indexOf(currentSet ?? "") + 1) % fullSets.length];
    const bySlot = (slot: "head" | "torso" | "legs") =>
      OUTFIT_PARTS.find((q) => q.set === next && q.slot === slot)!.id;
    this.transport.send({
      type: "setOutfit",
      outfit: {
        head: { part: bySlot("head"), color: me.outfit.head.color },
        torso: { part: bySlot("torso"), color: me.outfit.torso.color },
        legs: { part: bySlot("legs"), color: me.outfit.legs.color },
      },
    });
  }

  private buildWorld(map: MapData): void {
    this.worldRenderer = new WorldRenderer(this.sprites, map, this.app.renderer);
    this.worldContainer.addChild(this.worldRenderer.ground);
    this.worldContainer.addChild(this.tileCursor);
    this.worldContainer.addChild(this.worldRenderer.objects);
    this.app.stage.addChild(this.worldContainer);

    this.entityRenderer = new EntityRenderer(this.sprites, this.worldRenderer.objects, this.playerId);

    this.lighting = new Lighting(this.sprites, this.app.screen.width, this.app.screen.height);
    this.lighting.setMapLights(map.lights);
    // [TESTE] this.app.stage.addChild(this.lighting.overlay);
    this.app.stage.addChild(this.uiLayer); // UI acima da luz

    this.uiLayer.addChild(this.hud.container);
    this.hud.resize(this.app.screen.width, this.app.screen.height);

    // Barra de skills (embaixo-centro).
    this.uiLayer.addChild(this.skillBar.container);
    this.skillBar.resize(this.app.screen.width, this.app.screen.height);

    // Painel de personagem por cima da HUD (oculto até apertar C).
    this.uiLayer.addChild(this.charPanel.container);
    this.charPanel.resize(this.app.screen.height);

    // Janela de outfit (oculta até apertar O).
    this.uiLayer.addChild(this.outfitPanel.container);
    this.outfitPanel.resize(this.app.screen.width, this.app.screen.height);

    // Toast da camada emergente (hint/unlock) — por cima de tudo.
    this.uiLayer.addChild(this.trackingToast.container);
    this.uiLayer.addChild(this.journal.container);
    this.uiLayer.addChild(this.minimap.container);
    this.uiLayer.addChild(this.equipPanel.container);
    this.uiLayer.addChild(this.dialogueWin.container);
    this.uiLayer.addChild(this.chat.container);
    this.uiLayer.addChild(this.tooltip.container);
    this.uiLayer.addChild(this.dnd.ghostLayer);
    this.tooltip.resize(this.app.screen.width, this.app.screen.height);
    this.trackingToast.resize(this.app.screen.width, this.app.screen.height);
    this.chat.resize(this.app.screen.width, this.app.screen.height);
    // Painéis novos precisam das dimensões de tela JÁ no startup (sem isso a
    // janela de diálogo nasce em coordenada negativa = invisível).
    this.dialogueWin.resize(this.app.screen.width, this.app.screen.height);
    this.journal.resize(this.app.screen.width, this.app.screen.height);
    this.equipPanel.resize(this.app.screen.width, this.app.screen.height);
    this.equipPanel.setState(this.playerState ?? undefined);
    this.chat.resize(this.app.screen.width, this.app.screen.height);
    this.minimap.setMap(map);
    this.minimap.resize(this.app.screen.width, this.app.screen.height);

    this.camera.setMapSize(map.width, map.height);
    this.camera.snapTo((map.spawn.x + 0.5) * TILE_SIZE, (map.spawn.y + 0.5) * TILE_SIZE);

    if (!this.started) {
      this.started = true;
      this.app.ticker.add((ticker) => this.frame(ticker.deltaMS));
    }
  }

  private onSnapshot(snap: Snapshot): void {
    this.entityRenderer?.apply(snap);
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
    this.lastEntities = snap.entities;
    this.playerState = snap.entities.find((e) => e.id === this.playerId) ?? null;
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
        if (p) this.camera.snapTo(p.x, p.y);
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
      this.journal.setState(this.playerState.quests);
      this.equipPanel.setState(this.playerState);
      this.minimap.update(this.playerState.pos.x, this.playerState.pos.y);
      this.syncContainerWindows(this.playerState.containers ?? []);
    }
    this.lastCorpses = snap.corpses;
    this.entityRenderer?.setCorpses(snap.corpses);
  }

  /** Sincroniza janelas de container com as views do snapshot (abre/fecha/atualiza). */
  private syncContainerWindows(views: NonNullable<EntityState["containers"]>): void {
    const seen = new Set<number>();
    // Empilha na COLUNA DIREITA abaixo do dock (minimapa + equip), sem sobrepor —
    // organização estilo Tibia. O usuário ainda pode arrastar cada janela depois.
    const rightX = this.app.screen.width - ContainerWindow.WIDTH - 12;
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
    this.camera.apply(this.worldContainer, screenW, screenH);

    // cursor de tile sob o mouse
    if (this.mouse.insideCanvas) {
      const t = this.camera.screenToTile(this.mouse.screenX, this.mouse.screenY, screenW, screenH);
      this.tileCursor.visible = true;
      this.tileCursor.position.set(t.x * TILE_SIZE, t.y * TILE_SIZE);
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
    this.dialogueWin.resize(this.app.screen.width, this.app.screen.height);
    this.journal.resize(this.app.screen.width, this.app.screen.height);
    this.equipPanel.resize(this.app.screen.width, this.app.screen.height);
    this.minimap.resize(this.app.screen.width, this.app.screen.height);
    this.tooltip.resize(this.app.screen.width, this.app.screen.height);
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.lighting?.resize(w, h);
    this.hud.resize(w, h);
    this.skillBar.resize(w, h);
    this.charPanel.resize(h);
    this.outfitPanel.resize(w, h);
    this.trackingToast.resize(w, h);
  }
}
