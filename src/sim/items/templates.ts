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
  /** Stats de arma — presente só quando `slot === "weapon"`. */
  weapon?: WeaponStats;
}

// ─────────────────────────────────────────────────────────────────────────
//  Templates do kit inicial das 4 classes (DESIGN-EVOLUCAO.md §Classes)
//  Números PLACEHOLDER — calibrar no M2. Base alinhada ao antigo
//  STARTER_WEAPON_DAMAGE (6) para não mudar o balance atual de cara.
// ─────────────────────────────────────────────────────────────────────────

/** Espada curta — kit do Knight. */
export const ESPADA_CURTA: ItemTemplate = {
  id: "espada_curta",
  name: "Espada Curta",
  slot: "weapon",
  tags: ["espada"],
  rarity: "common",
  weapon: { baseDamage: 6, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false },
};

/** Cajado simples — kit do Mage. Baixo dano físico (o Mage luta com magia). */
export const CAJADO_SIMPLES: ItemTemplate = {
  id: "cajado_simples",
  name: "Cajado Simples",
  slot: "weapon",
  tags: ["cajado"],
  rarity: "common",
  weapon: { baseDamage: 3, baseCooldownMs: 2200, damageType: "physical", usesDexterity: false },
};

/** Adaga — kit do Rogue. Escala com Destreza, ataca mais rápido. */
export const ADAGA: ItemTemplate = {
  id: "adaga",
  name: "Adaga",
  slot: "weapon",
  tags: ["adaga"],
  rarity: "common",
  weapon: { baseDamage: 5, baseCooldownMs: 1600, damageType: "physical", usesDexterity: true },
};

/** Cetro — kit do Priest. Baixo dano físico (o Priest luta com magia sagrada). */
export const CETRO: ItemTemplate = {
  id: "cetro",
  name: "Cetro",
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
  slot: "weapon",
  tags: ["desarmado"],
  rarity: "common",
  weapon: { baseDamage: 2, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false },
};

/** Registro de templates por ID — ponto único de lookup. */
export const ITEM_TEMPLATES: Record<string, ItemTemplate> = {
  [ESPADA_CURTA.id]: ESPADA_CURTA,
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
