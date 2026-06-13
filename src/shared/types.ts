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
export type PlayerClass = "knight" | "mage" | "rogue" | "priest" | "classless";

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
  | "arcane"
  | "earth" // Garras da Terra (groundTarget + root)
  | "lightning" // Tempestade / Fagulhas (raio)
  | "death"; // Dreno Vital (morte = lifedrain)

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

/**
 * Mobília urbana / decoração ancorada em tiles (MOBILIA-URBANA.md — kit de
 * "vila viva", PROCEDURAL). `torch` segue sendo a fonte de luz original; os
 * demais são os props do kit (3 camadas: estruturas de comércio abertas, props
 * de uso, delimitadores). Puramente visual no client (sprite no container
 * y-sorted, base = âncora); o `blocks` é a única regra que a sim consome.
 */
export interface MapDecor {
  x: number;
  y: number;
  kind:
    | "torch" // fonte de luz original (tocha de parede)
    | "barril" // cilindro com aros de ferro — bloqueia
    | "caixa" // engradado de ripas, empilhável — bloqueia
    | "cerca" // parapeito de madeira (tira/autotile) — bloqueia (vão = portão)
    | "tenda" // banca de feira (toldo + balcão); balcão bloqueia
    | "poco" // anel de pedra + cobertura (Praça do Poço) — bloqueia
    | "balcao" // balcão/toldo de loja na fachada — bloqueia
    | "placa" // tabuleta de ofício pendurada — decor (não bloqueia)
    | "braseiro" // tigela de ferro com brasa (luz quente móvel) — bloqueia
    | "boneco_treino" // poste + alvo de palha (pátio da Guilda) — bloqueia
    | "estacas" // postes fincados + ripas (muralha em obras) — bloqueia
    | "saco" // saco/cesto de mercadoria — decor (não bloqueia)
    | "lenha"; // toras/feno empilhados — bloqueia
  /**
   * Prop que OCUPA o tile (sim trata como impassável). Ausente = não bloqueia
   * (decor puro: saco/cesto, placa). Ver tabela de colisão em MOBILIA-URBANA §3.
   */
  blocks?: boolean;
}

/** Ponto de spawn de um monstro no mapa (espécie do bestiário). */
export interface MapMonster {
  x: number;
  y: number;
  /** ID de espécie do bestiário (ex: "rato"). */
  species: string;
  /** Respawn em ms DESTE ponto (override do `template.respawnMs`). Permite afinar
   *  o teto de exp/h por-spot (EXPLORACAO.md §respawn-timer = teto): o mesmo mob
   *  respawna mais rápido num Pool e mais devagar numa Sentinela. undefined =
   *  usa o do bestiário. ✏️ Balancista por spot/padrão. */
  respawnMs?: number;
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
 * OBJETO/PONTO DE CENÁRIO INTERAGÍVEL de quest (alvenaria manchada do Q10, fardo
 * do Q2, pedras do Q14, baú-cena do Q12…). Hook de mundo da etapa `interact`: o
 * jogador chega perto e usa o comando `interact` → a sim emite o evento de quest
 * (reach-based, mesma régua do baú). É só um ANCORADOURO (tile + id); não tem
 * loot nem estado próprio — quem rastreia "já interagi" é a quest, via stage.
 * `name` é opcional (rótulo da mensagem de sistema / tooltip futuro do client).
 */
export interface InteractableDef {
  /** Id estável (casa com `QuestStageDef` do tipo `interact`). */
  id: string;
  pos: Vec2;
  /** Andar (z-level). Ausente = andar base (overworld). */
  z?: number;
  /** Nome exibível ("a alvenaria manchada", "o fardo"). Opcional. */
  name?: string;
}

/**
 * REGIÃO NOMEADA de quest (hook de mundo da etapa `region_enter`): ao ENTRAR no
 * retângulo (estava fora, agora dentro), a sim emite o evento UMA vez por
 * personagem. Ortogonal a safe/passZones — estas são regras de tile; a região é
 * só um gatilho de quest com id. `z` restringe ao andar (a região do esgoto não
 * dispara andando por cima na superfície).
 */
export interface QuestRegionDef {
  /** Id estável (casa com `QuestStageDef` do tipo `region_enter`). */
  id: string;
  rect: MapRect;
  /** Andar (z-level). Ausente = andar base (overworld). */
  z?: number;
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
  /** Pontos/objetos interagíveis de quest neste andar (coords de MUNDO, como o
   *  resto do FloorLayer). O `z` de cada um é redundante aqui (= `z` do andar). */
  interactables?: InteractableDef[];
  /** Regiões nomeadas de quest neste andar (coords de MUNDO). */
  questRegions?: QuestRegionDef[];
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
  /** Baús plantados no mundo (loot fixo + gates opcionais). Ver `ChestDef`. */
  chests?: ChestDef[];
  /**
   * PORTAS TRANCADAS plantadas no mundo (começam fechadas; abrem com chave via
   * `interact`). Bloqueiam o tile na sim enquanto fechadas. Ver `DoorDef`.
   */
  doors?: DoorDef[];
  /**
   * PONTOS/OBJETOS INTERAGÍVEIS de quest no overworld (hook da etapa `interact`).
   * Os do subsolo vão no `FloorLayer` do andar. Ver `InteractableDef`.
   */
  interactables?: InteractableDef[];
  /**
   * REGIÕES NOMEADAS de quest no overworld (hook da etapa `region_enter`). As do
   * subsolo vão no `FloorLayer` do andar. Ver `QuestRegionDef`.
   */
  questRegions?: QuestRegionDef[];
  /**
   * FONTES DE CALOR (fogão/fogueira) — gate de cozinha (COZINHA.md): receitas
   * cozidas/premium exigem estar perto de uma. Pontos no overworld (baseZ).
   */
  heatSources?: Vec2[];
  /**
   * ÁGUA-DOCE (poço/rio doce) — gate de cozinha: receitas com água exigem estar
   * perto de uma. Água do MAR (tiles de água sem marcador) NÃO serve.
   */
  freshWater?: Vec2[];
  // ── Z-levels (SISTEMA-ANDARES.md) — tudo opcional: ausência = andar único z=0 ──
  /** Andar do mapa base (overworld = 0). default 0. */
  z?: number;
  /** Portais/aberturas do andar base. */
  portals?: MapPortal[];
  openings?: MapOpening[];
  /** Andares ADICIONAIS (z ≠ base): esgotos/cavernas (z<0), telhados (z>0). Esparsos. */
  floors?: FloorLayer[];
}

/**
 * Loot de um baú: lista FIXA e determinística (baú de quest/tesouro = conteúdo
 * conhecido, ≠ corpo de mob que rola por chance). Concede direto ao bolso.
 */
export interface ChestLoot {
  /** Itens concedidos (qty default = 1). */
  items?: { templateId: string; qty?: number }[];
  /** Ouro concedido (funde na pilha do bolso). */
  gold?: number;
  /**
   * Concede uma CHAVE abstrata ao abrir — a fonte de chave por exploração
   * ("achei a chave"). Chave não é item: é um flag permanente no personagem
   * que abre 1 fechadura específica (ver `ChestDef.keyReq`).
   */
  grantsKey?: string;
}

/**
 * Baú do mundo (DEFINIÇÃO ESTÁTICA — imutável; o estado "já saqueei" vive no
 * PERSONAGEM, não aqui: single-use POR jogador, modelo baú-de-quest do Tibia).
 * Todos os gates são opcionais e ortogonais — qualquer combinação.
 */
export interface ChestDef {
  /** Id único no mapa — chave do registro de saque do personagem. */
  id: string;
  pos: Vec2;
  z: number;
  loot: ChestLoot;
  /** Nível MÍNIMO pra abrir (ausente = qualquer nível). */
  levelReq?: number;
  /**
   * keyId necessária (ausente = destrancado). A chave é abstrata e vem de quest
   * ou exploração; quem a possui abre. Cobre o caso "baú de quest" sem gate de
   * quest separado: a quest concede a chave.
   */
  keyReq?: string;
  /** Nome exibível ("Baú", "Baú do Bando"). default "Baú". */
  name?: string;
}

/**
 * PORTA TRANCADA (DEFINIÇÃO ESTÁTICA do mapa — modelo Apogea, ver
 * `design/mundo/EXPLORACAO.md` §Portas & Chaves). Começa FECHADA: o tile é
 * tratado como bloqueio na sim até que um personagem a ABRA via comando
 * `interact` TENDO a chave certa. Reusa o sistema de CHAVE abstrata do baú
 * (`SimEntity.keys` / `ChestDef.keyReq`) — a chave não diz qual porta abre.
 *
 * O estado "abri esta porta" vive no PERSONAGEM (`SimEntity.openedDoors`),
 * não aqui — single-use por jogador, igual ao baú (conteúdo per-character do
 * princípio MMO; a casa-tutorial é de cada um). A porta assenta sobre um tile
 * andável (o vão na parede): fechada, a sim a bloqueia; aberta, o tile volta a
 * ser passável naturalmente.
 */
export interface DoorDef {
  /** Id único no mapa — chave do registro de portas abertas do personagem. */
  id: string;
  pos: Vec2;
  z: number;
  /**
   * keyId que destranca (ausente = porta que abre sem chave — um simples
   * "abrir/empurrar"). A chave é abstrata (flag no personagem), vem de quest
   * ou exploração; quem a possui abre. Mesma chave de `ChestDef.keyReq`.
   */
  keyReq?: string;
  /** Nome exibível ("a porta", "a porta de saída"). default "a porta". */
  name?: string;
}
