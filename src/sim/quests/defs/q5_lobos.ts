/**
 * Q5 — Lobos Demais / *Too Many Wolves* (QUESTS.md §Nordeste; XP/gold calibrados,
 * bateria M1 + passe 1 de gold). Direta de nível-alvo 3–5: o Capitão Vidal não
 * tem homens (a muralha consome tudo) e pede que a alcateia da orla seja reduzida.
 *
 * Fecha o report destravando, na cidade, o **bounty de orelhas de goblin** (o
 * Vidal passa a comprar — comércio gated pós-Q5, vive em `npc/commerce`) e ABRE
 * **Orelha por Orelha (Q8)**, que gateia por `requires:["q5_lobos"]` no próprio
 * Q8 — não é responsabilidade deste def.
 *
 * IDs EXTERNOS referenciados (conferidos à mão — tsc não valida strings):
 *  - npcs    : "vidal"  (Capitão Vidal — src/sim/npc/cast.ts) — giver E turn-in
 *  - species : "lobo"   (Lobo, T1 — src/sim/bestiary.ts)
 *
 * NOTA mapId: a "Toca dos Lobos" é o spot S4 do MESMO overworld ("alvorada"), não
 * um mapa à parte — então a etapa `kill` fica SEM `mapId` (qualquer lugar conta, e
 * o crédito emite sempre `mapId: "alvorada"`). O spot da caça vive no journal/comentário,
 * igual ao Q1. ✏️ pôr `mapId` só se a Toca virar um mapa próprio (multi-mapa).
 */
import type { QuestDef } from "../index";

export const q5_lobos: QuestDef = {
  id: "q5_lobos",
  name: "Lobos Demais",
  layer: "direta",
  giverNpcId: "vidal",
  // talk (aceitar com Vidal) → caçar 8 lobos na Toca dos Lobos (orla da mata, S4)
  // → talk (report ao Vidal). Contador discreto no diário (é direta).
  stages: [
    { type: "talk", npcId: "vidal" },
    { type: "kill", species: "lobo", count: 8 },
  ],
  // XP 100 (orçamento M1) + gold 30 (passe 1). Destravar o bounty de orelhas é
  // recompensa de COMÉRCIO (gated pós-Q5), não item de inventário — fica fora daqui.
  rewards: { xp: 100, gold: 30 },
  journalActive:
    "O Capitão Vidal quer a alcateia da orla reduzida. “Atacaram dois viajantes esta semana. Não tenho homens — a muralha consome tudo.”",
  journalCompleted:
    "Alcateia reduzida. O Capitão Vidal agora paga por orelha de goblin — “praga pior que lobo”.",
};
