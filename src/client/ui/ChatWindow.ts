/**
 * CHAT — estrutura Tibia (canto inferior esquerdo, abas + input), estética
 * Apogea (caixa escura translúcida, cantos suaves, zero ornamento).
 *
 * Canais (MVP): Local (fala — vira balão no mundo), Sistema (loot/XP/level/
 * quest), NPCs (falas dos NPCs). Apresentação pura: digitar + Enter envia
 * `say`; as linhas chegam como eventos `chat` no snapshot (online-ready).
 *
 * Foco do input: Enter abre/foca; Esc desfoca. Enquanto focado, as teclas de
 * jogo (WASD/hotkeys) ficam suspensas — o Game checa `inputFocused`.
 *
 * TAMANHO & VISIBILIDADE (jun/2026): o chat REDIMENSIONA com a roda do mouse
 * sobre ele (tamanho atual = mínimo, cresce até ~1.9×). E fica TRANSLÚCIDO quando
 * ocioso, ficando opaco ao digitar (Enter) ou ao passar/segurar o mouse nele —
 * pra não tampar o mundo quando não está em uso.
 */
import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Rectangle, Text } from "pixi.js";
import type { ChatChannel } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";
import { makeDraggable } from "./draggable";

const BASE_W = 400; // "um pouco maior" que o antigo 360 (pedido jun/2026)
const BASE_H = 180; // antigo 150
const PAD = 8;
const TAB_H = 18;
const INPUT_H = 20;
const MAX_LINES = 60;
const MIN_SCALE = 1.0; // tamanho base = mínimo
const MAX_SCALE = 1.9;
const SCALE_STEP = 0.12; // por "tique" de roda
const ALPHA_ACTIVE = 0.96; // digitando ou mouse em cima
const ALPHA_IDLE = 0.4; // ocioso → translúcido (não tampa o mundo)

const CHANNELS: { id: ChatChannel | "all"; label: string }[] = [
  { id: "all", label: "Tudo" },
  { id: "local", label: "Local" },
  { id: "system", label: "Sistema" },
  { id: "npc", label: "NPCs" },
];

const CHANNEL_COLOR: Record<ChatChannel, number> = {
  local: 0xf4f0e6, // branco quente (fala)
  system: 0x8fb3d9, // azul suave (sistema)
  npc: 0xc8a84b, // dourado (NPC)
};

interface ChatLine {
  channel: ChatChannel;
  text: string;
}

export class ChatWindow {
  readonly container = new Container();
  private bg = new Graphics();
  private tabLayer = new Container();
  private logLayer = new Container();
  private logMask = new Graphics();
  private inputBg = new Graphics();
  private inputText: Text;
  private caret = new Graphics();
  private lines: ChatLine[] = [];
  private active: ChatChannel | "all" = "all";
  private screenH = 0;
  /** Posição escolhida ao arrastar pela faixa das abas (override do default). */
  private userPos: { x: number; y: number } | null = null;
  /** X onde as abas terminam — à direita disso a faixa arrasta a janela. */
  private tabsRight = 0;

  /** Texto sendo digitado; null = input não focado (jogo recebe teclas). */
  private composing: string | null = null;

  /** Tamanho: fator sobre BASE (roda do mouse ajusta). */
  private sizeScale = 1.0;
  private w = BASE_W;
  private h = BASE_H;
  /** Mouse sobre o chat (mantém opaco mesmo sem digitar). */
  private hovering = false;

  constructor(private onSay: (text: string) => void) {
    this.container.addChild(this.bg, this.tabLayer);
    this.logLayer.mask = this.logMask;
    this.container.addChild(this.logLayer, this.logMask, this.inputBg);

    this.inputText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fill: 0xe8e4d8,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.inputText.resolution = 3;
    this.container.addChild(this.inputText, this.caret);

    // Arrastável pela faixa de título: SÓ na área vazia à direita das abas
    // (senão um micro-arrasto "engolia" o clique de troca de canal).
    makeDraggable(
      this.container,
      TAB_H + 2,
      (x, y) => {
        this.userPos = { x, y };
      },
      (local) => local.x > this.tabsRight,
    );

    // Hover (opacidade) + roda (redimensiona). O container é o hit-target da área
    // toda via hitArea — atualizada a cada `recomputeSize`.
    this.container.hitArea = new Rectangle(0, 0, this.w, this.h);
    this.container.on("pointerenter", () => { this.hovering = true; this.updateAlpha(); });
    this.container.on("pointerleave", () => { this.hovering = false; this.updateAlpha(); });
    this.container.on("wheel", (e: FederatedWheelEvent) => {
      e.preventDefault?.();
      const dir = e.deltaY < 0 ? 1 : -1;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, this.sizeScale + dir * SCALE_STEP));
      if (next !== this.sizeScale) {
        this.sizeScale = next;
        this.recomputeSize();
        this.layout();
      }
    });

    window.addEventListener("keydown", (ev) => this.onKey(ev), true);
    this.updateAlpha();
  }

  get inputFocused(): boolean {
    return this.composing !== null;
  }

  /** Recebe uma linha do snapshot (evento chat). */
  push(channel: ChatChannel, text: string): void {
    this.lines.push({ channel, text });
    if (this.lines.length > MAX_LINES) this.lines.shift();
    this.renderLog();
  }

  resize(screenW: number, screenH: number): void {
    void screenW;
    this.screenH = screenH;
    this.layout();
  }

  private recomputeSize(): void {
    this.w = Math.round(BASE_W * this.sizeScale);
    this.h = Math.round(BASE_H * this.sizeScale);
    this.container.hitArea = new Rectangle(0, 0, this.w, this.h);
  }

  private updateAlpha(): void {
    this.container.alpha = this.composing !== null || this.hovering ? ALPHA_ACTIVE : ALPHA_IDLE;
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.composing === null) {
      // Enter abre o input (foca). Não captura mais nada.
      if (ev.code === "Enter" || ev.code === "NumpadEnter") {
        ev.preventDefault();
        ev.stopPropagation();
        this.composing = "";
        this.renderInput();
      }
      return;
    }
    // input FOCADO — captura tudo, suspende o jogo
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.code === "Enter" || ev.code === "NumpadEnter") {
      const text = this.composing.trim();
      if (text) this.onSay(text);
      this.composing = null;
      this.renderInput();
    } else if (ev.code === "Escape") {
      this.composing = null;
      this.renderInput();
    } else if (ev.code === "Backspace") {
      this.composing = this.composing.slice(0, -1);
      this.renderInput();
    } else if (ev.key.length === 1 && this.composing.length < 120) {
      this.composing += ev.key;
      this.renderInput();
    }
  }

  private setActive(ch: ChatChannel | "all"): void {
    this.active = ch;
    this.renderTabs();
    this.renderLog();
  }

  private layout(): void {
    // default: empilhado ACIMA do HUD (HUD ocupa ~114px no rodapé esquerdo)
    const pos = this.userPos ?? { x: 12, y: this.screenH - this.h - 122 };
    this.container.position.set(pos.x, pos.y);

    this.bg.clear();
    this.bg.roundRect(0, 0, this.w, this.h, 6).fill({ color: hex(PAL.panelBg), alpha: 0.82 });
    this.bg.roundRect(0, 0, this.w, this.h, 6).stroke({ color: hex(PAL.panelBorder), width: 1.5 });

    // máscara do log (entre as abas e o input)
    const logTop = TAB_H + 4;
    const logBottom = this.h - INPUT_H - 6;
    this.logMask.clear();
    this.logMask.rect(PAD, logTop, this.w - PAD * 2, logBottom - logTop).fill(0xffffff);

    // input
    this.inputBg.clear();
    this.inputBg.roundRect(PAD, this.h - INPUT_H - 4, this.w - PAD * 2, INPUT_H, 4).fill({ color: 0x0c0e14, alpha: 0.9 });
    this.inputBg.roundRect(PAD, this.h - INPUT_H - 4, this.w - PAD * 2, INPUT_H, 4).stroke({ color: 0x2a3140, width: 1 });
    this.inputText.position.set(PAD + 6, this.h - INPUT_H - 4 + 5);

    this.renderTabs();
    this.renderLog();
    this.renderInput();
  }

  private renderTabs(): void {
    this.tabLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    let tx = PAD;
    for (const ch of CHANNELS) {
      const sel = ch.id === this.active;
      const t = new Text({
        text: ch.label,
        style: {
          fontFamily: "monospace",
          fontSize: 8,
          fontWeight: sel ? "bold" : "normal",
          fill: sel ? hex(PAL.levelGold) : hex(PAL.attrLabel),
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      t.resolution = 3;
      t.position.set(tx + 6, 4);
      t.eventMode = "none"; // o texto não pode roubar o clique do bg da aba
      const bg = new Graphics();
      const tw = t.width + 12;
      bg.roundRect(tx, 2, tw, TAB_H - 2, 3).fill({ color: sel ? hex(PAL.panelHeader) : 0x000000, alpha: sel ? 1 : 0.001 });
      if (sel) bg.roundRect(tx, 2, tw, TAB_H - 2, 3).stroke({ color: hex(PAL.panelBorder), width: 1 });
      bg.eventMode = "static";
      bg.cursor = "pointer";
      bg.on("pointertap", () => this.setActive(ch.id));
      this.tabLayer.addChild(bg, t);
      tx += tw + 4;
    }
    this.tabsRight = tx; // a partir daqui a faixa arrasta a janela
  }

  private renderLog(): void {
    this.logLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const shown = this.lines.filter((l) => this.active === "all" || l.channel === this.active);
    const logBottom = this.h - INPUT_H - 6;
    let y = logBottom; // empilha de baixo pra cima (mais recente embaixo)
    for (let i = shown.length - 1; i >= 0; i--) {
      const l = shown[i];
      const t = new Text({
        text: l.text,
        style: {
          fontFamily: "monospace",
          fontSize: 9,
          fill: CHANNEL_COLOR[l.channel],
          stroke: { color: 0x10141c, width: 2 },
          wordWrap: true,
          wordWrapWidth: this.w - PAD * 2,
          lineHeight: 12,
        },
      });
      t.resolution = 3;
      y -= t.height + 2;
      t.position.set(PAD, y);
      this.logLayer.addChild(t);
      if (y < TAB_H) break; // fora da janela
    }
  }

  private renderInput(): void {
    if (this.composing === null) {
      this.inputText.text = "";
      this.inputText.style.fill = hex(PAL.attrLabel);
      this.inputText.text = "Enter para falar…";
      this.caret.visible = false;
    } else {
      this.inputText.style.fill = 0xe8e4d8;
      this.inputText.text = this.composing;
      this.caret.clear();
      this.caret.visible = true;
      this.caret
        .rect(PAD + 6 + this.inputText.width + 1, this.h - INPUT_H - 4 + 4, 1.5, INPUT_H - 8)
        .fill(0xe8e4d8);
    }
    this.updateAlpha(); // foco do input liga/desliga a opacidade
  }

  /** Clique sobre o chat não vaza pro mundo. */
  hitTest(sx: number, sy: number): boolean {
    return this.container.getBounds().rectangle.contains(sx, sy);
  }

  // clique nas abas usa eventMode dos próprios bg — nada aqui
  bindStageClick(_: (ev: FederatedPointerEvent) => void): void {}
}
