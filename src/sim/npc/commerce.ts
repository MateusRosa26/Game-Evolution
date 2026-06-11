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
 */
import type { QuestState } from "../quests";

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
 * Sucata de Arma…) entram como `buys` AQUI conforme os templates forem nascendo
 * (ITENS-LOOTS.md §Mapa de comércio — venda de loot é incremental). Por ora só
 * referenciamos templates que EXISTEM; os pendentes ficam comentados no NPC.
 */
export const COMMERCE: Record<string, NpcCommerce> = {
  // Nina — Loja Geral (Baixa): vendor floor. A opção PREGUIÇOSA — vende o básico
  // e compra quase tudo a preço ruim (sempre aberto, sem gating).
  nina: {
    // Só UTILITÁRIOS (revisado jun/2026): a Loja Geral NÃO vende mais armas —
    // o gear de combate é exclusivo do Ferreiro (Duarte). Tira a sobreposição.
    sells: [
      { templateId: "pao", price: 2 },
      { templateId: "tocha", price: 3 },
      { templateId: "corda", price: 15 },
      { templateId: "pa", price: 20 },
      // ✏️ + flechas / sacola quando os templates entrarem.
    ],
    buys: [
      // Vendor floor: paga MENOS que o especialista (cauda 1 vs 2 no Silas).
      { templateId: "cauda_de_rato", price: 1 },
    ],
  },

  // Bartolo — Estalagem do Vau: estalajadeiro E cozinheiro (Bento fundido nele,
  // jun/2026). Vende comida + pratos prontos; compra ingredientes pós-Q6.
  bartolo: {
    sells: [
      { templateId: "pao", price: 2 },
      { templateId: "carne_assada", price: 6 },
      { templateId: "sal_gema", price: 8 }, // cozinha: cidade inicial = só básico (Bento fundido no Bartolo)
      { templateId: "pote", price: 5 },     // Pimenta-longa/Mel Silvestre = outras cidades
    ],
    buys: [
      { templateId: "carne_crua", price: 1 }, // compra matéria-prima de caça
    ],
  },

  // Silas — boticário (Baixa): vende a Poção Pequena (sempre); compra reagentes
  // SÓ após a quest dele (Q3 — a própria quest ensina o que ele compra).
  silas: {
    sells: [{ templateId: "pocao_vida_pequena", price: 65 }],
    buys: [
      { templateId: "cauda_de_rato", price: 2, unlockedBy: "q3_silas" },
      // ✏️ + glandula_de_veneno / seda / asa_de_morcego quando entrarem (gated Q3).
    ],
  },

  // Duarte — ferreiro (Baixa): FONTE ÚNICA de gear de combate (revisado jun/2026)
  // — armas + escudo + armadura (metal/couro básico). Compra sucata pós-Q4.
  duarte: {
    sells: [
      { templateId: "espada_curta", price: 40 },
      { templateId: "machado_de_mao", price: 60 },
      { templateId: "clava", price: 40 },
      { templateId: "adaga", price: 40 },
      // ✏️ + escudo_de_madeira / gibao / botas / armadura_de_couro: o catálogo T1
      //    já está desenhado+balanceado (EQUIPAMENTO.md) e com sprite; falta PORTAR
      //    as peças pra items/templates.ts (hoje só tem armas) e listá-las aqui.
    ],
    buys: [
      // ✏️ + sucata_de_arma / adaga_enferrujada / escudo_lascado (gated Q4).
    ],
  },

  // Amaro — caçador-peleteiro (Cais): compra peles/couro/presas pós-Q7 (A Caçada
  // do Peleteiro). A Faca de Esfolar vem como RECOMPENSA da quest, não venda.
  amaro: {
    sells: [],
    buys: [
      // ✏️ + pele_de_lobo / couro_grosso / presa_de_javali (gated q7_amaro).
    ],
  },

  // Capitão Vidal — Quartel: bounty de Orelha de Goblin pós-Q5 (Lobos Demais →
  // abre o contrato).
  vidal: {
    sells: [],
    buys: [
      // ✏️ + orelha_de_goblin (bounty, gated q5_vidal).
    ],
  },
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
