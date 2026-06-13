import type { NpcCommerce } from "./index";

// Capitão Vidal — Quartel da Guarda: NÃO vende (é guarda, não mercador). Paga
// BOUNTY de Orelha de Goblin SÓ após Lobos Demais (q5_lobos), cujo report fecha
// com "agora paga por orelha de goblin — praga pior que lobo". O contrato de
// bounty é a recompensa-de-relação da quest.
//
// Preço ✏️ Balancista: orelha 2 (ECONOMIA.md §"Gold T1 — 1º passe": bounty do
// Capitão = 2). A Orelha também é item de coleta da Q8 (Orelha por Orelha), gated
// no próprio QuestDef — aqui é só a face de COMÉRCIO (vender orelha avulsa).
export const vidal: NpcCommerce = {
  sells: [],
  buys: [{ templateId: "orelha_de_goblin", price: 2, unlockedBy: "q5_lobos" }],
};
