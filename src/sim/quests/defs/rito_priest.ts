/** Rito de Sacerdote — Descanso (R4, NPCS.md). Ver `rito_knight` p/ contexto dos ritos. */
import type { QuestDef } from "../index";

export const rito_priest: QuestDef = {
  id: "rito_priest",
  name: "Descanso",
  layer: "direta",
  giverNpcId: "gabriel",
  stages: [{ type: "kill", species: "esqueleto", count: 5 }],
  rewards: { xp: 40, gold: 15 },
  journalActive:
    "Gabriel estendeu a mão aos ossos inquietos sem uma palavra; depois, baixo: “Há mortos que não dormem. Cinco deles. Devolva-os ao silêncio — não por ódio, por piedade.”",
  journalCompleted:
    "Cinco que vagavam, agora quietos. Gabriel apenas inclinou a cabeça. A piedade, você aprendeu, também tem gume.",
};
