/**
 * Janela de LOJA (SISTEMA-NPCS.md §Comércio) — apresentação pura: o sortimento
 * (sells/buys + preços) vem da sim no snapshot (`ShopViewState`); cada clique
 * vira `buyItem`/`sellItem`/`closeShop`. ZERO regra no client: a sim valida ouro,
 * espaço, peso e gating por quest.
 *
 * Duas seções: "À venda" (o NPC vende → botão Comprar) e "Ele compra" (cruza a
 * lista de compra do NPC com o BOLSO do jogador → lista o que dá pra vender).
 */
import { Container, Graphics, Text } from "pixi.js";
import type { ContainerView, ShopViewState } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";

const W = 380;
const PAD = 14;
const HEADER_H = 24;
const ROW_H = 22;

interface ShopSend {
  buy: (templateId: string) => void;
  sell: (instanceId: number) => void;
  close: () => void;
}

export class ShopWindow {
  readonly container = new Container();
  private bg = new Graphics();
  private title: Text;
  private rows = new Container();
  private closeBtn = new Container();
  private current: string | null = null;
  private screenW = 0;
  private screenH = 0;

  constructor(private send: ShopSend) {
    this.container.visible = false;
    this.container.addChild(this.bg);
    this.title = new Text({
      text: "",
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

  /** `view` = loja do snapshot (undefined → esconde). `backpack` = bolso do
   *  jogador (para listar o que dá pra vender). */
  update(view: ShopViewState | undefined, backpack: ContainerView | undefined): void {
    if (!view) {
      if (this.container.visible) {
        this.container.visible = false;
        this.current = null;
      }
      return;
    }
    const sellable = this.sellableFrom(view, backpack);
    const key = JSON.stringify({ view, sellable });
    if (key === this.current) return;
    this.current = key;
    this.container.visible = true;
    this.layout(view, sellable);
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  /** Cruza a lista de compra do NPC com os itens do bolso → o que é vendável. */
  private sellableFrom(
    view: ShopViewState,
    backpack: ContainerView | undefined,
  ): { instanceId: number; name: string; price: number }[] {
    if (!backpack || view.buys.length === 0) return [];
    const priceByTemplate = new Map(view.buys.map((b) => [b.templateId, b.price]));
    const out: { instanceId: number; name: string; price: number }[] = [];
    for (const it of backpack.items) {
      const price = priceByTemplate.get(it.templateId);
      if (price != null) out.push({ instanceId: it.instanceId, name: it.name, price });
    }
    return out;
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

  /** Cabeçalho de seção ("À venda" / "Ele compra"). */
  private sectionLabel(text: string, y: number): void {
    const t = new Text({
      text,
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fontWeight: "bold",
        fill: hex(PAL.panelBorder),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    t.resolution = 3;
    t.position.set(PAD, y);
    this.rows.addChild(t);
  }

  /** Uma linha "nome … preço [ação]" clicável. `accent` = cor do preço. */
  private itemRow(
    label: string,
    price: number,
    accent: number,
    y: number,
    onClick: () => void,
  ): void {
    const row = new Container();
    const g = new Graphics();
    g.roundRect(-4, -3, W - PAD * 2 + 8, ROW_H - 4, 4).fill({ color: 0x1a1e28, alpha: 0.9 });
    g.roundRect(-4, -3, W - PAD * 2 + 8, ROW_H - 4, 4).stroke({ color: 0x2a3140, width: 1 });
    const name = new Text({
      text: label,
      style: { fontFamily: "monospace", fontSize: 9, fontWeight: "bold", fill: 0xe8e4d8 },
    });
    name.resolution = 3;
    name.position.set(2, 2);
    const cost = new Text({
      text: `${price}g`,
      style: { fontFamily: "monospace", fontSize: 9, fontWeight: "bold", fill: accent },
    });
    cost.resolution = 3;
    cost.position.set(W - PAD * 2 - cost.width - 2, 2);
    row.addChild(g, name, cost);
    row.position.set(PAD, y);
    row.eventMode = "static";
    row.cursor = "pointer";
    row.on("pointertap", onClick);
    row.on("pointerover", () => (g.tint = 0xc8a84b));
    row.on("pointerout", () => (g.tint = 0xffffff));
    this.rows.addChild(row);
  }

  private hint(text: string, y: number): void {
    const t = new Text({
      text,
      style: { fontFamily: "monospace", fontSize: 8, fill: 0x8a8f9a, fontStyle: "italic" },
    });
    t.resolution = 3;
    t.position.set(PAD, y);
    this.rows.addChild(t);
  }

  private layout(
    view: ShopViewState,
    sellable: { instanceId: number; name: string; price: number }[],
  ): void {
    this.title.text = `${view.npcName} — Comércio`;
    this.rows.removeChildren().forEach((c) => c.destroy({ children: true }));

    let y = HEADER_H + 10;

    this.sectionLabel("À VENDA", y);
    y += 16;
    if (view.sells.length === 0) {
      this.hint("Ele não tem nada à venda.", y);
      y += 16;
    } else {
      for (const s of view.sells) {
        this.itemRow(s.name, s.price, hex(PAL.levelGold), y, () => this.send.buy(s.templateId));
        y += ROW_H;
      }
    }

    y += 8;
    this.sectionLabel("ELE COMPRA", y);
    y += 16;
    if (view.buys.length === 0) {
      this.hint("Ele não compra nada de você (ainda).", y);
      y += 16;
    } else if (sellable.length === 0) {
      this.hint("Você não tem nada que ele compre.", y);
      y += 16;
    } else {
      for (const it of sellable) {
        this.itemRow(it.name, it.price, 0x9bd17a, y, () => this.send.sell(it.instanceId));
        y += ROW_H;
      }
    }

    const h = y + PAD - 4;
    this.bg.clear();
    this.bg.roundRect(0, 0, W, h, 7).fill({ color: hex(PAL.panelBg), alpha: 1 });
    this.bg.roundRect(0, 0, W, h, 7).stroke({ color: hex(PAL.panelBorder), width: 1.5 });
    this.bg.rect(0, HEADER_H, W, 1).fill(hex(PAL.panelBorder));
    this.title.position.set(PAD, 7);
    this.closeBtn.position.set(W - 18 - 7, 4);

    this.container.position.set(
      Math.round((this.screenW - W) / 2),
      Math.round((this.screenH - h) / 2),
    );
  }
}
