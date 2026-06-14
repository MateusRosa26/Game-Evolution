/**
 * Q8 ato 1 — Orelha por Orelha / *Ear for Ear* (QUESTS.md §Nordeste; encadeada,
 * 3 atos, direta — contador no diário). 1º ato: os batedores goblins rondam o
 * vau NE; o Capitão Vidal põe preço na orelha. XP/gold da bateria M1 + passe 1.
 *
 * Gating de confiança: requer **Q5 Lobos Demais** concluída (é ela que destrava o
 * bounty de orelhas e abre esta cadeia — QUESTS.md §grafo de dependências). Os
 * atos encadeiam por `requires`: a1 → a2 → a3 (cada um manda mais longe).
 *
 * IDs EXTERNOS referenciados:
 *  - npcs:    "vidal"             (giver + turn-in — src/sim/npc/cast.ts; Capitão Vidal)
 *  - species: (nenhuma direta — o `collect` das orelhas é alimentado pelo abate de
 *             "goblin", loot `orelha_de_goblin` — src/sim/bestiary.ts)
 *  - items:   "orelha_de_goblin"  (coleta — prova de abate, entregue ao Vidal; src/sim/items/templates.ts)
 *  - requires: "q5_lobos"         (Q5 Lobos Demais — src/sim/quests/defs/q5_lobos.ts)
 */
import type { QuestDef } from "../index";

export const q8_a1: QuestDef = {
  id: "q8_a1",
  name: "Orelha por Orelha",
  layer: "direta",
  giverNpcId: "vidal",
  // talk (aceitar com Vidal) → coletar 10 orelhas de goblin (caçar batedores no
  // vau NE; a orelha é o loot do goblin) e entregá-las ao Vidal (= report). O
  // `collect` exige matar goblins pra juntar as orelhas — o bounty é a prova.
  stages: [
    { type: "talk", npcId: "vidal" },
    { type: "collect", templateId: "orelha_de_goblin", count: 10, turnInNpcId: "vidal" },
  ],
  requires: ["q5_lobos"],
  rewards: { xp: 100, gold: 30 },
  journalActive:
    "Os batedores goblins rondam o vau. O Capitão Vidal paga por prova: dez orelhas. “Praga pior que lobo — e vêm de algum canto.”",
  journalCompleted:
    "Dez orelhas no balcão do quartel. Vidal contou em silêncio. “Vêm de algum canto. Vai ter mais.”",
};
