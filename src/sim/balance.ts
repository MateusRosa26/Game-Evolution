import type { PlayerClass } from "../shared/types";

/**
 * Constantes de balance do combate (M1).
 *
 * TODOS os números aqui são PLACEHOLDER — agrupados num único lugar para
 * tunar sem caçar magic numbers pela sim. Princípio de design: mobs são
 * fortes (até T1 pune descuido), então o jogador morre se for descuidado.
 *
 * NOTA (Wave Stats/XP): HP máx, mana e dano/cooldown do jogador NÃO vivem mais
 * aqui — derivam de `formulas.ts` a partir de atributos/classe/nível.
 *
 * NOTA (Wave Itens): o dano-base/cooldown/ID da arma inicial saíram daqui — agora
 * vivem nos TEMPLATES de item (`src/sim/items/templates.ts`). O jogador equipa
 * uma INSTÂNCIA da arma da classe; o auto-attack lê o template dela. Os antigos
 * `STARTER_WEAPON_DAMAGE`/`STARTER_WEAPON_ID` foram removidos (substituídos pelos
 * templates `espada_curta`/`adaga`/… e o template `fists` dos punhos).
 */

/** Player */
/** Classe padrão de um novo jogador: nasce CLASSLESS (escolhe a classe no rito). */
export const DEFAULT_PLAYER_CLASS: PlayerClass = "classless";

/** Rito de classe */
/**
 * Custo em ouro do rito de classe (sink — escolher a classe é um marco). Sem
 * requisito de nível (criador): qualquer nível, paga gold + quest. ✏️ Balancista
 * calibra vs gold/h da caça T1 (deve custar uma sessão real, não trivial).
 */
export const RITO_COST_GOLD = 150;
/**
 * Quest que destrava o rito de cada classe (gate quest+gold). `null` = ainda sem
 * trilha de rito implementada → só o gold gateia (plumbing pronto). ✏️ wirar os 4
 * ritos do QUESTS.md (giver = treinador da classe) quando a trilha for desenhada.
 */
export const RITO_QUEST_BY_CLASS: Record<PlayerClass, string | null> = {
  knight: null,
  mage: null,
  rogue: null,
  priest: null,
  classless: null, // n/a — classless não tem rito de "virar classless"
};

/** Morte */
/**
 * Penalidade de XP por morte do jogador: fração do XP TOTAL acumulado perdida ao
 * morrer (macro do MVP — "morte dói", modelo Tibia). Aplicada em `progression.ts`
 * via `applyDeathPenalty`; level-down é permitido (o teto de recursos pode descer).
 * ✏️ calibrar — knob visceral: define o quanto a morte machuca a progressão.
 */
export const DEATH_XP_PENALTY = 0.1;

/** Combate geral */
/** Alcance melee em tiles (Chebyshev: adjacente incl. diagonal = 1). */
export const MELEE_RANGE = 1;

/**
 * Alcances das armas À DISTÂNCIA, em tiles (Chebyshev). Decidido (criador,
 * jun/2026): a **wand É ranged, mas alcança MENOS que o arco** — o caster
 * cutuca e kita de perto; o arqueiro DOMINA a distância longa (e paga em
 * munição/gold, não mana). Mantém os dois nichos separados.
 *
 * REGRA TRAVADA: `WAND_RANGE < BOW_RANGE`. O arco ainda não foi numerado na sim
 * (EQUIPAMENTO.md "✏️ numerar com projétil"); quando entrar, seu alcance DEVE
 * ficar acima de `WAND_RANGE` (alvo recomendado 5). ⚠️ Sem checagem de linha de
 * visão ainda — alcance é Chebyshev puro; LoS/projétil é wave futura.
 */
export const WAND_RANGE = 3; // cajado/cetro
export const BOW_RANGE = 5; // ✏️ arco/besta (quando numerar o projétil) — DEVE ser > WAND_RANGE
/** Ticks que um corpo (overlay visual) permanece antes de sumir. 0 = sem corpo. */
export const CORPSE_TICKS = 0;
