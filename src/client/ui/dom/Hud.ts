/**
 * HUD do jogador — versão DOM (migração jun/2026). Bloco central embaixo: selo de
 * level âmbar à esquerda, barras de XP (fina) + HP (verde→âmbar→vermelho) + MP,
 * nome e ouro. Espelha o Pixi `ui/Hud.ts`; lê HP/MP da entidade + `progress`.
 * Vive no overlay #ui-root; arrasta pela área das barras.
 */
import type { PlayerProgressState } from "../../../shared/protocol";
import { makeDomDraggable } from "./draggable";

/** HP verde → âmbar → vermelho conforme cai (espelha hpColor do theme Pixi). */
function hpColor(ratio: number): string {
  if (ratio > 0.5) return "#57854a"; // verde sóbrio
  if (ratio > 0.25) return "#b8902f"; // âmbar sóbrio
  return "#a83a40"; // vermelho sóbrio
}

export class Hud {
  private el: HTMLDivElement;
  private debugEl: HTMLDivElement;
  private chipLevel: HTMLElement;
  private badge: HTMLElement;
  private xpFill: HTMLElement;
  private xpPct: HTMLElement;
  private hpFill: HTMLElement;
  private hpText: HTMLElement;
  private mpFill: HTMLElement;
  private mpText: HTMLElement;
  private nameEl: HTMLElement;
  private goldEl: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.className = "ui-hud";
    this.el.innerHTML =
      '<div class="hud-main" data-drag>' +
      '  <div class="hud-chip"><span class="hud-level"></span><span class="hud-badge"></span></div>' +
      '  <div class="hud-bars">' +
      '    <div class="hud-xp"><div class="hud-xp-fill"></div><span class="hud-xp-pct"></span></div>' +
      '    <div class="hud-bar"><div class="hud-fill hud-hp-fill"></div><span class="hud-btext hud-hp-text"></span></div>' +
      '    <div class="hud-bar"><div class="hud-fill hud-mp-fill"></div><span class="hud-btext hud-mp-text"></span></div>' +
      "  </div>" +
      "</div>" +
      '<div class="hud-foot">' +
      '  <span class="hud-name">Herói</span>' +
      '  <span class="hud-gold"><i class="hud-coin"></i><b class="hud-gold-val">0</b></span>' +
      "</div>";

    const q = <T extends HTMLElement>(sel: string): T => this.el.querySelector(sel) as T;
    this.chipLevel = q(".hud-level");
    this.badge = q(".hud-badge");
    this.xpFill = q(".hud-xp-fill");
    this.xpPct = q(".hud-xp-pct");
    this.hpFill = q(".hud-hp-fill");
    this.hpText = q(".hud-hp-text");
    this.mpFill = q(".hud-mp-fill");
    this.mpText = q(".hud-mp-text");
    this.nameEl = q(".hud-name");
    this.goldEl = q(".hud-gold-val");
    root.appendChild(this.el);

    // Texto de debug (FPS/coords) — canto superior-direito, fora do painel.
    this.debugEl = document.createElement("div");
    this.debugEl.className = "ui-debug";
    root.appendChild(this.debugEl);

    makeDomDraggable(this.el, q("[data-drag]"));
  }

  setStats(hp: number, maxHp: number, mp: number, maxMp: number): void {
    const hpR = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
    const mpR = maxMp > 0 ? Math.max(0, Math.min(1, mp / maxMp)) : 0;
    this.hpFill.style.width = `${hpR * 100}%`;
    this.hpFill.style.background = hpColor(hpR);
    this.hpText.textContent = `${hp} / ${maxHp}`;
    this.mpFill.style.width = `${mpR * 100}%`;
    this.mpText.textContent = `${mp} / ${maxMp}`;
  }

  setName(name: string): void {
    this.nameEl.textContent = name || "Herói";
  }

  setProgress(p: PlayerProgressState): void {
    this.chipLevel.textContent = `${p.level}`;
    const span = p.xpForNextLevel - p.xpLevelFloor;
    const xpR = span > 0 ? Math.max(0, Math.min(1, (p.xp - p.xpLevelFloor) / span)) : 0;
    this.xpFill.style.width = `${xpR * 100}%`;
    this.xpPct.textContent = `${Math.floor(xpR * 100)}%`;
    this.goldEl.textContent = `${p.gold}`;
    if (p.freeStatPoints > 0) {
      this.badge.textContent = `+${p.freeStatPoints}`;
      this.badge.style.display = "";
    } else {
      this.badge.style.display = "none";
    }
  }

  setDebug(text: string): void {
    this.debugEl.textContent = text;
  }

  /** Pulso do badge é CSS (@keyframes); nada por frame. No-op p/ casar c/ o Game. */
  tick(_deltaMS: number): void {
    /* sem ação */
  }

  /** Centralização é CSS; nada a reposicionar. No-op p/ casar c/ o Game. */
  resize(_w: number, _h: number): void {
    /* sem ação */
  }
}
