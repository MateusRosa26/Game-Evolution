/**
 * Containers (SIM only) — mochilas, bolsos e CADÁVERES (DESIGN-ITENS.md:
 * "containers aninhados estilo Tibia", decidido; cadáver-container decidido
 * jun/2026). Um container é uma lista de slots; cada slot guarda uma
 * INSTÂNCIA de item, uma PILHA DE OURO ou uma PILHA DE ITEM FUNGÍVEL (modelo
 * Tibia): o ouro é o caso pioneiro de empilhamento; `stack` GENERALIZA isso pros
 * demais itens `stackable` (comida/reagente/poção) — N unidades do mesmo template
 * num slot só (`addItemStackAware`). Saquear = mover/fundir a pilha pra mochila;
 * o HUD mostra o total de ouro carregado (soma das pilhas de ouro).
 *
 * O GEAR (arma/armadura que ganha Marca) NUNCA empilha: continua `item` +
 * `instanceId` (ID + ledger únicos — DESIGN-EVOLUCAO §"Itens são instâncias").
 * Só itens `stackable` (que NÃO carregam história própria) viram `stack`.
 *
 * IDs próprios (contador da sim, determinístico) — container sobrevive a
 * dono (cadáver não tem dono; mochila trocada de mãos mantém conteúdo).
 */

import { getItemTemplate } from "./templates";
import type { ItemRegistry } from "./instances";

export type ContainerSlotContent =
  | { kind: "item"; instanceId: number }
  | { kind: "stack"; templateId: string; count: number }
  | { kind: "gold"; amount: number }
  | null;

export interface Container {
  id: number;
  /** Nome exibível ("Bolso", "Mochila", "Corpo de Rato"). */
  name: string;
  capacity: number;
  slots: ContainerSlotContent[];
}

export class ContainerRegistry {
  private byId = new Map<number, Container>();
  private nextId = 1;

  create(name: string, capacity: number): Container {
    const c: Container = {
      id: this.nextId++,
      name,
      capacity,
      slots: new Array(capacity).fill(null),
    };
    this.byId.set(c.id, c);
    return c;
  }

  get(id: number): Container | undefined {
    return this.byId.get(id);
  }

  remove(id: number): void {
    this.byId.delete(id);
  }

  /** Primeiro slot livre (null) ou -1. */
  freeSlot(c: Container): number {
    return c.slots.findIndex((s) => s === null);
  }

  /** Acrescenta conteúdo no primeiro slot livre. false = cheio. */
  add(c: Container, content: Exclude<ContainerSlotContent, null>): boolean {
    const i = this.freeSlot(c);
    if (i < 0) return false;
    c.slots[i] = content;
    return true;
  }

  /** Soma o ouro (todas as pilhas) de um container. */
  totalGold(c: Container): number {
    let t = 0;
    for (const s of c.slots) if (s?.kind === "gold") t += s.amount;
    return t;
  }

  /**
   * Deposita `amount` de ouro: funde numa pilha de ouro existente (1 pilha por
   * container) ou usa o primeiro slot livre. Retorna o que NÃO coube (0 = tudo).
   */
  depositGold(c: Container, amount: number): number {
    if (amount <= 0) return 0;
    const existing = c.slots.find((s) => s?.kind === "gold");
    if (existing && existing.kind === "gold") {
      existing.amount += amount;
      return 0;
    }
    const i = this.freeSlot(c);
    if (i < 0) return amount; // cheio
    c.slots[i] = { kind: "gold", amount };
    return 0;
  }

  /**
   * Saca `amount` de ouro do container (debita das pilhas; ≥1 por container).
   * Retorna true se sacou tudo; false (sem debitar) se não havia ouro suficiente.
   * Limpa pilhas zeradas. Usado pela compra em loja (gold do bolso → NPC).
   */
  withdrawGold(c: Container, amount: number): boolean {
    if (amount <= 0) return true;
    if (this.totalGold(c) < amount) return false;
    let remaining = amount;
    for (const s of c.slots) {
      if (s?.kind !== "gold") continue;
      const take = Math.min(s.amount, remaining);
      s.amount -= take;
      remaining -= take;
      if (remaining <= 0) break;
    }
    c.slots.forEach((s, i) => {
      if (s?.kind === "gold" && s.amount <= 0) c.slots[i] = null;
    });
    return true;
  }

  /**
   * Acrescenta `count` unidades de `templateId` ao container, ciente de pilha:
   *  - template `stackable` → procura slots `stack` do MESMO template com folga
   *    (`count < maxStack`), enche-os até o teto e TRANSBORDA pra novos slots
   *    `stack` (cada um ≤ maxStack). Itens fungíveis (comida/reagente/poção) NÃO
   *    têm ID/ledger próprios, então viram contagem pura.
   *  - template NÃO-`stackable` (gear, ferramentas únicas) → cria uma `ItemInstance`
   *    por unidade (ID + ledger únicos — DESIGN-EVOLUCAO) e ocupa 1 slot `item` cada.
   *
   * Retorna quantas unidades NÃO couberam (0 = entrou tudo). Determinístico:
   * preenche pilhas existentes antes de abrir slots novos, da esquerda pra direita.
   */
  addItemStackAware(reg: ItemRegistry, c: Container, templateId: string, count = 1): number {
    if (count <= 0) return 0;
    const tpl = getItemTemplate(templateId);
    // Sem template ou não-empilhável: 1 instância por slot (comportamento de hoje).
    if (!tpl || !tpl.stackable) {
      let left = count;
      while (left > 0) {
        const i = this.freeSlot(c);
        if (i < 0) return left; // cheio
        c.slots[i] = { kind: "item", instanceId: reg.create(templateId).id };
        left--;
      }
      return 0;
    }
    const max = maxStackOf(templateId);
    let left = count;
    // 1) completa pilhas já existentes do mesmo template.
    for (const s of c.slots) {
      if (left <= 0) break;
      if (s?.kind === "stack" && s.templateId === templateId && s.count < max) {
        const room = max - s.count;
        const put = Math.min(room, left);
        s.count += put;
        left -= put;
      }
    }
    // 2) transborda pra slots novos (cada um ≤ max).
    while (left > 0) {
      const i = this.freeSlot(c);
      if (i < 0) return left; // cheio
      const put = Math.min(max, left);
      c.slots[i] = { kind: "stack", templateId, count: put };
      left -= put;
    }
    return 0;
  }

  /**
   * Cabe(m) `count` unidades de `templateId` neste container SEM transbordar?
   * Stack-aware: conta a folga das pilhas `stack` do mesmo template MAIS os slots
   * livres × teto. Para gear (não-stackable), cada unidade precisa de 1 slot livre.
   * Usado pela loja (uma compra de empilhável cabe numa pilha parcial mesmo sem
   * slot vazio). NÃO muta nada.
   */
  canFit(c: Container, templateId: string, count = 1): boolean {
    if (count <= 0) return true;
    const max = maxStackOf(templateId);
    let room = 0;
    if (max > 1) {
      for (const s of c.slots) {
        if (s?.kind === "stack" && s.templateId === templateId) room += max - s.count;
        else if (s === null) room += max;
        if (room >= count) return true;
      }
      return room >= count;
    }
    // não-empilhável: 1 slot livre por unidade.
    let free = 0;
    for (const s of c.slots) if (s === null && ++free >= count) return true;
    return free >= count;
  }

  /**
   * Quantas unidades de `templateId` o container guarda — SOMA as pilhas `stack`
   * E conta as instâncias `item` do mesmo template (gear/ferramenta avulsa também
   * contam, p/ uma quest de coleta fechar venha o item como stack ou instância).
   * Precisa do `reg` p/ resolver o template de uma instância.
   */
  countOf(reg: ItemRegistry, c: Container, templateId: string): number {
    let n = 0;
    for (const s of c.slots) {
      if (!s) continue;
      if (s.kind === "stack" && s.templateId === templateId) n += s.count;
      else if (s.kind === "item" && reg.get(s.instanceId)?.templateId === templateId) n++;
    }
    return n;
  }

  /**
   * Remove `n` unidades de `templateId` do container (consumo/entrega de quest).
   * Debita das pilhas `stack` primeiro e depois das instâncias `item` do mesmo
   * template, da esquerda pra direita. Pilha que chega a 0 vira `null` (libera o
   * slot); instância removida some do slot. Retorna quantas faltaram remover
   * (0 = removeu tudo; >0 = não havia o suficiente).
   */
  removeOf(reg: ItemRegistry, c: Container, templateId: string, n: number): number {
    let left = n;
    for (let i = 0; i < c.slots.length && left > 0; i++) {
      const s = c.slots[i];
      if (s?.kind === "stack" && s.templateId === templateId) {
        const take = Math.min(s.count, left);
        s.count -= take;
        left -= take;
        if (s.count <= 0) c.slots[i] = null;
      } else if (s?.kind === "item" && reg.get(s.instanceId)?.templateId === templateId) {
        c.slots[i] = null;
        left--;
      }
    }
    return left;
  }
}

/**
 * Teto de empilhamento de um template (default 12 quando `stackable` sem teto
 * explícito — espelha o default de comida/reagente/poção em templates.ts). Ouro
 * NÃO passa por aqui: stacka ilimitado em `gold` por caminho próprio.
 */
export function maxStackOf(templateId: string): number {
  const tpl = getItemTemplate(templateId);
  if (!tpl || !tpl.stackable) return 1;
  return tpl.maxStack ?? 12;
}
