import type { NpcCommerce } from "./index";

// Silas — boticário (Loja de Poções, Baixa): vende a Poção Pequena (sempre, luxo
// de emergência); compra REAGENTES de verme/aranha/morcego SÓ após a quest dele
// (q3_reagentes — "a própria quest ensina o que ele compra", ITENS-LOOTS.md).
//
// Preços ✏️ Balancista (ECONOMIA.md §"Gold T1 — 1º passe"): Poção Pequena 65
// (≈33min de caça = luxo); reagente vendido a 2 no especialista (vs 1 no vendor
// floor da Nina — a diferença paga o conhecimento de "quem compra o quê").
export const silas: NpcCommerce = {
  sells: [{ templateId: "pocao_vida_pequena", price: 65 }],
  buys: [
    // Reagentes destravados pela quest do boticário (q3_reagentes). A Cauda de
    // Rato também é comprada pela Nina (floor 1), aqui a 2 — venda informada > preguiçosa.
    { templateId: "cauda_de_rato", price: 2, unlockedBy: "q3_reagentes" },
    { templateId: "asa_de_morcego", price: 2, unlockedBy: "q3_reagentes" },
    { templateId: "glandula_de_veneno", price: 3, unlockedBy: "q3_reagentes" }, // reagente de aranha (T2) — paga um pouco mais
    { templateId: "seda", price: 2, unlockedBy: "q3_reagentes" },
  ],
};
