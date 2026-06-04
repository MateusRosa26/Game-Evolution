/**
 * Sprite Lab — ferramenta de DEV para direção de arte.
 * Renderiza sprites ampliados (8×) em grid: todas as direções × frames,
 * sobre 2 fundos (grama escura / pedra clara) para testar leitura.
 * Acesso: http://localhost:5173/sprite-lab.html — NÃO entra no jogo.
 */
import { Application, Container, Sprite, Text, TextureStyle, type Texture } from "pixi.js";
import { createSprites } from "../assets/sprites";
import { hex, PAL } from "../assets/palette";

TextureStyle.defaultOptions.scaleMode = "nearest";

const SCALE = 8;
const CELL = 34 * SCALE; // 32px + respiro

async function main() {
  const app = new Application();
  await app.init({ width: 1280, height: 1320, background: 0x0a0c10 });
  document.body.appendChild(app.canvas);

  const sprites = createSprites();
  const root = new Container();
  app.stage.addChild(root);

  // Fundos de teste: grama escura e pedra clara
  const backgrounds = [hex(PAL.grassDark), hex(PAL.stoneLight)];

  /** Desenha uma fileira de frames de um Record<Facing, Texture[]>. */
  function row(
    label: string,
    textures: Record<string, Texture[]>,
    rowIndex: number,
  ): void {
    const facings = ["s", "n", "e", "w"] as const;
    let col = 0;
    for (const facing of facings) {
      for (let f = 0; f < textures[facing].length; f++) {
        const bg = backgrounds[col % 2 === 0 ? 0 : 1];
        const cellX = 8 + col * (CELL / 2 + 8);
        const cellY = 40 + rowIndex * (CELL / 2 + 56);

        const back = new Sprite();
        back.width = CELL / 2;
        back.height = CELL / 2;
        back.tint = bg;
        back.texture = sprites.shadow; // qualquer textura branca serviria; tint resolve
        // fundo chapado via Graphics seria mais limpo, mas Sprite+tint evita import
        const tile = new Container();
        const bgSprite = new Sprite(sprites.grass[0]);
        bgSprite.width = CELL / 2;
        bgSprite.height = CELL / 2;
        if (col % 2 === 1) bgSprite.texture = sprites.stoneFloor[0];
        tile.addChild(bgSprite);

        const spr = new Sprite(textures[facing][f]);
        spr.scale.set(SCALE / 2);
        spr.position.set(CELL / 4 - 16 * (SCALE / 2) / 2, CELL / 4 - 16 * (SCALE / 2) / 2);
        tile.addChild(spr);

        tile.position.set(cellX, cellY);
        root.addChild(tile);

        const cap = new Text({
          text: `${facing}${f}`,
          style: { fontFamily: "monospace", fontSize: 12, fill: 0x8890a0 },
        });
        cap.position.set(cellX, cellY + CELL / 2 + 2);
        root.addChild(cap);
        col++;
      }
    }
    const title = new Text({
      text: label,
      style: { fontFamily: "monospace", fontSize: 14, fill: 0xe8e4d8 },
    });
    title.position.set(8, 40 + rowIndex * (CELL / 2 + 56) - 20);
    root.addChild(title);
  }

  row("KNIGHT — Aço de Alvorada (padrão)", sprites.knight.padrao, 0);
  row("KNIGHT — Ouro Cerimonial", sprites.knight.dourado, 1);
  row("KNIGHT — Vigília Negra", sprites.knight.sombrio, 2);
  row("RATO LANHOSO (referência boa)", sprites.rat, 3);

  // Fileira extra: as 3 skins S paradas AMPLIADAS 12× alternando os fundos
  const skins = ["padrao", "dourado", "sombrio"] as const;
  for (let i = 0; i < skins.length; i++) {
    const tile = new Container();
    const bgSprite = new Sprite(i % 2 === 0 ? sprites.grass[0] : sprites.stoneFloor[0]);
    bgSprite.width = 32 * 12;
    bgSprite.height = 32 * 12;
    tile.addChild(bgSprite);
    const spr = new Sprite(sprites.knight[skins[i]].s[0]);
    spr.scale.set(12);
    tile.addChild(spr);
    tile.position.set(8 + i * (32 * 12 + 16), 920);
    root.addChild(tile);
  }
  const bigLabel = new Text({
    text: "SKINS s0 @12x — padrão / dourado / sombrio",
    style: { fontFamily: "monospace", fontSize: 14, fill: 0xe8e4d8 },
  });
  bigLabel.position.set(8, 900);
  root.addChild(bigLabel);
}

main();
