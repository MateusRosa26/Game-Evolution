/**
 * Janela de COZINHA (design/itens/COZINHA.md) — apresentação pura: a lista de
 * receitas + se dá pra fazer agora vem da sim no snapshot (`RecipeView[]`); cada
 * clique vira o comando `cook`. ZERO regra no client (a sim valida posse, gates).
 *
 * Abre/fecha com a tecla C (gerida pelo Game). Receita cozinhável = botão verde
 * "Cozinhar"; bloqueada = cinza + o motivo (faltam ingredientes / sem calor / água).
 */
import { Container, Graphics, Text } from "pixi.js";
import type { RecipeView } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";

const W = 360;
const PAD = 14;
const HEADER_H = 24;
const ROW_H = 34;

interface CookingSend {
  cook: (recipeId: string) => void;
  close: () => void;
}

export class CookingWindow {
  readonly container = new Container();
  private bg = new Graphics();
  private title: Text;
  private rows = new Container();
  private closeBtn = new Container();
  private current: string | null = null;
  private screenW = 0;
  private screenH = 0;

  constructor(private send: CookingSend) {
    this.container.visible = false;
    this.container.addChild(this.bg);
    this.title = new Text({
      text: "Cozinha",
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.title.resolution = 3;
    this.buildCloseBtn();
    this.container.addChild(this.title, this.rows, this.closeBtn);
  }

  /** `recipes` do snapshot (undefined/oculto → esconde). `open` = toggle do Game. */
  update(recipes: RecipeView[] | undefined, open: boolean): void {
    if (!open || !recipes) {
      if (this.container.visible) {
        this.container.visible = false;
        this.current = null;
      }
      return;
    }
    const key = JSON.stringify(recipes);
    if (this.container.visible && key === this.current) return;
    this.current = key;
    this.container.visible = true;
    this.layout(recipes);
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  private buildCloseBtn(): void {
    const g = new Graphics();
    g.roundRect(0, 0, 18, 18, 4).fill({ color: 0x1a1e28, alpha: 0.9 });
    g.roundRect(0, 0, 18, 18, 4).stroke({ color: 0x2a3140, width: 1 });
    const x = new Text({
      text: "✕",
      style: { fontFamily: "monospace", fontSize: 11, fontWeight: "bold", fill: 0xd8a0a0 },
    });
    x.resolution = 3;
    x.position.set(5, 2);
    this.closeBtn.addChild(g, x);
    this.closeBtn.eventMode = "static";
    this.closeBtn.cursor = "pointer";
    this.closeBtn.on("pointertap", () => this.send.close());
    this.closeBtn.on("pointerover", () => (g.tint = 0xc8a84b));
    this.closeBtn.on("pointerout", () => (g.tint = 0xffffff));
  }

  private label(text: string, x: number, y: number, size: number, color: number, bold = false): Text {
    const t = new Text({
      text,
      style: {
        fontFamily: "monospace",
        fontSize: size,
        fontWeight: bold ? "bold" : "normal",
        fill: color,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    t.resolution = 3;
    t.position.set(x, y);
    this.rows.addChild(t);
    return t;
  }

  private layout(recipes: RecipeView[]): void {
    this.rows.removeChildren().forEach((c) => c.destroy({ children: true }));
    const h = HEADER_H + PAD + recipes.length * ROW_H + PAD;
    const x = Math.round((this.screenW - W) / 2);
    const y = Math.round((this.screenH - h) / 2);
    this.container.position.set(x, y);

    this.bg.clear();
    this.bg.roundRect(0, 0, W, h, 8).fill({ color: 0x12161f, alpha: 0.97 });
    this.bg.roundRect(0, 0, W, h, 8).stroke({ color: hex(PAL.panelBorder), width: 2 });
    this.title.position.set(PAD, HEADER_H / 2 - 4);
    this.closeBtn.position.set(W - 26, 6);

    let ry = HEADER_H + PAD;
    for (const r of recipes) {
      // nome do prato + ingredientes
      this.label(r.name, PAD, ry, 11, r.canCook ? 0xe8e4d8 : 0x8a8f9a, true);
      const ing = r.inputs.map((i) => `${i.name}×${i.qty}`).join(", ");
      this.label(ing, PAD, ry + 14, 7, hex(PAL.attrLabel));
      // ação à direita: botão Cozinhar (verde) OU motivo (cinza)
      if (r.canCook) {
        const btn = new Container();
        const g = new Graphics();
        g.roundRect(0, 0, 84, 20, 5).fill({ color: 0x2c4a2c, alpha: 0.95 });
        g.roundRect(0, 0, 84, 20, 5).stroke({ color: 0x6fae5a, width: 1 });
        const bt = new Text({
          text: "Cozinhar",
          style: { fontFamily: "monospace", fontSize: 9, fontWeight: "bold", fill: 0xcfe8b8 },
        });
        bt.resolution = 3;
        bt.position.set(14, 5);
        btn.addChild(g, bt);
        btn.position.set(W - 84 - PAD, ry + 3);
        btn.eventMode = "static";
        btn.cursor = "pointer";
        const id = r.id;
        btn.on("pointertap", () => this.send.cook(id));
        btn.on("pointerover", () => (g.tint = 0xb8e0a0));
        btn.on("pointerout", () => (g.tint = 0xffffff));
        this.rows.addChild(btn);
      } else if (r.reason) {
        this.label(r.reason, W - PAD, ry + 6, 8, 0x9a6a6a).anchor.set(1, 0);
      }
      ry += ROW_H;
    }
  }
}
