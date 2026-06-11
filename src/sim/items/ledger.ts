import type { CreatureFamily } from "../../shared/types";
import type { EventBus, KillEvent, DamageEvent } from "../events";
import type { ItemRegistry } from "./instances";
import { isValidKill } from "../formulas";
import { creatureLevelForTier } from "../progression";
import { CREATURES } from "../bestiary";

/**
 * O LEDGER — o "ego do item" (DESIGN-EVOLUCAO.md §"1. Marcas de Item — o ego do
 * item": "A instância do item guarda um ledger: contadores de quem/o quê/como
 * ele matou ou foi usado").
 *
 * Estrutura PENSADA para as dimensões das Marcas (família, espécie, contexto,
 * dano, donos anteriores). Os contadores são OCULTOS por design (Marcas são
 * secretas — §"Visibilidade") → NUNCA vão ao snapshot.
 *
 * ── Serialização (decisão documentada) ──
 * O ledger é 100% JSON-SAFE: usamos OBJETOS-DICIONÁRIO (`Record<string, number>`)
 * em vez de `Map`, exatamente para que `JSON.stringify(ledger)` baste no save
 * futuro e na borda de rede (trade leva o ledger junto). Zero `Map`/`Set`/refs.
 */

/**
 * Contadores de CONTEXTO de kill (DESIGN-EVOLUCAO.md §1 "Kills por contexto").
 * Cada campo conta kills com golpe final DA ARMA equipada satisfazendo a condição.
 * Um mesmo kill pode incrementar VÁRIOS contextos (são ortogonais).
 */
export interface LedgerContextKills {
  /**
   * Golpe final à NOITE. TODO(dia/noite): a sim ainda não tem ciclo dia/noite
   * (`CombatContext.night` é sempre false no M1). Por ora isto conta como
   * "não-noite" → SEMPRE 0 até o ciclo existir. Quando existir, alimentar de
   * `ev.context.night` sem mudar a forma deste contador.
   */
  atNight: number;
  /** Golpe final com o HP% do DONO da arma < 10% (Marca "Última Resposta"). */
  ownerLowHp: number;
  /**
   * Golpe FINAL — todo kill atribuído à arma é, por definição, um golpe final
   * dela (regra anti-degeneração: "conta o kill se ela deu o golpe final").
   * Mantido explícito p/ simetria com as outras dimensões e clareza do contrato.
   */
  finalBlow: number;
}

/**
 * Ledger de proveniência de uma instância de item. TUDO JSON-safe.
 * Os dicionários por família/espécie crescem sob demanda (chave só existe após
 * o primeiro kill daquela família/espécie) — economiza espaço e serializa enxuto.
 */
export interface ItemLedger {
  /** Total de kills atribuídos a esta arma (golpe final estando equipada). */
  totalKills: number;
  /** Kills por FAMÍLIA de criatura (ex: { undead: 14000, bestial: 30 }). */
  killsByFamily: Record<string, number>;
  /** Kills por ESPÉCIE (ex: { rato: 30, esqueleto: 14000 }). */
  killsBySpecies: Record<string, number>;
  /** Kills por CONTEXTO (noite/HP baixo/golpe final). */
  killsByContext: LedgerContextKills;
  /** Dano TOTAL causado por esta arma (auto-attack + skills de arma). */
  totalDamageDealt: number;
  /**
   * Golpes BLOQUEADOS por esta instância (futuro: shield). `block` ainda NÃO é
   * emitido no M1 — campo pronto para a wave de escudo/parry (Marca "Inabalável").
   */
  blockedHits: number;
  /**
   * Donos anteriores da instância (proveniência — DESIGN-EVOLUCAO.md §"História
   * pertence ao objeto"). Lista append-only de identificadores estáveis. Sem
   * trade no M1 → sempre vazia; pronta para `recordPreviousOwner` no trade futuro.
   */
  previousOwners: ItemOwnerRef[];
  /**
   * Progresso das MARCAS desta instância (camada emergente — DESIGN-EVOLUCAO.md
   * §1). A engine de tracking (`src/sim/tracking`) mantém AQUI o contador por
   * definição de Marca, porque "a história pertence ao objeto": ao tradear/dropar,
   * o progresso (e o hint já mostrado / a Marca já desbloqueada) VIAJA com o item.
   * Chave = id da definição de Marca. Oculto por design → nunca vai ao snapshot.
   */
  markProgress: Record<string, MarkProgress>;
}

/** Progresso de UMA Marca numa instância de item (JSON-safe). */
export interface MarkProgress {
  /**
   * VALOR REDUZIDO acumulado pelo acumulador da definição (count/set.size/soma/
   * max). Nome legado `count`; com `accumulator:"count"` (default) é a contagem.
   */
  count: number;
  /** [distinct] Valores já vistos por esta instância (cardinalidade = `count`). */
  seen?: string[];
  /** Hint dos ~50% já mostrado? (one-shot — DESIGN-EVOLUCAO.md §"Visibilidade"). */
  hinted: boolean;
  /** Marca já desbloqueada nesta instância? (permanente — nunca se perde). */
  unlocked: boolean;
}

/** Referência a um dono passado da instância (proveniência, JSON-safe). */
export interface ItemOwnerRef {
  /** ID da entidade dona (estável dentro de uma sessão de sim). */
  id: number;
  /** Nome do dono no momento da posse (para flavor/UI futura). */
  name: string;
}

/** Cria um ledger zerado para uma nova instância. */
export function createLedger(): ItemLedger {
  return {
    totalKills: 0,
    killsByFamily: {},
    killsBySpecies: {},
    killsByContext: { atNight: 0, ownerLowHp: 0, finalBlow: 0 },
    totalDamageDealt: 0,
    blockedHits: 0,
    previousOwners: [],
    markProgress: {},
  };
}

/** Incrementa uma chave de um dicionário de contagem (cria a chave se faltar). */
function bump(record: Record<string, number>, key: string, by = 1): void {
  record[key] = (record[key] ?? 0) + by;
}

/**
 * Registra um dono anterior na proveniência da instância (trade/drop futuro).
 * Sem trade no M1 — exposto para a wave de inventário/economia chamar na borda
 * da troca (o ledger viaja com o item; o dono que sai entra nesta lista).
 */
export function recordPreviousOwner(ledger: ItemLedger, owner: ItemOwnerRef): void {
  ledger.previousOwners.push({ id: owner.id, name: owner.name });
}

/** Limiar de "HP baixo" do dono p/ contexto `ownerLowHp` (DESIGN-EVOLUCAO.md §1). */
const OWNER_LOW_HP_PCT = 0.1; // < 10% — Marca "Última Resposta"

/**
 * Assinante do bus que ALIMENTA os ledgers das instâncias equipadas
 * (DESIGN-EVOLUCAO.md §1 + §"Anti-degeneração"). Módulo separado, declarativo:
 * lê `kill`/`damage` do bus e escreve na instância — nunca o contrário.
 *
 * ── REGRA DE ATRIBUIÇÃO (arma vs magia) — documentada ──
 * Vem das fichas (§"Magias e Skills": "Auto-attack não é skill… alimenta as
 * Marcas de item — todo kill por auto-attack conta no ledger da arma"; e
 * Golpe Forte/Apunhalar têm tag `arma`). A regra que aplicamos:
 *
 *   • Conta para a ARMA o evento cujo payload traz `weaponInstanceId` != null.
 *     - Auto-attack SEMPRE traz a instância equipada (combat via Simulation).
 *     - Skills FÍSICAS de arma (Golpe Forte, Apunhalar — `effect: "physical"`)
 *       trazem a instância equipada (o executor marca o golpe como "weapon").
 *   • NÃO conta para a arma magias (Bola de Fogo/Lança de Gelo/Luz Sagrada) nem
 *     DoT/cura: esses eventos vêm com `weaponInstanceId == null` (o executor
 *     passa `null` p/ projéteis/linha/cura). Logo, nem dano nem kill por magia
 *     tocam o ledger da arma. (Magias alimentarão Mutações de skill — outra wave.)
 *
 * ── ANTI-DEGENERAÇÃO ──
 *   • Kill só conta se for VÁLIDO (`formulas.isValidKill`: ainda dá XP p/ o nível
 *     do dono — §"Anti-degeneração": mata farm de rato no lvl 100).
 *   • Para a arma, conta o kill se ela deu o GOLPE FINAL estando equipada — que é
 *     exatamente o que `weaponInstanceId` no `kill` representa.
 *
 * NOTA(level do atacante): `isValidKill` precisa do nível do jogador. O bus não
 * carrega isso no payload; passamos um `lookupAttackerLevel(id)` (a Simulation
 * fornece). Sem nível (não-jogador) → kill não conta para arma (só players têm
 * arma equipada com ledger de qualquer modo).
 */
export interface LedgerDeps {
  registry: ItemRegistry;
  /** Nível do jogador atacante (p/ a regra de kill válido). null = não-jogador. */
  attackerLevelOf: (entityId: number) => number | null;
}

/**
 * Conecta o ledger ao bus. Chamado uma vez na construção da Simulation.
 * Listeners SÍNCRONOS e determinísticos (ordem de inscrição — ver `EventBus`).
 */
export function attachItemLedger(bus: EventBus, deps: LedgerDeps): void {
  bus.on("damage", (ev) => onDamage(ev, deps));
  bus.on("kill", (ev) => onKill(ev, deps));
}

/** Acumula dano causado no ledger da arma que o causou (se houve arma). */
function onDamage(ev: DamageEvent, deps: LedgerDeps): void {
  if (ev.weaponInstanceId == null) return; // magia/DoT/ambiental → não é da arma
  const inst = deps.registry.get(ev.weaponInstanceId);
  if (!inst) return;
  inst.ledger.totalDamageDealt += ev.amount;
}

/** Atribui o kill (golpe final) à arma equipada, com filtros anti-degeneração. */
function onKill(ev: KillEvent, deps: LedgerDeps): void {
  if (ev.weaponInstanceId == null) return; // golpe final por magia → não é da arma
  const inst = deps.registry.get(ev.weaponInstanceId);
  if (!inst) return;

  // Anti-degeneração: kill precisa ser VÁLIDO (ainda dá XP para o nível do dono).
  const attackerLevel = deps.attackerLevelOf(ev.attacker.id);
  const template = ev.victim.species ? CREATURES[ev.victim.species] : undefined;
  if (attackerLevel == null || !template) return; // só players matando criaturas do bestiário
  const creatureLevel = creatureLevelForTier(template.tier);
  if (!isValidKill(template.xp, attackerLevel, creatureLevel)) return;

  // ── Kill válido com a arma → alimenta as dimensões da instância ──
  const L = inst.ledger;
  L.totalKills += 1;
  if (ev.victim.family) bump(L.killsByFamily, ev.victim.family as CreatureFamily);
  if (ev.victim.species) bump(L.killsBySpecies, ev.victim.species);

  // Contextos (ortogonais — um kill pode marcar vários):
  L.killsByContext.finalBlow += 1; // todo kill da arma é golpe final dela
  if (ev.context.night) L.killsByContext.atNight += 1; // TODO(dia/noite): sempre false no M1
  if (ev.attackerHpPct < OWNER_LOW_HP_PCT) L.killsByContext.ownerLowHp += 1;
}
