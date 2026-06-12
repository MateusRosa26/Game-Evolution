import type {
  EventBus, KillEvent, SkillUseEvent, LevelUpEvent, DamageEvent, BlockEvent,
  EquipEvent, ConsumeEvent, CombatEndEvent,
} from "../events";
import type { ItemRegistry } from "../items/instances";
import type { MarkProgress } from "../items/ledger";
import { isValidKill } from "../formulas";
import { creatureLevelForTier } from "../progression";
import { CREATURES } from "../bestiary";
import { matchesFilter, type Facts } from "./filters";
import type { Accumulator, EffectSpec, MarkDef, MutationDef, PathDef, TrackingDef, TrackingCategory } from "./types";
import {
  characterTracking,
  createTrackingState,
  type CharacterTracking,
  type SkillMutationProgress,
  type PathRatioProgress,
  type TrackingState,
} from "./state";

/**
 * REDUTOR — aplica um `Accumulator` a um valor corrente. Estado mínimo: `value`
 * (count/soma/max/cardinalidade) + `seen` opcional (distinct). Puro, determinístico,
 * JSON-safe. `count` é o default legado (+1 por ocorrência casada).
 */
function reduceStep(
  acc: Accumulator | undefined,
  facts: Facts,
  cur: { value: number; seen?: string[] },
): { value: number; seen?: string[] } {
  const a = acc ?? { kind: "count" };
  switch (a.kind) {
    case "count":
      return { value: cur.value + 1, seen: cur.seen };
    case "sum": {
      const v = facts[a.field];
      return { value: cur.value + (typeof v === "number" ? v : 0), seen: cur.seen };
    }
    case "max": {
      const v = facts[a.field];
      return { value: typeof v === "number" ? Math.max(cur.value, v) : cur.value, seen: cur.seen };
    }
    case "distinct": {
      const v = facts[a.field];
      const seen = cur.seen ?? [];
      if (v !== undefined && v !== null && !seen.includes(String(v))) seen.push(String(v));
      return { value: seen.length, seen };
    }
  }
}

/** Soma de um lado da fração de um Caminho `ratio` (campo ausente = +1 por ocorrência). */
function ratioAddend(field: string | undefined, facts: Facts): number {
  if (!field) return 1;
  const v = facts[field];
  return typeof v === "number" ? v : 0;
}

/**
 * ENGINE GENÉRICA DE TRACKING — Marcas / Mutações / Caminhos
 * (DESIGN-EVOLUCAO.md §"Camada Emergente"). Observa eventos da sim e cristaliza
 * padrões extremos em recompensas nomeadas. NADA de conteúdo é hard-coded: a
 * engine só interpreta DEFINIÇÕES declarativas (`TrackingDef`). Adicionar
 * conteúdo = adicionar definição.
 *
 * REGRAS UNIVERSAIS aplicadas aqui (§"Regras universais"):
 *  - hint vago aos ~50%, UMA vez só;
 *  - unlock é evento forte (nome + flavor);
 *  - NUNCA expõe contador/progresso no protocolo (cheat-proof + mistério);
 *  - anti-degeneração: só consome eventos que JÁ passam pelos filtros válidos
 *    (kills usam o MESMO `isValidKill` do ledger; skill_use só chega aqui se o
 *    cast conectou — a sim só emite `skill_use` com `validHit`).
 *
 * SAÍDA: a engine não fala protocolo diretamente. Ela chama um SINK
 * (`emitHint`/`emitUnlock`) que a Simulation aponta para o `pending` do tick
 * atual. Assim a engine continua pura (sem pixi/protocolo acoplado) e os eventos
 * saem no snapshot do tick correto.
 */

/** Limiar do hint: ~50% do threshold (DESIGN-EVOLUCAO.md §"Visibilidade"). */
const HINT_FRACTION = 0.5;

/** Sink one-shot da engine para o client (apontado ao `pending` do tick). */
export interface TrackingSink {
  /** Hint vago aos ~50% (sem números) para o jogador `playerId`. */
  hint(playerId: number, text: string): void;
  /** Unlock forte (categoria + nome + flavor) para o jogador `playerId`. */
  unlock(playerId: number, category: TrackingCategory, name: string, flavorText: string): void;
}

/** Dependências que a engine precisa da Simulation. */
export interface TrackingDeps {
  /** Registry de instâncias de item (lê/escreve o `markProgress` no ledger). */
  registry: ItemRegistry;
  /** Nível do jogador atacante (anti-degeneração de kill). null = não-jogador. */
  attackerLevelOf: (entityId: number) => number | null;
  /** Instância de arma equipada de um personagem (p/ resolver a Marca da arma). */
  equippedWeaponInstanceId: (entityId: number) => number | null;
  /** Instância do ESCUDO equipado (Marca de escudo, ex: Inabalável). null = sem escudo. */
  equippedShieldInstanceId?: (entityId: number) => number | null;
  /** True se a entidade é um jogador (só players acumulam Caminhos/Mutações). */
  isPlayer: (entityId: number) => boolean;
  /** Nº de hostis vivos a ≤ `range` tiles de `pos` (excluindo `excludeId`) — fato `enemiesAdjacent`. */
  enemiesNear?: (pos: { x: number; y: number }, range: number, excludeId: number) => number;
  /** Tipo de terreno (chave de tile) sob uma posição — fato `terrain`. */
  terrainAt?: (pos: { x: number; y: number }) => string | null;
  /** Destrava skills num personagem (P8 `grantSkills`, ex: Monge). */
  grantSkills?: (entityId: number, skills: string[]) => void;
}

export class TrackingEngine {
  /** Estado serializável (mutações/caminhos por personagem). Marca vive no ledger. */
  readonly state: TrackingState = createTrackingState();

  private readonly marks: MarkDef[];
  private readonly mutations: MutationDef[];
  private readonly paths: PathDef[];
  /** Caminhos de proporção (ratio) — subconjunto de `paths`, pré-filtrado. */
  private readonly ratioPaths: PathDef[];
  /** Mutações agrupadas por skillId (concorrentes da mesma skill). */
  private readonly mutationsBySkill: Record<string, MutationDef[]> = {};

  /** Sink no-op até a Simulation apontar para o `pending` do tick. */
  private sink: TrackingSink = { hint: () => {}, unlock: () => {} };

  /** Cache de efeitos ATIVOS por entidade (invalida em unlock/equip). */
  private readonly effectCache = new Map<number, EffectSpec[]>();

  constructor(defs: TrackingDef[], private readonly deps: TrackingDeps) {
    this.marks = defs.filter((d): d is MarkDef => d.category === "mark");
    this.mutations = defs.filter((d): d is MutationDef => d.category === "mutation");
    this.paths = defs.filter((d): d is PathDef => d.category === "path");
    this.ratioPaths = this.paths.filter((p) => p.flavorKind === "ratio");
    for (const m of this.mutations) {
      (this.mutationsBySkill[m.skillId] ??= []).push(m);
    }
  }

  /** Aponta o sink para onde os eventos one-shot devem ir neste tick. */
  setSink(sink: TrackingSink): void {
    this.sink = sink;
  }

  /** Conecta a engine ao bus. Chamado uma vez na construção da Simulation. */
  attach(bus: EventBus): void {
    bus.on("kill", (ev) => this.onKill(ev));
    bus.on("skill_use", (ev) => this.onSkillUse(ev));
    bus.on("level_up", (ev) => this.onLevelUp(ev));
    bus.on("damage", (ev) => this.onDamage(ev));
    bus.on("block", (ev) => this.onBlock(ev));
    bus.on("equip", (ev) => this.onEquip(ev));
    bus.on("consume", (ev) => this.onConsume(ev));
    bus.on("combat_end", (ev) => this.onCombatEnd(ev));
  }

  /**
   * Aquisição de classe (rito): zera os Caminhos `ratio` com `resetScope:"sinceClass"`
   * (a janela do *Senhor dos Extremos* começa na ordenação, não no nascimento).
   */
  onClassAcquired(playerId: number): void {
    const ct = characterTracking(this.state, playerId);
    for (const def of this.ratioPaths) {
      if (def.resetScope === "sinceClass") delete ct.pathsRatio[def.id];
    }
  }

  // ── MOTOR DE EFEITOS — quais EffectSpec estão ativos numa entidade ──────

  /** Invalida o cache de efeitos de uma entidade (chamar em equip/unequip). */
  invalidateEffects(entityId: number): void {
    this.effectCache.delete(entityId);
  }

  /**
   * Efeitos MECÂNICOS ativos da entidade: Caminhos/Mutações desbloqueados no
   * estado + Marcas desbloqueadas nas instâncias EQUIPADAS passadas (a Marca só
   * vale com o item na mão — ego do item). Cacheado por entidade.
   */
  activeEffects(entityId: number, equippedInstanceIds: number[]): EffectSpec[] {
    const cached = this.effectCache.get(entityId);
    if (cached) return cached;
    const out: EffectSpec[] = [];
    const push = (spec: EffectSpec | EffectSpec[] | undefined) => {
      if (!spec) return;
      if (Array.isArray(spec)) out.push(...spec);
      else out.push(spec);
    };
    const ct = this.state.byCharacter[entityId];
    if (ct) {
      for (const def of this.paths) {
        const unlocked =
          ct.pathsStyle[def.id]?.unlocked || ct.pathsConduct[def.id]?.unlocked || ct.pathsRatio[def.id]?.unlocked;
        if (unlocked) push(def.effect.spec);
      }
      for (const skillId in ct.mutations) {
        const resolved = ct.mutations[skillId].resolved;
        if (!resolved) continue;
        const def = this.mutations.find((m) => m.id === resolved);
        if (def) push(def.effect.spec);
      }
    }
    for (const instId of equippedInstanceIds) {
      const inst = this.deps.registry.get(instId);
      if (!inst) continue;
      for (const def of this.marks) {
        if (inst.ledger.markProgress[def.id]?.unlocked) push(def.effect.spec);
      }
    }
    this.effectCache.set(entityId, out);
    return out;
  }

  /** Desbloqueio: invalida o cache, aplica P8 grantSkills, emite o unlock. */
  private onUnlock(playerId: number, def: TrackingDef): void {
    this.effectCache.delete(playerId);
    const spec = def.effect.spec;
    const specs = Array.isArray(spec) ? spec : spec ? [spec] : [];
    for (const s of specs) {
      if (s.kind === "grantSkills" && this.deps.grantSkills) this.deps.grantSkills(playerId, s.skills);
    }
    this.sink.unlock(playerId, def.category, def.name, def.flavor.unlock);
  }

  // ── Adaptadores: payload de evento → Facts achatados ───────────────────

  private killFacts(ev: KillEvent): Facts {
    const template = ev.victim.species ? CREATURES[ev.victim.species] : undefined;
    const attackerLevel = this.deps.attackerLevelOf(ev.attacker.id);
    const creatureLevel = template ? creatureLevelForTier(template.tier) : null;
    // Nêmesis: este kill vinga a morte do jogador? (espécie que o matou por último)
    const ct = this.deps.isPlayer(ev.attacker.id) ? characterTracking(this.state, ev.attacker.id) : null;
    const avengesDeath =
      ct?.lastKillerSpecies != null && ev.victim.species != null && ct.lastKillerSpecies === ev.victim.species;
    return {
      "victim.family": ev.victim.family,
      "victim.species": ev.victim.species,
      "victim.tier": template ? template.tier : null,
      "attacker.id": ev.attacker.id,
      attackerHpPct: ev.attackerHpPct,
      distance: ev.distance,
      skillId: ev.skillId,
      damageType: ev.finalBlow.damageType,
      finalBlowAmount: ev.finalBlow.amount,
      // Overkill (dano sobrando exagerado) — ex.: 50 num mob de 10 HP.
      overkill: ev.overkill,
      overkillRatio: ev.overkillRatio,
      victimHpBeforeBlow: ev.victimHpBeforeBlow,
      victimMaxHp: ev.victimMaxHp,
      victimHpPctBeforeBlow: ev.victimHpPctBeforeBlow,
      statusesOnVictim: ev.statusesOnVictim,
      // Matador de Gigantes: nível do mob menos o do jogador (positivo = acima do seu).
      levelDelta: creatureLevel != null && attackerLevel != null ? creatureLevel - attackerLevel : null,
      // Berserker/cercado e Lutador ambiental — só se a Simulation forneceu os lookups.
      enemiesAdjacent: this.deps.enemiesNear ? this.deps.enemiesNear(ev.attackerPos, 1, ev.attacker.id) : null,
      terrain: this.deps.terrainAt ? this.deps.terrainAt(ev.victimPos) : null,
      avengesDeath,
      night: ev.context.night,
    };
  }

  private skillUseFacts(ev: SkillUseEvent): Facts {
    return {
      skillId: ev.skillId,
      "caster.id": ev.caster.id,
      castDistance: ev.castDistance,
      casterHpPct: ev.casterHpPct,
      casterInCombat: ev.casterInCombat,
      targetSelf: ev.targetSelf,
      targetHpPct: ev.targetHpPct,
      "target.family": ev.targetFamily,
      targetWasBurning: ev.targetWasBurning,
      targetWasSlowed: ev.targetWasSlowed,
      targetWasPoisoned: ev.targetWasPoisoned,
      hitFromBehind: ev.hitFromBehind,
      targetsHit: ev.targetsHit,
      targetsKilled: ev.targetsKilled,
      statusesOnTarget: ev.statusesOnTarget,
      castWhileMoving: ev.castWhileMoving,
    };
  }

  private damageFacts(ev: DamageEvent): Facts {
    return {
      "source.id": ev.source.id,
      "target.family": ev.target.family,
      "target.species": ev.target.species,
      amount: ev.amount,
      damageType: ev.damageType,
      skillId: ev.skillId,
      wasFatal: ev.wasFatal,
      night: ev.context.night,
    };
  }

  /** Adaptadores dos eventos NOVOS → Facts achatados. */
  private equipFacts(ev: EquipEvent): Facts {
    return {
      action: ev.action,
      slot: ev.slot,
      "item.category": ev.itemCategory,
      "item.templateId": ev.itemTemplateId,
    };
  }

  private consumeFacts(ev: ConsumeEvent): Facts {
    return { "item.kind": ev.kind, "item.templateId": ev.itemTemplateId };
  }

  private combatEndFacts(ev: CombatEndEvent): Facts {
    return {
      durationMs: ev.durationMs,
      damageTaken: ev.damageTaken,
      damageDealt: ev.damageDealt,
      physicalDamageDealt: ev.physicalDamageDealt,
      kills: ev.kills,
      lowestHpPct: ev.lowestHpPct,
      maxEnemiesFaced: ev.maxEnemiesFaced,
      endedBy: ev.endedBy,
      tookNoDamage: ev.damageTaken === 0,
      // Intocado: causou dano mas NENHUM físico (vitória mágica pura).
      magicOnlyVictory: ev.physicalDamageDealt === 0 && ev.damageDealt > 0 && ev.endedBy === "victory",
    };
  }

  private blockFacts(ev: BlockEvent): Facts {
    return {
      "blocker.id": ev.blocker.id,
      blocked: ev.blocked,
      damageType: ev.damageType,
      night: ev.context.night,
    };
  }

  // ── Anti-degeneração: kill válido (mesmo critério do ledger de itens) ───

  private isValidKillEvent(ev: KillEvent): boolean {
    const attackerLevel = this.deps.attackerLevelOf(ev.attacker.id);
    const template = ev.victim.species ? CREATURES[ev.victim.species] : undefined;
    if (attackerLevel == null || !template) return false;
    const creatureLevel = creatureLevelForTier(template.tier);
    return isValidKill(template.xp, attackerLevel, creatureLevel);
  }

  // ── Handlers por evento ────────────────────────────────────────────────

  private onKill(ev: KillEvent): void {
    // Nêmesis: a morte do JOGADOR registra a espécie do algoz (antes do guard de
    // atacante — aqui o atacante é o mob e a vítima é o player).
    if (this.deps.isPlayer(ev.victim.id) && ev.attacker.species != null) {
      characterTracking(this.state, ev.victim.id).lastKillerSpecies = ev.attacker.species;
    }
    if (!this.deps.isPlayer(ev.attacker.id)) return;
    if (!this.isValidKillEvent(ev)) return; // anti-degeneração
    const facts = this.killFacts(ev);
    // Marca avança na INSTÂNCIA que deu o golpe final (mesma regra do ledger:
    // "conta o kill se ela deu o golpe final estando equipada"). Golpe final por
    // magia/DoT → `weaponInstanceId` null → nenhuma Marca de arma avança.
    this.advanceMarks(ev.attacker.id, ev.weaponInstanceId, "kill", facts);
    // Caminhos de estilo observam kills (e qualquer outro evento que case).
    this.advanceStylePaths(ev.attacker.id, "kill", facts);
    this.advanceRatioPaths(ev.attacker.id, "kill", facts);
    // Vingança consumada: limpa a memória (cada morte é vingável uma vez).
    if (facts.avengesDeath === true) {
      characterTracking(this.state, ev.attacker.id).lastKillerSpecies = null;
    }
  }

  private onSkillUse(ev: SkillUseEvent): void {
    if (!this.deps.isPlayer(ev.caster.id)) return;
    // `skill_use` só é emitido com cast que conectou (validHit) — anti-spam já
    // garantido pela sim. Defesa em profundidade:
    if (!ev.validHit || ev.targetsHit <= 0) return;
    const facts = this.skillUseFacts(ev);
    this.advanceMutations(ev.caster.id, ev.skillId, facts);
    this.advanceStylePaths(ev.caster.id, "skill_use", facts);
    this.advanceRatioPaths(ev.caster.id, "skill_use", facts);
    // Condutas podem quebrar com skill_use (ex.: Mão Vazia quebra ao usar skill).
    this.checkConductBreaks(ev.caster.id, "skill_use", facts);
  }

  private onDamage(ev: DamageEvent): void {
    if (!this.deps.isPlayer(ev.source.id)) return;
    const facts = this.damageFacts(ev);
    // Marca de dano avança na instância que causou o dano (null = magia/DoT).
    this.advanceMarks(ev.source.id, ev.weaponInstanceId, "damage", facts);
    this.advanceStylePaths(ev.source.id, "damage", facts);
    // Senhor dos Extremos & cia: share por elemento vem do fluxo de `damage`.
    this.advanceRatioPaths(ev.source.id, "damage", facts);
    this.checkConductBreaks(ev.source.id, "damage", facts);
  }

  private onEquip(ev: EquipEvent): void {
    if (!this.deps.isPlayer(ev.entity.id)) return;
    // Trocar de item muda quais Marcas de instância estão ativas → invalida cache.
    this.invalidateEffects(ev.entity.id);
    const facts = this.equipFacts(ev);
    // Condutas como Pele de Ferro/Mão Vazia quebram ao equipar (armadura/arma).
    this.checkConductBreaks(ev.entity.id, "equip", facts);
    this.advanceStylePaths(ev.entity.id, "equip", facts);
  }

  private onConsume(ev: ConsumeEvent): void {
    if (!this.deps.isPlayer(ev.entity.id)) return;
    const facts = this.consumeFacts(ev);
    this.advanceStylePaths(ev.entity.id, "consume", facts);
    this.checkConductBreaks(ev.entity.id, "consume", facts);
  }

  private onCombatEnd(ev: CombatEndEvent): void {
    if (!this.deps.isPlayer(ev.entity.id)) return;
    const facts = this.combatEndFacts(ev);
    // Intocável/Sobrevivente/Velocista: Caminhos de estilo sobre a sessão agregada.
    this.advanceStylePaths(ev.entity.id, "combat_end", facts);
  }

  private onBlock(ev: BlockEvent): void {
    if (!this.deps.isPlayer(ev.blocker.id)) return;
    const facts = this.blockFacts(ev);
    // Marca de bloqueio (Inabalável) vive no ESCUDO equipado; fallback p/ a arma
    // se a Simulation não fornecer o lookup de escudo.
    const shieldId = this.deps.equippedShieldInstanceId
      ? this.deps.equippedShieldInstanceId(ev.blocker.id)
      : this.deps.equippedWeaponInstanceId(ev.blocker.id);
    this.advanceMarks(ev.blocker.id, shieldId, "block", facts);
    this.advanceStylePaths(ev.blocker.id, "block", facts);
    this.checkConductBreaks(ev.blocker.id, "block", facts);
  }

  private onLevelUp(ev: LevelUpEvent): void {
    if (!this.deps.isPlayer(ev.entity.id)) return;
    // Level up é o gatilho de desbloqueio das CONDUTAS e dos Caminhos de RATIO.
    this.checkConductMilestones(ev.entity.id, ev.toLevel);
    this.checkRatioMilestones(ev.entity.id, ev.toLevel);
  }

  // ── MARCAS (mark) — progresso no ledger da instância equipada ───────────

  private advanceMarks(playerId: number, instanceId: number | null, event: string, facts: Facts): void {
    if (this.marks.length === 0) return;
    if (instanceId == null) return; // ação não atribuída a uma instância → Marca não avança
    const inst = this.deps.registry.get(instanceId);
    if (!inst) return;

    for (const def of this.marks) {
      if (def.event !== event) continue;
      if (!matchesFilter(def.filter, facts)) continue;

      // Progresso vive no LEDGER da instância (viaja no trade).
      const progress: MarkProgress =
        inst.ledger.markProgress[def.id] ?? (inst.ledger.markProgress[def.id] = { count: 0, hinted: false, unlocked: false });
      if (progress.unlocked) continue; // permanente; segue contando p/ níveis futuros é ✏️
      // Redutor declarativo (count/distinct/sum/max) — `count` guarda o valor reduzido.
      const reduced = reduceStep(def.accumulator, facts, { value: progress.count, seen: progress.seen });
      progress.count = reduced.value;
      progress.seen = reduced.seen;
      this.maybeReveal(playerId, def, progress.count, def.threshold, () => progress.hinted, () => (progress.hinted = true), () => {
        progress.unlocked = true;
      });
    }
  }

  // ── MUTAÇÕES (mutation) — perfil de uso decide qual nasce ───────────────

  private advanceMutations(playerId: number, skillId: string, facts: Facts): void {
    const defs = this.mutationsBySkill[skillId];
    if (!defs || defs.length === 0) return;
    const ct = characterTracking(this.state, playerId);
    const prog: SkillMutationProgress =
      ct.mutations[skillId] ?? (ct.mutations[skillId] = { profileCounts: {}, hinted: {}, resolved: null });
    if (prog.resolved) return; // já mutou — permanente (substitui a skill original)

    // CONTADOR ABSOLUTO POR PERFIL: só casts que casam o perfil contam pra ele
    // (casts fora de todo perfil não contam nada → generalista nunca muta).
    for (const def of defs) {
      if (matchesFilter(def.filter, facts)) {
        prog.profileCounts[def.id] = (prog.profileCounts[def.id] ?? 0) + 1;
      }
    }

    // Hint POR PERFIL aos ~50% da PRÓPRIA meta — telegrafa o rumo (max-dist vs
    // queima-roupa têm hints distintos; DESIGN-EVOLUCAO.md §2 "Hint por perfil").
    for (const def of defs) {
      const c = prog.profileCounts[def.id] ?? 0;
      if (!prog.hinted[def.id] && c >= Math.ceil(def.threshold * HINT_FRACTION) && c < def.threshold) {
        prog.hinted[def.id] = true;
        this.sink.hint(playerId, def.flavor.hint);
      }
    }

    // Resolução: o 1º perfil a cruzar a PRÓPRIA meta vence (desempate = ordem de
    // definição, determinístico). A substituição encerra a corrida (permanente).
    for (const def of defs) {
      if ((prog.profileCounts[def.id] ?? 0) >= def.threshold) {
        prog.resolved = def.id;
        this.onUnlock(playerId, def);
        break;
      }
    }
  }

  // ── CAMINHOS de ESTILO (path/style) — acúmulo ──────────────────────────

  private advanceStylePaths(playerId: number, event: string, facts: Facts): void {
    const ct = characterTracking(this.state, playerId);
    for (const def of this.paths) {
      if (def.flavorKind !== "style") continue;
      if (def.event !== event) continue;
      if (!matchesFilter(def.filter, facts)) continue;
      const prog = ct.pathsStyle[def.id] ?? (ct.pathsStyle[def.id] = { value: 0, hinted: false, unlocked: false });
      if (prog.unlocked) continue;
      // Redutor declarativo — `value` = count/set.size/soma/max (distinct mantém `seen`).
      const reduced = reduceStep(def.accumulator, facts, { value: prog.value, seen: prog.seen });
      prog.value = reduced.value;
      prog.seen = reduced.seen;
      this.maybeReveal(playerId, def, prog.value, def.threshold, () => prog.hinted, () => (prog.hinted = true), () => {
        prog.unlocked = true;
      });
    }
  }

  // ── CAMINHOS de RATIO (path/ratio) — proporção sobre janela ────────────
  // Senhor dos Extremos: acumula dois somatórios; resolve no milestone de level.

  private advanceRatioPaths(playerId: number, event: string, facts: Facts): void {
    if (this.ratioPaths.length === 0) return;
    const ct = characterTracking(this.state, playerId);
    for (const def of this.ratioPaths) {
      if (def.event !== event) continue;
      const prog: PathRatioProgress =
        ct.pathsRatio[def.id] ?? (ct.pathsRatio[def.id] = { num: 0, den: 0, hinted: false, unlocked: false });
      if (prog.unlocked) continue;
      const add = ratioAddend(def.ratioField, facts);
      if (matchesFilter(def.denominator ?? [], facts)) prog.den += add;
      if (def.numerator && matchesFilter(def.numerator, facts)) prog.num += add;
      // B7: piso por componente — acumula cada sub-numerador que casar.
      if (def.subNumerators && def.subNumerators.length > 0) {
        prog.subNum ??= new Array(def.subNumerators.length).fill(0);
        for (let i = 0; i < def.subNumerators.length; i++) {
          if (matchesFilter(def.subNumerators[i].filter, facts)) prog.subNum[i] += add;
        }
      }
    }
  }

  /** No milestone de level, desbloqueia Caminhos de ratio cuja proporção bateu. */
  private checkRatioMilestones(playerId: number, level: number): void {
    const ct = characterTracking(this.state, playerId);
    for (const def of this.ratioPaths) {
      if (def.milestoneLevel == null || def.minRatio == null) continue;
      const prog = ct.pathsRatio[def.id];
      if (!prog || prog.unlocked) continue;
      const ratio = prog.den > 0 ? prog.num / prog.den : 0;
      // B7: cada sub-numerador precisa alcançar seu próprio piso do TOTAL.
      const subsOk =
        !def.subNumerators ||
        def.subNumerators.every((s, i) => prog.den > 0 && (prog.subNum?.[i] ?? 0) / prog.den >= s.minRatio);
      const meets = ratio >= def.minRatio && subsOk;
      // Hint atmosférico ao cruzar ~50% do milestone JÁ no rumo certo (gate batendo).
      if (!prog.hinted && level >= Math.ceil(def.milestoneLevel * HINT_FRACTION) && meets) {
        prog.hinted = true;
        this.sink.hint(playerId, def.flavor.hint);
      }
      if (level >= def.milestoneLevel && meets) {
        prog.unlocked = true;
        this.onUnlock(playerId, def);
      }
    }
  }

  // ── CAMINHOS de CONDUTA (path/conduct) — restrição mantida ─────────────

  /** Quebra condutas cujo `breakEvent`+`breakFilter` casar (permanente). */
  private checkConductBreaks(playerId: number, event: string, facts: Facts): void {
    const ct = characterTracking(this.state, playerId);
    for (const def of this.paths) {
      if (def.flavorKind !== "conduct") continue;
      if (def.breakEvent !== event) continue;
      const prog = this.conductOf(ct, def);
      if (!prog.intact || prog.unlocked) continue; // já quebrada/desbloqueada
      if (def.breakFilter && !matchesFilter(def.breakFilter, facts)) continue;
      prog.intact = false; // quebrou PARA SEMPRE naquele personagem
    }
  }

  /** Desbloqueia condutas intactas que atingiram o milestone de level. */
  private checkConductMilestones(playerId: number, level: number): void {
    const ct = characterTracking(this.state, playerId);
    for (const def of this.paths) {
      if (def.flavorKind !== "conduct" || def.milestoneLevel == null) continue;
      const prog = this.conductOf(ct, def);
      if (prog.unlocked) continue;
      // Hint atmosférico ao cruzar ~50% do milestone, conduta ainda intacta.
      if (prog.intact && !prog.hinted && level >= Math.ceil(def.milestoneLevel * HINT_FRACTION)) {
        prog.hinted = true;
        this.sink.hint(playerId, def.flavor.hint);
      }
      if (prog.intact && level >= def.milestoneLevel) {
        prog.unlocked = true;
        this.onUnlock(playerId, def);
      }
    }
  }

  private conductOf(ct: CharacterTracking, def: PathDef) {
    return ct.pathsConduct[def.id] ?? (ct.pathsConduct[def.id] = { intact: true, hinted: false, unlocked: false });
  }

  // ── Reveal genérico (hint aos ~50%, unlock ao 100%) ────────────────────

  private maybeReveal(
    playerId: number,
    def: TrackingDef,
    count: number,
    threshold: number,
    isHinted: () => boolean,
    markHinted: () => void,
    markUnlocked: () => void,
  ): void {
    if (!isHinted() && count >= Math.ceil(threshold * HINT_FRACTION) && count < threshold) {
      markHinted();
      this.sink.hint(playerId, def.flavor.hint);
    }
    if (count >= threshold) {
      // Garante que o hint não fica pendente se o threshold for cruzado direto.
      markUnlocked();
      this.onUnlock(playerId, def);
    }
  }
}
