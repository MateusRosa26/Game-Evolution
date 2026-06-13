import type { DamageType, PlayerClass } from "../../shared/types";
import { WAND_RANGE } from "../balance";

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

/** Slot de equipamento (mapeia para os EquipSlot de vestir; `armor`=torso). */
export type ItemSlot = "weapon" | "shield" | "armor" | "helmet" | "legs" | "boots";

/**
 * Stats de armadura — Def PLANA subtraída do dano físico recebido. Presente em
 * peças de vestir (helmet/armor/legs/boots). Ordem da mitigação (decidida — report
 * kit/itens 2026-06-04): bloqueio% → Def flat → piso 1.
 */
export interface ArmorStats {
  /** Def plana subtraída do dano FÍSICO recebido. */
  def: number;
}

/** Bloqueio de escudo — chance de absorver um CHUNK do golpe (NUNCA 100%). */
export interface BlockStats {
  /** Chance [0..1] de bloquear um golpe recebido. */
  chance: number;
  /** Fração [0..1] do dano absorvida ao bloquear (✏️ ~0.7). */
  chunkPct: number;
}

/**
 * Categoria do item — o classificador largo (acima do slot de equipamento).
 * `weapon`/`shield`/`armor` são EQUIPÁVEIS (têm `slot`); `consumable`/`tool`/
 * `material` não se equipam. O comércio (NPCs) e o loot operam sobre categorias:
 * o boticário compra `material` (reagentes), o vendor vende `consumable`/`tool`.
 *
 * Efeitos concretos (comida ativa saciedade, poção cura, ferramenta destrava
 * verbo) são wave M2 — aqui a categoria só dá ao item uma IDENTIDADE de dados
 * para que ele já exista como vendável/saqueável (✏️ efeitos depois).
 */
export type ItemCategory =
  | "weapon"
  | "shield"
  | "armor"
  | "consumable" // comida, poção (sustain)
  | "tool" // corda, pá, tocha, faca de esfolar (utilidade/exploração)
  | "container" // mochila/sacola — carrega outros itens (capacidade própria)
  | "material" // loot vendável (peles, glândulas, sucata — reagente/troféu)
  | "ingredient" // tempero/insumo de cozinha — NÃO comível sozinho, só em receita (COZINHA.md)
  | "vessel" // vasilhame de cozinha (pote) — 1-uso, vira o prato e some ao comer
  | "quest"; // item de quest puro (pacote, carta) — não-vendável, só objetivo

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
  /** Tipo de dano do auto-attack desta arma (físicas = "physical"; wands = "arcane"). */
  damageType: DamageType;
  /**
   * Auto-attack/skills desta arma escalam com Destreza em vez de Força?
   * (adagas — DESIGN-EVOLUCAO.md §Stats: "dano de adagas/distância" = Destreza).
   */
  usesDexterity: boolean;
  /**
   * Arma MÁGICA (wand/cetro)? Quando `true`, o auto-attack:
   *  - NÃO escala com nenhum atributo (o dano é da PRÓPRIA arma);
   *  - rola uniformemente na faixa `[damageMin, damageMax]` por tiro;
   *  - CUSTA `manaCost` de mana por tiro (sem mana = não dispara);
   *  - tem cadência FIXA (`baseCooldownMs` sem redução por Destreza).
   * `baseDamage` é IGNORADO no auto quando `magic` é `true`.
   * (Decidido 09/jun/2026, modelo Tibia. Faixa/custo = placeholder ✏️ Balancista.)
   */
  magic?: boolean;
  /** Dano mínimo do tiro mágico (só `magic`). */
  damageMin?: number;
  /** Dano máximo do tiro mágico (só `magic`). */
  damageMax?: number;
  /**
   * Mana gasta por tiro do auto mágico (só `magic`). SOBE COM O TIER da wand
   * (decidido jun/2026): wand mais forte custa mais mana/tiro — uma wand de tier
   * alto NÃO se banca só no regen de um mago que não investiu em mana, criando
   * tensão de stat/gear. Ladder T1→T5 ✏️ Balancista (T1 = 2). Ver EQUIPAMENTO.md.
   */
  manaCost?: number;
  /**
   * Alcance do auto-attack em tiles (Chebyshev). Ausente = melee (`MELEE_RANGE`,
   * 1). Wands usam `WAND_RANGE` (ranged, porém < arco). ✏️ arco/besta usam
   * `BOW_RANGE` quando o projétil for numerado.
   */
  range?: number;
}

/**
 * Efeito de USAR um consumível (verbo `useItem`) — DADOS, não código por item
 * (o handler da sim lê este discriminado e aplica). Forma decidida (designer-de-
 * sistemas, jun/2026); NÚMEROS são `✏️` placeholder — calibrar Balancista.
 *
 *  - `heal`  → poção: cura INSTANTÂNEA (clamp no maxHp) + `exhaustMs` de exausto
 *              compartilhado entre consumíveis de cura (anti-spam, estilo Tibia).
 *  - `food`  → comida: aplica/estende o status "Bem Alimentado" que MULTIPLICA o
 *              regen de HP/mana por `durationMs` (acumula até um teto — ver
 *              `FOOD_SATIETY_CAP_MS` em status.ts). Sem exausto (o teto regula).
 *              `buffs` (comida preparada) dá um buff de STAT temporário (status
 *              "Saciado" à parte, COZINHA.md) — timer próprio, um por vez.
 */
export type ConsumeEffect =
  | { kind: "heal"; hp: number; exhaustMs: number }
  | { kind: "food"; regenMult: number; durationMs: number; buffs?: MealBuff[] };

/**
 * Buff de refeição (comida preparada — COZINHA.md). `damage` = +N na BASE DE DANO
 * DA ARMA; no modelo híbrido (dano = base × (1 + atributo×k)), +N na base PASSA
 * pelo multiplicador → escala com o personagem (espada base 10 + buff 1 = 11 ⇒
 * 14→15 no T1, e mais no late). amount 1 = Sopa, 2 = Carne Curada. `attackSpeed`
 * = fração de redução do cooldown (0.1 = 10% mais rápido). ✏️ Balancista.
 */
export type MealBuff =
  | { stat: "damage"; amount: number }
  | { stat: "attackSpeed"; amount: number };

/** Template declarativo de um item (a parte compartilhada/imutável). */
export interface ItemTemplate {
  /** ID estável do template (chave de dados — NÃO é o ID da instância). */
  id: string;
  /** Nome exibível (pt-BR). */
  name: string;
  /**
   * Categoria larga do item. OPCIONAL por retrocompat: quando ausente, deriva de
   * `slot` (equipáveis) via `itemCategory`. Itens não-equipáveis (consumível/
   * ferramenta/material) SETAM `category` e OMITEM `slot`.
   */
  category?: ItemCategory;
  /** Slot de equipamento — só em equipáveis (weapon/shield/armor). */
  slot?: ItemSlot;
  /**
   * Empilhável? (tochas, reagentes, comida comum). Quando `true`, várias unidades
   * ocupam um slot só. M2 implementa a contagem por slot; aqui é só metadado de
   * dados (o ouro já empilha por caminho próprio — ver `ContainerRegistry`).
   */
  stackable?: boolean;
  /** Tags de arquétipo de arma (lentes de tracking). Ausente em não-armas. */
  tags?: ItemTag[];
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
  /** Stats de armadura (Def) — peças de vestir (helmet/armor/legs/boots). */
  armor?: ArmorStats;
  /** Bloqueio — presente em escudos (`slot === "shield"`). */
  block?: BlockStats;
  /**
   * Efeito de usar (consumíveis). Presente só em `category === "consumable"`
   * com verbo ligado — comida e poção. Ausente = item sem efeito de uso (a
   * tentativa de `useItem` é ignorada pela sim).
   */
  consume?: ConsumeEffect;
  /**
   * Capacidade (nº de slots) de um container (`category === "container"`). DADO
   * só — a sim usa ao materializar/trocar o bolso (a Mochila da Q2 é o upgrade
   * da Sacola de Pano: mais slots). Ausente em itens não-container.
   */
  containerCapacity?: number;
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
  weapon: { baseDamage: 10, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false }, // base ×1.67 (modelo híbrido)
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
  weapon: { baseDamage: 7, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false }, // base ×1.67
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
  weapon: { baseDamage: 13, baseCooldownMs: 2400, damageType: "physical", usesDexterity: false }, // base ×1.67
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
  weapon: { baseDamage: 10, baseCooldownMs: 2100, damageType: "physical", usesDexterity: false }, // base ×1.67
};

/** Cajado simples — kit do Mage. Auto-attack MÁGICO: dano FIXO em faixa, não
 *  escala atributo, custa mana por tiro (modelo Tibia, decidido 09/jun/2026).
 *  CALIBRADO (bateria wand 09/jun, `docs/reports/2026-06-09-bateria-wand.md`):
 *  faixa 8–12 / mana 2 / cd 2,2s → auto-only mata o Esqueleto on-level em ~20s
 *  e sobrevive (resolve o achado #1 ">60s = inútil"); a mana sustenta no regen.
 *  É o FILLER do mago — a força real mora nas magias (burst). */
export const CAJADO_SIMPLES: ItemTemplate = {
  id: "cajado_simples",
  name: "Cajado Simples",
  weight: 28, // escala-Tibia
  slot: "weapon",
  tags: ["cajado"],
  rarity: "common",
  weapon: {
    baseDamage: 0, // ignorado no auto mágico
    baseCooldownMs: 2200,
    damageType: "arcane",
    usesDexterity: false,
    magic: true,
    damageMin: 8, // calibrado (bateria wand 09/jun)
    damageMax: 12, // calibrado (bateria wand 09/jun)
    manaCost: 2, // T1 baseline — sobe com o tier da wand (criador 09/jun)
    range: WAND_RANGE, // ranged, porém < arco
  },
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
  weapon: { baseDamage: 8, baseCooldownMs: 1600, damageType: "physical", usesDexterity: true }, // base ×1.67 (✏️ rogue battery)
};

/** Cetro — kit do Priest. Auto-attack MÁGICO igual à wand (faixa fixa, sem
 *  escala de atributo, custa mana); o Priest fecha o dano forte com magia
 *  sagrada (skills). Mesma faixa do cajado (bateria wand 09/jun) — Priest tem
 *  Espírito alto, então o regen sustenta o auto com ainda mais folga. */
export const CETRO: ItemTemplate = {
  id: "cetro",
  name: "Cetro",
  weight: 30, // escala-Tibia
  slot: "weapon",
  tags: ["cetro"],
  rarity: "common",
  weapon: {
    baseDamage: 0, // ignorado no auto mágico
    baseCooldownMs: 2200,
    damageType: "arcane",
    usesDexterity: false,
    magic: true,
    damageMin: 8, // calibrado (bateria wand 09/jun)
    damageMax: 12, // calibrado (bateria wand 09/jun)
    manaCost: 2, // T1 baseline — sobe com o tier da wand (criador 09/jun)
    range: WAND_RANGE, // ranged, porém < arco
  },
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
  weapon: { baseDamage: 3, baseCooldownMs: 2000, damageType: "physical", usesDexterity: false }, // punhos ×1.67
};

// ─────────────────────────────────────────────────────────────────────────
//  Consumíveis, ferramentas e materiais de loot (fatia ① — ITENS-LOOTS.md)
//  Estes itens existem como DADOS vendáveis/saqueáveis agora; os EFEITOS
//  (saciedade da comida, cura da poção, verbo da ferramenta) são wave M2.
//  Pesos = escala-Tibia aproximada (✏️ Balancista); raridade `common`.
// ─────────────────────────────────────────────────────────────────────────

/** Pão — o saciador barato (mantém o regen ligado). Vendor geral / estalagem. */
export const PAO: ItemTemplate = {
  id: "pao",
  name: "Pão",
  category: "consumable",
  stackable: true,
  weight: 2,
  rarity: "common",
  // Comida barata: regen na TAXA-BASE (1.0× = ~2 HP/s p/ knight base), saciedade
  // curta (75s). Staple de grind; bateria 2026-06-10: ~28g/h (eficiente) a 96g/h
  // (ingênuo) vs renda ~60g/h — sink real que pune desperdício, sem falir.
  consume: { kind: "food", regenMult: 1.0, durationMs: 75_000 },
};

/** Carne Assada — comida melhor (regen maior por duração). Cozinha/estalagem. */
export const CARNE_ASSADA: ItemTemplate = {
  id: "carne_assada",
  name: "Carne Assada",
  category: "consumable",
  stackable: true,
  weight: 4,
  rarity: "common",
  // Cozido / receita simples (escala de preparo, cap 3×): regen 2.0× (~4 HP/s L1)
  // e duração 120s (acima do pão 75s — identidade de tier). Premium = recupera mais
  // rápido + dura mais; receitas combinadas chegam a ~3×. Bateria 2026-06-10.
  consume: { kind: "food", regenMult: 2.0, durationMs: 120_000 },
};

/** Queijo — comida CRUA (piso da escala de preparo: cru < cozido < preparado).
 *  Achado no mundo (drop do rato + kit inicial); regen na taxa-base (1.0×) e
 *  duração CURTA — é o lanche/sustain de emergência. Cozinhar/combinar (ex.
 *  pão+queijo = "queijo quente") é o upgrade — sistema de cozinha futuro. */
export const QUEIJO: ItemTemplate = {
  id: "queijo",
  name: "Queijo",
  category: "consumable",
  stackable: true,
  weight: 2,
  rarity: "common",
  consume: { kind: "food", regenMult: 1.0, durationMs: 60_000 },
};

/** Poção de Vida Pequena — EMERGÊNCIA, luxo no early (≈33min de caça T1, ✏️). */
export const POCAO_VIDA_PEQUENA: ItemTemplate = {
  id: "pocao_vida_pequena",
  name: "Poção de Vida Pequena",
  category: "consumable",
  stackable: true,
  weight: 3,
  rarity: "common",
  // Cura de EMERGÊNCIA instantânea + exausto curto. Bateria consumíveis
  // (2026-06-10): 30 ≈ 26% do maxHp T1 (~2,7 ratos de fôlego) — botão de pânico
  // real sem virar reset; 50 (44%) era generoso demais. ✏️ alvo = 25–30% maxHp;
  // recalibrar o ABSOLUTO quando maxHp/regen base saírem de placeholder (#11).
  consume: { kind: "heal", hp: 30, exhaustMs: 1000 },
};

// ─────────────────────────────────────────────────────────────────────────
//  Cozinha (design/itens/COZINHA.md) — matéria-prima, ingredientes premium,
//  vasilhames e pratos. Receitas em `recipes.ts`; verbo `cook` na Simulation.
//  Números (mult/duração/buff/preço/drop) = ✏️ Balancista.
// ─────────────────────────────────────────────────────────────────────────

/** Carne Crua — matéria-prima de besta (dropa). Comível CRUA (1×, fraca) OU
 *  insumo de receita. Cozinhar vira carne assada/pratos. */
export const CARNE_CRUA: ItemTemplate = {
  id: "carne_crua",
  name: "Carne Crua",
  category: "consumable",
  stackable: true,
  weight: 3,
  rarity: "common",
  consume: { kind: "food", regenMult: 1.0, durationMs: 60_000 },
};

/** Sal-gema — ingrediente premium comprado (NÃO dropa). Destrava receitas top. */
export const SAL_GEMA: ItemTemplate = {
  id: "sal_gema",
  name: "Sal-gema",
  category: "ingredient",
  stackable: true,
  weight: 1,
  rarity: "common",
};

/** Pimenta-longa — ingrediente premium comprado (NÃO dropa). */
export const PIMENTA_LONGA: ItemTemplate = {
  id: "pimenta_longa",
  name: "Pimenta-longa",
  category: "ingredient",
  stackable: true,
  weight: 1,
  rarity: "uncommon",
};

/** Mel Silvestre — ingrediente premium comprado (NÃO dropa). */
export const MEL_SILVESTRE: ItemTemplate = {
  id: "mel_silvestre",
  name: "Mel Silvestre",
  category: "ingredient",
  stackable: true,
  weight: 2,
  rarity: "uncommon",
};

/** Pote — vasilhame 1-uso (vira a sopa e some ao comer). Sink recorrente. */
export const POTE: ItemTemplate = {
  id: "pote",
  name: "Pote",
  category: "vessel",
  stackable: true,
  weight: 8,
  rarity: "common",
};

// ── Pratos (output das receitas). Buffs entram na wave do meal-buff; aqui só o
//    regen do tier (cozido 2× / premium 3×). Durações ✏️ Balancista.

/** Sopa — premium (pote+água+carne crua+sal). Pote 1-uso já embutido no consumo. */
export const SOPA: ItemTemplate = {
  id: "sopa",
  name: "Sopa",
  category: "consumable",
  stackable: true,
  weight: 8,
  rarity: "common",
  // Sopa: o buff de combate mais BÁSICO — +1 na base de dano da arma (espada
  // 10→11 ⇒ golpe 14→15 no T1; escala pelo multiplicador no late). ✏️ Balancista.
  consume: { kind: "food", regenMult: 3.0, durationMs: 180_000, buffs: [{ stat: "damage", amount: 1 }] },
};

/** Queijo Quente — comfort food (pão+queijo+sal-gema): SÓ regen + tempo extra. */
export const QUEIJO_QUENTE: ItemTemplate = {
  id: "queijo_quente",
  name: "Queijo Quente",
  category: "consumable",
  stackable: true,
  weight: 3,
  rarity: "common",
  // Sem buff de stat (decisão criador): é o premium de SUSTAIN — regen 3× +
  // duração LONGA (a comida confortável de caçada longa). ✏️ duração Balancista.
  consume: { kind: "food", regenMult: 3.0, durationMs: 300_000 },
};

/** Carne Curada — premium de COMBATE (carne+sal-gema+pimenta-longa). */
export const CARNE_CURADA: ItemTemplate = {
  id: "carne_curada",
  name: "Carne Curada",
  category: "consumable",
  stackable: true,
  weight: 4,
  rarity: "common",
  // Comida do guerreiro: +2 na base de dano da arma (premium acima da Sopa). ✏️ Balancista.
  consume: { kind: "food", regenMult: 3.0, durationMs: 240_000, buffs: [{ stat: "damage", amount: 2 }] },
};

/** Favo Assado — premium de caster (pão+mel silvestre); foco em mana. */
export const FAVO_ASSADO: ItemTemplate = {
  id: "favo_assado",
  name: "Favo Assado",
  category: "consumable",
  stackable: true,
  weight: 2,
  rarity: "common",
  consume: { kind: "food", regenMult: 3.0, durationMs: 150_000 },
};

/** Corda — ferramenta PERMANENTE (compra única não-trivial). Vendor + baús. */
export const CORDA: ItemTemplate = {
  id: "corda",
  name: "Corda",
  category: "tool",
  weight: 15,
  rarity: "common",
};

/** Pá — ferramenta PERMANENTE. Vendor + baús iniciais. */
export const PA: ItemTemplate = {
  id: "pa",
  name: "Pá",
  category: "tool",
  weight: 20,
  rarity: "common",
};

/** Tocha — ferramenta CONSUMÍVEL (queima/stacka). Vendor geral, barata. */
export const TOCHA: ItemTemplate = {
  id: "tocha",
  name: "Tocha",
  category: "tool",
  stackable: true,
  weight: 3,
  rarity: "common",
};

/** Faca de Esfolar — destrava o VERBO esfolar (gated pela quest do Amaro, Q7).
 *  É a ferramenta E o símbolo do trade de peles (ITENS-LOOTS.md). */
export const FACA_DE_ESFOLAR: ItemTemplate = {
  id: "faca_de_esfolar",
  name: "Faca de Esfolar",
  category: "tool",
  weight: 8,
  rarity: "common",
};

/** Cauda de Rato — troféu/reagente do Rato Lanhoso. Comprada pelo Silas
 *  (boticário) após a quest dele. Primeiro loot vendável da fatia. */
export const CAUDA_DE_RATO: ItemTemplate = {
  id: "cauda_de_rato",
  name: "Cauda de Rato",
  category: "material",
  stackable: true,
  weight: 1,
  rarity: "common",
};

// ─────────────────────────────────────────────────────────────────────────
//  Reagentes & troféus de loot (fatia ① — ITENS-LOOTS.md §loot tables).
//  Vermes dropam REAGENTE (comprado pelo Silas), bestas dropam TROFÉU DE CAÇA
//  (peles/presas → Amaro pós-Q7), humanoides dropam orelha/sucata. Materiais
//  vendáveis (a renda real é vender no comprador certo); preços ✏️ Balancista.
// ─────────────────────────────────────────────────────────────────────────

/** Asa de Morcego — reagente do Morcego. Comprada pelo Silas (boticário). */
export const ASA_DE_MORCEGO: ItemTemplate = {
  id: "asa_de_morcego",
  name: "Asa de Morcego",
  category: "material",
  stackable: true,
  weight: 1,
  rarity: "common",
};

/** Glândula de Veneno — reagente da Aranha-das-Cavernas. Comprada pelo Silas. */
export const GLANDULA_DE_VENENO: ItemTemplate = {
  id: "glandula_de_veneno",
  name: "Glândula de Veneno",
  category: "material",
  stackable: true,
  weight: 1,
  rarity: "common",
};

/** Seda — fio da Aranha-das-Cavernas. Reagente/material comprado pelo Silas. */
export const SEDA: ItemTemplate = {
  id: "seda",
  name: "Seda",
  category: "material",
  stackable: true,
  weight: 1,
  rarity: "common",
};

/** Carne de Caça — corte cru de besta (Javali/Lobo/Urso). Comível (matéria-prima
 *  de cozinha, igual à Carne Crua) OU vendida. Regen base, duração curta. */
export const CARNE_DE_CACA: ItemTemplate = {
  id: "carne_de_caca",
  name: "Carne de Caça",
  category: "consumable",
  stackable: true,
  weight: 3,
  rarity: "common",
  consume: { kind: "food", regenMult: 1.0, durationMs: 60_000 },
};

/** Pele de Lobo — troféu de caça do Lobo. Comprada pelo Amaro (pós-Q7). */
export const PELE_DE_LOBO: ItemTemplate = {
  id: "pele_de_lobo",
  name: "Pele de Lobo",
  category: "material",
  stackable: true,
  weight: 4,
  rarity: "common",
};

/** Couro Grosso — couro pesado do Javali/Presa-Torta. Comprado pelo Amaro. */
export const COURO_GROSSO: ItemTemplate = {
  id: "couro_grosso",
  name: "Couro Grosso",
  category: "material",
  stackable: true,
  weight: 6,
  rarity: "common",
};

/** Presa de Javali — troféu do Javali. Comprada pelo Amaro (trade de peles). */
export const PRESA_DE_JAVALI: ItemTemplate = {
  id: "presa_de_javali",
  name: "Presa de Javali",
  category: "material",
  stackable: true,
  weight: 2,
  rarity: "common",
};

/** Osso — restos do Esqueleto (loot undead T1). Material/reagente (Abel, fatia ②). */
export const OSSO: ItemTemplate = {
  id: "osso",
  name: "Osso",
  category: "material",
  stackable: true,
  weight: 3,
  rarity: "common",
};

/** Orelha de Goblin — prova de abate do Goblin. Bounty do Capitão Vidal
 *  (pós-Q5) e item de coleta da Q8. Material vendável ao quartel. */
export const ORELHA_DE_GOBLIN: ItemTemplate = {
  id: "orelha_de_goblin",
  name: "Orelha de Goblin",
  category: "material",
  stackable: true,
  weight: 1,
  rarity: "common",
};

/** Sucata de Arma — ferro estragado de arma do Orc Soldado. Vendida ao Duarte
 *  (trade de sucata pós-Q4) E a "prova marcada" do clímax da Q8 (loot do Orc). */
export const SUCATA_DE_ARMA: ItemTemplate = {
  id: "sucata_de_arma",
  name: "Sucata de Arma",
  category: "material",
  stackable: true,
  weight: 12,
  rarity: "common",
};

// ── Itens de quest puros (não-vendáveis; carregam só o objetivo).

/** Pacote — fardo lacrado da Q4 (A Entrega do Ferreiro): levar ao Marco, vigia
 *  de Atalaia, "e não abrir". Item de quest puro (não-vendável). */
export const PACOTE: ItemTemplate = {
  id: "pacote",
  name: "Pacote",
  category: "quest",
  weight: 8,
  rarity: "common",
};

/** Carta Rabiscada — loot RARO do Bandido da Estrada (Q11 O Tesouro do Bando):
 *  aponta a Fortaleza Abandonada (fecha na fatia ③). Item de quest (lê-se). */
export const CARTA_RABISCADA: ItemTemplate = {
  id: "carta_rabiscada",
  name: "Carta Rabiscada",
  category: "quest",
  weight: 1,
  rarity: "common",
};

// ── Container de upgrade (recompensa de quest).

/** Mochila — recompensa da Q2 (A Mochila): upgrade da Sacola de Pano inicial
 *  (Bolso de 8 slots) para mais espaço. `containerCapacity` é o dado; a troca
 *  do bolso vive na sim (recompensa de quest). */
export const MOCHILA: ItemTemplate = {
  id: "mochila",
  name: "Mochila",
  category: "container",
  weight: 18,
  rarity: "common",
  containerCapacity: 16, // dobro do Bolso inicial (8) — ✏️ Balancista/ECONOMIA
};

// ─────────────────────────────────────────────────────────────────────────
//  Armadura & escudo T1 — vendor genérico (EQUIPAMENTO.md §"Vestir T1")
//  Couro: Σ Def alvo 2–3 no set (decidido) — split por peça ✏️ Balancista. Aqui
//  1/1/1/0 = Σ3 (cabeça/torso/pernas pagam; botas 0, pois seu "lar" é velocidade,
//  que estreia nas Botas do Viajante de baú). Escudo: Def 0, paga em BLOQUEIO
//  (chance ~20% / chunk 70% — provisórios ✏️). Pesos/preços ✏️ Balancista.
// ─────────────────────────────────────────────────────────────────────────

/** Coifa de Couro — capacete T1 genérico (vendor). */
export const COIFA_DE_COURO: ItemTemplate = {
  id: "coifa_de_couro",
  name: "Coifa de Couro",
  category: "armor",
  slot: "helmet",
  weight: 20,
  rarity: "common",
  armor: { def: 1 },
};

/** Túnica de Couro — armadura (torso) T1 genérica (vendor). */
export const TUNICA_DE_COURO: ItemTemplate = {
  id: "tunica_de_couro",
  name: "Túnica de Couro",
  category: "armor",
  slot: "armor",
  weight: 70,
  rarity: "common",
  armor: { def: 1 },
};

/** Calças de Couro — pernas T1 genéricas (vendor). */
export const CALCAS_DE_COURO: ItemTemplate = {
  id: "calcas_de_couro",
  name: "Calças de Couro",
  category: "armor",
  slot: "legs",
  weight: 50,
  rarity: "common",
  armor: { def: 1 },
};

/** Botas de Couro — botas T1 genéricas (vendor). Def 0 (o "lar" delas é velocidade). */
export const BOTAS_DE_COURO: ItemTemplate = {
  id: "botas_de_couro",
  name: "Botas de Couro",
  category: "armor",
  slot: "boots",
  weight: 25,
  rarity: "common",
  armor: { def: 0 },
};

/** Escudo de Madeira — escudo T1 (rito Knight / vendor). Def 0: paga em BLOQUEIO. */
export const ESCUDO_DE_MADEIRA: ItemTemplate = {
  id: "escudo_de_madeira",
  name: "Escudo de Madeira",
  category: "shield",
  slot: "shield",
  weight: 45,
  rarity: "common",
  armor: { def: 0 },
  // Bloqueio CALIBRADO (Balancista 2026-06-11): chance 30% (a alavanca real — o
  // chunk é ~inerte no TTL), chunk 70% (teto p/ o lendário Inabalável ~100%).
  block: { chance: 0.3, chunkPct: 0.7 },
};

// ─────────────────────────────────────────────────────────────────────────
//  Armadura & escudo T2 (metal) — Duarte, o ferreiro (EQUIPAMENTO.md §"T2
//  Vendor-ponte": Elmo de Ferro, Cota de Malha, Escudo de Ferro). O chão de
//  metal do tier acima do couro. Def maior que o couro, mas a regra de tier
//  segura (Def somável < dano do mob T2 ~16–20) — números ✏️ seed Balancista.
// ─────────────────────────────────────────────────────────────────────────

/** Elmo de Ferro — capacete T2 (vendor metal). Def acima da coifa de couro. */
export const ELMO_DE_FERRO: ItemTemplate = {
  id: "elmo_de_ferro",
  name: "Elmo de Ferro",
  category: "armor",
  slot: "helmet",
  weight: 55,
  rarity: "common",
  armor: { def: 2 },
};

/** Cota de Malha — armadura (torso) T2 (vendor metal). O peito de metal básico. */
export const COTA_DE_MALHA: ItemTemplate = {
  id: "cota_de_malha",
  name: "Cota de Malha",
  category: "armor",
  slot: "armor",
  weight: 120, // escala-Tibia (malha pesa)
  rarity: "common",
  armor: { def: 3 },
};

/** Escudo de Ferro — escudo T2 (vendor metal). Bloqueio melhor que o de madeira +
 *  uma lasca de Def plana (≠ Madeira, que é Def 0). */
export const ESCUDO_DE_FERRO: ItemTemplate = {
  id: "escudo_de_ferro",
  name: "Escudo de Ferro",
  category: "shield",
  slot: "shield",
  weight: 80,
  rarity: "common",
  armor: { def: 1 },
  block: { chance: 0.35, chunkPct: 0.7 }, // ✏️ Balancista (acima do Madeira 30%)
};

// ─────────────────────────────────────────────────────────────────────────
//  Gear sucateado de humanoide (loot — ITENS-LOOTS.md). O Orc/Bandido caem com
//  equipamento estragado: vale como peça funcional T1 E como sucata vendável ao
//  Duarte (trade pós-Q4). `escudo_lascado` é o "peça T1 de gear" da Q8.
// ─────────────────────────────────────────────────────────────────────────

/** Escudo Lascado — escudo T1 surrado do Orc Soldado (loot raro / recompensa Q8).
 *  Funciona como escudo de entrada (bloqueio fraco) e é vendido ao Ferreiro. */
export const ESCUDO_LASCADO: ItemTemplate = {
  id: "escudo_lascado",
  name: "Escudo Lascado",
  category: "shield",
  slot: "shield",
  weight: 40,
  rarity: "common",
  armor: { def: 0 },
  block: { chance: 0.2, chunkPct: 0.7 }, // sucata: pior que o Madeira (30%) ✏️
};

/** Adaga Enferrujada — adaga T1 surrada do Bandido (loot + sucata p/ o Duarte).
 *  Mais fraca que a Adaga de vendor; o valor é vendê-la, não usá-la. */
export const ADAGA_ENFERRUJADA: ItemTemplate = {
  id: "adaga_enferrujada",
  name: "Adaga Enferrujada",
  category: "weapon",
  slot: "weapon",
  tags: ["adaga"],
  weight: 10,
  rarity: "common",
  weapon: { baseDamage: 6, baseCooldownMs: 1600, damageType: "physical", usesDexterity: true }, // abaixo da Adaga (8) ✏️
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
  [PAO.id]: PAO,
  [CARNE_ASSADA.id]: CARNE_ASSADA,
  [QUEIJO.id]: QUEIJO,
  [POCAO_VIDA_PEQUENA.id]: POCAO_VIDA_PEQUENA,
  // Cozinha (COZINHA.md)
  [CARNE_CRUA.id]: CARNE_CRUA,
  [SAL_GEMA.id]: SAL_GEMA,
  [PIMENTA_LONGA.id]: PIMENTA_LONGA,
  [MEL_SILVESTRE.id]: MEL_SILVESTRE,
  [POTE.id]: POTE,
  [SOPA.id]: SOPA,
  [QUEIJO_QUENTE.id]: QUEIJO_QUENTE,
  [CARNE_CURADA.id]: CARNE_CURADA,
  [FAVO_ASSADO.id]: FAVO_ASSADO,
  [CORDA.id]: CORDA,
  [PA.id]: PA,
  [TOCHA.id]: TOCHA,
  [FACA_DE_ESFOLAR.id]: FACA_DE_ESFOLAR,
  [CAUDA_DE_RATO.id]: CAUDA_DE_RATO,
  // Reagentes, troféus de caça e itens de quest (fatia ① — ITENS-LOOTS.md)
  [ASA_DE_MORCEGO.id]: ASA_DE_MORCEGO,
  [GLANDULA_DE_VENENO.id]: GLANDULA_DE_VENENO,
  [SEDA.id]: SEDA,
  [CARNE_DE_CACA.id]: CARNE_DE_CACA,
  [PELE_DE_LOBO.id]: PELE_DE_LOBO,
  [COURO_GROSSO.id]: COURO_GROSSO,
  [PRESA_DE_JAVALI.id]: PRESA_DE_JAVALI,
  [OSSO.id]: OSSO,
  [ORELHA_DE_GOBLIN.id]: ORELHA_DE_GOBLIN,
  [SUCATA_DE_ARMA.id]: SUCATA_DE_ARMA,
  [PACOTE.id]: PACOTE,
  [CARTA_RABISCADA.id]: CARTA_RABISCADA,
  [MOCHILA.id]: MOCHILA,
  // Armadura & escudo T1 (vendor — EQUIPAMENTO.md §"Vestir T1")
  [COIFA_DE_COURO.id]: COIFA_DE_COURO,
  [TUNICA_DE_COURO.id]: TUNICA_DE_COURO,
  [CALCAS_DE_COURO.id]: CALCAS_DE_COURO,
  [BOTAS_DE_COURO.id]: BOTAS_DE_COURO,
  [ESCUDO_DE_MADEIRA.id]: ESCUDO_DE_MADEIRA,
  // Armadura & escudo T2 metal (vendor — EQUIPAMENTO.md §"T2 Vendor-ponte")
  [ELMO_DE_FERRO.id]: ELMO_DE_FERRO,
  [COTA_DE_MALHA.id]: COTA_DE_MALHA,
  [ESCUDO_DE_FERRO.id]: ESCUDO_DE_FERRO,
  // Gear sucateado de humanoide (loot/sucata — ITENS-LOOTS.md)
  [ESCUDO_LASCADO.id]: ESCUDO_LASCADO,
  [ADAGA_ENFERRUJADA.id]: ADAGA_ENFERRUJADA,
};

/** Lookup de template por ID (undefined = desconhecido). */
export function getItemTemplate(id: string): ItemTemplate | undefined {
  return ITEM_TEMPLATES[id];
}

/**
 * Categoria efetiva de um item: usa `category` explícita ou deriva do `slot`
 * (equipáveis). Fonte única para comércio/loot decidirem "que tipo de item é".
 */
export function itemCategory(t: ItemTemplate): ItemCategory {
  if (t.category) return t.category;
  if (t.slot === "weapon" || t.slot === "shield" || t.slot === "armor") return t.slot;
  if (t.slot === "helmet" || t.slot === "legs" || t.slot === "boots") return "armor";
  return "material";
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
  classless: ESPADA_CEGA.id, // item de NASCIMENTO (casa inicial); NÃO é kit de classe
};

/** ID do template dos punhos (desarmado) — fonte de verdade. */
export const FISTS_TEMPLATE_ID = PUNHOS.id;
