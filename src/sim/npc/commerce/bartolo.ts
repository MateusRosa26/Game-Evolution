import type { NpcCommerce } from "./index";

// Bartolo — Estalagem do Vau: estalajadeiro E cozinheiro (Bento fundido nele,
// jun/2026). Vende comida + pratos prontos; compra ingredientes pós-Q6.
export const bartolo: NpcCommerce = {
  sells: [
    { templateId: "pao", price: 2 },
    { templateId: "carne_assada", price: 6 },
    { templateId: "sal_gema", price: 8 }, // cozinha: cidade inicial = só básico (Bento fundido no Bartolo)
    { templateId: "pote", price: 5 },     // Pimenta-longa/Mel Silvestre = outras cidades
  ],
  buys: [
    { templateId: "carne_crua", price: 1 }, // compra matéria-prima de caça
  ],
};
