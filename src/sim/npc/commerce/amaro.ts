import type { NpcCommerce } from "./index";

// Amaro — caçador-peleteiro (Cais): NÃO vende (a Faca de Esfolar vem como
// RECOMPENSA da quest, não venda). Compra troféus de caça — peles/couro/presas
// — SÓ após o ATO 2 da Caçada do Peleteiro (q7_a2: matar Presa-Torta), quando o
// journal fecha com "Agora compra o que eu esfolar". O Ato 1 (q7_a1) ainda mede
// o caçador; o trade só abre no clímax.
//
// Preços ✏️ Balancista: troféu de caça a 2 no especialista (ECONOMIA.md — a renda
// real é vender no comprador certo; couro grosso pesa mais → vale um pouco mais).
export const amaro: NpcCommerce = {
  sells: [],
  buys: [
    { templateId: "pele_de_lobo", price: 2, unlockedBy: "q7_a2" },
    { templateId: "couro_grosso", price: 3, unlockedBy: "q7_a2" }, // couro pesado (Javali/Presa-Torta) — paga acima da pele de lobo
    { templateId: "presa_de_javali", price: 2, unlockedBy: "q7_a2" },
  ],
};
