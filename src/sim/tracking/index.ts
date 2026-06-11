/**
 * Barrel da ENGINE DE TRACKING (SIM only) — camada emergente do jogo
 * (DESIGN-EVOLUCAO.md §"Camada Emergente"): Marcas, Mutações e Caminhos como
 * DADOS declarativos avaliados por um sistema genérico. Sem pixi/browser.
 */

export { matchesFilter, type Filter, type FilterClause, type FilterOp, type FilterValue, type Facts } from "./filters";

export {
  type TrackingCategory,
  type TrackingDef,
  type MarkDef,
  type MutationDef,
  type PathDef,
  type Accumulator,
  type EffectSpec,
  type TrackingEffect,
  type TrackingFlavor,
} from "./types";

export {
  type TrackingState,
  type CharacterTracking,
  type SkillMutationProgress,
  type PathStyleProgress,
  type PathConductProgress,
  type PathRatioProgress,
  createTrackingState,
  characterTracking,
} from "./state";

export { TrackingEngine, type TrackingSink, type TrackingDeps } from "./engine";

export { DUMMY_TRACKING_DEFS } from "./definitions";
