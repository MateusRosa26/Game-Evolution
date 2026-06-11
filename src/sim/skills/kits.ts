import type { PlayerClass } from "../../shared/types";
import { SKILLS } from "./definitions";

/**
 * Skills conhecidas no spawn, por classe (DESIGN-EVOLUCAO.md §Classes "Kit
 * inicial"). Compra em NPC é M2+ — por ora o jogador nasce com o kit da sua
 * classe.
 *
 * DECISÃO (documentada): o player default é KNIGHT, então só conheceria Golpe
 * Forte. Para DEV/teste há o comando de protocolo `debugGrantSkill` que concede
 * qualquer skill — usado pelo harness para exercitar as 6. O kit por classe
 * abaixo é a fonte de verdade do "conhecimento inicial legítimo".
 */
export const STARTER_KITS: Record<PlayerClass, string[]> = {
  knight: ["golpe_forte"],
  mage: ["bola_de_fogo", "lanca_de_gelo"],
  rogue: ["apunhalar"],
  priest: ["luz_sagrada", "curar_ferimentos"],
  // Classless = lousa em branco: luta no auto-attack até o rito conceder o kit da
  // classe escolhida (skills seguem gate atributo+nível, sem exclusividade). ✏️ kit
  // tutorial mínimo é decisão de design/loremaster.
  classless: [],
};

/** True se `skillId` é uma skill conhecida do jogo (existe na definição). */
export function isKnownSkillId(skillId: string): boolean {
  return skillId in SKILLS;
}
