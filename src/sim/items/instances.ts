import { createLedger, type ItemLedger } from "./ledger";
import { getItemTemplate, type ItemTemplate } from "./templates";

/**
 * Itens como INSTÂNCIAS com ID + ledger (DESIGN-EVOLUCAO.md §"Implicações
 * técnicas": "Itens são instâncias com ID + ledger, não stacks de template —
 * definir cedo para não retrofitar").
 *
 * Cada item físico no mundo é uma `ItemInstance` ÚNICA: um ID próprio, o template
 * que define seus stats, e um `ledger` de proveniência que VIAJA com a instância
 * (trade/drop futuros — DESIGN-EVOLUCAO.md §"História pertence ao objeto"). Dois
 * itens do mesmo template têm ledgers independentes.
 *
 * SIM only, determinístico: IDs vêm de um CONTADOR (nunca UUID/Math.random).
 */

/** Uma instância única de item (ID + templateId + ledger de proveniência). */
export interface ItemInstance {
  /** ID único da INSTÂNCIA (do contador da sim — determinístico). */
  id: number;
  /** ID do template (stats compartilhados — ver `templates.ts`). */
  templateId: string;
  /** Ledger de proveniência (contadores de Marca) — JSON-safe, viaja no trade. */
  ledger: ItemLedger;
}

/**
 * Registro de instâncias de item da sim. Criação determinística de IDs via
 * contador próprio (separado do contador de entidades — instâncias e entidades
 * têm ciclos de vida distintos; o item sobrevive ao dono).
 *
 * NÃO usa Map só para o lookup: serializa fácil (futuro save) e o tracking de
 * Marcas resolve a instância por ID a partir do payload de evento.
 */
export class ItemRegistry {
  private instances = new Map<number, ItemInstance>();
  /** Contador determinístico de IDs de instância (começa em 1). */
  private nextId = 1;

  /**
   * Cria uma nova instância de um template. Retorna a instância (já registrada).
   * Lança se o template for desconhecido — chamadores passam IDs válidos.
   */
  create(templateId: string): ItemInstance {
    const template = getItemTemplate(templateId);
    if (!template) throw new Error(`ItemRegistry.create: template desconhecido "${templateId}"`);
    const inst: ItemInstance = {
      id: this.nextId++,
      templateId,
      ledger: createLedger(),
    };
    this.instances.set(inst.id, inst);
    return inst;
  }

  /** Lookup de instância por ID (undefined = não existe). */
  get(id: number): ItemInstance | undefined {
    return this.instances.get(id);
  }

  /** Template de uma instância (conveniência — undefined se a instância não existe). */
  templateOf(id: number): ItemTemplate | undefined {
    const inst = this.instances.get(id);
    return inst ? getItemTemplate(inst.templateId) : undefined;
  }
}
