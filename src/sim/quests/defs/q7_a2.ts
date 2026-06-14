/**
 * Q7 — A Caçada do Peleteiro, ATO 2: Presa-Torta (QUESTS.md §Q7).
 *
 * Ato 2 (lvl ~8–9): Amaro conta do javali velho do fundo do Matagal, grande
 * demais pra ele — Presa-Torta (*Crooktusk*). Encadeado pelo `requires:[q7_a1]`.
 * Matar e reportar: o `kill` credita TODOS que contribuíram (mob único do mundo,
 * respawn lento, zero phasing — isso vive no spawn/bestiário, não no QuestDef);
 * sem item de quest, a sim rastreia o evento de morte.
 *
 * Recompensa: 250 XP + Faca de Esfolar (a ferramenta E o símbolo). O destrave do
 * trade de peles/couro/presas é gateado FORA do QuestDef (o commerce lê o estado
 * da quest). Gold: o §Orçamento de Gold (QUESTS.md L31) orça "Q7 30→60" — o ato
 * 2 paga 60 (o §Q7 só narra a faca + trade, mas o orçamento manda no valor).
 *
 * Camada: cada ATO é `direta` (objetivo explícito com contador — matar 1
 * Presa-Torta). Ver q7_a1 pra a nota de camada/gold.
 *
 * IDs EXTERNOS referenciados:
 *  - npcs (cast.ts):       amaro (giver: a fala do ato 2 + report)
 *  - species (bestiary.ts): presa_torta (kill ×1 — named do Javali)
 *  - items (templates.ts):  faca_de_esfolar (recompensa)
 *  - requires:             q7_a1 (ato anterior)
 *  - regions/interact:      — (nenhum)
 */
import type { QuestDef } from "../index";

export const q7_a2: QuestDef = {
  id: "q7_a2",
  name: "A Caçada do Peleteiro — Presa-Torta",
  layer: "direta",
  giverNpcId: "amaro",
  requires: ["q7_a1"],
  // talk (Amaro conta de Presa-Torta) → matar Presa-Torta no Matagal → report.
  stages: [
    { type: "talk", npcId: "amaro" },
    { type: "kill", species: "presa_torta", count: 1 },
  ],
  rewards: { xp: 250, gold: 60, items: [{ templateId: "faca_de_esfolar" }] },
  journalActive:
    "Amaro baixou a voz: “Há um no fundo do Matagal. Velho, com a presa torta de tantas brigas. Grande demais pra mim sozinho. Traz-me a cabeça d’ele — e eu te dou a faca que faz de ti um peleteiro.”",
  journalCompleted:
    "Presa-Torta caiu. Amaro não acreditou até ver a cicatriz da presa. Agora compra o que eu esfolar.",
};
