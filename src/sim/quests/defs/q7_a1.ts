/**
 * Q7 — A Caçada do Peleteiro, ATO 1: "prova de caçador" (QUESTS.md §Q7).
 *
 * Ato 1 (lvl ~4–6): Amaro mede o caçador — trazer 3 Peles de Lobo. Recompensa
 * de XP só; a Faca de Esfolar + o trade de peles vêm no ATO 2 (q7_a2). O
 * destrave do comércio de peles/couro/presas é gateado FORA do QuestDef (o
 * commerce lê o estado da quest), não é mecânica de recompensa daqui.
 *
 * Camada: o doc rotula Q7 "composta (2 atos)"; cada ATO é uma quest `direta`
 * (objetivos explícitos com contador — "trazer 3 peles", "matar Presa-Torta").
 * Gold: o §Q7 narra a recompensa como faca + trade, mas o §Orçamento de Gold
 * (QUESTS.md L31) orça os atos por valor — "Q7 30→60" — então o ato 1 paga 30.
 *
 * IDs EXTERNOS referenciados:
 *  - npcs (cast.ts):            amaro (giver + turn-in)
 *  - items (templates.ts):      pele_de_lobo (collect ×3)
 *  - species/regions/interact:  — (nenhum neste ato)
 */
import type { QuestDef } from "../index";

export const q7_a1: QuestDef = {
  id: "q7_a1",
  name: "A Caçada do Peleteiro",
  layer: "direta",
  giverNpcId: "amaro",
  // talk (aceitar com Amaro) → entregar 3 Peles de Lobo ao Amaro → report.
  stages: [
    { type: "talk", npcId: "amaro" },
    { type: "collect", templateId: "pele_de_lobo", count: 3, turnInNpcId: "amaro" },
  ],
  rewards: { xp: 100, gold: 30 },
  journalActive:
    "Amaro mediu-me de cima a baixo antes de falar: “Caçador eu reconheço pelo couro que traz. Três peles de lobo — inteiras. Aí conversamos.”",
  journalCompleted:
    "As três peles passaram pelas mãos de Amaro sem um reparo. Ele guardou-as em silêncio — e ficou me olhando, como quem decide se conta o resto.",
};
