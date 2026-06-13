import type { NpcCommerce } from "./index";

// Duarte — ferreiro (Baixa): FONTE ÚNICA de gear de combate (revisado jun/2026)
// — armas + escudo + armadura (metal/couro básico). Compra sucata pós-Q4.
export const duarte: NpcCommerce = {
  sells: [
    { templateId: "espada_curta", price: 40 },
    { templateId: "machado_de_mao", price: 60 },
    { templateId: "clava", price: 40 },
    { templateId: "adaga", price: 40 },
    // Armadura & escudo T1 (portados de EQUIPAMENTO.md — preços ✏️ Balancista/ECONOMIA).
    { templateId: "coifa_de_couro", price: 15 },
    { templateId: "tunica_de_couro", price: 30 },
    { templateId: "calcas_de_couro", price: 25 },
    { templateId: "botas_de_couro", price: 15 },
    { templateId: "escudo_de_madeira", price: 25 },
  ],
  buys: [
    // ✏️ + sucata_de_arma / adaga_enferrujada / escudo_lascado (gated Q4).
  ],
};
