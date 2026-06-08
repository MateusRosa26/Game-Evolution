import type { DamageType, PlayerClass } from "../../shared/types";

/**
 * Templates de item como DADOS, não código (DESIGN-EVOLUCAO.md §"Implicações
 * técnicas": "Itens são instâncias com ID + ledger, não stacks de template").
 *
 * O TEMPLATE é a parte COMPARTILHADA e imutável de um item (a "ficha de fábrica"):
 * nome, slot, tags, dano/cooldown base da arma, raridade. A parte ÚNICA por item
 * (ID + ledger de proveniência) vive na INSTÂNCIA (ver `instances.ts`).
 *
 * SIM only — zero pixi/browser, determinístico. Comentários pt-BR.
 *
 * M2 (inventário/equipamento com UI) virá depois; isto é a FUNDAÇÃO de dados que
 * o design manda definir cedo "para não retrofitar". Hoje só o slot `weapon` é
 * usado (auto-attack + skills de arma).
 */

/** Slot de equipamento. Só `weapon` é usado agora; os demais ficam declarados. */
export type ItemSlot = "weapon" | "shield" | "armor";

/**
 * Tags de item (família/arquétipo da arma). Alimentam as "lentes" de rastreamento
 * das classes (Knight rastreia "por tipo de arma" — espada/machado/maça) e os
 * Caminhos de estilo. Strings estáveis (chaves de dados — não traduzir).
 */
export type ItemTag =
  | "espada"
  | "adaga"
  | "cajado"
  | "cetro"
  | "machado" // declarado p/ bestiário/armas futuras
  | "maca" // idem
  | "desarmado"; // "punhos" — luta sem arma equipada

/**
 * Raridade do item. DEFINE o nº de slots de Marca (DESIGN-EVOLUCAO.md §"Acúmulo":
 * comuns→raros = 1, lendários = 2, únicos = 3). `markSlotsForRarity` traduz isto;
 * a wave de Marcas (futura) consome esse número ao cristalizar uma Marca.
 */
export type ItemRarity = "common" | "uncommon" | "rare" | "legendary" | "unique";

/**
 * Nº de slots de Marca por raridade (DESIGN-EVOLUCAO.md §"Acúmulo (slots de
 * Marca por raridade)"). Comuns→raros = 1, lendários = 2, únicos = 3.
 *
 * NOTA: o ledger CONTINUA contando mesmo com slots cheios (regra do design);
 * `markSlots` só limita quantas Marcas podem cristalizar, não o que se rastreia.
 */
export function markSlotsForRarity(rarity: ItemRarity): number {
  switch (rarity) {
    case "common":
    case "uncommon":
    case "rare":
      return 1;
    case "legendary":
      return 2;
    case "unique":
      return 3;
  }
}

/** Stats de arma de um template (só presentes quando `slot === "weapon"`). */
export interface WeaponStats {
  /**
   * Dano-base da arma. Entra em `formulas.physicalDamage(attrs, weaponBase)` —
   * SUBSTITUI o placeholder `STARTER_WEAPON_DAMAGE` de `balance.ts`. ✏️ calibrar M2.
   */
  baseDamage: number;
  /**
   * Cooldown-base do auto-attack desta arma, em ms. Passado como `weaponBaseCooldown`
   * a `formulas.attackCooldownMs(attrs, base)` (a Destreza reduz). ✏️ calibrar M2.
   */
  baseCooldownMs: number;
  /** Tipo de dano do auto-attack desta arma (M1: todas físicas). */
  damageType: DamageType;
  /**
   * Auto-attack/skills desta arma escalam com Destreza em vez de Força?
   * (adagas — DESIGN-EVOLUCAO.md §Stats: "dano de adagas/distância" = Destreza).
   */
  usesDexterity: boolean;
}

/** Template declarativo de um item (a parte compartilhada/imutável). */
export interface ItemTemplate {
  /** ID estável do template (chave de dados — NÃO é o ID da instância). */
  id: string;
  /** Nome exibível (pt-BR). */
  name: string;
  slot: ItemSlot;
  tags: ItemTag[];
  rarity: ItemRarity;
  /**
   * PESO do item (unidade de carga; entra no cap = `formulas.maxCarry`). Cria a
   * "decisão de mochila" (DESIGN-ITENS/CONSUMIVEIS). **Escala-Tibia** (decidido
   * jun/2026, estudo de referência): espada 35, machado-de-mão 25, adaga 10…;
   * armaduras pesam mais (placa ~120) quando entrarem. Balancista fina-calibra.
   * Punhos = 0 (não se carrega).
   */
  weight: number;
  /** Stats de arma — presente só quando `slot === "weapon"`. */
  weapon?: WeaponStats;
}

/**
 * Peso do ouro (decidido jun/2026, criador): cada moeda pesa `0.1`, mas SÓ as
 * primeiras `150` moedas têm peso — acima disso o ouro extra é SEM PESO. Teto de
 * 15 de peso (150×0.1); 200 de ouro = 15 de peso. Evita que hoardar ouro trave a
 * caça, mantendo um custo inicial de carga. Ouro stacka ilimitado em 1 slot.
 */
export const GOLD_WEIGHT_PER_COIN = 0.1;
export const GOLD_WEIGHT_CAP_COINS = 150;

/** Peso de uma pilha de `amount` moedas (com teto em GOLD_WEIGHT_CAP_COINS). */
export function goldWeight(amount: number): number {
  return Math.min(amount, GOLD_WEIGHT_CAP_COINS) * GOLD_WEIGHT_PER_COIN;
}

// ─────────────────────────────────────────────────────────────────────────
//  Templates de arma T1 (DESIGN-ITENS.md §"Tabela de itens — T1")
//  NÚMEROS DECIDIDOS (criador, jun/2026 — proposta do catálogo validada em
//  sim, report `2026-06-05-catalogo-t1-t2-proposta.md`): escala BAIXA por
//  design ("tudo baixo"); diferenciação T1 é CADÊNCIA, não base (contagem
//  de golpes vs 24hp). Casters seguem placeholder até o auto mágico fixo.
// ─────────────────────────────────────────────────────────────────────────

/** Espada curta — kit do Knight (rito/vendor). A RÉGUA do T1: TTK 1,95s. */
export const ESPADA_CURTA: ItemTemplate = {
  id: "espada_curta",
  name: "Espada Curta",
  weight: 35, // escala-Tibia
  slot: "weapon",
  tags: ["espada"],
  rarity: "common",
  weapon: { baseDamage: 6, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false },
};

/** Espada Cega — kit de NASCIMENTO (casa inicial, classless). A régua do zero:
 *  abaixo da espada de rito, zero bônus, venda ≈ 0. (Sim classless é wave futura;
 *  o template já existe para o rito trocar Cega → arma da classe.) */
export const ESPADA_CEGA: ItemTemplate = {
  id: "espada_cega",
  name: "Espada Cega",
  weight: 35, // escala-Tibia (sword ~35)
  slot: "weapon",
  tags: ["espada"],
  rarity: "common",
  weapon: { baseDamage: 4, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false },
};

/** Machado de Mão — rito/vendor. Golpe pesado: o único perfil T1 que separa o
 *  TTK (cruza o breakpoint de 2 golpes até classless). Paga no CD. */
export const MACHADO_DE_MAO: ItemTemplate = {
  id: "machado_de_mao",
  name: "Machado de Mão",
  weight: 25, // escala-Tibia (hand axe ~25)
  slot: "weapon",
  tags: ["machado"],
  rarity: "common",
  weapon: { baseDamage: 8, baseCooldownMs: 2400, damageType: "physical", usesDexterity: false },
};

/** Clava — rito/vendor. Intermediária; a identidade "impacto" mora no subtipo
 *  físico (camada-sussurro ±10%, wave futura), não no número bruto. */
export const CLAVA: ItemTemplate = {
  id: "clava",
  name: "Clava",
  weight: 20, // escala-Tibia (club ~19)
  slot: "weapon",
  tags: ["maca"],
  rarity: "common",
  weapon: { baseDamage: 6, baseCooldownMs: 2100, damageType: "physical", usesDexterity: false },
};

/** Cajado simples — kit do Mage. PLACEHOLDER: o design pede auto-attack mágico
 *  com dano FIXO em faixa por tier (7–9 no T1, não escala Int — DESIGN-ITENS);
 *  a sim ainda trata como físico. Numerar quando o auto mágico fixo entrar. */
export const CAJADO_SIMPLES: ItemTemplate = {
  id: "cajado_simples",
  name: "Cajado Simples",
  weight: 28, // escala-Tibia
  slot: "weapon",
  tags: ["cajado"],
  rarity: "common",
  weapon: { baseDamage: 3, baseCooldownMs: 2200, damageType: "physical", usesDexterity: false },
};

/** Adaga — kit do Rogue (rito/vendor). A mais rápida do T1 (TTK 1,45s):
 *  "fraca por golpe", escala com Destreza. Decidido jun/2026. */
export const ADAGA: ItemTemplate = {
  id: "adaga",
  name: "Adaga",
  weight: 10, // escala-Tibia (dagger ~9.5)
  slot: "weapon",
  tags: ["adaga"],
  rarity: "common",
  weapon: { baseDamage: 5, baseCooldownMs: 1600, damageType: "physical", usesDexterity: true },
};

/** Cetro — kit do Priest. Baixo dano físico (o Priest luta com magia sagrada). */
export const CETRO: ItemTemplate = {
  id: "cetro",
  name: "Cetro",
  weight: 30, // escala-Tibia
  slot: "weapon",
  tags: ["cetro"],
  rarity: "common",
  weapon: { baseDamage: 3, baseCooldownMs: 2200, damageType: "physical", usesDexterity: false },
};

/**
 * Punhos — arma IMPLÍCITA do desarmado (DESIGN-EVOLUCAO.md §Caminho Monge "Mão
 * Vazia"). DECISÃO (documentada): "punhos" é um template REAL, não um caso
 * especial, para que o pipeline (dano da arma, ledger, instância equipada) seja
 * UNIFORME — desarmar = equipar a instância de punhos, nunca um `null` especial.
 *
 * Tag `desarmado` é o que o Caminho Monge lerá ("nunca equipou arma" = só usou
 * `desarmado`). Antes valia `STARTER_WEAPON_ID = "fists"` em `balance.ts`.
 */
export const PUNHOS: ItemTemplate = {
  id: "fists",
  name: "Punhos",
  weight: 0, // não se carrega
  slot: "weapon",
  tags: ["desarmado"],
  rarity: "common",
  weapon: { baseDamage: 2, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false },
};

/** Registro de templates por ID — ponto único de lookup. */
export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  [ESPADA_CURTA.id]: ESPADA_CURTA,
  [ESPADA_CEGA.id]: ESPADA_CEGA,
  [MACHADO_DE_MAO.id]: MACHADO_DE_MAO,
  [CLAVA.id]: CLAVA,
  [CAJADO_SIMPLES.id]: CAJADO_SIMPLES,
  [ADAGA.id]: ADAGA,
  [CETRO.id]: CETRO,
  [PUNHOS.id]: PUNHOS,
};

/** Lookup de template por ID (undefined = desconhecido). */
export function getItemTemplate(id: string): ItemTemplate | undefined {
  return ITEM_TEMPLATES[id];
}

/**
 * Arma inicial de cada classe (DESIGN-EVOLUCAO.md §Classes "Kit inicial").
 * O jogador ganha a INSTÂNCIA desta arma equipada no spawn (ver Simulation).
 */
export const STARTER_WEAPON_BY_CLASS: Record<PlayerClass, string> = {
  knight: ESPADA_CURTA.id,
  mage: CAJADO_SIMPLES.id,
  rogue: ADAGA.id,
  priest: CETRO.id,
};

/** ID do template dos punhos (desarmado) — fonte de verdade. */
export const FISTS_TEMPLATE_ID = PUNHOS.id;
