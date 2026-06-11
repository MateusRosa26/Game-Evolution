import type { Filter } from "./filters";
import type { SimEventName } from "../events";

/**
 * MODELO DE DEFINIÇÃO DECLARATIVA — Marcas / Mutações / Caminhos como DADOS
 * (DESIGN-EVOLUCAO.md §"Implicações técnicas": "Adicionar conteúdo novo =
 * adicionar definição, não lógica"). Toda a engine (`engine.ts`) opera SOBRE
 * estes tipos, sem nada hard-coded por conteúdo.
 *
 * Determinístico e serializável (só strings/números/filtros declarativos).
 */

/**
 * Categoria da recompensa (taxonomia do design):
 * - `mark`     → Marca: vive na INSTÂNCIA do item (ledger). Progresso pertence ao objeto.
 * - `mutation` → Mutação: vive por (personagem, skillId). PERFIL de uso decide qual nasce.
 * - `path`     → Caminho: vive no personagem. Estilo (acúmulo) ou conduta (restrição).
 */
export type TrackingCategory = "mark" | "mutation" | "path";

/**
 * Efeito da recompensa — POR ORA SÓ DESCRITIVO. A aplicação MECÂNICA dos efeitos
 * é uma WAVE FUTURA de conteúdo (✏️ do criador): a engine só registra o desbloqueio
 * e dispara o evento de protocolo com o nome/flavor. O `payload` é livre
 * (`Record<string, number|string>`) para o criador anotar parâmetros do efeito
 * (ex.: `{ damageVsFamily: "undead", bonusPct: 10 }`) sem a engine interpretá-los.
 *
 * DOCUMENTADO: nada na engine LÊ `payload` para alterar combate — é metadado.
 */
export interface TrackingEffect {
  /** Descrição humana do efeito (pt-BR), para docs/UI futura. */
  description: string;
  /** Parâmetros livres do efeito (interpretados pela wave de conteúdo, não aqui). */
  payload: Record<string, number | string>;
}

/**
 * Textos do reveal (DESIGN-EVOLUCAO.md §"Visibilidade"). O hint é vago e
 * atmosférico (disparado UMA vez aos ~50%); o unlock é o nome + flavor forte.
 * NUNCA contêm números de progresso.
 */
export interface TrackingFlavor {
  /** Dica vaga aos ~50% (ex.: "sua espada vibra quando há mortos-vivos por perto"). */
  hint: string;
  /** Flavor do desbloqueio (ex.: "As ossadas se lembram do seu nome."). */
  unlock: string;
}

/**
 * Definição base comum às três categorias. `event` é o tipo de evento da sim
 * observado; `filter` são as cláusulas declarativas sobre o payload (AND
 * implícito) que qualificam o evento; `threshold` é o nº de ocorrências válidas
 * para desbloquear.
 */
interface BaseDef {
  /** ID estável (chave de dados e de estado de progresso). */
  id: string;
  /** Nome próprio da Marca/Mutação/Caminho (pt-BR) — É a recompensa social. */
  name: string;
  /** Evento da sim observado (kill/skill_use/damage/block/level_up). */
  event: SimEventName;
  /** Filtro declarativo sobre o payload do evento (vazio = todo evento conta). */
  filter: Filter;
  /** Nº de ocorrências válidas para desbloquear (✏️ thresholds reais são do criador). */
  threshold: number;
  flavor: TrackingFlavor;
  effect: TrackingEffect;
}

/**
 * MARCA (item). Progresso vive no LEDGER da instância da arma equipada relevante
 * (a história pertence ao objeto — viaja no trade). A engine deriva o progresso
 * de um CONTADOR PRÓPRIO mantido NO ledger da instância (ver `engine.ts` e
 * decisão documentada no relatório), garantindo que o reveal acompanhe o item.
 */
export interface MarkDef extends BaseDef {
  category: "mark";
}

/**
 * MUTAÇÃO (skill). Várias mutações competem POR SKILL: ao cruzar o threshold de
 * usos válidos, VENCE a mutação cujo PERFIL dominou (≥ `minShare` dos usos
 * válidos). `skillId` agrupa as mutações concorrentes; `filter` qualifica o uso
 * como "do perfil desta mutação". O contador-mãe (total de usos válidos da skill)
 * é o denominador do share.
 */
export interface MutationDef extends BaseDef {
  category: "mutation";
  /** Skill cujas mutações competem (ex.: "bola_de_fogo"). */
  skillId: string;
  /**
   * Fração mínima dos usos válidos que precisam casar este perfil para esta
   * mutação vencer (ex.: 0.5 = maioria). DESIGN-EVOLUCAO.md §2 "o perfil de uso
   * decide qual mutação nasce".
   */
  minShare: number;
}

/**
 * CAMINHO (personagem). Dois sabores:
 * - `style`: acúmulo de eventos que casam o filtro (ex.: 15 kills com fogo).
 * - `conduct`: CONDUTA de restrição monitorada desde a criação. `breakEvent`+
 *   `breakFilter` definem o que QUEBRA a conduta (ex.: usar qualquer skill).
 *   `milestoneLevel` é o nível a atingir com a conduta INTACTA para desbloquear.
 *   Quebrou = perdida PARA SEMPRE naquele personagem (proposta do design).
 */
export interface PathDef extends BaseDef {
  category: "path";
  /** "style" (acúmulo) ou "conduct" (restrição mantida). */
  flavorKind: "style" | "conduct";
  /** [conduct] Evento que pode QUEBRAR a conduta. */
  breakEvent?: SimEventName;
  /** [conduct] Filtro que, se casar no `breakEvent`, quebra a conduta. */
  breakFilter?: Filter;
  /** [conduct] Nível-milestone a atingir com a conduta intacta para desbloquear. */
  milestoneLevel?: number;
}

/** União das três definições. */
export type TrackingDef = MarkDef | MutationDef | PathDef;
