/**
 * Q9 — A Estrada Roubada / The Stolen Road (QUESTS.md §Sul).
 *
 * Encadeada "NPC em NPC" (a forma "fale com fulano → agora com beltrano"): a
 * cadeia inteira é UMA QuestDef com etapas `talk` em sequência (Duarte → Vidal →
 * Telmo), e só então a ação na ponte (kill + recuperar a carga). NÃO são atos
 * separados — é uma trilha única de conversas que afunila pro acampamento dos
 * bandidos. Gating: pós-Q4 (a 2ª carga do Duarte é que sumiu na estrada sul).
 *
 * IDs EXTERNOS referenciados (tsc não valida strings — conferidos à mão):
 *   - npcs (npc/cast.ts):        duarte, vidal, telmo
 *   - species (bestiary.ts):     bandido   (BANDIDO — "Bandido da Estrada", T2)
 *   - interactableId (alvorada): q9_carga_roubada   (a carga no acampamento da
 *                                ponte; Fase 1e planta na alvorada.ts)
 *   - requires (quests/defs):    q4_entrega
 *   - items: nenhum · grantsKey: nenhum (recompensa = XP + gold; "ensina a
 *     estrada de Charneca" é narrativo, não item)
 *
 * Camada: o doc classifica Q9 como "encadeada"; o enum de `layer` só tem
 * direta/aberta/segredo. Encadeada NÃO é direta (contador SÓ nas diretas, regra
 * jun/2026) → mapeada para `aberta` (aberta/segredo nunca mostram contador).
 *
 * Recompensa: 350 XP + 80 gold (QUESTS.md — orçamento de XP / gold passe 1).
 * Cross-link: os sinais de bandido no porão do Moinho (Q12) apontam pra cá; as
 * duas quests se iluminam sem dependência mútua (sem wiring necessário aqui).
 */
import type { QuestDef } from "../index";

export const q9_estrada: QuestDef = {
  id: "q9_estrada",
  name: "A Estrada Roubada",
  layer: "aberta",
  giverNpcId: "duarte",
  // Pós-Q4 (A Entrega do Ferreiro): a porta da estrada sul abre com a confiança.
  requires: ["q4_entrega"],
  // Cadeia NPC-em-NPC: aceitar com Duarte → Capitão Vidal manda investigar →
  // Telmo (taverneiro) aponta a ponte → caçar os 3 bandidos → recuperar a carga
  // no acampamento → report (volta ao Duarte, o giver).
  stages: [
    { type: "talk", npcId: "duarte" },
    { type: "talk", npcId: "vidal" },
    { type: "talk", npcId: "telmo" },
    { type: "kill", species: "bandido", count: 3 },
    { type: "interact", interactableId: "q9_carga_roubada" },
  ],
  rewards: { xp: 350, gold: 80 },
  journalActive:
    "A segunda carga do Duarte sumiu na estrada do pântano. O Capitão Vidal não tem homens de sobra; o Telmo, taverneiro do Cais, ouviu alguém gastando demais. A trilha aponta a ponte do sul.",
  journalCompleted:
    "A carga estava na ponte, com os bolsos de três bandidos. A estrada do sul continua deles — por enquanto.",
};
