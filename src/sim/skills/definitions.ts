import type { SkillDef } from "./types";
import {
  APUNHALAR,
  ARREMESSO,
  AURA_SAGRADA,
  BOLA_DE_FOGO,
  CURAR_FERIMENTOS,
  DARDO_ARCANO,
  DISPARO_PERFURANTE,
  DRENO_VITAL,
  EXPLOSAO_DE_LUZ,
  FAGULHAS,
  GARRAS_DA_TERRA,
  GOLPE_FORTE,
  LANCA_DE_GELO,
  LUZ_SAGRADA,
  RAIO,
  REDEMOINHO,
  RETALHO,
  TEMPESTADE,
  VENDAVAL_DE_ACO,
} from "./numbers";

/**
 * As 6 skills únicas do kit M1 (DESIGN-EVOLUCAO.md §"Kit inicial — as 6 skills
 * únicas do M1"). Cada uma é DADO; os números vêm de `numbers.ts` (placeholder).
 *
 * As mutações NÃO são implementadas aqui (wave futura) — mas o perfil rastreado
 * no evento `skill_use` (ver executor.ts) já cobre o que cada mutação da ficha
 * precisa: HP% do caster, distância, alvo queimando/lento, ângulo costas/frente,
 * HP do alvo, nº de alvos, família do alvo, em combate.
 */

/** Golpe Forte (Knight) — melee no alvo selecionado, ~1.8× dano da arma. */
export const SKILL_GOLPE_FORTE: SkillDef = {
  id: "golpe_forte",
  name: "Golpe Forte",
  cls: "knight",
  targeting: "meleeTarget",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "arma"],
  manaCost: GOLPE_FORTE.manaCost,
  cooldownMs: GOLPE_FORTE.cooldownMs,
  range: GOLPE_FORTE.range,
  // `power` aqui é a base; o executor multiplica o dano da arma por 1.8× (ficha).
  power: 0,
};

/** Bola de Fogo (Mage) — projétil de fogo + queimadura (DoT). */
export const SKILL_BOLA_DE_FOGO: SkillDef = {
  id: "bola_de_fogo",
  name: "Bola de Fogo",
  cls: "mage",
  targeting: "projectileTarget",
  effect: "magic",
  damageType: "fire",
  tags: ["fogo", "queimadura"],
  manaCost: BOLA_DE_FOGO.manaCost,
  cooldownMs: BOLA_DE_FOGO.cooldownMs,
  range: BOLA_DE_FOGO.range,
  power: BOLA_DE_FOGO.power,
  // Queimadura (DoT de fogo) — parâmetros carregados no dado (antes hardcoded no executor).
  applyStatus: {
    kind: "burn",
    damagePerTick: BOLA_DE_FOGO.burn.damagePerTick,
    durationMs: BOLA_DE_FOGO.burn.durationMs,
    intervalMs: BOLA_DE_FOGO.burn.intervalMs,
    damageType: "fire",
  },
};

/** Lança de Gelo (Mage) — projétil perfurante (linha) + slow em cada alvo. */
export const SKILL_LANCA_DE_GELO: SkillDef = {
  id: "lanca_de_gelo",
  name: "Lança de Gelo",
  cls: "mage",
  targeting: "lineThrough",
  effect: "magic",
  damageType: "ice",
  tags: ["gelo", "lentidao"],
  manaCost: LANCA_DE_GELO.manaCost,
  cooldownMs: LANCA_DE_GELO.cooldownMs,
  range: LANCA_DE_GELO.range,
  power: LANCA_DE_GELO.power,
  // Lentidão (slow) — parâmetros carregados no dado (antes hardcoded no executor).
  applyStatus: {
    kind: "slow",
    stepMsMultiplier: LANCA_DE_GELO.slow.stepMsMultiplier,
    durationMs: LANCA_DE_GELO.slow.durationMs,
  },
};

/** Apunhalar (Rogue) — melee posicional, ~2× pelas costas. */
export const SKILL_APUNHALAR: SkillDef = {
  id: "apunhalar",
  name: "Apunhalar",
  cls: "rogue",
  targeting: "meleePositional",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "posicional"],
  manaCost: APUNHALAR.manaCost,
  cooldownMs: APUNHALAR.cooldownMs,
  range: APUNHALAR.range,
  power: APUNHALAR.power,
};

/** Luz Sagrada (Priest) — projétil holy, bônus forte vs profanos (família). */
export const SKILL_LUZ_SAGRADA: SkillDef = {
  id: "luz_sagrada",
  name: "Luz Sagrada",
  cls: "priest",
  targeting: "projectileTarget",
  effect: "magic",
  damageType: "holy",
  tags: ["sagrado", "anti-profano"],
  manaCost: LUZ_SAGRADA.manaCost,
  cooldownMs: LUZ_SAGRADA.cooldownMs,
  range: LUZ_SAGRADA.range,
  power: LUZ_SAGRADA.power,
};

/** Curar Ferimentos (Priest) — cura self/aliado. */
export const SKILL_CURAR_FERIMENTOS: SkillDef = {
  id: "curar_ferimentos",
  name: "Curar Ferimentos",
  cls: "priest",
  targeting: "healTarget",
  effect: "heal",
  damageType: "holy", // irrelevante p/ cura, mas tipado
  tags: ["sagrado", "cura"],
  manaCost: CURAR_FERIMENTOS.manaCost,
  cooldownMs: CURAR_FERIMENTOS.cooldownMs,
  range: CURAR_FERIMENTOS.range,
  power: CURAR_FERIMENTOS.power,
};

/** Garras da Terra (Mage/Int) — groundTarget mirado (cast-time) + root (terra). */
export const SKILL_GARRAS_DA_TERRA: SkillDef = {
  id: "earthen_grasp",
  name: "Garras da Terra",
  cls: "mage",
  targeting: "groundTarget",
  effect: "magic",
  damageType: "earth",
  tags: ["terra", "root"],
  manaCost: GARRAS_DA_TERRA.manaCost,
  cooldownMs: GARRAS_DA_TERRA.cooldownMs,
  range: GARRAS_DA_TERRA.range,
  power: GARRAS_DA_TERRA.power,
  castTimeMs: GARRAS_DA_TERRA.castTimeMs,
  areaRadius: GARRAS_DA_TERRA.areaRadius,
  // Enraíza os pegos — controle é o valor da skill, não o nuke (terra = root).
  applyStatus: { kind: "root", durationMs: GARRAS_DA_TERRA.root.durationMs },
};

/** Tempestade (Mage/Int) — groundTarget mirado (cast-time), raio, AoE de dano puro. */
export const SKILL_TEMPESTADE: SkillDef = {
  id: "storm",
  name: "Tempestade",
  cls: "mage",
  targeting: "groundTarget",
  effect: "magic",
  damageType: "lightning",
  tags: ["raio"],
  manaCost: TEMPESTADE.manaCost,
  cooldownMs: TEMPESTADE.cooldownMs,
  range: TEMPESTADE.range,
  power: TEMPESTADE.power,
  castTimeMs: TEMPESTADE.castTimeMs,
  areaRadius: TEMPESTADE.areaRadius,
};

/** Redemoinho (Knight/For) — selfRadius físico; escala a ARMA (tag arma → ledger). */
export const SKILL_REDEMOINHO: SkillDef = {
  id: "whirlwind",
  name: "Redemoinho",
  cls: "knight",
  targeting: "selfRadius",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "arma"],
  manaCost: REDEMOINHO.manaCost,
  cooldownMs: REDEMOINHO.cooldownMs,
  range: 1, // melee (self-centered)
  power: REDEMOINHO.power,
  areaRadius: REDEMOINHO.areaRadius,
};

/** Aura Sagrada (Priest/Esp) — selfRadius de cura (caster + aliados no raio). */
export const SKILL_AURA_SAGRADA: SkillDef = {
  id: "sacred_aura",
  name: "Aura Sagrada",
  cls: "priest",
  targeting: "selfRadius",
  effect: "heal",
  damageType: "holy", // irrelevante p/ cura, mas tipado
  tags: ["sagrado", "cura"],
  manaCost: AURA_SAGRADA.manaCost,
  cooldownMs: AURA_SAGRADA.cooldownMs,
  range: 0, // self-centered
  power: AURA_SAGRADA.power,
  areaRadius: AURA_SAGRADA.areaRadius,
};

/** Fagulhas (Mage/Int) — chain (raio); chip-AoE FRACO (NÃO deve deletar um pack). */
export const SKILL_FAGULHAS: SkillDef = {
  id: "sparks",
  name: "Fagulhas",
  cls: "mage",
  targeting: "chain",
  effect: "magic",
  damageType: "lightning",
  tags: ["raio", "chip"],
  manaCost: FAGULHAS.manaCost,
  cooldownMs: FAGULHAS.cooldownMs,
  range: FAGULHAS.range,
  power: FAGULHAS.power,
  chainMax: FAGULHAS.chainMax,
  chainRange: FAGULHAS.chainRange,
  chainFalloff: FAGULHAS.chainFalloff,
};

/** Dreno Vital (Mage/Int) — projétil de morte, lifedrain 50% do dano causado. */
export const SKILL_DRENO_VITAL: SkillDef = {
  id: "life_drain",
  name: "Dreno Vital",
  cls: "mage",
  targeting: "projectileTarget",
  effect: "magic",
  damageType: "death",
  tags: ["morte"],
  manaCost: DRENO_VITAL.manaCost,
  cooldownMs: DRENO_VITAL.cooldownMs,
  range: DRENO_VITAL.range,
  power: DRENO_VITAL.power,
  lifedrainPct: DRENO_VITAL.lifedrainPct,
};

// ─────────────────────────────────────────────────────────────────────────
//  Catálogo (CATALOGO.md) — skills que são SÓ DADO sobre os executores prontos.
//  As que exigem mecânica ainda inexistente ficam ✏️ pendentes (ver report).
// ─────────────────────────────────────────────────────────────────────────

/** Dardo Arcano (Mage/Int) — projétil arcano barato single-target (banda ①). */
export const SKILL_DARDO_ARCANO: SkillDef = {
  id: "arcane_dart",
  name: "Dardo Arcano",
  cls: "mage",
  targeting: "projectileTarget",
  effect: "magic",
  damageType: "arcane",
  tags: ["arcano"],
  manaCost: DARDO_ARCANO.manaCost,
  cooldownMs: DARDO_ARCANO.cooldownMs,
  range: DARDO_ARCANO.range,
  power: DARDO_ARCANO.power,
};

/** Raio (Mage/Int) — linha perfurante de raio (lightning), instantâneo, sem status. */
export const SKILL_RAIO: SkillDef = {
  id: "bolt",
  name: "Raio",
  cls: "mage",
  targeting: "lineThrough",
  effect: "magic",
  damageType: "lightning",
  tags: ["raio"],
  manaCost: RAIO.manaCost,
  cooldownMs: RAIO.cooldownMs,
  range: RAIO.range,
  power: RAIO.power,
};

/** Arremesso (universal) — projétil físico fraco; pull e finisher. */
export const SKILL_ARREMESSO: SkillDef = {
  id: "throw",
  name: "Arremesso",
  cls: null, // universal
  targeting: "projectileTarget",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "distancia"],
  manaCost: ARREMESSO.manaCost,
  cooldownMs: ARREMESSO.cooldownMs,
  range: ARREMESSO.range,
  power: ARREMESSO.power,
};

/** Disparo Perfurante (Rogue/Des) — single-target ranged (caminho do arco). */
export const SKILL_DISPARO_PERFURANTE: SkillDef = {
  id: "piercing_shot",
  name: "Disparo Perfurante",
  cls: "rogue",
  targeting: "projectileTarget",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "distancia"],
  manaCost: DISPARO_PERFURANTE.manaCost,
  cooldownMs: DISPARO_PERFURANTE.cooldownMs,
  range: DISPARO_PERFURANTE.range,
  power: DISPARO_PERFURANTE.power,
};

/** Retalho (Rogue/Des) — melee físico + sangramento (bleed), single-target. */
export const SKILL_RETALHO: SkillDef = {
  id: "rend",
  name: "Retalho",
  cls: "rogue",
  targeting: "meleeTarget",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "sangramento"],
  manaCost: RETALHO.manaCost,
  cooldownMs: RETALHO.cooldownMs,
  range: RETALHO.range,
  power: RETALHO.power,
  // Sangramento (DoT físico) — parâmetros DECLARATIVOS no dado (executor genérico).
  applyStatus: {
    kind: "bleed",
    damagePerTick: RETALHO.bleed.damagePerTick,
    durationMs: RETALHO.bleed.durationMs,
    intervalMs: RETALHO.bleed.intervalMs,
  },
};

/** Vendaval de Aço (Rogue/Des, ~lvl 20) — selfRadius físico; escala a ARMA (ledger). */
export const SKILL_VENDAVAL_DE_ACO: SkillDef = {
  id: "steelstorm",
  name: "Vendaval de Aço",
  cls: "rogue",
  targeting: "selfRadius",
  effect: "physical",
  damageType: "physical",
  tags: ["fisico", "arma"],
  manaCost: VENDAVAL_DE_ACO.manaCost,
  cooldownMs: VENDAVAL_DE_ACO.cooldownMs,
  range: 1, // melee (self-centered)
  power: VENDAVAL_DE_ACO.power,
  areaRadius: VENDAVAL_DE_ACO.areaRadius,
};

/** Explosão de Luz (Priest/Esp, ~lvl 20) — selfRadius holy; anti-pack vs profanos. */
export const SKILL_EXPLOSAO_DE_LUZ: SkillDef = {
  id: "burst_of_light",
  name: "Explosão de Luz",
  cls: "priest",
  targeting: "selfRadius",
  effect: "magic",
  damageType: "holy", // o executor aplica o bônus anti-profano / penalidade fora do nicho
  tags: ["sagrado", "anti-profano"],
  manaCost: EXPLOSAO_DE_LUZ.manaCost,
  cooldownMs: EXPLOSAO_DE_LUZ.cooldownMs,
  range: 0, // self-centered
  power: EXPLOSAO_DE_LUZ.power,
  areaRadius: EXPLOSAO_DE_LUZ.areaRadius,
};

/** Registro de todas as skills por ID — ponto único de lookup. */
export const SKILLS: Record<string, SkillDef> = {
  [SKILL_GOLPE_FORTE.id]: SKILL_GOLPE_FORTE,
  [SKILL_BOLA_DE_FOGO.id]: SKILL_BOLA_DE_FOGO,
  [SKILL_LANCA_DE_GELO.id]: SKILL_LANCA_DE_GELO,
  [SKILL_APUNHALAR.id]: SKILL_APUNHALAR,
  [SKILL_LUZ_SAGRADA.id]: SKILL_LUZ_SAGRADA,
  [SKILL_CURAR_FERIMENTOS.id]: SKILL_CURAR_FERIMENTOS,
  [SKILL_GARRAS_DA_TERRA.id]: SKILL_GARRAS_DA_TERRA,
  [SKILL_TEMPESTADE.id]: SKILL_TEMPESTADE,
  [SKILL_REDEMOINHO.id]: SKILL_REDEMOINHO,
  [SKILL_AURA_SAGRADA.id]: SKILL_AURA_SAGRADA,
  [SKILL_FAGULHAS.id]: SKILL_FAGULHAS,
  [SKILL_DRENO_VITAL.id]: SKILL_DRENO_VITAL,
  // ── Catálogo (data-only sobre executores prontos) ──
  [SKILL_DARDO_ARCANO.id]: SKILL_DARDO_ARCANO,
  [SKILL_RAIO.id]: SKILL_RAIO,
  [SKILL_ARREMESSO.id]: SKILL_ARREMESSO,
  [SKILL_DISPARO_PERFURANTE.id]: SKILL_DISPARO_PERFURANTE,
  [SKILL_RETALHO.id]: SKILL_RETALHO,
  [SKILL_VENDAVAL_DE_ACO.id]: SKILL_VENDAVAL_DE_ACO,
  [SKILL_EXPLOSAO_DE_LUZ.id]: SKILL_EXPLOSAO_DE_LUZ,
};
