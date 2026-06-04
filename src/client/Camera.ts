import type { Container } from "pixi.js";
import { CAMERA_ZOOM, TILE_SIZE } from "../shared/constants";

/** Câmera com seguimento suave e limites do mapa. */
export class Camera {
  /** Centro da câmera em pixels de mundo. */
  x = 0;
  y = 0;

  private mapW = 0;
  private mapH = 0;

  setMapSize(widthTiles: number, heightTiles: number): void {
    this.mapW = widthTiles * TILE_SIZE;
    this.mapH = heightTiles * TILE_SIZE;
  }

  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  follow(targetX: number, targetY: number, deltaMS: number, screenW: number, screenH: number): void {
    // lerp exponencial (independente de framerate)
    const k = 1 - Math.exp(-deltaMS * 0.008);
    this.x += (targetX - this.x) * k;
    this.y += (targetY - this.y) * k;

    // clamp aos limites do mapa (se o mapa for maior que a tela)
    const halfW = screenW / 2 / CAMERA_ZOOM;
    const halfH = screenH / 2 / CAMERA_ZOOM;
    if (this.mapW > halfW * 2) this.x = Math.max(halfW, Math.min(this.mapW - halfW, this.x));
    else this.x = this.mapW / 2;
    if (this.mapH > halfH * 2) this.y = Math.max(halfH, Math.min(this.mapH - halfH, this.y));
    else this.y = this.mapH / 2;
  }

  /** Aplica a transformação ao container do mundo. */
  apply(world: Container, screenW: number, screenH: number): void {
    world.scale.set(CAMERA_ZOOM);
    world.position.set(
      Math.round(screenW / 2 - this.x * CAMERA_ZOOM),
      Math.round(screenH / 2 - this.y * CAMERA_ZOOM),
    );
  }

  /** Converte posição de tela → tile do mundo. */
  screenToTile(sx: number, sy: number, screenW: number, screenH: number): { x: number; y: number } {
    const wx = (sx - screenW / 2) / CAMERA_ZOOM + this.x;
    const wy = (sy - screenH / 2) / CAMERA_ZOOM + this.y;
    return { x: Math.floor(wx / TILE_SIZE), y: Math.floor(wy / TILE_SIZE) };
  }
}
