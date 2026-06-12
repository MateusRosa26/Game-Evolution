import type { Filter } from "./filters";
import type { SimEventName } from "../events";
import type { DamageType } from "../../shared/types";

/**
 * EFFECTSPEC — o EFEITO MECÂNICO de uma recompensa, como DADO declarativo que a
 * sim despacha (catálogo `2026-06-11-catalogo-emergente-lote1-engine.md` §3). 9
 * primitivos colhidos do Lote 1; lotes futuros reusam estes (viram só dado).
 * `when?` é um `Filter` sobre os fatos do hook — mesma engine declarativa dos
 * gatilhos (P1-P6). Determinístico/serializável.
 */
export type EffectSpec =
  /** P1 — multiplica o dano de saída quando `when` casa (×dano vs família, HP baixo…). */
  | { kind: "damageMult"; mult: number; when?: Filter }
  /** B5 — multiplica o dano RECEBIDO (efeito do ALVO; ex: Sombra Sem Nome mitiga a
   *  abertura com `when:[firstHitReceivedOfCombat==true]`). 1º efeito de ENTRADA. */
  | { kind: "incomingMult"; mult: number; when?: Filter }
  /**
   * P2 — ao matar: ação escalada por um FATO do kill. `shape` (B1): `cross` = 4
   * ortogonais (N-S-E-W) da vítima; `lateral` = os 2 tiles perpendiculares ao vetor
   * algoz→vítima (cleave que atravessa). `damageType` ausente = tipo do golpe fatal.
   */
  | { kind: "onKill"; action: "areaDamage"; scaleField: string; scale: number; shape: "lateral" | "cross"; damageType?: DamageType; when?: Filter }
  /** B6 — ao matar (golpe final), devolve `amount` de mana à fonte. `when` filtra o
   *  tipo de golpe (ex: só kill MÁGICO — Intocado "a magia se alimenta"). */
  | { kind: "onKill"; action: "restoreMana"; amount: number; when?: Filter }
  /** P3 — chance de o bloqueio absorver 100% do golpe (Inabalável). */
  | { kind: "blockFull"; chance: number }
  /** P4 — crítico condicional (×mult) quando `when` casa (ex: 1º golpe do combate). */
  | { kind: "crit"; mult: number; when?: Filter }
  /** P5 — altera regen de um recurso, condicional (ex: mana em combate). */
  | { kind: "regen"; resource: "mana" | "hp"; mult: number; when?: Filter }
  /** P6 — reativo: dano `onDamageType` em alvo com `ifTargetStatus` → burst + consome status. */
  | { kind: "statusCombo"; ifTargetStatus: string; onDamageType: string; burst: number; consumes: string[] }
  /** P7 — Mutação: a skill base resolve com a def MUTADA (reusa o executor de skill). */
  | { kind: "skillSwap"; mutatedSkillId: string }
  /** P8 — destrava skills no desbloqueio (classe escondida). */
  | { kind: "grantSkills"; skills: string[] }
  /** P9 — reescreve um derivado (ex: dano desarmado do Monge escala com nível). */
  | { kind: "derivedMod"; stat: string; params?: Record<string, number> };

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
 * REDUTOR DECLARATIVO — generaliza o contador. `count` ("conte ocorrências") é só
 * um caso de "reduza eventos casados num número" (spec 2026-06-11-spec-sensores-
 * tracking.md §0). Ausente = `{ kind: "count" }` (comportamento legado).
 *
 *  - `count`    → +1 por evento que casa o filtro (legado).
 *  - `distinct` → cardinalidade do CONJUNTO de valores de `field` (Naturalista:
 *                 "matou N famílias distintas"). Estado: Set serializado (array).
 *  - `sum`      → soma de `field` (totais: cura acumulada, dano absorvido).
 *  - `max`      → máximo de `field` (recordes: maior overkill).
 *
 * O `threshold` da definição compara o VALOR REDUZIDO (count / set.size / soma / max).
 */
export type Accumulator =
  | { kind: "count" }
  | { kind: "distinct"; field: string }
  | { kind: "sum"; field: string }
  | { kind: "max"; field: string };

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
  /** Parâmetros livres (LEGADO — substituído por `spec`; mantido p/ defs antigas). */
  payload: Record<string, number | string>;
  /**
   * EFEITO MECÂNICO declarativo (a sim aplica). Ausente = efeito ainda só
   * descritivo (não altera combate). UM ou VÁRIOS primitivos (ex: Senhor dos
   * Extremos = 2 statusCombo direcionais; Monge = grantSkills + derivedMod).
   */
  spec?: EffectSpec | EffectSpec[];
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
  /** Valor reduzido necessário para desbloquear (count/set.size/soma/max). ✏️ reais são do criador. */
  threshold: number;
  /**
   * Como o evento casado é reduzido num número (ver `Accumulator`). Ausente =
   * `count` (legado). Mark vive no ledger; Path no estado do personagem.
   */
  accumulator?: Accumulator;
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
 * MUTAÇÃO (skill). Várias mutações competem POR SKILL. **Modelo CONTADOR ABSOLUTO
 * POR PERFIL** (DESIGN-EVOLUCAO.md §2, decidido jun/2026 — substitui o antigo
 * `minShare`/share): cada mutação tem sua PRÓPRIA meta (`threshold`); só casts que
 * casam o `filter` dela contam pra ela; o 1º perfil a cruzar a própria meta
 * RESOLVE a skill (a mutação substitui a base, encerrando a corrida). Generalista
 * que espalha o uso e nunca concentra N num perfil **nunca muta**. `skillId`
 * agrupa as concorrentes. Não é timing-trap — reflete o histórico real.
 */
export interface MutationDef extends BaseDef {
  category: "mutation";
  /** Skill cujas mutações competem (ex.: "bola_de_fogo"). */
  skillId: string;
}

/**
 * CAMINHO (personagem). Três sabores:
 * - `style`: acúmulo de eventos que casam o filtro (ex.: 15 kills com fogo).
 *   Usa o `accumulator` da BaseDef (count/distinct/sum/max) — Naturalista vive aqui.
 * - `conduct`: CONDUTA de restrição monitorada desde a criação. `breakEvent`+
 *   `breakFilter` definem o que QUEBRA a conduta (ex.: usar qualquer skill).
 *   `milestoneLevel` é o nível a atingir com a conduta INTACTA para desbloquear.
 *   Quebrou = perdida PARA SEMPRE naquele personagem (proposta do design).
 * - `ratio`: GATE DE PROPORÇÃO sobre janela (resolve *Senhor dos Extremos*: "≥95%
 *   do dano via fogo+gelo por 20 níveis"). Acumula dois somatórios sobre `event`
 *   (numerador = casa `numerator`; denominador = casa `denominator`, vazio = tudo)
 *   do campo `ratioField` (ausente = conta ocorrências). No `level_up` ≥
 *   `milestoneLevel`, desbloqueia se `num/den ≥ minRatio`. `resetScope:"sinceClass"`
 *   zera os somatórios na aquisição da classe (o rito chama `onClassAcquired`).
 */
export interface PathDef extends BaseDef {
  category: "path";
  /** "style" (acúmulo) · "conduct" (restrição) · "ratio" (proporção/janela). */
  flavorKind: "style" | "conduct" | "ratio";
  /** [conduct] Evento que pode QUEBRAR a conduta. */
  breakEvent?: SimEventName;
  /** [conduct] Filtro que, se casar no `breakEvent`, quebra a conduta. */
  breakFilter?: Filter;
  /** [conduct/ratio] Nível-milestone a atingir para desbloquear. */
  milestoneLevel?: number;
  /** [ratio] Filtro do NUMERADOR (eventos que entram no de cima da fração). */
  numerator?: Filter;
  /** [ratio] Filtro do DENOMINADOR (vazio/ausente = todo evento do tipo). */
  denominator?: Filter;
  /** [ratio] Campo somado em cada lado (ausente = conta ocorrências, +1). */
  ratioField?: string;
  /** [ratio] Proporção mínima `num/den` para desbloquear (ex.: 0.95). */
  minRatio?: number;
  /**
   * [ratio] PISO POR COMPONENTE (B7): cada sub-numerador precisa ALCANÇAR seu
   * próprio `minRatio` do total, ALÉM do `minRatio` geral. Ex: Senhor dos Extremos
   * = `numerator` fogo|gelo ≥0.95 E cada `{fire≥0.3, ice≥0.3}` — impede "94% fogo /
   * 1% gelo" passar como mestre dos DOIS. Ordem casa com `subNum[]` no estado.
   */
  subNumerators?: { filter: Filter; minRatio: number }[];
  /** [ratio] Quando zerar os somatórios. Ausente = nunca (vida toda do personagem). */
  resetScope?: "sinceClass";
}

/** União das três definições. */
export type TrackingDef = MarkDef | MutationDef | PathDef;
