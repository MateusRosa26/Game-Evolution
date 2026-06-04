import { Container, Graphics, Text } from "pixi.js";
import { PAL, hex } from "../assets/palette";

/**
 * Apresentação da camada EMERGENTE (DESIGN-EVOLUCAO.md §"Visibilidade — oculto
 * que se revela"). Reage aos eventos one-shot `trackingHint` e `trackingUnlock`
 * do snapshot — NADA além disso. ZERO regra de jogo: só recebe texto/nome/flavor
 * já decididos pela sim e os encena.
 *
 * Dois tons distintos, deliberados:
 *  - HINT: um sussurro. Texto pequeno em serifa/itálico, parte inferior central,
 *    fade lento, sem caixa. "sua espada vibra quando há mortos-vivos por perto".
 *  - UNLOCK: o MOMENTO screenshotável. Faixa escura translúcida atravessando a
 *    tela, nome em dourado grande, flavor em itálico, categoria em caps espaçadas,
 *    entrada com fade + leve scale/glow, brilho via Graphics, saída após ~5s.
 *
 * FILA: hints e unlocks nunca se sobrepõem — um por vez, em ordem de chegada.
 */

type TrackingCategory = "mark" | "mutation" | "path";

type QueueItem =
  | { kind: "hint"; text: string }
  | { kind: "unlock"; category: TrackingCategory; name: string; flavorText: string };

/** Rótulo pt-BR da categoria, em caps espaçadas (discreto, acima do nome). */
const CATEGORY_LABEL: Record<TrackingCategory, string> = {
  mark: "M A R C A",
  mutation: "M U T A Ç Ã O",
  path: "C A M I N H O",
};

// ── Durações (ms) ──
const HINT_FADE_IN = 1100;
const HINT_HOLD = 3600;
const HINT_FADE_OUT = 1400;
const HINT_TOTAL = HINT_FADE_IN + HINT_HOLD + HINT_FADE_OUT;

const UNLOCK_FADE_IN = 900;
const UNLOCK_HOLD = 5000;
const UNLOCK_FADE_OUT = 1200;
const UNLOCK_TOTAL = UNLOCK_FADE_IN + UNLOCK_HOLD + UNLOCK_FADE_OUT;

/** Pausa entre itens consecutivos da fila, para o "respiro". */
const GAP_MS = 400;

const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

export class TrackingToast {
  readonly container = new Container();

  // ── Camada do hint (sussurro, inferior-central) ──
  private hintLayer = new Container();
  private hintText: Text;

  // ── Camada do unlock (banner central épico) ──
  private unlockLayer = new Container();
  private banner = new Graphics();
  private glow = new Graphics();
  private catText: Text;
  private nameText: Text;
  private flavorText: Text;
  private sparkles = new Graphics();

  private queue: QueueItem[] = [];
  private active: QueueItem | null = null;
  private elapsed = 0;
  private gapClock = 0;
  private screenW = 0;
  private screenH = 0;

  constructor() {
    // O overlay não intercepta cliques (apresentação pura).
    this.container.eventMode = "none";

    // ── Hint: serifa em itálico, suave, sem caixa ──
    this.hintText = new Text({
      text: "",
      style: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontStyle: "italic",
        fontSize: 15,
        fill: hex(PAL.attrLabel),
        align: "center",
        stroke: { color: hex(PAL.outline), width: 3 },
        dropShadow: { color: 0x000000, alpha: 0.5, blur: 4, distance: 0, angle: 0 },
      },
    });
    this.hintText.resolution = 3;
    this.hintText.anchor.set(0.5, 0.5);
    this.hintLayer.addChild(this.hintText);
    this.hintLayer.alpha = 0;
    this.container.addChild(this.hintLayer);

    // ── Unlock: faixa + glow + texto ──
    this.unlockLayer.addChild(this.glow);
    this.unlockLayer.addChild(this.banner);
    this.unlockLayer.addChild(this.sparkles);

    this.catText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: hex(PAL.attrLabel),
        letterSpacing: 2,
        align: "center",
        stroke: { color: hex(PAL.outline), width: 3 },
      },
    });
    this.catText.resolution = 3;
    this.catText.anchor.set(0.5, 0.5);
    this.unlockLayer.addChild(this.catText);

    this.nameText = new Text({
      text: "",
      style: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 38,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        align: "center",
        stroke: { color: hex(PAL.outline), width: 5 },
        dropShadow: { color: 0x8a6a1a, alpha: 0.7, blur: 8, distance: 0, angle: 0 },
      },
    });
    this.nameText.resolution = 4;
    this.nameText.anchor.set(0.5, 0.5);
    this.unlockLayer.addChild(this.nameText);

    this.flavorText = new Text({
      text: "",
      style: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontStyle: "italic",
        fontSize: 15,
        fill: hex(PAL.attrValue),
        align: "center",
        wordWrap: true,
        wordWrapWidth: 520,
        stroke: { color: hex(PAL.outline), width: 3 },
      },
    });
    this.flavorText.resolution = 3;
    this.flavorText.anchor.set(0.5, 0.5);
    this.unlockLayer.addChild(this.flavorText);

    this.unlockLayer.alpha = 0;
    this.unlockLayer.visible = false;
    this.container.addChild(this.unlockLayer);
  }

  /** Sussurro atmosférico aos ~50% do progresso (sem categoria/contador). */
  enqueueHint(text: string): void {
    this.queue.push({ kind: "hint", text });
  }

  /** O momento: desbloqueio de Marca/Mutação/Caminho. */
  enqueueUnlock(category: TrackingCategory, name: string, flavorText: string): void {
    this.queue.push({ kind: "unlock", category, name, flavorText });
  }

  resize(screenW: number, screenH: number): void {
    this.screenW = screenW;
    this.screenH = screenH;
    this.layout();
  }

  tick(deltaMS: number): void {
    if (!this.active) {
      // Respiro entre itens, depois puxa o próximo da fila.
      if (this.queue.length === 0) return;
      this.gapClock += deltaMS;
      if (this.gapClock < GAP_MS) return;
      this.gapClock = 0;
      this.start(this.queue.shift()!);
      return;
    }

    this.elapsed += deltaMS;
    if (this.active.kind === "hint") {
      this.updateHint();
    } else {
      this.updateUnlock();
    }
  }

  // ── Início de um item ──

  private start(item: QueueItem): void {
    this.active = item;
    this.elapsed = 0;
    if (item.kind === "hint") {
      this.hintText.text = item.text;
      this.hintLayer.visible = true;
      this.hintLayer.alpha = 0;
    } else {
      this.catText.text = CATEGORY_LABEL[item.category];
      this.nameText.text = item.name;
      this.flavorText.text = item.flavorText;
      this.unlockLayer.visible = true;
      this.unlockLayer.alpha = 0;
      this.drawBanner();
      this.layout();
    }
  }

  private finish(): void {
    if (this.active?.kind === "hint") {
      this.hintLayer.visible = false;
    } else {
      this.unlockLayer.visible = false;
    }
    this.active = null;
    this.elapsed = 0;
  }

  // ── Hint: fade-in lento → hold → fade-out ──

  private updateHint(): void {
    const e = this.elapsed;
    let alpha: number;
    let rise: number; // sobe levemente enquanto aparece
    if (e < HINT_FADE_IN) {
      const t = easeOut(e / HINT_FADE_IN);
      alpha = t;
      rise = (1 - t) * 8;
    } else if (e < HINT_FADE_IN + HINT_HOLD) {
      alpha = 1;
      rise = 0;
    } else if (e < HINT_TOTAL) {
      alpha = 1 - (e - HINT_FADE_IN - HINT_HOLD) / HINT_FADE_OUT;
      rise = 0;
    } else {
      this.finish();
      return;
    }
    this.hintLayer.alpha = alpha;
    this.hintText.y = this.hintBaseY() + rise;
  }

  // ── Unlock: fade + scale/glow → hold → fade-out ──

  private updateUnlock(): void {
    const e = this.elapsed;
    let alpha: number;
    let scale: number;
    if (e < UNLOCK_FADE_IN) {
      const t = easeOut(e / UNLOCK_FADE_IN);
      alpha = t;
      scale = 0.9 + 0.1 * t; // leve scale na entrada
    } else if (e < UNLOCK_FADE_IN + UNLOCK_HOLD) {
      alpha = 1;
      scale = 1;
    } else if (e < UNLOCK_TOTAL) {
      alpha = 1 - (e - UNLOCK_FADE_IN - UNLOCK_HOLD) / UNLOCK_FADE_OUT;
      scale = 1;
    } else {
      this.finish();
      return;
    }
    this.unlockLayer.alpha = alpha;
    this.unlockLayer.scale.set(scale);
    // Reposiciona o pivô central enquanto escala (mantém centralizado).
    this.unlockLayer.position.set(
      this.screenW / 2 - (this.screenW / 2) * scale,
      this.bannerCenterY() - this.bannerCenterY() * scale,
    );

    // Brilho dourado pulsante + faíscas (charme via Graphics).
    const pulse = 0.5 + 0.5 * Math.sin(e / 320);
    this.glow.alpha = 0.25 + 0.25 * pulse;
    this.drawSparkles(e);
  }

  // ── Geometria / desenho ──

  private hintBaseY(): number {
    return this.screenH - 120;
  }

  private bannerCenterY(): number {
    return this.screenH * 0.42;
  }

  private layout(): void {
    this.hintText.position.set(this.screenW / 2, this.hintBaseY());

    const cy = this.bannerCenterY();
    this.glow.position.set(this.screenW / 2, cy);
    this.catText.position.set(this.screenW / 2, cy - 42);
    this.nameText.position.set(this.screenW / 2, cy - 8);
    this.flavorText.position.set(this.screenW / 2, cy + 36);
    this.drawBanner();
  }

  /** Faixa horizontal escura translúcida atravessando a tela. */
  private drawBanner(): void {
    const cy = this.bannerCenterY();
    const h = 116;
    const top = cy - h / 2;
    this.banner.clear();
    // corpo da faixa (gradiente fake: 3 retângulos sobrepostos)
    this.banner.rect(0, top, this.screenW, h).fill({ color: 0x0a0c12, alpha: 0.82 });
    this.banner.rect(0, top, this.screenW, h).fill({ color: hex(PAL.panelBg), alpha: 0.35 });
    // linhas douradas finas em cima e embaixo (moldura)
    this.banner.rect(0, top, this.screenW, 2).fill({ color: hex(PAL.levelGold), alpha: 0.85 });
    this.banner.rect(0, top + h - 2, this.screenW, 2).fill({ color: hex(PAL.levelGold), alpha: 0.85 });
    // brilho interno superior (vinheta sutil)
    this.banner.rect(0, top + 2, this.screenW, 18).fill({ color: 0xffffff, alpha: 0.04 });

    // glow radial fake atrás do nome (círculos concêntricos dourados)
    this.glow.clear();
    for (let r = 200; r > 0; r -= 28) {
      this.glow.circle(0, 0, r).fill({ color: hex(PAL.levelGold), alpha: 0.03 });
    }
  }

  /** Faíscas douradas simples que orbitam/sobem do nome (Graphics, leve). */
  private drawSparkles(e: number): void {
    this.sparkles.clear();
    const cx = this.screenW / 2;
    const cy = this.bannerCenterY() - 8;
    const N = 7;
    for (let i = 0; i < N; i++) {
      const seed = i * 1.7;
      const phase = (e / 900 + seed) % 1;
      const ang = seed * 2.4 + e / 1600;
      const dist = 70 + i * 26;
      const sx = cx + Math.cos(ang) * dist;
      const sy = cy + Math.sin(ang) * (18 + i * 3) - phase * 24;
      const a = (1 - phase) * 0.7;
      const sz = 1.4 + (1 - phase) * 1.6;
      this.sparkles.circle(sx, sy, sz).fill({ color: hex(PAL.xpShine), alpha: a });
    }
  }
}
