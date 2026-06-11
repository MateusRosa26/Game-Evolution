import type { TrackingDef } from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  DUMMY — substituir por conteúdo real ✏️
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Definições de TESTE da camada emergente. Thresholds BAIXÍSSIMOS (10–15) só
 * para exercitar a engine — o design real pede 10–20 MIL (DESIGN-EVOLUCAO.md
 * §"Pilares"). Os EFEITOS aqui são só descrição + payload livre; a APLICAÇÃO
 * mecânica é wave futura de conteúdo (a engine não interpreta `effect.payload`).
 *
 * Tudo aqui é DADO declarativo. Adicionar conteúdo = adicionar uma entrada
 * abaixo (ver docs/reports §"Como adicionar conteúdo").
 */

/** 1 MARCA — vive no ledger da instância da arma equipada. */
const MARK_ROEDOR_DE_FERRO: TrackingDef = {
  category: "mark",
  id: "mark_roedor_de_ferro", // DUMMY — substituir por conteúdo real ✏️
  name: "Roedor de Ferro",
  event: "kill",
  // 10 kills de criatura bestial com a MESMA arma equipada (o ledger é da instância).
  filter: [{ field: "victim.family", op: "==", value: "bestial" }],
  threshold: 10, // DUMMY (real: ~10–15k) ✏️
  flavor: {
    hint: "Sua arma parece sedenta quando feras rondam por perto.",
    unlock: "A lâmina aprendeu o cheiro das bestas — e não esquece.",
  },
  effect: {
    description: "+10% dano contra criaturas bestiais (P1 damageMult).",
    payload: { damageVsFamily: "bestial", bonusPct: 10 },
    spec: { kind: "damageMult", mult: 1.1, when: [{ field: "target.family", op: "==", value: "bestial" }] },
  },
};

/**
 * 2 MUTAÇÕES da Bola de Fogo com PERFIS OPOSTOS — PROVAM que o perfil decide
 * a mutação. Mesmo skillId; contador ABSOLUTO por perfil, o 1º a cruzar a própria
 * meta vence (não há mais share/denominador).
 */
const MUTATION_ECLOSAO_IGNEA: TrackingDef = {
  category: "mutation",
  id: "mut_bola_de_fogo_eclosao", // DUMMY ✏️
  name: "Eclosão Ígnea",
  skillId: "bola_de_fogo",
  event: "skill_use",
  // Perfil QUEIMA-ROUPA: distância do cast ≤ 2 tiles.
  filter: [{ field: "castDistance", op: "<=", value: 2 }],
  threshold: 10, // DUMMY (real: ~10k) — meta PRÓPRIA deste perfil ✏️
  flavor: {
    hint: "As chamas latejam mais perto da sua pele.",
    unlock: "A Bola de Fogo implode em volta de você: Eclosão Ígnea.",
  },
  effect: {
    description: "Explosão centrada no caster que empurra inimigos (wave futura ✏️).",
    payload: { aoe: "self", knockback: 1 },
  },
};

const MUTATION_METEORO_DISTANTE: TrackingDef = {
  category: "mutation",
  id: "mut_bola_de_fogo_meteoro", // DUMMY ✏️
  name: "Meteoro Distante",
  skillId: "bola_de_fogo",
  event: "skill_use",
  // Perfil DISTÂNCIA: distância do cast ≥ 4 tiles.
  filter: [{ field: "castDistance", op: ">=", value: 4 }],
  threshold: 10, // DUMMY — meta PRÓPRIA (não precisa casar a outra) ✏️
  flavor: {
    hint: "As chamas latejam mais perto da sua pele.", // hint da SKILL é compartilhado
    unlock: "A Bola de Fogo cai como um meteoro do horizonte: Meteoro Distante.",
  },
  effect: {
    description: "Alcance maior; dano cresce com a distância (wave futura ✏️).",
    payload: { rangeBonus: 3, damageScalesWithDistance: 1 },
  },
};

/** 1 CAMINHO de ESTILO — acúmulo de kills com skills de fogo. */
const PATH_CHAMA_VIVA: TrackingDef = {
  category: "path",
  id: "path_chama_viva", // DUMMY ✏️
  name: "Chama Viva",
  flavorKind: "style",
  event: "kill",
  // Golpe final por dano de fogo (damageType do finalBlow).
  filter: [{ field: "damageType", op: "==", value: "fire" }],
  threshold: 15, // DUMMY (real: dezenas de níveis / milhares) ✏️
  flavor: {
    hint: "O fogo responde a você como a um velho conhecido.",
    unlock: "Você não conjura o fogo — você é o fogo. Caminho: Chama Viva.",
  },
  effect: {
    description: "Bônus a dano de fogo (wave futura ✏️).",
    payload: { fireDamageBonusPct: 10 },
  },
};

/**
 * 1 CAMINHO de CONDUTA — chegar ao level 3 sem NUNCA usar skill. Quebra ao usar
 * QUALQUER skill (skill_use com filtro vazio = qualquer uso). Intacta no level 3
 * → desbloqueia. Quebrada = perdida para sempre naquele personagem.
 */
const PATH_PUNHO_BRUTO: TrackingDef = {
  category: "path",
  id: "path_punho_bruto", // DUMMY ✏️
  name: "Punho Bruto",
  flavorKind: "conduct",
  event: "level_up", // o milestone é por level
  filter: [], // não usado para condutas (a aquisição é por milestone)
  threshold: 0, // condutas não usam threshold de acúmulo (usam milestoneLevel)
  breakEvent: "skill_use",
  breakFilter: [], // QUALQUER skill_use quebra a conduta
  milestoneLevel: 3, // DUMMY (real: ~lvl 25) ✏️
  flavor: {
    hint: "Há força em recusar a magia fácil.",
    unlock: "Suas mãos bastam. Caminho: Punho Bruto.",
  },
  effect: {
    description: "Dano desarmado real escala com nível (wave futura ✏️).",
    payload: { unarmedScaling: 1 },
  },
};

/** NATURALISTA — Caminho de DISTINCT: matou N FAMÍLIAS distintas (amplitude). */
const PATH_NATURALISTA: TrackingDef = {
  category: "path",
  id: "path_naturalista", // DUMMY ✏️
  name: "O Naturalista",
  flavorKind: "style",
  event: "kill",
  filter: [], // qualquer kill válido conta a sua família
  accumulator: { kind: "distinct", field: "victim.family" }, // cardinalidade do conjunto
  threshold: 3, // DUMMY (real: nº de famílias do bestiário) ✏️
  flavor: {
    hint: "Você começa a reconhecer o jeito de cada besta morrer.",
    unlock: "Nenhuma criatura te é estranha. Caminho: O Naturalista.",
  },
  effect: {
    description: "Bônus contra famílias recém-encontradas (wave futura ✏️).",
    payload: { adaptiveBonus: 1 },
  },
};

/** EXAGERO — Marca de overkill: golpes que matam com dano MUITO sobrando. */
const MARK_EXAGERO: TrackingDef = {
  category: "mark",
  id: "mark_exagero", // DUMMY ✏️
  name: "Exagero",
  event: "kill",
  filter: [{ field: "overkillRatio", op: ">=", value: 3 }], // matou com ≥3× o HP restante
  threshold: 10, // DUMMY (real: milhares) ✏️
  flavor: {
    hint: "A arma não conhece a palavra 'suficiente'.",
    unlock: "Você não mata: você apaga. Marca: Exagero.",
  },
  effect: {
    description: "Metade do dano excedente (overkill) respinga em inimigos adjacentes (P2 onKill).",
    payload: { overkillSplash: 1 },
    spec: { kind: "onKill", action: "areaDamage", scaleField: "overkill", scale: 0.5, radius: 1 },
  },
};

/**
 * SENHOR DOS EXTREMOS — Caminho de RATIO (resolve o achado D): ≥95% do dano via
 * fogo+gelo, medido pelo fluxo de `damage`, avaliado no milestone de level.
 */
const PATH_SENHOR_DOS_EXTREMOS: TrackingDef = {
  category: "path",
  id: "path_senhor_dos_extremos", // DUMMY ✏️
  name: "Senhor dos Extremos",
  flavorKind: "ratio",
  event: "damage",
  filter: [], // não usado no ratio (numerator/denominator decidem)
  numerator: [{ field: "damageType", op: "in", value: "fire|ice" }],
  denominator: [], // todo dano causado
  ratioField: "amount", // soma o DANO, não ocorrências
  minRatio: 0.95, // DUMMY ✏️
  milestoneLevel: 5, // DUMMY (real: ~20) ✏️
  resetScope: "sinceClass",
  threshold: 0, // ratio não usa threshold de acúmulo
  flavor: {
    hint: "O quente e o frio obedecem só a você.",
    unlock: "Fogo e gelo são a mesma língua na sua boca. Caminho: Senhor dos Extremos.",
  },
  effect: {
    description: "Fogo em alvo lento (gelado) ou gelo em alvo queimando → choque térmico (P6).",
    payload: { thermalShock: 1 },
    // Dois combos direcionais: gelo aplica `slow`, fogo aplica `burn` (status.ts).
    spec: [
      { kind: "statusCombo", ifTargetStatus: "slow", onDamageType: "fire", burst: 10, consumes: ["slow", "burn"] },
      { kind: "statusCombo", ifTargetStatus: "burn", onDamageType: "ice", burst: 10, consumes: ["slow", "burn"] },
    ],
  },
};

/**
 * Conjunto DUMMY de definições carregado pela engine. Em produção, este array é
 * substituído pelas definições reais do criador (mesmo shape, thresholds reais).
 */
export const DUMMY_TRACKING_DEFS: TrackingDef[] = [
  MARK_ROEDOR_DE_FERRO,
  MARK_EXAGERO,
  MUTATION_ECLOSAO_IGNEA,
  MUTATION_METEORO_DISTANTE,
  PATH_CHAMA_VIVA,
  PATH_PUNHO_BRUTO,
  PATH_NATURALISTA,
  PATH_SENHOR_DOS_EXTREMOS,
];
