/**
 * Q10 — A Água do Poço (QUESTS.md §Esgotos · XP/gold da bateria M1 + economia
 * passe 1). 1º fio do arco da Contaminação: Abel manda o jogador descer ao A2 e
 * achar a alvenaria manchada (mais velha que a cidade). NUNCA diz "Contaminação".
 *
 * IDs EXTERNOS referenciados:
 * - npcs (cast.ts): "abel" (giver + report — coveiro da Capela).
 * - regionIds (alvorada.ts, plantado na Fase 1e): "esgoto_a2" — o andar A2 (z=−2).
 * - interactableIds (alvorada.ts, plantado na Fase 1e): "q10_alvenaria_manchada"
 *   — a mancha escura na alvenaria antiga das RUÍNAS do A2.
 * - items: nenhum. species: nenhum (sem etapas kill/collect).
 *
 * Recompensa de design "desbloqueia camada nova de rumores" NÃO é mecânica do
 * motor staged — fica só XP+gold aqui; o veículo de rumores (DESIGN-MUNDO) é
 * outro sistema. A maturação (aponta a fatia ②) vive no journalCompleted.
 *
 * NOTA: nível-alvo 5–8 é só telegrafia (descer ao A2 exige corpo); a quest pode
 * ser ACEITA no lvl 1 (sem `requires`), como o doc manda.
 */
import type { QuestDef } from "../index";

export const q10_agua: QuestDef = {
  id: "q10_agua",
  name: "A Água do Poço",
  layer: "direta",
  giverNpcId: "abel",
  // talk (aceitar com Abel) → entrar no esgoto A2 → interagir na alvenaria
  // manchada → report (volta ao Abel, que empalidece e paga).
  stages: [
    { type: "talk", npcId: "abel" },
    { type: "region_enter", regionId: "esgoto_a2" },
    { type: "interact", interactableId: "q10_alvenaria_manchada" },
  ],
  rewards: { xp: 150, gold: 40 },
  journalActive:
    "Abel, o coveiro, sente o gosto na água do poço baixo. “Anda turva. Os outros não sentem. Vem de baixo — sempre vem de baixo.” Ele quer saber o que há lá embaixo.",
  journalCompleted:
    "Há uma mancha escura numa alvenaria mais velha que a cidade. Abel empalideceu quando contei. Murmurou algo sobre Charneca, onde dizem que os mortos não descansam…",
};
