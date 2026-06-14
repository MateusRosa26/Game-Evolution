import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";
import { TILE_SIZE } from "../../shared/constants";
import type { CorpseView, EntityState, Snapshot, StatusEffectState } from "../../shared/protocol";
import { DEFAULT_OUTFIT_BY_CLASS, OUTFIT_PART_BY_ID } from "../../shared/outfits";
import type { DamageType, Facing } from "../../shared/types";
import { outfitTextures } from "../assets/outfit/compose";
import { paperdollAttackTextures } from "../assets/outfit/paperdoll";
import { FLYING_SPECIES, PIXELLAB, PIXELLAB_CHAR_SCALE } from "../assets/pixellab";
import { makeProcKnight128, type SpriteLibrary } from "../assets/sprites";
import { skillMeta } from "../ui/skillMeta";

// TESTE remaster 128px: liga o char PROCEDURAL nativo (128×192) no player, no
// lugar do knight PixelLab 64px. Trocar p/ false volta ao PixelLab.
const PROC_CHAR_TEST = false; // teste concluído: PixelLab vence na qualidade; dye fica via paperdoll inpaint
let PROC_KNIGHT_CACHE: Record<Facing, Texture[]> | null = null;

/** Ciclo de caminhada: passo-esq, neutro, passo-dir, neutro. */
const WALK_CYCLE = [1, 0, 2, 0];

/**
 * Lado pro qual o sprite SUL de cada corpo "olha" (+1 direita, -1 esquerda) —
 * cada corpo gerado tem o seu; calibrado NO OLHO ao integrar (diagonais).
 */
const BODY_SOUTH_BIAS: Record<string, 1 | -1> = {
  homem: 1, // pose sul frontal/simétrica (canônicos base-avatar 128px)
  mulher: 1,
};

/**
 * Alias do SET do outfit → SET do CORPO (charBodies). O corpo é escolhido pelo
 * set do torso, mas os sets de ROUPA não têm corpo próprio e emprestam um corpo
 * base: `citizen` (a cara do CLASSLESS) usa o corpo do HOMEM jovem; os sets de
 * classe (knight/mage/etc) caem no corpo padrão (homem) até terem corpo próprio.
 */
const BODY_SET_ALIAS: Record<string, string> = {
  citizen: "homem",
};

/** SET do corpo a partir do SET do torso do outfit (aplica o alias acima). */
function bodySetOf(torsoSet: string | undefined): string | undefined {
  if (!torsoSet) return undefined;
  return BODY_SET_ALIAS[torsoSet] ?? torsoSet;
}

/**
 * Tempo parado (ms) antes de voltar ao frame neutro. Entre um passo e o
 * próximo snapshot há jitter de timer de alguns ms — sem essa folga, o sprite
 * "piscava" pro idle a cada passo e a caminhada nunca emendava o ciclo.
 */
const IDLE_RESET_MS = 90;
/** Duração da animação de ataque (4 frames ~95ms cada — golpe seco, estilo Apogea). */
const ATTACK_DUR_MS = 380;
/** Morte: o sprite "esvanece" (sobe + dissolve) enquanto solta a poeira/alma. */
const DEATH_DUR_MS = 440;

/** Floating damage text — sobe e some. */
const FLOAT_DUR_MS = 900;
const FLOAT_RISE_PX = 22;
/** Pop-in do número (escala 1.25→1, ou 1.5→1 em golpe grande). */
const FLOAT_POP_MS = 120;
/** Flash de hit: o alvo "estoura" branco 1–2 frames (DESIGN-VISUAL.md). */
const FLASH_DUR_MS = 120;

/**
 * Cor do floating number / partícula por tipo de dano — tabela única do
 * DESIGN-VISUAL.md §"Feedback de combate" (consistência total número↔partícula).
 * `arcane` reusa o roxo "Sombrio" do doc; `bleed` é o vermelho-sangue.
 */
const DAMAGE_COLOR: Record<DamageType, number> = {
  physical: 0xe8e4d8,
  fire: 0xff8c3a,
  ice: 0x6ec4e8,
  poison: 0x7ec850,
  bleed: 0xd83a32,
  holy: 0xffd86a,
  arcane: 0x9a6ad8,
  earth: 0x9b7b44, // marrom-terra (Garras da Terra)
  lightning: 0xeae27a, // amarelo-elétrico (raio)
  death: 0x6a4a7a, // roxo-fúnebre (Dreno Vital)
};

/**
 * Receita de partículas de impacto por tipo de dano (DESIGN-VISUAL.md:
 * "mínimas e por elemento — charme barato"). `tex` escolhe disco macio (spark)
 * ou losango cristalino (shard); `vy0` dá o viés vertical (brasa SOBE, gota CAI);
 * aditivos brilham (fogo/gelo/sagrado/arcano), sólidos cravam (físico/veneno/sangue).
 */
interface ImpactStyle {
  tex: "spark" | "shard";
  color: number;
  count: number;
  /** Rapidez radial base (px/s). */
  speed: number;
  /** Viés vertical inicial (px/s; negativo = pra cima). */
  vy0: number;
  /** Gravidade (px/s²; negativa = flutua/sobe). */
  gravity: number;
  life: number;
  size: number;
  additive: boolean;
}

const IMPACT: Record<DamageType, ImpactStyle> = {
  // faísca seca: estilhaços brancos espirram e caem rápido
  physical: { tex: "shard", color: 0xeae6da, count: 4, speed: 48, vy0: -12, gravity: 220, life: 260, size: 1, additive: false },
  // brasa: poucas, sobem flutuando e brilham (aditivo)
  fire: { tex: "spark", color: 0xffa442, count: 6, speed: 24, vy0: -34, gravity: -36, life: 460, size: 1.1, additive: true },
  // estilhaço de gelo: cristais que se abrem e caem, brilho frio
  ice: { tex: "shard", color: 0x8fd6f0, count: 5, speed: 52, vy0: -8, gravity: 180, life: 320, size: 1, additive: true },
  // gota de veneno: escorre pra baixo, sólida
  poison: { tex: "spark", color: 0x8ad65e, count: 5, speed: 18, vy0: 8, gravity: 150, life: 460, size: 1, additive: false },
  // fagulha sagrada: sobe e cintila, brilho dourado
  holy: { tex: "spark", color: 0xffe27a, count: 6, speed: 22, vy0: -28, gravity: 26, life: 480, size: 1, additive: true },
  // mote arcano: orbita pra cima, roxo brilhante
  arcane: { tex: "spark", color: 0xb083e0, count: 5, speed: 24, vy0: -22, gravity: 18, life: 440, size: 1, additive: true },
  // respingo de sangue: cai forte, sólido
  bleed: { tex: "spark", color: 0xd83a32, count: 5, speed: 30, vy0: 4, gravity: 280, life: 360, size: 0.9, additive: false },
  // torrão de terra: estilhaços terrosos que caem, sólidos
  earth: { tex: "shard", color: 0xa07b45, count: 5, speed: 40, vy0: -6, gravity: 240, life: 340, size: 1, additive: false },
  // centelha elétrica: rápida e brilhante, dispersa
  lightning: { tex: "spark", color: 0xf0e98a, count: 6, speed: 60, vy0: -16, gravity: 60, life: 300, size: 1, additive: true },
  // sopro fúnebre: motes roxos que sobem e dissolvem
  death: { tex: "spark", color: 0x9a6ad8, count: 5, speed: 22, vy0: -20, gravity: -10, life: 460, size: 1, additive: true },
};

/**
 * Projétil de cast (runa viajando from→to): velocidade CONSTANTE em px/ms —
 * a duração escala com a distância (1 tile não parece lento nem 7 tiles
 * parecem teleporte). Piso/teto para legibilidade.
 */
const CAST_SPEED_PX_PER_MS = 0.45; // ~14 tiles/s
const CAST_MIN_DUR_MS = 80;
const CAST_MAX_DUR_MS = 320;

/** Cor por tipo de status effect (apresentação dos ícones sobre a HP bar). */
const STATUS_COLOR: Record<StatusEffectState["kind"], number> = {
  burn: 0xff7a32,
  bleed: 0xc0392b, // sangramento (DoT físico): vermelho-sangue
  poison: 0x7ad15a,
  slow: 0x6fc8e8,
  root: 0x8a6d3b, // enraizamento (terra): marrom-raiz
  stun: 0xf2d24b, // atordoamento: amarelo-elétrico (estrelinhas)
  armorShred: 0xb5651d, // armadura rachada: laranja-ferrugem
  regenHoT: 0x7ae0a0, // cura-por-tick: verde-vida suave
  shield: 0x9db4e8, // escudo: azul-claro (barreira)
  wellFed: 0xe8b54a, // "Bem Alimentado": dourado quente de saciedade
  meal: 0xd2773a, // "Saciado" (buff de prato preparado): âmbar/assado, mais quente
};

interface FloatingText {
  text: Text;
  elapsed: number;
  /** Escala inicial do pop-in (1.25 normal, 1.5 golpe grande). */
  pop: number;
  /** Amplitude do shake horizontal (px) — só golpe grande; 0 = sem shake. */
  shake: number;
  /** X de âncora pro shake oscilar em volta (o número só sobe em Y). */
  baseX: number;
}

/** Partícula de impacto: sprite tintado com velocidade/gravidade e fade. */
interface Particle {
  spr: Sprite;
  vx: number;
  vy: number;
  gravity: number;
  elapsed: number;
  life: number;
}

/** Efeito de morte: fantasma (último frame do mob) que sobe e dissolve. */
interface DeathFx {
  spr: Sprite;
  elapsed: number;
}

interface CastProjectile {
  gfx: Graphics;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  elapsed: number;
  /** Duração do voo (derivada da distância — velocidade constante). */
  durMs: number;
}

/**
 * Estouro de ÁREA (groundTarget/selfRadius): anel que expande até o raio da
 * skill e some, colorido pela skill. Apresentação pura — a sim já resolveu.
 */
interface AreaBurst {
  gfx: Graphics;
  cx: number;
  cy: number;
  /** Raio final em px (raio em tiles × TILE_SIZE). */
  maxR: number;
  color: number;
  elapsed: number;
}

/** Duração do estouro de área (expande + esvanece). */
const BURST_DUR_MS = 360;

interface EntityVisual {
  container: Container;
  sprite: Sprite;
  /** Overlay branco aditivo do mesmo sprite — o flash de hit ao tomar dano. */
  flashSprite: Sprite;
  /** Tempo restante do flash de hit (ms); 0 = inativo. */
  flashClock: number;
  /** maxHp atual do alvo — define se um dano é "grande" (número maior + shake). */
  maxHp: number;
  /** Conjunto de texturas (knight/rat) deste visual. */
  textures: Record<Facing, Texture[]>;
  /** Frames de ataque deste visual (mob: espécie; char: golpe composto c/ peças). */
  attackTextures: Record<Facing, Texture[]> | null;
  nameText: Text;
  hpBar: Graphics;
  /** Ícones de status effect (burn/slow/poison) sobre a HP bar. */
  statusIcons: Graphics;
  /** Chave dos status desenhados (evita redesenhar todo tick). */
  statusKey: string;
  /** Indicador de telegraph (move de mob em windup — MECANICAS-DE-MOB.md). */
  telegraph: Graphics;
  telegraphing: boolean;
  telegraphClock: number;
  /** Barra de conjuração (cast-time) acima da cabeça — só enquanto `casting`. */
  castBar: Graphics;
  /** Skill conjurada atualmente (detecta troca → redesenha a barra). null = nada. */
  castSkillId: string | null;
  /** Último pct desenhado da barra de cast (evita redesenhar todo tick). */
  castPct: number;
  // tween de posição (em tiles, com fração)
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  tweenElapsed: number;
  tweenDur: number;
  facing: Facing;
  walkClock: number;
  /** Tempo restante da animação de ataque (one-shot disparada pelo evento damage). */
  attackClock: number;
  /** Tempo acumulado parado (p/ resetar a animação só após IDLE_RESET_MS). */
  idleMs: number;
  lastHpRatio: number;
  /** Espécie/skin do conjunto de texturas atual (troca de skin em runtime). */
  skinKey: string;
  /** Lado horizontal do último passo (-1/0/1) — espelha s/n nas diagonais. */
  stepDx: number;
  /** Espelho horizontal atual do sprite (diagonais). */
  mirrored: boolean;
}

/**
 * Mantém o estado visual das entidades e interpola entre snapshots —
 * a simulação anda em tiles discretos; aqui o passo vira movimento suave.
 */
export class EntityRenderer {
  private visuals = new Map<number, EntityVisual>();
  private playerId: number;
  /** Marcador de alvo (estilo Tibia) reparentado sob o monstro alvo. */
  private targetMarker: Sprite;
  /** Floating damage texts ativos. */
  private floats: FloatingText[] = [];
  /** Projéteis de cast ativos (runas viajando). */
  private casts: CastProjectile[] = [];
  /** Estouros de área ativos (anéis de groundTarget/selfRadius expandindo). */
  private bursts: AreaBurst[] = [];
  /** Partículas de impacto de combate ativas. */
  private particles: Particle[] = [];
  /** Fantasmas de morte ativos (sprite dissolvendo). */
  private deaths: DeathFx[] = [];
  /** Balões de fala ativos (presos às entidades). */
  private speeches: { text: Text; elapsed: number }[] = [];
  /** Cadáveres saqueáveis (sprite do mob deitado/escurecido), por containerId. */
  private corpseSprites = new Map<number, Sprite>();
  /** Overlay de tiles de PERIGO (telegraph de moves de área — MECANICAS-DE-MOB).
   *  Fica no chão, SOB as entidades; pulsa no tick. */
  private telegraphTiles = new Graphics();
  private telegraphPulse = 0;
  /** Telegraph de SKILLSHOT (groundTarget em cast): área-alvo no chão, sob as
   *  entidades, colorida pela skill. Redesenhado a cada snapshot; pulsa no tick. */
  private castTelegraphTiles = new Graphics();

  constructor(
    private sprites: SpriteLibrary,
    private layer: Container,
    playerId: number,
  ) {
    this.playerId = playerId;
    this.targetMarker = new Sprite(sprites.targetMarker);
    this.targetMarker.anchor.set(0.5, 0.5);
    this.targetMarker.visible = false;
    this.telegraphTiles.zIndex = -1000; // sob entidades/cadáveres, sobre o chão
    this.layer.addChild(this.telegraphTiles);
    this.castTelegraphTiles.zIndex = -999; // logo acima do perigo de mob, ainda sob entidades
    this.layer.addChild(this.castTelegraphTiles);
  }

  /** Texturas certas: mob pela espécie; player pelo OUTFIT (compositor+cache). */
  private texturesFor(e: EntityState): Record<Facing, Texture[]> {
    // TESTE 128: player (não-npc, não-mob) usa o knight procedural nativo.
    if (PROC_CHAR_TEST && e.kind !== "npc" && !e.species) {
      return (PROC_KNIGHT_CACHE ??= makeProcKnight128());
    }
    // PixelLab primeiro (norma 1:1); procedural segue como fallback eterno.
    if (e.species && PIXELLAB.mobs[e.species]) return PIXELLAB.mobs[e.species];
    if (e.species === "rato") return this.sprites.rat;
    // NPCs: sprite do elenco (PixelLab, estático sul) escolhido pelo npcId. Um
    // frame só → serve as 4 direções (NPC não anda). Ausência = cidadão procedural.
    if (e.kind === "npc") {
      const tex = e.npcId ? PIXELLAB.npcs[e.npcId] : undefined;
      if (tex) return { s: [tex], e: [tex], n: [tex], w: [tex] };
      return outfitTextures(
        {
          head: { part: "cabeca_cidadao", color: 21 },
          torso: { part: "camisa_cidadao", color: 41 },
          legs: { part: "calca_cidadao", color: 17 },
        },
        null,
      );
    }
    const outfit = e.outfit ?? DEFAULT_OUTFIT_BY_CLASS.classless;
    // CORPO: o `bodyType` (homem/mulher) escolhido pelo jogador tem prioridade;
    // senão cai no SET do torso (alias citizen→homem) e no corpo padrão (homem).
    const set = e.bodyType ?? bodySetOf(OUTFIT_PART_BY_ID[outfit.torso.part]?.set);
    const body = (set && PIXELLAB.charBodies[set]) || PIXELLAB.knight;
    if (body) return body;
    return outfitTextures(outfit, e.weapon?.templateId ?? null);
  }

  /** Chave do visual atual (detecta troca de outfit/arma em runtime). */
  private skinKeyOf(e: EntityState): string {
    if (e.species) return e.species;
    if (e.kind === "npc") return `npc|${e.npcId ?? "cidadao"}`;
    const o = e.outfit ?? DEFAULT_OUTFIT_BY_CLASS.classless;
    if (PIXELLAB.knight) {
      // corpo por set do torso (alias citizen→homem) — o skinKey carrega o set do
      // CORPO, usado pelo viés de espelho diagonal e pelo cache de skin.
      return `body|${e.bodyType ?? bodySetOf(OUTFIT_PART_BY_ID[o.torso.part]?.set) ?? "homem"}`;
    }
    return `${o.head.part}.${o.head.color}|${o.torso.part}.${o.torso.color}|${o.legs.part}.${o.legs.color}|${e.weapon?.templateId ?? "-"}`;
  }

  /** Frames de ATAQUE da entidade (mob pela espécie; char pelo golpe COMPOSTO). */
  private attackTexturesFor(e: EntityState): Record<Facing, Texture[]> | null {
    if (e.species) return PIXELLAB.mobAttacks[e.species] ?? null;
    if (!PIXELLAB.knight) return null;
    return paperdollAttackTextures(e.outfit ?? DEFAULT_OUTFIT_BY_CLASS.classless);
  }

  /** Cadáveres no chão: sprite do mob de lado + escurecido (apresentação). */
  setCorpses(corpses: CorpseView[]): void {
    const seen = new Set<number>();
    for (const c of corpses) {
      seen.add(c.id);
      if (this.corpseSprites.has(c.id)) continue;
      const set = c.species ? PIXELLAB.mobs[c.species] : undefined;
      const tex = set?.s?.[0] ?? (c.species === "rato" ? this.sprites.rat.s[0] : null);
      if (!tex) continue;
      const spr = new Sprite(tex);
      // Corpo "tombado": achata no eixo Y (parece deitado) sem encolher; tom
      // sem vida; âncora na base do tile como o mob vivo (não flutua nem mingua).
      spr.anchor.set(0.5, 0.92);
      spr.scale.set(1, 0.5);
      spr.tint = 0x8a8a96;
      spr.alpha = 0.9;
      spr.position.set((c.pos.x + 0.5) * TILE_SIZE, (c.pos.y + 1) * TILE_SIZE);
      spr.zIndex = spr.position.y - 8; // levemente atrás dos vivos no mesmo tile
      this.layer.addChild(spr);
      this.corpseSprites.set(c.id, spr);
    }
    for (const [id, spr] of [...this.corpseSprites]) {
      if (!seen.has(id)) {
        spr.destroy();
        this.corpseSprites.delete(id);
      }
    }
  }

  /** Posição visual atual do jogador local, em pixels de mundo (centro). */
  playerWorldPos(): { x: number; y: number } | null {
    const v = this.visuals.get(this.playerId);
    if (!v) return null;
    return { x: v.container.position.x, y: v.container.position.y - TILE_SIZE / 2 };
  }

  apply(snap: Snapshot): void {
    const seen = new Set<number>();
    const dangerTiles: { x: number; y: number }[] = []; // áreas de telegraph deste tick
    // Áreas-alvo de skillshots em conjuração (groundTarget com aim) — desenhadas
    // coloridas pela skill, sob as entidades, p/ o jogador ver ONDE vai cair.
    const castAreas: { x: number; y: number; radius: number; color: number }[] = [];
    for (const e of snap.entities) {
      seen.add(e.id);
      let v = this.visuals.get(e.id);
      if (!v) {
        v = this.createVisual(e);
        this.visuals.set(e.id, v);
      }
      // novo passo? inicia tween a partir da posição visual atual
      if (e.pos.x !== v.toX || e.pos.y !== v.toY) {
        const jump = Math.max(Math.abs(e.pos.x - v.toX), Math.abs(e.pos.y - v.toY)) > 1;
        if (jump) {
          // Teleporte (respawn de morte, blinks futuros): CORTA, não desliza —
          // tween aqui faria o sprite escorregar pelo mapa atravessando tudo.
          v.fromX = e.pos.x;
          v.fromY = e.pos.y;
          v.toX = e.pos.x;
          v.toY = e.pos.y;
          v.tweenElapsed = 0;
          v.tweenDur = 0;
        } else {
          // lado horizontal do passo (diagonais espelham o sprite s/n)
          v.stepDx = Math.sign(e.pos.x - v.toX);
          const cur = this.currentTilePos(v);
          v.fromX = cur.x;
          v.fromY = cur.y;
          v.toX = e.pos.x;
          v.toY = e.pos.y;
          v.tweenElapsed = 0;
          v.tweenDur = e.stepMs;
        }
      }
      if (e.facing !== v.facing) {
        v.facing = e.facing;
        this.applyFrame(v, this.currentFrame(v));
      }
      this.applyMirror(v, e);
      // troca de skin em runtime (hotkey 0): troca o conjunto de texturas
      const skinKey = this.skinKeyOf(e);
      if (skinKey !== v.skinKey) {
        v.skinKey = skinKey;
        v.textures = this.texturesFor(e);
        v.attackTextures = this.attackTexturesFor(e);
        this.applyFrame(v, this.currentFrame(v));
      }
      v.maxHp = e.maxHp;
      const ratio = e.maxHp > 0 ? e.hp / e.maxHp : 0;
      if (ratio !== v.lastHpRatio) {
        v.lastHpRatio = ratio;
        this.drawHpBar(v.hpBar, ratio);
      }
      // ── Indicadores de status effect sobre a HP bar ──
      const statusKey = e.status.map((s) => s.kind).join(",");
      if (statusKey !== v.statusKey) {
        v.statusKey = statusKey;
        this.drawStatusIcons(v.statusIcons, e.status);
      }
      // ── Telegraph de mecânica (windup de move): liga/desliga o anel de alerta ──
      v.telegraphing = !!e.telegraph;
      v.telegraph.visible = v.telegraphing;
      if (!v.telegraphing) v.telegraphClock = 0;
      if (e.telegraph?.tiles) dangerTiles.push(...e.telegraph.tiles); // área (slam)

      // ── Barra de conjuração (cast-time) + telegraph de skillshot no chão ──
      this.updateCastBar(v, e);
      if (e.casting?.aim) {
        const m = skillMeta(e.casting.skillId);
        castAreas.push({ x: e.casting.aim.x, y: e.casting.aim.y, radius: m.areaRadius ?? 0, color: m.color });
      }
    }
    this.drawDangerTiles(dangerTiles);
    this.drawCastAreas(castAreas);
    // Efeito de morte: captura o visual ANTES do diff de remoção o destruir
    // (o mob morto sai do snapshot no mesmo tick). Genérico por morte — kill que
    // conta pra Marca NÃO tem feedback especial (DESIGN-VISUAL.md/constituição).
    for (const ev of snap.events) {
      if (ev.kind === "death") {
        const dv = this.visuals.get(ev.entityId);
        if (dv) this.spawnDeath(dv);
      }
    }
    // remove quem saiu
    for (const [id, v] of this.visuals) {
      if (!seen.has(id)) {
        // o marcador de alvo é compartilhado — resgata antes de destruir o
        // container, senão destroy({children}) o leva junto e setTarget crasha
        if (this.targetMarker.parent === v.container) {
          v.container.removeChild(this.targetMarker);
          this.targetMarker.visible = false;
        }
        v.container.destroy({ children: true });
        this.visuals.delete(id);
      }
    }

    // ── Eventos one-shot do tick: floats, cast e cura ──
    // O snapshot do evento `damage` NÃO carrega o tipo (a sim guarda, mas não o
    // serializa). Correlaciona-se o `cast` do MESMO tick (mesmo atacante) pra
    // colorir o golpe; auto-attack/garra de mob/DoT sem cast = físico (branco).
    const castType = new Map<number, DamageType>();
    for (const ev of snap.events) {
      if (ev.kind === "cast") {
        const dt = skillMeta(ev.skillId).damageType;
        if (dt) castType.set(ev.casterId, dt);
      }
    }
    for (const ev of snap.events) {
      if (ev.kind === "damage") {
        const at = this.visualPosOf(ev.targetId, ev.pos);
        const type = castType.get(ev.attackerId) ?? "physical";
        const tv = this.visuals.get(ev.targetId);
        this.spawnDamageText(ev.amount, at.x, at.y, type, tv?.maxHp ?? 0);
        this.spawnImpact(type, at.x, at.y);
        // flash de hit no ALVO + animação de ataque no ATACANTE
        if (tv) tv.flashClock = FLASH_DUR_MS;
        const av = this.visuals.get(ev.attackerId);
        if (av?.attackTextures) av.attackClock = ATTACK_DUR_MS;
      } else if (ev.kind === "cast") {
        const mode = skillMeta(ev.skillId).target;
        if (mode === "ground" || mode === "selfBurst" || mode === "self") {
          // Área/burst: estoura no destino (selfRadius/self = caster; ground = aim).
          this.spawnAreaBurst(ev.skillId, ev.casterId, ev.from, ev.to);
        } else {
          // projétil (alvo único / cadeia): runa viaja from→to a velocidade const.
          this.spawnCast(ev.skillId, ev.casterId, ev.from, ev.to);
        }
      } else if (ev.kind === "heal") {
        const at = this.visualPosOf(ev.targetId, ev.pos);
        this.spawnHealText(ev.amount, at.x, at.y);
      }
      // death: a remoção visual já acontece pelo diff de entidades acima.
    }

    // ── Marcador de alvo (targetId é por-jogador: lê da PRÓPRIA entidade) ──
    const me = snap.entities.find((e) => e.id === this.playerId);
    this.setTarget(me?.targetId ?? null);
  }

  /** Reposiciona/atualiza o marcador de alvo sob o monstro selecionado. */
  private setTarget(id: number | null): void {
    const v = id != null ? this.visuals.get(id) : undefined;
    if (!v) {
      this.targetMarker.visible = false;
      if (this.targetMarker.parent) this.targetMarker.parent.removeChild(this.targetMarker);
      return;
    }
    // ancorado no container do alvo (segue a interpolação de posição)
    if (this.targetMarker.parent !== v.container) {
      v.container.addChild(this.targetMarker);
    }
    this.targetMarker.position.set(0, -TILE_SIZE / 2);
    this.targetMarker.visible = true;
  }

  /**
   * Texto flutuante dourado "SUBIU DE NÍVEL!" sobre o jogador (apresentação:
   * o Game detecta a subida comparando snapshots e chama isto). Ancorado no
   * container do player para seguir a interpolação de posição.
   */
  /** Balão de fala (Tibia/Apogea): texto branco preso à entidade, sobe e some. */
  spawnSpeech(entityId: number, text: string): void {
    const v = this.visuals.get(entityId);
    if (!v) return;
    const t = new Text({
      text: text.length > 60 ? text.slice(0, 60) + "…" : text,
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fontWeight: "bold",
        fill: 0xf4f0e6,
        stroke: { color: 0x10141c, width: 3 },
        align: "center",
        wordWrap: true,
        wordWrapWidth: 130,
      },
    });
    t.resolution = 3;
    t.anchor.set(0.5, 1);
    t.position.set(0, -TILE_SIZE - 10);
    t.zIndex = 1e9;
    v.container.addChild(t);
    // dura mais que dano (leitura): 2.4s parado-ish + fade. Pool de speech.
    this.speeches.push({ text: t, elapsed: 0 });
  }

  spawnLevelUpText(): void {
    const v = this.visuals.get(this.playerId);
    if (!v) return;
    const text = new Text({
      text: "SUBIU DE NÍVEL!",
      style: {
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
        fill: 0xffd95a,
        stroke: { color: 0x10141c, width: 4 },
      },
    });
    text.resolution = 4;
    text.anchor.set(0.5, 1);
    text.position.set(0, -TILE_SIZE - 8);
    text.zIndex = 1e9;
    v.container.addChild(text);
    // Reusa o pool de floats: sobe e some sobre o player.
    this.floats.push({ text, elapsed: 0, pop: 1.3, shake: 0, baseX: text.x });
  }

  /**
   * Posição visual (interpolada) de uma entidade em px de mundo — onde o
   * jogador VÊ o alvo, não o tile da sim (mob no meio do passo). Fallback:
   * centro do tile do evento (entidade já removida, ex.: golpe fatal).
   */
  private visualPosOf(entityId: number, fallbackTile: { x: number; y: number }): { x: number; y: number } {
    const v = this.visuals.get(entityId);
    if (v) return { x: v.container.position.x, y: v.container.position.y - TILE_SIZE * 0.4 };
    return { x: (fallbackTile.x + 0.5) * TILE_SIZE, y: (fallbackTile.y + 0.6) * TILE_SIZE };
  }

  /**
   * Floating number colorido por tipo de dano (DESIGN-VISUAL.md). Golpe que
   * leva ≥33% do maxHp do alvo é "grande": fonte maior + shake breve (o "crit"
   * do doc — sem flag de crítico no snapshot, a régua é o peso do golpe).
   */
  private spawnDamageText(amount: number, worldX: number, worldY: number, type: DamageType, maxHp: number): void {
    const big = maxHp > 0 && amount / maxHp >= 0.33;
    const text = new Text({
      text: `${amount}`,
      style: {
        fontFamily: "monospace",
        fontSize: big ? 15 : 11,
        fontWeight: "bold",
        fill: DAMAGE_COLOR[type],
        stroke: { color: 0x10141c, width: big ? 4 : 3 },
      },
    });
    text.resolution = 4;
    text.anchor.set(0.5, 1);
    text.position.set(worldX, worldY);
    text.zIndex = 1e9; // sempre por cima
    this.layer.addChild(text);
    this.floats.push({ text, elapsed: 0, pop: big ? 1.5 : 1.25, shake: big ? 2.5 : 0, baseX: worldX });
  }

  /**
   * Burst de partículas de impacto no ponto de hit, conforme a receita do tipo
   * de dano. Espalha radialmente com viés vertical + gravidade por elemento.
   */
  private spawnImpact(type: DamageType, worldX: number, worldY: number): void {
    const s = IMPACT[type];
    const tex = s.tex === "shard" ? this.sprites.shard : this.sprites.spark;
    for (let i = 0; i < s.count; i++) {
      const spr = new Sprite(tex);
      spr.anchor.set(0.5);
      spr.tint = s.color;
      if (s.additive) spr.blendMode = "add";
      spr.scale.set(s.size * (0.7 + Math.random() * 0.6));
      spr.position.set(worldX + (Math.random() - 0.5) * 6, worldY + (Math.random() - 0.5) * 6);
      spr.zIndex = 1e9 - 1; // sob o número, sobre o mundo/entidades
      this.layer.addChild(spr);
      const ang = Math.random() * Math.PI * 2;
      const sp = s.speed * (0.5 + Math.random());
      // achata o eixo Y (mundo top-down) e soma o viés vertical do elemento
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp * 0.55 + s.vy0;
      this.particles.push({ spr, vx, vy, gravity: s.gravity, elapsed: 0, life: s.life });
    }
  }

  /**
   * Efeito de morte (DESIGN-VISUAL.md "mob esvanece + partículas"): clona o
   * último frame do mob num sprite-fantasma que sobe e dissolve, e solta uma
   * baforada de poeira/alma pálida subindo. Texturas são compartilhadas (cache),
   * então destruir o visual original depois não afeta o fantasma.
   */
  private spawnDeath(v: EntityVisual): void {
    const ghost = new Sprite(v.sprite.texture);
    ghost.anchor.set(0.5, 1);
    // posição de mundo = base do container + offset local do sprite (baseline/voo)
    ghost.position.set(
      v.container.position.x + v.sprite.position.x,
      v.container.position.y + v.sprite.position.y,
    );
    ghost.scale.copyFrom(v.sprite.scale); // preserva escala do char e espelho
    ghost.zIndex = v.container.position.y;
    this.layer.addChild(ghost);
    this.deaths.push({ spr: ghost, elapsed: 0 });
    this.spawnDeathBurst(ghost.position.x, ghost.position.y - TILE_SIZE * 0.4);
  }

  /** Baforada pálida e fria (poeira/alma) subindo do ponto de morte. */
  private spawnDeathBurst(worldX: number, worldY: number): void {
    for (let i = 0; i < 8; i++) {
      const spr = new Sprite(this.sprites.spark);
      spr.anchor.set(0.5);
      spr.tint = 0xc2cdd8; // pálido frio — leitura de "alma/poeira", não elemento
      spr.blendMode = "add";
      spr.scale.set(0.7 + Math.random() * 0.7);
      spr.position.set(worldX + (Math.random() - 0.5) * 14, worldY + (Math.random() - 0.5) * 10);
      spr.zIndex = 1e9 - 1;
      this.layer.addChild(spr);
      const ang = Math.random() * Math.PI * 2;
      const sp = 14 * (0.4 + Math.random());
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp * 0.5 - 26; // viés pra cima (a alma sobe)
      this.particles.push({ spr, vx, vy, gravity: -8, elapsed: 0, life: 560 });
    }
  }

  /** Floating text VERDE de cura sobre o alvo (segue o padrão do dano). */
  private spawnHealText(amount: number, worldX: number, worldY: number): void {
    const text = new Text({
      text: `+${amount}`,
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: 0x5fe06a,
        stroke: { color: 0x10141c, width: 3 },
      },
    });
    text.resolution = 4;
    text.anchor.set(0.5, 1);
    text.position.set(worldX, worldY);
    text.zIndex = 1e9;
    this.layer.addChild(text);
    this.floats.push({ text, elapsed: 0, pop: 1.25, shake: 0, baseX: worldX });
  }

  /**
   * Projétil de cast (runa de Tibia): círculo colorido pela skill viajando de
   * `from`→`to` a velocidade constante. Origem = posição VISUAL do caster
   * (mid-step), destino = tile do evento. APRESENTAÇÃO pura — a sim já
   * resolveu o efeito.
   */
  private spawnCast(
    skillId: string,
    casterId: number,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    const color = skillMeta(skillId).color;
    const gfx = new Graphics();
    gfx.circle(0, 0, 4).fill({ color, alpha: 0.95 });
    gfx.circle(0, 0, 6).stroke({ color, alpha: 0.4, width: 2 });
    gfx.zIndex = 1e9;
    this.layer.addChild(gfx);
    const origin = this.visualPosOf(casterId, from);
    const toX = (to.x + 0.5) * TILE_SIZE;
    const toY = (to.y + 0.5) * TILE_SIZE;
    const dist = Math.hypot(toX - origin.x, toY - origin.y);
    const durMs = Math.min(CAST_MAX_DUR_MS, Math.max(CAST_MIN_DUR_MS, dist / CAST_SPEED_PX_PER_MS));
    this.casts.push({ gfx, fromX: origin.x, fromY: origin.y, toX, toY, elapsed: 0, durMs });
  }

  /**
   * Estouro de ÁREA (groundTarget no `to` mirado / selfRadius centrado no caster):
   * um anel que expande até o raio da skill e some, mais uma chuva de partículas de
   * impacto do tipo de dano por todo o raio. APRESENTAÇÃO — a sim já resolveu o efeito.
   */
  private spawnAreaBurst(
    skillId: string,
    casterId: number,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    const meta = skillMeta(skillId);
    // selfRadius/self estouram no caster (posição VISUAL); ground no tile do evento.
    const center =
      meta.target === "ground"
        ? { x: (to.x + 0.5) * TILE_SIZE, y: (to.y + 0.6) * TILE_SIZE }
        : this.visualPosOf(casterId, from);
    const radiusTiles = meta.areaRadius ?? 1;
    const maxR = (radiusTiles + 0.5) * TILE_SIZE;
    const gfx = new Graphics();
    gfx.zIndex = 1e9 - 2; // sob números/partículas, sobre o mundo
    this.layer.addChild(gfx);
    this.bursts.push({ gfx, cx: center.x, cy: center.y, maxR, color: meta.color, elapsed: 0 });
    // Chuva de partículas do elemento por todo o raio (charme barato, reusa IMPACT).
    if (meta.damageType) {
      const span = radiusTiles * TILE_SIZE;
      const shots = 1 + radiusTiles;
      for (let i = 0; i < shots; i++) {
        const ox = (Math.random() - 0.5) * 2 * span;
        const oy = (Math.random() - 0.5) * 2 * span * 0.6;
        this.spawnImpact(meta.damageType, center.x + ox, center.y + oy);
      }
    }
  }

  tick(deltaMS: number): void {
    // Pulso do overlay de tiles de perigo (alerta de área telegrafada).
    this.telegraphPulse += deltaMS;
    this.telegraphTiles.alpha = 0.55 + 0.45 * Math.abs(Math.sin(this.telegraphPulse / 150));
    // mira de skillshot pulsa mais suave (previsão, não perigo iminente de mob)
    this.castTelegraphTiles.alpha = 0.7 + 0.3 * Math.abs(Math.sin(this.telegraphPulse / 220));
    for (const v of this.visuals.values()) {
      const moving = v.tweenElapsed < v.tweenDur;
      if (moving) {
        v.tweenElapsed = Math.min(v.tweenElapsed + deltaMS, v.tweenDur);
        v.walkClock += deltaMS;
        v.idleMs = 0;
      } else if (v.walkClock !== 0) {
        // Só volta ao frame neutro após uma folga — um passo emenda no outro
        // sem o sprite piscar pro idle entre snapshots.
        v.idleMs += deltaMS;
        if (v.idleMs >= IDLE_RESET_MS) {
          v.walkClock = 0;
          this.applyFrame(v, 0);
        }
      }
      const cur = this.currentTilePos(v);
      // Snap a pixel de mundo inteiro (remaster 64px, zoom 1× → 1px mundo = 1px
      // tela): mata o shimmer de subpixel do pixel art (nearest) em movimento,
      // sem serrilhar o tween. (No zoom 2× antigo era meio-pixel × 2.)
      v.container.position.set(
        Math.round((cur.x + 0.5) * TILE_SIZE),
        Math.round((cur.y + 1) * TILE_SIZE),
      );
      v.container.zIndex = v.container.position.y;
      if (moving) this.applyFrame(v, this.currentFrame(v));

      // Ataque tem prioridade sobre walk/idle enquanto durar (one-shot).
      if (v.attackClock > 0) {
        v.attackClock -= deltaMS;
        const atk = v.attackTextures?.[v.facing];
        if (atk && v.attackClock > 0) {
          const t = 1 - v.attackClock / ATTACK_DUR_MS;
          v.sprite.texture = atk[Math.min(Math.floor(t * atk.length), atk.length - 1)];
        } else {
          // expirou neste tick: devolve o frame de walk/idle imediatamente
          this.applyFrame(v, moving ? this.currentFrame(v) : 0);
        }
      }

      // Flash de hit: overlay branco aditivo do MESMO frame (segue troca de
      // textura/espelho durante o flash), alpha decaindo 0.75→0.
      if (v.flashClock > 0) {
        v.flashClock -= deltaMS;
        const f = v.flashSprite;
        if (v.flashClock > 0) {
          f.visible = true;
          f.texture = v.sprite.texture;
          f.position.copyFrom(v.sprite.position);
          f.scale.copyFrom(v.sprite.scale);
          f.alpha = 0.75 * (v.flashClock / FLASH_DUR_MS);
        } else {
          f.visible = false;
          f.alpha = 0;
        }
      }

      // ── Pulso do anel de telegraph (mob avisando um move em windup) ──
      if (v.telegraphing) {
        v.telegraphClock += deltaMS;
        const p = Math.abs(Math.sin(v.telegraphClock / 110)); // ~3 Hz, alerta
        v.telegraph.alpha = 0.45 + 0.55 * p;
        v.telegraph.scale.set(0.85 + 0.3 * p);
      }
    }

    // floating damage text: sobe, dá pop-in, faz shake (golpe grande) e some
    for (const f of this.floats) {
      f.elapsed += deltaMS;
      const t = Math.min(f.elapsed / FLOAT_DUR_MS, 1);
      f.text.y -= (FLOAT_RISE_PX / FLOAT_DUR_MS) * deltaMS;
      f.text.alpha = 1 - t * t;
      // pop-in: escala pop→1 nos primeiros FLOAT_POP_MS
      const pt = Math.min(f.elapsed / FLOAT_POP_MS, 1);
      f.text.scale.set(f.pop + (1 - f.pop) * pt);
      // shake horizontal (só golpe grande): oscila em volta de baseX e decai
      if (f.shake > 0) {
        const decay = Math.max(0, 1 - f.elapsed / 180);
        f.text.x = f.baseX + (Math.random() - 0.5) * 2 * f.shake * decay;
      }
    }
    this.floats = this.floats.filter((f) => {
      if (f.elapsed >= FLOAT_DUR_MS) {
        f.text.destroy();
        return false;
      }
      return true;
    });

    // partículas de impacto: velocidade + gravidade (px/s) e fade quadrático
    for (const p of this.particles) {
      p.elapsed += deltaMS;
      const dt = deltaMS / 1000;
      p.vy += p.gravity * dt;
      p.spr.x += p.vx * dt;
      p.spr.y += p.vy * dt;
      const t = Math.min(p.elapsed / p.life, 1);
      p.spr.alpha = 1 - t * t;
    }
    this.particles = this.particles.filter((p) => {
      if (p.elapsed >= p.life) {
        p.spr.destroy();
        return false;
      }
      return true;
    });

    // fantasmas de morte: sobem ~12px e dissolvem (fade quadrático)
    for (const d of this.deaths) {
      d.elapsed += deltaMS;
      const t = Math.min(d.elapsed / DEATH_DUR_MS, 1);
      d.spr.y -= (12 / DEATH_DUR_MS) * deltaMS;
      d.spr.alpha = 1 - t * t;
    }
    this.deaths = this.deaths.filter((d) => {
      if (d.elapsed >= DEATH_DUR_MS) {
        d.spr.destroy();
        return false;
      }
      return true;
    });

    // balões de fala: 2.4s legíveis, fade nos últimos 0.6s
    const SPEECH_DUR = 2400;
    for (const s of this.speeches) {
      s.elapsed += deltaMS;
      const left = SPEECH_DUR - s.elapsed;
      s.text.alpha = left < 600 ? Math.max(0, left / 600) : 1;
    }
    this.speeches = this.speeches.filter((s) => {
      if (s.elapsed >= SPEECH_DUR) {
        s.text.destroy();
        return false;
      }
      return true;
    });

    // projéteis de cast: viajam from→to a velocidade constante e somem ao chegar
    for (const c of this.casts) {
      c.elapsed += deltaMS;
      const t = Math.min(c.elapsed / c.durMs, 1);
      c.gfx.position.set(c.fromX + (c.toX - c.fromX) * t, c.fromY + (c.toY - c.fromY) * t);
    }
    this.casts = this.casts.filter((c) => {
      if (c.elapsed >= c.durMs) {
        c.gfx.destroy();
        return false;
      }
      return true;
    });

    // estouros de área: anel que expande até maxR e esvanece (ease-out)
    for (const b of this.bursts) {
      b.elapsed += deltaMS;
      const t = Math.min(b.elapsed / BURST_DUR_MS, 1);
      const ease = 1 - (1 - t) * (1 - t); // ease-out (rápido no começo)
      const r = Math.max(1, b.maxR * ease);
      b.gfx.clear();
      b.gfx.circle(b.cx, b.cy, r).fill({ color: b.color, alpha: 0.18 * (1 - t) });
      b.gfx.circle(b.cx, b.cy, r).stroke({ color: b.color, width: 2, alpha: 0.9 * (1 - t) });
    }
    this.bursts = this.bursts.filter((b) => {
      if (b.elapsed >= BURST_DUR_MS) {
        b.gfx.destroy();
        return false;
      }
      return true;
    });
  }

  private currentTilePos(v: EntityVisual): { x: number; y: number } {
    const t = v.tweenDur > 0 ? Math.min(v.tweenElapsed / v.tweenDur, 1) : 1;
    return {
      x: v.fromX + (v.toX - v.fromX) * t,
      y: v.fromY + (v.toY - v.fromY) * t,
    };
  }

  private currentFrame(v: EntityVisual): number {
    if (v.walkClock === 0) return 0;
    // Conjuntos de 4+ frames (PixelLab) tocam o ciclo completo por passo;
    // os procedurais de 3 usam o ciclo clássico passo-neutro-passo-neutro.
    const frames = v.textures[v.facing];
    const cycle = frames.length >= 4 ? [0, 1, 2, 3] : WALK_CYCLE;
    const period = Math.max(v.tweenDur / cycle.length, 70);
    return cycle[Math.floor(v.walkClock / period) % cycle.length];
  }

  private applyFrame(v: EntityVisual, frame: number): void {
    // Conjuntos com menos frames (ex: preview PixelLab com 1) usam o último.
    const frames = v.textures[v.facing];
    v.sprite.texture = frames[Math.min(frame, frames.length - 1)];
  }

  /**
   * Diagonais: o facing s/n domina (decisão do criador), e o LADO horizontal
   * do passo entra por ESPELHO. O corpo canônico atual (receita jun/2026)
   * "olha" pro lado DIREITO no sul e esquerdo no norte — espelha no oposto.
   * Apresentação pura (o renderer conhece o dx do tween).
   */
  private applyMirror(v: EntityVisual, e: EntityState): void {
    // viés POR CORPO: lado pro qual o sprite SUL "olha" (+1 direita, -1 esquerda)
    const set = v.skinKey.startsWith("body|") ? v.skinKey.slice(5) : null;
    const bias = set ? (BODY_SOUTH_BIAS[set] ?? 1) : -1; // mobs/procedural: convenção antiga
    let mirrored = false;
    if (e.facing === "s") mirrored = v.stepDx === -bias;
    else if (e.facing === "n") mirrored = v.stepDx === bias;
    if (mirrored === v.mirrored) return;
    v.mirrored = mirrored;
    const base = Math.abs(v.sprite.scale.x) || 1;
    v.sprite.scale.x = mirrored ? -base : base;
  }

  private createVisual(e: EntityState): EntityVisual {
    const container = new Container();
    const textures = this.texturesFor(e);

    const shadow = new Sprite(this.sprites.shadow);
    shadow.anchor.set(0.5, 0.5);
    // Sombra de contato sob os pés — dimensionada pela base do tile (64px),
    // não por literais de 32px. Elipse a ~85%×20% da largura do tile.
    shadow.width = TILE_SIZE * 0.875;
    shadow.height = TILE_SIZE * 0.2;
    shadow.position.set(1, -4);
    container.addChild(shadow);

    const sprite = new Sprite(textures[e.facing][0]);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(0, 0);
    // remaster 128: upscale inteiro temporário até regen nativa do PixelLab.
    // Mobs PixelLab têm altura nativa < TILE_SIZE (64px = meio tile); escala
    // inteira (=2 p/ 64px) os enche no tile sem shim fracionário. O char paperdoll
    // já vem 128 (compose.ts) → altura nativa ≥ TILE_SIZE, fator 1 (intocado).
    const nativeH = textures[e.facing][0]?.height || TILE_SIZE;
    // mob: upscale INTEIRO enche o tile (64→128). PLAYER: 1.25× tile (asset 128px
    // nativo → ~160px), tunável em PIXELLAB_CHAR_SCALE. NPC: sprite próprio já no alvo.
    const upscale = e.species
      ? Math.max(1, Math.round(TILE_SIZE / nativeH))
      : e.kind === "npc"
        ? 1
        : PIXELLAB_CHAR_SCALE;
    if (upscale !== 1) sprite.scale.set(upscale);
    // Grounding: voadores pairam (offset fixo); terrestres descem pelo padding
    // transparente medido no load — sem isso o sprite "flutuava" no tile. O baseline
    // é medido em px NATIVOS, então escala junto com o sprite (position é pré-escala).
    if (e.species) {
      sprite.position.y = FLYING_SPECIES.has(e.species)
        ? -6 * upscale
        : (PIXELLAB.mobBaseline[e.species] ?? 0) * upscale;
    }
    container.addChild(sprite);

    // Overlay do flash de hit: cópia aditiva do sprite (sincronizada no tick).
    // Acima do sprite, abaixo de nome/HP (que entram depois no container).
    const flashSprite = new Sprite(sprite.texture);
    flashSprite.anchor.set(0.5, 1);
    flashSprite.blendMode = "add";
    flashSprite.alpha = 0;
    flashSprite.visible = false;
    flashSprite.position.copyFrom(sprite.position);
    flashSprite.scale.copyFrom(sprite.scale);
    container.addChild(flashSprite);

    const nameText = new Text({
      text: e.name,
      style: {
        fontFamily: "monospace",
        fontSize: 8,
        fill: e.kind === "player" ? 0xd8e0b8 : 0xc8c8c8,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    nameText.resolution = 4;
    nameText.anchor.set(0.5, 1);
    // Offsets de UI acima da cabeça: derivam da altura do tile (64px) — a figura
    // ocupa ~1 tile, então nome/HP ficam logo acima de TILE_SIZE para não cobri-la.
    nameText.position.set(0, -TILE_SIZE - 2);
    container.addChild(nameText);

    const hpBar = new Graphics();
    hpBar.position.set(-14, -TILE_SIZE - 1);
    container.addChild(hpBar);

    // ícones de status: à direita da HP bar (HP bar vai de x=-14 a x=14)
    const statusIcons = new Graphics();
    statusIcons.position.set(16, -TILE_SIZE - 1);
    container.addChild(statusIcons);

    // Telegraph: anel de alerta "carregando" acima da cabeça (mob em windup de
    // mecânica). Pulsa no tick; visível só enquanto há `telegraph` no snapshot.
    const telegraph = new Graphics();
    telegraph.circle(0, 0, 5).stroke({ color: 0xffcc33, width: 2 });
    telegraph.position.set(0, -TILE_SIZE - 10);
    telegraph.visible = false;
    container.addChild(telegraph);

    // Barra de cast (cast-time): acima do nome/HP, só visível enquanto conjura.
    const castBar = new Graphics();
    castBar.position.set(-14, -50);
    castBar.visible = false;
    container.addChild(castBar);

    const v: EntityVisual = {
      container,
      sprite,
      flashSprite,
      flashClock: 0,
      maxHp: e.maxHp,
      textures,
      nameText,
      hpBar,
      statusIcons,
      statusKey: "",
      telegraph,
      telegraphing: false,
      telegraphClock: 0,
      castBar,
      castSkillId: null,
      castPct: -1,
      fromX: e.pos.x,
      fromY: e.pos.y,
      toX: e.pos.x,
      toY: e.pos.y,
      tweenElapsed: 0,
      tweenDur: 0,
      facing: e.facing,
      walkClock: 0,
      attackClock: 0,
      attackTextures: this.attackTexturesFor(e),
      idleMs: 0,
      lastHpRatio: -1,
      skinKey: this.skinKeyOf(e),
      stepDx: 0,
      mirrored: false,
    };
    container.position.set((e.pos.x + 0.5) * TILE_SIZE, (e.pos.y + 1) * TILE_SIZE);
    container.zIndex = container.position.y;
    this.layer.addChild(container);
    return v;
  }

  /**
   * Barra de conjuração (cast-time) acima da cabeça: aparece enquanto a entidade
   * tem `casting` no snapshot e segue `casting.pct` (0→1). Some quando o cast
   * termina/cancela. Cor pela skill (identidade visual). APRESENTAÇÃO pura.
   */
  private updateCastBar(v: EntityVisual, e: EntityState): void {
    const casting = e.casting;
    if (!casting) {
      if (v.castSkillId !== null) {
        v.castSkillId = null;
        v.castPct = -1;
        v.castBar.visible = false;
        v.castBar.clear();
      }
      return;
    }
    v.castBar.visible = true;
    // Redesenha só quando muda a skill ou o pct (em passos de 1px de preenchimento).
    const W = 28;
    const fill = Math.max(0, Math.min(W - 2, Math.round((W - 2) * casting.pct)));
    if (casting.skillId === v.castSkillId && Math.round((W - 2) * v.castPct) === fill) return;
    v.castSkillId = casting.skillId;
    v.castPct = casting.pct;
    const color = skillMeta(casting.skillId).color;
    const g = v.castBar;
    g.clear();
    g.rect(0, 0, W, 4).fill({ color: 0x10141c, alpha: 0.9 });
    if (fill > 0) g.rect(1, 1, fill, 2).fill({ color, alpha: 0.95 });
    g.rect(0, 0, W, 4).stroke({ color: 0x000307, width: 1, alpha: 0.6 });
  }

  /**
   * Redesenha o telegraph de SKILLSHOT (groundTarget em conjuração): a área-alvo
   * no chão (tile mirado + raio Chebyshev), colorida pela skill, sob as entidades.
   * É só PREVISÃO visual — a sim resolve o efeito no fim do cast.
   */
  private drawCastAreas(areas: { x: number; y: number; radius: number; color: number }[]): void {
    const g = this.castTelegraphTiles;
    g.clear();
    for (const a of areas) {
      const r = Math.max(0, a.radius);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          g.rect((a.x + dx) * TILE_SIZE, (a.y + dy) * TILE_SIZE, TILE_SIZE, TILE_SIZE)
            .fill({ color: a.color, alpha: 0.22 });
        }
      }
      // borda no tile central de mira (foco da skillshot)
      g.rect(a.x * TILE_SIZE, a.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        .stroke({ color: a.color, width: 1, alpha: 0.9 });
    }
  }

  /** Redesenha o overlay de tiles de PERIGO (área de um move telegrafado): um
   *  preenchimento vermelho translúcido + borda por tile, em world-pixels. */
  private drawDangerTiles(tiles: { x: number; y: number }[]): void {
    const g = this.telegraphTiles;
    g.clear();
    for (const t of tiles) {
      g.rect(t.x * TILE_SIZE, t.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        .fill({ color: 0xcc3322, alpha: 0.3 })
        .stroke({ color: 0xff6644, width: 1, alpha: 0.85 });
    }
  }

  private drawHpBar(g: Graphics, ratio: number): void {
    g.clear();
    g.rect(0, 0, 28, 3).fill({ color: 0x10141c, alpha: 0.9 });
    const w = Math.max(0, Math.round(26 * ratio));
    const color = ratio > 0.5 ? 0x58a85a : ratio > 0.25 ? 0xc8a84b : 0xb8333f;
    if (w > 0) g.rect(1, 1, w, 1).fill(color);
  }

  /**
   * Ícones minúsculos de status (chama=burn, floco=slow, gota=poison) sobre a
   * HP bar de quem tem status ativo. Glifos procedurais simples via Graphics —
   * só apresentação (a duração/efeito vive na sim).
   */
  private drawStatusIcons(g: Graphics, status: StatusEffectState[]): void {
    g.clear();
    const size = 6;
    const gap = 2;
    for (let i = 0; i < status.length; i++) {
      const s = status[i];
      const color = STATUS_COLOR[s.kind];
      const cx = i * (size + gap) + size / 2;
      const cy = 1 + size / 2;
      // fundo escuro p/ contraste
      g.circle(cx, cy, size / 2 + 1).fill({ color: 0x10141c, alpha: 0.9 });
      if (s.kind === "burn") {
        // chama: triângulo apontando p/ cima
        g.poly([cx, cy - size / 2, cx + size / 2, cy + size / 2, cx - size / 2, cy + size / 2]).fill(color);
      } else if (s.kind === "slow") {
        // floco: losango
        g.poly([cx, cy - size / 2, cx + size / 2, cy, cx, cy + size / 2, cx - size / 2, cy]).fill(color);
      } else {
        // poison: gota (círculo)
        g.circle(cx, cy, size / 2).fill(color);
      }
    }
  }
}
