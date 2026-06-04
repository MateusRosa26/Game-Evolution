/** Click-to-move + posição do cursor (para o highlight de tile). */
export class Mouse {
  /** Última posição do ponteiro em coordenadas de tela. */
  screenX = 0;
  screenY = 0;
  insideCanvas = false;

  constructor(
    canvas: HTMLCanvasElement,
    private onClickScreen: (sx: number, sy: number) => void,
  ) {
    canvas.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      this.onClickScreen(ev.clientX, ev.clientY);
    });
    canvas.addEventListener("pointermove", (ev) => {
      this.screenX = ev.clientX;
      this.screenY = ev.clientY;
      this.insideCanvas = true;
    });
    canvas.addEventListener("pointerleave", () => {
      this.insideCanvas = false;
    });
    canvas.addEventListener("contextmenu", (ev) => ev.preventDefault());
  }
}
