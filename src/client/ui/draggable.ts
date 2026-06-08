import type { Container, FederatedPointerEvent } from "pixi.js";

/**
 * Torna um painel arrastável pela FAIXA DE TÍTULO (estilo Ragnarok Online —
 * DESIGN-VISUAL.md §Janelas). O painel chama `onMoved` com a posição escolhida
 * pelo usuário; o layout() do painel deve respeitá-la (userPos) em vez de
 * recalcular a posição default a cada snapshot.
 */
export function makeDraggable(
  container: Container,
  headerH: number,
  onMoved: (x: number, y: number) => void,
  /** Opcional: além de estar no header, o ponto local precisa passar nisto
   *  (ex.: chat arrasta só na área vazia à direita das abas). */
  canStart?: (local: { x: number; y: number }) => boolean,
): void {
  let dragging = false;
  let offX = 0;
  let offY = 0;

  container.eventMode = "static";
  container.on("pointerdown", (e: FederatedPointerEvent) => {
    const local = container.toLocal(e.global);
    if (local.y > headerH) return; // só a barra de título arrasta
    if (canStart && !canStart(local)) return; // ex.: não arrastar sobre as abas
    dragging = true;
    offX = e.global.x - container.position.x;
    offY = e.global.y - container.position.y;
  });
  container.on("globalpointermove", (e: FederatedPointerEvent) => {
    if (!dragging) return;
    const x = e.global.x - offX;
    const y = e.global.y - offY;
    container.position.set(x, y);
    onMoved(x, y);
  });
  const end = (): void => {
    dragging = false;
  };
  container.on("pointerup", end);
  container.on("pointerupoutside", end);
}
