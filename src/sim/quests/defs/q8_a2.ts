/**
 * Q8 ato 2 — Orelha por Orelha / *Ear for Ear* (QUESTS.md §Nordeste; encadeada,
 * 3 atos, direta). 2º ato: seguir a trilha das orelhas até DESCOBRIR o
 * Acampamento Goblin, reportar ao Vidal e então reduzi-lo. XP/gold bateria M1 +
 * passe 1. Encadeia sobre o ato 1 via `requires`.
 *
 * IDs EXTERNOS referenciados:
 *  - npcs:      "vidal"               (giver + 2 reports — src/sim/npc/cast.ts; Capitão Vidal)
 *  - species:   "goblin"              (kill 12 — reduzir o acampamento; src/sim/bestiary.ts)
 *  - regionIds: "acampamento_goblin"  (descoberta do Acampamento Goblin — a Fase 1e
 *               planta na alvorada.ts; emissão `region_enter` = fatia 0a-bis)
 *  - requires:  "q8_a1"               (ato 1 — src/sim/quests/defs/q8_a1.ts)
 */
import type { QuestDef } from "../index";

export const q8_a2: QuestDef = {
  id: "q8_a2",
  name: "Orelha por Orelha — O Acampamento",
  layer: "direta",
  giverNpcId: "vidal",
  // talk (aceitar com Vidal) → seguir a trilha e ENTRAR no Acampamento Goblin
  // (region_enter — descoberta) → talk (reportar a localização ao Vidal) →
  // reduzir o acampamento: matar 12 goblins → report final (volta ao Vidal). A
  // emissão do `region_enter` vem na fatia 0a-bis; "acampamento_goblin" é a
  // região plantada na alvorada.ts (Fase 1e).
  stages: [
    { type: "talk", npcId: "vidal" },
    { type: "region_enter", regionId: "acampamento_goblin" },
    { type: "talk", npcId: "vidal" },
    { type: "kill", species: "goblin", count: 12 },
  ],
  requires: ["q8_a1"],
  rewards: { xp: 150, gold: 50 },
  journalActive:
    "A trilha das orelhas sobe pela orla. Vidal quer saber de onde vêm — achar o ninho deles e voltar com a posição.",
  journalCompleted:
    "Era um acampamento inteiro. Reduzi o que pude. Vidal franziu a testa: “Goblin não se organiza sozinho.”",
};
