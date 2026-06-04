import { Container, Graphics, Text } from "pixi.js";
import type { KnownSkillState } from "../../shared/protocol";
import { skillMeta } from "./skillMeta";

/**
 * Barra de skills (estilo Tibia/MMO, embaixo-centro). Um slot por skill
 * conhecida do player (snapshot `skills`), com glifo procedural, hotkey (1–6),
 * custo de mana e overlay de cooldown (fill vertical escurecido + contagem em
 * segundos quando > 1s).
 *
 * APRESENTAÇÃO pura: lê o snapshot e desenha. NÃO valida mana/cooldown/alcance —
 * a sim rejeita o que for inválido. `skillIdForSlot` deixa o Game mapear a
 * tecla pressionada para o id a enviar em `useSkill`.
 */

const SLOT = 38;
const GAP = 6;
const MAX_SLOTS = 6;

interface Slot {
  cell: Container;
  bg: Graphics;
  glyph: Text;
  hotkey: Text;
  manaText: Text;
  cdOverlay: Graphics;
  cdText: Text;
}

export class SkillBar {
  readonly container = new Container();

  private slots: Slot[] = [];
  private skills: KnownSkillState[] = [];
  private screenW = 0;
  private screenH = 0;

  constructor() {
    for (let i = 0; i < MAX_SLOTS; i++) {
      this.slots.push(this.makeSlot(i));
    }
  }

  /** Id da skill no slot (0-based) ou null se vazio — usado pelas hotkeys. */
  skillIdForSlot(index: number): string | null {
    return this.skills[index]?.id ?? null;
  }

  /** Atualiza a barra a partir das skills conhecidas do snapshot do player. */
  setSkills(skills: KnownSkillState[] | undefined): void {
    this.skills = skills ?? [];
    this.redraw();
  }

  resize(screenW: number, screenH: number): void {
    this.screenW = screenW;
    this.screenH = screenH;
    this.redraw();
  }

  private makeSlot(index: number): Slot {
    const cell = new Container();

    const bg = new Graphics();
    cell.addChild(bg);

    const glyph = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 13,
        fontWeight: "bold",
        fill: 0xe8e4d8,
        stroke: { color: 0x10141c, width: 3 },
      },
    });
    glyph.resolution = 3;
    glyph.anchor.set(0.5, 0.5);
    glyph.position.set(SLOT / 2, SLOT / 2 - 2);
    cell.addChild(glyph);

    // hotkey (canto superior-esquerdo)
    const hotkey = new Text({
      text: `${index + 1}`,
      style: {
        fontFamily: "monospace",
        fontSize: 8,
        fontWeight: "bold",
        fill: 0xcfc8b4,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    hotkey.resolution = 3;
    hotkey.anchor.set(0, 0);
    hotkey.position.set(3, 2);
    cell.addChild(hotkey);

    // custo de mana (canto inferior-direito, azul)
    const manaText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 8,
        fontWeight: "bold",
        fill: 0x86b4ff,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    manaText.resolution = 3;
    manaText.anchor.set(1, 1);
    manaText.position.set(SLOT - 3, SLOT - 2);
    cell.addChild(manaText);

    // overlay de cooldown (escurece de cima p/ baixo) + contagem
    const cdOverlay = new Graphics();
    cell.addChild(cdOverlay);

    const cdText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
        fill: 0xe8e4d8,
        stroke: { color: 0x10141c, width: 3 },
      },
    });
    cdText.resolution = 3;
    cdText.anchor.set(0.5, 0.5);
    cdText.position.set(SLOT / 2, SLOT / 2);
    cell.addChild(cdText);

    this.container.addChild(cell);
    return { cell, bg, glyph, hotkey, manaText, cdOverlay, cdText };
  }

  private redraw(): void {
    const count = Math.min(this.skills.length, MAX_SLOTS);
    const totalW = count > 0 ? count * SLOT + (count - 1) * GAP : 0;
    const startX = Math.round((this.screenW - totalW) / 2);
    // logo acima da margem inferior, sem cobrir o painel de HP/MP à esquerda
    const y = this.screenH - SLOT - 14;

    for (let i = 0; i < MAX_SLOTS; i++) {
      const slot = this.slots[i];
      if (i >= count) {
        slot.cell.visible = false;
        continue;
      }
      slot.cell.visible = true;
      slot.cell.position.set(startX + i * (SLOT + GAP), y);

      const ks = this.skills[i];
      const meta = skillMeta(ks.id);

      slot.bg.clear();
      slot.bg.roundRect(0, 0, SLOT, SLOT, 5).fill({ color: 0x12151d, alpha: 0.92 });
      // faixa de cor da skill no topo (identidade visual)
      slot.bg.roundRect(0, 0, SLOT, 6, 5).fill({ color: meta.color, alpha: 0.85 });
      slot.bg.roundRect(0, 0, SLOT, SLOT, 5).stroke({ color: 0x3a4254, width: 1.5 });

      slot.glyph.text = meta.glyph;
      slot.glyph.style.fill = meta.color;
      slot.manaText.text = ks.manaCost > 0 ? `${ks.manaCost}` : "";

      this.drawCooldown(slot, ks.cooldownMs);
    }
  }

  private drawCooldown(slot: Slot, cooldownMs: number): void {
    slot.cdOverlay.clear();
    if (cooldownMs <= 0) {
      slot.cdText.text = "";
      slot.glyph.alpha = 1;
      return;
    }
    // Skill em cooldown: escurece o slot (fill vertical de cima p/ baixo, estilo
    // MMO) e esmaece o glifo. Sem o total do cooldown no snapshot, normalizamos a
    // ALTURA por uma janela de referência (4s); a CONTAGEM em s é o feedback exato.
    const ref = 4000;
    const ratio = Math.max(0.1, Math.min(1, cooldownMs / ref));
    slot.glyph.alpha = 0.35;
    slot.cdOverlay
      .roundRect(0, 0, SLOT, SLOT * ratio, 5)
      .fill({ color: 0x000307, alpha: 0.78 });
    // contagem em segundos quando > 1s (estilo Tibia)
    slot.cdText.text = cooldownMs > 1000 ? `${Math.ceil(cooldownMs / 1000)}` : "";
  }
}
