/**
 * Containers (SIM only) — mochilas, bolsos e CADÁVERES (DESIGN-ITENS.md:
 * "containers aninhados estilo Tibia", decidido; cadáver-container decidido
 * jun/2026). Um container é uma lista de slots; cada slot guarda uma
 * INSTÂNCIA de item ou uma PILHA DE OURO (modelo Tibia, decidido jun/2026): o
 * ouro é um item empilhável que vive no bolso do jogador (saquear = mover/fundir
 * a pilha pra mochila). O HUD mostra o total carregado (soma das pilhas).
 *
 * IDs próprios (contador da sim, determinístico) — container sobrevive a
 * dono (cadáver não tem dono; mochila trocada de mãos mantém conteúdo).
 */

export type ContainerSlotContent =
  | { kind: "item"; instanceId: number }
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
}
