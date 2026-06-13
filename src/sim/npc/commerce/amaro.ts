import type { NpcCommerce } from "./index";

// Amaro — caçador-peleteiro (Cais): compra peles/couro/presas pós-Q7 (A Caçada
// do Peleteiro). A Faca de Esfolar vem como RECOMPENSA da quest, não venda.
export const amaro: NpcCommerce = {
  sells: [],
  buys: [
    // ✏️ + pele_de_lobo / couro_grosso / presa_de_javali (gated q7_amaro).
  ],
};
