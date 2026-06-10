/**
 * Receitas de cozinha como DADOS (design/itens/COZINHA.md). Uma receita consome
 * `inputs` (ingredientes + vasilhame; a água vem da proximidade, ver `needsFreshWater`)
 * e produz 1 unidade de `output`. O verbo `cook` na Simulation valida e executa.
 *
 * Receita é CONHECIMENTO, não skill com nível — o gate é orgânico (ingrediente de
 * mob forte + custo comprado + quest), nunca um nível. Números/itens = ✏️ Balancista.
 * SIM only — determinístico, sem pixi/browser.
 */

/** Uma entrada da receita: `qty` unidades do template. */
export interface RecipeInput {
  templateId: string;
  qty: number;
}

/** Receita declarativa. */
export interface Recipe {
  id: string;
  name: string;
  /** Itens consumidos (ingredientes + vasilhame). */
  inputs: RecipeInput[];
  /** Template produzido (1 unidade). */
  output: string;
  /** Gate de quest: só cozinha após completar esta quest (✏️ Q6 do Bento). */
  unlockQuest?: string;
  /** Exige estar perto de uma fonte de calor (fogueira/fogão). */
  needsHeat?: boolean;
  /** Exige estar perto de água-doce (poço/rio doce) — mar não serve. */
  needsFreshWater?: boolean;
}

/**
 * Receitas do MVP (COZINHA.md §faseamento). Cozido = receita simples (matéria +
 * calor); preparado/premium = + ingrediente comprado. `unlockQuest` fica de fora
 * por ora (a Q6 do Bento ainda não existe no código) — destravado quando entrar.
 */
export const RECIPES: Record<string, Recipe> = {
  // Cozido (2×): só assar a matéria-prima crua.
  carne_assada: {
    id: "carne_assada",
    name: "Carne Assada",
    inputs: [{ templateId: "carne_crua", qty: 1 }],
    output: "carne_assada",
    needsHeat: true,
  },
  // Premium (3×): + ingrediente comprado.
  queijo_quente: {
    id: "queijo_quente",
    name: "Queijo Quente",
    inputs: [
      { templateId: "pao", qty: 1 },
      { templateId: "queijo", qty: 1 },
      { templateId: "sal_gema", qty: 1 },
    ],
    output: "queijo_quente",
    needsHeat: true,
  },
  // Premium curada — SALGA, não cozimento (sem calor; ✏️ poderia ser gated Q6).
  carne_curada: {
    id: "carne_curada",
    name: "Carne Curada",
    inputs: [
      { templateId: "carne_crua", qty: 1 },
      { templateId: "sal_gema", qty: 1 },
      { templateId: "pimenta_longa", qty: 1 },
    ],
    output: "carne_curada",
  },
  // Premium — sopa: pote (1-uso) + matéria + sal, com ÁGUA-DOCE da fonte.
  sopa: {
    id: "sopa",
    name: "Sopa",
    inputs: [
      { templateId: "pote", qty: 1 },
      { templateId: "carne_crua", qty: 1 },
      { templateId: "sal_gema", qty: 1 },
    ],
    output: "sopa",
    needsHeat: true,
    needsFreshWater: true,
  },
  // Premium caster (mana): pão + mel.
  favo_assado: {
    id: "favo_assado",
    name: "Favo Assado",
    inputs: [
      { templateId: "pao", qty: 1 },
      { templateId: "mel_silvestre", qty: 1 },
    ],
    output: "favo_assado",
    needsHeat: true,
  },
};
