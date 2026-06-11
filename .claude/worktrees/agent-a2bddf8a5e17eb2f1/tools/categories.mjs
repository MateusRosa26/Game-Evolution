// Fonte única do mapa item → categoria de pasta (sprites organizados por categoria,
// alinhado ao ItemCategory da sim: weapon/shield/armor/consumable/tool/material;
// `container` é categoria só-de-sprite até a sim codificar). Usado por finalize-item.mjs
// e preview-items.mjs. Ao aprovar item novo, adicione a entrada aqui.
export const ITEM_CATEGORY = {
  // weapon
  "espada-curta": "weapon", "espada-cega": "weapon", "adaga": "weapon",
  "machado-de-mao": "weapon", "clava": "weapon", "cajado-simples": "weapon", "cetro": "weapon",
  // shield
  "escudo-de-madeira": "shield",
  // armor (equipáveis defensivos + joias, espelha a sim coarse de hoje)
  "coifa-de-couro": "armor", "tunica-de-couro": "armor", "calcas-de-couro": "armor",
  "botas-de-couro": "armor", "luvas-de-couro": "armor", "gibao-roto": "armor",
  "botas-surradas": "armor", "capuz-do-cacador": "armor", "robe-do-erudito": "armor",
  "peitoral-da-muralha": "armor", "botas-do-viajante": "armor", "anel-de-regeneracao-menor": "armor",
  // consumable
  "pao": "consumable", "carne-assada": "consumable", "carne-crua": "consumable", "pocao-vida-pequena": "consumable",
  // tool
  "pa": "tool", "corda": "tool", "tocha": "tool", "faca-de-esfolar": "tool",
  // material
  "cauda-de-rato": "material",
  // container (só-sprite por enquanto)
  "sacola-pano": "container",
};

export function categoryOf(id) {
  const c = ITEM_CATEGORY[id];
  if (!c) throw new Error(`sem categoria p/ "${id}" — adicione em tools/categories.mjs`);
  return c;
}
