/**
 * RNG determinístico (mulberry32). A simulação NUNCA usa Math.random:
 * determinismo é pré-requisito para replay/depuração e para o futuro online.
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash determinístico de coordenadas — útil para variação visual estável. */
export function hash2D(x: number, y: number, seed = 0): number {
  let h = seed ^ (x * 374761393) ^ (y * 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Value noise suave (bilinear + smoothstep) em [0,1). Determinístico. Para
 * agrupamento ORGÂNICO na geração de mapa — bosques com clareiras em vez de
 * scatter uniforme. `freq` = 1/tamanho-da-célula (freq menor = manchas maiores).
 */
export function valueNoise(x: number, y: number, freq: number, seed = 0): number {
  const gx = x * freq, gy = y * freq;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(fx), w = s(fy);
  const v00 = hash2D(x0, y0, seed), v10 = hash2D(x0 + 1, y0, seed);
  const v01 = hash2D(x0, y0 + 1, seed), v11 = hash2D(x0 + 1, y0 + 1, seed);
  return (v00 * (1 - u) + v10 * u) * (1 - w) + (v01 * (1 - u) + v11 * u) * w;
}
