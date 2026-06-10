/**
 * Barrel do módulo de NPCs (SIM only) — o elenco como dados + o conceito de
 * comércio (sale lists). Diálogo segue em `sim/dialogue.ts` (ligado por id).
 */

export {
  type NpcRole,
  type NpcDef,
  NPC_CAST,
  getNpc,
  npcsByRole,
} from "./cast";

export {
  type TradeEntry,
  type NpcCommerce,
  COMMERCE,
  availableSells,
  availableBuys,
} from "./commerce";
