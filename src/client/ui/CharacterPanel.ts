import { Container, Graphics, Text } from "pixi.js";
import type { PlayerProgressState } from "../../shared/protocol";
import { ATTRIBUTE_KEYS, type AttributeKey } from "../../shared/types";
import { PAL, hex } from "../assets/palette";
import { makeDraggable } from "./draggable";

/** Rótulos pt-BR dos 5 atributos da camada sólida (chaves estáveis em inglês). */
const ATTR_LABELS: Record<AttributeKey, string> = {
  strength: "Força",
  dexterity: "Destreza",
  intelligence: "Inteligência",
  vitality: "Vitalidade",
  spirit: "Espírito",
};

const PANEL_W = 230;
const PANEL_X = 16;
const HEADER_H = 26;
const ROW_H = 26;
const PAD = 14;

interface AttrRow {
  label: Text;
  value: Text;
  plusBg: Graphics;
  plusText: Text;
}

/**
 * Painel de personagem (togglável com C). Mostra level, XP, pontos livres e os
 * 5 atributos; com pontos livres, exibe botões "+" que enviam o comando
 * `allocateStatPoint`. Pixel art procedural simples (Graphics) coerente com a
 * HUD. Apenas apresentação + envio de comando — NENHUMA regra de jogo aqui.
 */
export class CharacterPanel {
  readonly container = new Container();

  private bg = new Graphics();
  private headerText: Text;
  private summaryText: Text;
  private rows: Record<AttributeKey, AttrRow>;
  private freePoints = 0;
  /** Custo do próximo ponto por atributo (vem da sim no snapshot). */
  private costs: Record<AttributeKey, number> | null = null;
  private hasData = false;
  private screenH = 0;
  /** Posição escolhida pelo usuário ao arrastar (null = default à esquerda). */
  private userPos: { x: number; y: number } | null = null;

  constructor(private onAllocate: (attr: AttributeKey) => void) {
    this.container.visible = false;
    this.container.addChild(this.bg);
    makeDraggable(this.container, HEADER_H, (x, y) => {
      this.userPos = { x, y };
    });

    this.headerText = new Text({
      text: "Personagem",
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.headerText.resolution = 3;
    this.headerText.anchor.set(0, 0.5);
    this.container.addChild(this.headerText);

    this.summaryText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 8,
        fill: hex(PAL.attrLabel),
        stroke: { color: 0x10141c, width: 2 },
        lineHeight: 12,
      },
    });
    this.summaryText.resolution = 3;
    this.summaryText.anchor.set(0, 0);
    this.container.addChild(this.summaryText);

    this.rows = {} as Record<AttributeKey, AttrRow>;
    for (const key of ATTRIBUTE_KEYS) {
      const label = new Text({
        text: ATTR_LABELS[key],
        style: {
          fontFamily: "monospace",
          fontSize: 9,
          fill: hex(PAL.attrLabel),
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      label.resolution = 3;
      label.anchor.set(0, 0.5);
      this.container.addChild(label);

      const value = new Text({
        text: "0",
        style: {
          fontFamily: "monospace",
          fontSize: 10,
          fontWeight: "bold",
          fill: hex(PAL.attrValue),
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      value.resolution = 3;
      value.anchor.set(1, 0.5);
      this.container.addChild(value);

      const plusBg = new Graphics();
      plusBg.eventMode = "static";
      plusBg.cursor = "pointer";
      plusBg.on("pointertap", () => this.onAllocate(key));
      plusBg.on("pointerover", () => {
        this.drawPlus(plusBg, true);
      });
      plusBg.on("pointerout", () => {
        this.drawPlus(plusBg, false);
      });
      this.container.addChild(plusBg);

      const plusText = new Text({
        text: "+",
        style: {
          fontFamily: "monospace",
          fontSize: 12,
          fontWeight: "bold",
          fill: 0xeef4e6,
        },
      });
      plusText.resolution = 3;
      plusText.anchor.set(0.5, 0.5);
      plusText.eventMode = "none";
      this.container.addChild(plusText);

      this.rows[key] = { label, value, plusBg, plusText };
    }
  }

  get visible(): boolean {
    return this.container.visible;
  }

  toggle(): void {
    this.container.visible = !this.container.visible;
    if (this.container.visible) this.layout();
  }

  setProgress(p: PlayerProgressState): void {
    this.hasData = true;
    this.freePoints = p.freeStatPoints;
    this.costs = p.statPointCosts;
    for (const key of ATTRIBUTE_KEYS) {
      this.rows[key].value.text = `${p.attributes[key]}`;
    }
    // `xp`/`xpForNextLevel` são TOTAIS cumulativos; mostramos o progresso DENTRO
    // do nível atual (relativo a `xpLevelFloor`, que vem da sim).
    const xpInto = Math.max(0, p.xp - p.xpLevelFloor);
    const xpNeeded = Math.max(0, p.xpForNextLevel - p.xpLevelFloor);
    const CLASS_LABEL: Record<string, string> = {
      knight: "Cavaleiro", mage: "Mago", rogue: "Ladino", priest: "Sacerdote", classless: "Sem Classe",
    };
    this.summaryText.text =
      `${CLASS_LABEL[p.cls] ?? p.cls}\n` +
      `Nível ${p.level}\n` +
      `XP ${xpInto} / ${xpNeeded}\n` +
      `Cap ${p.cap.current} / ${p.cap.max}\n` +
      `Pontos livres: ${p.freeStatPoints}`;
    if (this.container.visible) this.layout();
  }

  resize(screenH: number): void {
    this.screenH = screenH;
    if (this.container.visible) this.layout();
  }

  private layout(): void {
    const rowsTop = HEADER_H + 58; // header + bloco de resumo (Nível/XP/Cap/Pontos)
    const panelH = rowsTop + ATTRIBUTE_KEYS.length * ROW_H + PAD;
    // posição do usuário (drag) ou default: centralizado, encostado à esquerda
    const x = this.userPos?.x ?? PANEL_X;
    const y = this.userPos?.y ?? Math.max(12, (this.screenH - panelH) / 2);
    this.container.position.set(x, y);

    this.bg.clear();
    this.bg.roundRect(0, 0, PANEL_W, panelH, 7).fill({ color: hex(PAL.panelBg), alpha: 0.95 });
    this.bg.roundRect(0, 0, PANEL_W, panelH, 7).stroke({ color: hex(PAL.panelBorder), width: 2 });
    // faixa de título
    this.bg.roundRect(0, 0, PANEL_W, HEADER_H, 7).fill(hex(PAL.panelHeader));
    this.bg.moveTo(PAD, HEADER_H).lineTo(PANEL_W - PAD, HEADER_H).stroke({ color: hex(PAL.panelBorder), width: 1 });

    this.headerText.position.set(PAD, HEADER_H / 2);
    this.summaryText.position.set(PAD, HEADER_H + 6);

    const showPlus = this.hasData && this.freePoints > 0;
    for (let i = 0; i < ATTRIBUTE_KEYS.length; i++) {
      const key = ATTRIBUTE_KEYS[i];
      const row = this.rows[key];
      const cy = rowsTop + i * ROW_H + ROW_H / 2;

      row.label.position.set(PAD, cy);

      const plusSize = 18;
      const plusX = PANEL_W - PAD - plusSize;
      const plusY = cy - plusSize / 2;

      // valor à esquerda do botão "+" (ou na borda direita quando sem pontos)
      const valueRight = showPlus ? plusX - 10 : PANEL_W - PAD;
      row.value.position.set(valueRight, cy);

      row.plusBg.visible = showPlus;
      row.plusText.visible = showPlus;
      if (showPlus) {
        // Custo por faixa (vem da sim): botão mostra "+custo" e fica apagado
        // quando os pontos livres não cobrem o custo deste atributo.
        const cost = this.costs?.[key] ?? 1;
        const affordable = this.freePoints >= cost;
        row.plusBg.position.set(plusX, plusY);
        this.drawPlus(row.plusBg, false);
        row.plusBg.alpha = affordable ? 1 : 0.35;
        row.plusBg.eventMode = affordable ? "static" : "none";
        row.plusText.text = cost > 1 ? `+${cost}` : "+";
        row.plusText.style.fontSize = cost > 1 ? 9 : 12;
        row.plusText.alpha = affordable ? 1 : 0.35;
        row.plusText.position.set(plusX + plusSize / 2, cy);
      }
    }
  }

  /** Desenha o botão "+" (estado normal/hover). */
  private drawPlus(g: Graphics, hover: boolean): void {
    const size = 18;
    g.clear();
    const base = hover ? hex(PAL.btnPlusHover) : hex(PAL.btnPlus);
    g.roundRect(0, 0, size, size, 3).fill(base);
    g.roundRect(0, 0, size, size / 2, 3).fill({ color: hex(PAL.btnPlusLight), alpha: 0.6 });
    g.roundRect(0, 0, size, size, 3).stroke({ color: 0x10141c, width: 1.5 });
  }
}
