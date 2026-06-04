/**
 * Avaliador de FILTROS DECLARATIVOS — o coração de "condições são DADOS, não
 * código" (DESIGN-EVOLUCAO.md §"Implicações técnicas": "Contadores são dados,
 * não código: condições descritas como definições, avaliadas por um sistema
 * genérico"). Reutilizado por Marcas, Mutações e Caminhos.
 *
 * Um filtro é uma lista de CLÁUSULAS `{ field, op, value }` com AND IMPLÍCITO
 * entre elas (todas precisam passar). Cada cláusula lê um CAMPO de um objeto
 * de FATOS achatado (`Facts`) — derivado do payload do evento pelo adaptador
 * da categoria (ver `engine.ts`). O avaliador é puro, determinístico e
 * serializável (só strings/números/booleans).
 *
 * Adicionar uma condição nova = adicionar cláusulas em uma definição. Nunca
 * código. Se um campo novo for necessário, basta o adaptador da categoria
 * publicá-lo no `Facts`.
 */

/** Valor primitivo que uma cláusula compara (JSON-safe). */
export type FilterValue = string | number | boolean;

/**
 * Objeto de fatos ACHATADO de um evento (chave → valor primitivo). Ex.:
 * `{ "victim.family": "undead", "hitFromBehind": true, "castDistance": 5 }`.
 * O adaptador de cada categoria projeta o payload do evento neste formato.
 * Campos ausentes contam como `undefined` (cláusulas sobre eles falham, exceto
 * `exists:false`).
 */
export type Facts = Record<string, FilterValue | null | undefined>;

/** Operadores suportados. Composáveis e suficientes para as fichas do design. */
export type FilterOp =
  | "==" // igualdade estrita
  | "!=" // diferença
  | "<"
  | "<="
  | ">"
  | ">="
  | "in" // valor do campo ∈ lista (value é string com itens separados por "|")
  | "exists"; // campo presente/ausente (value boolean: true = precisa existir)

/**
 * Uma cláusula de filtro. `field` é a chave no `Facts`; `op` o operador; `value`
 * o operando. AND implícito quando há várias cláusulas numa definição.
 */
export interface FilterClause {
  field: string;
  op: FilterOp;
  value: FilterValue;
}

/** Uma condição completa = lista de cláusulas com AND implícito (vazia = sempre passa). */
export type Filter = FilterClause[];

/** Avalia uma única cláusula contra os fatos. */
function evalClause(clause: FilterClause, facts: Facts): boolean {
  const actual = facts[clause.field];

  // `exists` é o único operador que aceita ausência como informação.
  if (clause.op === "exists") {
    const present = actual !== undefined && actual !== null;
    return present === (clause.value === true);
  }

  // Demais operadores: campo ausente nunca casa.
  if (actual === undefined || actual === null) return false;

  switch (clause.op) {
    case "==":
      return actual === clause.value;
    case "!=":
      return actual !== clause.value;
    case "<":
      return typeof actual === "number" && typeof clause.value === "number" && actual < clause.value;
    case "<=":
      return typeof actual === "number" && typeof clause.value === "number" && actual <= clause.value;
    case ">":
      return typeof actual === "number" && typeof clause.value === "number" && actual > clause.value;
    case ">=":
      return typeof actual === "number" && typeof clause.value === "number" && actual >= clause.value;
    case "in": {
      // value é "a|b|c" → membership. Compara como string (chaves de dados).
      const set = String(clause.value).split("|");
      return set.includes(String(actual));
    }
    default:
      return false;
  }
}

/**
 * `true` se TODAS as cláusulas passam (AND implícito). Filtro vazio = sempre
 * passa (útil para contadores incondicionais, ex.: "qualquer kill").
 */
export function matchesFilter(filter: Filter, facts: Facts): boolean {
  for (const clause of filter) {
    if (!evalClause(clause, facts)) return false;
  }
  return true;
}
