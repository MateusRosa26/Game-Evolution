import type { PlayerClass, Attributes } from "../shared/types";

/**
 * Fórmulas derivadas da progressão — CAMADA SÓLIDA (DESIGN-EVOLUCAO.md §"Stats").
 *
 * REGRA: este é o ÚNICO lugar onde vivem números derivados de atributos/nível.
 * Nenhum derivado (HP máx, dano, regen, esquiva, curva de XP...) pode ser
 * calculado fora daqui — a sim e as waves futuras (skills, combate) consomem
 * estas funções PURAS. Tudo é determinístico (sem RNG, sem estado).
 *
 * Todos os números marcados `// ✏️ placeholder — calibrar no M2` são chutes
 * iniciais. O design pede curva íngreme e mobs fortes; calibrar com combate
 * real depois. As ASSINATURAS, porém, já são as definitivas: as skills da
 * próxima wave chamarão `magicDamage(attrs, base)`, `healPower(attrs, base)`,
 * etc. — então mexa nos números à vontade, mas evite mudar as formas.
 */

// ─────────────────────────────────────────────────────────────────────────
//  Crescimento automático por classe (DADOS, não código)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Ganho automático por nível, por classe. Some-se isto ao derivado-base a cada
 * level up (além dos pontos livres que o jogador distribui). Knight ganha mais
 * HP, Mage mais mana, etc. (DESIGN-EVOLUCAO.md §Classes).
 */
export interface ClassGrowth {
  /** HP máx adicionado por nível. */
  hpPerLevel: number;
  /** Mana máx adicionada por nível. */
  manaPerLevel: number;
  /**
   * Capacidade de carga (cap) adicionada por nível — AUTOMÁTICA por classe
   * (modelo Tibia: knight > rogue > priest > mage; o cap cresce sozinho com o
   * nível, sem o jogador escolher). Força dá um BÔNUS por cima (ver maxCarry).
   */
  capPerLevel: number;
  /**
   * Regen de HP/s adicionado por nível (saciado) — AUTOMÁTICO por classe.
   * DESACOPLADO da Vitalidade DE PROPÓSITO (decidido criador, jun/2026): Vit já
   * compra o POOL (maxHp); deixá-la comprar também a VELOCIDADE de encher seria
   * double-dip (stat dominante, teste de Sirlin). Vit = tamanho do tanque;
   * nível+classe = velocidade de encher. É a régua do invariante de regen:
   * cresce com o nível p/ out-healar conteúdo VELHO, nunca o do nível atual.
   */
  hpRegenPerLevel: number;
  /** Regen de mana/s por nível (saciado) — idem, desacoplado do Espírito. */
  manaRegenPerLevel: number;
}

/** Crescimento por classe. ✏️ placeholder — calibrar no M2. */
export const CLASS_GROWTH: Record<PlayerClass, ClassGrowth> = {
  // hpRegenPerLevel do KNIGHT = CALIBRADO em 2 âncoras (bateria 2026-06-10): 0.10
  // segura a razão "regen saciado (carne) ≈ 68% do DPS no nível-alvo" nos DOIS
  // tiers que existem (rato T1@lvl1 69%, esqueleto T2@lvl8 68%) — invariante OK
  // (nunca out-heala no nível; crossover rato lvl11, esqueleto lvl21). As OUTRAS
  // classes derivam por analogia da razão de hpPerLevel (knight>rogue>priest>mage),
  // ✏️ ainda não medidas. manaRegenPerLevel = ✏️ placeholder (sem âncora de dreno
  // de mana ainda). T3–T5 confirmam a curva na bateria #11 quando o bestiário crescer.
  // MATRIZ DE CLASSES (decidido criador jun/2026): sustain (Knight/Priest) durável,
  // damage (Rogue/Mage) frágil. hpPerLevel reflete a durabilidade: Knight(AD sustain)
  // > Priest(AP sustain) > Rogue(AD dmg) > Mage(AP dmg). Antes rogue(9)>priest(7) estava
  // INVERTIDO (carry mais durável que sustain). ✏️ Balancista afina os números.
  knight: { hpPerLevel: 15, manaPerLevel: 2, capPerLevel: 25, hpRegenPerLevel: 0.10, manaRegenPerLevel: 0.02 },
  // manaRegenPerLevel: Priest (AP SUSTAIN) > Mage (AP DAMAGE/burst) — endurance de
  // mana é a identidade do sustain; o dano do mage vem do BURST (pool+base), não do
  // regen sustentado. (Afeta níveis altos; L1 usa a base compartilhada.) ✏️ Balancista.
  mage: { hpPerLevel: 5, manaPerLevel: 12, capPerLevel: 10, hpRegenPerLevel: 0.04, manaRegenPerLevel: 0.06 },
  rogue: { hpPerLevel: 7, manaPerLevel: 5, capPerLevel: 18, hpRegenPerLevel: 0.07, manaRegenPerLevel: 0.04 },
  priest: { hpPerLevel: 12, manaPerLevel: 10, capPerLevel: 12, hpRegenPerLevel: 0.06, manaRegenPerLevel: 0.10 },
};

/** Atributos iniciais por classe (nível 1). ✏️ placeholder — calibrar no M2. */
export const CLASS_BASE_ATTRIBUTES: Record<PlayerClass, Attributes> = {
  // ✏️ placeholder — calibrar no M2. Cada classe favorece seu atributo-chave.
  knight: { strength: 11, dexterity: 5, intelligence: 4, vitality: 8, spirit: 5 },
  mage: { strength: 4, dexterity: 5, intelligence: 8, vitality: 5, spirit: 6 },
  rogue: { strength: 5, dexterity: 8, intelligence: 5, vitality: 6, spirit: 4 },
  priest: { strength: 4, dexterity: 5, intelligence: 6, vitality: 5, spirit: 8 },
};

/**
 * Pontos de atributo livres concedidos por level up.
 * CALIBRADO E CONFIRMADO (criador, bateria M1.3 2026-06-05): 4 pts com custo RO
 * puro (faixa 10) = zero levels sem subida de stat no jogo normal até o lvl 25
 * (sensação de progresso), e o all-in continua estéril (one-shot do auto só
 * chega quando o rato já não paga XP). 5 pts reabriria o breakpoint aos 76min.
 */
export const STAT_POINTS_PER_LEVEL = 4;

// ─────────────────────────────────────────────────────────────────────────
//  Custo de ponto de atributo (crescente por faixa — estilo Ragnarok Online)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Knobs do custo por faixa (DESIGN-EVOLUCAO.md §Stats: "Custo crescente
 * (decidido — estilo Ragnarok Online): subir um atributo já alto custa mais
 * pontos, por faixa"). Objeto mutável de calibração — o harness do Balancista
 * testa variantes mutando-o (mesmo padrão de CLASS_GROWTH).
 * CALIBRADO E CONFIRMADO (criador, bateria M1.2 2026-06-05): RO puro —
 * valores 1–10 custam 2, 11–20 custam 3, 21–30 custam 4...
 */
export const STAT_COST = {
  /** Largura da faixa: a cada `bandSize` valores, o custo sobe +1. */
  bandSize: 10,
  /** Custo na primeira faixa (valores 1..bandSize). */
  baseCost: 2,
};

/**
 * Custo em PONTOS LIVRES para subir um atributo do valor `current` para
 * `current + 1`. Família RO: `floor((current − 1)/bandSize) + baseCost` —
 * valores 1–10 custam `baseCost`, 11–20 custam +1, e assim por diante.
 * O EFEITO do ponto nunca muda (+X é sempre +X); só o custo sobe — build
 * extrema é possível, só cara (anti-degeneração do all-in, bateria M1).
 */
export function statPointCost(current: number): number {
  return Math.floor((current - 1) / STAT_COST.bandSize) + STAT_COST.baseCost;
}

// ─────────────────────────────────────────────────────────────────────────
//  Recursos — HP e Mana máximos
// ─────────────────────────────────────────────────────────────────────────

/** Constantes base dos recursos. ✏️ placeholder — calibrar no M2. */
const BASE_HP = 50; // ✏️ placeholder — calibrar no M2
const HP_PER_VITALITY = 8; // ✏️ placeholder — calibrar no M2
const BASE_MANA = 10; // ✏️ placeholder — calibrar no M2
const MANA_PER_INTELLIGENCE = 6; // ✏️ placeholder — calibrar no M2

/**
 * HP máximo: base + Vitalidade + crescimento acumulado de classe por nível.
 * O termo de nível é `CLASS_GROWTH[cls].hpPerLevel * (level - 1)`.
 */
export function maxHp(attrs: Attributes, cls: PlayerClass, level: number): number {
  const growth = CLASS_GROWTH[cls].hpPerLevel * (level - 1);
  return Math.floor(BASE_HP + attrs.vitality * HP_PER_VITALITY + growth);
}

/**
 * Mana máxima: base + Inteligência + crescimento acumulado de classe por nível.
 */
export function maxMana(attrs: Attributes, cls: PlayerClass, level: number): number {
  const growth = CLASS_GROWTH[cls].manaPerLevel * (level - 1);
  return Math.floor(BASE_MANA + attrs.intelligence * MANA_PER_INTELLIGENCE + growth);
}

// ─────────────────────────────────────────────────────────────────────────
//  Capacidade de carga (cap) — DESIGN-EVOLUCAO.md (Força → capacidade de carga)
// ─────────────────────────────────────────────────────────────────────────

// Cap = base + crescimento AUTOMÁTICO por classe/nível (motor, estilo Tibia) +
// bônus de Força (perk, não imposto). MESMO padrão do HP/mana (atributo +
// CLASS_GROWTH por nível) — decidido jun/2026 após notar que amarrar cap só à
// Força (stat de ESCOLHA) não dava o crescimento-por-nível automático do Tibia.
// Escala-Tibia (pesos: espada 35, placa ~120). ✏️ números Balancista.
const BASE_CARRY = 200; // ✏️ base de nível 1
const CARRY_PER_STRENGTH = 5; // ✏️ bônus pequeno de Força (não é o motor)

/**
 * Capacidade de carga máxima (cap). Híbrido: `base + Força×k +
 * capPerLevel[classe]×(nível−1)`. A classe/nível é o motor automático (Tibia:
 * knight > rogue > priest > mage); a Força investida dá um bônus por cima —
 * exatamente como Vitalidade soma HP além do crescimento de classe.
 */
export function maxCarry(attrs: Attributes, cls: PlayerClass, level: number): number {
  const classGrowth = CLASS_GROWTH[cls].capPerLevel * (level - 1);
  return Math.floor(BASE_CARRY + attrs.strength * CARRY_PER_STRENGTH + classGrowth);
}

// ─────────────────────────────────────────────────────────────────────────
//  Dano
// ─────────────────────────────────────────────────────────────────────────

/**
 * MODELO DE DANO FÍSICO — HÍBRIDO quadrático-suave (decidido criador jun/2026):
 * `dano = base_da_arma × (1 + atributo×k)`. A arma é o PISO aditivo (loot importa:
 * achar arma melhor escala tudo); o atributo AMPLIFICA (sinergia gear×stat, feel
 * Tibia). `k` é PEQUENO de propósito — o crescimento (base sobe por tier × atributo
 * sobe por nível) é quadrático SUAVE, não explode (≠ `arma×Str` puro). As BASES das
 * armas foram re-escaladas (×~1,67) na migração p/ preservar o dano T1 (knight/
 * espada = 14, rato em 2 golpes — zero ripple na calibração M1). ✏️ Balancista
 * afina k + bases + curva de HP dos mobs por tier.
 */
const STR_DAMAGE_K = 0.05; // Força: +5% do dano-base da arma por ponto
const DEX_DAMAGE_K = 0.05; // Destreza (adagas): mesma régua; identidade = cadência
// Caster: MESMO modelo híbrido, mas k MENOR (decidido criador jun/2026). Magia tem
// base ALTA (> arma) e multiplicador BAIXO → dano front-loaded e estável (o poder
// do mago vem das MAGIAS, não de empilhar Int); martial é base-baixa-mult-alto
// (cresce com investimento). Equilibra com o alcance/AoE/status do caster. ✏️ Balancista.
const INT_DAMAGE_K = 0.05; // SIMÉTRICO ao martial (decisão criador): gap estável,
const SPIRIT_DAMAGE_K = 0.05; // a vantagem do caster vem da BASE, não do k (não inverte)
const SPIRIT_HEAL_FACTOR = 1.3; // ✏️ CURA segue ADITIVA (não é dano) — calibrar M2

/**
 * Dano físico de uma arma (modelo híbrido — ver acima). Adagas escalam com
 * Destreza; demais armas melee com Força. `usesDexterity` vem da arma equipada.
 */
export function physicalDamage(
  attrs: Attributes,
  weaponBase: number,
  usesDexterity = false,
): number {
  const attr = usesDexterity ? attrs.dexterity : attrs.strength;
  const k = usesDexterity ? DEX_DAMAGE_K : STR_DAMAGE_K;
  return Math.floor(weaponBase * (1 + attr * k));
}

/**
 * Variância do dano FÍSICO (AD): diferença gigante AD×AP (decidido criador jun/2026,
 * estilo Tibia/Apogea) — físico ROLA um range largo (swingy), mágico é CONSTANTE.
 * `physicalDamage` dá a MÉDIA; isto rola em [méd×(1−spread), méd×(1+spread)] com
 * `roll`∈[0,1) do RNG seedado da sim. Média preservada → o balance (DPS médio)
 * calibrado se mantém; muda só o feel (AD imprevisível, AP confiável). ✏️ spread.
 */
export const PHYSICAL_DAMAGE_SPREAD = 0.4; // ±40% — AD bem swingy
export function physicalVariance(avg: number, roll: number): number {
  const f = 1 - PHYSICAL_DAMAGE_SPREAD + roll * 2 * PHYSICAL_DAMAGE_SPREAD;
  return Math.max(1, Math.floor(avg * f));
}

/**
 * Mitigação de ARMADURA — redução SORTEADA `0..Def` (estilo Tibia/Apogea), não
 * subtração fixa. `roll`∈[0,1) do RNG seedado. Decidido (criador, jun/2026):
 * flat Def fixo criava penhasco "piso 1 vs cheio" (knight blindado intocável p/
 * mob de tier baixo; disparidade mage×knight binária). O sorteio vira amortecedor
 * MACIO — às vezes o golpe passa quase cheio (roll→0) — e a média (~Def/2) mantém
 * a armadura pequena perto do dano. Régua de tier (decidida): a Def somável de um
 * tier fica SEMPRE abaixo do dano do mob do mesmo tier (nunca trivializa on-level).
 */
export function armorMitigation(def: number, roll: number): number {
  return Math.round(def * roll);
}

/**
 * Dano mágico de uma skill. `spellBase` é o dano-base da magia (vem do design da
 * skill na próxima wave). Escala com Inteligência.
 */
export function magicDamage(attrs: Attributes, spellBase: number): number {
  // Híbrido (igual ao físico, k menor): base × (1 + Int×k). Base alta, mult baixo.
  return Math.floor(spellBase * (1 + attrs.intelligence * INT_DAMAGE_K));
}

/**
 * Dano de uma skill SAGRADA (holy ofensiva — Luz Sagrada, Consagrar…). Escala
 * com **Espírito**, não Inteligência (decidido 09/jun/2026 — resolve o conflito
 * do doc a favor do de-classing: o sagrado é gate por Esp+nível e o Priest é o
 * melhor conjurador sagrado porque seu corpo automático bomba Espírito).
 * Espelha `magicDamage`, trocando o atributo. Cura segue em `healPower`.
 */
export function holyDamage(attrs: Attributes, spellBase: number): number {
  // Híbrido caster (k menor), escalando Espírito em vez de Inteligência.
  return Math.floor(spellBase * (1 + attrs.spirit * SPIRIT_DAMAGE_K));
}

/**
 * Dano do auto-attack de arma MÁGICA (wand/cetro). NÃO escala com nenhum
 * atributo: o dano vem da PRÓPRIA arma, numa faixa fixa `[min, max]` (decidido
 * 09/jun/2026, modelo Tibia — a progressão do tiro básico do caster vem de
 * comprar wands melhores, como o guerreiro troca de arma). `roll` ∈ [0,1) vem
 * do RNG seedado da Simulation (mantém esta função pura). Custo de mana por
 * tiro mora em `WeaponStats.manaCost` (aplicado na Simulation, não aqui).
 */
export function wandDamage(min: number, max: number, roll: number): number {
  return min + Math.floor(roll * (max - min + 1));
}

/**
 * Poder de cura de uma skill. `healBase` é a cura-base (do design da skill).
 * Escala com Espírito.
 */
export function healPower(attrs: Attributes, healBase: number): number {
  return Math.floor(healBase + attrs.spirit * SPIRIT_HEAL_FACTOR); // ✏️ placeholder — calibrar no M2
}

// ─────────────────────────────────────────────────────────────────────────
//  Velocidade de ataque e esquiva
// ─────────────────────────────────────────────────────────────────────────

/** Cooldown base de auto-attack (ms) e redução por Destreza. ✏️ placeholder. */
const BASE_ATTACK_COOLDOWN_MS = 2000; // ✏️ placeholder — calibrar no M2
const ATTACK_COOLDOWN_PER_DEXTERITY_MS = 25; // ✏️ placeholder — calibrar no M2
const MIN_ATTACK_COOLDOWN_MS = 800; // ✏️ placeholder — piso anti-degeneração

/**
 * Cooldown de ataque (ms): Destreza reduz, com piso. Quanto menor, mais rápido.
 * `weaponBaseCooldown` permite que a arma equipada (wave futura) defina sua
 * própria base; default usa o placeholder global.
 */
export function attackCooldownMs(
  attrs: Attributes,
  weaponBaseCooldown: number = BASE_ATTACK_COOLDOWN_MS,
): number {
  const reduced = weaponBaseCooldown - attrs.dexterity * ATTACK_COOLDOWN_PER_DEXTERITY_MS;
  return Math.max(MIN_ATTACK_COOLDOWN_MS, Math.round(reduced));
}

/** Esquiva. ✏️ placeholder — calibrar no M2. */
const DODGE_PER_DEXTERITY = 0.005; // ✏️ placeholder — 0.5% por ponto de Destreza
const MAX_DODGE = 0.5; // ✏️ placeholder — teto de 50% (anti-degeneração)

/**
 * Chance de esquiva (0..1): escala com Destreza, com teto. Quem consome decide
 * se rola contra o RNG seedado (a sim, nunca aqui — esta função é pura).
 */
export function dodgeChance(attrs: Attributes): number {
  return Math.min(MAX_DODGE, attrs.dexterity * DODGE_PER_DEXTERITY);
}

// ─────────────────────────────────────────────────────────────────────────
//  Regeneração (por SEGUNDO — independente da taxa de tick)
// ─────────────────────────────────────────────────────────────────────────

// Regen por segundo — taxa ENQUANTO SACIADO (modelo Tibia: sem comida o regen é
// 0; ver `wellFedRegenMult`). Cresce com o NÍVEL (não com atributo) — invariante:
// fica abaixo do DPS do mob do nível-alvo, mas supera o de mobs out-levelados.
// L1 base ≈ 2/s (< DPS rato 4,4 → não out-heala no mesmo nível). ✏️ recalibrar #11.
const HP_REGEN_BASE_PER_SEC = 2.0; // ✏️ taxa-base saciado L1 (compartilhada)
// Mana saciado L1 = 6/s (bateria economia-mana 2026-06-11): a 1/s o caster secava
// em 3s e o sustentado virava metade do martial. A 6/s o mage (carry) sustenta
// ~16 DPS (≈rogue) e o priest (sustain) ~11 (≈knight). Demanda da Bola ~9,3/s >
// regen → ainda há ciclo burst→recupera (mana = downtime do caster, espelho do HP
// do tank), mas recuperável. ✏️ fino na bateria de throughput completa.
const MANA_REGEN_BASE_PER_SEC = 3.0;
// Espírito = REGEN de mana (Int = pool). Atributos diferentes p/ pool vs regen =
// sem double-dip. Calibrado p/ caster base (Esp 6) cair nos ~6/s da bateria de
// economia-mana; investir Esp é a alavanca de sustain (Esp inútil deixa de existir
// pro mago). Mage Esp6=6/s, Priest Esp8=7/s (sustain). ✏️ fino na throughput #11.
const MANA_REGEN_PER_SPIRIT = 0.5;

/**
 * Intervalo do regen (modelo Tibia/Apogea, decidido criador 2026-06-10): o regen
 * não é contínuo — aplica um CHUNK a cada `REGEN_INTERVAL_MS`. O chunk = taxa/seg
 * × mult da comida × (intervalo em seg). A taxa MÉDIA no tempo é preservada; o
 * feel vira "curas em pulsos" (e fights curtos podem não pegar um pulso). ✏️ 5s.
 */
export const REGEN_INTERVAL_MS = 5000;

/**
 * Regeneração de HP por SEGUNDO **enquanto saciado** (sem comida = 0). Cresce com
 * o NÍVEL por classe (`CLASS_GROWTH.hpRegenPerLevel`), DESACOPLADA da Vitalidade
 * (Vit = pool; nível/classe = velocidade de encher — anti double-dip). O
 * acumulador da entidade soma a fração por tick; `regenTick` zera tudo sem comida.
 */
export function hpRegenPerSecond(cls: PlayerClass, level: number): number {
  return HP_REGEN_BASE_PER_SEC + CLASS_GROWTH[cls].hpRegenPerLevel * (level - 1);
}

/**
 * Regeneração de mana por SEGUNDO **enquanto saciado**. Base + Espírito (alavanca
 * de sustain do caster; Int=pool, Esp=regen → sem double-dip) + crescimento por
 * nível/classe. Investir Esp acelera o regen — torna Esp útil pro mago também.
 */
export function manaRegenPerSecond(cls: PlayerClass, level: number, spirit: number): number {
  return (
    MANA_REGEN_BASE_PER_SEC +
    spirit * MANA_REGEN_PER_SPIRIT +
    CLASS_GROWTH[cls].manaRegenPerLevel * (level - 1)
  );
}

// ─────────────────────────────────────────────────────────────────────────
//  Curva de XP — LEI DE POTÊNCIA (calibrada por TEMPO, bateria 2026-06-11)
// ─────────────────────────────────────────────────────────────────────────
//
// MIGROU da cúbica do Tibia (fecha a flag ⚠️ DESIGN-EVOLUCAO L133). Achado da
// bateria: "exponencial pura" (geométrica) que o doc pedia EXPLODE num cap-25 —
// até r=1,2 joga ~17% do jogo INTEIRO no último nível sozinho. O que o split-alvo
// de horas (1→25 em ~30-45h; lvl 1-8 rápido; últimos 5 níveis ≈ 1/3 do tempo)
// realmente pede é uma LEI DE POTÊNCIA de expoente ~2,5 — mais suave que a cúbica
// (a cúbica errava no OUTRO sentido: early raso ~2% do XP, e total mal escalado
// pro alvo de horas). Método Luban: desenhar pelo tempo, ancorar no XP/h MEDIDO.
// Report: docs/reports/2026-06-11-curva-xp-exponencial.md
//
// CALIBRAÇÃO (re-pinável — XP/h muda quando a COMIDA entrar na sim, backlog #7):
//   total(n) = round( SCALE · (n−1)^EXP )
//   SCALE pina o TOTAL ao alvo de horas; EXP pina o FORMATO (early × late).
//   Âncora de XP/h: 6.597 medido (M1.2, early, 73% descanso). Com SCALE=125 o
//   1→25 cai em ~30,5h (XP/h crescente) a ~44h (XP/h plano) — bracketa 30-45h.
//   ⚠️ comida sobe o XP/h → provavelmente subir SCALE ~1,3-1,6× no re-pin.
const XP_CURVE_SCALE = 125; // K — escala (pino de TEMPO; subir = jogo mais longo)
const XP_CURVE_EXPONENT = 2.5; // p — formato (cúbica=3 = late íngreme + early raso)

/**
 * XP TOTAL acumulado necessário para ATINGIR `level` (level 1 = 0).
 * Lei de potência calibrada por tempo (ver bloco acima). total(1)=0 (pow(0,p)=0),
 * total(8)≈16,2k, total(15)≈91k, total(20)≈195k, total(25)≈353k.
 */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return Math.round(XP_CURVE_SCALE * Math.pow(n - 1, XP_CURVE_EXPONENT));
}

/**
 * XP necessária para ir do `level` atual ao próximo (delta, não acumulado).
 * Útil para o snapshot/HUD (barra de progresso do nível).
 */
export function xpToNextLevel(level: number): number {
  return xpForLevel(level + 1) - xpForLevel(level);
}

/**
 * Dada uma quantidade TOTAL de XP, retorna o nível correspondente.
 * Determinístico; sobe enquanto o total acumulado cobrir o próximo nível.
 */
export function levelForXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
}

// ─────────────────────────────────────────────────────────────────────────
//  XP por kill + regra anti-farm (kill válido)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Diferença de nível a partir da qual a criatura para de dar XP (anti-farm):
 * matar mob muito abaixo do seu nível não vale (DESIGN-EVOLUCAO.md
 * §Anti-degeneração: "mata farm de rato no lvl 100"). ✏️ placeholder.
 */
const XP_FALLOFF_START_DIFF = 5; // ✏️ placeholder — sem penalidade até 5 níveis acima
const XP_FALLOFF_PER_LEVEL = 0.2; // ✏️ placeholder — -20% por nível além do limite

/**
 * XP concedida por um kill, já com a redução anti-farm por diferença de nível.
 * `baseXp` é o XP do template da criatura (bestiary). `playerLevel` é o nível
 * do jogador; `creatureLevel` o nível efetivo da criatura (placeholder: derive
 * do tier no chamador, ou passe 1 enquanto não houver nível de criatura).
 *
 * Retorna XP inteira ≥ 0. Zero = kill NÃO vale (mob muito fraco p/ o nível).
 */
export function xpFromKill(baseXp: number, playerLevel: number, creatureLevel: number): number {
  if (baseXp <= 0) return 0;
  const diff = playerLevel - creatureLevel;
  if (diff <= XP_FALLOFF_START_DIFF) return baseXp; // dentro da faixa: XP cheia
  // ✏️ placeholder — redução linear; some 0 quando suficientemente abaixo.
  const factor = Math.max(0, 1 - (diff - XP_FALLOFF_START_DIFF) * XP_FALLOFF_PER_LEVEL);
  return Math.floor(baseXp * factor);
}

/**
 * Kill VÁLIDO para fins de progressão/tracking (pré-requisito das Marcas
 * futuras — DESIGN-EVOLUCAO.md §Anti-degeneração): só vale se ainda dá XP.
 * Helper exportado para a wave de Marcas consumir sem reimplementar a regra.
 */
export function isValidKill(baseXp: number, playerLevel: number, creatureLevel: number): boolean {
  return xpFromKill(baseXp, playerLevel, creatureLevel) > 0;
}
