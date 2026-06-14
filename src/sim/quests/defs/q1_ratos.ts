/** Q1 — Ratos no Porão (QUESTS.md, XP/gold da bateria M1 + passe 1). */
import type { QuestDef } from "../index";

export const q1_ratos: QuestDef = {
  id: "q1_ratos",
  name: "Ratos no Porão",
  layer: "direta",
  giverNpcId: "bartolo",
  // talk (aceitar com Bartolo) → caçar 8 ratos → report (volta ao Bartolo).
  // ✏️ mapId: "porao_estalagem" quando o mapa do porão entrar (multi-mapa).
  stages: [
    { type: "talk", npcId: "bartolo" },
    { type: "kill", species: "rato", count: 8 },
  ],
  rewards: { xp: 50, gold: 20 },
  journalActive:
    "O estalajadeiro quer o porão limpo dos ratos. “Eles não param de aparecer, devem subir de algum lugar…”",
  journalCompleted:
    "O estalajadeiro jura que os ratos sobem de algum lugar. O bueiro da praça?",
};
