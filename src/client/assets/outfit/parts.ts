/**
 * Desenho procedural das PEÇAS de outfit (catálogo em shared/outfits.ts).
 *
 * Cada peça é desenhada com os SENTINELAS de `sentinels.ts` (recoloridos na
 * composição com o ramp da cor escolhida). Pixels FIXOS (pele, brasa, couro
 * de cinto) usam PAL direto e não são recoloríveis.
 *
 * Esqueleto comum 32×32 (todas as peças respeitam para compor):
 *   cabeça y3–12 · ombros/torso y13–22 · pernas y23–29 · bob = -1 nos passos.
 * Luz global do topo-esquerda (regra de ofício): esquerda lit, direita sombra.
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

/** Rosto aberto (peças de cabeça sem elmo): pele FIXA + olhos. */
function openFace(p: Px, bob: number, facing: PartFacing): void {
  if (facing === "s") {
    p.rect(13, 7 + bob, 6, 5, PAL.skin);
    p.rect(13, 11 + bob, 6, 1, PAL.skinShade);
    p.rect(14, 9 + bob, 1, 1, "#20242e");
    p.rect(17, 9 + bob, 1, 1, "#20242e");
  } else if (facing === "e") {
    p.rect(14, 7 + bob, 5, 5, PAL.skin);
    p.px(19, 8 + bob, PAL.skinShade); // nariz
    p.rect(17, 9 + bob, 1, 1, "#20242e"); // olho
    p.rect(14, 11 + bob, 5, 1, PAL.skinShade);
  }
  // "n": nuca coberta pela peça — nada de rosto.
}

/** Pernas padrão (calça + bota na MESMA cor da peça, bota nos tons baixos). */
function standardLegs(p: Px, facing: PartFacing, frame: number): void {
  if (facing === "e") {
    const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
    for (const [x, s] of [
      [13 - stride, -1],
      [16 + stride, 1],
    ] as const) {
      p.rect(x, 23, 3, 4, s < 0 ? SENT.dark : SENT.base);
      p.rect(x, 27, 3, 2, SENT.shadow);
      p.rect(x, 29, 3, 1, "#15151a");
    }
    return;
  }
  const leftUp = frame === 1 ? 1 : 0;
  const rightUp = frame === 2 ? 1 : 0;
  // esquerda lit / direita sombra (luz global)
  p.rect(12, 23 - leftUp, 3, 4, SENT.base);
  p.rect(12, 27 - leftUp, 3, 2, SENT.shadow);
  p.rect(12, 29 - leftUp, 3, 1, "#15151a");
  p.rect(17, 23 - rightUp, 3, 4, SENT.dark);
  p.rect(17, 27 - rightUp, 3, 2, SENT.shadow);
  p.rect(17, 29 - rightUp, 3, 1, "#15151a");
}

/** Torso base simples (camisa/gibão): tronco + braços, sem ombreiras. */
function simpleTorso(p: Px, facing: PartFacing, frame: number, sleeves: boolean): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    p.rect(13, 13 + bob, 5, 1, SENT.edge);
    for (let y = 14 + bob; y <= 20 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.rect(18, y, 2, 1, SENT.dark);
    }
    p.rect(12, 21 + bob, 8, 1, PAL.belt);
    p.rect(12, 22 + bob, 8, 1, SENT.shadow);
    // braço próximo balançando
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(15 + swing, 15 + bob, 2, 5, SENT.dark);
    if (!sleeves) p.rect(15 + swing, 19 + bob, 2, 2, PAL.skin);
    return;
  }
  const back = facing === "n";
  p.rect(12, 13 + bob, 8, 1, SENT.edge);
  for (let y = 14 + bob; y <= 20 + bob; y++) {
    p.rect(11, y, 2, 1, SENT.light);
    p.rect(13, y, 6, 1, back ? SENT.dark : SENT.base);
    p.rect(19, y, 2, 1, SENT.dark);
  }
  p.rect(11, 21 + bob, 10, 1, PAL.belt);
  if (!back) p.rect(15, 21 + bob, 2, 1, PAL.buckle);
  p.rect(11, 22 + bob, 10, 1, SENT.shadow);
  // braços
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(9, 15 + bob + armL, 2, 5, SENT.dark);
  p.rect(21, 15 + bob - armL, 2, 5, SENT.dark);
  if (!sleeves) {
    p.rect(9, 20 + bob + armL, 2, 2, PAL.skin);
    p.rect(21, 20 + bob - armL, 2, 2, PAL.skin);
  }
}

// ──────────────────────────────────────────────────────────────────────
// CABEÇAS
// ──────────────────────────────────────────────────────────────────────

/** Elmo fechado com fresta em T (Aço de Alvorada). */
function elmoAlvorada(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    p.rect(15, 5 + bob, 4, 1, SENT.edge);
    p.rect(14, 6 + bob, 6, 1, SENT.light);
    p.px(16, 5 + bob, SENT.shine);
    for (let y = 7 + bob; y <= 10 + bob; y++) {
      p.rect(13, y, 2, 1, SENT.light);
      p.rect(15, y, 4, 1, SENT.base);
      p.px(19, y, SENT.dark);
    }
    p.rect(17, 8 + bob, 3, 1, PAL.visorSlit);
    p.px(19, 9 + bob, PAL.visorSlit);
    p.rect(14, 11 + bob, 6, 1, SENT.dark);
    p.rect(14, 12 + bob, 5, 1, SENT.shadow);
    return;
  }
  p.rect(14, 5 + bob, 5, 1, SENT.edge);
  p.rect(13, 6 + bob, 7, 1, SENT.light);
  p.px(16, 5 + bob, SENT.shine);
  for (let y = 7 + bob; y <= 10 + bob; y++) {
    p.rect(12, y, 2, 1, SENT.light);
    p.rect(14, y, 5, 1, SENT.base);
    p.rect(19, y, 2, 1, SENT.dark);
  }
  if (facing === "s") {
    p.rect(13, 8 + bob, 7, 1, PAL.visorSlit);
    p.rect(16, 9 + bob, 1, 2, PAL.visorSlit);
  } else {
    p.rect(16, 6 + bob, 1, 5, SENT.edge); // crista por trás
  }
  p.rect(12, 11 + bob, 2, 1, SENT.base);
  p.rect(14, 11 + bob, 5, 1, SENT.dark);
  p.rect(19, 11 + bob, 2, 1, SENT.shadow);
  p.rect(13, 12 + bob, 7, 1, SENT.shadow);
}

/** Elmo Cerimonial (Ouro): alvorada + crista alta de desfile. */
function elmoOuro(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  elmoAlvorada(p, facing, frame);
  if (facing === "e") {
    // crista varrendo para trás
    p.rect(13, 3 + bob, 3, 1, SENT.shine);
    p.rect(12, 4 + bob, 4, 1, SENT.edge);
    p.px(11, 5 + bob, SENT.light);
  } else {
    // crista central alta (frente/costas)
    p.rect(15, 2 + bob, 3, 1, SENT.shine);
    p.rect(15, 3 + bob, 3, 1, SENT.edge);
    p.rect(16, 4 + bob, 1, 1, SENT.edge);
  }
}

/** Elmo da Vigília: fechado, fresta larga com OLHOS EM BRASA (fixos). */
function elmoVigilia(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  elmoAlvorada(p, facing, frame);
  if (facing === "s") {
    // fresta mais larga + brasas fixas
    p.rect(13, 8 + bob, 7, 1, PAL.visorSlit);
    p.px(14, 8 + bob, PAL.visorEmber);
    p.px(18, 8 + bob, PAL.visorEmber);
    // rebites laterais
    p.px(12, 9 + bob, SENT.edge);
    p.px(20, 9 + bob, SENT.dark);
  } else if (facing === "e") {
    p.px(18, 8 + bob, PAL.visorEmber);
    p.px(14, 9 + bob, SENT.edge); // rebite
  } else {
    p.px(13, 9 + bob, SENT.edge);
    p.px(19, 9 + bob, SENT.edge);
  }
}

/** Capuz da Sombra: capuz pontudo, rosto na penumbra. */
function capuzSombra(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // ponta caída para trás
    p.rect(11, 5 + bob, 2, 2, SENT.dark);
    p.px(10, 7 + bob, SENT.shadow);
    p.rect(13, 5 + bob, 5, 1, SENT.light);
    for (let y = 6 + bob; y <= 10 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.px(18, y, SENT.dark);
    }
    // abertura: rosto na penumbra
    p.rect(17, 7 + bob, 2, 4, PAL.visorSlit);
    p.px(17, 8 + bob, PAL.skinShade); // lasca de rosto
    p.rect(13, 11 + bob, 6, 1, SENT.dark);
    p.rect(13, 12 + bob, 6, 1, SENT.shadow);
    return;
  }
  // ponta do capuz
  p.rect(15, 3 + bob, 2, 1, SENT.dark);
  p.rect(14, 4 + bob, 3, 1, SENT.base);
  p.rect(13, 5 + bob, 6, 1, SENT.light);
  for (let y = 6 + bob; y <= 10 + bob; y++) {
    p.rect(12, y, 2, 1, SENT.light);
    p.rect(14, y, 5, 1, SENT.base);
    p.rect(19, y, 1, 1, SENT.dark);
  }
  if (facing === "s") {
    // sombra do rosto: penumbra com olhos escuros
    p.rect(13, 7 + bob, 6, 4, PAL.visorSlit);
    p.rect(14, 8 + bob, 1, 1, "#3a3f4a");
    p.rect(17, 8 + bob, 1, 1, "#3a3f4a");
    p.rect(13, 11 + bob, 6, 1, SENT.shadow);
  } else {
    p.rect(13, 7 + bob, 6, 5, SENT.dark); // costas do capuz
    p.rect(16, 7 + bob, 1, 4, SENT.shadow); // vinco
  }
  p.rect(13, 12 + bob, 6, 1, SENT.shadow);
}

/** Chapéu Arcano: aba larga + cone torto; rosto aberto. */
function chapeuArcano(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    p.px(13, 3 + bob, SENT.base); // ponta caída
    p.rect(14, 3 + bob, 2, 1, SENT.light);
    p.rect(14, 4 + bob, 3, 1, SENT.base);
    p.rect(15, 5 + bob, 3, 1, SENT.base);
    p.rect(12, 6 + bob, 9, 1, SENT.light); // aba
    p.rect(12, 7 + bob, 9, 1, SENT.dark);
    return;
  }
  // cone (torto p/ s; reto p/ n)
  p.px(14, 2 + bob, SENT.base);
  p.rect(14, 3 + bob, 2, 1, SENT.light);
  p.rect(14, 4 + bob, 3, 1, SENT.base);
  p.rect(15, 5 + bob, 3, 1, facing === "s" ? SENT.base : SENT.dark);
  // aba larga
  p.rect(11, 6 + bob, 10, 1, SENT.light);
  p.rect(11, 7 + bob, 10, 1, SENT.dark);
  if (facing === "n") {
    p.rect(13, 8 + bob, 6, 4, SENT.dark); // nuca coberta? não: cabelo
    p.rect(13, 8 + bob, 6, 4, PAL.hair);
    p.rect(13, 12 + bob, 6, 1, PAL.skinShade);
  }
}

/** Coifa da Aurora: justa, emoldura o rosto. */
function coifaAurora(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    p.rect(14, 4 + bob, 5, 1, SENT.light);
    p.rect(13, 5 + bob, 2, 7, SENT.base); // lateral
    p.rect(15, 5 + bob, 4, 1, SENT.base);
    p.rect(13, 12 + bob, 6, 1, SENT.dark); // queixo/gola
    return;
  }
  p.rect(13, 4 + bob, 6, 1, SENT.light);
  p.rect(12, 5 + bob, 2, 7, SENT.base);
  p.rect(18, 5 + bob, 2, 7, SENT.dark);
  p.rect(14, 5 + bob, 4, 2, SENT.base);
  if (facing === "n") p.rect(14, 7 + bob, 4, 5, SENT.base); // costas fechadas
  p.rect(13, 12 + bob, 6, 1, SENT.dark); // gola
}

/** Cabelo de Cidadão: cabeça descoberta — o SENTINELA é o cabelo (recolorível!). */
function cabecaCidadao(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  openFace(p, bob, facing);
  if (facing === "e") {
    p.rect(13, 4 + bob, 7, 3, SENT.base);
    p.rect(13, 5 + bob, 2, 5, SENT.base); // costeleta/atrás
    p.px(13, 4 + bob, SENT.light);
    return;
  }
  p.rect(12, 4 + bob, 8, 3, SENT.base);
  p.rect(12, 4 + bob, 8, 1, SENT.light);
  p.px(11, 6 + bob, SENT.base);
  p.px(20, 6 + bob, SENT.dark);
  if (facing === "n") {
    p.rect(12, 7 + bob, 8, 5, SENT.base); // nuca de cabelo
    p.rect(12, 11 + bob, 8, 1, SENT.dark);
    p.rect(13, 12 + bob, 6, 1, PAL.skinShade); // pescoço
  }
}

// ──────────────────────────────────────────────────────────────────────
// TORSOS
// ──────────────────────────────────────────────────────────────────────

/** Peitoral de placas + ombreiras + capa (família knight). vya = variação. */
function plateTorso(
  p: Px,
  facing: PartFacing,
  frame: number,
  opts: { trim?: boolean; studs?: boolean; tattered?: boolean },
): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    // capa atrás
    p.rect(10, 13 + bob, 2, 2, SENT.base);
    p.rect(10, 15 + bob, 2, 6, SENT.dark);
    p.rect(9, 18 + bob, 1, 4, SENT.shadow);
    p.rect(10, 21 + bob, 2, (opts.tattered ? 1 : 2), SENT.shadow);
    if (opts.tattered) p.px(10, 22 + bob, SENT.shadow);
    // torso
    p.rect(13, 14 + bob, 5, 1, SENT.edge);
    for (let y = 15 + bob; y <= 20 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.rect(18, y, 2, 1, SENT.dark);
    }
    p.rect(12, 21 + bob, 8, 1, PAL.belt);
    p.px(15, 21 + bob, PAL.buckle);
    p.rect(12, 22 + bob, 8, 1, SENT.shadow);
    // ombreira próxima
    p.rect(13, 13 + bob, 5, 1, SENT.edge);
    p.rect(13, 14 + bob, 5, 1, SENT.light);
    if (opts.trim) p.px(13, 13 + bob, SENT.shine);
    if (opts.studs) p.px(15, 14 + bob, SENT.shadow);
    return;
  }
  const back = facing === "n";
  if (back) {
    // capa cobre o corpo
    p.rect(10, 13 + bob, 12, 2, SENT.base);
    p.rect(10, 15 + bob, 12, 6, SENT.dark);
    p.rect(10, 21 + bob, 12, 3, SENT.shadow);
    p.rect(13, 15 + bob, 1, 6, SENT.shadow);
    p.rect(18, 15 + bob, 1, 6, SENT.shadow);
    if (opts.tattered) {
      // barra esfarrapada
      p.px(11, 23 + bob, SENT.dark);
      p.px(14, 23 + bob, SENT.dark);
      p.px(19, 23 + bob, SENT.dark);
    } else {
      p.px(10, 23 + bob, SENT.shadow);
      p.px(21, 23 + bob, SENT.shadow);
    }
  } else {
    // capa: só bordas atrás dos braços
    p.rect(10, 14 + bob, 1, 8, SENT.shadow);
    p.rect(22, 14 + bob, 1, 8, SENT.shadow);
    // peitoral
    p.rect(13, 14 + bob, 6, 1, SENT.edge);
    for (let y = 15 + bob; y <= 20 + bob; y++) {
      p.rect(11, y, 2, 1, SENT.light);
      p.rect(13, y, 6, 1, SENT.base);
      p.rect(19, y, 3, 1, SENT.dark);
    }
    p.rect(13, 15 + bob, 2, 2, SENT.light);
    if (opts.trim) {
      p.rect(15, 15 + bob, 1, 5, SENT.shine); // friso central
      p.px(12, 14 + bob, SENT.shine);
    }
    if (opts.studs) {
      p.px(13, 17 + bob, SENT.shadow);
      p.px(18, 17 + bob, SENT.shadow);
    }
    p.rect(11, 21 + bob, 11, 1, PAL.belt);
    p.rect(15, 21 + bob, 2, 1, PAL.buckle);
    p.rect(11, 22 + bob, 11, 1, SENT.shadow);
  }
  // ombreiras (frente e costas)
  p.rect(9, 13 + bob, 3, 1, SENT.edge);
  p.rect(9, 14 + bob, 3, 1, SENT.light);
  p.rect(9, 15 + bob, 2, 1, SENT.base);
  p.rect(20, 13 + bob, 3, 1, SENT.light);
  p.rect(20, 14 + bob, 3, 1, SENT.base);
  p.rect(21, 15 + bob, 2, 1, SENT.dark);
  if (opts.trim) {
    p.px(9, 13 + bob, SENT.shine);
    p.px(22, 13 + bob, SENT.shine);
  }
}

const peitoralAlvorada: PartDrawFn = (p, f, fr) => plateTorso(p, f, fr, {});
const peitoralOuro: PartDrawFn = (p, f, fr) => plateTorso(p, f, fr, { trim: true });
const peitoralVigilia: PartDrawFn = (p, f, fr) => plateTorso(p, f, fr, { studs: true, tattered: true });

/** Gibão da Sombra: couro justo, tiras cruzadas, sem ombreiras. */
function gibaoSombra(p: Px, facing: PartFacing, frame: number): void {
  simpleTorso(p, facing, frame, true);
  const bob = bobOf(frame);
  if (facing === "s") {
    // tira a tiracolo (fixa, couro)
    for (let i = 0; i < 6; i++) p.px(12 + i, 14 + bob + i, PAL.bootsDark);
    p.px(11, 13 + bob, PAL.bootsDark);
  } else if (facing === "e") {
    p.rect(13, 16 + bob, 5, 1, PAL.bootsDark);
  } else {
    for (let i = 0; i < 6; i++) p.px(19 - i, 14 + bob + i, PAL.bootsDark);
  }
}

/** Robe Arcano: mangas largas, barra com orla. */
function robeArcano(p: Px, facing: PartFacing, frame: number): void {
  const bob = bobOf(frame);
  if (facing === "e") {
    p.rect(13, 13 + bob, 5, 1, SENT.edge);
    for (let y = 14 + bob; y <= 21 + bob; y++) {
      p.rect(12, y, 2, 1, SENT.light);
      p.rect(14, y, 4, 1, SENT.base);
      p.rect(18, y, 2, 1, SENT.dark);
    }
    // manga larga caída
    const swing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(14 + swing, 15 + bob, 3, 5, SENT.dark);
    p.rect(14 + swing, 20 + bob, 3, 1, SENT.shadow);
    p.rect(12, 22 + bob, 8, 1, SENT.shadow); // orla
    return;
  }
  const back = facing === "n";
  p.rect(12, 13 + bob, 8, 1, SENT.edge);
  for (let y = 14 + bob; y <= 21 + bob; y++) {
    p.rect(11, y, 2, 1, SENT.light);
    p.rect(13, y, 6, 1, back ? SENT.dark : SENT.base);
    p.rect(19, y, 2, 1, SENT.dark);
  }
  if (!back) p.rect(15, 14 + bob, 2, 7, SENT.dark); // abertura central
  // mangas LARGAS
  const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  p.rect(8, 15 + bob + armL, 3, 5, SENT.dark);
  p.rect(8, 20 + bob + armL, 3, 1, SENT.shadow);
  p.rect(21, 15 + bob - armL, 3, 5, SENT.dark);
  p.rect(21, 20 + bob - armL, 3, 1, SENT.shadow);
  p.rect(11, 22 + bob, 10, 1, SENT.shadow); // orla
}

/** Túnica da Aurora: estola vertical clara + corda na cintura. */
function tunicaAurora(p: Px, facing: PartFacing, frame: number): void {
  simpleTorso(p, facing, frame, true);
  const bob = bobOf(frame);
  if (facing === "s") {
    p.rect(15, 13 + bob, 2, 8, SENT.shine); // estola
    p.rect(11, 21 + bob, 10, 1, PAL.dirtLight); // corda (fixa)
    p.px(13, 22 + bob, PAL.dirtLight);
  } else if (facing === "e") {
    p.rect(17, 14 + bob, 1, 7, SENT.shine);
    p.rect(12, 21 + bob, 8, 1, PAL.dirtLight);
  } else {
    p.rect(11, 21 + bob, 10, 1, PAL.dirtLight);
  }
}

/** Camisa de Cidadão: pano simples, mangas curtas (antebraço de pele). */
const camisaCidadao: PartDrawFn = (p, f, fr) => simpleTorso(p, f, fr, false);

// ──────────────────────────────────────────────────────────────────────
// PERNAS
// ──────────────────────────────────────────────────────────────────────

const grevasAlvorada: PartDrawFn = (p, f, fr) => {
  standardLegs(p, f, fr);
  // joelheiras
  const bobK = 0;
  if (f !== "e") {
    p.px(13, 24 + bobK, SENT.edge);
    p.px(18, 24 + bobK, SENT.light);
  }
};

const grevasOuro: PartDrawFn = (p, f, fr) => {
  standardLegs(p, f, fr);
  if (f !== "e") {
    p.px(13, 24, SENT.shine);
    p.px(18, 24, SENT.shine);
    p.px(13, 26, SENT.edge);
    p.px(18, 26, SENT.edge);
  } else {
    p.px(14, 24, SENT.shine);
    p.px(17, 24, SENT.shine);
  }
};

const grevasVigilia: PartDrawFn = (p, f, fr) => {
  standardLegs(p, f, fr);
  if (f !== "e") {
    p.px(12, 25, SENT.shadow);
    p.px(19, 25, SENT.shadow);
  }
};

/** Calça justa + botas macias (Sombra/Cidadão compartilham a base). */
const calcaSombra: PartDrawFn = (p, f, fr) => standardLegs(p, f, fr);
const calcaCidadao: PartDrawFn = (p, f, fr) => standardLegs(p, f, fr);

/** Saiote/saia: pano único cobrindo as pernas; pés aparecem embaixo. */
function skirtLegs(p: Px, facing: PartFacing, frame: number, long: boolean): void {
  const hem = long ? 28 : 27;
  const sway = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  if (facing === "e") {
    for (let y = 23; y <= hem; y++) {
      const w = 6 + Math.floor((y - 23) / 2);
      const x = 13 - Math.floor((y - 23) / 3);
      p.rect(x, y, 2, 1, SENT.light);
      p.rect(x + 2, y, w - 3, 1, SENT.base);
      p.px(x + w - 1, y, SENT.dark);
    }
    p.rect(12, hem + 1, 8, 1, SENT.shadow);
    // pés
    p.rect(14 + sway, hem + 1, 2, 1, PAL.bootsDark);
    p.rect(17 - sway, hem + 1, 2, 1, PAL.bootsDark);
    return;
  }
  const back = facing === "n";
  for (let y = 23; y <= hem; y++) {
    const spread = Math.floor((y - 23) / 2);
    p.rect(12 - spread, y, 2, 1, SENT.light);
    p.rect(14 - spread, y, 4 + spread * 2, 1, back ? SENT.dark : SENT.base);
    p.rect(18 + spread, y, 2, 1, SENT.dark);
  }
  if (!back) p.rect(15 + sway, 23, 1, hem - 23, SENT.dark); // prega
  p.rect(11, hem + 1, 10, 1, SENT.shadow); // barra
  p.rect(13, hem + 1, 2, 1, PAL.bootsDark);
  p.rect(17, hem + 1, 2, 1, PAL.bootsDark);
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
    // braço da espada (usa tom fixo de aço — braço é da peça de torso? não:
    // braço armado por cima, neutro escuro p/ ler contra qualquer torso)
    p.rect(21, 19 + bob + armSwing, 2, 1, PAL.armorShadow); // manopla
    p.rect(21, 20 + bob + armSwing, 3, 1, PAL.buckle); // guarda
    p.rect(22, 21 + bob + armSwing, 1, 6, PAL.swordBlade);
    p.px(22, 27 + bob + armSwing, PAL.swordDark);
    // escudo de madeira no braço esquerdo
    p.rect(7, 15 + bob, 3, 1, PAL.shieldWoodLight);
    for (let y = 16 + bob; y <= 19 + bob; y++) {
      p.px(6, y, PAL.shieldWoodLight);
      p.rect(7, y, 3, 1, PAL.shieldWood);
      p.px(10, y, PAL.shieldWoodDark);
    }
    p.rect(7, 20 + bob, 3, 1, PAL.shieldWood);
    p.rect(7, 21 + bob, 3, 1, PAL.shieldWoodDark);
    p.rect(8, 22 + bob, 1, 1, PAL.shieldWoodDark);
    p.rect(8, 17 + bob, 1, 1, PAL.armorShine);
    p.px(8, 18 + bob, PAL.armorDark);
  } else if (facing === "n") {
    // borda do escudo no ombro direito (braço esq. do char) + bainha
    p.rect(22, 14 + bob, 1, 7, PAL.shieldWood);
    p.px(22, 14 + bob, PAL.shieldWoodLight);
    p.px(22, 20 + bob, PAL.shieldWoodDark);
    p.px(9, 17 + bob, PAL.buckle);
    p.rect(9, 18 + bob, 1, 2, PAL.shieldRim);
  } else {
    // escudo avançado na frente
    p.rect(19, 14 + bob, 3, 1, PAL.shieldWoodLight);
    for (let y = 15 + bob; y <= 20 + bob; y++) {
      p.px(19, y, PAL.shieldWoodDark);
      p.rect(20, y, 2, 1, PAL.shieldWood);
      p.px(22, y, PAL.shieldWoodDark);
    }
    p.rect(20, 21 + bob, 2, 1, PAL.shieldWoodDark);
    p.px(21, 22 + bob, PAL.shieldWoodDark);
    p.px(20, 17 + bob, PAL.armorShine);
  }
}
