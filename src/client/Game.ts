import { Container, Sprite, type Application } from "pixi.js";
import { TILE_SIZE } from "../shared/constants";
import type { ClientTransport, EntityState, Snapshot } from "../shared/protocol";
import type { MapData } from "../shared/types";
import { createSprites, type SpriteLibrary } from "./assets/sprites";
import { Camera } from "./Camera";
import { EntityRenderer } from "./render/EntityRenderer";
import { Lighting } from "./render/Lighting";
import { WorldRenderer } from "./render/WorldRenderer";
import { Keyboard } from "./input/Keyboard";
import { Mouse } from "./input/Mouse";
import { Hud } from "./ui/Hud";
import { CharacterPanel } from "./ui/CharacterPanel";
import { SkillBar } from "./ui/SkillBar";
import { TrackingToast } from "./ui/TrackingToast";
import { ALL_SKILL_IDS, skillMeta } from "./ui/skillMeta";

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
  private skillBar = new SkillBar();
  private trackingToast = new TrackingToast();

  private worldContainer = new Container();
  private worldRenderer: WorldRenderer | null = null;
  private entityRenderer: EntityRenderer | null = null;
  private lighting: Lighting | null = null;
  private tileCursor: Sprite;
  private mouse: Mouse;

  private playerId = -1;
  private playerState: EntityState | null = null;
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
    new Keyboard((dir) => this.transport.send({ type: "setDir", dir }));
    // Teclas de UI/skills (apresentação pura — só envia comandos).
    window.addEventListener("keydown", (ev) => {
      if (ev.repeat) return;
      // C: abre/fecha o painel de personagem.
      if (ev.code === "KeyC") {
        ev.preventDefault();
        this.charPanel.toggle();
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
    });
    this.mouse = new Mouse(this.app.canvas, (sx, sy) => {
      const tile = this.camera.screenToTile(sx, sy, this.app.screen.width, this.app.screen.height);
      // Click num monstro = seleciona alvo (auto-attack); senão, anda até lá.
      const monster = this.lastEntities.find(
        (e) => e.kind === "monster" && e.pos.x === tile.x && e.pos.y === tile.y,
      );
      if (monster) {
        this.transport.send({ type: "selectTarget", entityId: monster.id });
      } else {
        this.transport.send({ type: "selectTarget", entityId: null });
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

  private buildWorld(map: MapData): void {
    this.worldRenderer = new WorldRenderer(this.sprites, map, this.app.renderer);
    this.worldContainer.addChild(this.worldRenderer.ground);
    this.worldContainer.addChild(this.tileCursor);
    this.worldContainer.addChild(this.worldRenderer.objects);
    this.app.stage.addChild(this.worldContainer);

    this.entityRenderer = new EntityRenderer(this.sprites, this.worldRenderer.objects, this.playerId);

    this.lighting = new Lighting(this.sprites, this.app.screen.width, this.app.screen.height);
    this.lighting.setMapLights(map.lights);
    this.app.stage.addChild(this.lighting.overlay);

    this.app.stage.addChild(this.hud.container);
    this.hud.resize(this.app.screen.width, this.app.screen.height);

    // Barra de skills (embaixo-centro).
    this.app.stage.addChild(this.skillBar.container);
    this.skillBar.resize(this.app.screen.width, this.app.screen.height);

    // Painel de personagem por cima da HUD (oculto até apertar C).
    this.app.stage.addChild(this.charPanel.container);
    this.charPanel.resize(this.app.screen.height);

    // Toast da camada emergente (hint/unlock) — por cima de tudo.
    this.app.stage.addChild(this.trackingToast.container);
    this.trackingToast.resize(this.app.screen.width, this.app.screen.height);

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
      }
    }
    this.lastEntities = snap.entities;
    this.targetId = snap.targetId;
    this.playerState = snap.entities.find((e) => e.id === this.playerId) ?? null;
    if (this.playerState) {
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
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.lighting?.resize(w, h);
    this.hud.resize(w, h);
    this.skillBar.resize(w, h);
    this.charPanel.resize(h);
    this.trackingToast.resize(w, h);
  }
}
