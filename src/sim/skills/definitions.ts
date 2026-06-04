import type { SkillDef } from "./types";
import {
  APUNHALAR,
  BOLA_DE_FOGO,
  CURAR_FERIMENTOS,
  GOLPE_FORTE,
  LANCA_DE_GELO,
  LUZ_SAGRADA,
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
  cooldownTicks: GOLPE_FORTE.cooldownTicks,
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
  cooldownTicks: BOLA_DE_FOGO.cooldownTicks,
  range: BOLA_DE_FOGO.range,
  power: BOLA_DE_FOGO.power,
  applyStatus: { kind: "burn" },
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
  cooldownTicks: LANCA_DE_GELO.cooldownTicks,
  range: LANCA_DE_GELO.range,
  power: LANCA_DE_GELO.power,
  applyStatus: { kind: "slow" },
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
  cooldownTicks: APUNHALAR.cooldownTicks,
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
  cooldownTicks: LUZ_SAGRADA.cooldownTicks,
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
  cooldownTicks: CURAR_FERIMENTOS.cooldownTicks,
  range: CURAR_FERIMENTOS.range,
  power: CURAR_FERIMENTOS.power,
};

/** Registro de todas as skills por ID — ponto único de lookup. */
export const SKILLS: Record<string, SkillDef> = {
  [SKILL_GOLPE_FORTE.id]: SKILL_GOLPE_FORTE,
  [SKILL_BOLA_DE_FOGO.id]: SKILL_BOLA_DE_FOGO,
  [SKILL_LANCA_DE_GELO.id]: SKILL_LANCA_DE_GELO,
  [SKILL_APUNHALAR.id]: SKILL_APUNHALAR,
  [SKILL_LUZ_SAGRADA.id]: SKILL_LUZ_SAGRADA,
  [SKILL_CURAR_FERIMENTOS.id]: SKILL_CURAR_FERIMENTOS,
};
