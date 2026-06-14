/**
 * Q8 ato 3 — Orelha por Orelha / *Ear for Ear* (QUESTS.md §Nordeste; encadeada,
 * 3 atos, direta). Clímax: a Caverna dos Goblins — chegar ao fundo e descobrir
 * QUEM os arma: não um goblin, um Orc Soldado, armado e armadurado. Matá-lo e
 * trazer a Sucata de Arma marcada como prova. Recompensa final: XP/gold do ato +
 * a peça T1 de gear (Escudo Lascado — loot raro do Orc, ITENS-LOOTS). O fio
 * solto (de onde vêm as armas → Fortaleza Abandonada) fica na fala do Vidal,
 * fatia futura. Encadeia sobre o ato 2 via `requires`.
 *
 * IDs EXTERNOS referenciados:
 *  - npcs:    "vidal"            (giver + turn-in — src/sim/npc/cast.ts; Capitão Vidal)
 *  - species: "orc"             (kill 1 — Orc Soldado, fundo da Caverna dos Goblins; src/sim/bestiary.ts)
 *  - items:   "sucata_de_arma"  (coleta — a "prova marcada", loot do Orc, entregue ao Vidal)
 *             "escudo_lascado"  (recompensa — peça T1 de gear; ambos em src/sim/items/templates.ts)
 *  - requires: "q8_a2"          (ato 2 — src/sim/quests/defs/q8_a2.ts)
 */
import type { QuestDef } from "../index";

export const q8_a3: QuestDef = {
  id: "q8_a3",
  name: "Orelha por Orelha — Quem os Arma",
  layer: "direta",
  giverNpcId: "vidal",
  // talk (aceitar com Vidal) → descer ao fundo da Caverna dos Goblins e matar o
  // Orc Soldado (kill 1 "orc") → trazer a Sucata de Arma marcada como prova
  // (collect 1, entregue ao Vidal = report). A "chegada ao fundo" é o spawn do
  // orc na caverna (placement, alvorada.ts) — o objetivo mecânico é o abate + a
  // prova, sem region_enter dedicado.
  stages: [
    { type: "talk", npcId: "vidal" },
    { type: "kill", species: "orc", count: 1 },
    { type: "collect", templateId: "sucata_de_arma", count: 1, turnInNpcId: "vidal" },
  ],
  requires: ["q8_a2"],
  rewards: { xp: 350, gold: 80, items: [{ templateId: "escudo_lascado" }] },
  journalActive:
    "O acampamento respondia a alguém mais fundo. A Caverna dos Goblins guarda quem os arma — descer, matar, e trazer prova.",
  journalCompleted:
    "Não era goblin no fundo da caverna. Era um orc — armado, armadurado, esperando. Quem mandou? Vidal guardou a sucata e franziu a testa.",
};
