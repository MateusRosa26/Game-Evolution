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
    description: "+dano contra criaturas bestiais (aplicação mecânica é wave futura ✏️).",
    payload: { damageVsFamily: "bestial", bonusPct: 10 },
  },
};

/**
 * 2 MUTAÇÕES da Bola de Fogo com PERFIS OPOSTOS — PROVAM que o perfil decide
 * a mutação. Mesmo skillId, mesmo threshold de usos; vence quem dominar ≥50%.
 */
const MUTATION_ECLOSAO_IGNEA: TrackingDef = {
  category: "mutation",
  id: "mut_bola_de_fogo_eclosao", // DUMMY ✏️
  name: "Eclosão Ígnea",
  skillId: "bola_de_fogo",
  event: "skill_use",
  // Perfil QUEIMA-ROUPA: distância do cast ≤ 2 tiles.
  filter: [{ field: "castDistance", op: "<=", value: 2 }],
  threshold: 10, // DUMMY (real: ~10k) ✏️
  minShare: 0.5, // maioria decide (≥50% dos usos válidos)
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
  threshold: 10, // DUMMY — DEVE casar o threshold da outra mutação da skill ✏️
  minShare: 0.5,
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

/**
 * Conjunto DUMMY de definições carregado pela engine. Em produção, este array é
 * substituído pelas definições reais do criador (mesmo shape, thresholds reais).
 */
export const DUMMY_TRACKING_DEFS: TrackingDef[] = [
  MARK_ROEDOR_DE_FERRO,
  MUTATION_ECLOSAO_IGNEA,
  MUTATION_METEORO_DISTANTE,
  PATH_CHAMA_VIVA,
  PATH_PUNHO_BRUTO,
];
