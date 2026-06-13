/**
 * Ritos de classe (R1-R4, NPCS.md) — um arquivo por rito.
 *
 * Trial do rito: feito ENQUANTO classless (só auto-attack), então é kill-based
 * e flavored pela classe pretendida. Gateia o `chooseClass` via
 * RITO_QUEST_BY_CLASS. Falas/alvos = rascunho ✏️ Loremaster + world-designer
 * (ajustar espécie/contagem quando os distritos e spawns temáticos entrarem).
 */
import type { QuestDef } from "../index";

export const rito_knight: QuestDef = {
  id: "rito_knight",
  name: "Prova de Aço",
  layer: "direta",
  giverNpcId: "ricardo",
  stages: [{ type: "kill", species: "rato", count: 6 }],
  rewards: { xp: 40, gold: 15 },
  journalActive:
    "Ricardo cruzou os braços: “Caminho do Cavaleiro não começa com juramento, começa com calo. Traz seis ratos a menos no mundo. Aço aprende é apanhando.”",
  journalCompleted:
    "Seis golpes que não tremeram. Ricardo não elogiou — só assentiu. Dizem que o aceno dele vale mais que medalha.",
};
