/**
 * Q2 — A Mochila (QUESTS.md §Oeste; XP/gold da bateria M1 + passe 1 de gold).
 *
 * IDs EXTERNOS referenciados:
 *  - npcs:   "nina"      (giver + turn-in — src/sim/npc/cast.ts)
 *  - items:  "mochila"   (recompensa — upgrade da Sacola de Pano; src/sim/items/templates.ts)
 *  - interactableIds: "q2_fardo" (o fardo largado na Granja — a Fase 1e planta na alvorada.ts)
 */
import type { QuestDef } from "../index";

export const q2_mochila: QuestDef = {
  id: "q2_mochila",
  name: "A Mochila",
  layer: "direta",
  giverNpcId: "nina",
  // talk (aceitar com Nina) → ir à Granja (portão O) e recuperar o fardo
  // (interação) → talk (entrega à Nina). A emissão do `interact` vem na fatia
  // 0a-bis; o id "q2_fardo" é plantado na alvorada.ts (Fase 1e).
  stages: [
    { type: "talk", npcId: "nina" },
    { type: "interact", interactableId: "q2_fardo" },
    { type: "talk", npcId: "nina" },
  ],
  rewards: { xp: 50, gold: 20, items: [{ templateId: "mochila" }] },
  journalActive:
    "O carroceiro largou o fardo da Nina na granja quando viu os ratos. Trazer ele inteiro — e a mochila de amostra é dela pra mim.",
  journalCompleted:
    "Fardo entregue, mochila no ombro. Nina disse que eu 'tenho futuro de carregador'.",
};
