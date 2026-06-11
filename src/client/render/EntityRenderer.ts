import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";
import { TILE_SIZE } from "../../shared/constants";
import type { CorpseView, EntityState, Snapshot, StatusEffectState } from "../../shared/protocol";
import { DEFAULT_OUTFIT_BY_CLASS, OUTFIT_PART_BY_ID } from "../../shared/outfits";
import type { DamageType, Facing } from "../../shared/types";
import { outfitTextures } from "../assets/outfit/compose";
import { paperdollAttackTextures } from "../assets/outfit/paperdoll";
import { FLYING_SPECIES, PIXELLAB, PIXELLAB_CHAR_SCALE } from "../assets/pixellab";
import type { SpriteLibrary } from "../assets/sprites";
import { skillMeta } from "../ui/skillMeta";

/** Ciclo de caminhada: passo-esq, neutro, passo-dir, neutro. */
const WALK_CYCLE = [1, 0, 2, 0];

/**
 * Lado pro qual o sprite SUL de cada corpo "olha" (+1 direita, -1 esquerda) —
 * cada corpo gerado tem o seu; calibrado NO OLHO ao integrar (diagonais).
 */
const BODY_SOUTH_BIAS: Record<string, 1 | -1> = {
  knight: -1,
  mage: 1,
};

/**
 * Tempo parado (ms) antes de voltar ao frame neutro. Entre um passo e o
 * próximo snapshot há jitter de timer de alguns ms — sem essa folga, o sprite
 * "piscava" pro idle a cada passo e a caminhada nunca emendava o ciclo.
 */
const IDLE_RESET_MS = 90;
/** Duração da animação de ataque (4 frames ~95ms cada — golpe seco, estilo Apogea). */
const ATTACK_DUR_MS = 380;

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
  slow: 0x6fc8e8,
  poison: 0x7ad15a,
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
  /** Partículas de impacto de combate ativas. */
  private particles: Particle[] = [];
  /** Balões de fala ativos (presos às entidades). */
  private speeches: { text: Text; elapsed: number }[] = [];
  /** Cadáveres saqueáveis (sprite do mob deitado/escurecido), por containerId. */
  private corpseSprites = new Map<number, Sprite>();

  constructor(
    private sprites: SpriteLibrary,
    private layer: Container,
    playerId: number,
  ) {
    this.playerId = playerId;
    this.targetMarker = new Sprite(sprites.targetMarker);
    this.targetMarker.anchor.set(0.5, 0.5);
    this.targetMarker.visible = false;
  }

  /** Texturas certas: mob pela espécie; player pelo OUTFIT (compositor+cache). */
  private texturesFor(e: EntityState): Record<Facing, Texture[]> {
    // PixelLab primeiro (norma 1:1); procedural segue como fallback eterno.
    if (e.species && PIXELLAB.mobs[e.species]) return PIXELLAB.mobs[e.species];
    if (e.species === "rato") return this.sprites.rat;
    // NPCs: cidadão procedural (distinto do herói) até a arte por elenco ✏️
    if (e.kind === "npc") {
      return outfitTextures(
        {
          head: { part: "cabeca_cidadao", color: 21 },
          torso: { part: "camisa_cidadao", color: 41 },
          legs: { part: "calca_cidadao", color: 17 },
        },
        null,
      );
    }
    const outfit = e.outfit ?? DEFAULT_OUTFIT_BY_CLASS.knight;
    // CORPO POR CLASSE (receita jun/2026): o SET do torso do outfit escolhe o
    // corpo inteiro (janela O = troca de classe visual). Sem corpo → fallback.
    const set = OUTFIT_PART_BY_ID[outfit.torso.part]?.set;
    const body = (set && PIXELLAB.charBodies[set]) || PIXELLAB.knight;
    if (body) return body;
    return outfitTextures(outfit, e.weapon?.templateId ?? null);
  }

  /** Chave do visual atual (detecta troca de outfit/arma em runtime). */
  private skinKeyOf(e: EntityState): string {
    if (e.species) return e.species;
    const o = e.outfit ?? DEFAULT_OUTFIT_BY_CLASS.knight;
    if (PIXELLAB.knight) {
      // corpo por classe: visual muda com o SET do torso
      return `body|${OUTFIT_PART_BY_ID[o.torso.part]?.set ?? "knight"}`;
    }
    return `${o.head.part}.${o.head.color}|${o.torso.part}.${o.torso.color}|${o.legs.part}.${o.legs.color}|${e.weapon?.templateId ?? "-"}`;
  }

  /** Frames de ATAQUE da entidade (mob pela espécie; char pelo golpe COMPOSTO). */
  private attackTexturesFor(e: EntityState): Record<Facing, Texture[]> | null {
    if (e.species) return PIXELLAB.mobAttacks[e.species] ?? null;
    if (!PIXELLAB.knight) return null;
    return paperdollAttackTextures(e.outfit ?? DEFAULT_OUTFIT_BY_CLASS.knight);
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
        this.spawnCast(ev.skillId, ev.casterId, ev.from, ev.to);
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
    t.position.set(0, -46);
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
    text.position.set(0, -44);
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

  tick(deltaMS: number): void {
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
      // Snap a meio-pixel de mundo (= 1px de tela no zoom 2×): mata o shimmer
      // de subpixel do pixel art (nearest) em movimento, sem serrilhar o tween.
      v.container.position.set(
        Math.round((cur.x + 0.5) * TILE_SIZE * 2) / 2,
        Math.round((cur.y + 1) * TILE_SIZE * 2) / 2,
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
    shadow.width = 28;
    shadow.height = 13;
    shadow.position.set(1, -2);
    container.addChild(shadow);

    const sprite = new Sprite(textures[e.facing][0]);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(0, 0);
    // Norma de densidade (jun/2026): mobs PixelLab 64px exibidos 1:1.
    // Exceção transitória: o knight (char) segue a 0.66 até a regen 1:1.
    if (!e.species && PIXELLAB.knight) sprite.scale.set(PIXELLAB_CHAR_SCALE);
    // Grounding: voadores pairam (offset fixo); terrestres descem pelo padding
    // transparente medido no load — sem isso o sprite 64px "flutuava" no tile.
    if (e.species) {
      sprite.position.y = FLYING_SPECIES.has(e.species)
        ? -6
        : PIXELLAB.mobBaseline[e.species] ?? 0;
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
    nameText.position.set(0, -38);
    container.addChild(nameText);

    const hpBar = new Graphics();
    hpBar.position.set(-14, -37);
    container.addChild(hpBar);

    // ícones de status: à direita da HP bar (HP bar vai de x=-14 a x=14)
    const statusIcons = new Graphics();
    statusIcons.position.set(16, -37);
    container.addChild(statusIcons);

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
