/**
 * Barrel do módulo de itens (SIM only) — fundação de "itens como instâncias com
 * ID + ledger" (DESIGN-EVOLUCAO.md §"Implicações técnicas"). Sem UI de inventário
 * (M2): aqui vive só a CAMADA DE DADOS + o ledger alimentado pelos eventos.
 */

export {
  type ItemSlot,
  type ItemTag,
  type ItemRarity,
  type WeaponStats,
  type ItemTemplate,
  ITEM_TEMPLATES,
  getItemTemplate,
  markSlotsForRarity,
  STARTER_WEAPON_BY_CLASS,
  FISTS_TEMPLATE_ID,
} from "./templates";

export { type ItemInstance, ItemRegistry } from "./instances";

export {
  type ItemLedger,
  type LedgerContextKills,
  type ItemOwnerRef,
  type MarkProgress,
  type LedgerDeps,
  createLedger,
  recordPreviousOwner,
  attachItemLedger,
} from "./ledger";
