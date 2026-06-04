/**
 * Sprite Lab — ferramenta de DEV para direção de arte.
 * Renderiza sprites ampliados em grid: sets de outfit compostos (todas as
 * direções × frames), vitrine de recolor da grade, e o rato de referência.
 * Acesso: http://localhost:5173/sprite-lab.html — NÃO entra no jogo.
 */
import { Application, Container, Sprite, Text, TextureStyle, type Texture } from "pixi.js";
import { OUTFIT_COLORS, OUTFIT_PARTS, OUTFIT_SETS } from "../../shared/outfits";
import { outfitTextures } from "../assets/outfit/compose";
import { createSprites } from "../assets/sprites";

TextureStyle.defaultOptions.scaleMode = "nearest";

const SCALE = 8;
const CELL = 34 * SCALE;

/** Outfit completo de um set (cores: índice padrão por slot). */
function setOutfit(set: string, colors: { head: number; torso: number; legs: number }) {
  const bySlot = (slot: "head" | "torso" | "legs") =>
    OUTFIT_PARTS.find((q) => q.set === set && q.slot === slot)!.id;
  return {
    head: { part: bySlot("head"), color: colors.head },
    torso: { part: bySlot("torso"), color: colors.torso },
    legs: { part: bySlot("legs"), color: colors.legs },
  };
}

async function main() {
  const app = new Application();
  await app.init({ width: 1340, height: 2400, background: 0x0a0c10 });
  document.body.appendChild(app.canvas);

  const sprites = createSprites();
  const root = new Container();
  app.stage.addChild(root);

  let rowIndex = 0;

  function row(label: string, textures: Record<string, Texture[]>): void {
    const facings = ["s", "n", "e", "w"] as const;
    let col = 0;
    for (const facing of facings) {
      for (let f = 0; f < textures[facing].length; f++) {
        const tile = new Container();
        const bgSprite = new Sprite(col % 2 === 0 ? sprites.grass[0] : sprites.stoneFloor[0]);
        bgSprite.width = CELL / 2;
        bgSprite.height = CELL / 2;
        tile.addChild(bgSprite);
        const spr = new Sprite(textures[facing][f]);
        spr.scale.set(SCALE / 2);
        spr.position.set(CELL / 4 - 16 * (SCALE / 2) / 2, CELL / 4 - 16 * (SCALE / 2) / 2);
        tile.addChild(spr);
        tile.position.set(8 + col * (CELL / 2 + 6), 40 + rowIndex * (CELL / 2 + 52));
        root.addChild(tile);
        col++;
      }
    }
    const title = new Text({
      text: label,
      style: { fontFamily: "monospace", fontSize: 14, fill: 0xe8e4d8 },
    });
    title.position.set(8, 40 + rowIndex * (CELL / 2 + 52) - 20);
    root.addChild(title);
    rowIndex++;
  }

  // Sets compostos (espada/escudo aparecem porque weapon = espada_curta)
  const setColors: Record<string, { head: number; torso: number; legs: number }> = {
    knight: { head: 4, torso: 4, legs: 2 },
    rogue: { head: 2, torso: 17, legs: 1 },
    mage: { head: 77, torso: 77, legs: 73 },
    priest: { head: 7, torso: 7, legs: 5 },
    citizen: { head: 21, torso: 41, legs: 17 }, // cabelo castanho, túnica oliva, calça marrom
    ouro: { head: 30, torso: 30, legs: 29 }, // ouro de verdade (h60 s.45)
    vigilia: { head: 0, torso: 0, legs: 0 },
  };
  for (const [set, colors] of Object.entries(setColors)) {
    const weapon = set === "knight" || set === "ouro" || set === "vigilia" ? "espada_curta" : null;
    row(`SET: ${OUTFIT_SETS[set]}`, outfitTextures(setOutfit(set, colors), weapon));
  }
  row("RATO LANHOSO (referência)", sprites.rat);

  // Vitrine de recolor: o MESMO peitoral knight em 8 cores da grade
  const showcaseY = 40 + rowIndex * (CELL / 2 + 52);
  const swatches = [4, 12, 28, 44, 60, 76, 92, 100];
  for (let i = 0; i < swatches.length; i++) {
    const c = swatches[i];
    const tex = outfitTextures(setOutfit("knight", { head: c, torso: c, legs: c }), "espada_curta");
    const tile = new Container();
    const bgSprite = new Sprite(i % 2 === 0 ? sprites.grass[0] : sprites.stoneFloor[0]);
    bgSprite.width = 32 * 4;
    bgSprite.height = 32 * 4;
    tile.addChild(bgSprite);
    const spr = new Sprite(tex.s[0]);
    spr.scale.set(4);
    tile.addChild(spr);
    tile.position.set(8 + i * (32 * 4 + 8), showcaseY + 24);
    root.addChild(tile);
  }
  const scLabel = new Text({
    text: "RECOLOR: set knight em 8 cores da grade (ramp gerado por regra)",
    style: { fontFamily: "monospace", fontSize: 14, fill: 0xe8e4d8 },
  });
  scLabel.position.set(8, showcaseY);
  root.addChild(scLabel);

  // ROSTOS @14x — a bancada do produto (skins = economia): as 3 cabeças
  // descobertas lado a lado, foco total no rosto
  const mixY = showcaseY + 24 + 32 * 4 + 28;
  const faceHeads: { head: string; color: number }[] = [
    { head: "cabeca_cidadao", color: 21 },
    { head: "chapeu_arcano", color: 77 },
    { head: "coifa_aurora", color: 7 },
  ];
  for (let i = 0; i < faceHeads.length; i++) {
    const o = {
      head: { part: faceHeads[i].head, color: faceHeads[i].color },
      torso: { part: "camisa_cidadao", color: 41 },
      legs: { part: "calca_cidadao", color: 17 },
    };
    const tex = outfitTextures(o, null);
    const tile = new Container();
    const bgSprite = new Sprite(i % 2 === 0 ? sprites.grass[0] : sprites.stoneFloor[0]);
    bgSprite.width = 32 * 14;
    bgSprite.height = 32 * 14;
    tile.addChild(bgSprite);
    const spr = new Sprite(tex.s[0]);
    spr.scale.set(14);
    tile.addChild(spr);
    tile.position.set(8 + i * (32 * 14 + 12), mixY + 24);
    root.addChild(tile);
  }
  const mixLabel = new Text({
    text: "ROSTOS @14x — cidadão / arcano / aurora (a bancada das skins)",
    style: { fontFamily: "monospace", fontSize: 14, fill: 0xe8e4d8 },
  });
  mixLabel.position.set(8, mixY);
  root.addChild(mixLabel);

  // Amostra da grade de cores (todas)
  const gridY = mixY + 24 + 32 * 10 + 28;
  for (let i = 0; i < OUTFIT_COLORS.length; i++) {
    const sw = new Container();
    const g = new Sprite(sprites.shadow);
    // swatch via Graphics seria mais limpo; Sprite+tint funciona p/ amostra
    sw.position.set(8 + (i % 26) * 20, gridY + 24 + Math.floor(i / 26) * 20);
    const cellText = new Text({
      text: "■",
      style: { fontSize: 18, fill: OUTFIT_COLORS[i] },
    });
    sw.addChild(cellText);
    root.addChild(sw);
    void g;
  }
  const gridLabel = new Text({
    text: `GRADE DE CORES (${OUTFIT_COLORS.length})`,
    style: { fontFamily: "monospace", fontSize: 14, fill: 0xe8e4d8 },
  });
  gridLabel.position.set(8, gridY);
  root.addChild(gridLabel);
}

main();
