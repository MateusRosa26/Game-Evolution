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

/**
 * Orquestra o lado do cliente: recebe mensagens do "servidor",
 * renderiza o mundo e envia input. Não contém NENHUMA regra de jogo.
 */
export class Game {
  private sprites: SpriteLibrary;
  private camera = new Camera();
  private hud = new Hud();

  private worldContainer = new Container();
  private worldRenderer: WorldRenderer | null = null;
  private entityRenderer: EntityRenderer | null = null;
  private lighting: Lighting | null = null;
  private tileCursor: Sprite;
  private mouse: Mouse;

  private playerId = -1;
  private playerState: EntityState | null = null;
  private started = false;

  constructor(
    private app: Application,
    private transport: ClientTransport,
  ) {
    this.sprites = createSprites();

    this.tileCursor = new Sprite(this.sprites.tileCursor);
    this.tileCursor.alpha = 0.55;

    // input
    new Keyboard((dir) => this.transport.send({ type: "setDir", dir }));
    this.mouse = new Mouse(this.app.canvas, (sx, sy) => {
      const tile = this.camera.screenToTile(sx, sy, this.app.screen.width, this.app.screen.height);
      this.transport.send({ type: "walkTo", x: tile.x, y: tile.y });
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

    this.camera.setMapSize(map.width, map.height);
    this.camera.snapTo((map.spawn.x + 0.5) * TILE_SIZE, (map.spawn.y + 0.5) * TILE_SIZE);

    if (!this.started) {
      this.started = true;
      this.app.ticker.add((ticker) => this.frame(ticker.deltaMS));
    }
  }

  private onSnapshot(snap: Snapshot): void {
    this.entityRenderer?.apply(snap);
    this.playerState = snap.entities.find((e) => e.id === this.playerId) ?? null;
    if (this.playerState) {
      this.hud.setStats(this.playerState.hp, this.playerState.maxHp, this.playerState.mp, this.playerState.maxMp);
    }
  }

  private frame(deltaMS: number): void {
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;

    this.worldRenderer?.tick(deltaMS);
    this.entityRenderer?.tick(deltaMS);

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
  }
}
