// Preview DESCARTÁVEL — densidade de item: drop no chão (tile 128px) vs slot de
// inventário (48 vs 64). Canvas 2D puro, não toca a trilha client. Carrega os
// masters de 96px de design/ (Vite serve mesmo estando watch-ignored).
// Acesse /item-preview.html com o dev server. Apagar depois de decidir.

// ── masters de item (96px) e char de referência (64px → desenhado 128 = escala de mundo) ──
const MASTERS = import.meta.glob("./design/pixellab-candidatos/items/**/aprovado-*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const KNIGHT = import.meta.glob("./src/client/assets/img/chars/knight/walk/s0.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const itemUrl: Record<string, string> = {};
for (const [path, url] of Object.entries(MASTERS)) {
  const m = path.match(/aprovado-(.+)\.png$/);
  if (m) itemUrl[m[1]] = url;
}
const knightUrl = Object.values(KNIGHT)[0];

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

// ── tokens da UI (espelho de theme.ts) ──
const UI = {
  panelBg: "#141821",
  header: "#1d2330",
  border: "#3a4150",
  gold: "#c8a14a",
  slotBg: "#0e121b",
  slotBgItem: "#161b27",
  slotBorder: "#2c3545",
  slotBorderItem: "#55617a",
  text: "#e8e2d4",
  textDim: "#9aa3b6",
};
const TILE = 128;

const cv = document.getElementById("cv") as HTMLCanvasElement;
cv.width = 1180;
cv.height = 760;
const x = cv.getContext("2d")!;
x.imageSmoothingEnabled = false;

// ── helpers de desenho ──
function rr(px: number, py: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(px + r, py);
  x.arcTo(px + w, py, px + w, py + h, r);
  x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r);
  x.arcTo(px, py, px + w, py, r);
  x.closePath();
}

// hash determinístico p/ scatter dos tiles (sem Math.random)
function h2(a: number, b: number): number {
  let n = (a * 374761393 + b * 668265263) ^ 0x5bd1e995;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 0xffffffff;
}

function grassTile(ox: number, oy: number) {
  x.fillStyle = "#2f4a2a";
  x.fillRect(ox, oy, TILE, TILE);
  for (let i = 0; i < TILE; i += 4)
    for (let j = 0; j < TILE; j += 4) {
      const r = h2(ox + i, oy + j);
      if (r > 0.82) x.fillStyle = "#3a5a32";
      else if (r > 0.7) x.fillStyle = "#274021";
      else continue;
      x.fillRect(ox + i, oy + j, 4, 4);
    }
}
function stoneTile(ox: number, oy: number) {
  x.fillStyle = "#444a52";
  x.fillRect(ox, oy, TILE, TILE);
  for (let i = 0; i < TILE; i += 4)
    for (let j = 0; j < TILE; j += 4) {
      const r = h2(ox + i + 9, oy + j + 5);
      if (r > 0.82) x.fillStyle = "#525861";
      else if (r > 0.7) x.fillStyle = "#3a3f47";
      else continue;
      x.fillRect(ox + i, oy + j, 4, 4);
    }
  // juntas
  x.strokeStyle = "rgba(20,22,28,0.5)";
  x.lineWidth = 2;
  x.strokeRect(ox + 1, oy + 1, TILE - 2, TILE - 2);
}
function contactShadow(cx: number, cy: number, rx: number) {
  x.save();
  x.fillStyle = "rgba(8,10,14,0.42)";
  x.beginPath();
  x.ellipse(cx, cy, rx, rx * 0.38, 0, 0, Math.PI * 2);
  x.fill();
  x.restore();
}

function label(text: string, px: number, py: number, color = UI.text, size = 13, bold = false) {
  x.fillStyle = color;
  x.font = `${bold ? "600 " : ""}${size}px system-ui, sans-serif`;
  x.textBaseline = "alphabetic";
  x.fillText(text, px, py);
}

function panel(px: number, py: number, w: number, h: number, title: string) {
  rr(px, py, w, h, 6);
  x.fillStyle = UI.panelBg;
  x.fill();
  rr(px, py, w, 24 + 6, 6);
  x.fillStyle = UI.header;
  x.fill();
  x.fillStyle = "rgba(200,161,74,0.55)";
  x.fillRect(px, py + 24, w, 1);
  rr(px, py, w, h, 6);
  x.strokeStyle = UI.border;
  x.lineWidth = 1;
  x.stroke();
  x.fillStyle = UI.gold;
  x.font = "600 12px system-ui, sans-serif";
  x.fillText(title, px + 12, py + 16);
}

function slot(px: number, py: number, size: number, filled: boolean) {
  rr(px, py, size, size, 4);
  x.fillStyle = filled ? UI.slotBgItem : UI.slotBg;
  x.fill();
  rr(px, py, size, size, 4);
  x.strokeStyle = filled ? UI.slotBorderItem : UI.slotBorder;
  x.lineWidth = 1;
  x.stroke();
}
function itemInSlot(img: HTMLImageElement, px: number, py: number, size: number) {
  const d = size - 6; // margem de 3px
  x.drawImage(img, px + (size - d) / 2, py + (size - d) / 2, d, d);
}

// ── cena ──
async function main() {
  const ids = [
    "espada-curta",
    "machado-de-mao",
    "adaga",
    "pocao-vida-pequena",
    "pao",
    "escudo-de-madeira",
    "anel-de-regeneracao-menor",
    "capuz-do-cacador",
    "botas-de-couro",
    "peitoral-da-muralha",
    "tunica-de-couro",
    "tocha",
  ];
  const imgs: Record<string, HTMLImageElement> = {};
  await Promise.all(
    ids.map(async (id) => {
      if (itemUrl[id]) imgs[id] = await loadImg(itemUrl[id]);
    }),
  );
  const knight = knightUrl ? await loadImg(knightUrl) : null;

  x.clearRect(0, 0, cv.width, cv.height);

  // ───────── SEÇÃO 1: CHÃO (tile 128px) ─────────
  label("① DROP NO CHÃO — sprite 96px (1:1) sobre tile de 128px, com sombra de contato", 20, 28, UI.gold, 14, true);
  const gy = 42;
  const groundCells: { tile: "grass" | "stone"; id?: string; isChar?: boolean }[] = [
    { tile: "grass", isChar: true },
    { tile: "grass", id: "espada-curta" },
    { tile: "grass", id: "pocao-vida-pequena" },
    { tile: "stone", id: "escudo-de-madeira" },
    { tile: "stone", id: "anel-de-regeneracao-menor" },
    { tile: "stone", id: "machado-de-mao" },
  ];
  groundCells.forEach((c, i) => {
    const gx = 20 + i * (TILE + 8);
    if (c.tile === "grass") grassTile(gx, gy);
    else stoneTile(gx, gy);
    if (c.isChar && knight) {
      // char 64px desenhado a 128 (escala de mundo). sombra na base.
      contactShadow(gx + TILE / 2, gy + TILE - 14, 40);
      x.drawImage(knight, gx, gy, TILE, TILE);
      label("char (ref. 128)", gx + 8, gy + TILE + 16, UI.textDim, 11);
    } else if (c.id && imgs[c.id]) {
      const img = imgs[c.id];
      const cx = gx + TILE / 2;
      const cy = gy + TILE / 2 + 6;
      contactShadow(cx, gy + TILE - 18, 30);
      x.drawImage(img, cx - 48, cy - 48, 96, 96); // 96px 1:1
      label(c.id, gx + 4, gy + TILE + 16, UI.textDim, 11);
    }
  });

  // ───────── SEÇÃO 2: UI lado a lado (48 vs 64) ─────────
  const uy = gy + TILE + 44;
  label("② INVENTÁRIO + EQUIP — comparação de densidade de slot", 20, uy - 8, UI.gold, 14, true);

  const inv = ["espada-curta", "escudo-de-madeira", "pocao-vida-pequena", "pao", "machado-de-mao", "adaga", "tocha", "anel-de-regeneracao-menor"];
  const eq = ["capuz-do-cacador", "peitoral-da-muralha", "tunica-de-couro", "botas-de-couro"];

  function drawVariant(originX: number, originY: number, S: number, tag: string, note: string) {
    const GAP = 6;
    const PAD = 12;
    const COLS = 4;
    label(tag, originX, originY - 8, UI.text, 13, true);
    label(note, originX, originY + 8, UI.textDim, 11);

    // container 2×4
    const cw = PAD * 2 + COLS * S + (COLS - 1) * GAP;
    const crows = 2;
    const ch = 24 + PAD + crows * (S + GAP) - GAP + PAD;
    const cyP = originY + 18;
    panel(originX, cyP, cw, ch, "Mochila");
    inv.forEach((id, i) => {
      const sx = originX + PAD + (i % COLS) * (S + GAP);
      const sy = cyP + 24 + PAD + Math.floor(i / COLS) * (S + GAP);
      const has = !!imgs[id];
      slot(sx, sy, S, has);
      if (has) itemInSlot(imgs[id], sx, sy, S);
    });

    // equip 3 col (mostra 1 coluna preenchida + silhuetas)
    const ex = originX + cw + 20;
    const ECOLS = 3;
    const ew = PAD * 2 + ECOLS * S + (ECOLS - 1) * GAP;
    const erows = 4;
    const eh = 24 + PAD + erows * (S + GAP + 8) - GAP + PAD;
    panel(ex, cyP, ew, eh, "Equipamento");
    const eqSlots = [eq[0], "", "", "", eq[1], "", "", eq[2], "", "", eq[3]];
    eqSlots.forEach((id, i) => {
      const col = i % ECOLS;
      const row = Math.floor(i / ECOLS);
      const sx = ex + PAD + col * (S + GAP);
      const sy = cyP + 24 + PAD + row * (S + GAP + 8);
      const has = !!(id && imgs[id]);
      slot(sx, sy, S, has);
      if (has) itemInSlot(imgs[id], sx, sy, S);
    });
    return ew + cw + 20;
  }

  const w48 = drawVariant(20, uy + 24, 48, "Slot 48px", "downscale ÷2 do master 96 — pixel-limpo, zero geração");
  drawVariant(20 + w48 + 60, uy + 24, 64, "Slot 64px", "upscale provisório dos 96 — exigiria master 128 p/ ser limpo");
}

main();
