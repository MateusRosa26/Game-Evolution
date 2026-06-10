import type { CreatureFamily, DamageType } from "../shared/types";

/**
 * Bestiário como DADOS, não código caso-a-caso.
 *
 * O DESIGN-BESTIARIO.md tem 25 criaturas que virão em waves futuras; o design
 * pede uma "biblioteca de blocos". Cada criatura é um template declarativo;
 * a IA lê o `behavior` e parâmetros — nada de classe por monstro.
 *
 * No M1 só o Rato Lanhoso existe e só o comportamento "chaser" é implementado.
 */

/** Tiers de dificuldade do bestiário (DESIGN-BESTIARIO.md). */
export type Tier = "T1" | "T2" | "T3" | "T4" | "T5";

/**
 * Comportamentos de IA do bestiário. M1 implementa só "chaser"; os demais
 * estão declarados para que templates futuros já tenham a forma certa.
 */
export type AiBehavior =
  | "chaser" // persegue via A* e bate em melee (Perseguidor / Matilha base)
  | "territorial" // neutro até provocado (declarado; não implementado no M1)
  | "shooter" // ataca à distância (declarado; não implementado no M1)
  | "caster"; // conjura (declarado; não implementado no M1)

/** Template declarativo de uma criatura. */
export interface CreatureTemplate {
  /** ID de espécie estável (chave de dados / contadores de Marca). */
  species: string;
  /** Nome exibível. */
  name: string;
  family: CreatureFamily;
  tier: Tier;
  behavior: AiBehavior;
  maxHp: number;
  /** Dano do ataque básico. */
  attackDamage: number;
  attackType: DamageType;
  /** Cooldown entre ataques, em ms. */
  attackCooldownMs: number;
  /** XP base concedido ao jogador por matar esta criatura (antes da redução
   *  anti-farm por diferença de nível — ver `formulas.xpFromKill`). */
  xp: number;
  /** Raio de aggro em tiles (Chebyshev): dentro disso, idle → persegue. */
  aggroRadius: number;
  /** Duração base do passo, em ms (define a velocidade de perseguição). */
  baseStepMs: number;
  /** Respawn após morte, em ms (a sim converte p/ ticks via `msToTicks`). */
  respawnMs: number;
  /** Loot do cadáver: gold (faixa) + itens por chance. */
  loot?: LootTable;
}

/**
 * Uma chance de drop de item no cadáver. `chance` é rolada INDEPENDENTE por item
 * (RNG de loot da sim). Rates = placeholder ✏️ Balancista (bateria M2, junto da
 * economia). NOTA: esta é a loot table NORMAL (cai sempre, com ou sem faca) —
 * esfolar é um VERBO à parte, gated pela Faca de Esfolar (ITENS-LOOTS.md), wave
 * futura com sua própria lógica anti-jackpot (chance de pele × chance de comida).
 */
export interface LootDrop {
  /** Template do item (ver `items/templates`). */
  templateId: string;
  /** Probabilidade 0..1 de cair. */
  chance: number;
}

/** Tabela de loot de um cadáver. */
export interface LootTable {
  /** Faixa de gold (estilo Tibia — pouco por design). */
  gold?: { min: number; max: number };
  /** Drops de item, cada um rolado por sua `chance`. */
  items?: LootDrop[];
}

/**
 * Drop de item — FILOSOFIA (decisão do criador, jun/2026): **gold é padrão,
 * ITENS são difíceis de dropar.** Mas a `chance` é CONTÍNUA e ESPECÍFICA por
 * item — NADA de enum de raridade (mata a variabilidade; o Tibia, referência do
 * projeto, vive de rates esquisitos e específicos que viram conhecimento-loot /
 * cultura de wiki — pilar 4, e a *matriz esparsa* de EQUIPAMENTO.md: cada item é
 * um EVENTO). Cada drop ganha seu próprio número tunado.
 *
 * DESACOPLAMENTO-CHAVE (decidido): a `chance` controla só a FREQUÊNCIA ("com que
 * frequência cai / como soa achar"); QUANTO de renda o drop vale é corrigido pelo
 * **preço de venda** do item (ver `npc/commerce.ts`), não inflando a chance. Por
 * isso o número de drop pode ser puramente sobre feel — a economia se fecha no preço.
 *
 * FAIXAS-GUIA por papel (NÃO-vinculantes — autor escolhe o número específico
 * dentro, ou FORA quando a matriz esparsa pedir; ✏️ Balancista calibra na M2):
 *   - troféu recorrente de venda ... ~3–12%
 *   - reagente / ingrediente ........ ~2–8%
 *   - gear / peça de mob ............ ~0.3–2%
 *   - pista / named-bait / Marca .... <0.3%
 */

/**
 * Rato Lanhoso — família Bestial, T1, Perseguidor. "O primeiro sangue do
 * jogador": rápido, fraco, vem em grupos. Só ataque básico.
 * Números PLACEHOLDER (mobs são fortes por design — pune descuido).
 */
export const RATO_LANHOSO: CreatureTemplate = {
  species: "rato_lanhoso",
  name: "Rato Lanhoso",
  family: "bestial",
  tier: "T1",
  behavior: "chaser",
  maxHp: 24,
  attackDamage: 7, // calibrado (bateria M1.1, jun/2026): início classless 3→1 morte/h, matilha ainda mata em 6,4s; pós-rito intacto
  attackType: "physical",
  attackCooldownMs: 1600,
  xp: 15, // calibrado (bateria M1.1, jun/2026): lvl 5 pós-rito ~14min dedicado — loop de upar divertido por si só; o aspiracional é segredo, não meta
  aggroRadius: 6,
  // 200ms = 5 t/s, UM TIER acima do jogador (250ms / 4 t/s): a matilha te alcança,
  // não dá pra fugir só andando (design: rápido, vem em grupos). Múltiplo de 50 —
  // a sim quantiza o passo em ticks (`quantizeToTickMs`), então autorado = efetivo.
  baseStepMs: 200,
  respawnMs: 10000, // 10s
  loot: {
    gold: { min: 0, max: 1 }, // economia passe 1 (jun/2026): rato 0–1, média ~0,4
    items: [
      // Cauda de Rato — troféu/reagente; comprada pelo Silas pós-quest dele.
      // Troféu recorrente (faixa-guia ~3–12%); a renda se ajusta no preço, não na chance.
      { templateId: "cauda_de_rato", chance: 0.1 }, // ✏️ Balancista (bateria M2)
      // Queijo — comida que o rato devolve. Chance BAIXA de propósito: dá um respiro
      // de sustain sem auto-sustentar a comida (senão mata o gold-sink do food-gating).
      // ✏️ Balancista: tunar contra a economia de comida (alvo ~cobrir <½ do consumo).
      { templateId: "queijo", chance: 0.08 },
      // Carne Crua — matéria-prima de cozinha (besta). Comível crua (1×) ou insumo.
      // ✏️ Balancista: sub-sustentável, junto da economia de comida.
      { templateId: "carne_crua", chance: 0.1 },
    ],
  },
};

/**
 * Esqueleto — família Mortos-Vivos (undead), T2, Perseguidor. "A unidade do
 * grind lendário" (15k kills = *Quebra-Ossos* na camada emergente). Só ataque
 * básico — encaixa no comportamento "chaser". É a família-coração e o farm
 * natural do Priest (Luz Sagrada nuke vs profanos).
 *
 * Números (Balancista, bateria T2 on-level 2026-06-09 — `docs/reports/2026-06-08-
 * bateria-diferenciacao-classe.md`): **HP 95** — a bateria on-level (lvl 10) mostrou
 * que 48 era ONE-SHOTADO por melee (knight GF 41+auto=64) e até pela Luz Sagrada,
 * trivializando o tier (T2 = lvl 8-15). 95 dá uma "contagem de golpes" real:
 * melee mata em ~2-3s, caster em ~3-4 casts, sem virar esponja. (48 ainda foi útil
 * no lvl 1 pra DESTRAVAR a diferenciação de skill — burn/slow/perfuração; M1.2.)
 * Dano 12 (T2 pune descuido); XP 80 (≈ proporcional ao tempo de kill maior, segura
 * o XP/h — ✏️ re-régua na bateria de farm T2). Fraqueza a sagrado/fogo e resist a
 * gelo (FAMILIAS.md) NÃO entram aqui (matriz Regra 10-20 fora da sim; bônus da Luz
 * Sagrada vive no executor).
 */
export const ESQUELETO: CreatureTemplate = {
  species: "esqueleto",
  name: "Esqueleto",
  family: "undead",
  tier: "T2",
  behavior: "chaser",
  maxHp: 95,
  attackDamage: 12,
  attackType: "physical",
  attackCooldownMs: 2000,
  xp: 80,
  aggroRadius: 6,
  // 300ms = 3,33 t/s, UM TIER abaixo do jogador (250ms / 4 t/s) — undead arrastado,
  // kitável (design). Múltiplo de 50 = autorado igual ao efetivo orto (antes 280 já
  // caía em 300 orto; agora honesto). Diagonal ~450ms (ainda mais kitável de lado).
  baseStepMs: 300,
  respawnMs: 15000, // 15s
  loot: { gold: { min: 1, max: 3 } }, // ✏️ + osso/loot undead quando o item entrar
};

/** Registro de templates por espécie — ponto único de lookup. */
export const CREATURES: Record<string, CreatureTemplate> = {
  [RATO_LANHOSO.species]: RATO_LANHOSO,
  [ESQUELETO.species]: ESQUELETO,
};
