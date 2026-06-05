/**
 * Ramp sentinela + recoloração de peças de outfit.
 *
 * As peças são desenhadas com 6 CINZAS SENTINELA (valores exatos). Na
 * composição, cada peça é recolorida: os sentinelas viram um ramp gerado a
 * partir da cor escolhida pelo jogador, seguindo as regras de ofício do
 * estudo (design/ESTUDO-REFERENCIAS.md §1 — Saint11/Slynyrd):
 *   - sombra desloca o matiz para o FRIO (azul) e perde saturação;
 *   - luz desloca para o QUENTE (amarelo) e ganha saturação;
 *   - saturação faz pico no meio do ramp; nunca 0%/100%;
 *   - passos de brilho menores no topo.
 * Resultado: QUALQUER cor da grade vira pixel art correta automaticamente.
 * Pixels fora dos sentinelas (pele, brasa, couro fixo) passam intactos.
 */

/** Os 6 tons sentinela (sombra → brilho). Valores EXATOS — não usar à mão. */
export const SENT = {
  shadow: "#202020",
  dark: "#404040",
  base: "#606060",
  light: "#808080",
  edge: "#a0a0a0",
  shine: "#c0c0c0",
} as const;

/** RGB dos sentinelas para o pass de recolor (mesma ordem do ramp). */
const SENTINEL_RGB: [number, number, number][] = [
  [0x20, 0x20, 0x20],
  [0x40, 0x40, 0x40],
  [0x60, 0x60, 0x60],
  [0x80, 0x80, 0x80],
  [0xa0, 0xa0, 0xa0],
  [0xc0, 0xc0, 0xc0],
];

// ── HSL helpers (client-only) ──

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** Gira `h` em direção a `target` por até `amount` graus (caminho curto). */
function rotateToward(h: number, target: number, amount: number): number {
  let diff = ((target - h + 540) % 360) - 180;
  diff = Math.max(-amount, Math.min(amount, diff));
  return (h + diff + 360) % 360;
}

const COOL_HUE = 230; // sombras puxam para azul
const WARM_HUE = 50; // luzes puxam para amarelo

/**
 * LUT CONTÍNUA de shading: lum original (0..255) → RGB da cor alvo com o
 * shading PRESERVADO. Mesmas curvas do ramp de 6 tons (luz relativa, pico de
 * saturação no meio, matiz frio→quente), mas interpoladas — sem os 6 degraus
 * que posterizavam o sprite PixelLab (a armadura tem ~20 tons; achatar em 6
 * deixava "pior que antes da tintura", veredito do criador).
 */
export function shadeLutFromColor(hex: string): Uint8ClampedArray {
  const [h, s, l] = hexToHsl(hex);
  const lightF = [0.42, 0.6, 0.8, 1.0, 1.14, 1.26];
  const satF = [0.7, 0.9, 1.05, 1.0, 0.85, 0.68];
  const hueAmt = [14, 9, 3, 0, 8, 14];
  const hueAt = (i: number) =>
    i < 3 ? rotateToward(h, COOL_HUE, hueAmt[i]) : rotateToward(h, WARM_HUE, hueAmt[i]);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let lum = 0; lum < 256; lum++) {
    // mesma normalização do ramp (lum/200, clampado): t contínuo em [0,5]
    const t = Math.min(5, (lum / 200) * 6);
    const i0 = Math.min(4, Math.floor(t));
    const f = t - i0;
    const li = Math.max(0.07, Math.min(0.93, l * (lightF[i0] + (lightF[i0 + 1] - lightF[i0]) * f)));
    const si = Math.max(0.04, Math.min(0.92, s * (satF[i0] + (satF[i0 + 1] - satF[i0]) * f)));
    // matiz: interpola pelo caminho curto entre os tons vizinhos do ramp
    const h0 = hueAt(i0);
    const h1 = hueAt(i0 + 1);
    const dh = ((h1 - h0 + 540) % 360) - 180;
    const [r, g, b] = hslToRgb((h0 + dh * f + 360) % 360, si, li);
    lut[lum * 3] = r;
    lut[lum * 3 + 1] = g;
    lut[lum * 3 + 2] = b;
  }
  return lut;
}

/**
 * Gera o ramp de 6 tons a partir da cor base (hex da grade).
 * t∈[0..5]: brilho sobe (passos menores no topo), matiz roda frio→quente,
 * saturação pico no meio. Clamps evitam 0%/100%.
 */
export function rampFromColor(hex: string): [number, number, number][] {
  const [h, s, l] = hexToHsl(hex);
  // fatores de luz relativos à base (sombra funda → brilho), passos menores no topo
  const lightF = [0.42, 0.6, 0.8, 1.0, 1.14, 1.26];
  // saturação: pico no meio do ramp
  const satF = [0.7, 0.9, 1.05, 1.0, 0.85, 0.68];
  // rotação de matiz: sombras até 14° p/ frio, luzes até 14° p/ quente
  const hueAmt = [14, 9, 3, 0, 8, 14];
  const ramp: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const li = Math.max(0.07, Math.min(0.93, l * lightF[i]));
    const si = Math.max(0.04, Math.min(0.92, s * satF[i]));
    const hi = i < 3 ? rotateToward(h, COOL_HUE, hueAmt[i]) : rotateToward(h, WARM_HUE, hueAmt[i]);
    ramp.push(hslToRgb(hi, si, li));
  }
  return ramp;
}

/**
 * Recolore IN-PLACE um canvas desenhado com sentinelas: cada sentinela vira o
 * tom correspondente do ramp da cor. Pixels não-sentinela ficam intactos.
 */
export function recolorCanvas(canvas: HTMLCanvasElement, colorHex: string): void {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const ramp = rampFromColor(colorHex);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    for (let t = 0; t < 6; t++) {
      const [sr, sg, sb] = SENTINEL_RGB[t];
      if (d[i] === sr && d[i + 1] === sg && d[i + 2] === sb) {
        const [r, g, b] = ramp[t];
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        break;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}
