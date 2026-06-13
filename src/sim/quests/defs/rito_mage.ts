/** Rito de Mago — Asa e Cinza (R2, NPCS.md). Ver `rito_knight` p/ contexto dos ritos. */
import type { QuestDef } from "../index";

export const rito_mage: QuestDef = {
  id: "rito_mage",
  name: "Asa e Cinza",
  layer: "direta",
  giverNpcId: "leonor",
  stages: [{ type: "kill", species: "morcego", count: 5 }],
  rewards: { xp: 50, gold: 0 }, // QUESTS.md: R1–R4 = 50 XP cada; ritos CUSTAM (RITO_COST_GOLD), não pagam gold
  journalActive:
    "Leonor mal ergueu os olhos do tomo: “Magia? Primeiro a disciplina de COLHER. Cinco morcegos — a asa deles guarda um eco que eu uso. Abata-os; o resto é comigo.”",
  journalCompleted:
    "Cinco asas pesadas em olhos que já calculavam outra coisa. “Serve”, foi tudo — mas Leonor anotou seu nome.",
};
