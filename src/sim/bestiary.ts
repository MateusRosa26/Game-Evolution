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
  /** Respawn após morte, em ticks (20 ticks/s). */
  respawnTicks: number;
  /** Loot de gold do cadáver (✏️ itens por família/tier — ECONOMIA.md). */
  loot?: { goldMin: number; goldMax: number };
}

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
  baseStepMs: 220, // ligeiramente mais rápido que o jogador (260)
  respawnTicks: 200, // ~10s
  loot: { goldMin: 0, goldMax: 1 }, // economia passe 1 (jun/2026): rato 0–1, média ~0,4
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
  baseStepMs: 280, // mais lento que o jogador (260) — undead arrastado, kitável
  respawnTicks: 300, // ~15s
  loot: { goldMin: 1, goldMax: 3 },
};

/** Registro de templates por espécie — ponto único de lookup. */
export const CREATURES: Record<string, CreatureTemplate> = {
  [RATO_LANHOSO.species]: RATO_LANHOSO,
  [ESQUELETO.species]: ESQUELETO,
};
