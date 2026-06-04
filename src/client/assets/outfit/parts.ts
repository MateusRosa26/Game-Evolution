/**
 * Desenho procedural das PEÇAS de outfit (catálogo em shared/outfits.ts).
 *
 * Cada peça é desenhada com os SENTINELAS de `sentinels.ts` (recoloridos na
 * composição). Pixels FIXOS (pele, brasa, couro de cinto) usam PAL direto.
 *
 * ESQUELETO 32×32 (contrato entre as peças — pés na linha y30):
 *   cabeça y3–13 (rosto x12–19 y7–12) · torso y14–23 · pernas y24–30
 *   bob = -1 nos passos (cabeça+torso); luz global topo-esquerda.
 *
 * REGRA DE OURO DA RÉGUA: cada SET tem uma SILHUETA própria —
 *   alvorada = triângulo largo · sombra = fino assimétrico · arcano = forma-A
 *   aurora = coluna vertical · cidadão = pequeno/redondo · ouro = coroado
 *   vigília = espinhado. Silhueta > detalhe.
 */
import { PAL } from "../palette";
import type { Px } from "../sprites";
import { SENT } from "./sentinels";

export type PartFacing = "s" | "n" | "e";

export type PartDrawFn = (p: Px, facing: PartFacing, frame: number) => void;

const bobOf = (frame: number): number => (frame === 0 ? 0 : -1);

// ──────────────────────────────────────────────────────────────────────
// Helpers comuns
// ──────────────────────────────────────────────────────────────────────

/** Rosto aberto GRANDE (apelo chibi): pele fixa, olhos com sobrancelha. */
function openFace(p: Px, bob: number, facing: PartFacing): void {
  if (facing === "s") {
    p.rect(12, 7 + bob, 8, 6, PAL.skin);
    p.rect(12, 12 + bob, 8, 1, PAL.skinShade); // queixo
    p.px(12, 7 + bob, PAL.skinShade); // cantos arredondados
    p.px(19, 7 + bob, PAL.skinShade);
    // olhos grandes com brilho
    p.rect(14, 9 + bob, 1, 2, "#20242e");
    p.rect(17, 9 + bob, 1, 2, "#20242e");
    p.px(14, 9 + bob, "#4a5468");
    p.px(17, 9 + bob, "#4a5468");
  } else if (facing === "e") {
    p.rect(13, 7 + bob, 7, 6, PAL.skin);
    p.rect(13, 12 + bob, 7, 1, PAL.skinShade);
    p.px(20, 9 + bob, PAL.skinShade); // nariz
    p.rect(17, 9 + bob, 1, 2, "#20242e"); // olho
  }
}

// ──────────────────────────────────────────────────────────────────────
// CABEÇAS
// ──────────────────────────────────────────────────────────────────────

/** Elmo de Alvorada: domo de aço LARGO com fresta em T — a muralha. */
function elmoAlvorada(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    p.rect(14, 3 + bob, 5, 1, SENT.edge);
    p.rect(13, 4 + bob, 7, 1, SENT.light);
    p.px(15, 3 + bob, SENT.shine);
    for (let y = 5 + bob; y <= 11 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 5, 1, SENT.base);
      p.px(19, y, SENT.dark);
    }
    p.rect(16, 7 + bob, 4, 1, PAL.visorSlit); // fresta frontal
    p.px(19, 8 + bob, PAL.visorSlit);
    p.rect(13, 12 + bob, 7, 1, SENT.dark);
    p.rect(14, 13 + bob, 5, 1, SENT.shadow);
    return;
  }
  // domo largo (x11–21)
  p.rect(13, 3 + bob, 6, 1, SENT.edge);
  p.rect(12, 4 + bob, 8, 1, SENT.light);
  p.px(15, 3 + bob, SENT.shine);
  for (let y = 5 + bob; y <= 11 + bob; y++) {
    p.rect(11, y, 2, 1, SENT.light);
    p.rect(13, y, 6, 1, SENT.base);
    p.rect(19, y, 2, 1, SENT.dark);
  }
  if (facing === "s") {
    // fresta em T larga
    p.rect(12, 7 + bob, 8, 1, PAL.visorSlit);
    p.rect(15, 8 + bob, 2, 3, PAL.visorSlit);
    // rebites na têmpora
    p.px(11, 8 + bob, SENT.edge);
    p.px(20, 8 + bob, SENT.shadow);
  } else {
    p.rect(15, 4 + bob, 1, 7, SENT.edge); // crista traseira
  }
  p.rect(12, 12 + bob, 8, 1, SENT.dark); // queixo
  p.rect(13, 13 + bob, 6, 1, SENT.shadow); // gola
}

/** Elmo Cerimonial: alvorada + CRISTA ALTA de desfile (silhueta coroada). */
function elmoOuro(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  elmoAlvorada(p, facing, frame);
  if (facing === "e") {
    // crista varrida para trás como juba
    p.rect(10, 1 + bob, 4, 1, SENT.shine);
    p.rect(9, 2 + bob, 5, 1, SENT.edge);
    p.rect(11, 3 + bob, 3, 1, SENT.light);
    p.px(8, 3 + bob, SENT.base);
  } else {
    // lâmina de crista central ALTA
    p.rect(15, 0 + bob, 2, 1, SENT.shine);
    p.rect(15, 1 + bob, 2, 1, SENT.edge);
    p.rect(15, 2 + bob, 2, 1, SENT.light);
    p.px(14, 1 + bob, SENT.edge);
    p.px(17, 1 + bob, SENT.base);
  }
}

/** Elmo da Vigília: CHIFRES curtos + fresta larga com brasas. */
function elmoVigilia(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  elmoAlvorada(p, facing, frame);
  if (facing === "e") {
    // chifre próximo curvando para trás
    p.px(13, 2 + bob, SENT.edge);
    p.px(12, 1 + bob, SENT.light);
    p.px(11, 1 + bob, SENT.base);
    p.px(18, 7 + bob, PAL.visorEmber);
    return;
  }
  // chifres para cima-fora
  p.px(11, 2 + bob, SENT.light);
  p.px(10, 1 + bob, SENT.edge);
  p.px(20, 2 + bob, SENT.base);
  p.px(21, 1 + bob, SENT.dark);
  if (facing === "s") {
    p.rect(12, 7 + bob, 8, 1, PAL.visorSlit);
    p.px(13, 7 + bob, PAL.visorEmber);
    p.px(18, 7 + bob, PAL.visorEmber);
  }
}

/** Capuz da Sombra: ponta LONGA caída para o lado — assimetria é a silhueta. */
function capuzSombra(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // ponta caindo para trás até a nuca
    p.px(15, 1 + bob, SENT.base);
    p.rect(13, 2 + bob, 3, 1, SENT.base);
    p.rect(11, 3 + bob, 3, 1, SENT.dark);
    p.rect(10, 4 + bob, 2, 1, SENT.shadow);
    p.px(9, 5 + bob, SENT.shadow); // pingo da ponta
    p.rect(14, 3 + bob, 5, 1, SENT.light);
    for (let y = 4 + bob; y <= 11 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.px(18, y, SENT.dark);
    }
    // abertura sombria com lasca de rosto
    p.rect(16, 7 + bob, 3, 4, PAL.visorSlit);
    p.px(16, 8 + bob, PAL.skinShade);
    p.rect(13, 12 + bob, 6, 1, SENT.dark);
    p.rect(13, 13 + bob, 7, 1, SENT.shadow); // echarpe no pescoço
    return;
  }
  // frente/costas: ponta cai para a ESQUERDA do viewer (assimétrico)
  p.px(15, 0 + bob, SENT.base);
  p.rect(13, 1 + bob, 3, 1, SENT.base);
  p.rect(11, 2 + bob, 3, 1, SENT.dark);
  p.px(10, 3 + bob, SENT.shadow);
  p.px(9, 4 + bob, SENT.shadow); // pingo
  p.rect(13, 3 + bob, 6, 1, SENT.light);
  for (let y = 4 + bob; y <= 11 + bob; y++) {
    p.rect(12, y, 2, 1, SENT.light);
    p.rect(14, y, 5, 1, SENT.base);
    p.px(19, y, SENT.dark);
  }
  if (facing === "s") {
    // rosto na penumbra, olhos frios brilhando
    p.rect(13, 7 + bob, 6, 5, PAL.visorSlit);
    p.px(14, 9 + bob, "#6a7488");
    p.px(17, 9 + bob, "#6a7488");
  } else {
    p.rect(13, 7 + bob, 6, 5, SENT.dark);
    p.rect(15, 7 + bob, 1, 5, SENT.shadow); // vinco
  }
  // echarpe enrolada no pescoço
  p.rect(12, 12 + bob, 8, 1, SENT.shadow);
  p.rect(13, 13 + bob, 6, 1, SENT.dark);
}

/** Chapéu Arcano: GRANDE — aba de 14px e cone alto torto. A silhueta do mago. */
function chapeuArcano(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    // cone alto inclinado para trás com quebra
    p.rect(9, 1 + bob, 3, 1, SENT.base);
    p.px(8, 2 + bob, SENT.dark); // ponta caída
    p.rect(11, 2 + bob, 3, 1, SENT.base);
    p.rect(13, 3 + bob, 3, 1, SENT.light);
    p.rect(13, 4 + bob, 4, 1, SENT.base);
    p.rect(14, 5 + bob, 4, 1, SENT.dark); // faixa
    p.rect(9, 6 + bob, 13, 1, SENT.light); // ABA larga
    p.rect(9, 7 + bob, 13, 1, SENT.dark);
    p.px(21, 6 + bob, SENT.edge);
    return;
  }
  // cone alto com quebra (ponta cai à esquerda)
  p.rect(11, 0 + bob, 3, 1, SENT.base);
  p.px(10, 1 + bob, SENT.dark); // pingo
  p.rect(13, 1 + bob, 3, 1, SENT.light);
  p.rect(13, 2 + bob, 4, 1, SENT.base);
  p.rect(14, 3 + bob, 4, 1, SENT.base);
  p.px(18, 3 + bob, SENT.dark);
  // faixa com broche
  p.rect(13, 5 + bob, 6, 1, SENT.shadow);
  if (facing === "s") p.px(15, 5 + bob, PAL.buckle);
  // ABA LARGA (x9–22, 14px) com curva
  p.rect(9, 6 + bob, 14, 1, SENT.light);
  p.px(9, 5 + bob, SENT.light);
  p.px(22, 5 + bob, SENT.base);
  p.rect(9, 7 + bob, 14, 1, SENT.dark);
  if (facing === "n") {
    p.rect(13, 8 + bob, 6, 4, PAL.hair);
    p.rect(13, 12 + bob, 6, 1, PAL.skinShade);
  }
}

/** Coifa da Aurora: capuz de hábito ERGUIDO emoldurando o rosto + véu. */
function coifaAurora(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    p.rect(13, 3 + bob, 6, 1, SENT.light);
    p.rect(12, 4 + bob, 2, 9, SENT.base); // lateral funda
    p.rect(14, 4 + bob, 5, 2, SENT.base);
    p.px(19, 5 + bob, SENT.dark);
    // véu caindo pelas costas
    p.rect(11, 6 + bob, 1, 8, SENT.dark);
    p.rect(10, 9 + bob, 1, 6, SENT.shadow);
    p.rect(13, 13 + bob, 6, 1, SENT.dark);
    return;
  }
  // capuz erguido: moldura funda ao redor do rosto
  p.rect(13, 2 + bob, 6, 1, SENT.light);
  p.rect(12, 3 + bob, 8, 1, SENT.base);
  p.px(15, 2 + bob, SENT.shine); // costura
  p.rect(11, 4 + bob, 2, 9, SENT.base);
  p.rect(19, 4 + bob, 2, 9, SENT.dark);
  p.rect(13, 4 + bob, 6, 2, SENT.base);
  p.px(11, 3 + bob, SENT.light);
  if (facing === "n") {
    p.rect(13, 6 + bob, 6, 7, SENT.base); // costas do capuz
    p.rect(15, 6 + bob, 1, 7, SENT.dark); // vinco
    // véu longo sobre as costas
    p.rect(12, 13 + bob, 8, 2, SENT.dark);
    p.rect(13, 15 + bob, 6, 1, SENT.shadow);
  }
  p.rect(12, 13 + bob, 8, 1, SENT.dark); // gola fechada
}

/** Cabelo de Cidadão: VOLUME de cabelo (sentinela = recolorível). */
function cabecaCidadao(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    p.rect(12, 3 + bob, 8, 4, SENT.base);
    p.rect(13, 3 + bob, 6, 1, SENT.light);
    p.rect(12, 5 + bob, 2, 6, SENT.base); // nuca
    p.px(12, 11 + bob, SENT.dark);
    p.px(19, 7 + bob, SENT.base); // mecha na testa
    return;
  }
  // coroa de cabelo com volume nas laterais
  p.rect(12, 3 + bob, 8, 4, SENT.base);
  p.rect(12, 3 + bob, 8, 1, SENT.light);
  p.px(13, 2 + bob, SENT.light);
  p.px(17, 2 + bob, SENT.light); // topete
  p.rect(11, 5 + bob, 1, 4, SENT.base);
  p.rect(20, 5 + bob, 1, 4, SENT.dark);
  if (facing === "s") {
    // franja em dentes sobre a testa
    p.px(13, 7 + bob, SENT.base);
    p.px(15, 7 + bob, SENT.dark);
    p.px(18, 7 + bob, SENT.base);
  } else {
    p.rect(12, 7 + bob, 8, 5, SENT.base);
    p.rect(12, 11 + bob, 8, 1, SENT.dark);
    p.rect(14, 12 + bob, 4, 1, PAL.skinShade); // pescoço
  }
}

// ──────────────────────────────────────────────────────────────────────
// TORSOS
// ──────────────────────────────────────────────────────────────────────

/** Alvorada: TRIÂNGULO — ombreiras massivas, peito largo, cintura afunilada. */
function peitoralAlvorada(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // capa atrás
    p.rect(9, 14 + bob, 2, 3, SENT.base);
    p.rect(9, 17 + bob, 2, 5, SENT.dark);
    p.px(8, 20 + bob, SENT.shadow);
    p.rect(9, 22 + bob, 2, 1, SENT.shadow);
    // torso
    for (let y = 16 + bob; y <= 20 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.rect(18, y, 2, 1, SENT.dark);
    }
    p.rect(12, 21 + bob, 8, 1, PAL.belt);
    p.px(15, 21 + bob, PAL.buckle);
    p.rect(12, 22 + bob, 8, 1, SENT.shadow); // tassets
    p.rect(13, 23 + bob, 6, 1, SENT.dark);
    // ombreira GRANDE em camadas
    p.rect(12, 14 + bob, 7, 1, SENT.edge);
    p.rect(12, 15 + bob, 7, 1, SENT.light);
    p.px(11, 15 + bob, SENT.light);
    return;
  }
  const back = facing === "n";
  if (back) {
    // capa cobre o corpo inteiro
    p.rect(11, 16 + bob, 10, 5, SENT.dark);
    p.rect(11, 14 + bob, 10, 2, SENT.base);
    p.rect(11, 21 + bob, 10, 3, SENT.shadow);
    p.rect(13, 16 + bob, 1, 5, SENT.shadow);
    p.rect(18, 16 + bob, 1, 5, SENT.shadow);
    p.px(11, 24 + bob, SENT.shadow);
    p.px(20, 24 + bob, SENT.shadow);
  } else {
    // peito LARGO afunilando: x10–22 em cima → x12–20 na cintura
    p.rect(13, 14 + bob, 6, 1, SENT.edge); // gorget
    for (let y = 15 + bob; y <= 17 + bob; y++) {
      p.rect(10, y, 3, 1, SENT.light);
      p.rect(13, y, 6, 1, SENT.base);
      p.rect(19, y, 3, 1, SENT.dark);
    }
    for (let y = 18 + bob; y <= 20 + bob; y++) {
      p.rect(11, y, 2, 1, SENT.light);
      p.rect(13, y, 6, 1, SENT.base);
      p.rect(19, y, 2, 1, SENT.dark);
    }
    p.rect(13, 15 + bob, 2, 2, SENT.light); // volume do peito
    p.px(16, 17 + bob, SENT.dark); // vinco central
    p.rect(11, 21 + bob, 10, 1, PAL.belt);
    p.rect(15, 21 + bob, 2, 1, PAL.buckle);
    // saiote de tassets (placas)
    p.rect(11, 22 + bob, 10, 1, SENT.shadow);
    p.rect(12, 23 + bob, 8, 1, SENT.dark);
    p.px(14, 23 + bob, SENT.shadow);
    p.px(17, 23 + bob, SENT.shadow);
  }
  // OMBREIRAS MASSIVAS (x8–12 / x20–24) — a base do triângulo
  p.rect(8, 14 + bob, 4, 1, SENT.edge);
  p.rect(8, 15 + bob, 4, 2, SENT.light);
  p.px(8, 17 + bob, SENT.base);
  p.rect(20, 14 + bob, 4, 1, SENT.light);
  p.rect(20, 15 + bob, 4, 2, SENT.base);
  p.px(23, 17 + bob, SENT.dark);
}

/** Ouro: alvorada + ombreiras-ASA erguidas + tassets duplos. */
function peitoralOuro(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  peitoralAlvorada(p, facing, frame);
  if (facing === "e") {
    p.px(12, 13 + bob, SENT.shine);
    p.px(11, 12 + bob, SENT.edge);
    return;
  }
  // asas das ombreiras subindo
  p.px(8, 13 + bob, SENT.shine);
  p.px(7, 12 + bob, SENT.edge);
  p.px(23, 13 + bob, SENT.edge);
  p.px(24, 12 + bob, SENT.base);
  if (facing === "s") {
    // friso central gravado
    p.rect(15, 15 + bob, 1, 5, SENT.shine);
    p.px(13, 19 + bob, SENT.shine);
    p.px(18, 19 + bob, SENT.shine);
  }
}

/** Vigília: alvorada + ESPINHOS nas ombreiras + capa esfarrapada. */
function peitoralVigilia(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  peitoralAlvorada(p, facing, frame);
  if (facing === "e") {
    p.px(13, 12 + bob, SENT.edge);
    p.px(13, 13 + bob, SENT.light);
    return;
  }
  // espinhos eretos nas ombreiras
  p.px(9, 13 + bob, SENT.edge);
  p.px(9, 12 + bob, SENT.light);
  p.px(22, 13 + bob, SENT.base);
  p.px(22, 12 + bob, SENT.dark);
  if (facing === "s") {
    p.px(12, 18 + bob, SENT.shadow); // rebites
    p.px(19, 18 + bob, SENT.shadow);
  } else {
    // barra da capa esfarrapada (dentes irregulares)
    p.px(12, 24 + bob, SENT.shadow);
    p.px(15, 24 + bob, SENT.dark);
    p.px(18, 24 + bob, SENT.shadow);
  }
}

/** Sombra: FINO e assimétrico — gibão justo + echarpe esvoaçando à esquerda. */
function gibaoSombra(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // echarpe esvoaçando atrás
    p.rect(9, 14 + bob, 2, 1, SENT.dark);
    p.rect(8, 15 + bob, 2, 1, SENT.shadow);
    p.px(7, 16 + bob, SENT.shadow);
    // torso FINO
    p.rect(13, 14 + bob, 5, 1, SENT.light);
    for (let y = 15 + bob; y <= 20 + bob; y++) {
      p.rect(13, y, 1, 1, SENT.light);
      p.rect(14, y, 3, 1, SENT.base);
      p.px(17, y, SENT.dark);
    }
    p.rect(13, 16 + bob, 5, 1, PAL.bootsDark); // tira
    p.rect(13, 21 + bob, 5, 1, PAL.belt);
    p.px(14, 21 + bob, PAL.buckle);
    p.rect(13, 22 + bob, 5, 1, SENT.shadow);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 16 + bob, 2, 4, SENT.dark); // braço
    return;
  }
  const back = facing === "n";
  // torso FINO (x12–20) — silhueta esguia
  p.rect(13, 14 + bob, 6, 1, SENT.light);
  for (let y = 15 + bob; y <= 20 + bob; y++) {
    p.rect(12, y, 1, 1, SENT.light);
    p.rect(13, y, 6, 1, back ? SENT.dark : SENT.base);
    p.px(19, y, SENT.dark);
  }
  // echarpe: nó no ombro esquerdo + cauda esvoaçando para fora
  p.rect(10, 14 + bob, 3, 1, SENT.dark);
  p.rect(9, 15 + bob, 2, 1, SENT.shadow);
  p.rect(8, 16 + bob, 2, 1, SENT.shadow);
  p.px(7, 17 + bob, SENT.dark); // ponta solta
  if (!back) {
    // tira a tiracolo com fivela + bainha de adaga
    for (let i = 0; i < 6; i++) p.px(13 + i, 15 + bob + i, PAL.bootsDark);
    p.px(16, 18 + bob, PAL.buckle);
    p.rect(20, 19 + bob, 1, 3, PAL.bootsDark);
    p.px(20, 18 + bob, SENT.edge); // cabo da adaga
  } else {
    for (let i = 0; i < 6; i++) p.px(18 - i, 15 + bob + i, PAL.bootsDark);
  }
  // cinto baixo com bolsa
  p.rect(12, 21 + bob, 8, 1, PAL.belt);
  p.px(14, 21 + bob, PAL.buckle);
  p.rect(17, 22 + bob, 2, 1, PAL.bootsDark); // bolsa
  p.rect(12, 22 + bob, 5, 1, SENT.shadow);
  // braços finos colados ao corpo
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(10, 16 + bob + armL, 2, 4, SENT.dark);
  p.rect(20, 16 + bob - armL, 2, 4, SENT.dark);
}

/** Arcano: FORMA-A — robe abre dos ombros à barra, mangas enormes. */
function robeArcano(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // robe alargando para baixo
    for (let y = 14 + bob; y <= 24 + bob; y++) {
      const spread = Math.floor((y - 14 - bob) / 3);
      p.rect(13 - spread, y, 2, 1, SENT.light);
      p.rect(15 - spread, y, 3 + spread, 1, SENT.base);
      p.rect(18, y, 2, 1, SENT.dark);
    }
    p.rect(11, 25 + bob, 9, 1, SENT.shadow); // orla
    p.px(12, 25 + bob, SENT.shine); // runa
    // manga enorme caída
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(14 + swing, 16 + bob, 4, 4, SENT.dark);
    p.rect(14 + swing, 20 + bob, 4, 1, SENT.shadow);
    return;
  }
  const back = facing === "n";
  // FORMA-A: ombros estreitos (x12–20) abrindo até a barra (x9–23)
  p.rect(13, 14 + bob, 6, 1, SENT.light); // ombros caídos
  for (let y = 15 + bob; y <= 24 + bob; y++) {
    const spread = Math.min(3, Math.floor((y - 15 - bob) / 3));
    p.rect(12 - spread, y, 2, 1, SENT.light);
    p.rect(14 - spread, y, 4 + spread * 2, 1, back ? SENT.dark : SENT.base);
    p.rect(18 + spread, y, 2, 1, SENT.dark);
  }
  if (!back) {
    p.rect(15, 15 + bob, 2, 9, SENT.dark); // abertura central
    p.rect(11, 19 + bob, 10, 1, SENT.shadow); // faixa de pano
    // runas na barra
    p.px(11, 23 + bob, SENT.shine);
    p.px(15, 24 + bob, SENT.shine);
    p.px(20, 23 + bob, SENT.shine);
  }
  p.rect(9, 25 + bob, 14, 1, SENT.shadow); // orla no chão
  // MANGAS ENORMES (sino)
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(8, 15 + bob + armL, 3, 3, SENT.base);
  p.rect(7, 18 + bob + armL, 4, 2, SENT.dark);
  p.rect(7, 20 + bob + armL, 4, 1, SENT.shadow);
  p.rect(21, 15 + bob - armL, 3, 3, SENT.dark);
  p.rect(21, 18 + bob - armL, 4, 2, SENT.dark);
  p.rect(21, 20 + bob - armL, 4, 1, SENT.shadow);
}

/** Aurora: COLUNA — vestimenta reta e longa, estola clara, corda na cintura. */
function tunicaAurora(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    p.rect(13, 14 + bob, 5, 1, SENT.light);
    for (let y = 15 + bob; y <= 25 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.rect(18, y, 1, 1, SENT.dark);
    }
    p.rect(17, 15 + bob, 1, 10, SENT.shine); // estola
    p.rect(12, 20 + bob, 7, 1, PAL.dirtLight); // corda
    p.rect(12, 26 + bob, 7, 1, SENT.shadow); // orla
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 16 + bob, 2, 4, SENT.dark);
    return;
  }
  const back = facing === "n";
  // coluna reta x11–21 descendo até y26 (vestimenta longa)
  p.rect(12, 14 + bob, 8, 1, SENT.light);
  for (let y = 15 + bob; y <= 25 + bob; y++) {
    p.rect(11, y, 2, 1, SENT.light);
    p.rect(13, y, 6, 1, back ? SENT.dark : SENT.base);
    p.rect(19, y, 2, 1, SENT.dark);
  }
  if (!back) {
    // ESTOLA clara dupla caindo do pescoço
    p.rect(14, 15 + bob, 1, 9, SENT.shine);
    p.rect(17, 15 + bob, 1, 9, SENT.shine);
    // corda com nó
    p.rect(11, 20 + bob, 10, 1, PAL.dirtLight);
    p.px(13, 21 + bob, PAL.dirtLight);
    p.px(13, 22 + bob, PAL.dirtLight);
  } else {
    p.rect(15, 15 + bob, 1, 10, SENT.shadow); // vinco das costas
    p.rect(11, 20 + bob, 10, 1, PAL.dirtLight);
  }
  p.rect(11, 26 + bob, 10, 1, SENT.shadow); // orla
  // mangas retas
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(9, 15 + bob + armL, 2, 5, SENT.dark);
  p.rect(9, 20 + bob + armL, 2, 1, SENT.shadow);
  p.rect(21, 15 + bob - armL, 2, 5, SENT.dark);
  p.rect(21, 20 + bob - armL, 2, 1, SENT.shadow);
}

/** Cidadão: COLETE escuro sobre camisa clara, mangas arregaçadas (pele). */
function camisaCidadao(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    p.rect(13, 14 + bob, 5, 1, SENT.light);
    for (let y = 15 + bob; y <= 20 + bob; y++) {
      p.px(13, y, SENT.shadow); // colete
      p.rect(14, y, 3, 1, SENT.base);
      p.px(17, y, SENT.shadow);
    }
    p.rect(13, 21 + bob, 5, 1, PAL.belt);
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 15 + bob, 2, 4, SENT.base);
    p.rect(15 + swing, 19 + bob, 2, 2, PAL.skin); // antebraço
    return;
  }
  const back = facing === "n";
  // camisa (clara) com COLETE (tons baixos) por cima
  p.rect(12, 14 + bob, 8, 1, SENT.light);
  for (let y = 15 + bob; y <= 20 + bob; y++) {
    p.rect(11, y, 2, 1, SENT.shadow); // colete esquerdo
    p.rect(13, y, 6, 1, back ? SENT.dark : SENT.base);
    p.rect(19, y, 2, 1, SENT.shadow); // colete direito
  }
  if (!back) {
    // gola V com cordão
    p.px(15, 14 + bob, SENT.shadow);
    p.px(16, 14 + bob, SENT.shadow);
    p.px(15, 15 + bob, SENT.dark);
    p.px(16, 16 + bob, PAL.dirtLight);
  }
  p.rect(11, 21 + bob, 10, 1, PAL.belt);
  p.px(15, 21 + bob, PAL.buckle);
  p.rect(11, 22 + bob, 10, 1, SENT.shadow);
  // mangas ARREGAÇADAS: ombro de pano + antebraço de pele
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(9, 15 + bob + armL, 2, 3, SENT.base);
  p.rect(9, 18 + bob + armL, 2, 3, PAL.skin);
  p.rect(21, 15 + bob - armL, 2, 3, SENT.dark);
  p.rect(21, 18 + bob - armL, 2, 3, PAL.skin);
}

// ──────────────────────────────────────────────────────────────────────
// PERNAS (pés na linha y30)
// ──────────────────────────────────────────────────────────────────────

/** Pernas padrão: calça + bota nos tons baixos da MESMA cor. */
function standardLegs(p: Px, facing: PartFacing, frame: number): void {
  if (facing === "e") {
    const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    for (const [x, s] of [
      [13 - stride, -1],
      [16 + stride, 1],
    ] as const) {
      p.rect(x, 24, 3, 4, s < 0 ? SENT.dark : SENT.base);
      p.rect(x, 28, 3, 2, SENT.shadow);
      p.rect(x, 30, 3, 1, "#15151a");
    }
    return;
  }
  const leftUp = frame === 1 ? 1 : 0;
  const rightUp = frame === 2 ? 1 : 0;
  p.rect(12, 24 - leftUp, 3, 4, SENT.base);
  p.rect(12, 28 - leftUp, 3, 2, SENT.shadow);
  p.rect(12, 30 - leftUp, 3, 1, "#15151a");
  p.rect(17, 24 - rightUp, 3, 4, SENT.dark);
  p.rect(17, 28 - rightUp, 3, 2, SENT.shadow);
  p.rect(17, 30 - rightUp, 3, 1, "#15151a");
}

/** Grevas de Alvorada: pernas BLINDADAS com joelheiras e botas largas. */
function grevasAlvorada(p: Px, facing: PartFacing, frame: number): void {
  standardLegs(p, facing, frame);
  if (facing !== "e") {
    p.px(13, 25, SENT.edge); // joelheiras
    p.px(18, 25, SENT.light);
    // botas mais largas (presença)
    p.px(11, 29, SENT.shadow);
    p.px(20, 29, SENT.shadow);
  } else {
    p.px(14, 25, SENT.edge);
    p.px(17, 25, SENT.edge);
  }
}

const grevasOuro: PartDrawFn = (p, f, fr) => {
  grevasAlvorada(p, f, fr);
  if (f !== "e") {
    p.px(13, 24, SENT.shine);
    p.px(18, 24, SENT.shine);
    p.px(13, 27, SENT.edge);
    p.px(18, 27, SENT.edge);
  }
};

const grevasVigilia: PartDrawFn = (p, f, fr) => {
  grevasAlvorada(p, f, fr);
  if (f !== "e") {
    p.px(12, 26, SENT.shadow);
    p.px(19, 26, SENT.shadow);
  }
};

/** Calça da Sombra: FINA com faixas enroladas nas canelas. */
function calcaSombra(p: Px, facing: PartFacing, frame: number): void {
  if (facing === "e") {
    const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    for (const [x, s] of [
      [14 - stride, -1],
      [16 + stride, 1],
    ] as const) {
      p.rect(x, 24, 2, 4, s < 0 ? SENT.dark : SENT.base);
      p.rect(x, 28, 2, 2, SENT.shadow);
      p.rect(x, 30, 2, 1, "#15151a");
      p.px(x, 26, SENT.shadow); // faixa
    }
    return;
  }
  const leftUp = frame === 1 ? 1 : 0;
  const rightUp = frame === 2 ? 1 : 0;
  // pernas FINAS (2px) — silhueta esguia do rogue
  p.rect(13, 24 - leftUp, 2, 4, SENT.base);
  p.rect(13, 28 - leftUp, 2, 2, SENT.shadow);
  p.rect(13, 30 - leftUp, 2, 1, "#15151a");
  p.rect(17, 24 - rightUp, 2, 4, SENT.dark);
  p.rect(17, 28 - rightUp, 2, 2, SENT.shadow);
  p.rect(17, 30 - rightUp, 2, 1, "#15151a");
  // faixas enroladas
  p.px(13, 26 - leftUp, SENT.shadow);
  p.px(18, 26 - rightUp, SENT.shadow);
  p.px(14, 27 - leftUp, SENT.shadow);
}

/** Calça de Cidadão: simples, com remendo. */
function calcaCidadao(p: Px, facing: PartFacing, frame: number): void {
  standardLegs(p, facing, frame);
  if (facing === "s") p.px(18, 26, SENT.light); // remendo
}

/** Saiote/saia: pano único; pés aparecem embaixo. (Pernas de robe/hábito.) */
function skirtLegs(p: Px, facing: PartFacing, frame: number, long: boolean): void {
  const hem = long ? 28 : 27;
  const sway = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  if (facing === "e") {
    for (let y = 24; y <= hem; y++) {
      const w = 6 + Math.floor((y - 24) / 2);
      const x = 13 - Math.floor((y - 24) / 3);
      p.rect(x, y, 2, 1, SENT.light);
      p.rect(x + 2, y, w - 3, 1, SENT.base);
      p.px(x + w - 1, y, SENT.dark);
    }
    p.rect(12, hem + 1, 8, 1, SENT.light);
    p.rect(12, hem + 2, 8, 1, SENT.shadow);
    p.rect(14 + sway, hem + 2, 2, 1, PAL.bootsDark);
    p.rect(17 - sway, hem + 2, 2, 1, PAL.bootsDark);
    return;
  }
  const back = facing === "n";
  for (let y = 24; y <= hem; y++) {
    const spread = Math.floor((y - 24) / 2);
    p.rect(12 - spread, y, 2, 1, SENT.light);
    p.rect(14 - spread, y, 4 + spread * 2, 1, back ? SENT.dark : SENT.base);
    p.rect(18 + spread, y, 2, 1, SENT.dark);
  }
  if (!back) p.rect(15 + sway, 24, 1, hem - 23, SENT.dark); // prega
  p.rect(11, hem + 1, 10, 1, SENT.light); // orla clara
  p.rect(11, hem + 2, 10, 1, SENT.shadow);
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
    // braço armado por cima (neutro escuro p/ ler contra qualquer torso)
    p.rect(22, 19 + bob + armSwing, 2, 1, PAL.armorShadow); // manopla
    p.rect(22, 20 + bob + armSwing, 3, 1, PAL.buckle); // guarda
    p.rect(23, 21 + bob + armSwing, 1, 7, PAL.swordBlade);
    p.px(23, 28 + bob + armSwing, PAL.swordDark);
    // escudo de madeira no braço esquerdo
    p.rect(6, 16 + bob, 3, 1, PAL.shieldWoodLight);
    for (let y = 17 + bob; y <= 21 + bob; y++) {
      p.px(5, y, PAL.shieldWoodLight);
      p.rect(6, y, 3, 1, PAL.shieldWood);
      p.px(9, y, PAL.shieldWoodDark);
    }
    p.rect(6, 22 + bob, 3, 1, PAL.shieldWood);
    p.rect(6, 23 + bob, 3, 1, PAL.shieldWoodDark);
    p.px(7, 24 + bob, PAL.shieldWoodDark);
    p.rect(7, 18 + bob, 1, 1, PAL.armorShine); // umbo
    p.px(7, 19 + bob, PAL.armorDark);
  } else if (facing === "n") {
    // borda do escudo no ombro direito (braço esq. do char) + bainha
    p.rect(23, 15 + bob, 1, 7, PAL.shieldWood);
    p.px(23, 15 + bob, PAL.shieldWoodLight);
    p.px(23, 21 + bob, PAL.shieldWoodDark);
    p.px(8, 18 + bob, PAL.buckle);
    p.rect(8, 19 + bob, 1, 2, PAL.shieldRim);
  } else {
    // escudo avançado na frente
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
}
