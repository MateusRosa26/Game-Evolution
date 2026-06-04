/**
 * Desenho procedural das PEÇAS de outfit (catálogo em shared/outfits.ts).
 *
 * Cada peça é desenhada com os SENTINELAS de `sentinels.ts` (recoloridos na
 * composição). Pixels FIXOS (pele, brasa, couro de cinto) usam PAL direto.
 *
 * ESQUELETO 32×32 (contrato entre as peças — pés na linha y30):
 *   cabeça y2–13 (rosto x12–19 y7–12) · torso y14–23 · pernas y24–30
 *   bob = -1 nos passos (cabeça+torso); luz global topo-esquerda.
 *
 * DIREÇÃO DE ARTE (estudo Apogea — design/ESTUDO-REFERENCIAS.md §1):
 *   1. PANO NUNCA É RETÂNGULO — toda veste é desenhada por RUNS por linha
 *      (largura/offset variando = curvas e quedas orgânicas).
 *   2. DOBRAS INTERNAS — sombras dentro da roupa (axila, vinco, prega).
 *   3. CABELO É FEATURE — massa multi-tom com mechas escapando da silhueta.
 *   4. ASSIMETRIA — faixas diagonais, panos caindo para UM lado.
 *   5. AÇO pode ser anguloso (é metal), mas em PLACAS SOBREPOSTAS.
 */
import { PAL } from "../palette";
import type { Px } from "../sprites";
import { SENT } from "./sentinels";

export type PartFacing = "s" | "n" | "e";

export type PartDrawFn = (p: Px, facing: PartFacing, frame: number) => void;

const bobOf = (frame: number): number => (frame === 0 ? 0 : -1);

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/** Desenha uma linha [x0..x0+w) com tons: 1ª coluna lit, última sombra. */
function run(
  p: Px,
  x0: number,
  y: number,
  w: number,
  lit: string = SENT.light,
  mid: string = SENT.base,
  dark: string = SENT.dark,
): void {
  if (w <= 0) return;
  p.px(x0, y, lit);
  if (w > 2) p.rect(x0 + 1, y, w - 2, 1, mid);
  if (w > 1) p.px(x0 + w - 1, y, dark);
}

/** Rosto aberto GRANDE (apelo chibi): pele fixa, olhos com brilho. */
function openFace(p: Px, bob: number, facing: PartFacing): void {
  if (facing === "s") {
    p.rect(12, 7 + bob, 8, 6, PAL.skin);
    p.rect(12, 12 + bob, 8, 1, PAL.skinShade);
    p.px(12, 7 + bob, PAL.skinShade);
    p.px(19, 7 + bob, PAL.skinShade);
    p.px(12, 11 + bob, PAL.skinShade); // bochecha na sombra
    p.rect(14, 9 + bob, 1, 2, "#20242e");
    p.rect(17, 9 + bob, 1, 2, "#20242e");
    p.px(14, 9 + bob, "#4a5468");
    p.px(17, 9 + bob, "#4a5468");
  } else if (facing === "e") {
    p.rect(13, 7 + bob, 7, 6, PAL.skin);
    p.rect(13, 12 + bob, 7, 1, PAL.skinShade);
    p.px(20, 9 + bob, PAL.skinShade); // nariz
    p.rect(17, 9 + bob, 1, 2, "#20242e");
  }
}

// ──────────────────────────────────────────────────────────────────────
// CABEÇAS
// ──────────────────────────────────────────────────────────────────────

/** Elmo de Alvorada: domo em PLACAS rebitadas com fresta em T. */
function elmoAlvorada(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    run(p, 13, 3 + bob, 6, SENT.edge, SENT.edge, SENT.light);
    p.px(15, 2 + bob, SENT.shine);
    run(p, 12, 4 + bob, 8, SENT.light, SENT.light, SENT.base);
    for (let y = 5 + bob; y <= 11 + bob; y++) {
      run(p, 12, y, 8, SENT.light, SENT.base, SENT.dark);
    }
    p.rect(13, 8 + bob, 7, 1, SENT.dark); // junta de placa
    p.rect(16, 7 + bob, 4, 1, PAL.visorSlit);
    p.px(19, 8 + bob, PAL.visorSlit);
    p.px(13, 9 + bob, SENT.edge); // rebite
    run(p, 13, 12 + bob, 7, SENT.base, SENT.dark, SENT.shadow);
    p.rect(14, 13 + bob, 5, 1, SENT.shadow);
    return;
  }
  // domo: curvas reais (runs estreitando no topo)
  run(p, 14, 2 + bob, 4, SENT.edge, SENT.edge, SENT.light);
  p.px(15, 1 + bob, SENT.shine);
  run(p, 12, 3 + bob, 8, SENT.light, SENT.light, SENT.base);
  run(p, 11, 4 + bob, 10, SENT.light, SENT.base, SENT.dark);
  for (let y = 5 + bob; y <= 11 + bob; y++) {
    run(p, 11, y, 10, SENT.light, SENT.base, SENT.dark);
  }
  p.rect(19, 5 + bob, 2, 7, SENT.dark); // lado na sombra
  // junta horizontal de placas + rebites
  p.rect(12, 5 + bob, 8, 1, SENT.dark);
  p.px(11, 6 + bob, SENT.edge);
  p.px(20, 6 + bob, SENT.shadow);
  if (facing === "s") {
    p.rect(12, 7 + bob, 8, 1, PAL.visorSlit);
    p.rect(15, 8 + bob, 2, 3, PAL.visorSlit);
    // queixo de placa em V
    p.px(12, 12 + bob, SENT.dark);
    p.rect(13, 12 + bob, 6, 1, SENT.dark);
    p.px(19, 12 + bob, SENT.shadow);
  } else {
    p.rect(15, 3 + bob, 1, 9, SENT.edge); // crista traseira
    p.rect(12, 12 + bob, 8, 1, SENT.dark);
  }
  p.rect(13, 13 + bob, 6, 1, SENT.shadow);
}

/** Elmo Cerimonial: alvorada + crista ALTA varrida (juba de desfile). */
function elmoOuro(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  elmoAlvorada(p, facing, frame);
  if (facing === "e") {
    // juba varrendo para trás em curva
    p.rect(11, 0 + bob, 3, 1, SENT.shine);
    p.rect(9, 1 + bob, 4, 1, SENT.edge);
    p.rect(8, 2 + bob, 3, 1, SENT.light);
    p.px(7, 3 + bob, SENT.base);
    p.px(13, 1 + bob, SENT.light);
    return;
  }
  // lâmina de crista alta com queda
  p.rect(15, 0 + bob - 1, 2, 1, SENT.shine);
  p.rect(14, 0 + bob, 3, 1, SENT.edge);
  p.rect(14, 1 + bob, 3, 1, SENT.light);
  p.px(13, 1 + bob, SENT.edge);
  p.px(12, 2 + bob, SENT.base); // queda da juba p/ esquerda
  p.px(17, 1 + bob, SENT.base);
}

/** Elmo da Vigília: chifres CURVOS + brasas na fresta. */
function elmoVigilia(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  elmoAlvorada(p, facing, frame);
  if (facing === "e") {
    // chifre curvando para trás
    p.px(13, 2 + bob, SENT.dark);
    p.px(12, 1 + bob, SENT.base);
    p.px(11, 0 + bob, SENT.light);
    p.px(10, 0 + bob, SENT.edge);
    p.px(18, 7 + bob, PAL.visorEmber);
    return;
  }
  // chifres em curva para fora-cima
  p.px(11, 3 + bob, SENT.dark);
  p.px(10, 2 + bob, SENT.base);
  p.px(9, 1 + bob, SENT.light);
  p.px(9, 0 + bob, SENT.edge);
  p.px(20, 3 + bob, SENT.shadow);
  p.px(21, 2 + bob, SENT.dark);
  p.px(22, 1 + bob, SENT.base);
  p.px(22, 0 + bob, SENT.dark);
  if (facing === "s") {
    p.rect(12, 7 + bob, 8, 1, PAL.visorSlit);
    p.px(13, 7 + bob, PAL.visorEmber);
    p.px(18, 7 + bob, PAL.visorEmber);
  }
}

/** Capuz da Sombra: bico drapeado, abertura OVAL sombria, manto nos ombros. */
function capuzSombra(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // bico do capuz: sobe em curva e MORRE atrás (ponta dupla pendendo)
    p.px(15, 1 + bob, SENT.light);
    run(p, 13, 2 + bob, 4, SENT.light, SENT.base, SENT.base);
    run(p, 11, 3 + bob, 4, SENT.base, SENT.base, SENT.dark);
    p.rect(9, 4 + bob, 3, 1, SENT.dark);
    p.px(8, 5 + bob, SENT.shadow);
    p.px(8, 6 + bob, SENT.dark); // pingo
    p.px(9, 7 + bob, SENT.shadow); // segunda ponta
    // dome do capuz com profundidade (testa avança sobre o rosto)
    run(p, 13, 3 + bob, 6, SENT.light, SENT.light, SENT.base);
    run(p, 12, 4 + bob, 8, SENT.light, SENT.base, SENT.base);
    for (let y = 5 + bob; y <= 11 + bob; y++) {
      run(p, 12, y, 8, SENT.light, SENT.base, SENT.dark);
    }
    p.px(13, 7 + bob, SENT.dark); // vincos radiando do rosto
    p.px(14, 10 + bob, SENT.dark);
    p.px(13, 5 + bob, SENT.shadow);
    // abertura funda (beiral avançado: rosto recuado na sombra)
    p.rect(17, 6 + bob, 3, 1, SENT.dark); // beiral
    p.rect(16, 7 + bob, 3, 4, PAL.visorSlit);
    p.px(20, 8 + bob, PAL.visorSlit);
    p.px(17, 9 + bob, PAL.skinShade); // lasca de queixo
    // manto curto caindo no ombro
    run(p, 12, 12 + bob, 8, SENT.base, SENT.dark, SENT.shadow);
    run(p, 11, 13 + bob, 9, SENT.dark, SENT.shadow, SENT.shadow);
    p.px(12, 14 + bob, SENT.shadow); // pontas do manto
    p.px(17, 14 + bob, SENT.shadow);
    return;
  }
  // ── frente/costas ──
  // bico drapeado: nasce alto e cai em curva morta p/ a esquerda
  p.px(16, 0 + bob, SENT.light);
  run(p, 14, 1 + bob, 4, SENT.light, SENT.base, SENT.base);
  run(p, 12, 2 + bob, 4, SENT.base, SENT.base, SENT.dark);
  run(p, 10, 3 + bob, 3, SENT.dark, SENT.dark, SENT.shadow);
  p.px(9, 4 + bob, SENT.shadow);
  p.px(8, 5 + bob, SENT.dark); // pingo da ponta
  p.px(9, 6 + bob, SENT.shadow); // ponta dupla
  // dome: curva real fechando nas têmporas
  run(p, 14, 2 + bob, 6, SENT.light, SENT.light, SENT.base);
  run(p, 12, 3 + bob, 9, SENT.light, SENT.base, SENT.base);
  run(p, 11, 4 + bob, 10, SENT.light, SENT.base, SENT.dark);
  run(p, 11, 5 + bob, 10, SENT.light, SENT.base, SENT.dark);
  run(p, 11, 6 + bob, 10, SENT.base, SENT.base, SENT.dark);
  // vincos radiando do rosto (tecido puxado)
  p.px(13, 4 + bob, SENT.dark);
  p.px(18, 5 + bob, SENT.shadow);
  p.px(12, 6 + bob, SENT.dark);
  if (facing === "s") {
    // beiral avançado + abertura OVAL funda (não retângulo)
    run(p, 12, 6 + bob, 8, SENT.base, SENT.dark, SENT.dark);
    p.rect(14, 7 + bob, 4, 1, PAL.visorSlit);
    p.rect(13, 8 + bob, 6, 3, PAL.visorSlit);
    p.rect(14, 11 + bob, 4, 1, PAL.visorSlit);
    p.px(12, 8 + bob, SENT.base); // tecido fechando a oval
    p.px(19, 8 + bob, SENT.dark);
    p.px(12, 10 + bob, SENT.base);
    p.px(19, 10 + bob, SENT.dark);
    p.px(14, 9 + bob, "#6a7488"); // olhos frios na escuridão
    p.px(17, 9 + bob, "#6a7488");
  } else {
    // costas: pano contínuo com vincos verticais orgânicos
    run(p, 11, 7 + bob, 10, SENT.base, SENT.base, SENT.dark);
    for (let y = 8 + bob; y <= 11 + bob; y++) {
      run(p, 12, y, 8, SENT.base, SENT.dark, SENT.dark);
    }
    p.px(14, 8 + bob, SENT.shadow);
    p.px(16, 10 + bob, SENT.shadow);
    p.px(13, 11 + bob, SENT.shadow);
  }
  // MANTO curto (capelet) caindo sobre os ombros com pontas irregulares
  run(p, 11, 12 + bob, 10, SENT.base, SENT.dark, SENT.shadow);
  run(p, 10, 13 + bob, 12, SENT.dark, SENT.shadow, SENT.shadow);
  p.px(11, 14 + bob, SENT.shadow); // pontas do manto
  p.px(15, 14 + bob, SENT.shadow);
  p.px(19, 14 + bob, SENT.shadow);
}

/** Chapéu Arcano: aba ONDULADA caída de um lado + cone torto alto. */
function chapeuArcano(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    // cone caindo para trás em curva
    p.px(9, 1 + bob, SENT.dark);
    p.rect(10, 1 + bob, 2, 1, SENT.base);
    run(p, 12, 2 + bob, 3, SENT.light, SENT.base, SENT.base);
    run(p, 13, 3 + bob, 4, SENT.light, SENT.base, SENT.dark);
    p.rect(14, 4 + bob, 4, 1, SENT.base);
    p.rect(14, 5 + bob, 4, 1, SENT.dark); // faixa
    // aba ondulada (cai atrás, sobe na frente)
    p.px(8, 7 + bob, SENT.dark);
    run(p, 9, 6 + bob, 12, SENT.light, SENT.light, SENT.base);
    p.px(21, 5 + bob, SENT.edge);
    p.rect(9, 7 + bob, 11, 1, SENT.dark);
    return;
  }
  // cone alto TORTO (quebra dupla — como um S)
  p.rect(12, 0 + bob - 1, 2, 1, SENT.base);
  p.px(11, 0 + bob, SENT.dark); // pingo da ponta
  run(p, 13, 0 + bob, 3, SENT.light, SENT.base, SENT.base);
  run(p, 13, 1 + bob, 4, SENT.light, SENT.base, SENT.dark);
  run(p, 14, 2 + bob, 4, SENT.light, SENT.base, SENT.dark);
  run(p, 13, 3 + bob, 5, SENT.light, SENT.base, SENT.dark);
  p.px(18, 3 + bob, SENT.shadow);
  // faixa com broche
  p.rect(13, 4 + bob, 6, 1, SENT.shadow);
  if (facing === "s") p.px(15, 4 + bob, PAL.buckle);
  // ABA ONDULADA: esquerda caída, direita erguida (assimetria)
  p.px(9, 7 + bob, SENT.dark);
  p.px(10, 6 + bob, SENT.light);
  run(p, 10, 5 + bob, 12, SENT.light, SENT.light, SENT.base);
  p.px(22, 4 + bob, SENT.edge); // ponta direita erguida
  p.rect(10, 6 + bob, 12, 1, SENT.dark);
  p.px(21, 5 + bob, SENT.base);
  if (facing === "n") {
    p.rect(13, 7 + bob, 6, 5, PAL.hair);
    p.px(14, 11 + bob, "#241a12");
    p.rect(13, 12 + bob, 6, 1, PAL.skinShade);
  }
}

/** Coifa da Aurora: capuz erguido em ARCO + véu caindo de lado. */
function coifaAurora(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    run(p, 13, 3 + bob, 6, SENT.light, SENT.light, SENT.base);
    run(p, 12, 4 + bob, 3, SENT.light, SENT.base, SENT.base);
    p.rect(12, 5 + bob, 2, 8, SENT.base);
    p.rect(14, 4 + bob, 5, 2, SENT.base);
    p.px(19, 5 + bob, SENT.dark);
    // véu esvoaçando atrás em curva
    p.px(11, 6 + bob, SENT.dark);
    p.rect(10, 7 + bob, 2, 4, SENT.dark);
    p.px(9, 10 + bob, SENT.shadow);
    p.px(10, 12 + bob, SENT.shadow);
    p.rect(13, 13 + bob, 6, 1, SENT.dark);
    return;
  }
  // arco do capuz emoldurando o rosto (curva real)
  run(p, 14, 1 + bob, 4, SENT.light, SENT.light, SENT.base);
  run(p, 12, 2 + bob, 8, SENT.light, SENT.base, SENT.base);
  p.px(15, 1 + bob, SENT.shine);
  p.rect(11, 3 + bob, 2, 2, SENT.light);
  p.rect(19, 3 + bob, 2, 2, SENT.dark);
  p.rect(11, 5 + bob, 2, 8, SENT.base);
  p.rect(19, 5 + bob, 2, 8, SENT.dark);
  p.rect(13, 3 + bob, 6, 3, SENT.base);
  p.px(11, 12 + bob, SENT.dark);
  if (facing === "n") {
    p.rect(13, 6 + bob, 6, 7, SENT.base);
    p.px(15, 7 + bob, SENT.dark); // vinco
    p.px(16, 10 + bob, SENT.dark);
    // véu caindo de UM lado (assimetria)
    p.rect(12, 13 + bob, 6, 2, SENT.dark);
    p.rect(11, 15 + bob, 4, 1, SENT.shadow);
  }
  p.rect(12, 13 + bob, 8, 1, SENT.dark);
}

/** Cabelo de Cidadão: massa DESGRENHADA multi-tom com mechas escapando. */
function cabecaCidadao(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    // massa de cabelo com mechas
    run(p, 13, 2 + bob, 6, SENT.light, SENT.base, SENT.base);
    run(p, 12, 3 + bob, 8, SENT.light, SENT.base, SENT.dark);
    p.rect(12, 4 + bob, 8, 2, SENT.base);
    p.px(14, 3 + bob, SENT.dark); // mecha interna
    p.px(17, 4 + bob, SENT.dark);
    p.px(20, 3 + bob, SENT.base); // mecha escapando atrás
    p.rect(12, 6 + bob, 2, 5, SENT.base); // nuca
    p.px(12, 10 + bob, SENT.dark);
    p.px(19, 6 + bob, SENT.base); // topete na testa
    return;
  }
  // coroa desgrenhada: mechas saindo da silhueta
  p.px(12, 1 + bob, SENT.base); // mechas espetadas
  p.px(15, 0 + bob, SENT.light);
  p.px(18, 1 + bob, SENT.base);
  run(p, 13, 2 + bob, 7, SENT.light, SENT.base, SENT.base);
  run(p, 11, 3 + bob, 10, SENT.light, SENT.base, SENT.dark);
  p.rect(11, 4 + bob, 10, 2, SENT.base);
  p.px(11, 4 + bob, SENT.light);
  p.rect(19, 4 + bob, 2, 2, SENT.dark);
  // mechas internas (textura do cabelo)
  p.px(13, 3 + bob, SENT.dark);
  p.px(16, 4 + bob, SENT.dark);
  p.px(19, 3 + bob, SENT.shadow);
  // volume nas têmporas
  p.rect(11, 6 + bob, 1, 3, SENT.base);
  p.rect(20, 6 + bob, 1, 3, SENT.dark);
  p.px(10, 6 + bob, SENT.dark); // mecha lateral escapando
  if (facing === "s") {
    // franja irregular
    p.px(13, 6 + bob, SENT.base);
    p.px(14, 7 + bob, SENT.dark);
    p.px(16, 6 + bob, SENT.base);
    p.px(18, 7 + bob, SENT.base);
  } else {
    p.rect(12, 6 + bob, 8, 6, SENT.base);
    p.px(14, 8 + bob, SENT.dark); // mechas das costas
    p.px(17, 10 + bob, SENT.dark);
    p.px(15, 11 + bob, SENT.shadow);
    p.rect(14, 12 + bob, 4, 1, PAL.skinShade);
  }
}

// ──────────────────────────────────────────────────────────────────────
// TORSOS
// ──────────────────────────────────────────────────────────────────────

/** Alvorada: placas SOBREPOSTAS — gorget, peitoral, barriga, tassets em V. */
function peitoralAlvorada(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // capa com dobra
    p.rect(9, 14 + bob, 2, 3, SENT.base);
    p.rect(9, 17 + bob, 2, 4, SENT.dark);
    p.px(10, 16 + bob, SENT.dark); // dobra
    p.px(8, 19 + bob, SENT.shadow);
    p.rect(9, 21 + bob, 2, 2, SENT.shadow);
    // torso em placas
    run(p, 12, 14 + bob, 7, SENT.edge, SENT.edge, SENT.light);
    for (let y = 15 + bob; y <= 17 + bob; y++) run(p, 12, y, 8, SENT.light, SENT.base, SENT.dark);
    p.rect(13, 18 + bob, 7, 1, SENT.dark); // junta de placa
    for (let y = 19 + bob; y <= 20 + bob; y++) run(p, 13, y, 7, SENT.light, SENT.base, SENT.dark);
    p.rect(12, 21 + bob, 8, 1, PAL.belt);
    p.px(15, 21 + bob, PAL.buckle);
    run(p, 12, 22 + bob, 8, SENT.base, SENT.shadow, SENT.shadow);
    p.px(14, 23 + bob, SENT.dark); // tasset
    p.px(17, 23 + bob, SENT.dark);
    // ombreira curva caindo
    run(p, 11, 14 + bob, 7, SENT.edge, SENT.light, SENT.base);
    p.px(11, 15 + bob, SENT.light);
    p.px(12, 16 + bob, SENT.base); // borda caindo
    return;
  }
  const back = facing === "n";
  if (back) {
    // capa: pano com dobras verticais e barra irregular
    run(p, 11, 14 + bob, 10, SENT.light, SENT.base, SENT.base);
    run(p, 11, 15 + bob, 10, SENT.light, SENT.base, SENT.dark);
    for (let y = 16 + bob; y <= 20 + bob; y++) run(p, 11, y, 10, SENT.base, SENT.dark, SENT.dark);
    p.rect(13, 16 + bob, 1, 5, SENT.shadow); // dobras
    p.rect(17, 17 + bob, 1, 4, SENT.shadow);
    run(p, 11, 21 + bob, 10, SENT.dark, SENT.shadow, SENT.shadow);
    p.rect(12, 22 + bob, 8, 2, SENT.shadow);
    p.px(11, 23 + bob, SENT.shadow); // barra caindo irregular
    p.px(19, 24 + bob, SENT.shadow);
    p.px(14, 24 + bob, SENT.shadow);
  } else {
    // gorget (placa do pescoço)
    run(p, 13, 14 + bob, 6, SENT.edge, SENT.edge, SENT.base);
    // PEITORAL: placa abaulada com volume (curva de luz)
    run(p, 11, 15 + bob, 10, SENT.light, SENT.base, SENT.dark);
    run(p, 10, 16 + bob, 12, SENT.light, SENT.base, SENT.dark);
    run(p, 10, 17 + bob, 12, SENT.light, SENT.base, SENT.dark);
    p.rect(13, 15 + bob, 2, 2, SENT.light); // brilho do peito
    p.px(16, 16 + bob, SENT.dark); // vinco central
    p.rect(11, 18 + bob, 10, 1, SENT.dark); // junta
    // placa da barriga (afina — sobreposição)
    run(p, 12, 19 + bob, 8, SENT.light, SENT.base, SENT.dark);
    run(p, 12, 20 + bob, 8, SENT.light, SENT.base, SENT.dark),
    // cinto + TASSETS em V (saiote de placas anguladas)
    p.rect(11, 21 + bob, 10, 1, PAL.belt);
    p.rect(15, 21 + bob, 2, 1, PAL.buckle);
    p.px(11, 22 + bob, SENT.dark);
    p.rect(12, 22 + bob, 3, 1, SENT.base);
    p.px(15, 22 + bob, SENT.shadow); // V central
    p.px(16, 23 + bob, SENT.shadow);
    p.rect(17, 22 + bob, 3, 1, SENT.dark);
    p.px(20, 22 + bob, SENT.shadow);
    p.px(13, 23 + bob, SENT.dark);
    p.px(18, 23 + bob, SENT.shadow);
  }
  // OMBREIRAS: placas curvas CAINDO sobre o braço (não blocos)
  run(p, 8, 14 + bob, 4, SENT.edge, SENT.edge, SENT.light);
  run(p, 8, 15 + bob, 4, SENT.light, SENT.light, SENT.base);
  p.px(9, 16 + bob, SENT.base);
  p.px(10, 17 + bob, SENT.dark); // borda caindo em curva
  run(p, 20, 14 + bob, 4, SENT.light, SENT.base, SENT.dark);
  run(p, 20, 15 + bob, 4, SENT.base, SENT.dark, SENT.dark);
  p.px(22, 16 + bob, SENT.dark);
  p.px(21, 17 + bob, SENT.shadow);
}

/** Ouro: alvorada + asas eretas nas ombreiras + friso. */
function peitoralOuro(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  peitoralAlvorada(p, facing, frame);
  if (facing === "e") {
    p.px(11, 13 + bob, SENT.shine);
    p.px(10, 12 + bob, SENT.edge);
    return;
  }
  // asas das ombreiras (curvas para cima-fora)
  p.px(8, 13 + bob, SENT.shine);
  p.px(7, 12 + bob, SENT.edge);
  p.px(6, 11 + bob, SENT.light);
  p.px(23, 13 + bob, SENT.edge);
  p.px(24, 12 + bob, SENT.base);
  p.px(25, 11 + bob, SENT.dark);
  if (facing === "s") {
    p.rect(15, 16 + bob, 1, 4, SENT.shine); // friso gravado
    p.px(13, 19 + bob, SENT.shine);
    p.px(18, 19 + bob, SENT.shine);
  }
}

/** Vigília: alvorada + espinhos + capa esfarrapada. */
function peitoralVigilia(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  peitoralAlvorada(p, facing, frame);
  if (facing === "e") {
    p.px(12, 13 + bob, SENT.edge);
    p.px(12, 12 + bob, SENT.light);
    return;
  }
  // espinhos eretos
  p.px(9, 13 + bob, SENT.edge);
  p.px(9, 12 + bob, SENT.light);
  p.px(10, 13 + bob, SENT.base);
  p.px(22, 13 + bob, SENT.base);
  p.px(22, 12 + bob, SENT.dark);
  p.px(21, 13 + bob, SENT.dark);
  if (facing === "s") {
    p.px(12, 17 + bob, SENT.shadow); // rebites
    p.px(19, 17 + bob, SENT.shadow);
  } else {
    // barra MUITO esfarrapada
    p.px(12, 25 + bob, SENT.shadow);
    p.px(16, 25 + bob, SENT.shadow);
    p.px(18, 24 + bob, SENT.dark);
  }
}

/** Sombra: gibão de couro com painéis DIAGONAIS + echarpe esvoaçando. */
function gibaoSombra(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // echarpe esvoaçando atrás em curva
    p.rect(9, 14 + bob, 2, 1, SENT.dark);
    p.px(8, 15 + bob, SENT.shadow);
    p.px(7, 16 + bob, SENT.shadow);
    p.px(7, 17 + bob, SENT.dark); // ponta dupla
    // torso fino que AFINA na cintura (curva)
    run(p, 13, 14 + bob, 5, SENT.light, SENT.base, SENT.base);
    run(p, 13, 15 + bob, 5, SENT.light, SENT.base, SENT.dark);
    run(p, 13, 16 + bob, 5, SENT.light, SENT.base, SENT.dark);
    run(p, 14, 17 + bob, 4, SENT.light, SENT.base, SENT.dark);
    run(p, 14, 18 + bob, 4, SENT.base, SENT.base, SENT.dark);
    run(p, 13, 19 + bob, 5, SENT.light, SENT.base, SENT.dark);
    run(p, 13, 20 + bob, 5, SENT.base, SENT.dark, SENT.dark);
    p.rect(14, 16 + bob, 4, 1, PAL.bootsDark); // tira diagonal
    p.rect(13, 21 + bob, 5, 1, PAL.belt);
    p.px(14, 21 + bob, PAL.buckle);
    p.rect(13, 22 + bob, 5, 1, SENT.shadow);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 16 + bob, 2, 4, SENT.dark);
    p.px(15 + swing, 17 + bob, SENT.shadow); // dobra do braço
    return;
  }
  const back = facing === "n";
  // torso FINO com cintura (curva côncava — forma de gota invertida)
  run(p, 12, 14 + bob, 8, SENT.light, SENT.base, SENT.base);
  run(p, 12, 15 + bob, 8, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  run(p, 12, 16 + bob, 8, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  run(p, 13, 17 + bob, 6, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  run(p, 13, 18 + bob, 6, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  run(p, 13, 19 + bob, 6, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  run(p, 12, 20 + bob, 8, SENT.base, back ? SENT.dark : SENT.base, SENT.dark);
  if (!back) {
    // painel diagonal de couro (costura) + dobra de axila
    for (let i = 0; i < 6; i++) p.px(13 + i, 15 + bob + i, PAL.bootsDark);
    p.px(16, 18 + bob, PAL.buckle); // fivela da tira
    p.px(13, 16 + bob, SENT.shadow); // axila
    p.px(18, 16 + bob, SENT.shadow);
    // bainha de adaga
    p.rect(19, 19 + bob, 1, 3, PAL.bootsDark);
    p.px(19, 18 + bob, SENT.edge);
  } else {
    for (let i = 0; i < 6; i++) p.px(18 - i, 15 + bob + i, PAL.bootsDark);
    p.px(15, 17 + bob, SENT.shadow); // dobra das costas
  }
  // echarpe: nó + cauda esvoaçando em CURVA para fora
  p.rect(10, 14 + bob, 3, 1, SENT.dark);
  p.px(9, 15 + bob, SENT.shadow);
  p.rect(8, 16 + bob, 2, 1, SENT.shadow);
  p.px(7, 17 + bob, SENT.dark);
  p.px(8, 18 + bob, SENT.shadow); // ponta dupla ao vento
  // cinto baixo com bolsa
  p.rect(12, 21 + bob, 8, 1, PAL.belt);
  p.px(14, 21 + bob, PAL.buckle);
  p.rect(17, 22 + bob, 2, 1, PAL.bootsDark);
  p.px(17, 23 + bob, PAL.bootsDark); // bolsa caindo
  p.rect(12, 22 + bob, 4, 1, SENT.shadow);
  // braços finos
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(10, 16 + bob + armL, 2, 4, SENT.dark);
  p.px(10, 17 + bob + armL, SENT.shadow);
  p.rect(20, 16 + bob - armL, 2, 4, SENT.dark);
  p.px(21, 17 + bob - armL, SENT.shadow);
}

/** Arcano: robe em SINO com barra ondulada e mangas enormes caídas. */
function robeArcano(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // robe alargando em curva real
    run(p, 13, 14 + bob, 5, SENT.light, SENT.base, SENT.base);
    for (let y = 15 + bob; y <= 19 + bob; y++) {
      const s = Math.floor((y - 15 - bob) / 2);
      run(p, 13 - s, y, 6 + s, SENT.light, SENT.base, SENT.dark);
    }
    for (let y = 20 + bob; y <= 24 + bob; y++) {
      const s = Math.floor((y - 15 - bob) / 2);
      run(p, 13 - s, y, 7 + s, SENT.light, SENT.base, SENT.dark);
    }
    p.px(15, 18 + bob, SENT.dark); // dobra
    p.px(13, 22 + bob, SENT.shadow);
    // barra ondulada
    p.px(10, 25 + bob, SENT.shadow);
    p.rect(11, 25 + bob, 4, 1, SENT.dark);
    p.px(15, 26 + bob, SENT.shadow);
    p.rect(16, 25 + bob, 4, 1, SENT.dark);
    p.px(12, 25 + bob, SENT.shine); // runa
    // manga enorme caída
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(14 + swing, 16 + bob, 4, 3, SENT.dark);
    run(p, 13 + swing, 19 + bob, 6, SENT.base, SENT.dark, SENT.shadow);
    p.px(14 + swing, 17 + bob, SENT.shadow); // boca da manga
    return;
  }
  const back = facing === "n";
  // ombros caídos (curva, não linha)
  run(p, 13, 14 + bob, 6, SENT.light, SENT.base, SENT.base);
  // corpo em SINO: alarga progressivamente com dobras
  for (let y = 15 + bob; y <= 24 + bob; y++) {
    const s = Math.min(4, Math.floor((y - 14 - bob) / 2));
    run(p, 13 - s, y, 6 + s * 2, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  }
  if (!back) {
    p.rect(15, 15 + bob, 2, 9, SENT.dark); // abertura central
    p.px(15, 17 + bob, SENT.shadow);
    p.px(16, 20 + bob, SENT.shadow);
    p.rect(11, 19 + bob, 10, 1, SENT.shadow); // faixa
    // dobras do pano caindo
    p.px(12, 21 + bob, SENT.dark);
    p.px(19, 22 + bob, SENT.shadow);
    // runas na barra
    p.px(11, 23 + bob, SENT.shine);
    p.px(15, 24 + bob, SENT.shine);
    p.px(20, 23 + bob, SENT.shine);
  } else {
    p.rect(15, 16 + bob, 1, 8, SENT.shadow); // vinco das costas
    p.px(13, 20 + bob, SENT.shadow);
    p.px(18, 22 + bob, SENT.shadow);
  }
  // barra ONDULADA (zigue de pano, não régua)
  p.px(8, 25 + bob, SENT.shadow);
  p.rect(9, 25 + bob, 5, 1, SENT.dark);
  p.px(14, 26 + bob, SENT.shadow);
  p.rect(15, 25 + bob, 5, 1, SENT.dark);
  p.px(20, 26 + bob, SENT.shadow);
  p.rect(21, 25 + bob, 3, 1, SENT.dark);
  // MANGAS-SINO com boca aberta
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(9, 15 + bob + armL, 2, 2, SENT.base);
  run(p, 7, 17 + bob + armL, 4, SENT.light, SENT.dark, SENT.dark);
  run(p, 6, 18 + bob + armL, 5, SENT.base, SENT.dark, SENT.shadow);
  p.rect(7, 19 + bob + armL, 4, 1, SENT.shadow); // boca da manga
  p.rect(21, 15 + bob - armL, 2, 2, SENT.dark);
  run(p, 21, 17 + bob - armL, 4, SENT.base, SENT.dark, SENT.dark);
  run(p, 21, 18 + bob - armL, 5, SENT.base, SENT.dark, SENT.shadow);
  p.rect(21, 19 + bob - armL, 4, 1, SENT.shadow);
}

/** Aurora: hábito longo com PREGAS, estola e corda — pano que CAI. */
function tunicaAurora(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    run(p, 13, 14 + bob, 5, SENT.light, SENT.base, SENT.base);
    for (let y = 15 + bob; y <= 25 + bob; y++) {
      const s = y - bob >= 21 ? 1 : 0; // leve abertura embaixo
      run(p, 12 - s, y, 7 + s, SENT.light, SENT.base, SENT.dark);
    }
    p.rect(17, 15 + bob, 1, 10, SENT.shine); // estola
    p.px(14, 18 + bob, SENT.dark); // prega
    p.px(13, 22 + bob, SENT.dark);
    p.rect(12, 20 + bob, 7, 1, PAL.dirtLight); // corda
    p.px(11, 26 + bob, SENT.shadow); // barra ondulada
    p.rect(12, 26 + bob, 6, 1, SENT.shadow);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 16 + bob, 2, 4, SENT.dark);
    return;
  }
  const back = facing === "n";
  // ombros suaves
  run(p, 12, 14 + bob, 8, SENT.light, SENT.base, SENT.base);
  // coluna que abre LEVEMENTE (pano caindo, com pregas)
  for (let y = 15 + bob; y <= 25 + bob; y++) {
    const s = y - bob >= 22 ? 1 : 0;
    run(p, 11 - s, y, 10 + s * 2, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  }
  if (!back) {
    // ESTOLA dupla com pontas
    p.rect(14, 15 + bob, 1, 9, SENT.shine);
    p.rect(17, 15 + bob, 1, 9, SENT.shine);
    p.px(14, 24 + bob, SENT.edge);
    p.px(17, 24 + bob, SENT.edge);
    // pregas do pano
    p.px(12, 18 + bob, SENT.dark);
    p.px(19, 21 + bob, SENT.shadow);
    p.px(13, 23 + bob, SENT.dark);
    // corda com nó caindo
    p.rect(11, 20 + bob, 10, 1, PAL.dirtLight);
    p.px(13, 21 + bob, PAL.dirtLight);
    p.px(13, 22 + bob, PAL.dirtLight);
    p.px(13, 23 + bob, "#8a7350");
  } else {
    p.rect(15, 16 + bob, 1, 9, SENT.shadow); // prega central
    p.px(12, 19 + bob, SENT.shadow);
    p.px(18, 22 + bob, SENT.shadow);
    p.rect(11, 20 + bob, 10, 1, PAL.dirtLight);
  }
  // barra ondulada
  p.px(10, 26 + bob, SENT.shadow);
  p.rect(11, 26 + bob, 4, 1, SENT.shadow);
  p.px(15, 27 + bob, SENT.shadow);
  p.rect(16, 26 + bob, 5, 1, SENT.shadow);
  // mangas com queda
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(9, 15 + bob + armL, 2, 4, SENT.dark);
  p.px(9, 19 + bob + armL, SENT.shadow);
  p.px(10, 20 + bob + armL, SENT.shadow); // boca da manga caída
  p.rect(21, 15 + bob - armL, 2, 4, SENT.dark);
  p.px(22, 19 + bob - armL, SENT.shadow);
  p.px(21, 20 + bob - armL, SENT.shadow);
}

/** Cidadão: colete ABERTO sobre camisa folgada, mangas arregaçadas. */
function camisaCidadao(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    run(p, 13, 14 + bob, 5, SENT.light, SENT.base, SENT.base);
    for (let y = 15 + bob; y <= 19 + bob; y++) {
      run(p, 13, y, 5, SENT.light, SENT.base, SENT.dark);
    }
    p.px(13, 15 + bob, SENT.shadow); // colete
    p.rect(13, 16 + bob, 1, 4, SENT.shadow);
    run(p, 13, 20 + bob, 5, SENT.base, SENT.base, SENT.dark); // camisa solta sobre o cinto
    p.rect(13, 21 + bob, 5, 1, PAL.belt);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 15 + bob, 2, 3, SENT.base);
    p.rect(15 + swing, 18 + bob, 2, 3, PAL.skin); // antebraço
    return;
  }
  const back = facing === "n";
  // camisa FOLGADA (alarga embaixo — pano, não bloco)
  run(p, 12, 14 + bob, 8, SENT.light, SENT.base, SENT.base);
  for (let y = 15 + bob; y <= 19 + bob; y++) {
    run(p, 12, y, 8, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  }
  run(p, 11, 20 + bob, 10, SENT.light, back ? SENT.dark : SENT.base, SENT.dark); // sobra do pano
  if (!back) {
    // COLETE aberto (painéis escuros dos lados, camisa no meio)
    p.rect(12, 15 + bob, 2, 5, SENT.shadow);
    p.rect(18, 15 + bob, 2, 5, SENT.shadow);
    p.px(13, 19 + bob, SENT.dark); // ponta do colete
    p.px(18, 19 + bob, SENT.dark);
    // gola V + cordão
    p.px(15, 14 + bob, SENT.dark);
    p.px(16, 14 + bob, SENT.dark);
    p.px(16, 15 + bob, PAL.dirtLight);
    // dobra da camisa
    p.px(15, 18 + bob, SENT.dark);
  } else {
    p.rect(12, 15 + bob, 2, 5, SENT.shadow); // costas do colete
    p.rect(18, 15 + bob, 2, 5, SENT.shadow);
    p.px(15, 17 + bob, SENT.dark);
  }
  p.rect(11, 21 + bob, 10, 1, PAL.belt);
  p.px(15, 21 + bob, PAL.buckle);
  // mangas ARREGAÇADAS com dobra
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(9, 15 + bob + armL, 2, 3, SENT.base);
  p.px(9, 17 + bob + armL, SENT.dark); // dobra da manga
  p.rect(9, 18 + bob + armL, 2, 3, PAL.skin);
  p.rect(21, 15 + bob - armL, 2, 3, SENT.dark);
  p.px(22, 17 + bob - armL, SENT.shadow);
  p.rect(21, 18 + bob - armL, 2, 3, PAL.skin);
}

// ──────────────────────────────────────────────────────────────────────
// PERNAS (pés na linha y30)
// ──────────────────────────────────────────────────────────────────────

/** Grevas de Alvorada: COXA-PLACA → joelheira saliente → canela → sabatão. */
function grevasAlvorada(p: Px, facing: PartFacing, frame: number): void {
  if (facing === "e") {
    const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    for (const [x, s] of [
      [13 - stride, -1],
      [16 + stride, 1],
    ] as const) {
      const lit = s > 0;
      // coxa-placa
      run(p, x, 24, 3, lit ? SENT.light : SENT.base, lit ? SENT.base : SENT.dark, SENT.dark);
      run(p, x, 25, 3, lit ? SENT.light : SENT.base, lit ? SENT.base : SENT.dark, SENT.dark);
      // joelheira saliente
      p.px(x, 26, SENT.edge);
      p.px(x + 1, 26, lit ? SENT.base : SENT.dark);
      // canela
      run(p, x, 27, 3, lit ? SENT.base : SENT.dark, lit ? SENT.base : SENT.dark, SENT.shadow);
      // sabatão com cano
      p.px(x, 28, SENT.edge);
      p.rect(x, 28, 3, 1, lit ? SENT.dark : SENT.shadow);
      run(p, x - (lit ? 0 : 1), 29, 4, SENT.dark, SENT.shadow, SENT.shadow);
      p.rect(x - (lit ? 0 : 1), 30, 4, 1, "#15151a");
    }
    return;
  }
  const leftUp = frame === 1 ? 1 : 0;
  const rightUp = frame === 2 ? 1 : 0;
  // perna esquerda (lit)
  run(p, 12, 24 - leftUp, 3, SENT.light, SENT.base, SENT.dark); // coxa-placa
  run(p, 12, 25 - leftUp, 3, SENT.light, SENT.base, SENT.dark);
  p.px(12, 26 - leftUp, SENT.edge); // joelheira saliente
  p.px(13, 26 - leftUp, SENT.base);
  p.px(14, 26 - leftUp, SENT.dark);
  run(p, 12, 27 - leftUp, 3, SENT.base, SENT.base, SENT.dark); // canela
  p.rect(12, 28 - leftUp, 3, 1, SENT.dark); // cano do sabatão
  p.px(12, 28 - leftUp, SENT.edge);
  run(p, 11, 29 - leftUp, 4, SENT.dark, SENT.shadow, SENT.shadow); // pé largo
  p.rect(11, 30 - leftUp, 4, 1, "#15151a");
  // perna direita (sombra)
  run(p, 17, 24 - rightUp, 3, SENT.base, SENT.dark, SENT.dark);
  run(p, 17, 25 - rightUp, 3, SENT.base, SENT.dark, SENT.dark);
  p.px(17, 26 - rightUp, SENT.light); // joelheira pega luz
  p.px(18, 26 - rightUp, SENT.dark);
  p.px(19, 26 - rightUp, SENT.shadow);
  run(p, 17, 27 - rightUp, 3, SENT.dark, SENT.dark, SENT.shadow);
  p.rect(17, 28 - rightUp, 3, 1, SENT.shadow);
  p.px(17, 28 - rightUp, SENT.base);
  run(p, 17, 29 - rightUp, 4, SENT.dark, SENT.shadow, SENT.shadow);
  p.rect(17, 30 - rightUp, 4, 1, "#15151a");
}

const grevasOuro: PartDrawFn = (p, f, fr) => {
  grevasAlvorada(p, f, fr);
  if (f !== "e") {
    p.px(13, 24, SENT.shine);
    p.px(18, 24, SENT.shine);
    p.px(12, 27, SENT.edge);
    p.px(19, 27, SENT.edge);
  }
};

const grevasVigilia: PartDrawFn = (p, f, fr) => {
  grevasAlvorada(p, f, fr);
  if (f !== "e") {
    p.px(12, 26, SENT.shadow);
    p.px(19, 26, SENT.shadow);
    p.px(14, 28, SENT.shadow); // tira
  }
};

/** Calça da Sombra: coxa→canela AFINANDO + faixas diagonais + bota macia. */
function calcaSombra(p: Px, facing: PartFacing, frame: number): void {
  if (facing === "e") {
    const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    for (const [x, s] of [
      [14 - stride, -1],
      [16 + stride, 1],
    ] as const) {
      const lit = s > 0;
      run(p, x, 24, 3, lit ? SENT.light : SENT.base, lit ? SENT.base : SENT.dark, SENT.dark); // coxa
      run(p, x, 25, 3, lit ? SENT.base : SENT.dark, lit ? SENT.base : SENT.dark, SENT.dark);
      p.rect(x, 26, 2, 2, lit ? SENT.base : SENT.dark); // canela fina
      p.px(x + 1, 26, SENT.shadow); // faixa
      p.px(x, 27, SENT.shadow); // faixa diagonal
      p.rect(x, 28, 2, 1, SENT.dark); // dobra da bota macia
      p.rect(x, 29, 2, 1, SENT.shadow);
      p.rect(x, 30, 2, 1, "#15151a");
    }
    return;
  }
  const leftUp = frame === 1 ? 1 : 0;
  const rightUp = frame === 2 ? 1 : 0;
  // esquerda: coxa 3px afinando para canela 2px
  run(p, 12, 24 - leftUp, 3, SENT.light, SENT.base, SENT.dark);
  run(p, 13, 25 - leftUp, 2, SENT.light, SENT.base, SENT.base);
  p.rect(13, 26 - leftUp, 2, 2, SENT.base);
  p.px(13, 26 - leftUp, SENT.shadow); // faixa
  p.px(14, 27 - leftUp, SENT.shadow); // faixa diagonal
  p.rect(13, 28 - leftUp, 2, 1, SENT.dark); // dobra do cano macio
  p.rect(13, 29 - leftUp, 2, 1, SENT.shadow);
  p.rect(13, 30 - leftUp, 2, 1, "#15151a");
  // direita (sombra)
  run(p, 17, 24 - rightUp, 3, SENT.base, SENT.dark, SENT.dark);
  run(p, 17, 25 - rightUp, 2, SENT.base, SENT.dark, SENT.dark);
  p.rect(17, 26 - rightUp, 2, 2, SENT.dark);
  p.px(18, 25 - rightUp, SENT.shadow);
  p.px(17, 27 - rightUp, SENT.shadow);
  p.rect(17, 28 - rightUp, 2, 1, SENT.shadow);
  p.rect(17, 29 - rightUp, 2, 1, SENT.shadow);
  p.rect(17, 30 - rightUp, 2, 1, "#15151a");
}

/** Calça de Cidadão: pano FOLGADO (boca larga) sobre sapato baixo. */
function calcaCidadao(p: Px, facing: PartFacing, frame: number): void {
  if (facing === "e") {
    const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    for (const [x, s] of [
      [13 - stride, -1],
      [16 + stride, 1],
    ] as const) {
      const lit = s > 0;
      run(p, x, 24, 3, lit ? SENT.light : SENT.base, lit ? SENT.base : SENT.dark, SENT.dark);
      run(p, x, 25, 3, lit ? SENT.light : SENT.base, lit ? SENT.base : SENT.dark, SENT.dark);
      p.px(x + 1, 26, SENT.shadow); // dobra do joelho
      run(p, x, 26, 3, lit ? SENT.base : SENT.dark, lit ? SENT.base : SENT.dark, SENT.dark);
      run(p, x, 27, 3, lit ? SENT.base : SENT.dark, lit ? SENT.base : SENT.dark, SENT.shadow);
      p.rect(x, 28, 3, 1, SENT.dark); // boca folgada da calça
      p.px(x + 2, 28, SENT.shadow);
      p.rect(x, 29, 3, 1, PAL.bootsDark); // sapato baixo
      p.rect(x, 30, 3, 1, "#15151a");
    }
    return;
  }
  const leftUp = frame === 1 ? 1 : 0;
  const rightUp = frame === 2 ? 1 : 0;
  // esquerda (lit), pano com dobras
  run(p, 12, 24 - leftUp, 3, SENT.light, SENT.base, SENT.dark);
  run(p, 12, 25 - leftUp, 3, SENT.light, SENT.base, SENT.dark);
  p.px(13, 26 - leftUp, SENT.shadow); // dobra do joelho
  run(p, 12, 26 - leftUp, 3, SENT.base, SENT.base, SENT.dark);
  run(p, 12, 27 - leftUp, 3, SENT.base, SENT.base, SENT.dark);
  p.rect(12, 28 - leftUp, 3, 1, SENT.dark); // boca folgada
  p.px(11, 28 - leftUp, SENT.dark);
  p.rect(12, 29 - leftUp, 3, 1, PAL.bootsDark); // sapato
  p.rect(12, 30 - leftUp, 3, 1, "#15151a");
  // direita (sombra) com remendo
  run(p, 17, 24 - rightUp, 3, SENT.base, SENT.dark, SENT.dark);
  run(p, 17, 25 - rightUp, 3, SENT.base, SENT.dark, SENT.dark);
  p.px(18, 25 - rightUp, SENT.light); // remendo
  run(p, 17, 26 - rightUp, 3, SENT.dark, SENT.dark, SENT.shadow);
  run(p, 17, 27 - rightUp, 3, SENT.dark, SENT.dark, SENT.shadow);
  p.rect(17, 28 - rightUp, 3, 1, SENT.shadow);
  p.px(20, 28 - rightUp, SENT.shadow);
  p.rect(17, 29 - rightUp, 3, 1, PAL.bootsDark);
  p.rect(17, 30 - rightUp, 3, 1, "#15151a");
}

/** Saiote/saia: pano que ABRE em sino com barra ondulada; pés embaixo. */
function skirtLegs(p: Px, facing: PartFacing, frame: number, long: boolean): void {
  const hem = long ? 28 : 27;
  const sway = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  if (facing === "e") {
    for (let y = 24; y <= hem; y++) {
      const s = Math.floor((y - 24) / 2);
      run(p, 13 - s, y, 6 + s * 2, SENT.light, SENT.base, SENT.dark);
    }
    p.px(14, 25, SENT.dark); // prega
    // barra ondulada
    p.px(11, hem + 1, SENT.shadow);
    p.rect(12, hem + 1, 4, 1, SENT.dark);
    p.px(16, hem + 2, SENT.shadow);
    p.rect(17, hem + 1, 3, 1, SENT.dark);
    p.rect(14 + sway, hem + 2, 2, 1, PAL.bootsDark);
    p.rect(17 - sway, hem + 2, 2, 1, PAL.bootsDark);
    return;
  }
  const back = facing === "n";
  for (let y = 24; y <= hem; y++) {
    const s = Math.floor((y - 24) / 2);
    run(p, 12 - s, y, 8 + s * 2, SENT.light, back ? SENT.dark : SENT.base, SENT.dark);
  }
  if (!back) {
    p.rect(15 + sway, 24, 1, hem - 23, SENT.dark); // prega central
    p.px(13, 26, SENT.dark); // pregas laterais
    p.px(18, 27, SENT.shadow);
  }
  // barra ONDULADA com pontas
  p.px(10, hem + 1, SENT.shadow);
  p.rect(11, hem + 1, 4, 1, SENT.dark);
  p.px(15, hem + 2, SENT.shadow);
  p.rect(16, hem + 1, 5, 1, SENT.dark);
  p.px(21, hem + 2, SENT.shadow);
  p.rect(13, hem + 2, 2, 1, PAL.bootsDark);
  p.rect(17, hem + 2, 2, 1, PAL.bootsDark);
}

const saioteArcano: PartDrawFn = (p, f, fr) => skirtLegs(p, f, fr, false);
const saiaAurora: PartDrawFn = (p, f, fr) => skirtLegs(p, f, fr, true);

// ──────────────────────────────────────────────────────────────────────
// Registro: partId → função de desenho (ids do catálogo shared/outfits.ts)
// ──────────────────────────────────────────────────────────────────────

export const PART_DRAW: Record<string, PartDrawFn> = {
  elmo_alvorada: elmoAlvorada,
  peitoral_alvorada: peitoralAlvorada,
  grevas_alvorada: grevasAlvorada,
  capuz_sombra: capuzSombra,
  gibao_sombra: gibaoSombra,
  calca_sombra: calcaSombra,
  chapeu_arcano: chapeuArcano,
  robe_arcano: robeArcano,
  saiote_arcano: saioteArcano,
  coifa_aurora: coifaAurora,
  tunica_aurora: tunicaAurora,
  saia_aurora: saiaAurora,
  cabeca_cidadao: cabecaCidadao,
  camisa_cidadao: camisaCidadao,
  calca_cidadao: calcaCidadao,
  elmo_ouro: elmoOuro,
  peitoral_ouro: peitoralOuro,
  grevas_ouro: grevasOuro,
  elmo_vigilia: elmoVigilia,
  peitoral_vigilia: peitoralVigilia,
  grevas_vigilia: grevasVigilia,
};

// ──────────────────────────────────────────────────────────────────────
// Equipamento segurado (NÃO é outfit — cores fixas; por arma equipada)
// ──────────────────────────────────────────────────────────────────────

/** Espada + escudo do kit do Knight (templateId "espada_curta"). ✏️ demais armas. */
export function drawHeldEquipment(
  p: Px,
  facing: PartFacing,
  frame: number,
  weaponTemplateId: string | null,
): void {
  if (weaponTemplateId !== "espada_curta") return; // ✏️ cajado/adaga/cetro futuros
  const bob = bobOf(frame);
  if (facing === "s") {
    const armSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(22, 19 + bob + armSwing, 2, 1, PAL.armorShadow); // manopla
    p.rect(22, 20 + bob + armSwing, 3, 1, PAL.buckle); // guarda
    p.rect(23, 21 + bob + armSwing, 1, 7, PAL.swordBlade);
    p.px(23, 28 + bob + armSwing, PAL.swordDark);
    // escudo de madeira (tábuas + umbo)
    p.rect(6, 16 + bob, 3, 1, PAL.shieldWoodLight);
    for (let y = 17 + bob; y <= 21 + bob; y++) {
      p.px(5, y, PAL.shieldWoodLight);
      p.rect(6, y, 3, 1, PAL.shieldWood);
      p.px(9, y, PAL.shieldWoodDark);
    }
    p.px(7, 19 + bob, PAL.shieldWoodDark); // junta de tábua
    p.rect(6, 22 + bob, 3, 1, PAL.shieldWood);
    p.rect(6, 23 + bob, 3, 1, PAL.shieldWoodDark);
    p.px(7, 24 + bob, PAL.shieldWoodDark);
    p.rect(7, 18 + bob, 1, 1, PAL.armorShine); // umbo
    return;
  }
  if (facing === "n") {
    p.rect(23, 15 + bob, 1, 7, PAL.shieldWood);
    p.px(23, 15 + bob, PAL.shieldWoodLight);
    p.px(23, 21 + bob, PAL.shieldWoodDark);
    p.px(8, 18 + bob, PAL.buckle);
    p.rect(8, 19 + bob, 1, 2, PAL.shieldRim);
    return;
  }
  // EAST: escudo avançado
  p.rect(19, 15 + bob, 3, 1, PAL.shieldWoodLight);
  for (let y = 16 + bob; y <= 21 + bob; y++) {
    p.px(19, y, PAL.shieldWoodDark);
    p.rect(20, y, 2, 1, PAL.shieldWood);
    p.px(22, y, PAL.shieldWoodDark);
  }
  p.rect(20, 22 + bob, 2, 1, PAL.shieldWoodDark);
  p.px(21, 23 + bob, PAL.shieldWoodDark);
  p.px(20, 18 + bob, PAL.armorShine);
}
