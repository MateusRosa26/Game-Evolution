/**
 * Drag de painel DOM pela alça (handle) — equivalente ao makeDraggable do Pixi,
 * mas usando pointer events nativos do browser (sem conversão de coords, sem
 * scale: o DOM já vive em pixels de tela). Posiciona via left/top absolutos.
 */
export function makeDomDraggable(el: HTMLElement, handle: HTMLElement): void {
  let dragging = false;
  let ox = 0;
  let oy = 0;
  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    ox = e.clientX - el.offsetLeft;
    oy = e.clientY - el.offsetTop;
    handle.setPointerCapture(e.pointerId);
    handle.style.cursor = "grabbing";
  });
  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    el.style.left = `${Math.round(e.clientX - ox)}px`;
    el.style.top = `${Math.round(e.clientY - oy)}px`;
    el.style.right = "auto"; // se nasceu ancorado à direita, solta a âncora
  });
  const end = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    handle.style.cursor = "grab";
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      /* pointer já solto */
    }
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}
