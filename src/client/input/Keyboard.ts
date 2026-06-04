import type { Dir8 } from "../../shared/types";

const KEY_DIRS: Record<string, "up" | "down" | "left" | "right"> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
};

/**
 * WASD/setas → direção de 8 vias mantida. Emite somente quando a direção
 * efetiva muda (a simulação continua andando sozinha enquanto mantida).
 */
export class Keyboard {
  private pressed = new Set<string>();
  private lastDir: Dir8 | null = null;

  constructor(private onDirChange: (dir: Dir8 | null) => void) {
    window.addEventListener("keydown", (ev) => {
      if (!KEY_DIRS[ev.code]) return;
      ev.preventDefault();
      if (ev.repeat) return;
      this.pressed.add(ev.code);
      this.emit();
    });
    window.addEventListener("keyup", (ev) => {
      if (!KEY_DIRS[ev.code]) return;
      this.pressed.delete(ev.code);
      this.emit();
    });
    window.addEventListener("blur", () => {
      this.pressed.clear();
      this.emit();
    });
  }

  private emit(): void {
    const dir = this.currentDir();
    if (dir !== this.lastDir) {
      this.lastDir = dir;
      this.onDirChange(dir);
    }
  }

  private currentDir(): Dir8 | null {
    let dx = 0;
    let dy = 0;
    for (const code of this.pressed) {
      switch (KEY_DIRS[code]) {
        case "up":
          dy = -1;
          break;
        case "down":
          dy = 1;
          break;
        case "left":
          dx = -1;
          break;
        case "right":
          dx = 1;
          break;
      }
    }
    if (dx === 0 && dy === 0) return null;
    const vert = dy < 0 ? "n" : dy > 0 ? "s" : "";
    const horiz = dx < 0 ? "w" : dx > 0 ? "e" : "";
    return (vert + horiz) as Dir8;
  }
}
