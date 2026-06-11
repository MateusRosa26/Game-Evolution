import type { AttributeKey, Attributes, PlayerClass } from "../shared/types";
import type { CombatContext, EventBus } from "./events";
import type { SimEntity } from "./entity";
import type { Tier } from "./bestiary";
import { DEATH_XP_PENALTY } from "./balance";
import { wellFedRegenMult } from "./skills/status";
import { TICK_MS } from "../shared/constants";
import {
  CLASS_BASE_ATTRIBUTES,
  STAT_POINTS_PER_LEVEL,
  levelForXp,
  manaRegenPerSecond,
  maxHp,
  maxMana,
  hpRegenPerSecond,
  REGEN_INTERVAL_MS,
  statPointCost,
  xpFromKill,
} from "./formulas";

/**
 * Camada de progressão (DESIGN-EVOLUCAO.md §"Camada Sólida") — SIM only.
 *
 * Tudo aqui é determinístico e puro-ish (muta `Progression`/`SimEntity`, mas
 * sem RNG, sem browser). Os NÚMEROS derivados vêm SEMPRE de `formulas.ts`;
 * este módulo só orquestra (ganhar XP, subir nível, alocar ponto, regen).
 *
 * Decisão de design (documentada): no level up, HP e Mana atuais ENCHEM até o
 * novo máximo. É um "respiro de conquista" (estilo clássico) e evita o estado
 * estranho de subir de nível com a barra parcialmente vazia. Reavaliar no M2.
 */

/** Estado de progressão do jogador. Vive na sim, projetado no snapshot. */
export interface Progression {
  cls: PlayerClass;
  level: number;
  /** XP TOTAL acumulado (não o do nível atual). */
  xp: number;
  attributes: Attributes;
  /** Pontos de atributo livres ainda não distribuídos. */
  freeStatPoints: number;
  /** Tempo (ms) acumulado desde o último PULSO de regen (modelo de intervalo). */
  regenTimerMs: number;
}

/**
 * Nível efetivo de uma criatura a partir do tier (placeholder até existir
 * nível real de criatura). Alimenta a regra anti-farm de XP. ✏️ placeholder.
 */
export function creatureLevelForTier(tier: Tier): number {
  // ✏️ placeholder — calibrar no M2 (mapeia T1..T5 → faixa de nível).
  const map: Record<Tier, number> = { T1: 1, T2: 8, T3: 16, T4: 24, T5: 32 };
  return map[tier];
}

/** Cria a progressão inicial (nível 1) de um jogador de dada classe. */
export function createProgression(cls: PlayerClass): Progression {
  return {
    cls,
    level: 1,
    xp: 0,
    attributes: { ...CLASS_BASE_ATTRIBUTES[cls] },
    freeStatPoints: 0,
    regenTimerMs: 0,
  };
}

/**
 * Rito de classe — transição classless → classe (decisão criador jun/2026:
 * pontos CARREGAM, UMA VIA). Troca a classe e o atributo INATO preservando os
 * pontos que o jogador alocou: para cada atributo, `novo = classe_base +
 * (atual − classless_base)`. Como maxHp/maxMana/cap são funções puras de
 * (attrs, cls, level), trocar `cls` faz os pools recalcularem pela classe no
 * nível ATUAL — você vira "um {classe} de nível N" como se sempre tivesse sido
 * (o −10% do classless some retroativo; ritar cedo ou tarde dá o mesmo base no
 * mesmo nível). NÃO mexe em recursos atuais, gold ou skills — quem chama
 * (Simulation) valida o gate (gold+quest), cobra e concede o kit. Retorna false
 * se o gate de estado falhar (já tem classe, ou alvo inválido).
 */
export function applyRitoTransition(prog: Progression, target: PlayerClass): boolean {
  if (prog.cls !== "classless" || target === "classless") return false;
  const base = CLASS_BASE_ATTRIBUTES.classless;
  const tgt = CLASS_BASE_ATTRIBUTES[target];
  const a = prog.attributes;
  for (const k of Object.keys(a) as AttributeKey[]) {
    // Pontos que o classless GASTOU pra subir este atributo (custo RO acumulado
    // da base classless até o valor atual).
    let pointsSpent = 0;
    for (let v = base[k]; v < a[k]; v++) pointsSpent += statPointCost(v);
    // Re-gasta o MESMO total a partir da base da CLASSE — onde a base já é alta,
    // o custo por ponto é maior, então rende menos increments (timing-independente:
    // bate com um nativo que investiu os mesmos pontos). O troco que não fecha um
    // increment volta como ponto livre (justo: o jogador ganhou aqueles pontos).
    let value = tgt[k];
    while (pointsSpent >= statPointCost(value)) {
      pointsSpent -= statPointCost(value);
      value++;
    }
    a[k] = value;
    prog.freeStatPoints += pointsSpent;
  }
  prog.cls = target;
  return true;
}

/**
 * Sincroniza os recursos máximos da entidade com as fórmulas (após mudança de
 * atributos/nível). Se `fill` for true, enche HP/Mana atuais ao novo máximo;
 * senão, só faz clamp para não passar do teto. Auto-attack do jogador também
 * deriva daqui (dano físico) — ver `Simulation.recomputePlayerDerived`.
 */
export function syncMaxResources(entity: SimEntity, prog: Progression, fill: boolean): void {
  const mhp = maxHp(prog.attributes, prog.cls, prog.level);
  const mmp = maxMana(prog.attributes, prog.cls, prog.level);
  entity.maxHp = mhp;
  entity.maxMp = mmp;
  if (fill) {
    entity.hp = mhp;
    entity.mp = mmp;
  } else {
    entity.hp = Math.min(entity.hp, mhp);
    entity.mp = Math.min(entity.mp, mmp);
  }
}

/**
 * Concede XP ao jogador e processa level ups. `baseXp` é o XP do template da
 * vítima; a redução anti-farm por diferença de nível é aplicada aqui via
 * `xpFromKill`. Emite `level_up` no bus para cada nível subido. Retorna o XP
 * efetivamente concedido (0 = kill inválido para XP).
 */
export function grantKillXp(
  prog: Progression,
  entity: SimEntity,
  baseXp: number,
  creatureLevel: number,
  bus: EventBus,
  ctx: CombatContext,
): number {
  const gained = xpFromKill(baseXp, prog.level, creatureLevel);
  if (gained <= 0) return 0;

  prog.xp += gained;
  const newLevel = levelForXp(prog.xp);
  if (newLevel > prog.level) {
    applyLevelUps(prog, entity, prog.level, newLevel, bus, ctx);
  }
  return gained;
}

/**
 * Aplica os efeitos de subir de `fromLevel` para `toLevel` (pode pular vários):
 * pontos de atributo livres + crescimento automático por classe (via fórmulas,
 * que já leem o nível) + enche HP/Mana. Emite `level_up` por nível subido.
 */
function applyLevelUps(
  prog: Progression,
  entity: SimEntity,
  fromLevel: number,
  toLevel: number,
  bus: EventBus,
  ctx: CombatContext,
): void {
  for (let lvl = fromLevel + 1; lvl <= toLevel; lvl++) {
    prog.level = lvl;
    prog.freeStatPoints += STAT_POINTS_PER_LEVEL;
    // O crescimento automático por classe (HP/Mana) é função do nível dentro
    // de `maxHp`/`maxMana` — não somamos nada manualmente aqui.
    bus.emit("level_up", {
      entity: { id: entity.id, species: entity.species, family: entity.family },
      fromLevel: lvl - 1,
      toLevel: lvl,
      context: ctx,
    });
  }
  // HP/Mana enchem ao novo máximo (decisão documentada acima).
  syncMaxResources(entity, prog, true);
}

/**
 * Penalidade de XP por morte do jogador (macro do MVP — "morte dói", modelo
 * Tibia). Remove `DEATH_XP_PENALTY` (10%) do XP TOTAL acumulado e recalcula o
 * nível a partir do novo total.
 *
 * Decisões de design (documentadas):
 * - LEVEL-DOWN É PERMITIDO: se o XP perdido derrubar o total abaixo do limiar do
 *   nível atual, `prog.level` desce (piso natural: level 1 / xp 0, pois
 *   `xpForLevel(1) = 0` e o floor garante `lost ≥ 0`). É o que faz a morte doer
 *   de verdade — perder progresso, não só "a barra do nível".
 * - `freeStatPoints` NÃO são revogados: pontos já concedidos por level ups (e os
 *   atributos já gastos) ficam. Revogá-los exigiria rastrear quais pontos vieram
 *   de quais níveis e "desfazer" alocações do jogador — complexo e punitivo
 *   demais para o MVP. Consequência aceita: um jogador que dá level-down e re-sobe
 *   acumula pontos de "níveis repetidos". Reavaliar se virar exploit (alternativa:
 *   limitar freeStatPoints a `STAT_POINTS_PER_LEVEL * (level - 1)`).
 *
 * NÃO mexe em HP/Mana atuais aqui (o respawn enche depois). Só ajusta o TETO de
 * recursos quando houve level-down, via `syncMaxResources(.., false)`: o máximo
 * desce para o do novo nível e o atual é clampado — depois o respawn refilla.
 * Quem chama deve recomputar derivados (dano/cooldown) se `leveledDown`.
 *
 * Retorna `{ lostXp, leveledDown }` para telemetria/log do chamador.
 */
export function applyDeathPenalty(
  prog: Progression,
  entity: SimEntity,
): { lostXp: number; leveledDown: boolean } {
  // floor garante XP inteira e ≥ 0 (lvl1/0xp → perde 0, sem efeito colateral).
  const lostXp = Math.floor(prog.xp * DEATH_XP_PENALTY);
  prog.xp -= lostXp;
  const newLevel = levelForXp(prog.xp);
  const leveledDown = newLevel < prog.level;
  prog.level = newLevel;
  if (leveledDown) {
    // Teto de HP/Mana desce ao do novo nível (sem encher: o respawn faz isso).
    syncMaxResources(entity, prog, false);
  }
  return { lostXp, leveledDown };
}

/**
 * Sobe um atributo em +1, debitando o CUSTO POR FAIXA em pontos livres
 * (`formulas.statPointCost` — estilo RO: atributo alto custa mais). Retorna
 * true se aplicou (havia pontos suficientes para o custo do próximo ponto).
 * Recalcula os recursos máximos (sem encher — só sobe o teto e mantém o atual).
 */
export function allocateStatPoint(
  prog: Progression,
  entity: SimEntity,
  attr: AttributeKey,
): boolean {
  const cost = statPointCost(prog.attributes[attr]);
  if (prog.freeStatPoints < cost) return false;
  prog.freeStatPoints -= cost;
  prog.attributes[attr] += 1;
  syncMaxResources(entity, prog, false);
  return true;
}

/**
 * Regeneração de HP e Mana — modelo de PULSOS (Tibia/Apogea, decidido criador
 * 2026-06-10): aplica um CHUNK a cada `REGEN_INTERVAL_MS` (não contínuo). O chunk
 * = taxa/seg (nível+classe) × mult da comida × intervalo. **Comida é pré-condição**:
 * `wellFedRegenMult` é 0 sem saciedade → sem comida, chunk 0 (HP e mana). O timer
 * corre mesmo sem comida/sem dano (próximo pulso cai no boundary de 5s). Não
 * regenera entidade morta. Chamado a cada tick para o jogador.
 */
export function regenTick(prog: Progression, entity: SimEntity, hpMult = 1, manaMult = 1): void {
  if (entity.dead) return;
  prog.regenTimerMs += TICK_MS;
  if (prog.regenTimerMs < REGEN_INTERVAL_MS) return;
  prog.regenTimerMs -= REGEN_INTERVAL_MS;
  const fed = wellFedRegenMult(entity);
  if (fed <= 0) return; // sem comida = sem regen (pulso vazio)
  const intervalSec = REGEN_INTERVAL_MS / 1000;
  // `hpMult`/`manaMult`: P5 (Caminho `regen`, ex: Intocável = ×mana em combate).
  // Default 1 = sem efeito; a Simulation calcula dos EffectSpec ativos.
  if (entity.hp < entity.maxHp) {
    const chunk = Math.round(hpRegenPerSecond(prog.cls, prog.level) * fed * intervalSec * hpMult);
    entity.hp = Math.min(entity.maxHp, entity.hp + chunk);
  }
  if (entity.mp < entity.maxMp) {
    const chunk = Math.round(manaRegenPerSecond(prog.cls, prog.level, prog.attributes.spirit) * fed * intervalSec * manaMult);
    entity.mp = Math.min(entity.maxMp, entity.mp + chunk);
  }
}
