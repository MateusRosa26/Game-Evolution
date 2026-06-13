/** Rito de Ladino — Conta Saldada (R3, NPCS.md). Ver `rito_knight` p/ contexto dos ritos. */
import type { QuestDef } from "../index";

export const rito_rogue: QuestDef = {
  id: "rito_rogue",
  name: "Conta Saldada",
  layer: "direta",
  giverNpcId: "vincente",
  stages: [{ type: "kill", species: "rato", count: 6 }],
  rewards: { xp: 40, gold: 15 },
  journalActive:
    "Vincente sorriu de canto: “O Beco tem um problema de roedores que ninguém quer resolver — o que diz muito de quem resolve. Seis. Sem alarde.”",
  journalCompleted:
    "Seis problemas resolvidos, nenhum barulho. Vincente não viu você fazer — e é por isso que aprovou.",
};
