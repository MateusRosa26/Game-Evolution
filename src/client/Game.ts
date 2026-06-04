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

  private worldContainer = new Container();
  private worldRenderer: WorldRenderer | null = null;
  private entityRenderer: EntityRenderer | null = null;
  private lighting: Lighting | null = null;
  private tileCursor: Sprite;
  private mouse: Mouse;

  private playerId = -1;
  private playerState: EntityState | null = null;
  private lastEntities: EntityState[] = [];
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
    // Tecla C: abre/fecha o painel de personagem (apresentação pura).
    window.addEventListener("keydown", (ev) => {
      if (ev.code === "KeyC" && !ev.repeat) {
        ev.preventDefault();
        this.charPanel.toggle();
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

    // Painel de personagem por cima da HUD (oculto até apertar C).
    this.app.stage.addChild(this.charPanel.container);
    this.charPanel.resize(this.app.screen.height);

    this.camera.setMapSize(map.width, map.height);
    this.camera.snapTo((map.spawn.x + 0.5) * TILE_SIZE, (map.spawn.y + 0.5) * TILE_SIZE);

    if (!this.started) {
      this.started = true;
      this.app.ticker.add((ticker) => this.frame(ticker.deltaMS));
    }
  }

  private onSnapshot(snap: Snapshot): void {
    this.entityRenderer?.apply(snap);
    this.lastEntities = snap.entities;
    this.playerState = snap.entities.find((e) => e.id === this.playerId) ?? null;
    if (this.playerState) {
      this.hud.setStats(this.playerState.hp, this.playerState.maxHp, this.playerState.mp, this.playerState.maxMp);
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
    this.charPanel.resize(h);
  }
}
