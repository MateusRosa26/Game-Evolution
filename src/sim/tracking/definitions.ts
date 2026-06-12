import type { TrackingDef } from "./types";

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  CATÁLOGO — Lote 1 (fichas reais) + mutações DUMMY (P7 bloqueado)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * As Marcas/Caminhos do Lote 1 (①②③④⑤⑥⑦) são FICHAS REAIS: gatilho + spec +
 * flavor finais (catálogo `2026-06-11-catalogo-emergente-lote1-engine.md` §1/§6,
 * revisão Chat B). NÚMEROS: ①②④ calibrados pelo Chat C (bateria
 * `2026-06-11-bateria-marcas-lote1-tipo1.md`, aguardam OK do criador); ⑤⑥⑦ e
 * thresholds de tempo seguem ✏️ Balancista/Chat C.
 *
 * As MUTAÇÕES (Eclosão/Meteoro) seguem DUMMY (sem `spec`): o P7 skillSwap depende
 * do merge da `feat/skills-engine` + das defs mutadas (fila [Q1]).
 */

// ── ① Quebra-Ossos — Marca de ARMA (kill vs mortos-vivos) ──────────────────
const MARK_QUEBRA_OSSOS: TrackingDef = {
  category: "mark",
  id: "mark_quebra_ossos",
  name: "Quebra-Ossos",
  event: "kill",
  filter: [{ field: "victim.family", op: "==", value: "undead" }],
  threshold: 15000, // Chat C (~35h dedicado; auto-gateada no T3) — aguarda OK ✏️
  flavor: {
    hint: "A lâmina fica fria quando há ossadas por perto.",
    unlock: "As ossadas se lembram do seu nome. Marca: Quebra-Ossos.",
  },
  effect: {
    description: "+12% dano contra mortos-vivos (P1 damageMult).",
    payload: {},
    spec: { kind: "damageMult", mult: 1.12, when: [{ field: "target.family", op: "==", value: "undead" }] },
  },
};

// ── ② Última Resposta — Marca de ARMA (golpe final em HP crítico) ──────────
const MARK_ULTIMA_RESPOSTA: TrackingDef = {
  category: "mark",
  id: "mark_ultima_resposta",
  name: "Última Resposta",
  event: "kill",
  // Gatilho BRUTAL: golpe final com o próprio HP < 10%.
  filter: [{ field: "attackerHpPct", op: "<", value: 0.1 }],
  threshold: 2000, // Chat C (gatilho raro ~8-11%/kill → 2k ≈ 40-50h; NÃO usar ~10k) ✏️
  flavor: {
    hint: "O aço esquenta na sua mão quando o sangue escorre.",
    unlock: "Encurralado, o aço responde. Marca: Última Resposta.",
  },
  effect: {
    // Efeito numa banda mais LARGA que o gatilho (jogável): +20% com HP < 25%.
    description: "+15% dano quando o próprio HP está abaixo de 25% (P1 damageMult).",
    payload: {},
    // Chat C: 1.20→1.15 (+20% flertava com pilar + incentivava ficar-no-HP-baixo; piso 1.12 = paridade c/ ①).
    spec: { kind: "damageMult", mult: 1.15, when: [{ field: "attackerHpPct", op: "<", value: 0.25 }] },
  },
};

// ── ③ Transbordo — Marca de ARMA (overkill atravessa pros lados) ───────────
const MARK_TRANSBORDO: TrackingDef = {
  category: "mark",
  id: "mark_transbordo",
  name: "Transbordo",
  event: "kill",
  filter: [{ field: "overkillRatio", op: ">=", value: 3 }], // matou com ≥3× o HP restante
  threshold: 5000, // ✏️ Balancista (régua de tempo das outras Marcas)
  flavor: {
    hint: "O golpe não parece terminar onde devia.",
    unlock: "Você não fere um corpo — atravessa-o. Marca: Transbordo.",
  },
  effect: {
    description: "Fração do overkill atravessa pros 2 tiles laterais ao golpe (B1; P2 onKill).",
    payload: {},
    // shape `lateral` = perpendicular ao golpe; damageType ausente = tipo do golpe fatal.
    spec: { kind: "onKill", action: "areaDamage", scaleField: "overkill", scale: 0.5, shape: "lateral" },
  },
};

// ── ④ Inabalável — Marca de ESCUDO (acúmulo de bloqueios) ──────────────────
const MARK_INABALAVEL: TrackingDef = {
  category: "mark",
  id: "mark_inabalavel",
  name: "Inabalável",
  event: "block", // atribuída ao ESCUDO equipado (engine.onBlock → equippedShieldInstanceId)
  filter: [], // qualquer bloqueio conta
  threshold: 30000, // Chat C (NÃO 50k; re-calibrar por bloqueios/hora × troca de escudo) ✏️
  flavor: {
    hint: "Os golpes contra o seu escudo soam cada vez mais surdos.",
    unlock: "Nada te move. Marca: Inabalável.",
  },
  effect: {
    description: "12% de chance de o bloqueio absorver 100% do golpe (P3 blockFull).",
    payload: {},
    spec: { kind: "blockFull", chance: 0.12 },
  },
};

// ── ⑤ Sombra Sem Nome — Caminho de ESTILO (vencer sem tomar dano) ──────────
const PATH_SOMBRA_SEM_NOME: TrackingDef = {
  category: "path",
  id: "path_sombra_sem_nome",
  name: "Sombra Sem Nome",
  flavorKind: "style",
  event: "combat_end",
  // Vitória sem tomar NENHUM dano na sessão.
  filter: [
    { field: "damageTaken", op: "==", value: 0 },
    { field: "endedBy", op: "==", value: "victory" },
  ],
  threshold: 500, // ✏️ Balancista/Chat C (densidade de descoberta)
  flavor: {
    hint: "O primeiro bote contra você nunca encontra carne.",
    unlock: "O primeiro golpe é o último que veem. Caminho: Sombra Sem Nome.",
  },
  effect: {
    description: "O 1º golpe RECEBIDO ao entrar em combate sofre redução de dano (B5 incomingMult).",
    payload: {},
    spec: { kind: "incomingMult", mult: 0.5 /* ✏️ Balancista */, when: [{ field: "firstHitReceivedOfCombat", op: "==", value: true }] },
  },
};

// ── ⑥ Intocado — Caminho de ESTILO (vencer só com magia) ───────────────────
const PATH_INTOCADO: TrackingDef = {
  category: "path",
  id: "path_intocado",
  name: "Intocado",
  flavorKind: "style",
  event: "combat_end",
  // Vitória causando dano, mas NENHUM físico (mago-puro) — fato derivado no combatEndFacts.
  filter: [{ field: "magicOnlyVictory", op: "==", value: true }],
  threshold: 500, // ✏️ Balancista/Chat C
  flavor: {
    hint: "Quanto menos suas mãos tocam, mais o poder corre por elas.",
    unlock: "O corpo não suja as mãos. Caminho: Intocado.",
  },
  effect: {
    description: "O golpe final com MAGIA devolve mana à fonte (B6 restoreMana; 'a magia se alimenta').",
    payload: {},
    // ⚠️ Chat C: amount < mana gasta por kill (reembolso parcial, nunca net-positive).
    spec: { kind: "onKill", action: "restoreMana", amount: 2 /* ✏️ Balancista */, when: [{ field: "damageType", op: "in", value: "fire|ice|arcane|holy" }] },
  },
};

// ── ⑦ Senhor dos Extremos — Caminho de RATIO (dual-elemento) ───────────────
const PATH_SENHOR_DOS_EXTREMOS: TrackingDef = {
  category: "path",
  id: "path_senhor_dos_extremos",
  name: "Senhor dos Extremos",
  flavorKind: "ratio",
  event: "damage",
  filter: [],
  numerator: [{ field: "damageType", op: "in", value: "fire|ice" }],
  // B7: piso POR ELEMENTO — cada um ≥30% do total (impede 94% fogo / 1% gelo). ✏️ Balancista.
  subNumerators: [
    { filter: [{ field: "damageType", op: "==", value: "fire" }], minRatio: 0.3 },
    { filter: [{ field: "damageType", op: "==", value: "ice" }], minRatio: 0.3 },
  ],
  denominator: [],
  ratioField: "amount",
  minRatio: 0.95, // ✏️ Balancista — fogo+gelo ≥95% do total
  milestoneLevel: 20, // ✏️ (catálogo: ~20)
  resetScope: "sinceClass",
  threshold: 0,
  flavor: {
    hint: "O quente e o frio começam a se confundir nas suas mãos.",
    unlock: "Fogo e gelo são a mesma língua na sua boca. Caminho: Senhor dos Extremos.",
  },
  effect: {
    description: "Fogo em alvo lento (gelado) ou gelo em alvo queimando → choque térmico (P6).",
    payload: {},
    spec: [
      { kind: "statusCombo", ifTargetStatus: "slow", onDamageType: "fire", burst: 10 /* ✏️ */, consumes: ["slow", "burn"] },
      { kind: "statusCombo", ifTargetStatus: "burn", onDamageType: "ice", burst: 10 /* ✏️ */, consumes: ["slow", "burn"] },
    ],
  },
};

// ── Mutações da Bola de Fogo — DUMMY (P7 bloqueado: merge skills-engine + defs) ──
const MUTATION_ECLOSAO_IGNEA: TrackingDef = {
  category: "mutation",
  id: "mut_bola_de_fogo_eclosao",
  name: "Eclosão Ígnea",
  skillId: "bola_de_fogo",
  event: "skill_use",
  filter: [{ field: "castDistance", op: "<=", value: 2 }], // perfil queima-roupa
  threshold: 10, // DUMMY (real ✏️) — meta PRÓPRIA deste perfil
  flavor: {
    hint: "As chamas latejam mais perto da sua pele.",
    unlock: "A Bola de Fogo implode em volta de você: Eclosão Ígnea.",
  },
  effect: { description: "Knockback + burn-chip nos adjacentes (B8; via skillSwap — P7 ✏️).", payload: {} },
};

const MUTATION_METEORO_DISTANTE: TrackingDef = {
  category: "mutation",
  id: "mut_bola_de_fogo_meteoro",
  name: "Meteoro Distante",
  skillId: "bola_de_fogo",
  event: "skill_use",
  filter: [{ field: "castDistance", op: ">=", value: 4 }], // perfil distância
  threshold: 10, // DUMMY (real ✏️)
  flavor: {
    hint: "O fogo anseia pelo horizonte.",
    unlock: "A Bola de Fogo cai como um meteoro do horizonte: Meteoro Distante.",
  },
  effect: { description: "Dano-por-distância DOIS-LADOS (B3; via skillSwap — P7 ✏️).", payload: {} },
};

/**
 * Conjunto carregado pela engine: fichas REAIS do Lote 1 + mutações DUMMY.
 * (Naturalista CORTADO — fila [B2]; Chama Viva/Punho Bruto removidos com a entrada
 * das fichas reais. ⑨⑩⑪⑫ entram quando o P7/Monge destravarem.)
 */
export const DUMMY_TRACKING_DEFS: TrackingDef[] = [
  MARK_QUEBRA_OSSOS,
  MARK_ULTIMA_RESPOSTA,
  MARK_TRANSBORDO,
  MARK_INABALAVEL,
  PATH_SOMBRA_SEM_NOME,
  PATH_INTOCADO,
  PATH_SENHOR_DOS_EXTREMOS,
  MUTATION_ECLOSAO_IGNEA,
  MUTATION_METEORO_DISTANTE,
];
