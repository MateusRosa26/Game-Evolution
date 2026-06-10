export interface Vec2 {
  x: number;
  y: number;
}

/** 8 direções de movimento. */
export type Dir8 = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

/** 4 direções visuais (sprites). */
export type Facing = "n" | "e" | "s" | "w";

export const DIR_VECTORS: Record<Dir8, Vec2> = {
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
  nw: { x: -1, y: -1 },
};

export function isDiagonal(dir: Dir8): boolean {
  return dir.length === 2;
}

/**
 * Direção de movimento → facing do sprite. Nas DIAGONAIS o eixo VERTICAL
 * domina (decisão do criador): subir em diagonal mostra as costas, descer
 * mostra a frente — perfis e/w ficam para o movimento horizontal puro.
 * (Vale também para gameplay: o facing alimenta o backstab do Apunhalar.)
 */
export function facingFromDir(dir: Dir8): Facing {
  switch (dir) {
    case "n":
    case "ne":
    case "nw":
      return "n";
    case "s":
    case "se":
    case "sw":
      return "s";
    case "e":
      return "e";
    case "w":
      return "w";
  }
}

export function dirFromDelta(dx: number, dy: number): Dir8 | null {
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  for (const [dir, v] of Object.entries(DIR_VECTORS) as [Dir8, Vec2][]) {
    if (v.x === sx && v.y === sy) return dir;
  }
  return null;
}

export type EntityKind = "player" | "monster" | "npc";

/** Semente de NPC no mapa (a sim cria a entidade; o client só desenha). */
export interface NpcSpawnDef {
  /** Id estável do NPC (chave do diálogo/quests — ex.: "bartolo"). */
  npcId: string;
  name: string;
  x: number;
  y: number;
}

/**
 * Classes-base do jogador (DESIGN-EVOLUCAO.md §Classes). Sem subclasses
 * escolhíveis — a especialização emerge via Caminhos/Mutações (wave futura).
 * Identificadores estáveis (chaves de dados/fórmulas).
 */
export type PlayerClass = "knight" | "mage" | "rogue" | "priest";

/**
 * Os 5 atributos da camada sólida (DESIGN-EVOLUCAO.md §Stats). DISTRIBUÍVEIS
 * (pontos no level up); tudo o mais é DERIVADO via `src/sim/formulas.ts`.
 * Nomes em inglês, estáveis (chaves de dados). Chave de atributo isolada em
 * `AttributeKey` para o comando `allocateStatPoint` validar.
 */
export interface Attributes {
  /** Força — dano corpo-a-corpo, capacidade de carga. */
  strength: number;
  /** Destreza — dano de adagas/distância, velocidade de ataque, esquiva. */
  dexterity: number;
  /** Inteligência — dano mágico, mana máxima. */
  intelligence: number;
  /** Vitalidade — HP máximo, regeneração de HP. */
  vitality: number;
  /** Espírito — poder de cura, regen de mana, resistência mágica. */
  spirit: number;
}

export type AttributeKey = keyof Attributes;

/** As 5 chaves de atributo, em ordem estável (para validação/iteração). */
export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "strength",
  "dexterity",
  "intelligence",
  "vitality",
  "spirit",
];

/**
 * As 12 famílias canônicas do bestiário (DESIGN-BESTIARIO.md).
 * Família é a unidade do sistema de Marcas: contadores de kill rastreiam
 * espécie E família. Toda criatura pertence a exatamente uma família.
 * Identificadores em inglês, estáveis (não traduzir — são chaves de dados).
 */
export type CreatureFamily =
  | "bestial" // Bestas — feras naturais
  | "humanoid" // Peles-Verdes, bandidos, cultistas
  | "worm" // Vermes / insetos
  | "plant" // Plantas
  | "aquatic" // Aquáticos
  | "flying" // Voadores
  | "undead" // Mortos-Vivos
  | "draconic" // Dracônicos
  | "giant" // Gigantes
  | "elemental" // Elementais
  | "mythic" // Míticos
  | "demon"; // Demônios

/** Tipos de dano — fundamenta resist/fraqueza por família (DESIGN-BESTIARIO.md). */
export type DamageType =
  | "physical"
  | "fire"
  | "ice"
  | "poison"
  | "bleed"
  | "holy"
  | "arcane";

/** Tiles lógicos do mundo. */
export enum TileId {
  Grass = 0,
  Dirt = 1,
  StoneFloor = 2,
  Water = 3,
  Tree = 4,
  Rock = 5,
  Wall = 6,
  /** Tábuas sobre água — pontes do GRID (andável). */
  Bridge = 7,
  /** Pântano — andável; telegrafia de borda mole (GRID §6). */
  Swamp = 8,

  // ── Subsolo / dungeon (z<0) — SISTEMA-ANDARES.md. Arte = placeholder
  // procedural; PixelLab (create-tileset) substitui sem mudar estes IDs. ──
  /** Chão de esgoto: alvenaria úmida, andável (A1). */
  SewerFloor = 9,
  /** Chão de caverna: rocha áspera, andável (A2/A3). */
  CaveFloor = 10,
  /** Água servida RASA — andável (vadeável); canal do esgoto (A1/A3). */
  Sewage = 11,
  /** Água FUNDA — IMPASSÁVEL (obriga rotear pelas margens; custo de fuga). */
  DeepWater = 12,
  /** Parede de tijolo do esgoto — autotile 16-máscaras (A1). */
  SewerWall = 13,
  /** Alvenaria antiga, "mais velha que a cidade" — autotile (A2, mistério). */
  OldMasonryWall = 14,
  /** Rocha de caverna — autotile (A2/A3). */
  CaveWall = 15,
  /** Parede de CASA (enxaimel: madeira + taipa) — textura própria, distinta da
   *  muralha de pedra da cidade. Autotile 16-máscaras (conecta só com casa). */
  HouseWall = 16,
  /** VOID: fora do footprint de um andar (subsolo) — não renderiza nada (breu do
   *  fundo aparece). Impassável. Usado só pelo client ao montar o andar ativo. */
  Void = 17,
}

export const WALKABLE: Record<TileId, boolean> = {
  [TileId.Grass]: true,
  [TileId.Dirt]: true,
  [TileId.StoneFloor]: true,
  [TileId.Water]: false,
  [TileId.Tree]: false,
  [TileId.Rock]: false,
  [TileId.Wall]: false,
  [TileId.Bridge]: true,
  [TileId.Swamp]: true,
  [TileId.SewerFloor]: true,
  [TileId.CaveFloor]: true,
  [TileId.Sewage]: true,
  [TileId.DeepWater]: false,
  [TileId.SewerWall]: false,
  [TileId.OldMasonryWall]: false,
  [TileId.CaveWall]: false,
  [TileId.HouseWall]: false,
  [TileId.Void]: false,
};

/** Fonte de luz estática do mapa (posição em tiles). */
export interface MapLight {
  x: number;
  y: number;
  /** Cor em hex 0xRRGGBB. */
  color: number;
  /** Raio em tiles. */
  radius: number;
  /** Intensidade 0..1. */
  intensity: number;
  flicker: boolean;
}

/** Decoração que emite luz / objetos especiais ancorados em tiles. */
export interface MapDecor {
  x: number;
  y: number;
  kind: "torch";
}

/** Ponto de spawn de um monstro no mapa (espécie do bestiário). */
export interface MapMonster {
  x: number;
  y: number;
  /** ID de espécie do bestiário (ex: "rato_lanhoso"). */
  species: string;
}

/** Retângulo em tiles (zonas de regra: segura / passagem). */
export interface MapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ── Z-LEVELS / Andares (SISTEMA-ANDARES.md) ─────────────────────────────────

/**
 * PORTAL — transição entre andares (dado no andar). EIXO 1: transporta.
 * `to` explícito p/ stairs/cave; `hole` cai p/ z−1 (cego); `rope_spot` sobe p/
 * z+1 (com corda); `dig_spot` vira `hole` ao usar a pá. Ver SISTEMA-ANDARES §3.
 */
export interface MapPortal {
  x: number;
  y: number;
  kind: "stairs" | "cave" | "hole" | "rope_spot" | "dig_spot";
  to?: { x: number; y: number; z: number };
}

/**
 * ABERTURA VISUAL — revela o andar vizinho (≠ portal). EIXO 2: deixa ver.
 * `down` = vão de escada aberto / varanda (vê o de baixo); `up` = janela /
 * clarabóia (vê o de cima). Buraco NÃO é abertura (cai cego). SISTEMA-ANDARES §5.
 */
export interface MapOpening {
  x: number;
  y: number;
  dir: "down" | "up";
}

/**
 * Camada de um andar (z-level) LOCALIZADA e esparsa: existe só onde há conteúdo
 * (esgoto = só o rect sob a cidade, não 800×800). Coords do `tiles` são LOCAIS
 * ao rect (`ox,oy` + `width×height`); converte p/ mundo somando o offset.
 */
export interface FloorLayer {
  z: number;
  ox: number;
  oy: number;
  width: number;
  height: number;
  /** Row-major LOCAL: tiles[ly * width + lx]. */
  tiles: TileId[];
  lights: MapLight[];
  decor: MapDecor[];
  monsters: MapMonster[];
  portals: MapPortal[];
  openings: MapOpening[];
  /** Ambiente do andar (0xRRGGBB). Subsolo = breu; undefined = herda overworld. */
  ambient?: number;
}

export interface MapData {
  width: number;
  height: number;
  /** Row-major: tiles[y * width + x]. */
  tiles: TileId[];
  lights: MapLight[];
  decor: MapDecor[];
  /** Pontos de spawn de monstros (vazio = mapa sem mobs). */
  monsters: MapMonster[];
  /**
   * ZONAS SEGURAS (estilo depot/protection zone de Tibia): entidades não
   * bloqueiam o tile (atravessar/empilhar permitido), monstros NUNCA entram e
   * a IA ignora quem está dentro.
   */
  safeZones: MapRect[];
  /**
   * ZONAS DE PASSAGEM (escadas/alavancas/portais — pontos de chegada de
   * mecanismos): SEM bloqueio de corpo — quem chega não é ejetado e ninguém
   * trava o mecanismo parando no destino. Fora isso, tile NORMAL: mobs passam,
   * IA enxerga, combate vale (≠ zona segura).
   */
  passZones: MapRect[];
  /**
   * EDIFÍCIOS com telhado (footprint em tiles, incluindo as paredes). O cliente
   * desenha um telhado sobre cada um que SOME quando o player entra (estilo
   * Tibia). Puramente visual — não afeta a simulação.
   */
  buildings?: MapRect[];
  /** Nascimento do personagem (sem classe): casa inicial / tutorial. */
  spawn: Vec2;
  /** Ponto de respawn de MORTE (z=0). Santuário, separado do nascimento; ausente =
   *  usa `spawn`. SISTEMA-ANDARES: morrer no subsolo volta sempre à superfície. */
  respawn?: Vec2;
  /** Id estável do mapa (multi-mapa: "alvorada", "porao_estalagem"…). */
  id?: string;
  /** NPCs plantados pelo gerador do mapa (opcional). */
  npcSpawns?: NpcSpawnDef[];
  // ── Z-levels (SISTEMA-ANDARES.md) — tudo opcional: ausência = andar único z=0 ──
  /** Andar do mapa base (overworld = 0). default 0. */
  z?: number;
  /** Portais/aberturas do andar base. */
  portals?: MapPortal[];
  openings?: MapOpening[];
  /** Andares ADICIONAIS (z ≠ base): esgotos/cavernas (z<0), telhados (z>0). Esparsos. */
  floors?: FloorLayer[];
}
