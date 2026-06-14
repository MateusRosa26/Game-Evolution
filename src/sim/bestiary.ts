import type { CreatureFamily, DamageType } from "../shared/types";
import { ABUTRE_INVESTIDA, GOBLIN_LEAP, type MoveDef } from "./moves";

/**
 * Bestiário como DADOS, não código caso-a-caso.
 *
 * O DESIGN-BESTIARIO.md tem 25 criaturas que virão em waves futuras; o design
 * pede uma "biblioteca de blocos". Cada criatura é um template declarativo;
 * a IA lê o `behavior` e parâmetros — nada de classe por monstro.
 *
 * No M1 só o Rato existe e só o comportamento "chaser" é implementado.
 */

/** Tiers de dificuldade do bestiário (DESIGN-BESTIARIO.md). */
export type Tier = "T1" | "T2" | "T3" | "T4" | "T5";

/**
 * Comportamentos de IA do bestiário. COM consumidor: "chaser" (Perseguidor) e
 * "territorial" (neutro até apanhar). "shooter" (atira à distância) tem a IA
 * pronta (`monsterAi.updateShooter`) mas NENHUM template a usa ainda — não há mob
 * de longe nesta fatia; fica declarada p/ o primeiro ranged de verdade. "caster"
 * fica declarado p/ que templates futuros já tenham a forma certa.
 */
export type AiBehavior =
  | "chaser" // persegue via A* e bate em melee (Perseguidor / Matilha base)
  | "territorial" // neutro até PROVOCADO (idle até receber dano; vira chaser depois)
  | "shooter" // ataca À DISTÂNCIA: mantém alcance, atira, kita se encostam (sem consumidor ainda)
  | "caster"; // conjura (declarado; não implementado ainda)

/** Template declarativo de uma criatura. */
export interface CreatureTemplate {
  /** ID de espécie estável (chave de dados / contadores de Marca). */
  species: string;
  /** Nome exibível. */
  name: string;
  family: CreatureFamily;
  tier: Tier;
  behavior: AiBehavior;
  maxHp: number;
  /** Dano do ataque básico. */
  attackDamage: number;
  attackType: DamageType;
  /** Cooldown entre ataques, em ms. */
  attackCooldownMs: number;
  /**
   * Alcance do ataque básico em tiles (Chebyshev). Default (undefined) = melee
   * (1 tile). > 1 só faz sentido com behavior "shooter" (atira à distância). O
   * chaser/territorial ignoram (sempre batem colados). Sem consumidor ainda
   * (nenhum mob ranged nesta fatia) — campo pronto pro primeiro atirador.
   */
  attackRange?: number;
  /** XP base concedido ao jogador por matar esta criatura (antes da redução
   *  anti-farm por diferença de nível — ver `formulas.xpFromKill`). */
  xp: number;
  /** Raio de aggro em tiles (Chebyshev): dentro disso, idle → persegue. */
  aggroRadius: number;
  /** Duração base do passo, em ms (define a velocidade de perseguição). */
  baseStepMs: number;
  /** Respawn após morte, em ms (a sim converte p/ ticks via `msToTicks`). */
  respawnMs: number;
  /** Loot do cadáver: gold (faixa) + itens por chance. */
  loot?: LootTable;
  /** Moves de mecânica telegrafados (MECANICAS-DE-MOB.md). undefined/[] = só
   *  ataque básico (`chaser` puro). Copiados pra entidade no spawn. */
  moves?: MoveDef[];
}

/**
 * Uma chance de drop de item no cadáver. `chance` é rolada INDEPENDENTE por item
 * (RNG de loot da sim). Rates = placeholder ✏️ Balancista (bateria M2, junto da
 * economia). NOTA: esta é a loot table NORMAL (cai sempre, com ou sem faca) —
 * esfolar é um VERBO à parte, gated pela Faca de Esfolar (ITENS-LOOTS.md), wave
 * futura com sua própria lógica anti-jackpot (chance de pele × chance de comida).
 */
export interface LootDrop {
  /** Template do item (ver `items/templates`). */
  templateId: string;
  /** Probabilidade 0..1 de cair. */
  chance: number;
}

/** Tabela de loot de um cadáver. */
export interface LootTable {
  /** Faixa de gold (estilo Tibia — pouco por design). */
  gold?: { min: number; max: number };
  /** Drops de item, cada um rolado por sua `chance`. */
  items?: LootDrop[];
}

/**
 * Drop de item — FILOSOFIA (decisão do criador, jun/2026): **gold é padrão,
 * ITENS são difíceis de dropar.** Mas a `chance` é CONTÍNUA e ESPECÍFICA por
 * item — NADA de enum de raridade (mata a variabilidade; o Tibia, referência do
 * projeto, vive de rates esquisitos e específicos que viram conhecimento-loot /
 * cultura de wiki — pilar 4, e a *matriz esparsa* de EQUIPAMENTO.md: cada item é
 * um EVENTO). Cada drop ganha seu próprio número tunado.
 *
 * DESACOPLAMENTO-CHAVE (decidido): a `chance` controla só a FREQUÊNCIA ("com que
 * frequência cai / como soa achar"); QUANTO de renda o drop vale é corrigido pelo
 * **preço de venda** do item (ver `npc/commerce.ts`), não inflando a chance. Por
 * isso o número de drop pode ser puramente sobre feel — a economia se fecha no preço.
 *
 * FAIXAS-GUIA por papel (NÃO-vinculantes — autor escolhe o número específico
 * dentro, ou FORA quando a matriz esparsa pedir; ✏️ Balancista calibra na M2):
 *   - troféu recorrente de venda ... ~3–12%
 *   - reagente / ingrediente ........ ~2–8%
 *   - gear / peça de mob ............ ~0.3–2%
 *   - pista / named-bait / Marca .... <0.3%
 */

/**
 * Rato — família Bestial, T1, Perseguidor. "O primeiro sangue do
 * jogador": rápido, fraco, vem em grupos. Só ataque básico.
 * Números PLACEHOLDER (mobs são fortes por design — pune descuido).
 */
export const RATO: CreatureTemplate = {
  species: "rato",
  name: "Rato",
  family: "bestial",
  tier: "T1",
  behavior: "chaser",
  maxHp: 24,
  attackDamage: 7, // calibrado (bateria M1.1, jun/2026): início classless 3→1 morte/h, matilha ainda mata em 6,4s; pós-rito intacto
  attackType: "physical",
  attackCooldownMs: 1600,
  xp: 15, // calibrado (bateria M1.1, jun/2026): lvl 5 pós-rito ~14min dedicado — loop de upar divertido por si só; o aspiracional é segredo, não meta
  aggroRadius: 6,
  // 200ms = 5 t/s, UM TIER acima do jogador (250ms / 4 t/s): a matilha te alcança,
  // não dá pra fugir só andando (design: rápido, vem em grupos). Múltiplo de 50 —
  // a sim quantiza o passo em ticks (`quantizeToTickMs`), então autorado = efetivo.
  baseStepMs: 200,
  respawnMs: 10000, // 10s
  loot: {
    gold: { min: 0, max: 1 }, // economia passe 1 (jun/2026): rato 0–1, média ~0,4
    items: [
      // Cauda de Rato — troféu/reagente; comprada pelo Silas pós-quest dele.
      // Troféu recorrente (faixa-guia ~3–12%); a renda se ajusta no preço, não na chance.
      { templateId: "cauda_de_rato", chance: 0.1 }, // ✏️ Balancista (bateria M2)
      // Queijo — comida que o rato devolve. Chance BAIXA de propósito: dá um respiro
      // de sustain sem auto-sustentar a comida (senão mata o gold-sink do food-gating).
      // ✏️ Balancista: tunar contra a economia de comida (alvo ~cobrir <½ do consumo).
      { templateId: "queijo", chance: 0.08 },
      // Carne Crua — matéria-prima de cozinha (besta). Comível crua (1×) ou insumo.
      // ✏️ Balancista: sub-sustentável, junto da economia de comida.
      { templateId: "carne_crua", chance: 0.1 },
    ],
  },
};

/**
 * Esqueleto — família Mortos-Vivos (undead), **T1** (undead de ENTRADA).
 * RECAST (criador, 2026-06-10): o esqueleto é o degrau de ENTRADA da família
 * morto-vivo (T1, met cedo) — o farm natural do Priest (Luz Sagrada nuke vs
 * profanos) e a unidade da Marca *Quebra-Ossos* (15k kills = grind puro Tibia, a
 * Marca fica aqui). O **ghoul** é o PRÓXIMO degrau undead (T2/T3, ainda sem arte
 * — Camada C / fatia ② Charneca). Só ataque básico ("chaser"); passo 300ms =
 * undead arrastado e kitável (a identidade preservada).
 *
 * Números T1 (Balancista, bateria mobs-Alvorada 2026-06-10): hp30/dmg9/xp18 —
 * degrau "undead de entrada" no ladder T1 alargado (dano sobe 7→9→11→14 de rato a
 * lobo, dando progressão DENTRO do T1). ✏️ PROVISÓRIO até a bateria da
 * FAMÍLIA UNDEAD na fatia ② (esqueleto T1 + ghoul T2/T3 + resist/fraqueza).
 * HISTÓRICO: era T2/hp95/dmg12/xp80 (bateria de diferenciação de classe 08/jun,
 * como dummy T2 on-level lvl 10) — esse papel de dummy T2 MIGRA p/ outro mob ✏️.
 * Fraqueza a sagrado/fogo + resist a gelo (FAMILIAS.md) NÃO entram aqui (matriz
 * Regra 10-20 fora da sim; bônus da Luz Sagrada vive no executor).
 */
export const ESQUELETO: CreatureTemplate = {
  species: "esqueleto",
  name: "Esqueleto",
  family: "undead",
  tier: "T1",
  behavior: "chaser",
  maxHp: 30,
  attackDamage: 9,
  attackType: "physical",
  attackCooldownMs: 2000,
  xp: 18,
  aggroRadius: 6,
  // 300ms = 3,33 t/s, UM TIER abaixo do jogador (250ms / 4 t/s) — undead arrastado,
  // kitável (design). Múltiplo de 50 = autorado igual ao efetivo orto (antes 280 já
  // caía em 300 orto; agora honesto). Diagonal ~450ms (ainda mais kitável de lado).
  baseStepMs: 300,
  respawnMs: 15000, // 15s
  loot: {
    gold: { min: 1, max: 3 },
    items: [
      // Osso — restos do esqueleto (loot undead T1). Troféu/reagente recorrente
      // (faixa-guia ~3–12%); o Abel coleta restos profanos (fatia ②). ✏️ Balancista.
      { templateId: "osso", chance: 0.12 },
    ],
  },
};

/**
 * Ghoul — Mortos-Vivos (undead), **T3**. O degrau undead acima do esqueleto
 * (FAMILIAS.md §7: "rápido, faminto"). Habita o **Porão Afogado (A3)**, o fundo
 * T3 dos esgotos — o 1º sussurro da Contaminação por baixo; substitui o esqueleto-
 * placeholder do A3 (buildSewerA3). Mais rápido e MUITO mais pesado que o
 * esqueleto: parede de carne podre que persegue. O Autobuff (frenesi) — a
 * assinatura no doc — fica adiado (✏️ quando o efeito de move existir), igual à
 * fúria do orc/autocura do bandido; entra como `chaser` puro por ora.
 *
 * TIER (reconciliação): este work-order fixa o ghoul como **T3** (contexto A3 =
 * Porão Afogado T3), com números na faixa T3 (ver Urso Pardo 190/28). FAMILIAS.md
 * §7 ainda lista o ghoul como T2 com frenesi — a bateria da família undead (fatia
 * ② Charneca) fecha tier+números; aqui ele é o foe T3 do fundo do esgoto. ✏️.
 */
export const GHOUL: CreatureTemplate = {
  species: "ghoul",
  name: "Ghoul",
  family: "undead",
  tier: "T3",
  behavior: "chaser",
  maxHp: 175, // parede T3 (abaixo do urso 190, acima de todo T2) — undead faminto
  attackDamage: 26, // golpe pesado T3 (≈ urso 28), mais rápido que o esqueleto
  attackType: "physical",
  attackCooldownMs: 1900, // mais ágil que o esqueleto (2000) — "rápido, faminto"
  xp: 120, // faixa T3 (perto do urso 130); o A3 não é farm — é arrepio
  aggroRadius: 6,
  baseStepMs: 250, // passo de jogador — o undead que NÃO é arrastado (≠ esqueleto 300)
  respawnMs: 20000,
  loot: {
    gold: { min: 2, max: 6 },
    // ✏️ MÍNIMO de propósito: o ghoul é a família-coração da fatia ② (Charneca) —
    // o loot undead T3 (resto profano do Abel, drops próprios) entra na bateria
    // dela. Aqui só o osso, herdado do esqueleto, um tico mais provável (T3).
    items: [{ templateId: "osso", chance: 0.15 }],
  },
};

/**
 * Goblin — Humanoide, T1, Perseguidor/Covarde (FAMILIAS.md §2). Pele-verde
 * básico do acampamento (S5) e boca da caverna. "Foge sangrando" (covardia) ainda
 * não modelado — entra como `chaser` (✏️ flee-on-bleed quando o comportamento
 * existir). Um degrau acima do rato: mais HP, bate um pouco mais, passo de jogador.
 * Números SEED ancorados no rato (T1) — ✏️ Balancista calibra (bateria de farm T1).
 */
export const GOBLIN: CreatureTemplate = {
  species: "goblin",
  name: "Goblin",
  family: "humanoid",
  tier: "T1",
  behavior: "chaser",
  // Mecânica do ecossistema (MECANICAS-DE-MOB.md §5): o goblin é o mob late-T1
  // com MOVESET — salto gap-closer anti-kite (você não escapa só andando).
  moves: [GOBLIN_LEAP],
  maxHp: 38,
  attackDamage: 11,
  attackType: "physical",
  attackCooldownMs: 1800,
  xp: 24, // calibrado (bateria mobs-Alvorada jun/2026): degrau médio do T1, dano sobe (esqueleto 9 → goblin 11 → lobo 14)
  aggroRadius: 6,
  baseStepMs: 250, // passo de jogador — não alcança fugindo, mas não dá pra deixar nas costas
  respawnMs: 12000,
  loot: {
    gold: { min: 1, max: 3 },
    items: [
      // Orelha de Goblin — bounty do Capitão Vidal (pós-Q5) + coleta da Q8. Troféu
      // recorrente: chance alta (o bounty precisa juntar 10) — faixa-guia ~3–12%
      // no topo. ✏️ Balancista (afinar contra o ritmo da Q8). (Amuleto Tosco = baú.)
      { templateId: "orelha_de_goblin", chance: 0.5 },
    ],
  },
};

// NOTA (naming + escopo, jun/2026): o **Goblin Fundeiro** (ranged "shooter" do
// Juncal S9) NÃO entra como espécie nesta fatia — a regra de naming pede espécie
// SINGULAR de uma palavra (sem composto), e o work-order fixa que NÃO há mob de
// longe ainda (o tipo `shooter` fica declarado no enum SEM consumidor; a IA
// `updateShooter` + o campo `attackRange` ficam dormentes, prontos). O spot S9
// passa a spawnar o `goblin` base (melee) por ora. ✏️ quando o primeiro ranged
// de verdade entrar (com nome próprio singular), reativa `shooter` aqui.

/**
 * Lobo — Bestial, **T1** (Perseguidor/Matilha — FAMILIAS.md §1: "a alcateia
 * é a skill"). Calibrado (bateria mobs-Alvorada, jun/2026): **T1, não T2** — a
 * dificuldade vem da MATILHA, não do HP solo. Empírico (knight lvl1): TTK solo ~5s
 * (topo do T1, acima do goblin 3,8s); mas 2 lobos passivos matam em 10,2s — a
 * matilha MAIS letal de todos os T1. Tier T1 (creatureLevel 1) faz o lobo dar XP
 * cheia até ~lvl 6-7 e depois expirar (você gradua da Toca); T2 o faria render até
 * lvl 13, cedo demais p/ mob de entrada. **Late-T1 (alargamento jun/2026): hp48,
 * dmg14** — o T1 que MAIS pune (dmg 14 ≈ javali T2 16; 2 lobos passivos matam em
 * 6,8s, a matilha mais letal) e faz ponte suave pro T2. ✏️ pack-AI é wave futura.
 */
export const LOBO: CreatureTemplate = {
  species: "lobo",
  name: "Lobo",
  family: "bestial",
  tier: "T1",
  behavior: "chaser",
  maxHp: 48,
  attackDamage: 14,
  attackType: "physical",
  attackCooldownMs: 1700,
  xp: 36,
  aggroRadius: 7,
  baseStepMs: 220, // veloz (matilha alcança) — múltiplo de 50 p/ casar com a quantização do tick
  respawnMs: 12000,
  loot: {
    gold: { min: 0, max: 2 },
    items: [
      // Pele de Lobo — troféu de caça (Amaro paga pós-Q7). Recorrente (~3–12%).
      // A renda se fecha no PREÇO do Amaro, não na chance. ✏️ Balancista.
      { templateId: "pele_de_lobo", chance: 0.12 },
      // Carne de Caça — "às vezes" (ITENS-LOOTS): corte cru comível/insumo.
      { templateId: "carne_de_caca", chance: 0.08 },
    ],
  },
};

/**
 * Morcego — Voador, T1, Perseguidor/Matilha (FAMILIAS.md §4: "enxames
 * no escuro"). Frágil, rápido, vem em nuvem; mob natural de gruta/A2. Sprite já
 * marca FLYING. Números SEED abaixo do rato (mais fraco, mais rápido) — ✏️ Balancista.
 */
export const MORCEGO: CreatureTemplate = {
  species: "morcego",
  name: "Morcego",
  family: "flying",
  tier: "T1",
  behavior: "chaser",
  maxHp: 16,
  attackDamage: 5,
  attackType: "physical",
  attackCooldownMs: 1400,
  xp: 12,
  aggroRadius: 6,
  baseStepMs: 200, // voador rápido, igual à matilha de ratos
  respawnMs: 10000,
  loot: {
    gold: { min: 0, max: 1 },
    // Asa de Morcego — reagente do Silas (boticário). Faixa-guia reagente ~2–8%.
    items: [{ templateId: "asa_de_morcego", chance: 0.08 }],
  },
};

/**
 * Javali — Bestial, T2, Territorial (FAMILIAS.md §1: "neutro até provocado").
 * Tanque que pune: muito HP, golpe pesado, lento pra atacar. Agora **territorial
 * de verdade** (`monsterAi.updateTerritorial`): pasta parado e SÓ acorda quando
 * apanha — aí persegue/ataca como chaser, e nunca mais volta a dormir. A Investida
 * (carga) ainda não modelada (✏️ move telegrafado futuro). Named **Presa-Torta**
 * (Q7) é variante futura. Números SEED na faixa T2 — ✏️ Balancista.
 */
export const JAVALI: CreatureTemplate = {
  species: "javali",
  name: "Javali",
  family: "bestial",
  tier: "T2",
  behavior: "territorial", // neutro até apanhar (não agrega por proximidade)
  maxHp: 80,
  attackDamage: 16,
  attackType: "physical",
  attackCooldownMs: 2200,
  // aggroRadius é ignorado enquanto idle (territorial não adquire por proximidade);
  // depois de provocado, vale como raio de PERDA de alvo (igual ao chaser).
  aggroRadius: 5,
  xp: 60,
  baseStepMs: 240,
  respawnMs: 15000,
  loot: {
    gold: { min: 1, max: 3 },
    items: [
      // Carne de Caça — o javali dá carne SEMPRE (ITENS-LOOTS: "Javali (sempre)").
      { templateId: "carne_de_caca", chance: 0.55 },
      // Couro Grosso — couro pesado (Amaro paga pós-Q7). Troféu recorrente.
      { templateId: "couro_grosso", chance: 0.1 },
      // Presa de Javali — troféu de caça (Amaro). Faixa-guia ~3–12%.
      { templateId: "presa_de_javali", chance: 0.08 },
    ],
  },
};

/**
 * Aranha-das-Cavernas — Vermes (worm), **T2**, Perseguidor (FAMILIAS.md §3:
 * "básico + veneno no hit"). O aracnídeo do Ninho de Aranhas (S7, fora de trilha)
 * e das galerias do esgoto (A2). Perseguidor cru por ora — o veneno-no-hit (a
 * assinatura) não entra porque o ataque BÁSICO de mob ainda não aplica status
 * (✏️ quando o status-por-hit de mob existir; a família worm é imune a veneno/
 * fraca a fogo na matriz Regra 10-20, que vive fora da sim). Números SEED no
 * ladder T2, ENTRE o javali (80/16) e o bandido (95/18) — ✏️ Balancista.
 */
export const ARANHA: CreatureTemplate = {
  species: "aranha",
  name: "Aranha-das-Cavernas",
  family: "worm",
  tier: "T2",
  behavior: "chaser",
  maxHp: 88, // entre javali 80 e bandido 95
  attackDamage: 17, // entre javali 16 e bandido 18
  attackType: "physical",
  attackCooldownMs: 1700, // ágil (aracnídeo) — entre lobo 1700 e bandido 1800
  xp: 68, // entre javali 60 e bandido 78
  aggroRadius: 6,
  baseStepMs: 230, // rápida (aranha) — um tico acima do javali
  respawnMs: 14000,
  loot: {
    gold: { min: 1, max: 3 },
    items: [
      // Seda — material recorrente do verme (Silas compra). Faixa-guia ~3–12%.
      { templateId: "seda", chance: 0.12 },
      // Glândula de Veneno — reagente mais raro (a peça que destrava a poção/quest
      // do Silas). Faixa-guia reagente ~2–8%, no piso. ✏️ Balancista.
      { templateId: "glandula_de_veneno", chance: 0.05 },
    ],
  },
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * T2/T3 — constelação Alvorada (FAMILIAS.md §1/§2/§6 · QUESTS.md Q7/Q8/Q9/Q11).
 * Todos `chaser` (+ moves telegrafados): nenhum exige AI nova (shooter/caster).
 * NÚMEROS = seed ANCORADO no ladder T1→T2 (rato 7 → goblin 11 → lobo 14 → javali
 * 16 → ...), ✏️ PROVISÓRIO até a bateria do Balancista (mesmo rito dos T1).
 * Assinaturas declaradas no design e adiadas: Orc=autobuff(fúria), Bandido=
 * autocura — entram quando o efeito de move existir (hoje só leap/slam).
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Orc Soldado — Humanoide, T2, Perseguidor (FAMILIAS.md §2). O fundo da Caverna
 * dos Goblins (Q8 ato 3: "não era goblin — era um orc, armado, armadurado"),
 * fecha a pendência do bestiário do Q8. "Defesa alta (escudo)" modelada como HP
 * alto (mob não tem stat de armadura). Tanque deliberado: passo de jogador, golpe
 * pesado, muito HP. ✏️ Autobuff (fúria) — a assinatura — quando o efeito existir.
 */
export const ORC_SOLDADO: CreatureTemplate = {
  // species SINGULAR (regra de naming, jun/2026): base "orc", sem composto. O
  // descritor "Soldado" vive só no `name` exibível.
  species: "orc",
  name: "Orc Soldado",
  family: "humanoid",
  tier: "T2",
  behavior: "chaser",
  maxHp: 115, // "escudo" = parede de HP (sem stat de armadura no mob)
  attackDamage: 20,
  attackType: "physical",
  attackCooldownMs: 2000,
  xp: 95,
  aggroRadius: 6,
  baseStepMs: 250, // passo de jogador — soldado avança, não corre
  respawnMs: 20000, // foe notável do fundo da caverna (não-named)
  loot: {
    gold: { min: 3, max: 8 },
    items: [
      // Sucata de Arma — a "prova marcada" do clímax da Q8 + sucata vendável ao
      // Duarte (pós-Q4). Chance ALTA (a Q8 pede a prova; é a assinatura do orc).
      // ✏️ Balancista (afinar contra o ritmo da Q8-ato3).
      { templateId: "sucata_de_arma", chance: 0.6 },
      // Escudo Lascado — a "peça T1 de gear" (recompensa Q8 / gear vendável ao
      // Duarte). Gear de mob: faixa-guia ~0.3–2%. ✏️ Balancista.
      { templateId: "escudo_lascado", chance: 0.02 },
    ],
  },
};

/**
 * Bandido da Estrada — Humanoide, T2 (FAMILIAS.md §2: T2–T3, fixo T2 na orla da
 * fatia ①). Fora-da-lei da ponte/estrada sul (Q9 A Estrada Roubada) e fonte da
 * Carta Rabiscada (Q11, loot raro → Fortaleza). Skirmisher: menos HP que o orc,
 * mais ágil. ✏️ Autocura ao recuar — a assinatura ("mate antes que se cure") —
 * quando o efeito de move existir.
 */
export const BANDIDO: CreatureTemplate = {
  // species SINGULAR (regra de naming, jun/2026): base "bandido", sem composto. O
  // descritor "da Estrada" vive só no `name` exibível. O spot S11 de alvorada.ts
  // referencia "bandido" (alinhado aqui).
  species: "bandido",
  name: "Bandido da Estrada",
  family: "humanoid",
  tier: "T2",
  behavior: "chaser",
  maxHp: 95,
  attackDamage: 18,
  attackType: "physical",
  attackCooldownMs: 1800,
  xp: 78,
  aggroRadius: 6,
  baseStepMs: 240,
  respawnMs: 15000,
  loot: {
    gold: { min: 4, max: 10 }, // médio (humanos carregam gold — ITENS-LOOTS)
    items: [
      // Adaga Enferrujada — gear surrado (vendável ao Duarte). Faixa-guia gear ~0.3–2%.
      { templateId: "adaga_enferrujada", chance: 0.015 },
      // Carta Rabiscada — pista RARA (Q11 → Fortaleza Abandonada, fatia ③). Faixa
      // pista/named-bait <0.3%: achado de evento, não rotina. ✏️ Balancista.
      { templateId: "carta_rabiscada", chance: 0.005 },
    ],
  },
};

/**
 * Presa-Torta (*Crooktusk*) — Bestial, variante NAMED do Javali (T2+), Q7 ato 2.
 * Mob ÚNICO do mundo, zero phasing: respawn contínuo LENTO (~25 min) — evento, não
 * farm; o `kill` credita todos que contribuíram (já é o comportamento do bus).
 * Stats = javali turbinado (mais HP/dano, XP de evento). Spawn único é detalhe de
 * PLACEMENT (alvorada.ts, respawnMs longo), não do template.
 */
export const PRESA_TORTA: CreatureTemplate = {
  species: "presa_torta",
  name: "Presa-Torta",
  family: "bestial",
  tier: "T2", // T2+ "named" — enum não tem T2+, fica T2 (o perigo é ser evento, não o tier)
  behavior: "chaser",
  maxHp: 170, // javali 80 turbinado (o javali velho, grande demais pro Amaro)
  attackDamage: 24,
  attackType: "physical",
  attackCooldownMs: 2200,
  xp: 175, // lump de EVENTO (respawn 25min — não-farmável); ✏️ Balancista
  aggroRadius: 6,
  baseStepMs: 240,
  respawnMs: 1500000, // ~25 min (Q7: "evento, não farm; fila curta no launch") ✏️
  loot: {
    gold: { min: 8, max: 20 },
    items: [
      // Named javali (clímax Q7): cai SEMPRE com o couro/presa do evento (não é
      // farm — o que importa é a Q7 e o Amaro). Reusa os troféus de javali; um
      // troféu único de Presa-Torta fica ✏️ (Loremaster/Balancista, evento).
      { templateId: "couro_grosso", chance: 1.0 },
      { templateId: "presa_de_javali", chance: 1.0 },
    ],
  },
};

/**
 * Urso Pardo — Bestial, T3, Perseguidor (FAMILIAS.md §1: "bruto — HP e dano
 * enormes, zero skill"). O ápice de perigo bruto da mata/orla: sem move, sem
 * truque — só uma parede que machuca. Aggro curto (acorda de perto, como fera
 * territorial) mas persegue feio quando acorda. Topo do ladder pré-fatia ②.
 */
export const URSO_PARDO: CreatureTemplate = {
  // species SINGULAR (regra de naming, jun/2026): base "urso", sem composto. O
  // descritor "Pardo" vive só no `name` exibível.
  species: "urso",
  name: "Urso Pardo",
  family: "bestial",
  tier: "T3",
  behavior: "chaser",
  maxHp: 190, // bruto: a maior parede de HP da fatia
  attackDamage: 28, // golpe pesado e lento
  attackType: "physical",
  attackCooldownMs: 2400,
  xp: 130,
  aggroRadius: 5, // acorda de perto (fera)
  baseStepMs: 260, // pesado, mas persegue
  respawnMs: 20000,
  loot: {
    gold: { min: 2, max: 6 },
    // Carne de Caça — corte de besta grande. Pele de Urso (troféu próprio) fica
    // ✏️ (sem template ainda; entra com o couro pesado do mid). Faixa-guia caça.
    items: [{ templateId: "carne_de_caca", chance: 0.4 }],
  },
};

/**
 * Abutre Carniceiro — Voador, T2, Perseguidor + Investida (FAMILIAS.md §6). A
 * carniça da estrada/matagal sul: frágil e rápido, mas MERGULHA (anti-kite aéreo —
 * `ABUTRE_INVESTIDA`, variante do leap com alcance maior). HP baixo de voador; o
 * perigo é fechar distância de surpresa, não tankar.
 */
export const ABUTRE: CreatureTemplate = {
  species: "abutre",
  name: "Abutre Carniceiro",
  family: "flying",
  tier: "T2",
  behavior: "chaser",
  moves: [ABUTRE_INVESTIDA],
  maxHp: 55,
  attackDamage: 15,
  attackType: "physical",
  attackCooldownMs: 1600,
  xp: 52,
  aggroRadius: 7, // enxerga longe do céu
  baseStepMs: 200, // voador rápido
  respawnMs: 12000,
  loot: { gold: { min: 1, max: 4 } }, // ✏️ + Pena/Bico quando os itens entrarem
};

/** Registro de templates por espécie — ponto único de lookup. */
export const CREATURES: Record<string, CreatureTemplate> = {
  [RATO.species]: RATO,
  [ESQUELETO.species]: ESQUELETO,
  [GHOUL.species]: GHOUL,
  [GOBLIN.species]: GOBLIN,
  [LOBO.species]: LOBO,
  [MORCEGO.species]: MORCEGO,
  [JAVALI.species]: JAVALI,
  [ARANHA.species]: ARANHA,
  [ORC_SOLDADO.species]: ORC_SOLDADO,
  [BANDIDO.species]: BANDIDO,
  [PRESA_TORTA.species]: PRESA_TORTA,
  [URSO_PARDO.species]: URSO_PARDO,
  [ABUTRE.species]: ABUTRE,
};
