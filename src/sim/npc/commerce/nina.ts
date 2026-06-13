import type { NpcCommerce } from "./index";

// Nina — Loja Geral (Baixa): vendor floor. A opção PREGUIÇOSA — vende o básico
// e compra quase tudo a preço ruim (sempre aberto, sem gating).
export const nina: NpcCommerce = {
  // Só UTILITÁRIOS (revisado jun/2026): a Loja Geral NÃO vende mais armas —
  // o gear de combate é exclusivo do Ferreiro (Duarte). Tira a sobreposição.
  sells: [
    { templateId: "pao", price: 2 },
    { templateId: "tocha", price: 3 },
    { templateId: "corda", price: 15 },
    { templateId: "pa", price: 20 },
    // ✏️ + flechas / sacola quando os templates entrarem.
  ],
  buys: [
    // Vendor floor: paga MENOS que o especialista (cauda 1 vs 2 no Silas).
    { templateId: "cauda_de_rato", price: 1 },
  ],
};
