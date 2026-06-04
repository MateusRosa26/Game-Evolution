import { BASE_WALK_MS, DIAGONAL_FACTOR, TICK_MS } from "../shared/constants";
import type {
  EntityState,
  EquippedWeaponState,
  KnownSkillState,
  PlayerProgressState,
  Snapshot,
  SnapshotEvent,
} from "../shared/protocol";
import type { ClientCommand } from "../shared/protocol";
import {
  DIR_VECTORS,
  dirFromDelta,
  facingFromDir,
  isDiagonal,
  type AttributeKey,
  type Dir8,
  type MapData,
  type PlayerClass,
  type Vec2,
} from "../shared/types";
import { DEFAULT_PLAYER_CLASS, MELEE_RANGE } from "./balance";
import { CREATURES, type CreatureTemplate } from "./bestiary";
import { applyDamage, chebyshev, type CombatCtx, type WeaponSource } from "./combat";
import type { SimEntity } from "./entity";
import { EventBus, type KillEvent } from "./events";
import { attackCooldownMs, physicalDamage, xpForLevel } from "./formulas";
import {
  ItemRegistry,
  attachItemLedger,
  getItemTemplate,
  STARTER_WEAPON_BY_CLASS,
  FISTS_TEMPLATE_ID,
} from "./items";
import { updateChaser } from "./monsterAi";
import {
  SKILLS,
  STARTER_KITS,
  castSkill,
  isKnownSkillId,
  projectStatus,
  tickStatus,
  type SkillCastCtx,
} from "./skills";
import {
  allocateStatPoint,
  createProgression,
  creatureLevelForTier,
  grantKillXp,
  regenTick,
  syncMaxResources,
  type Progression,
} from "./progression";
import { findPath, nearestWalkable } from "./pathfinding";
import { World } from "./World";

/** Respawn pendente de um monstro morto (template + posição). */
interface PendingRespawn {
  template: CreatureTemplate;
  pos: Vec2;
  atTick: number;
}

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
  private entities = new Map<number, SimEntity>();
  private nextId = 1;
  private tickCount = 0;
  private snapshotListeners: ((snap: Snapshot) => void)[] = [];
  private playerIds = new Set<number>();
  private respawns: PendingRespawn[] = [];
  /** Progressão por jogador (level/XP/atributos) — só na sim. */
  private progressions = new Map<number, Progression>();
  /**
   * Casts de skill pedidos entre ticks, processados NO PRÓXIMO tick (commands
   * bufferizados → aplicados no tick, padrão de servidor). Garante que os
   * eventos `cast`/`heal`/`skill_use` saiam no snapshot do tick correto e que a
   * resolução seja determinística (mesma ordem do tick).
   */
  private pendingSkillCasts: { casterId: number; skillId: string; targetId: number | null }[] = [];

  constructor(map: MapData) {
    this.world = new World(map);
    this.spawnInitialMonsters();
    // XP/level derivam do evento `kill` do bus (DESIGN-EVOLUCAO.md §Camada Sólida).
    this.bus.on("kill", (ev) => this.onKill(ev));
    // Ledger das instâncias de arma alimentado pelos eventos kill/damage do bus.
    attachItemLedger(this.bus, {
      registry: this.items,
      attackerLevelOf: (id) => this.progressions.get(id)?.level ?? null,
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
      dead: false,
      // Arma inicial da classe como INSTÂNCIA equipada (preenchido abaixo).
      equippedWeaponId: null,
      // Kit inicial da classe (compra em NPC é M2+).
      knownSkills: [...STARTER_KITS[cls]],
      skillCooldowns: {},
      status: [],
      ai: null,
      aggroRadius: 0,
      spawnPos: { x: spawn.x, y: spawn.y },
    };
    // Arma inicial da classe como instância única equipada (DESIGN-EVOLUCAO.md
    // §Classes "Kit inicial"). O ledger nasce zerado e passa a contar a partir
    // do primeiro golpe.
    const weapon = this.items.create(STARTER_WEAPON_BY_CLASS[cls]);
    entity.equippedWeaponId = weapon.id;
    this.entities.set(id, entity);
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
    const w = this.weaponStatsOf(entity);
    entity.attackDamage = physicalDamage(prog.attributes, w.baseDamage, w.usesDexterity);
    entity.attackCooldownMs = attackCooldownMs(prog.attributes, w.baseCooldownMs);
  }

  removeEntity(id: number): void {
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
    // O crescimento de stats por level up pode ter mudado o dano de auto-attack.
    this.recomputePlayerDerived(attacker, prog);
  }

  // ── Monstros ────────────────────────────────────────────────────────

  /** Spawn dos monstros iniciais a partir das marcas do mapa. */
  private spawnInitialMonsters(): void {
    for (const m of this.world.map.monsters) {
      const template = CREATURES[m.species];
      if (template) this.spawnMonster(template, { x: m.x, y: m.y });
    }
  }

  private spawnMonster(template: CreatureTemplate, pos: Vec2): number {
    const id = this.nextId++;
    this.entities.set(id, {
      id,
      kind: "monster",
      name: template.name,
      species: template.species,
      family: template.family,
      pos: { x: pos.x, y: pos.y },
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
      attackCooldownMs: template.attackCooldownMs,
      dead: false,
      // Mobs usam números do bestiário, sem arma-instância (ledger só p/ players).
      equippedWeaponId: null,
      knownSkills: [],
      skillCooldowns: {},
      status: [],
      ai: "idle",
      aggroRadius: template.aggroRadius,
      spawnPos: { x: pos.x, y: pos.y },
    });
    return id;
  }

  handleCommand(entityId: number, cmd: ClientCommand): void {
    const e = this.entities.get(entityId);
    if (!e || e.dead) return;
    switch (cmd.type) {
      case "setDir":
        e.intent = cmd.dir ? { kind: "dir", dir: cmd.dir } : null;
        break;
      case "walkTo": {
        const goal = nearestWalkable(this.world, { x: Math.round(cmd.x), y: Math.round(cmd.y) });
        if (!goal) break;
        const path = findPath(this.world, e.pos, goal);
        if (path && path.length > 0) e.intent = { kind: "path", path, goal };
        break;
      }
      case "selectTarget": {
        if (cmd.entityId == null) {
          e.targetId = null;
          break;
        }
        const target = this.entities.get(cmd.entityId);
        // Só alveja monstros vivos existentes.
        e.targetId = target && target.kind === "monster" && !target.dead ? cmd.entityId : null;
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
      case "useSkill": {
        if (e.kind !== "player") break;
        // Bufferiza: resolvido no próximo tick (com ctx/pending corretos).
        this.pendingSkillCasts.push({
          casterId: entityId,
          skillId: cmd.skillId,
          targetId: cmd.targetId ?? e.targetId,
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
      case "stop":
        e.intent = null;
        break;
    }
  }

  /** Resolve os casts bufferizados no tick atual (após status, antes da IA). */
  private resolveSkillCasts(ctx: CombatCtx): void {
    if (this.pendingSkillCasts.length === 0) return;
    const queue = this.pendingSkillCasts;
    this.pendingSkillCasts = [];
    for (const req of queue) {
      const caster = this.entities.get(req.casterId);
      if (!caster || caster.dead) continue;
      const prog = this.progressions.get(req.casterId);
      if (!prog) continue;
      const target = req.targetId != null ? this.entities.get(req.targetId) ?? null : null;
      const skillCtx: SkillCastCtx = {
        ...ctx,
        prog,
        // Dano-base da ARMA equipada (Golpe Forte/Apunhalar escalam a arma).
        weaponBase: this.weaponStatsOf(caster).baseDamage,
        // Instância da arma p/ atribuir dano/kill de skill física ao ledger.
        weaponSource: this.weaponSourceOf(caster),
        enemiesInWorld: [...this.entities.values()],
      };
      castSkill(skillCtx, caster, req.skillId, target);
    }
  }

  onSnapshot(cb: (snap: Snapshot) => void): void {
    this.snapshotListeners.push(cb);
  }

  tick(): void {
    this.tickCount++;
    const now = this.now();
    const pending: SnapshotEvent[] = [];
    const ctx: CombatCtx = {
      bus: this.bus,
      tick: this.tickCount,
      pending,
      night: false,
      lookup: (id) => this.entities.get(id),
    };

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
        updateChaser(ctx, this.world, e, players, now);
      }
    }

    // ── 2. Auto-attack + regen do jogador (estilo Tibia) ──
    for (const id of this.playerIds) {
      const e = this.entities.get(id);
      if (!e) continue;
      this.updatePlayerAttack(ctx, e, now);
      const prog = this.progressions.get(id);
      if (prog) regenTick(prog, e); // regen de HP/mana por fórmula
    }

    // ── 3. Movimento (player + monstros) ──
    for (const e of this.entities.values()) {
      if (e.dead || !e.intent || now < e.nextMoveAt) continue;
      if (e.intent.kind === "dir") this.stepInDirection(e, e.intent.dir, now);
      else this.stepAlongPath(e, now);
    }

    // ── 4. Mortes: remover/respawnar ──
    this.resolveDeaths(now);

    this.emitSnapshot(pending);
  }

  /** Auto-attack: com alvo vivo e adjacente, ataca a cada cooldown. */
  private updatePlayerAttack(ctx: CombatCtx, player: SimEntity, now: number): void {
    if (player.dead || player.targetId == null) return;
    const target = this.entities.get(player.targetId);
    if (!target || target.kind !== "monster" || target.dead) {
      player.targetId = null;
      return;
    }
    if (chebyshev(player.pos, target.pos) > MELEE_RANGE) return; // fora de alcance
    if (now < player.nextAttackAt) return;
    player.facing = this.facingToward(player.pos, target.pos);
    // Auto-attack alimenta o ledger da arma equipada (DESIGN-EVOLUCAO.md §"Magias
    // e Skills": todo kill por auto-attack conta no ledger da arma).
    const w = this.weaponStatsOf(player);
    applyDamage(ctx, player, target, player.attackDamage, w.damageType, this.weaponSourceOf(player), null);
    player.nextAttackAt = now + player.attackCooldownMs;
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
        // Respawn simples: volta ao spawn com HP cheio.
        e.pos = { x: e.spawnPos.x, y: e.spawnPos.y };
        e.hp = e.maxHp;
        e.mp = e.maxMp;
        e.dead = false;
        e.intent = null;
        e.targetId = null;
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
        if (template) {
          this.respawns.push({
            template,
            pos: { x: e.spawnPos.x, y: e.spawnPos.y },
            atTick: this.tickCount + template.respawnTicks,
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
        if (this.tickCount >= r.atTick) this.spawnMonster(r.template, r.pos);
        else remaining.push(r);
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
      const path = findPath(this.world, e.pos, e.intent.goal);
      e.intent = path && path.length > 0 ? { kind: "path", path, goal: e.intent.goal } : null;
      return;
    }
    if (this.tryStep(e, dir, now)) {
      e.intent.path.shift();
      if (e.intent.path.length === 0) e.intent = null;
    } else {
      // Bloqueio dinâmico (futuro: outra criatura no tile) — recalcula.
      const path = findPath(this.world, e.pos, e.intent.goal);
      e.intent = path && path.length > 0 ? { kind: "path", path, goal: e.intent.goal } : null;
    }
  }

  /** Tenta executar um passo. Retorna true se moveu. */
  private tryStep(e: SimEntity, dir: Dir8, now: number): boolean {
    const v = DIR_VECTORS[dir];
    const nx = e.pos.x + v.x;
    const ny = e.pos.y + v.y;
    if (!this.world.isWalkable(nx, ny)) return false;
    if (isDiagonal(dir)) {
      // Mesma regra do pathfinding: não atravessar quinas.
      if (!this.world.isWalkable(e.pos.x + v.x, e.pos.y) || !this.world.isWalkable(e.pos.x, e.pos.y + v.y)) {
        return false;
      }
    }
    e.pos = { x: nx, y: ny };
    e.facing = facingFromDir(dir);
    e.stepMs = Math.round(e.baseStepMs * (isDiagonal(dir) ? DIAGONAL_FACTOR : 1));
    e.nextMoveAt = now + e.stepMs;
    e.justMoved = true;
    return true;
  }

  /** Projeta a progressão da sim no formato serializável do snapshot. */
  private projectProgress(prog: Progression): PlayerProgressState {
    return {
      cls: prog.cls,
      level: prog.level,
      xp: prog.xp,
      xpForNextLevel: xpForLevel(prog.level + 1),
      xpLevelFloor: xpForLevel(prog.level),
      attributes: { ...prog.attributes },
      freeStatPoints: prog.freeStatPoints,
    };
  }

  /** Projeta as skills conhecidas do jogador (id, cooldown restante ms, custo). */
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
        facing: e.facing,
        stepMs: e.stepMs,
        moving: e.justMoved,
        hp: e.hp,
        maxHp: e.maxHp,
        mp: e.mp,
        maxMp: e.maxMp,
        status: projectStatus(e, this.tickCount),
      };
      const prog = this.progressions.get(e.id);
      if (prog) state.progress = this.projectProgress(prog);
      if (e.kind === "player") {
        state.skills = this.projectSkills(e);
        const weapon = this.projectWeapon(e);
        if (weapon) state.weapon = weapon;
      }
      entities.push(state);
    }
    // targetId é por-jogador; entregue por entidade abaixo via snapshot.
    // O snapshot é o mesmo para todos (M1 single-player local); o targetId
    // é do primeiro jogador. No online, cada conexão recebe seu próprio.
    const firstPlayer = this.entities.get([...this.playerIds][0]);
    const snap: Snapshot = {
      tick: this.tickCount,
      entities,
      targetId: firstPlayer?.targetId ?? null,
      events,
    };
    for (const cb of this.snapshotListeners) cb(snap);
  }
}
