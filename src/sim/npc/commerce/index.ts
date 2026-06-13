/**
 * Comércio de NPC — o "conceito de sale" (SISTEMA-NPCS.md §Comércio especializado;
 * ECONOMIA.md §Loot & gold; ITENS-LOOTS.md §Mapa de comércio).
 *
 * MODELO (decidido jun/2026, estilo Apogea):
 *  - **Não existe vendedor universal.** Cada NPC tem um sortimento PRÓPRIO de
 *    `sells` (o que vende ao jogador) e `buys` (o que compra do jogador).
 *  - **Compra especializada**: loot de mob tem compradores específicos (o
 *    boticário compra reagentes; o ferreiro, sucata; o caçador, peles).
 *  - **Trade destravado por quest**: entradas com `unlockedBy` só entram no
 *    sortimento DEPOIS da quest daquele NPC completada — a relação comercial é
 *    recompensa de quest. Saber "quem compra o quê" vira conhecimento-loot.
 *
 * Os PREÇOS são placeholder ✏️ (Balancista calibra na bateria M2 — ECONOMIA.md
 * §"Gold T1 — 1º passe": pão 2 · tocha 3 · corda 15 · pá 20 · arma T1 40 ·
 * machado 60 · Poção Pequena 65; venda de loot 1 (vendor floor) / 2 (especialista)).
 *
 * SIM only — dados puros, sem pixi/browser. A transação (comprar/vender de fato,
 * mexendo no bolso e nas instâncias) é wave seguinte; aqui vive só o SORTIMENTO
 * e o resolver de disponibilidade. Comentários pt-BR.
 *
 * TOPOLOGIA (jun/2026): cada NPC mora em `npc/commerce/<id>.ts`; este barrel
 * re-monta o registro `COMMERCE`, expõe os resolvers e os tipos. O specifier
 * `./commerce` segue resolvendo pra cá (index do dir).
 */
import type { QuestState } from "../../quests";
import { nina } from "./nina";
import { bartolo } from "./bartolo";
import { silas } from "./silas";
import { duarte } from "./duarte";
import { amaro } from "./amaro";
import { vidal } from "./vidal";
import { telmo } from "./telmo";

/** Uma linha do sortimento de um NPC (vender PARA o jogador ou COMPRAR dele). */
export interface TradeEntry {
  /** Template do item negociado (ver `items/templates`). */
  templateId: string;
  /** Preço em gold (✏️ placeholder — Balancista). Em `sells` = quanto custa
   *  comprar; em `buys` = quanto o NPC paga pelo item do jogador. */
  price: number;
  /** Quest (id) que precisa estar COMPLETA para esta linha existir. Ausente =
   *  sempre disponível. É o "trade destravado por quest" (recompensa de relação). */
  unlockedBy?: string;
}

/** Sortimento comercial de um NPC. */
export interface NpcCommerce {
  /** Itens que o NPC VENDE ao jogador. */
  sells: TradeEntry[];
  /** Itens que o NPC COMPRA do jogador (loot vendável, ingredientes…). */
  buys: TradeEntry[];
}

/**
 * Registro de comércio por npcId (cresce com o elenco e o catálogo de itens).
 *
 * Itens de loot ainda NÃO criados (Pele de Lobo, Glândula, Orelha de Goblin,
 * Sucata de Arma…) entram como `buys` no módulo do NPC conforme os templates
 * forem nascendo (ITENS-LOOTS.md §Mapa de comércio — venda de loot é incremental).
 * Por ora só referenciamos templates que EXISTEM; os pendentes ficam comentados.
 */
export const COMMERCE: Record<string, NpcCommerce> = {
  nina,
  bartolo,
  silas,
  duarte,
  amaro,
  vidal,
  telmo,
};

/** Uma quest está completa no estado do jogador? */
function isCompleted(quests: Map<string, QuestState>, questId: string): boolean {
  return quests.get(questId)?.stage === "completed";
}

/** Filtra um sortimento pelas linhas DISPONÍVEIS dado o progresso de quests. */
function available(
  entries: TradeEntry[],
  quests: Map<string, QuestState>,
): TradeEntry[] {
  return entries.filter((e) => !e.unlockedBy || isCompleted(quests, e.unlockedBy));
}

/** Itens que o NPC vende ao jogador AGORA (respeitando gating de quest). */
export function availableSells(
  npcId: string,
  quests: Map<string, QuestState>,
): TradeEntry[] {
  const c = COMMERCE[npcId];
  return c ? available(c.sells, quests) : [];
}

/** Itens que o NPC compra do jogador AGORA (respeitando gating de quest). */
export function availableBuys(
  npcId: string,
  quests: Map<string, QuestState>,
): TradeEntry[] {
  const c = COMMERCE[npcId];
  return c ? available(c.buys, quests) : [];
}
