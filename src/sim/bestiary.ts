import type { CreatureFamily, DamageType } from "../shared/types";

/**
 * Bestiário como DADOS, não código caso-a-caso.
 *
 * O DESIGN-BESTIARIO.md tem 25 criaturas que virão em waves futuras; o design
 * pede uma "biblioteca de blocos". Cada criatura é um template declarativo;
 * a IA lê o `behavior` e parâmetros — nada de classe por monstro.
 *
 * No M1 só o Rato existe e só o comportamento "chaser" é implementado.
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
 * Rato — família Bestial, T1, Perseguidor. "O primeiro sangue do
 * jogador": rápido, fraco, vem em grupos. Só ataque básico.
 * Números PLACEHOLDER (mobs são fortes por design — pune descuido).
 */
export const RATO: CreatureTemplate = {
  species: "rato",
  name: "Rato",
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
 * Esqueleto — família Mortos-Vivos (undead), **T1** (undead de ENTRADA).
 * RECAST (criador, 2026-06-10): o esqueleto é o degrau de ENTRADA da família
 * morto-vivo (T1, met cedo) — o farm natural do Priest (Luz Sagrada nuke vs
 * profanos) e a unidade da Marca *Quebra-Ossos* (15k kills = grind puro Tibia, a
 * Marca fica aqui). O **ghoul** é o PRÓXIMO degrau undead (T2/T3, ainda sem arte
 * — Camada C / fatia ② Charneca). Só ataque básico ("chaser"); passo 300ms =
 * undead arrastado e kitável (a identidade preservada).
 *
 * Números T1 (Balancista, bateria mobs-Alvorada 2026-06-10): hp30/dmg9/xp18 —
 * degrau "undead de entrada" no ladder T1 alargado (dano sobe 7→9→11→14 de rato a
 * lobo, dando progressão DENTRO do T1). ✏️ PROVISÓRIO até a bateria da
 * FAMÍLIA UNDEAD na fatia ② (esqueleto T1 + ghoul T2/T3 + resist/fraqueza).
 * HISTÓRICO: era T2/hp95/dmg12/xp80 (bateria de diferenciação de classe 08/jun,
 * como dummy T2 on-level lvl 10) — esse papel de dummy T2 MIGRA p/ outro mob ✏️.
 * Fraqueza a sagrado/fogo + resist a gelo (FAMILIAS.md) NÃO entram aqui (matriz
 * Regra 10-20 fora da sim; bônus da Luz Sagrada vive no executor).
 */
export const ESQUELETO: CreatureTemplate = {
  species: "esqueleto",
  name: "Esqueleto",
  family: "undead",
  tier: "T1",
  behavior: "chaser",
  maxHp: 30,
  attackDamage: 9,
  attackType: "physical",
  attackCooldownMs: 2000,
  xp: 18,
  aggroRadius: 6,
  // 300ms = 3,33 t/s, UM TIER abaixo do jogador (250ms / 4 t/s) — undead arrastado,
  // kitável (design). Múltiplo de 50 = autorado igual ao efetivo orto (antes 280 já
  // caía em 300 orto; agora honesto). Diagonal ~450ms (ainda mais kitável de lado).
  baseStepMs: 300,
  respawnMs: 15000, // 15s
  loot: { gold: { min: 1, max: 3 } }, // ✏️ + osso/loot undead quando o item entrar
};

/**
 * Goblin — Humanoide, T1, Perseguidor/Covarde (FAMILIAS.md §2). Pele-verde
 * básico do acampamento (S5) e boca da caverna. "Foge sangrando" (covardia) ainda
 * não modelado — entra como `chaser` (✏️ flee-on-bleed quando o comportamento
 * existir). Um degrau acima do rato: mais HP, bate um pouco mais, passo de jogador.
 * Números SEED ancorados no rato (T1) — ✏️ Balancista calibra (bateria de farm T1).
 */
export const GOBLIN: CreatureTemplate = {
  species: "goblin",
  name: "Goblin",
  family: "humanoid",
  tier: "T1",
  behavior: "chaser",
  maxHp: 38,
  attackDamage: 11,
  attackType: "physical",
  attackCooldownMs: 1800,
  xp: 24, // calibrado (bateria mobs-Alvorada jun/2026): degrau médio do T1, dano sobe (esqueleto 9 → goblin 11 → lobo 14)
  aggroRadius: 6,
  baseStepMs: 250, // passo de jogador — não alcança fugindo, mas não dá pra deixar nas costas
  respawnMs: 12000,
  loot: { gold: { min: 1, max: 3 } }, // ✏️ + Orelha de Goblin (bounty)/Amuleto Tosco quando os itens entrarem (templates.ts é da wave de itens)
};

/**
 * Lobo — Bestial, **T1** (Perseguidor/Matilha — FAMILIAS.md §1: "a alcateia
 * é a skill"). Calibrado (bateria mobs-Alvorada, jun/2026): **T1, não T2** — a
 * dificuldade vem da MATILHA, não do HP solo. Empírico (knight lvl1): TTK solo ~5s
 * (topo do T1, acima do goblin 3,8s); mas 2 lobos passivos matam em 10,2s — a
 * matilha MAIS letal de todos os T1. Tier T1 (creatureLevel 1) faz o lobo dar XP
 * cheia até ~lvl 6-7 e depois expirar (você gradua da Toca); T2 o faria render até
 * lvl 13, cedo demais p/ mob de entrada. **Late-T1 (alargamento jun/2026): hp48,
 * dmg14** — o T1 que MAIS pune (dmg 14 ≈ javali T2 16; 2 lobos passivos matam em
 * 6,8s, a matilha mais letal) e faz ponte suave pro T2. ✏️ pack-AI é wave futura.
 */
export const LOBO: CreatureTemplate = {
  species: "lobo",
  name: "Lobo",
  family: "bestial",
  tier: "T1",
  behavior: "chaser",
  maxHp: 48,
  attackDamage: 14,
  attackType: "physical",
  attackCooldownMs: 1700,
  xp: 36,
  aggroRadius: 7,
  baseStepMs: 220, // veloz (matilha alcança) — múltiplo de 50 p/ casar com a quantização do tick
  respawnMs: 12000,
  loot: { gold: { min: 0, max: 2 } }, // ✏️ + Pele de Lobo/Carne quando os itens entrarem
};

/**
 * Morcego — Voador, T1, Perseguidor/Matilha (FAMILIAS.md §4: "enxames
 * no escuro"). Frágil, rápido, vem em nuvem; mob natural de gruta/A2. Sprite já
 * marca FLYING. Números SEED abaixo do rato (mais fraco, mais rápido) — ✏️ Balancista.
 */
export const MORCEGO: CreatureTemplate = {
  species: "morcego",
  name: "Morcego",
  family: "flying",
  tier: "T1",
  behavior: "chaser",
  maxHp: 16,
  attackDamage: 5,
  attackType: "physical",
  attackCooldownMs: 1400,
  xp: 12,
  aggroRadius: 6,
  baseStepMs: 200, // voador rápido, igual à matilha de ratos
  respawnMs: 10000,
  loot: { gold: { min: 0, max: 1 } }, // ✏️ + Asa de Morcego (reagente do Silas) quando o item entrar
};

/**
 * Javali — Bestial, T2, Territorial + Investida (FAMILIAS.md §1: "neutro
 * até provocado"). Tanque que pune: muito HP, golpe pesado, lento pra atacar.
 * Territorialidade e a carga ainda não modeladas — entra como `chaser` (✏️ neutro-
 * até-provocado + investida). Named **Presa-Torta** (Q7) é uma variante futura.
 * Números SEED na faixa T2 (abaixo do esqueleto em HP, acima em dano) — ✏️ Balancista.
 */
export const JAVALI: CreatureTemplate = {
  species: "javali",
  name: "Javali",
  family: "bestial",
  tier: "T2",
  behavior: "chaser",
  maxHp: 80,
  attackDamage: 16,
  attackType: "physical",
  attackCooldownMs: 2200,
  xp: 60,
  aggroRadius: 5, // territorial: só acorda de perto
  baseStepMs: 240,
  respawnMs: 15000,
  loot: { gold: { min: 1, max: 3 } }, // ✏️ + Presa de Javali/Couro Grosso/Carne de Caça quando os itens entrarem
};

/** Registro de templates por espécie — ponto único de lookup. */
export const CREATURES: Record<string, CreatureTemplate> = {
  [RATO.species]: RATO,
  [ESQUELETO.species]: ESQUELETO,
  [GOBLIN.species]: GOBLIN,
  [LOBO.species]: LOBO,
  [MORCEGO.species]: MORCEGO,
  [JAVALI.species]: JAVALI,
};
