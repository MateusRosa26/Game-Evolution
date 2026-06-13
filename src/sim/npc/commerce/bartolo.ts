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
    // Ingredientes de caça destravados por O Prato do Cozinheiro (q6_prato: o
    // report fecha com "compra o que eu caçar" — a renda não-combate do cozinheiro).
    { templateId: "carne_crua", price: 1, unlockedBy: "q6_prato" }, // matéria-prima de besta (loot de lobo/javali)
    { templateId: "carne_de_caca", price: 2, unlockedBy: "q6_prato" }, // corte de caça (acima da carne crua) — o que a Q6 entrega
  ],
};
