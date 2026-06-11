/**
 * ESTADO DE TRACKING — onde vive o progresso da camada emergente
 * (DESIGN-EVOLUCAO.md §Taxonomia). 100% serializável (Records, nunca Maps cruas
 * na borda) e vive NA SIM. Três localidades, conforme o design:
 *
 *  - MARCA (mark)     → NÃO vive aqui: vive no LEDGER da instância de item
 *                       (`ItemLedger.markProgress`), porque "a história pertence
 *                       ao objeto" e precisa viajar no trade. A engine lê/escreve
 *                       lá via o registry de itens. (Por isso `TrackingState` não
 *                       guarda nada de mark — evita duplicar a fonte de verdade.)
 *  - MUTAÇÃO (mutation) → contador por (personagem, skillId) com PERFIL de uso.
 *  - CAMINHO (path)   → contadores/condutas por personagem.
 */

/**
 * Progresso de mutações de UMA skill para UM personagem. **Modelo contador
 * absoluto por perfil** (jun/2026): `profileCounts[defId]` conta os casts que
 * casaram o perfil daquela mutação; o 1º a cruzar a PRÓPRIA meta resolve. Sem
 * denominador/share (o antigo `totalValidUses` saiu na migração).
 */
export interface SkillMutationProgress {
  /** Casts válidos que casaram o perfil de cada mutação concorrente (defId → n). */
  profileCounts: Record<string, number>;
  /** Definições de mutação cujo hint dos ~50% já foi mostrado (one-shot). */
  hinted: Record<string, boolean>;
  /** Mutação já resolvida/desbloqueada para esta skill (defId) — null = ainda não. */
  resolved: string | null;
}

/**
 * Progresso de UM Caminho de ESTILO para um personagem. `value` é o VALOR REDUZIDO
 * pelo acumulador (count/set.size/soma/max). `seen` só existe para `distinct`
 * (conjunto serializado como array, JSON-safe).
 */
export interface PathStyleProgress {
  /** Valor reduzido corrente (compara com `threshold`). */
  value: number;
  /** [distinct] Valores já vistos (cardinalidade = `value`). */
  seen?: string[];
  hinted: boolean;
  unlocked: boolean;
}

/**
 * Progresso de UM Caminho de PROPORÇÃO (`ratio`) para um personagem. Dois
 * somatórios; desbloqueia no milestone de level se `num/den ≥ minRatio`.
 */
export interface PathRatioProgress {
  num: number;
  den: number;
  hinted: boolean;
  unlocked: boolean;
}

/**
 * Estado de UMA conduta para um personagem. Monitorada desde a criação: começa
 * `intact: true`. Quebrar (evento+filtro de quebra) → `intact: false` PARA SEMPRE
 * (proposta do design: perdida naquele personagem). Desbloqueia ao atingir o
 * milestone de level com `intact: true`.
 */
export interface PathConductProgress {
  /** Conduta ainda intacta? false = quebrada para sempre. */
  intact: boolean;
  /** Hint dos ~50% (do caminho até o milestone de level) já mostrado? */
  hinted: boolean;
  /** Caminho já desbloqueado? */
  unlocked: boolean;
}

/** Estado de tracking de UM personagem (mutações + caminhos). JSON-safe. */
export interface CharacterTracking {
  /** Mutações por skillId. */
  mutations: Record<string, SkillMutationProgress>;
  /** Caminhos de estilo por defId. */
  pathsStyle: Record<string, PathStyleProgress>;
  /** Condutas por defId. */
  pathsConduct: Record<string, PathConductProgress>;
  /** Caminhos de proporção (ratio) por defId. */
  pathsRatio: Record<string, PathRatioProgress>;
  /**
   * MEMÓRIA DE ALGOZ (nêmesis): espécie que deu o golpe fatal neste personagem
   * por último (null = nunca morreu). O próximo kill dessa espécie marca o fato
   * `avengesDeath` (Caminho da Vingança). Reescrita a cada morte.
   */
  lastKillerSpecies?: string | null;
}

/**
 * Estado de tracking de TODA a sim, por personagem (entityId → estado). A
 * progressão de Marca NÃO está aqui (vive no ledger do item). Serializável:
 * `JSON.stringify(state)` basta no save futuro.
 */
export interface TrackingState {
  byCharacter: Record<number, CharacterTracking>;
}

/** Cria o estado de tracking vazio da sim. */
export function createTrackingState(): TrackingState {
  return { byCharacter: {} };
}

/** Obtém (criando sob demanda) o estado de tracking de um personagem. */
export function characterTracking(state: TrackingState, entityId: number): CharacterTracking {
  let ct = state.byCharacter[entityId];
  if (!ct) {
    ct = { mutations: {}, pathsStyle: {}, pathsConduct: {}, pathsRatio: {}, lastKillerSpecies: null };
    state.byCharacter[entityId] = ct;
  }
  return ct;
}
