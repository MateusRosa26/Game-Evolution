/**
 * Q3 — Reagentes do Boticário (QUESTS.md §Norte; XP/gold calibrados M1, jun/2026).
 *
 * IDS EXTERNOS referenciados (tsc não valida strings — conferidos à mão):
 *  - npcs    : "silas"            (src/sim/npc/cast.ts — boticário, giver + turn-in)
 *  - items   : "cauda_de_rato",
 *              "asa_de_morcego"   (collect — src/sim/items/templates.ts)
 *  - items   : "pocao_vida_pequena" (reward de cortesia — templates.ts)
 *  - species : nenhum (etapas são collect por templateId; o loot vem de rato/morcego
 *              no mundo, mas a quest não conta kills)
 *  - interactableIds / regionIds : nenhum
 *
 * NOTA: o "destrava trade de reagentes" (recompensa-chave do doc) NÃO é campo do
 * QuestDef — é gating de comércio que lê `stage === "completed"` desta quest
 * (consumidor externo, ver commerce). Aqui só vão xp/gold/items.
 */
import type { QuestDef } from "../index";

export const q3_reagentes: QuestDef = {
  id: "q3_reagentes",
  name: "Reagentes do Boticário",
  layer: "direta",
  giverNpcId: "silas",
  // talk (aceitar com Silas) → coletar 4 Caudas de Rato + 4 Asas de Morcego
  // (loot da Gruta dos Morcegos, no barranco norte) → talk (entrega ao Silas).
  stages: [
    { type: "talk", npcId: "silas" },
    { type: "collect", templateId: "cauda_de_rato", count: 4, turnInNpcId: "silas" },
    { type: "collect", templateId: "asa_de_morcego", count: 4, turnInNpcId: "silas" },
    { type: "talk", npcId: "silas" },
  ],
  rewards: {
    xp: 75,
    gold: 25,
    // Poção de Vida Pequena de cortesia (a única cortesia do jogo — apresenta o luxo).
    items: [{ templateId: "pocao_vida_pequena", qty: 1 }],
  },
  journalActive:
    "Silas precisa de reagentes frescos. “Cauda de rato e asa de morcego — fresco, não ressecado. A gruta no barranco norte está cheia deles, se tiver estômago.”",
  journalCompleted:
    "Silas pagou e me deu um vidrinho vermelho. “Pra emergência. A próxima eu cobro.”",
};
