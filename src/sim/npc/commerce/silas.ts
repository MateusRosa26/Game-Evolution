import type { NpcCommerce } from "./index";

// Silas — boticário (Baixa): vende a Poção Pequena (sempre); compra reagentes
// SÓ após a quest dele (Q3 — a própria quest ensina o que ele compra).
export const silas: NpcCommerce = {
  sells: [{ templateId: "pocao_vida_pequena", price: 65 }],
  buys: [
    { templateId: "cauda_de_rato", price: 2, unlockedBy: "q3_silas" },
    // ✏️ + glandula_de_veneno / seda / asa_de_morcego quando entrarem (gated Q3).
  ],
};
