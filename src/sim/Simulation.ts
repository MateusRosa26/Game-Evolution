import { BASE_WALK_MS, DIAGONAL_FACTOR, TICK_MS, msToTicks } from "../shared/constants";
import {
  DEFAULT_OUTFIT_BY_CLASS,
  isValidOutfitColor,
  OUTFIT_PART_BY_ID,
  OUTFIT_PARTS,
  structuredCloneOutfit,
} from "../shared/outfits";
import type {
  EntityState,
  EquippedWeaponState,
  KnownSkillState,
  PlayerProgressState,
  Snapshot,
  SnapshotEvent,
} from "../shared/protocol";
import type { ClientCommand, ContainerView, EquipSlot, ItemRef, QuestJournalEntry, RecipeView, ShopEntryView } from "../shared/protocol";
import { COMMERCE, availableSells, availableBuys, type TradeEntry } from "./npc/commerce";
import {
  DIR_VECTORS,
  dirFromDelta,
  facingFromDir,
  isDiagonal,
  type AttributeKey,
  type ChestDef,
  type DamageType,
  type Dir8,
  type MapData,
  type PlayerClass,
  type Vec2,
} from "../shared/types";
import { DEFAULT_PLAYER_CLASS, MELEE_RANGE, RITO_COST_GOLD, RITO_QUEST_BY_CLASS } from "./balance";
import { CREATURES, type CreatureTemplate } from "./bestiary";
import { applyDamage, chebyshev, type CombatCtx, type WeaponSource } from "./combat";
import type { SimEntity } from "./entity";
import { EventBus, type KillEvent, type DamageEvent } from "./events";
import { attackCooldownMs, maxCarry, MONSTER_MOVE_DAMAGE_SPREAD, physicalDamage, physicalVariance, statPointCost, wandDamage, xpForLevel } from "./formulas";
import {
  ItemRegistry,
  attachItemLedger,
  getItemTemplate,
  RECIPES,
  STARTER_WEAPON_BY_CLASS,
  FISTS_TEMPLATE_ID,
  GOLD_WEIGHT_PER_COIN,
  GOLD_WEIGHT_CAP_COINS,
  goldWeight,
} from "./items";
import type { BlockStats } from "./items/templates";
import { updateChaser } from "./monsterAi";
import { creditQuestKill, QUESTS, type QuestState } from "./quests";
import { ContainerRegistry, type Container } from "./items/containers";
import { mulberry32, type Rng } from "./rng";
import { DIALOGUES, dialogueView } from "./dialogue";
import {
  SKILLS,
  STARTER_KITS,
  applyFood,
  applyMealBuff,
  mealBuffDamage,
  mealBuffAttackSpeedPct,
  beginOrCastSkill,
  resolveCast,
  isKnownSkillId,
  isRooted,
  isStunned,
  projectStatus,
  tickStatus,
  type SkillCastCtx,
} from "./skills";
import {
  allocateStatPoint,
  applyRitoTransition,
  applyDeathPenalty,
  createProgression,
  creatureLevelForTier,
  grantKillXp,
  regenTick,
  syncMaxResources,
  type Progression,
} from "./progression";
import { findPath, nearestWalkable } from "./pathfinding";
import { TrackingEngine, DUMMY_TRACKING_DEFS } from "./tracking";
import type { Facts } from "./tracking/filters";
import { evalRegenMult } from "./tracking/effects";
import { World } from "./World";

/** Respawn pendente de um monstro morto (template + posição). */
interface PendingRespawn {
  template: CreatureTemplate;
  pos: Vec2;
  /** Andar do mob morto — respawna no mesmo z. */
  z: number;
  /** Override de respawn por-spot (carrega pro mob renascido). */
  respawnMs?: number;
  atTick: number;
}

/**
 * Sessão de combate ABERTA de um jogador (agregador do evento `combat_end`). O
 * emissor agrega os fatos INTRÍNSECOS (a engine só compara). Abre no 1º dano
 * envolvendo o jogador; fecha por inatividade (`COMBAT_IDLE_MS` sem dano) ou morte.
 */
interface CombatSession {
  startMs: number;
  lastActivityMs: number;
  damageTaken: number;
  damageDealt: number;
  /** Dano FÍSICO causado na sessão (p/ Intocado = "só magia"; physical==0). */
  physicalDamageDealt: number;
  kills: number;
  /** Menor HP% atingido na sessão (comeback). */
  lowestHpPct: number;
  /** Maior nº de hostis mirando o jogador ao mesmo tempo. */
  maxEnemiesFaced: number;
  /** Já causou dano nesta sessão? (fato `firstHitOfCombat` para o crit P4). */
  dealtDamageThisSession: boolean;
  /** Já TOMOU dano nesta sessão? (fato `firstHitReceivedOfCombat` p/ B5 incomingMult). */
  tookDamageThisSession: boolean;
}

/** Janela de inatividade que fecha uma sessão de combate (ms lógicos). */
const COMBAT_IDLE_MS = 4000;

/**
 * Simulação autoritativa do jogo. Roda em ticks discretos com tempo lógico
 * próprio (tick * TICK_MS) — zero dependência de browser/render.
 * É exatamente o código que um dia roda num servidor Node.
 */
export class Simulation {
  readonly world: World;
  /** Barramento interno de eventos (kill/damage/...) — base da progressão. */
  readonly bus = new EventBus();
  /**
   * Registro de instâncias de item (IDs determinísticos por contador). Fundação
   * de "itens são instâncias com ID + ledger" (DESIGN-EVOLUCAO.md). O ledger das
   * instâncias é alimentado pelos eventos do bus (ver construtor).
   */
  readonly items = new ItemRegistry();
  /** Containers (mochilas/cadáveres) — DESIGN-ITENS onda 1. */
  readonly containers = new ContainerRegistry();
  /** Cadáveres saqueáveis no chão (decaem). */
  private corpses: { id: number; containerId: number; pos: Vec2; z: number; species: string | null; name: string; decayAtTick: number }[] = [];
  private nextCorpseId = 1;
  /** Baús do mundo: defs ESTÁTICAS do mapa (imutáveis; saque é per-jogador). */
  private chests: ChestDef[] = [];
  /** RNG da sim (loot etc.) — seedado e determinístico. */
  private lootRng: Rng = mulberry32(0xa1f0);
  /** RNG do combate (faixa de dano da wand) — stream próprio p/ não perturbar o loot. */
  private combatRng: Rng = mulberry32(0xc0ffee);
  /**
   * Engine da camada EMERGENTE (Marcas/Mutações/Caminhos — DESIGN-EVOLUCAO.md).
   * Observa o bus e cristaliza padrões em recompensas nomeadas. Carregada com as
   * definições DUMMY por ora (conteúdo real ✏️ é wave futura). Construída no
   * constructor (precisa dos lookups de progressão/arma).
   */
  readonly tracking: TrackingEngine;
  private entities = new Map<number, SimEntity>();
  private nextId = 1;
  private tickCount = 0;
  private snapshotListeners: ((snap: Snapshot) => void)[] = [];
  private playerIds = new Set<number>();
  private respawns: PendingRespawn[] = [];
  /** Sessões de combate abertas por jogador (combat_end). */
  private combatSessions = new Map<number, CombatSession>();
  /** Progressão por jogador (level/XP/atributos) — só na sim. */
  private progressions = new Map<number, Progression>();
  /**
   * Casts de skill pedidos entre ticks, processados NO PRÓXIMO tick (commands
   * bufferizados → aplicados no tick, padrão de servidor). Garante que os
   * eventos `cast`/`heal`/`skill_use` saiam no snapshot do tick correto e que a
   * resolução seja determinística (mesma ordem do tick).
   */
  private pendingSkillCasts: { casterId: number; skillId: string; targetId: number | null; aim?: Vec2 }[] = [];
  /** Linhas de chat a emitir no próximo snapshot (say/sistema/npc). */
  private pendingChat: SnapshotEvent[] = [];
  /**
   * Ocupação de tiles por entidades VIVAS — bloqueio de corpo estilo Tibia:
   * players e mobs não se atravessam nem se empilham (cercar/segurar corredor
   * é gameplay; atravessável quebraria o PvP). EXCEÇÃO: zonas seguras do mapa
   * (depot/escadas), onde atravessar players é necessidade real e mobs não
   * entram. Reconstruída a cada tick e atualizada incrementalmente nos passos.
   */
  private occupancy = new Map<number, number>();

  /** Chave de ocupação ÚNICA por (x,y,z) — andares empilham sem colidir. */
  private tileKey(x: number, y: number, z: number): number {
    return z * this.world.width * this.world.height + y * this.world.width + x;
  }

  private rebuildOccupancy(): void {
    this.occupancy.clear();
    for (const e of this.entities.values()) {
      if (!e.dead) this.occupancy.set(this.tileKey(e.pos.x, e.pos.y, e.z), e.id);
    }
  }

  /**
   * `mover` pode ENTRAR no tile? Regras: tile andável; zona segura = sempre
   * livre para players (e proibida para monstros); zona de passagem (chegada
   * de escada/alavanca/portal) = sem bloqueio de corpo para TODOS (ninguém é
   * ejetado nem trava o mecanismo); fora delas, tile ocupado por entidade
   * viva bloqueia.
   */
  private canEnter(mover: SimEntity, x: number, y: number): boolean {
    const z = mover.z;
    if (!this.world.isWalkable(x, y, z)) return false;
    if (this.world.isSafeZone(x, y, z)) return mover.kind !== "monster";
    if (this.world.isPassZone(x, y, z)) return true;
    const occ = this.occupancy.get(this.tileKey(x, y, z));
    return occ == null || occ === mover.id;
  }

  /** Predicado de bloqueio dinâmico para o pathfinding deste `mover`. */
  private blockedFor(mover: SimEntity): (x: number, y: number) => boolean {
    return (x, y) => !this.canEnter(mover, x, y);
  }

  /** Move `e` para (x,y) NO MESMO ANDAR, mantendo a ocupação coerente. */
  private moveTo(e: SimEntity, x: number, y: number): void {
    const fromKey = this.tileKey(e.pos.x, e.pos.y, e.z);
    if (this.occupancy.get(fromKey) === e.id) this.occupancy.delete(fromKey);
    e.pos = { x, y };
    this.occupancy.set(this.tileKey(x, y, e.z), e.id);
  }

  /**
   * Transição ENTRE ANDARES por portal (escada/caverna/buraco) — corte de cena.
   * Atualiza ocupação saindo do andar de origem e entrando no destino (x,y,z).
   * SISTEMA-ANDARES §4: resolvida na sim ao pisar no portal.
   */
  private transition(e: SimEntity, to: { x: number; y: number; z: number }): void {
    const fromKey = this.tileKey(e.pos.x, e.pos.y, e.z);
    if (this.occupancy.get(fromKey) === e.id) this.occupancy.delete(fromKey);
    e.pos = { x: to.x, y: to.y };
    e.z = to.z;
    // intenção de caminho é por-andar: ao trocar de andar, cancela o auto-walk.
    e.intent = null;
    this.occupancy.set(this.tileKey(to.x, to.y, to.z), e.id);
  }

  constructor(map: MapData) {
    this.world = new World(map);
    this.chests = map.chests ?? [];
    this.spawnInitialMonsters();
    this.spawnInitialNpcs();
    // XP/level derivam do evento `kill` do bus (DESIGN-EVOLUCAO.md §Camada Sólida).
    this.bus.on("kill", (ev) => this.onKill(ev));
    // Ledger das instâncias de arma alimentado pelos eventos kill/damage do bus.
    attachItemLedger(this.bus, {
      registry: this.items,
      attackerLevelOf: (id) => this.progressions.get(id)?.level ?? null,
    });
    // Engine de tracking: mesmos lookups (anti-degeneração reusa `isValidKill`).
    // O progresso de Marca vive no ledger da instância; mutações/caminhos no
    // estado próprio da engine (serializável). O SINK (hint/unlock → snapshot) é
    // apontado a cada tick para o `pending` corrente (ver `tick`).
    this.tracking = new TrackingEngine(DUMMY_TRACKING_DEFS, {
      registry: this.items,
      attackerLevelOf: (id) => this.progressions.get(id)?.level ?? null,
      equippedWeaponInstanceId: (id) => this.entities.get(id)?.equippedWeaponId ?? null,
      equippedShieldInstanceId: (id) => this.equippedShieldInstanceIdOf(id),
      isPlayer: (id) => this.playerIds.has(id),
      enemiesNear: (pos, range, excludeId) => this.countHostilesNear(pos, range, excludeId),
      // terrainAt: deferido — exige o z no payload de kill (kill é 2D); ✏️ wave futura.
      grantSkills: (id, skills) => {
        const e = this.entities.get(id);
        if (e) for (const sk of skills) if (!e.knownSkills.includes(sk)) e.knownSkills.push(sk);
      },
    });
    this.tracking.attach(this.bus);
    // Sessões de combate (combat_end): alimentadas pelos eventos do bus.
    this.bus.on("damage", (ev) => this.feedCombatSessionDamage(ev));
    this.bus.on("kill", (ev) => this.feedCombatSessionKill(ev));
  }

  /** Nº de monstros vivos a ≤ `range` (Chebyshev, mesmo andar) de `pos`, exceto `excludeId`. */
  private countHostilesNear(pos: Vec2, range: number, excludeId: number): number {
    const ref = this.entities.get(excludeId);
    const z = ref?.z ?? this.world.baseZ;
    let n = 0;
    for (const e of this.entities.values()) {
      if (e.id === excludeId || e.dead || e.kind !== "monster" || e.z !== z) continue;
      if (chebyshev(e.pos, pos) <= range) n++;
    }
    return n;
  }

  // ── Sessões de combate (combat_end) ────────────────────────────────────

  /** Sessão aberta do jogador (cria sob demanda no 1º dano envolvido). */
  private sessionFor(playerId: number): CombatSession {
    let s = this.combatSessions.get(playerId);
    if (!s) {
      const now = this.now();
      s = { startMs: now, lastActivityMs: now, damageTaken: 0, damageDealt: 0, physicalDamageDealt: 0, kills: 0, lowestHpPct: 1, maxEnemiesFaced: 0, dealtDamageThisSession: false, tookDamageThisSession: false };
      this.combatSessions.set(playerId, s);
    }
    return s;
  }

  /** Marca atividade + atualiza lowestHpPct e maxEnemiesFaced. */
  private touchSession(playerId: number, s: CombatSession): void {
    s.lastActivityMs = this.now();
    const e = this.entities.get(playerId);
    if (e && e.maxHp > 0) s.lowestHpPct = Math.min(s.lowestHpPct, e.hp / e.maxHp);
    let engaged = 0;
    for (const m of this.entities.values()) {
      if (m.kind === "monster" && !m.dead && m.targetId === playerId) engaged++;
    }
    s.maxEnemiesFaced = Math.max(s.maxEnemiesFaced, engaged);
  }

  private feedCombatSessionDamage(ev: DamageEvent): void {
    if (this.playerIds.has(ev.target.id)) {
      const s = this.sessionFor(ev.target.id);
      s.damageTaken += ev.amount;
      s.tookDamageThisSession = true; // fecha o "1º hit recebido" para o B5
      this.touchSession(ev.target.id, s);
    }
    if (this.playerIds.has(ev.source.id)) {
      const s = this.sessionFor(ev.source.id);
      s.damageDealt += ev.amount;
      if (ev.damageType === "physical") s.physicalDamageDealt += ev.amount; // Intocado = só magia
      s.dealtDamageThisSession = true; // fecha o "1º golpe" para o crit P4
      this.touchSession(ev.source.id, s);
    }
  }

  private feedCombatSessionKill(ev: KillEvent): void {
    if (!this.playerIds.has(ev.attacker.id)) return;
    const s = this.combatSessions.get(ev.attacker.id);
    if (s) { s.kills++; this.touchSession(ev.attacker.id, s); }
  }

  /** Fecha sessões paradas há ≥ COMBAT_IDLE_MS (vitória — combate resolvido). */
  private flushIdleCombatSessions(now: number): void {
    for (const [playerId, s] of this.combatSessions) {
      if (now - s.lastActivityMs < COMBAT_IDLE_MS) continue;
      this.emitCombatEnd(playerId, s, now, "victory");
      this.combatSessions.delete(playerId);
    }
  }

  private endCombatSession(playerId: number, endedBy: "victory" | "flee" | "death", now: number): void {
    const s = this.combatSessions.get(playerId);
    if (!s) return;
    this.emitCombatEnd(playerId, s, now, endedBy);
    this.combatSessions.delete(playerId);
  }

  // ── Motor de efeitos — closures injetadas no CombatCtx ─────────────────

  /** Instância do ESCUDO equipado (Marca de escudo Inabalável). null = sem escudo. */
  private equippedShieldInstanceIdOf(entityId: number): number | null {
    const e = this.entities.get(entityId);
    if (!e) return null;
    for (const slot of ["hand1", "hand2"] as EquipSlot[]) {
      const id = e.equipment[slot];
      if (id == null) continue;
      const tpl = getItemTemplate(this.items.get(id)?.templateId ?? "");
      if (tpl?.slot === "shield") return id;
    }
    return null;
  }

  /** Instâncias equipadas de uma entidade (p/ resolver Marcas ativas). */
  private equippedInstanceIdsOf(entityId: number): number[] {
    const e = this.entities.get(entityId);
    if (!e) return [];
    const ids: number[] = [];
    for (const slot in e.equipment) {
      const id = e.equipment[slot as EquipSlot];
      if (id != null) ids.push(id);
    }
    return ids;
  }

  /** Fatos de sessão p/ as condições de efeito (firstHitOfCombat/inCombat). */
  private effectSessionFacts(entityId: number): Facts {
    const e = this.entities.get(entityId);
    const s = this.combatSessions.get(entityId);
    return {
      inCombat: !!(e && e.targetId != null),
      firstHitOfCombat: s ? !s.dealtDamageThisSession : true,
      firstHitReceivedOfCombat: s ? !s.tookDamageThisSession : true,
    };
  }

  /** Dano nos TILES dados (P2 onKill) sem re-disparar efeitos (suppressEffects=true). */
  private dealAreaDamage(ctx: CombatCtx, tiles: Vec2[], sourceId: number, amount: number, damageType: DamageType): void {
    const src = this.entities.get(sourceId);
    if (!src) return;
    const tileSet = new Set(tiles.map((t) => `${t.x},${t.y}`));
    for (const m of this.entities.values()) {
      if (m.id === sourceId || m.dead || m.kind !== "monster" || m.z !== src.z) continue;
      if (tileSet.has(`${m.pos.x},${m.pos.y}`)) applyDamage(ctx, src, m, amount, damageType, null, null, true);
    }
  }

  private emitCombatEnd(playerId: number, s: CombatSession, now: number, endedBy: "victory" | "flee" | "death"): void {
    const e = this.entities.get(playerId);
    this.bus.emit("combat_end", {
      entity: { id: playerId, species: e?.species ?? null, family: e?.family ?? null },
      durationMs: now - s.startMs,
      damageTaken: s.damageTaken,
      damageDealt: s.damageDealt,
      physicalDamageDealt: s.physicalDamageDealt,
      kills: s.kills,
      lowestHpPct: s.lowestHpPct,
      maxEnemiesFaced: s.maxEnemiesFaced,
      endedBy,
      context: { tick: this.tickCount, night: false },
    });
  }

  /** Monta o `WeaponSource` (p/ payloads/ledger) da arma equipada de `e`. */
  private weaponSourceOf(e: SimEntity): WeaponSource | null {
    if (e.equippedWeaponId == null) return null;
    const inst = this.items.get(e.equippedWeaponId);
    if (!inst) return null;
    return { instanceId: inst.id, templateId: inst.templateId, label: inst.templateId };
  }

  /** Tempo lógico atual em ms. */
  private now(): number {
    return this.tickCount * TICK_MS;
  }

  addPlayer(name: string, cls: PlayerClass = DEFAULT_PLAYER_CLASS): number {
    const id = this.nextId++;
    const spawn = this.world.map.spawn;
    const prog = createProgression(cls);
    const entity: SimEntity = {
      id,
      kind: "player",
      name,
      species: null,
      family: null,
      pos: { x: spawn.x, y: spawn.y },
      z: this.world.baseZ, // nasce no overworld
      facing: "s",
      nextMoveAt: 0,
      stepMs: BASE_WALK_MS,
      justMoved: false,
      baseStepMs: BASE_WALK_MS,
      naturalStepMs: BASE_WALK_MS,
      intent: null,
      // Recursos/dano/cooldown do jogador DERIVAM das fórmulas (retrofit Wave 1).
      hp: 0,
      maxHp: 0,
      mp: 0,
      maxMp: 0,
      targetId: null,
      nextAttackAt: 0,
      attackDamage: 0,
      attackCooldownMs: 0,
      nextItemUseAt: 0,
      dead: false,
      // Arma inicial da classe como INSTÂNCIA equipada (preenchido abaixo).
      equippedWeaponId: null,
      armorDef: 0,
      block: null,
      // Outfit default da classe; guarda-roupa nasce com as peças FREE.
      outfit: structuredCloneOutfit(DEFAULT_OUTFIT_BY_CLASS[cls]),
      wardrobe: new Set(OUTFIT_PARTS.filter((p) => p.free).map((p) => p.id)),
      // Kit inicial da classe (compra em NPC é M2+).
      knownSkills: [...STARTER_KITS[cls]],
      skillCooldowns: {},
      status: [],
      ai: null,
      aggroRadius: 0,
      spawnPos: { x: spawn.x, y: spawn.y },
      npcKey: null,
      quests: new Map(),
      activeDialogue: null,
      activeShop: null,
      equipment: {},
      openContainers: new Set(),
      keys: new Set(),
      lootedChests: new Set(),
      backpackContainerId: null,
    };
    // Arma inicial da classe como instância única equipada (DESIGN-EVOLUCAO.md
    // §Classes "Kit inicial"). O ledger nasce zerado e passa a contar a partir
    // do primeiro golpe.
    const weapon = this.items.create(STARTER_WEAPON_BY_CLASS[cls]);
    entity.equippedWeaponId = weapon.id;
    entity.equipment.hand1 = weapon.id;
    // Bolso inicial de 8 slots (decidido jun/2026 — a mochila da Q2 é o upgrade).
    const bolso = this.containers.create("Bolso", 8);
    entity.backpackContainerId = bolso.id;
    // Comida inicial: 5 Queijos no bolso. No modelo food-gated (sem comida = sem
    // regen), o novato precisa de comida pra recuperar desde o lvl 1 — senão o
    // primeiro arranhão vira softlock injusto. Queijo ensina o sustain; o rato
    // devolve mais. ✏️ quantidade tunável (5×60s = ~5min de saciedade inicial).
    for (let i = 0; i < 5; i++) {
      this.containers.add(bolso, { kind: "item", instanceId: this.items.create("queijo").id });
    }
    this.entities.set(id, entity);
    // Bloqueio de corpo: nasce no tile livre mais próximo do spawn e ocupa-o.
    const sp = this.nearestFree(entity, entity.pos);
    entity.pos = { x: sp.x, y: sp.y };
    entity.spawnPos = { x: sp.x, y: sp.y };
    this.occupancy.set(this.tileKey(sp.x, sp.y, entity.z), id);
    this.progressions.set(id, prog);
    syncMaxResources(entity, prog, true); // preenche HP/Mana ao máximo derivado
    this.recomputePlayerDerived(entity, prog); // dano/cooldown de auto-attack
    this.playerIds.add(id);
    return id;
  }

  /**
   * Stats de arma da instância equipada de uma entidade (fallback: punhos).
   * Ponto único onde o auto-attack/skills leem o dano-base/cooldown/escala da
   * arma — SUBSTITUI o antigo placeholder `STARTER_WEAPON_DAMAGE` de balance.ts.
   */
  private weaponStatsOf(entity: SimEntity) {
    const id = entity.equippedWeaponId;
    const tpl = id != null ? this.items.templateOf(id) : undefined;
    const w = tpl?.weapon ?? getItemTemplate(FISTS_TEMPLATE_ID)!.weapon!;
    return w;
  }

  /**
   * Retrofit do combate da Wave 1: dano físico e cooldown do auto-attack do
   * jogador derivam de `formulas.ts` usando o DANO-BASE/COOLDOWN da ARMA
   * EQUIPADA (template da instância) — não mais o placeholder global. Monstros
   * continuam com números do bestiário.
   */
  private recomputePlayerDerived(entity: SimEntity, prog: Progression): void {
    // Armadura/escudo equipados → Def cacheada + bloqueio (mitigação em applyDamage).
    let armorDef = 0;
    let block: BlockStats | null = null;
    for (const slot of ["helmet", "armor", "legs", "boots"] as const) {
      const instId = entity.equipment[slot];
      const t = instId != null ? getItemTemplate(this.items.get(instId)?.templateId ?? "") : undefined;
      if (t?.armor) armorDef += t.armor.def;
    }
    for (const slot of ["hand1", "hand2"] as const) {
      const instId = entity.equipment[slot];
      const t = instId != null ? getItemTemplate(this.items.get(instId)?.templateId ?? "") : undefined;
      if (t?.block) block = t.block;
    }
    entity.armorDef = armorDef;
    entity.block = block;

    const w = this.weaponStatsOf(entity);
    if (w.magic) {
      // Arma mágica: o dano vem da faixa da PRÓPRIA arma (não escala atributo) e
      // rola por tiro em updatePlayerAttack. `attackDamage` guarda só o ponto
      // médio (leitura/debug). Cadência FIXA — sem redução por Destreza.
      entity.attackDamage = Math.floor(((w.damageMin ?? 0) + (w.damageMax ?? 0)) / 2);
      entity.attackCooldownMs = this.quantizeToTickMs(w.baseCooldownMs);
      return;
    }
    entity.attackDamage = physicalDamage(prog.attributes, w.baseDamage, w.usesDexterity);
    // Quantizado à grade de ticks: o cooldown informado é o comportamento real.
    entity.attackCooldownMs = this.quantizeToTickMs(attackCooldownMs(prog.attributes, w.baseCooldownMs));
  }

  removeEntity(id: number): void {
    const e = this.entities.get(id);
    if (e && this.occupancy.get(this.tileKey(e.pos.x, e.pos.y, e.z)) === id) {
      this.occupancy.delete(this.tileKey(e.pos.x, e.pos.y, e.z));
    }
    this.entities.delete(id);
    this.playerIds.delete(id);
    this.progressions.delete(id);
  }

  /** Concede XP/level quando um jogador dá o golpe final numa criatura. */
  private onKill(ev: KillEvent): void {
    const prog = this.progressions.get(ev.attacker.id);
    if (!prog) return; // só jogadores têm progressão
    const attacker = this.entities.get(ev.attacker.id);
    if (!attacker) return;
    const template = ev.victim.species ? CREATURES[ev.victim.species] : undefined;
    if (!template) return; // só criaturas do bestiário dão XP
    const creatureLevel = creatureLevelForTier(template.tier);
    grantKillXp(prog, attacker, template.xp, creatureLevel, this.bus, ev.context);
    // Quests com etapa de caça avançam pelo MESMO evento (mapId ✏️ multi-mapa).
    creditQuestKill(attacker.quests, ev.victim.species, this.world.map.id ?? "alvorada");
    // O crescimento de stats por level up pode ter mudado o dano de auto-attack.
    this.recomputePlayerDerived(attacker, prog);
  }

  // ── Monstros ────────────────────────────────────────────────────────

  /** Spawn dos monstros iniciais a partir das marcas do mapa. */
  private spawnInitialMonsters(): void {
    for (const m of this.world.map.monsters) {
      const template = CREATURES[m.species];
      if (template) this.spawnMonster(template, { x: m.x, y: m.y }, this.world.baseZ, m.respawnMs);
    }
    // Spawns por ANDAR (z<0): cada FloorLayer traz seus mobs em coords de mundo.
    for (const f of this.world.map.floors ?? []) {
      for (const m of f.monsters) {
        const template = CREATURES[m.species];
        if (template) this.spawnMonster(template, { x: m.x, y: m.y }, f.z, m.respawnMs);
      }
    }
  }

  private spawnMonster(template: CreatureTemplate, pos: Vec2, z: number = this.world.baseZ, respawnMs?: number): number {
    const id = this.nextId++;
    this.entities.set(id, {
      id,
      kind: "monster",
      name: template.name,
      species: template.species,
      family: template.family,
      pos: { x: pos.x, y: pos.y },
      z, // andar do spawn (overworld por padrão; subsolo quando o layout pedir)
      facing: "s",
      nextMoveAt: 0,
      stepMs: template.baseStepMs,
      justMoved: false,
      baseStepMs: template.baseStepMs,
      naturalStepMs: template.baseStepMs,
      intent: null,
      hp: template.maxHp,
      maxHp: template.maxHp,
      mp: 0,
      maxMp: 0,
      targetId: null,
      nextAttackAt: 0,
      attackDamage: template.attackDamage,
      attackType: template.attackType,
      // Quantizado à grade de ticks (mesma razão do stepMs/cooldown do player).
      attackCooldownMs: this.quantizeToTickMs(template.attackCooldownMs),
      nextItemUseAt: 0,
      dead: false,
      // Mobs usam números do bestiário, sem arma-instância (ledger só p/ players).
      equippedWeaponId: null,
      armorDef: 0, // mob não equipa armadura (a "armadura" do mob é stat do bestiário)
      block: null,
      outfit: null, // sprite de mob vem da espécie
      wardrobe: new Set(),
      knownSkills: [],
      skillCooldowns: {},
      status: [],
      ai: "idle",
      aggroRadius: template.aggroRadius,
      spawnPos: { x: pos.x, y: pos.y },
      respawnMs, // override por-spot (undefined = usa template.respawnMs no death)
      moves: template.moves, // mecânicas telegrafadas (MECANICAS-DE-MOB.md)
      moveCooldowns: {},
      npcKey: null,
      quests: new Map(),
      activeDialogue: null,
      activeShop: null,
      equipment: {},
      openContainers: new Set(),
      keys: new Set(),
      lootedChests: new Set(),
      backpackContainerId: null,
    });
    this.occupancy.set(this.tileKey(pos.x, pos.y, z), id);
    return id;
  }

  /** NPCs plantados pelo mapa: entidades paradas, sem combate (diálogo/quests). */
  private spawnInitialNpcs(): void {
    for (const n of this.world.map.npcSpawns ?? []) {
      const id = this.nextId++;
      this.entities.set(id, {
        id,
        kind: "npc",
        name: n.name,
        species: null,
        family: null,
        pos: { x: n.x, y: n.y },
        z: this.world.baseZ, // NPCs no overworld (NPC de subsolo: layout futuro)
        facing: "s",
        nextMoveAt: 0,
        stepMs: BASE_WALK_MS,
        justMoved: false,
        baseStepMs: BASE_WALK_MS,
        naturalStepMs: BASE_WALK_MS,
        intent: null,
        hp: 1,
        maxHp: 1,
        mp: 0,
        maxMp: 0,
        targetId: null,
        nextAttackAt: 0,
        attackDamage: 0,
        attackCooldownMs: 0,
        nextItemUseAt: 0,
        dead: false,
        equippedWeaponId: null,
        armorDef: 0,
        block: null,
        outfit: null,
        wardrobe: new Set(),
        knownSkills: [],
        skillCooldowns: {},
        status: [],
        ai: "idle",
        aggroRadius: 0,
        spawnPos: { x: n.x, y: n.y },
        npcKey: n.npcId,
        quests: new Map(),
        activeDialogue: null,
      activeShop: null,
        equipment: {},
        openContainers: new Set(),
        keys: new Set(),
        lootedChests: new Set(),
        backpackContainerId: null,
      });
      this.occupancy.set(this.tileKey(n.x, n.y, this.world.baseZ), id);
    }
  }

  /** Tile livre mais próximo de `target` para `mover` (anéis até 3; fallback: o próprio). */
  private nearestFree(mover: SimEntity, target: Vec2): Vec2 {
    if (this.canEnter(mover, target.x, target.y)) return target;
    for (let r = 1; r <= 3; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = target.x + dx;
          const y = target.y + dy;
          if (this.canEnter(mover, x, y)) return { x, y };
        }
      }
    }
    return target;
  }

  /** Diálogo exige proximidade contínua: afastou (>3 tiles) ou NPC sumiu → fecha. */
  private pruneDialogues(): void {
    for (const e of this.entities.values()) {
      if (!e.activeDialogue) continue;
      const npc = this.entities.get(e.activeDialogue.npcEntityId);
      if (!npc || npc.dead || npc.z !== e.z || chebyshev(e.pos, npc.pos) > 3) e.activeDialogue = null;
    }
  }

  handleCommand(entityId: number, cmd: ClientCommand): void {
    const e = this.entities.get(entityId);
    if (!e || e.dead) return;
    switch (cmd.type) {
      case "setDir":
        e.intent = cmd.dir ? { kind: "dir", dir: cmd.dir } : null;
        break;
      case "walkTo": {
        const goal = nearestWalkable(this.world, { x: Math.round(cmd.x), y: Math.round(cmd.y) }, 3, e.z);
        if (!goal) break;
        const path = findPath(this.world, e.pos, goal, { isBlocked: this.blockedFor(e), z: e.z });
        if (path && path.length > 0) e.intent = { kind: "path", path, goal };
        break;
      }
      case "selectTarget": {
        if (cmd.entityId == null) {
          e.targetId = null;
          break;
        }
        const target = this.entities.get(cmd.entityId);
        // Só alveja monstros vivos existentes NO MESMO ANDAR.
        e.targetId = target && target.kind === "monster" && !target.dead && target.z === e.z ? cmd.entityId : null;
        break;
      }
      case "allocateStatPoint": {
        const prog = this.progressions.get(entityId);
        if (!prog) break; // só jogadores têm progressão
        if (allocateStatPoint(prog, e, cmd.attr as AttributeKey)) {
          // Atributo mudou → dano/cooldown de auto-attack podem ter mudado.
          this.recomputePlayerDerived(e, prog);
        }
        break;
      }
      case "chooseClass": {
        if (e.kind !== "player") break;
        const prog = this.progressions.get(entityId);
        if (!prog) break;
        this.performRito(e, prog, cmd.cls);
        break;
      }
      case "useSkill": {
        if (e.kind !== "player") break;
        // Bufferiza: resolvido no próximo tick (com ctx/pending corretos).
        this.pendingSkillCasts.push({
          casterId: entityId,
          skillId: cmd.skillId,
          targetId: cmd.targetId ?? e.targetId,
          aim: cmd.aim ? { x: cmd.aim.x, y: cmd.aim.y } : undefined,
        });
        break;
      }
      case "debugGrantSkill": {
        // DEV/teste: concede skill conhecida ao jogador (compra em NPC é M2+).
        if (e.kind !== "player") break;
        if (isKnownSkillId(cmd.skillId) && !e.knownSkills.includes(cmd.skillId)) {
          e.knownSkills.push(cmd.skillId);
        }
        break;
      }
      case "talk": {
        if (e.kind !== "player") break;
        const npc = this.entities.get(cmd.npcId);
        if (!npc || npc.kind !== "npc" || !npc.npcKey) break;
        if (npc.z !== e.z || chebyshev(e.pos, npc.pos) > 3) break; // alcance de conversa (mesmo andar)
        const dlg = DIALOGUES[npc.npcKey];
        if (!dlg) break;
        const talkerCls = this.progressions.get(e.id)?.cls ?? "classless";
        e.activeDialogue = { npcEntityId: npc.id, view: dlg.root(e.quests, talkerCls) };
        this.pendingChat.push({
          kind: "chat", channel: "npc", text: e.activeDialogue.view.text,
          speakerId: npc.id, speakerName: npc.name, recipientId: e.id,
        });
        break;
      }
      case "dialogueChoice": {
        if (e.kind !== "player" || !e.activeDialogue) break;
        const npc = this.entities.get(e.activeDialogue.npcEntityId);
        const dlg = npc?.npcKey ? DIALOGUES[npc.npcKey] : undefined;
        if (!npc || !dlg) {
          e.activeDialogue = null;
          break;
        }
        // opção precisa estar na visão atual (anti-exploit: nada de pular nós)
        if (!e.activeDialogue.view.options.some((o) => o.id === cmd.optionId)) break;
        const chooserCls = this.progressions.get(e.id)?.cls ?? "classless";
        const res = dlg.choose(cmd.optionId, e.quests, chooserCls);
        // efeitos ANTES da próxima visão (o texto seguinte já reflete o estado)
        if (res.effects?.acceptQuest) {
          const def = QUESTS[res.effects.acceptQuest];
          if (def && !e.quests.has(def.id)) {
            e.quests.set(def.id, { stage: "active", kills: 0 } satisfies QuestState);
          }
        }
        if (res.effects?.completeQuest) {
          const def = QUESTS[res.effects.completeQuest];
          const st = def ? e.quests.get(def.id) : undefined;
          if (def && st && st.stage === "report") {
            st.stage = "completed";
            // Recompensa de ouro = pilha depositada no bolso (modelo Tibia).
            const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
            if (bp) this.containers.depositGold(bp, def.rewards.gold);
            this.sysMessage(e.id, `Quest concluída: ${def.name}. +${def.rewards.gold} ouro, +${def.rewards.xp} XP.`);
            const prog = this.progressions.get(e.id);
            if (prog) {
              // XP de quest: mesma rotina do kill-XP, sem criatura (level 0 = sem corte).
              grantKillXp(prog, e, def.rewards.xp, 0, this.bus, {
                tick: this.tickCount,
                night: false,
              });
              this.recomputePlayerDerived(e, prog);
            }
          }
        }
        // Rito de classe: o treinador dispara a transição (valida gold+quest e
        // cobra dentro de performRito; a mensagem de sistema dá o resultado).
        if (res.effects?.performRito) {
          const prog = this.progressions.get(e.id);
          if (prog) this.performRito(e, prog, res.effects.performRito);
        }
        // Abrir loja: substitui a janela de diálogo pela de comércio.
        if (res.effects?.openShop && npc.npcKey && COMMERCE[npc.npcKey]) {
          e.activeShop = { npcEntityId: npc.id };
          e.activeDialogue = null;
          break;
        }
        if (res.view) {
          e.activeDialogue = { npcEntityId: npc.id, view: res.view };
          this.pendingChat.push({
            kind: "chat", channel: "npc", text: res.view.text,
            speakerId: npc.id, speakerName: npc.name, recipientId: e.id,
          });
        } else {
          e.activeDialogue = null;
        }
        break;
      }
      case "closeDialogue": {
        e.activeDialogue = null;
        break;
      }
      case "openShop": {
        if (e.kind !== "player") break;
        this.openShop(e, cmd.npcId);
        break;
      }
      case "closeShop": {
        e.activeShop = null;
        break;
      }
      case "buyItem": {
        if (e.kind !== "player") break;
        this.buyItem(e, cmd.templateId);
        break;
      }
      case "sellItem": {
        if (e.kind !== "player") break;
        this.sellItem(e, cmd.instanceId);
        break;
      }
      case "say": {
        if (e.kind !== "player") break;
        const text = cmd.text.trim().slice(0, 120);
        if (!text) break;
        // Fala local: balão sobre a cabeça + linha no canal Local (todos veem).
        this.pendingChat.push({
          kind: "chat",
          channel: "local",
          text,
          speakerId: e.id,
          speakerName: e.name,
        });
        // Saudação estilo Tibia: "hi/hello/oi/olá" perto de um NPC abre a conversa.
        if (/^(hi|hello|oi|ol[aá]|ol[aá])$/i.test(text)) {
          let best: SimEntity | null = null;
          let bestD = 4;
          for (const npc of this.entities.values()) {
            if (npc.kind !== "npc" || !npc.npcKey || !DIALOGUES[npc.npcKey]) continue;
            const d = chebyshev(e.pos, npc.pos);
            if (d <= 3 && d < bestD) { best = npc; bestD = d; }
          }
          if (best && best.npcKey) {
            const sayerCls = this.progressions.get(e.id)?.cls ?? "classless";
            e.activeDialogue = { npcEntityId: best.id, view: DIALOGUES[best.npcKey].root(e.quests, sayerCls) };
            this.pendingChat.push({
              kind: "chat", channel: "npc", text: e.activeDialogue.view.text,
              speakerId: best.id, speakerName: best.name, recipientId: e.id,
            });
          }
        }
        break;
      }
      case "openChest": {
        if (e.kind !== "player") break;
        this.openChest(e, cmd.chestId);
        break;
      }
      case "openContainer": {
        if (e.kind !== "player") break;
        if (this.containerAccessible(e, cmd.containerId)) e.openContainers.add(cmd.containerId);
        break;
      }
      case "closeContainer": {
        e.openContainers.delete(cmd.containerId);
        break;
      }
      case "lootGold": {
        if (e.kind !== "player") break;
        this.lootGold(e, cmd.containerId, cmd.slot);
        break;
      }
      case "moveItem": {
        if (e.kind !== "player") break;
        this.moveItem(e, cmd.from, cmd.to);
        break;
      }
      case "useItem": {
        if (e.kind !== "player") break;
        this.useItem(e, cmd.ref);
        break;
      }
      case "cook": {
        if (e.kind !== "player") break;
        this.cookRecipe(e, cmd.recipeId);
        break;
      }
      case "setOutfit": {
        // Valida CADA peça: existe, slot certo, possuída, cor da grade.
        // Posse via quest/conteúdo pago só alimenta o guarda-roupa ✏️ —
        // esta validação não muda.
        if (e.kind !== "player") break;
        const o = cmd.outfit;
        const valid = (["head", "torso", "legs"] as const).every((slot) => {
          const piece = o?.[slot];
          if (!piece) return false;
          const def = OUTFIT_PART_BY_ID[piece.part];
          return (
            def !== undefined &&
            def.slot === slot &&
            e.wardrobe.has(piece.part) &&
            isValidOutfitColor(piece.color)
          );
        });
        if (valid) e.outfit = structuredCloneOutfit(o);
        break;
      }
      case "debugGrantOutfit": {
        // DEV/teste: desbloqueia o catálogo inteiro (✏️ remover/gat em M2+).
        if (e.kind !== "player") break;
        for (const p of OUTFIT_PARTS) e.wardrobe.add(p.id);
        break;
      }
      case "stop":
        e.intent = null;
        break;
    }
  }

  /** Monta o `SkillCastCtx` de um caster a partir do `CombatCtx` do tick. */
  private buildSkillCtx(ctx: CombatCtx, caster: SimEntity, prog: Progression): SkillCastCtx {
    return {
      ...ctx,
      prog,
      // Dano-base da ARMA equipada (Golpe Forte/Apunhalar escalam a arma).
      weaponBase: this.weaponStatsOf(caster).baseDamage,
      // Instância da arma p/ atribuir dano/kill de skill física ao ledger.
      weaponSource: this.weaponSourceOf(caster),
      // AoE/linha só atinge entidades do andar do caster.
      enemiesInWorld: [...this.entities.values()].filter((en) => en.z === caster.z),
      // RNG seedado p/ variância do dano físico (skills AD).
      roll: this.combatRng,
      // `dash` (Passo Sombrio): teleporta o caster pra trás do alvo (colisão aqui).
      tryDashBehind: (c, t) => this.dashBehind(c, t),
    };
  }

  /**
   * `dash`: teleporta `caster` pro tile ATRÁS de `target` (oposto ao facing dele).
   * No-op se outro andar ou se o tile estiver bloqueado/ocupado (cai no golpe
   * normal). Atualiza ocupação + encara o alvo. Determinístico.
   */
  private dashBehind(caster: SimEntity, target: SimEntity): void {
    if (caster.z !== target.z) return;
    const fv =
      target.facing === "n" ? { x: 0, y: -1 } :
      target.facing === "s" ? { x: 0, y: 1 } :
      target.facing === "e" ? { x: 1, y: 0 } : { x: -1, y: 0 };
    const bx = target.pos.x - fv.x;
    const by = target.pos.y - fv.y;
    if (!this.canEnter(caster, bx, by)) return; // bloqueado/ocupado → sem teleporte
    this.moveTo(caster, bx, by);
    caster.facing = this.facingToward(caster.pos, target.pos);
  }

  /** Resolve os casts bufferizados no tick atual (após status, antes da IA). */
  private resolveSkillCasts(ctx: CombatCtx): void {
    if (this.pendingSkillCasts.length === 0) return;
    const queue = this.pendingSkillCasts;
    this.pendingSkillCasts = [];
    for (const req of queue) {
      const caster = this.entities.get(req.casterId);
      if (!caster || caster.dead) continue;
      // Já conjurando algo: ignora o novo pedido (sem fila de cast no M1).
      if (caster.casting) continue;
      const prog = this.progressions.get(req.casterId);
      if (!prog) continue;
      // P7 (skillSwap): se há Mutação resolvida p/ esta skill, o cast resolve com
      // a def MUTADA (cai na base se a def mutada não existir — seguro).
      const swapped = this.tracking.resolvedMutationSkill(req.casterId, req.skillId);
      const effectiveSkillId = swapped && SKILLS[swapped] ? swapped : req.skillId;
      // Zona segura: skill OFENSIVA não sai de dentro (cura pode — padrão PZ).
      const def = SKILLS[effectiveSkillId];
      if (def && def.targeting !== "healTarget" && this.world.isSafeZone(caster.pos.x, caster.pos.y, caster.z)) {
        continue;
      }
      // Alvo só vale no MESMO ANDAR do caster (skill não atravessa andar).
      const rawTarget = req.targetId != null ? this.entities.get(req.targetId) ?? null : null;
      const target = rawTarget && rawTarget.z === caster.z ? rawTarget : null;
      const skillCtx = this.buildSkillCtx(ctx, caster, prog);
      // Decide instantâneo (runa) vs. cast-time (arma `casting`, resolve depois).
      beginOrCastSkill(skillCtx, caster, effectiveSkillId, target, req.aim);
    }
  }

  /**
   * Resolve conjurações ARMADAS (cast-time) cujo `endTick` venceu neste tick.
   * Roda APÓS o movimento/dano deste tick: assim mover/tomar dano no tick do
   * `endTick` ainda cancela antes da resolução (`casting` já foi limpo).
   */
  private tickCasts(ctx: CombatCtx): void {
    for (const e of this.entities.values()) {
      if (e.dead || !e.casting) continue;
      if (this.tickCount < e.casting.endTick) continue;
      const prog = this.progressions.get(e.id);
      if (!prog) { e.casting = null; continue; }
      // Alvo do cast revalidado (mesmo andar, vivo) no momento da resolução.
      const raw = e.casting.targetId != null ? this.entities.get(e.casting.targetId) ?? null : null;
      const target = raw && raw.z === e.z && !raw.dead ? raw : null;
      const skillCtx = this.buildSkillCtx(ctx, e, prog);
      resolveCast(skillCtx, e, target);
    }
  }

  /** Cancela a conjuração em andamento de `e` (mover/tomar dano). Sem reembolso. */
  private cancelCast(e: SimEntity): void {
    // ✏️ POLÍTICA DE REEMBOLSO: decisão do Balancista. Default ATUAL = NÃO
    // reembolsa a mana cobrada no início do cast cancelado.
    e.casting = null;
  }

  onSnapshot(cb: (snap: Snapshot) => void): void {
    this.snapshotListeners.push(cb);
  }

  tick(): void {
    this.tickCount++;
    // Índice de ocupação do tick (bloqueio de corpo): IA, pathfinding e passos
    // deste tick enxergam as posições atuais; os passos atualizam incremental.
    this.rebuildOccupancy();
    const now = this.now();
    const pending: SnapshotEvent[] = [];
    if (this.pendingChat.length > 0) {
      pending.push(...this.pendingChat);
      this.pendingChat = [];
    }
    const ctx: CombatCtx = {
      bus: this.bus,
      tick: this.tickCount,
      pending,
      night: false,
      lookup: (id) => this.entities.get(id),
      rng: this.combatRng,
      effectsOf: (id) => this.tracking.activeEffects(id, this.equippedInstanceIdsOf(id)),
      sessionFacts: (id) => this.effectSessionFacts(id),
      // Tomar dano cancela a conjuração em andamento do alvo (cast-time).
      onDamaged: (target) => { if (target.casting) this.cancelCast(target); },
    };
    // areaDamage referencia `ctx` (já construído) — atribuído após o literal.
    ctx.areaDamage = (tiles, sourceId, amount, dt) => this.dealAreaDamage(ctx, tiles, sourceId, amount, dt);

    // Aponta o SINK da engine de tracking para o `pending` DESTE tick: hints/
    // unlocks viram SnapshotEvents one-shot, sem JAMAIS carregar progresso
    // (DESIGN-EVOLUCAO.md §"Visibilidade" — cheat-proof). No M1 single-player o
    // evento vai ao snapshot compartilhado; o `playerId` fica pronto p/ rotear
    // por conexão no online.
    this.tracking.setSink({
      hint: (_playerId, text) => pending.push({ kind: "trackingHint", text }),
      unlock: (_playerId, category, name, flavorText) =>
        pending.push({ kind: "trackingUnlock", category, name, flavorText }),
    });

    const players = [...this.playerIds]
      .map((id) => this.entities.get(id))
      .filter((e): e is SimEntity => !!e && !e.dead);

    // ── 0. Status effects (DoT/slow): aplica ANTES do movimento (slow no stepMs) ──
    for (const e of this.entities.values()) {
      if (!e.dead) tickStatus(ctx, e);
    }

    // ── 0.5 Casts de skill bufferizados (resolução instantânea, estilo runa) ──
    this.resolveSkillCasts(ctx);

    // ── 1. IA dos monstros (decide intent e ataca) ──
    for (const e of this.entities.values()) {
      e.justMoved = false;
      if (e.kind === "monster" && e.ai !== null && !e.dead) {
        if (e.activeMove) {
          // Em WINDUP: travado (não persegue/ataca). Resolve quando vence; o mob
          // age de novo no tick seguinte (MECANICAS-DE-MOB.md §1).
          if (now >= e.activeMove.resolveAt) this.resolveMove(e, ctx);
        } else {
          updateChaser(ctx, this.world, e, players, now, this.blockedFor(e));
        }
      }
    }

    // ── 2. Auto-attack + regen do jogador (estilo Tibia) ──
    for (const id of this.playerIds) {
      const e = this.entities.get(id);
      if (!e) continue;
      this.updatePlayerAttack(ctx, e, now);
      const prog = this.progressions.get(id);
      if (prog) {
        // P5 (regen): multiplicador condicional dos EffectSpec ativos (ex: Intocável).
        const effects = this.tracking.activeEffects(id, this.equippedInstanceIdsOf(id));
        let hpMult = 1, manaMult = 1;
        if (effects.length > 0) {
          const facts = this.effectSessionFacts(id);
          hpMult = evalRegenMult(effects, "hp", facts);
          manaMult = evalRegenMult(effects, "mana", facts);
        }
        regenTick(prog, e, hpMult, manaMult); // regen de HP/mana por fórmula
      }
    }

    // ── 3. Movimento (player + monstros) ──
    for (const e of this.entities.values()) {
      if (e.dead || !e.intent || now < e.nextMoveAt) continue;
      // Enraizado (root): não dá passo enquanto o status estiver ativo (a
      // intenção fica retida; volta a andar quando o root expira).
      if (isRooted(e) || isStunned(e)) continue;
      if (e.intent.kind === "dir") this.stepInDirection(e, e.intent.dir, now);
      else this.stepAlongPath(e, now);
    }

    // ── 3.5 Conjurações com cast-time que venceram: resolve AGORA (após
    // movimento/dano deste tick — mover/tomar dano no tick do fim ainda cancela). ──
    this.tickCasts(ctx);
    // ── 3.6 Fecha sessões de combate paradas (emite combat_end → tracking).
    // Depois do tickCasts: dano de cast resolvido refresca a sessão antes do idle. ──
    this.flushIdleCombatSessions(now);

    // ── 4. Mortes: remover/respawnar ──
    this.resolveDeaths(now);

    this.pruneDialogues();
    this.pruneCorpsesAndContainers();
    this.emitSnapshot(pending);
  }

  /**
   * Resolve o move em windup de um monstro: aplica o efeito e limpa o
   * `activeMove`. Resolução determinística em unidade de tile (MECANICAS-DE-MOB).
   */
  private resolveMove(monster: SimEntity, ctx: CombatCtx): void {
    const am = monster.activeMove;
    monster.activeMove = undefined;
    if (!am) return;
    if (am.def.kind === "leap") {
      // Gap-closer anti-kite: pousa num tile LIVRE adjacente ao alvo. nearestFree
      // devolve `target.pos` se nada livre em r≤3 → nesse caso não pousa no alvo.
      const target = this.entities.get(am.targetId);
      if (!target || target.dead || target.z !== monster.z) return;
      const landing = this.nearestFree(monster, target.pos);
      if (landing.x === target.pos.x && landing.y === target.pos.y) return;
      this.occupancy.delete(this.tileKey(monster.pos.x, monster.pos.y, monster.z));
      monster.pos = { x: landing.x, y: landing.y };
      this.occupancy.set(this.tileKey(landing.x, landing.y, monster.z), monster.id);
      const dx = target.pos.x - landing.x;
      const dy = target.pos.y - landing.y;
      monster.facing = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "e" : "w") : dy >= 0 ? "s" : "n";
      monster.intent = null; // chegou colado; ataca no próximo tick
    } else if (am.def.kind === "slam") {
      // DESVIO: dano a quem OCUPA um tile marcado (congelado no início do windup).
      // Saiu da área antes deste tick = imune (lê a occupancy AGORA, no fim).
      if (!am.targetTiles) return;
      for (const t of am.targetTiles) {
        const occId = this.occupancy.get(this.tileKey(t.x, t.y, monster.z));
        if (occId == null || occId === monster.id) continue; // tile vazio ou o próprio caster
        const victim = this.entities.get(occId);
        if (victim && !victim.dead && victim.kind === "player") {
          // Slam telegrafado varia POUCO (±20%): o telegraph promete um número, o
          // desvio é a mecânica — faixa apertada não rouba a didática posicional.
          const slamDmg = physicalVariance(am.def.damage ?? 0, this.combatRng(), MONSTER_MOVE_DAMAGE_SPREAD);
          applyDamage(ctx, monster, victim, slamDmg, am.def.damageType ?? "physical", null, null);
        }
      }
    }
  }

  /** Auto-attack: com alvo vivo no ALCANCE da arma, ataca a cada cooldown. */
  private updatePlayerAttack(ctx: CombatCtx, player: SimEntity, now: number): void {
    if (player.dead || player.targetId == null) return;
    if (isStunned(player)) return; // atordoado não ataca
    // Zona segura é zona SEM combate: não se ataca de dentro dela (a IA já é
    // cega para quem está dentro — atacar de lá seria abuso de mão única).
    if (this.world.isSafeZone(player.pos.x, player.pos.y, player.z)) return;
    const target = this.entities.get(player.targetId);
    if (!target || target.kind !== "monster" || target.dead || target.z !== player.z) {
      player.targetId = null; // alvo morto/inexistente ou em outro andar
      return;
    }
    const w = this.weaponStatsOf(player);
    // Alcance da ARMA: melee = MELEE_RANGE (1); wand é ranged (WAND_RANGE, < arco).
    const range = w.range ?? MELEE_RANGE;
    if (chebyshev(player.pos, target.pos) > range) return; // fora de alcance
    if (now < player.nextAttackAt) return;
    // Buff de refeição ("Saciado", COZINHA.md): +N na BASE DE DANO DA ARMA. No
    // modelo híbrido (dano = base × (1 + atributo×k)), +N na base passa PELO
    // multiplicador → escala com o personagem (não é flat). Por isso recalculamos
    // com a base buffada em vez de somar no fim.
    const bonusBase = mealBuffDamage(player);
    const prog = this.progressions.get(player.id);
    let damage: number;
    if (w.magic) {
      // Tiro mágico: custa mana (sem mana = não dispara, e NÃO consome o cooldown
      // — retenta no próximo tick assim que a mana regenerar). Dano rola na faixa
      // FIXA da arma (não escala atributo) — o buff +N soma flat ao tiro.
      const cost = w.manaCost ?? 0;
      if (player.mp < cost) return;
      player.mp -= cost;
      damage = wandDamage(w.damageMin ?? 0, w.damageMax ?? 0, this.combatRng()) + bonusBase;
    } else {
      // FÍSICO (AD) é VARIÁVEL (Tibia/Apogea): a média vem da fórmula, mas o golpe
      // rola num range largo (swingy) — ≠ mágico, que é constante.
      const avg =
        prog && bonusBase > 0
          ? physicalDamage(prog.attributes, w.baseDamage + bonusBase, w.usesDexterity)
          : player.attackDamage;
      damage = physicalVariance(avg, this.combatRng());
    }
    player.facing = this.facingToward(player.pos, target.pos);
    // Auto-attack alimenta o ledger da arma equipada (DESIGN-EVOLUCAO.md §"Magias
    // e Skills": todo kill por auto-attack conta no ledger da arma).
    applyDamage(ctx, player, target, damage, w.damageType, this.weaponSourceOf(player), null);
    // Velocidade de ataque do buff: reduz o cooldown (quantizado à grade de ticks).
    const speedPct = mealBuffAttackSpeedPct(player);
    const cd = speedPct > 0 ? this.quantizeToTickMs(player.attackCooldownMs * (1 - speedPct)) : player.attackCooldownMs;
    player.nextAttackAt = now + cd;
  }

  /** Enfileira mensagem de SISTEMA privada (loot/level/quest) para um jogador. */
  private sysMessage(recipientId: number, text: string): void {
    this.pendingChat.push({ kind: "chat", channel: "system", text, recipientId });
  }

  /** O jogador pode mexer neste container? (bolso próprio OU cadáver a ≤2 tiles) */
  private containerAccessible(e: SimEntity, containerId: number): boolean {
    if (e.backpackContainerId === containerId) return true;
    const corpse = this.corpses.find((c) => c.containerId === containerId);
    return !!corpse && corpse.z === e.z && chebyshev(e.pos, corpse.pos) <= 2;
  }

  /**
   * Abre um baú próximo — SINGLE-USE por jogador (modelo baú-de-quest do Tibia).
   * Gates ortogonais opcionais: nível mínimo + chave abstrata. Concede o loot
   * FIXO direto ao bolso; BLOQUEIA sem espaço (nada se perde) e só marca como
   * saqueado quando o loot de fato entrou. Ver `ChestDef`/`ChestLoot`.
   */
  private openChest(e: SimEntity, chestId: string): void {
    const chest = this.chests.find((c) => c.id === chestId);
    if (!chest) return;
    // Alcance: ≤2 tiles no mesmo andar (mesma régua do cadáver).
    if (chest.z !== e.z || chebyshev(e.pos, chest.pos) > 2) return;
    const label = chest.name ?? "o baú";
    if (e.lootedChests.has(chestId)) {
      this.sysMessage(e.id, "Você já levou o que havia aqui.");
      return;
    }
    // Gate de nível mínimo.
    if (chest.levelReq != null) {
      const lvl = this.progressions.get(e.id)?.level ?? 1;
      if (lvl < chest.levelReq) {
        this.sysMessage(e.id, `Você não tem força para abrir isto (precisa de nível ${chest.levelReq}).`);
        return;
      }
    }
    // Gate de chave (abstrata — flag no personagem).
    if (chest.keyReq != null && !e.keys.has(chest.keyReq)) {
      this.sysMessage(e.id, "Está trancado.");
      return;
    }
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (!bp) return;
    // Pré-checa espaço: 1 slot por item; ouro só precisa de slot se não há pilha.
    const itemCount = (chest.loot.items ?? []).reduce((n, it) => n + (it.qty ?? 1), 0);
    const needsGoldSlot = (chest.loot.gold ?? 0) > 0 && !bp.slots.some((s) => s?.kind === "gold");
    const needed = itemCount + (needsGoldSlot ? 1 : 0);
    const free = bp.slots.filter((s) => s === null).length;
    if (needed > free) {
      this.sysMessage(e.id, "Abra espaço na mochila primeiro.");
      return;
    }
    // Concede o loot (determinístico) e fecha o saque para este personagem.
    for (const it of chest.loot.items ?? []) {
      const qty = it.qty ?? 1;
      for (let i = 0; i < qty; i++) {
        const inst = this.items.create(it.templateId);
        this.containers.add(bp, { kind: "item", instanceId: inst.id });
      }
    }
    if (chest.loot.gold) this.containers.depositGold(bp, chest.loot.gold);
    if (chest.loot.grantsKey) e.keys.add(chest.loot.grantsKey);
    e.lootedChests.add(chestId);
    this.sysMessage(e.id, `Você abriu ${label}.`);
  }

  /** Peso TOTAL que o jogador carrega: equipamento + bolso (itens + ouro).
   *  ✏️ aninhados (mochila dentro de mochila) entram quando o nesting existir. */
  private carriedWeight(e: SimEntity): number {
    let w = 0;
    for (const instId of Object.values(e.equipment)) {
      if (instId == null) continue;
      const t = getItemTemplate(this.items.get(instId)?.templateId ?? "");
      if (t) w += t.weight;
    }
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (bp) {
      for (const s of bp.slots) {
        if (!s || s.kind === "gold") continue;
        const t = getItemTemplate(this.items.get(s.instanceId)?.templateId ?? "");
        if (t) w += t.weight;
      }
      // ouro: peso COM TETO (150 moedas) — soma o total, não por slot
      w += goldWeight(this.containers.totalGold(bp));
    }
    return w;
  }

  /** Cap máximo do jogador (derivado da Força). Infinity se não tem progressão. */
  private maxCarryOf(e: SimEntity): number {
    const prog = this.progressions.get(e.id);
    return prog ? maxCarry(prog.attributes, prog.cls, prog.level) : Infinity;
  }

  /** Um `ItemRef` aponta para algo que o jogador JÁ carrega? (equip ou bolso) */
  private refIsCarried(e: SimEntity, ref: ItemRef): boolean {
    return ref.kind === "equip" || ref.containerId === e.backpackContainerId;
  }

  // ── Comércio (loja de NPC) — toda regra na sim; o client só envia comandos ──

  /** O NPC da loja aberta ainda é válido e está ao alcance? Retorna-o ou null. */
  private shopNpc(e: SimEntity): SimEntity | null {
    if (!e.activeShop) return null;
    const npc = this.entities.get(e.activeShop.npcEntityId);
    if (!npc || npc.kind !== "npc" || !npc.npcKey || !COMMERCE[npc.npcKey]) return null;
    if (npc.z !== e.z || chebyshev(e.pos, npc.pos) > 3) return null; // mesmo alcance da conversa
    return npc;
  }

  /** Abre a loja de um NPC mercador próximo (mesmo alcance/regra do `talk`). */
  private openShop(e: SimEntity, npcId: number): void {
    const npc = this.entities.get(npcId);
    if (!npc || npc.kind !== "npc" || !npc.npcKey || !COMMERCE[npc.npcKey]) return;
    if (npc.z !== e.z || chebyshev(e.pos, npc.pos) > 3) return;
    e.activeShop = { npcEntityId: npc.id };
    e.activeDialogue = null; // loja e diálogo são mutuamente exclusivos
  }

  /** Compra 1 unidade do sortimento: ouro do bolso → instância nova no bolso. */
  /**
   * Rito de classe (classless → classe escolhida). Gate quest+gold, UMA VIA
   * (decisão criador). Troca o inato preservando os pontos alocados
   * (`applyRitoTransition`), concede o kit inicial da classe e recalcula os
   * pools pela classe no nível ATUAL. Os ITENS do jogador permanecem (o rito dá
   * identidade — corpo/atributos/kit —, não equipamento).
   */
  private performRito(e: SimEntity, prog: Progression, target: PlayerClass): void {
    const NAMES: Record<PlayerClass, string> = {
      knight: "Cavaleiro", mage: "Mago", rogue: "Ladino", priest: "Sacerdote", classless: "Sem Classe",
    };
    if (prog.cls !== "classless") {
      this.sysMessage(e.id, "Você já trilhou seu caminho — o rito é uma só vez.");
      return;
    }
    if (target === "classless") return;
    // Gate de quest (quando wirado): exige a trilha do rito concluída.
    const reqQuest = RITO_QUEST_BY_CLASS[target];
    if (reqQuest && e.quests.get(reqQuest)?.stage !== "completed") {
      this.sysMessage(e.id, "O rito desta classe ainda não está ao seu alcance.");
      return;
    }
    // Gate de gold (ouro é item no bolso).
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (!bp || this.containers.totalGold(bp) < RITO_COST_GOLD) {
      this.sysMessage(e.id, `O rito custa ${RITO_COST_GOLD} de ouro.`);
      return;
    }
    if (!applyRitoTransition(prog, target)) return;
    // Condutas de Caminho contam DA aquisição da classe; ratio `sinceClass` zera aqui.
    this.tracking.onClassAcquired(e.id);
    this.containers.withdrawGold(bp, RITO_COST_GOLD);
    // Concede o kit inicial da classe (skills já conhecidas permanecem).
    for (const sk of STARTER_KITS[target]) {
      if (!e.knownSkills.includes(sk)) e.knownSkills.push(sk);
    }
    // O rito ENTREGA a arma do kit (DESIGN-EVOLUCAO §Classes): equipa a arma
    // inicial da classe. A Espada Cega de nascimento é CONSUMIDA pelo rito; se o
    // jogador já a trocou por outra arma, essa vai pro bolso (não sobrescreve a
    // escolha dele) — e só se perde no caso raro de bolso cheio.
    const kitWeapon = this.items.create(STARTER_WEAPON_BY_CLASS[target]);
    const prevId = e.equipment.hand1 ?? null;
    const prevIsBirthBlade =
      prevId != null && this.items.get(prevId)?.templateId === STARTER_WEAPON_BY_CLASS.classless;
    const bp2 = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (prevId != null && !prevIsBirthBlade && bp2 && this.containers.freeSlot(bp2) >= 0) {
      this.containers.add(bp2, { kind: "item", instanceId: prevId });
    }
    e.equipment.hand1 = kitWeapon.id;
    this.afterEquipChange(e); // sincroniza equippedWeaponId + derivados de combate
    // Pools recalculam pela classe no nível atual (clamp, sem cura grátis).
    syncMaxResources(e, prog, false);
    this.sysMessage(e.id, `O rito se completa. Você agora é ${NAMES[target]}.`);
  }

  private buyItem(e: SimEntity, templateId: string): void {
    const npc = this.shopNpc(e);
    if (!npc || !npc.npcKey) return;
    const entry = availableSells(npc.npcKey, e.quests).find((s) => s.templateId === templateId);
    if (!entry) return; // não vende isso (ou ainda travado por quest)
    const tpl = getItemTemplate(templateId);
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (!tpl || !bp) return;
    if (this.containers.totalGold(bp) < entry.price) {
      this.sysMessage(e.id, "Ouro insuficiente.");
      return;
    }
    if (this.containers.freeSlot(bp) < 0) {
      this.sysMessage(e.id, "Sua mochila está cheia.");
      return;
    }
    // Peso: pagar ouro alivia (com teto de 150), ganhar o item adiciona. Saldo marginal.
    const cur = this.containers.totalGold(bp);
    const goldRelief = goldWeight(cur) - goldWeight(cur - entry.price);
    if (this.carriedWeight(e) - goldRelief + tpl.weight > this.maxCarryOf(e)) {
      this.sysMessage(e.id, "Pesado demais — sem capacidade de carga.");
      return;
    }
    this.containers.withdrawGold(bp, entry.price);
    const inst = this.items.create(templateId);
    this.containers.add(bp, { kind: "item", instanceId: inst.id });
    this.sysMessage(e.id, `Você comprou ${tpl.name} por ${entry.price} de ouro.`);
  }

  /** Vende uma instância do bolso à loja: o item some, o ouro entra (funde). */
  private sellItem(e: SimEntity, instanceId: number): void {
    const npc = this.shopNpc(e);
    if (!npc || !npc.npcKey) return;
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (!bp) return;
    const slot = bp.slots.findIndex((s) => s?.kind === "item" && s.instanceId === instanceId);
    if (slot < 0) return; // precisa estar no bolso (não equipado, não em cadáver)
    const inst = this.items.get(instanceId);
    if (!inst) return;
    const entry = availableBuys(npc.npcKey, e.quests).find((b) => b.templateId === inst.templateId);
    if (!entry) {
      this.sysMessage(e.id, "Ele não compra isso.");
      return;
    }
    bp.slots[slot] = null;
    this.containers.depositGold(bp, entry.price);
    const tpl = getItemTemplate(inst.templateId);
    this.sysMessage(e.id, `Você vendeu ${tpl?.name ?? "item"} por ${entry.price} de ouro.`);
  }

  /**
   * Usa um consumível que o jogador carrega (comida/poção). Resolve a instância
   * pelo `ItemRef`, lê o efeito do TEMPLATE (dados, não código por item) e aplica:
   *  - `heal`: cura instantânea (clamp no maxHp) + exausto compartilhado; não
   *     consome se HP já cheio (anti-misclick) nem durante o exausto.
   *  - `food`: aplica/estende "Bem Alimentado" (multiplica o regen por duração).
   * Consome 1 unidade no sucesso. Item sem efeito de uso = ignorado.
   */
  private useItem(e: SimEntity, ref: ItemRef): void {
    // Resolve a instância carregada + como removê-la (consumir 1) ao usar.
    let instanceId: number | null = null;
    let consume: (() => void) | null = null;
    if (ref.kind === "container") {
      if (!this.containerAccessible(e, ref.containerId)) return;
      const c = this.containers.get(ref.containerId);
      const content = c?.slots[ref.slot];
      if (!c || !content || content.kind !== "item") return;
      instanceId = content.instanceId;
      consume = () => { c.slots[ref.slot] = null; };
    } else if (ref.kind === "equip") {
      const id = e.equipment[ref.slot];
      if (id == null) return;
      instanceId = id;
      consume = () => { delete e.equipment[ref.slot]; };
    }
    if (instanceId == null || !consume) return;
    const templateId = this.items.get(instanceId)?.templateId ?? "";
    const tpl = getItemTemplate(templateId);
    const effect = tpl?.consume;
    if (!tpl || !effect) return; // nada de efeito de uso → ignora

    if (effect.kind === "heal") {
      const now = this.now();
      if (now < e.nextItemUseAt) {
        this.sysMessage(e.id, "Você ainda está exausto.");
        return;
      }
      if (e.hp >= e.maxHp) {
        this.sysMessage(e.id, "Você já está com a vida cheia.");
        return; // não desperdiça por clique acidental
      }
      const before = e.hp;
      e.hp = Math.min(e.maxHp, e.hp + effect.hp);
      const healed = e.hp - before;
      // Feedback de cura (número verde) — mesmo formato do snapshot-event de skill.
      this.pendingChat.push({
        kind: "heal", skillId: null, casterId: e.id, targetId: e.id,
        amount: healed, pos: { x: e.pos.x, y: e.pos.y },
      });
      e.nextItemUseAt = now + this.quantizeToTickMs(effect.exhaustMs);
      consume();
      this.emitConsume(e, "potion", templateId);
      this.sysMessage(e.id, `Você usou ${tpl.name}.`);
      return;
    }

    // effect.kind === "food": saciedade (buff de regen por duração).
    applyFood(e, this.tickCount, { regenMult: effect.regenMult, durationMs: effect.durationMs });
    // Comida preparada: buff de stat temporário ("Saciado") — status à parte.
    if (effect.buffs && effect.buffs.length > 0) {
      applyMealBuff(e, this.tickCount, { buffs: effect.buffs, durationMs: effect.durationMs });
    }
    consume();
    this.emitConsume(e, "food", templateId);
    this.sysMessage(e.id, `Você comeu ${tpl.name}.`);
  }

  /** Emite `consume` no bus (Gourmet/Survivalista). */
  private emitConsume(e: SimEntity, kind: "food" | "potion", templateId: string): void {
    this.bus.emit("consume", {
      entity: { id: e.id, species: e.species, family: e.family },
      kind,
      itemTemplateId: templateId,
      context: { tick: this.tickCount, night: false },
    });
  }

  /** Quantas instâncias de `templateId` o jogador tem no bolso. */
  private countInBolso(bp: Container, templateId: string): number {
    let n = 0;
    for (const s of bp.slots) {
      if (s?.kind === "item" && this.items.get(s.instanceId)?.templateId === templateId) n++;
    }
    return n;
  }

  /** Remove `qty` instâncias de `templateId` do bolso (libera os slots). */
  private removeFromBolso(bp: Container, templateId: string, qty: number): void {
    let left = qty;
    for (let i = 0; i < bp.slots.length && left > 0; i++) {
      const s = bp.slots[i];
      if (s?.kind === "item" && this.items.get(s.instanceId)?.templateId === templateId) {
        bp.slots[i] = null;
        left--;
      }
    }
  }

  /**
   * Cozinha uma receita (COZINHA.md): valida posse dos inputs no bolso, consome
   * (incl. vasilhame) e produz 1 unidade do prato. Os gates de calor/água-doce
   * entram na Task 3; o buff do prato na Task 4. Receita = conhecimento (gate de
   * quest opcional), nunca skill com nível.
   */
  private cookRecipe(e: SimEntity, recipeId: string): void {
    const recipe = RECIPES[recipeId];
    if (!recipe) return;
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (!bp) return;
    // Gate de quest (se a receita pedir): precisa tê-la completado.
    if (recipe.unlockQuest) {
      const st = e.quests.get(recipe.unlockQuest);
      if (!st || st.stage !== "completed") {
        this.sysMessage(e.id, "Você ainda não conhece essa receita.");
        return;
      }
    }
    // Gates espaciais (COZINHA.md): fonte de calor e/ou água-doce por perto.
    if (recipe.needsHeat && !this.world.nearHeat(e.pos.x, e.pos.y, e.z)) {
      this.sysMessage(e.id, "Você precisa de uma fonte de calor (fogueira/fogão) por perto.");
      return;
    }
    if (recipe.needsFreshWater && !this.world.nearFreshWater(e.pos.x, e.pos.y, e.z)) {
      this.sysMessage(e.id, "Você precisa de água-doce (um poço) por perto — água do mar não serve.");
      return;
    }
    // Posse de todos os inputs (por templateId/qty).
    for (const inp of recipe.inputs) {
      if (this.countInBolso(bp, inp.templateId) < inp.qty) {
        this.sysMessage(e.id, "Faltam ingredientes para a receita.");
        return;
      }
    }
    // Consome os inputs (libera ≥1 slot) e produz o prato no bolso.
    for (const inp of recipe.inputs) this.removeFromBolso(bp, inp.templateId, inp.qty);
    const inst = this.items.create(recipe.output);
    this.containers.add(bp, { kind: "item", instanceId: inst.id });
    const tpl = getItemTemplate(recipe.output);
    this.sysMessage(e.id, `Você preparou ${tpl?.name ?? recipe.name}.`);
  }

  /** Saque rápido de ouro (shift/alt+clique): move a pilha pro bolso (funde). */
  private lootGold(e: SimEntity, containerId: number, slot: number): void {
    if (!this.containerAccessible(e, containerId)) return;
    if (containerId === e.backpackContainerId) return; // já está no bolso
    const c = this.containers.get(containerId);
    const content = c?.slots[slot];
    if (!c || !content || content.kind !== "gold") return;
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    if (!bp) return;
    // Ouro pesa SÓ até 150 moedas: acima disso, ouro extra é sem peso → pega tudo.
    const cur = this.containers.totalGold(bp);
    let want: number;
    if (cur >= GOLD_WEIGHT_CAP_COINS) {
      want = content.amount; // já no teto: ouro extra não pesa
    } else {
      const heavyRoom = GOLD_WEIGHT_CAP_COINS - cur;
      const budget = this.maxCarryOf(e) - this.carriedWeight(e);
      const affordableHeavy = Math.floor(budget / GOLD_WEIGHT_PER_COIN);
      want = affordableHeavy >= heavyRoom ? content.amount : Math.min(content.amount, affordableHeavy);
    }
    if (want <= 0) {
      this.sysMessage(e.id, "Pesado demais — sem capacidade de carga.");
      return;
    }
    const leftover = this.containers.depositGold(bp, want);
    const took = want - leftover;
    if (took <= 0) {
      this.sysMessage(e.id, "Sua mochila está cheia.");
      return;
    }
    content.amount -= took;
    if (content.amount <= 0) c.slots[slot] = null;
    this.sysMessage(e.id, `Você pegou ${took} de ouro.`);
  }

  /**
   * Drag & drop autoritativo. Wave 1: item⇄container (slot vazio) e
   * container⇄equipamento (hand1/hand2/armor). Ouro = pilha que move/funde.
   */
  private moveItem(e: SimEntity, from: ItemRef, to: ItemRef): void {
    // origem
    if (from.kind === "container") {
      if (!this.containerAccessible(e, from.containerId)) return;
      const c = this.containers.get(from.containerId);
      const content = c?.slots[from.slot];
      if (!c || !content) return;
      // CAP: trazer peso NOVO (de fora do que carrego) pro que carrego? Mover
      // entre minhas próprias coisas (bolso↔equip) não muda o total — sempre ok.
      if (!this.refIsCarried(e, from) && this.refIsCarried(e, to)) {
        let added: number;
        if (content.kind === "gold") {
          // peso marginal do ouro (com teto de 150 moedas)
          const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
          const cur = bp ? this.containers.totalGold(bp) : 0;
          added = goldWeight(cur + content.amount) - goldWeight(cur);
        } else {
          added = getItemTemplate(this.items.get(content.instanceId)?.templateId ?? "")?.weight ?? 0;
        }
        if (this.carriedWeight(e) + added > this.maxCarryOf(e)) {
          this.sysMessage(e.id, "Pesado demais — sem capacidade de carga.");
          return;
        }
      }
      if (content.kind === "gold") {
        // arrastar ouro: move/funde a pilha no slot de destino (não equipa).
        if (to.kind !== "container" || !this.containerAccessible(e, to.containerId)) return;
        const dst = this.containers.get(to.containerId);
        if (!dst || to.slot >= dst.capacity) return;
        const tgt = dst.slots[to.slot];
        if (tgt == null) {
          dst.slots[to.slot] = content;
          c.slots[from.slot] = null;
        } else if (tgt.kind === "gold") {
          tgt.amount += content.amount;
          c.slots[from.slot] = null;
        }
        return;
      }
      const inst = this.items.get(content.instanceId);
      if (!inst) return;
      if (to.kind === "container") {
        if (!this.containerAccessible(e, to.containerId)) return;
        const dst = this.containers.get(to.containerId);
        if (!dst || dst.slots[to.slot] !== null || to.slot >= dst.capacity) return;
        dst.slots[to.slot] = content;
        c.slots[from.slot] = null;
        return;
      }
      // container → equipamento
      if (!this.slotAccepts(to.slot, inst.templateId)) return;
      if (e.equipment[to.slot] != null) return; // slot ocupado (swap ✏️ wave 2)
      c.slots[from.slot] = null;
      e.equipment[to.slot] = inst.id;
      this.emitEquip(e, "equip", to.slot, inst.id);
      this.afterEquipChange(e);
      return;
    }
    // origem: equipamento
    const instId = e.equipment[from.slot];
    if (instId == null) return;
    if (to.kind === "container") {
      if (!this.containerAccessible(e, to.containerId)) return;
      const dst = this.containers.get(to.containerId);
      if (!dst || dst.slots[to.slot] !== null || to.slot >= dst.capacity) return;
      dst.slots[to.slot] = { kind: "item", instanceId: instId };
      this.emitEquip(e, "unequip", from.slot, instId);
      delete e.equipment[from.slot];
      this.afterEquipChange(e);
      return;
    }
    // equip → equip (ex.: hand1 → hand2)
    const inst = this.items.get(instId);
    if (!inst || !this.slotAccepts(to.slot, inst.templateId)) return;
    if (e.equipment[to.slot] != null) return;
    delete e.equipment[from.slot];
    e.equipment[to.slot] = instId;
    this.afterEquipChange(e);
  }

  /** O template cabe neste slot de equipamento? (mapeamento DESIGN-ITENS) */
  private slotAccepts(slot: EquipSlot, templateId: string): boolean {
    const t = getItemTemplate(templateId);
    if (!t) return false;
    if (t.slot === "weapon" || t.slot === "shield") return slot === "hand1" || slot === "hand2";
    if (t.slot === "armor") return slot === "armor";
    if (t.slot === "helmet") return slot === "helmet";
    if (t.slot === "legs") return slot === "legs";
    if (t.slot === "boots") return slot === "boots";
    return false;
  }

  /** Emite `equip`/`unequip` no bus (destrava condutas: Pele de Ferro/Mão Vazia). */
  private emitEquip(e: SimEntity, action: "equip" | "unequip", slot: EquipSlot, instId: number): void {
    if (e.kind !== "player") return;
    const templateId = this.items.get(instId)?.templateId ?? "";
    const tpl = getItemTemplate(templateId);
    if (!tpl) return;
    this.bus.emit("equip", {
      entity: { id: e.id, species: e.species, family: e.family },
      action,
      slot,
      itemCategory: tpl.slot ?? "",
      itemTemplateId: templateId,
      context: { tick: this.tickCount, night: false },
    });
  }

  /** Pós-equip: arma de mão sincroniza o combate (equippedWeaponId) + derivados. */
  private afterEquipChange(e: SimEntity): void {
    const handInst = e.equipment.hand1 ?? e.equipment.hand2 ?? null;
    const inst = handInst != null ? this.items.get(handInst) : null;
    const t = inst ? getItemTemplate(inst.templateId) : null;
    e.equippedWeaponId = t?.slot === "weapon" ? inst!.id : null;
    const prog = this.progressions.get(e.id);
    if (prog) this.recomputePlayerDerived(e, prog);
  }

  /** Cadáveres: decai vencidos; afastou → fecha a janela do jogador. */
  private pruneCorpsesAndContainers(): void {
    const expired = this.corpses.filter((c) => this.tickCount >= c.decayAtTick);
    if (expired.length > 0) {
      for (const c of expired) this.containers.remove(c.containerId);
      this.corpses = this.corpses.filter((c) => this.tickCount < c.decayAtTick);
    }
    for (const e of this.entities.values()) {
      if (e.kind !== "player" || e.openContainers.size === 0) continue;
      for (const cid of [...e.openContainers]) {
        if (!this.containerAccessible(e, cid)) e.openContainers.delete(cid);
      }
    }
  }

  private facingToward(from: Vec2, to: Vec2): SimEntity["facing"] {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
    return dy >= 0 ? "s" : "n";
  }

  /** Processa entidades mortas: jogador respawna, monstro vira respawn pendente. */
  private resolveDeaths(now: number): void {
    for (const e of [...this.entities.values()]) {
      if (!e.dead) continue;
      if (e.kind === "player") {
        // Fecha a sessão de combate como MORTE (combat_end) antes do respawn.
        this.endCombatSession(e.id, "death", now);
        // Penalidade de morte (macro do MVP): perde 10% do XP TOTAL ANTES do
        // refill do respawn — pode dar level-down (o teto de recursos desce, e o
        // refill abaixo enche já no novo máximo). Se o nível caiu, dano/cooldown
        // derivados podem mudar, então recomputamos antes de encher.
        const prog = this.progressions.get(e.id);
        if (prog) {
          const { leveledDown } = applyDeathPenalty(prog, e);
          if (leveledDown) this.recomputePlayerDerived(e, prog);
        }
        // Respawn SEMPRE na superfície (z=0, o "templo"/spawn) — a morte tira do
        // andar atual: morrer no esgoto não pode renascer no esgoto (SISTEMA-ANDARES).
        // Reseta o z ANTES de achar tile livre (canEnter avalia em mover.z) e remove
        // a ocupação no andar de origem na mão — moveTo usaria o z já trocado e
        // deixaria uma chave fantasma no andar de baixo.
        const fromKey = this.tileKey(e.pos.x, e.pos.y, e.z);
        if (this.occupancy.get(fromKey) === e.id) this.occupancy.delete(fromKey);
        e.z = 0;
        // respawn no SANTUÁRIO (GRID §3.3), não na casa-tutorial do nascimento
        const sp = this.nearestFree(e, this.world.map.respawn ?? e.spawnPos);
        e.pos = { x: sp.x, y: sp.y };
        this.occupancy.set(this.tileKey(sp.x, sp.y, e.z), e.id);
        e.hp = e.maxHp;
        e.mp = e.maxMp;
        e.dead = false;
        e.intent = null;
        e.targetId = null;
        e.casting = null; // morte cancela qualquer conjuração em andamento
        e.nextMoveAt = now;
        e.nextAttackAt = now;
        // limpa o aggro dos monstros sobre este jogador
        for (const m of this.entities.values()) {
          if (m.targetId === e.id) {
            m.targetId = null;
            m.ai = "idle";
            m.intent = null;
          }
        }
      } else if (e.kind === "monster") {
        const template = e.species ? CREATURES[e.species] : undefined;
        // Cadáver-container (decidido jun/2026): corpo clicável com o loot.
        if (template) {
          const c = this.containers.create(`Corpo de ${template.name}`, 4);
          if (template.loot) {
            const lt = template.loot;
            if (lt.gold) {
              const g = lt.gold.min +
                Math.floor(this.lootRng() * (lt.gold.max - lt.gold.min + 1));
              if (g > 0) this.containers.add(c, { kind: "gold", amount: g });
            }
            // Drops de item: cada um rolado por sua chance (RNG de loot da sim).
            for (const drop of lt.items ?? []) {
              if (this.lootRng() < drop.chance) {
                const inst = this.items.create(drop.templateId);
                this.containers.add(c, { kind: "item", instanceId: inst.id });
              }
            }
          }
          this.corpses.push({
            id: this.nextCorpseId++,
            containerId: c.id,
            pos: { x: e.pos.x, y: e.pos.y },
            z: e.z,
            species: e.species,
            name: c.name,
            decayAtTick: this.tickCount + 3600, // ~3min (✏️ DESIGN-ITENS)
          });
        }
        if (template) {
          this.respawns.push({
            template,
            pos: { x: e.spawnPos.x, y: e.spawnPos.y },
            z: e.z,
            respawnMs: e.respawnMs,
            atTick: this.tickCount + msToTicks(e.respawnMs ?? template.respawnMs),
          });
        }
        // limpa qualquer jogador que mirava nele
        for (const p of this.entities.values()) {
          if (p.targetId === e.id) p.targetId = null;
        }
        this.entities.delete(e.id);
      }
    }

    // respawns vencidos
    if (this.respawns.length > 0) {
      const remaining: PendingRespawn[] = [];
      for (const r of this.respawns) {
        if (this.tickCount >= r.atTick) {
          // Ponto de spawn ocupado (alguém parado nele) → adia 1s em vez de
          // spawnar empilhado. Zona segura também adia: mob não nasce nela.
          const free =
            this.world.isWalkable(r.pos.x, r.pos.y, r.z) &&
            !this.world.isSafeZone(r.pos.x, r.pos.y, r.z) &&
            !this.occupancy.has(this.tileKey(r.pos.x, r.pos.y, r.z));
          if (free) this.spawnMonster(r.template, r.pos, r.z, r.respawnMs);
          else remaining.push({ ...r, atTick: this.tickCount + 20 });
        } else {
          remaining.push(r);
        }
      }
      this.respawns = remaining;
    }
  }

  /** Passo na direção (WASD). Com "slide": diagonal bloqueada tenta os eixos. */
  private stepInDirection(e: SimEntity, dir: Dir8, now: number): void {
    e.facing = facingFromDir(dir);
    const candidates: Dir8[] = [dir];
    if (isDiagonal(dir)) {
      candidates.push(dir[1] as Dir8, dir[0] as Dir8); // ex.: "ne" → "e", "n"
    }
    for (const d of candidates) {
      if (this.tryStep(e, d, now)) return;
    }
  }

  private stepAlongPath(e: SimEntity, now: number): void {
    if (e.intent?.kind !== "path") return;
    const next = e.intent.path[0];
    if (!next) {
      e.intent = null;
      return;
    }
    const dir = dirFromDelta(next.x - e.pos.x, next.y - e.pos.y);
    if (!dir) {
      // Path dessincronizado (não deveria acontecer) — recalcula.
      const path = findPath(this.world, e.pos, e.intent.goal, { isBlocked: this.blockedFor(e), z: e.z });
      e.intent = path && path.length > 0 ? { kind: "path", path, goal: e.intent.goal } : null;
      return;
    }
    if (this.tryStep(e, dir, now)) {
      // Se o passo caiu num portal, `tryStep` transicionou de andar e JÁ zerou
      // o intent (auto-walk não atravessa andar) — o path antigo é de outro
      // andar; não mexer nele.
      if (e.intent?.kind === "path") {
        e.intent.path.shift();
        if (e.intent.path.length === 0) e.intent = null;
      }
    } else if (e.intent.path.length === 1) {
      // O único passo restante é o tile-objetivo, ocupado por alguém parado
      // nele: chegou "o mais perto possível" — para, em vez de re-pathear
      // para sempre contra um bloqueio que não vai sumir.
      e.intent = null;
    } else {
      // Bloqueio dinâmico (outra criatura entrou no tile) — recalcula por volta.
      const path = findPath(this.world, e.pos, e.intent.goal, { isBlocked: this.blockedFor(e), z: e.z });
      e.intent = path && path.length > 0 ? { kind: "path", path, goal: e.intent.goal } : null;
    }
  }

  /**
   * Alinha uma duração à grade de ticks. A sim só age em fronteiras de tick —
   * durações desalinhadas mentem: um stepMs de 220 viraria cadência real de
   * 250 (tween do client termina antes → frame morto, movimento truncado), e
   * um attackCooldownMs de 1875 viraria 1900 efetivos (DPS real ≠ fórmula, o
   * balance calibraria em cima de número falso). Quantizado, o número que a
   * sim/snapshot informam É o comportamento exato.
   */
  private quantizeToTickMs(raw: number): number {
    return Math.max(TICK_MS, Math.round(raw / TICK_MS) * TICK_MS);
  }

  /** Tenta executar um passo. Retorna true se moveu. */
  private tryStep(e: SimEntity, dir: Dir8, now: number): boolean {
    const v = DIR_VECTORS[dir];
    const nx = e.pos.x + v.x;
    const ny = e.pos.y + v.y;
    // Bloqueio de corpo: tile precisa estar andável E livre (canEnter).
    // Diagonal estilo Tibia (decidido jun/2026): só o destino importa —
    // cortar quina é permitido (mesma regra do A* em pathfinding.ts).
    if (!this.canEnter(e, nx, ny)) return false;
    // Mover CANCELA a conjuração em andamento (decisão do task: move OU tomar dano).
    if (e.casting) this.cancelCast(e);
    this.moveTo(e, nx, ny);
    e.facing = facingFromDir(dir);
    e.stepMs = this.quantizeToTickMs(e.baseStepMs * (isDiagonal(dir) ? DIAGONAL_FACTOR : 1));
    e.nextMoveAt = now + e.stepMs;
    e.justMoved = true;
    // Portal ao pisar (só players no MVP — monstros não trocam de andar). A
    // checagem fica AQUI (no passo andado); a chegada via `transition` não
    // re-dispara, então escada bidirecional não fica em loop. SISTEMA-ANDARES §3.
    if (e.kind === "player") {
      const portal = this.world.portalAt(nx, ny, e.z);
      if (portal?.to) {
        // Escada: desce em QUALQUER passo. Boeiro/buraco: só desce se ESTE tile
        // era o destino do clique (intent.goal) — andar por cima de passagem NÃO
        // derruba; tem que clicar no boeiro pra descer (pedido do criador).
        const clicked = e.intent?.kind === "path" && e.intent.goal.x === nx && e.intent.goal.y === ny;
        if (portal.kind === "stairs" || clicked) this.transition(e, portal.to);
      }
    }
    return true;
  }

  /** Projeta a progressão da sim no formato serializável do snapshot. */
  private projectProgress(prog: Progression): PlayerProgressState {
    return {
      cls: prog.cls,
      gold: 0, // total carregado: somado do bolso no emitSnapshot (ouro = item)
      cap: { current: 0, max: maxCarry(prog.attributes, prog.cls, prog.level) }, // current no emitSnapshot
      level: prog.level,
      xp: prog.xp,
      xpForNextLevel: xpForLevel(prog.level + 1),
      xpLevelFloor: xpForLevel(prog.level),
      attributes: { ...prog.attributes },
      freeStatPoints: prog.freeStatPoints,
      // Custo do próximo ponto por atributo (custo por faixa — o client exibe).
      statPointCosts: {
        strength: statPointCost(prog.attributes.strength),
        dexterity: statPointCost(prog.attributes.dexterity),
        intelligence: statPointCost(prog.attributes.intelligence),
        vitality: statPointCost(prog.attributes.vitality),
        spirit: statPointCost(prog.attributes.spirit),
      },
    };
  }

  /** Projeta as skills conhecidas do jogador (id, cooldown restante ms, custo). */
  /** Projeta as receitas de cozinha + se o jogador pode fazer cada uma agora. */
  private projectRecipes(e: SimEntity): RecipeView[] {
    const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
    const out: RecipeView[] = [];
    for (const r of Object.values(RECIPES)) {
      const inputs = r.inputs.map((i) => ({ name: getItemTemplate(i.templateId)?.name ?? i.templateId, qty: i.qty }));
      let reason: string | undefined;
      if (r.unlockQuest) {
        const st = e.quests.get(r.unlockQuest);
        if (!st || st.stage !== "completed") reason = "Receita desconhecida";
      }
      if (!reason && bp) {
        for (const i of r.inputs) {
          if (this.countInBolso(bp, i.templateId) < i.qty) { reason = "Faltam ingredientes"; break; }
        }
      }
      if (!reason && r.needsHeat && !this.world.nearHeat(e.pos.x, e.pos.y, e.z)) reason = "Sem fonte de calor por perto";
      if (!reason && r.needsFreshWater && !this.world.nearFreshWater(e.pos.x, e.pos.y, e.z)) reason = "Sem água-doce por perto";
      out.push({ id: r.id, name: r.name, canCook: !reason, inputs, reason });
    }
    return out;
  }

  private projectSkills(e: SimEntity): KnownSkillState[] {
    const out: KnownSkillState[] = [];
    for (const id of e.knownSkills) {
      const def = SKILLS[id];
      if (!def) continue;
      const readyAt = e.skillCooldowns[id] ?? 0;
      const remainingTicks = Math.max(0, readyAt - this.tickCount);
      out.push({ id, cooldownMs: remainingTicks * TICK_MS, manaCost: def.manaCost });
    }
    return out;
  }

  /**
   * Projeta a arma equipada do jogador (só a IDENTIDADE — DESIGN-EVOLUCAO.md
   * §"mínimo para a HUD futura"). O LEDGER é OCULTO por design (Marcas secretas)
   * e NUNCA entra no snapshot.
   */
  private projectWeapon(e: SimEntity): EquippedWeaponState | undefined {
    if (e.equippedWeaponId == null) return undefined;
    const inst = this.items.get(e.equippedWeaponId);
    if (!inst) return undefined;
    const tpl = getItemTemplate(inst.templateId);
    return { instanceId: inst.id, templateId: inst.templateId, name: tpl?.name ?? inst.templateId };
  }

  private emitSnapshot(events: SnapshotEvent[]): void {
    const entities: EntityState[] = [];
    for (const e of this.entities.values()) {
      const state: EntityState = {
        id: e.id,
        kind: e.kind,
        name: e.name,
        species: e.species,
        pos: { x: e.pos.x, y: e.pos.y },
        z: e.z,
        facing: e.facing,
        stepMs: e.stepMs,
        moving: e.justMoved,
        hp: e.hp,
        maxHp: e.maxHp,
        mp: e.mp,
        maxMp: e.maxMp,
        status: projectStatus(e, this.tickCount),
      };
      // Telegraph de mecânica (MECANICAS-DE-MOB.md): move em windup — info PÚBLICA
      // por design (o client DEVE poder desenhar o aviso). ≠ condição secreta.
      if (e.activeMove) {
        state.telegraph = {
          moveId: e.activeMove.def.id,
          kind: e.activeMove.def.kind,
          resolveAt: e.activeMove.resolveAt,
          tiles: e.activeMove.targetTiles, // área de perigo (slam) p/ o client desenhar
        };
      }
      // Conjuração em andamento (cast-time) — info pública p/ a barra de cast.
      // pct = progresso 0..1 (start→end), clampado.
      if (e.casting) {
        const span = e.casting.endTick - e.casting.startTick;
        const pct = span > 0 ? Math.min(1, Math.max(0, (this.tickCount - e.casting.startTick) / span)) : 1;
        state.casting = { skillId: e.casting.skillId, pct };
        // aim do chão (groundTarget): deixa o client telegrafar a ÁREA-alvo
        if (e.casting.aim) state.casting.aim = { x: e.casting.aim.x, y: e.casting.aim.y };
      }
      const prog = this.progressions.get(e.id);
      if (prog) state.progress = this.projectProgress(prog);
      if (e.kind === "player") {
        state.skills = this.projectSkills(e);
        state.recipes = this.projectRecipes(e);
        const weapon = this.projectWeapon(e);
        if (weapon) state.weapon = weapon;
        if (e.outfit) state.outfit = structuredCloneOutfit(e.outfit);
        state.wardrobe = [...e.wardrobe];
        // Alvo selecionado é POR-JOGADOR: vai na própria entidade, não no topo
        // do snapshot — cada client lê o targetId da SUA entidade (pronto pro
        // online, sem o alvo do "primeiro player" vazar para os demais).
        state.targetId = e.targetId;
        // Ouro = total carregado (soma das pilhas no bolso — modelo Tibia jun/2026).
        if (state.progress) {
          const bp = e.backpackContainerId != null ? this.containers.get(e.backpackContainerId) : null;
          state.progress.gold = bp ? this.containers.totalGold(bp) : 0;
          // Cap: peso atual carregado (equip + bolso + ouro).
          state.progress.cap.current = Math.round(this.carriedWeight(e) * 10) / 10;
        }
        if (e.backpackContainerId != null) state.backpackContainerId = e.backpackContainerId;
        // equipamento (11 slots — só os preenchidos)
        const equipView: NonNullable<EntityState["equipment"]> = {};
        for (const [slot, instId] of Object.entries(e.equipment)) {
          const inst = instId != null ? this.items.get(instId) : null;
          const t = inst ? getItemTemplate(inst.templateId) : null;
          if (inst && t) {
            equipView[slot as EquipSlot] = { instanceId: inst.id, templateId: t.id, name: t.name };
          }
        }
        state.equipment = equipView;
        // containers abertos (mochila/bolso entra sempre que aberto + cadáveres)
        const views: ContainerView[] = [];
        const pushView = (cid: number) => {
          const c = this.containers.get(cid);
          if (!c) return;
          const items: ContainerView["items"] = [];
          const goldPiles: ContainerView["goldPiles"] = [];
          c.slots.forEach((s, i) => {
            if (!s) return;
            if (s.kind === "gold") goldPiles.push({ slot: i, amount: s.amount });
            else {
              const inst = this.items.get(s.instanceId);
              const t = inst ? getItemTemplate(inst.templateId) : null;
              if (inst && t) items.push({ slot: i, instanceId: inst.id, templateId: t.id, name: t.name });
            }
          });
          views.push({ containerId: c.id, name: c.name, capacity: c.capacity, items, goldPiles });
        };
        for (const cid of e.openContainers) pushView(cid);
        // Loja aberta: garante a view do bolso (mesmo sem janela de container
        // aberta) para o client listar os itens vendáveis que o jogador possui.
        if (e.activeShop && e.backpackContainerId != null && !e.openContainers.has(e.backpackContainerId)) {
          pushView(e.backpackContainerId);
        }
        if (views.length > 0) state.containers = views;
        if (e.activeDialogue) {
          const npc = this.entities.get(e.activeDialogue.npcEntityId);
          if (npc) state.dialogue = dialogueView(npc.id, npc.name, e.activeDialogue.view);
          else e.activeDialogue = null;
        }
        if (e.activeShop) {
          const npc = this.shopNpc(e);
          if (npc && npc.npcKey) {
            const toView = (entries: TradeEntry[]): ShopEntryView[] =>
              entries.map((x) => ({
                templateId: x.templateId,
                name: getItemTemplate(x.templateId)?.name ?? x.templateId,
                price: x.price,
              }));
            state.shop = {
              npcId: npc.id,
              npcName: npc.name,
              sells: toView(availableSells(npc.npcKey, e.quests)),
              buys: toView(availableBuys(npc.npcKey, e.quests)),
            };
          } else {
            e.activeShop = null; // NPC sumiu / saiu de alcance → fecha a loja
          }
        }
        if (e.quests.size > 0) {
          state.quests = [...e.quests.entries()].map(([qid, st]) => {
            const def = QUESTS[qid];
            const entry: QuestJournalEntry = {
              id: qid,
              name: def?.name ?? qid,
              entry: st.stage === "completed" ? def?.journalCompleted ?? "" : def?.journalActive ?? "",
              completed: st.stage === "completed",
            };
            // contador SÓ nas diretas com etapa de caça (decisão jun/2026)
            if (def?.layer === "direta" && def.kill && st.stage !== "completed") {
              entry.counter = { cur: st.kills, max: def.kill.count };
            }
            return entry;
          });
        }
      }
      entities.push(state);
    }
    const snap: Snapshot = {
      tick: this.tickCount,
      entities,
      corpses: this.corpses.map((c) => ({
        id: c.containerId, // o client abre por containerId — id único que importa
        pos: { x: c.pos.x, y: c.pos.y },
        z: c.z,
        species: c.species,
        name: c.name,
      })),
      chests: this.chests.map((c) => ({
        id: c.id,
        pos: { x: c.pos.x, y: c.pos.y },
        z: c.z,
        name: c.name ?? "Baú",
      })),
      events,
    };
    for (const cb of this.snapshotListeners) cb(snap);
  }
}
