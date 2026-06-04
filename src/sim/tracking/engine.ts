import type { EventBus, KillEvent, SkillUseEvent, LevelUpEvent, DamageEvent, BlockEvent } from "../events";
import type { ItemRegistry } from "../items/instances";
import type { MarkProgress } from "../items/ledger";
import { isValidKill } from "../formulas";
import { creatureLevelForTier } from "../progression";
import { CREATURES } from "../bestiary";
import { matchesFilter, type Facts } from "./filters";
import type { MarkDef, MutationDef, PathDef, TrackingDef, TrackingCategory } from "./types";
import {
  characterTracking,
  createTrackingState,
  type CharacterTracking,
  type SkillMutationProgress,
  type TrackingState,
} from "./state";

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
  /** True se a entidade é um jogador (só players acumulam Caminhos/Mutações). */
  isPlayer: (entityId: number) => boolean;
}

export class TrackingEngine {
  /** Estado serializável (mutações/caminhos por personagem). Marca vive no ledger. */
  readonly state: TrackingState = createTrackingState();

  private readonly marks: MarkDef[];
  private readonly mutations: MutationDef[];
  private readonly paths: PathDef[];
  /** Mutações agrupadas por skillId (concorrentes da mesma skill). */
  private readonly mutationsBySkill: Record<string, MutationDef[]> = {};

  /** Sink no-op até a Simulation apontar para o `pending` do tick. */
  private sink: TrackingSink = { hint: () => {}, unlock: () => {} };

  constructor(defs: TrackingDef[], private readonly deps: TrackingDeps) {
    this.marks = defs.filter((d): d is MarkDef => d.category === "mark");
    this.mutations = defs.filter((d): d is MutationDef => d.category === "mutation");
    this.paths = defs.filter((d): d is PathDef => d.category === "path");
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
  }

  // ── Adaptadores: payload de evento → Facts achatados ───────────────────

  private killFacts(ev: KillEvent): Facts {
    return {
      "victim.family": ev.victim.family,
      "victim.species": ev.victim.species,
      "attacker.id": ev.attacker.id,
      attackerHpPct: ev.attackerHpPct,
      distance: ev.distance,
      skillId: ev.skillId,
      damageType: ev.finalBlow.damageType,
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
      night: ev.context.night,
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
    if (!this.deps.isPlayer(ev.attacker.id)) return;
    if (!this.isValidKillEvent(ev)) return; // anti-degeneração
    const facts = this.killFacts(ev);
    // Marca avança na INSTÂNCIA que deu o golpe final (mesma regra do ledger:
    // "conta o kill se ela deu o golpe final estando equipada"). Golpe final por
    // magia/DoT → `weaponInstanceId` null → nenhuma Marca de arma avança.
    this.advanceMarks(ev.attacker.id, ev.weaponInstanceId, "kill", facts);
    // Caminhos de estilo observam kills (e qualquer outro evento que case).
    this.advanceStylePaths(ev.attacker.id, "kill", facts);
  }

  private onSkillUse(ev: SkillUseEvent): void {
    if (!this.deps.isPlayer(ev.caster.id)) return;
    // `skill_use` só é emitido com cast que conectou (validHit) — anti-spam já
    // garantido pela sim. Defesa em profundidade:
    if (!ev.validHit || ev.targetsHit <= 0) return;
    const facts = this.skillUseFacts(ev);
    this.advanceMutations(ev.caster.id, ev.skillId, facts);
    this.advanceStylePaths(ev.caster.id, "skill_use", facts);
    // Condutas podem quebrar com skill_use (ex.: Mão Vazia quebra ao usar skill).
    this.checkConductBreaks(ev.caster.id, "skill_use", facts);
  }

  private onDamage(ev: DamageEvent): void {
    if (!this.deps.isPlayer(ev.source.id)) return;
    const facts = this.damageFacts(ev);
    // Marca de dano avança na instância que causou o dano (null = magia/DoT).
    this.advanceMarks(ev.source.id, ev.weaponInstanceId, "damage", facts);
    this.advanceStylePaths(ev.source.id, "damage", facts);
    this.checkConductBreaks(ev.source.id, "damage", facts);
  }

  private onBlock(ev: BlockEvent): void {
    if (!this.deps.isPlayer(ev.blocker.id)) return;
    const facts = this.blockFacts(ev);
    // `block` ainda não traz a instância do escudo no payload (wave de escudo).
    // Por ora cai no escudo/arma equipada do blocker. ✏️
    this.advanceMarks(ev.blocker.id, this.deps.equippedWeaponInstanceId(ev.blocker.id), "block", facts);
    this.advanceStylePaths(ev.blocker.id, "block", facts);
    this.checkConductBreaks(ev.blocker.id, "block", facts);
  }

  private onLevelUp(ev: LevelUpEvent): void {
    if (!this.deps.isPlayer(ev.entity.id)) return;
    // Level up é o gatilho de desbloqueio das CONDUTAS (milestone de level).
    this.checkConductMilestones(ev.entity.id, ev.toLevel);
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
      progress.count += 1;
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
      ct.mutations[skillId] ?? (ct.mutations[skillId] = { totalValidUses: 0, profileCounts: {}, hinted: {}, resolved: null });
    if (prog.resolved) return; // já mutou — permanente (substitui a skill original)

    // Todo uso válido conta para o denominador.
    prog.totalValidUses += 1;
    // E para o perfil de cada mutação cujo filtro casar (perfis podem se sobrepor).
    for (const def of defs) {
      if (matchesFilter(def.filter, facts)) {
        prog.profileCounts[def.id] = (prog.profileCounts[def.id] ?? 0) + 1;
      }
    }

    // Hint dos ~50%: usa o threshold da skill (todas as mutações concorrentes
    // compartilham o threshold de uso; é a MESMA skill). Pega o threshold do
    // primeiro def (devem ser iguais por skill — documentado).
    const threshold = defs[0].threshold;
    if (!this.anyHinted(prog) && prog.totalValidUses >= Math.ceil(threshold * HINT_FRACTION)) {
      // Hint atmosférico genérico da skill (não revela qual perfil domina).
      this.sink.hint(playerId, defs[0].flavor.hint);
      for (const def of defs) prog.hinted[def.id] = true;
    }

    // Resolução: ao cruzar o threshold de usos, vence a mutação cujo perfil
    // dominou (≥ minShare). Se nenhuma domina, ainda não muta (segue acumulando).
    if (prog.totalValidUses >= threshold) {
      const winner = this.pickMutationWinner(defs, prog);
      if (winner) {
        prog.resolved = winner.id;
        this.sink.unlock(playerId, "mutation", winner.name, winner.flavor.unlock);
      }
    }
  }

  private anyHinted(prog: SkillMutationProgress): boolean {
    for (const k in prog.hinted) if (prog.hinted[k]) return true;
    return false;
  }

  /** A mutação cujo share de usos ≥ minShare (maior share desempata). */
  private pickMutationWinner(defs: MutationDef[], prog: SkillMutationProgress): MutationDef | null {
    let best: MutationDef | null = null;
    let bestShare = 0;
    for (const def of defs) {
      const count = prog.profileCounts[def.id] ?? 0;
      const share = prog.totalValidUses > 0 ? count / prog.totalValidUses : 0;
      if (share >= def.minShare && share > bestShare) {
        best = def;
        bestShare = share;
      }
    }
    return best;
  }

  // ── CAMINHOS de ESTILO (path/style) — acúmulo ──────────────────────────

  private advanceStylePaths(playerId: number, event: string, facts: Facts): void {
    const ct = characterTracking(this.state, playerId);
    for (const def of this.paths) {
      if (def.flavorKind !== "style") continue;
      if (def.event !== event) continue;
      if (!matchesFilter(def.filter, facts)) continue;
      const prog = ct.pathsStyle[def.id] ?? (ct.pathsStyle[def.id] = { count: 0, hinted: false, unlocked: false });
      if (prog.unlocked) continue;
      prog.count += 1;
      this.maybeReveal(playerId, def, prog.count, def.threshold, () => prog.hinted, () => (prog.hinted = true), () => {
        prog.unlocked = true;
      });
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
        this.sink.unlock(playerId, "path", def.name, def.flavor.unlock);
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
      this.sink.unlock(playerId, def.category, def.name, def.flavor.unlock);
    }
  }
}
