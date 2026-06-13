import { TileId, WALKABLE, type ChestDef, type DoorDef, type FloorLayer, type InteractableDef, type MapData, type MapDecor, type MapLight, type MapMonster, type MapPortal, type MapRect, type QuestRegionDef } from "../../shared/types";
import { CREATURES } from "../bestiary";
import { mulberry32, valueNoise } from "../rng";

/**
 * Fatia ① — Alvorada (overworld 340×340).
 *
 * Implementa `design/fatia-1-alvorada/GRID.md` (aprovado como base, jun/2026).
 * Toda coordenada vem das tabelas do GRID (refs §N nos comentários); desvios
 * conscientes estão marcados com "DESVIO". Tudo afinável vendo o mapa rodar.
 *
 * FORA deste milestone (mapas separados / sistemas que não existem ainda):
 * esgotos A1–A3 (§7), interiores de dungeon (Caverna dos Goblins, Minas — as
 * BOCAS são telegrafadas aqui), NPCs (sem sistema), baús (sem sistema).
 */

const W = 340;
const H = 340;

// ── §3: cidade — muralha [2..58]² em coord-cidade; origem da cidade em (100,80)
const CITY_X = 100;
const CITY_Y = 80;
/** Coord-cidade → local da fatia (`local = cidade + (100,80)`, GRID §3). */
const city = (cx: number, cy: number): [number, number] => [cx + CITY_X, cy + CITY_Y];
const WALL = { x0: 102, y0: 82, x1: 158, y1: 138 }; // anel da muralha em local

// ── §2.1: afluente (polilinha NE → centro → S).
// DESVIO do GRID: pontos do trecho sul ajustados para a água passar nas âncoras
// das travessias ④ pedras (190,160) e ③ ponte dos bandidos (165,272) — a
// polilinha original §2.1 não tocava essas âncoras (verificador não pegou;
// coords são ✏️). Largura ~7 tiles.
const RIVER: [number, number][] = [
  [258, 0],
  [224, 40], // vau ② cruza ~y50 (§2.2)
  [190, 80],
  [170, 120], // Ponte de Alvorada ① cruza y132, colada na Porta d'Água
  [166, 148],
  [188, 162], // bojo leste: Juncal dos Fundeiros (S9) + pedras ④ em y160
  [192, 185],
  [200, 215],
  [190, 245],
  [170, 272], // ponte dos bandidos ③ cruza y272
  [185, 300],
  [205, 330],
  [200, 340],
];

// ── §2.2: travessias — cada uma escaneia a linha e cobre o vão d'água real.
// tile: Bridge = tábuas; StoneFloor = pedras rasas (vau/pedras de passagem).
const CROSSINGS: { y: number; tile: TileId; half: number; lit: boolean }[] = [
  { y: 132, tile: TileId.Bridge, half: 1, lit: true }, // ① Ponte de Alvorada (3 de largura, vigiada)
  { y: 50, tile: TileId.StoneFloor, half: 1, lit: false }, // ② vau raso NE
  { y: 272, tile: TileId.Bridge, half: 1, lit: true }, // ③ Ponte dos Bandidos (pedágio T2)
  { y: 161, tile: TileId.StoneFloor, half: 0, lit: false }, // ④ pedras no junco (1 tile — escondida)
];

// ── §3.3: edifícios-âncora — retângulos em coord-cidade, porta EXATA do GRID.
// Footprints são "engenharia a partir das âncoras" (§12) — afináveis.
// `doorId`/`doorName` = id estável e rótulo da DoorDef gerada no tile `door` (toda
// casa entrável ganha porta, feel Tibia); `lockKey` = chave que tranca (só a casa
// inicial — o resto abre andando, sem chave).
type Building = {
  name: string;
  rect: [number, number, number, number];
  door: [number, number];
  doorId: string;
  doorName: string;
  lockKey?: string;
};
const BUILDINGS: Building[] = [
  { name: "Estalagem do Vau (Bartolo/Bento — Q1/Q6)", rect: [16, 37, 24, 42], door: [20, 42], doorId: "porta_estalagem", doorName: "a porta da Estalagem" },
  { name: "Loja Geral (Nina — Q2)", rect: [21, 34, 27, 38], door: [24, 38], doorId: "porta_loja", doorName: "a porta da Loja" },
  { name: "Boticário (Silas — Q3)", rect: [28, 34, 34, 38], door: [31, 38], doorId: "porta_boticario", doorName: "a porta do Boticário" },
  { name: "Ferreiro (Duarte — Q4/Q9)", rect: [16, 24, 24, 28], door: [20, 28], doorId: "porta_ferreiro", doorName: "a porta do Ferreiro" },
  { name: "Depot (banco/armazém)", rect: [35, 27, 42, 32], door: [38, 32], doorId: "porta_depot", doorName: "a porta do Depot" },
  { name: "Câmara (Augusto)", rect: [42, 42, 50, 46], door: [46, 46], doorId: "porta_camara", doorName: "a porta da Câmara" },
  { name: "Quartel da Guarda (Capitão Vidal — Q5/Q8)", rect: [3, 31, 12, 36], door: [8, 36], doorId: "porta_quartel", doorName: "a porta do Quartel" },
  { name: "Capela do Coveiro (Abel — Q10)", rect: [12, 8, 18, 12], door: [15, 12], doorId: "porta_capela", doorName: "a porta da Capela" },
  { name: "Templo (Gabriel — R4)", rect: [16, 9, 26, 14], door: [20, 14], doorId: "porta_templo", doorName: "a porta do Templo" },
  { name: "Torre Arcana (Leonor — R2)", rect: [27, 13, 33, 18], door: [30, 18], doorId: "porta_torre", doorName: "a porta da Torre" },
  { name: "Guilda dos Guerreiros (Ricardo — R1)", rect: [40, 12, 50, 18], door: [44, 18], doorId: "porta_guilda", doorName: "a porta da Guilda" },
  { name: "Taverna do Cais (Tobias/Telmo — Q12/Q9)", rect: [46, 25, 54, 30], door: [50, 30], doorId: "porta_taverna", doorName: "a porta da Taverna" },
  { name: "Armazéns (Cais)", rect: [46, 42, 55, 46], door: [50, 46], doorId: "porta_armazens", doorName: "a porta dos Armazéns" },
  { name: "Casa inicial (Rosa — nascimento)", rect: [25, 41, 31, 46], door: [28, 46], doorId: "porta_casa_inicial", doorName: "a porta de saída", lockKey: "chave_casa_inicial" },
];
// DESVIO: Capela [12..18] e Templo [16..26] do GRID colidiam; Capela encolhida
// 1 tile a oeste mantendo a porta canônica (15,12). Templo porta (20,14) exata.

// ── §5: spots de caça — espécies do GRID; spawns só acendem se a espécie
// existir no bestiário (hoje: só rato). O resto entra com o bestiário.
type Spot = { id: string; rect: [number, number, number, number]; spawns: [number, number, string][] };
const SPOTS: Spot[] = [
  // ── SENTINELAS (gramática de spawn — design/mundo/EXPLORACAO.md §Padrão de spawn):
  // 1 mob solo = TELEGRAFIA, não farm. Ficam NOS CAMINHOS, nunca colados no portão.
  // (A Q1/porão SAIU daqui — virou a adega da Estalagem, mapa z=-1 próprio: ESGOTOS.md §3.5.)
  {
    id: "Sentinela: batedor goblin na trilha NE (telegrafa o Acampamento S5)",
    rect: [170, 60, 182, 72],
    spawns: [[176, 66, "goblin"]],
  },
  {
    id: "Sentinela: lobo solitário na estrada O (telegrafa a alcateia S1)",
    rect: [80, 105, 92, 117],
    spawns: [[86, 111, "lobo"]],
  },
  {
    id: "S1 Planícies (T1)",
    rect: [10, 60, 70, 200],
    spawns: [
      [30, 95, "rato"],
      [24, 120, "rato"],
      [40, 140, "rato"],
      [55, 110, "rato"],
      [35, 170, "rato"],
      [60, 185, "rato"],
      [20, 150, "lobo"],
      [50, 80, "lobo"],
      [65, 160, "lobo"],
    ],
  },
  {
    id: "S2 Granja (T1 — Q2)",
    rect: [20, 80, 55, 100],
    spawns: [
      // pontos no terreiro/arredores — NUNCA em cima dos muros dos celeiros
      [31, 92, "rato"],
      [36, 93, "rato"],
      [43, 94, "rato"],
      [48, 89, "rato"],
      [38, 97, "rato"],
    ],
  },
  {
    id: "S3 Gruta dos Morcegos (T1 — Q3)",
    rect: [125, 48, 150, 68],
    spawns: [
      [132, 55, "morcego"],
      [138, 60, "morcego"],
      [143, 53, "morcego"],
      [135, 64, "morcego"],
      [146, 62, "morcego"],
      [129, 60, "morcego"],
    ],
  },
  {
    id: "S4 Toca dos Lobos (T1 — Q5/Q6)",
    rect: [172, 55, 200, 80],
    spawns: [
      [180, 62, "lobo"],
      [188, 68, "lobo"],
      [194, 60, "lobo"],
      [177, 73, "lobo"],
      [191, 76, "lobo"],
      [185, 58, "lobo"],
    ],
  },
  {
    id: "S5 Acampamento Goblin (T1 — Q8a2)",
    rect: [185, 35, 230, 70],
    spawns: [
      [195, 42, "goblin"],
      [205, 38, "goblin"],
      [215, 45, "goblin"],
      [222, 40, "goblin"],
      [200, 55, "goblin"],
      [212, 60, "goblin"],
      [225, 52, "goblin"],
      [192, 63, "goblin"],
    ],
  },
  {
    id: "S7 Ninho de Aranhas (T2 — sem trilha)",
    rect: [260, 60, 300, 90],
    spawns: [
      [268, 68, "aranha"],
      [278, 75, "aranha"],
      [288, 70, "aranha"],
      [272, 84, "aranha"],
      [292, 82, "aranha"],
    ],
  },
  {
    id: "S9 Juncal dos Fundeiros (T1→T2 — Q14)",
    rect: [175, 150, 205, 185],
    // ✏️ Goblin Fundeiro (ranged "shooter") ainda não existe como espécie (regra de
    // naming singular + sem mob de longe nesta fatia) — spawna o `goblin` base por
    // ora. Quando o primeiro atirador entrar, troca aqui.
    spawns: [
      [198, 155, "goblin"],
      [201, 165, "goblin"],
      [197, 175, "goblin"],
      [202, 180, "goblin"],
      [180, 153, "goblin"],
      [178, 170, "goblin"],
    ],
  },
  {
    id: "S10 Matagal dos Javalis (T2 — Q6/Q7, named Presa-Torta)",
    rect: [235, 230, 275, 270],
    spawns: [
      [242, 238, "javali"],
      [252, 245, "javali"],
      [263, 240, "javali"],
      [248, 258, "javali"],
      [260, 263, "javali"],
      [270, 252, "javali"],
      // Presa-Torta (named, Q7 ato 2): 1 no fundo do Matagal. O template já tem
      // respawn longo (bestiary.ts) — não phasing, mob único do mundo.
      [255, 250, "presa_torta"],
    ],
  },
  {
    id: "S11 Bandidos da Ponte (T2 — Q9/Q11)",
    rect: [150, 260, 185, 290],
    spawns: [
      [155, 266, "bandido"],
      [160, 275, "bandido"],
      [156, 284, "bandido"],
      [175, 280, "bandido"],
      [180, 268, "bandido"],
    ],
  },
];

export function generateAlvoradaMap(): MapData {
  const rng = mulberry32(20260605);
  const tiles: TileId[] = new Array(W * H).fill(TileId.Grass);
  const lights: MapLight[] = [];
  const decor: MapDecor[] = [];
  const monsters: MapMonster[] = [];

  const set = (x: number, y: number, t: TileId) => {
    if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = t;
  };
  const get = (x: number, y: number): TileId =>
    x >= 0 && y >= 0 && x < W && y < H ? tiles[y * W + x] : TileId.Water;
  const torch = (x: number, y: number, radius = 5) => {
    decor.push({ x, y, kind: "torch" });
    lights.push({ x, y, color: 0xffa14e, radius, intensity: 0.9, flicker: true });
  };

  // ════ 1. Macro-zonas de terreno (§1 distritos do esqueleto de Lynch) ════
  // Pântano S: borda mole de letalidade (y≥306, recuando perto da estrada).
  for (let y = 306; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (rng() < 0.85) set(x, y, TileId.Swamp);
    }
  }

  // ════ 2. Água: afluente (§2.1) + rio grande ════
  carvePolyline(set, RIVER, 3.4, TileId.Water, rng);
  // Rio grande na borda leste — DESVIO: o GRID diz x≈300..340 inteiro, mas
  // Minas (330,30), carrinhos (330,33) e a saída da estrada leste (340,150)
  // precisam de terra. v1: faixa só no canto SE (y≥205); Pontal/Atalaia ficam
  // como promessa além da borda. ✏️ afinar com o criador.
  for (let y = 205; y < H; y++) {
    const edge = 328 + Math.round(Math.sin(y * 0.05) * 2);
    for (let x = edge; x < W; x++) set(x, y, TileId.Water);
  }

  // ════ 3. Floresta NE (gradiente T1→T2, §1/§6) + bordas do mapa ════
  const treeAt = (x: number, y: number) => {
    if (get(x, y) === TileId.Grass) set(x, y, TileId.Tree);
  };
  // COMPOSIÇÃO (alavanca #5): árvores se AGRUPAM em bosques com clareiras em vez
  // de scatter uniforme. grove() ~0.15 na clareira, ~1.9 no miolo do bosque —
  // multiplica a densidade-alvo de cada zona (mantém o gradiente de perigo, só
  // dá ritmo: bosque fechado → clareira → bosque). 2 oitavas: manchas grandes
  // (células ~9 tiles) moduladas por textura fina.
  const grove = (x: number, y: number): number => {
    const n = valueNoise(x, y, 1 / 9, 31) * 0.66 + valueNoise(x, y, 1 / 4, 47) * 0.34;
    const f = Math.max(0, Math.min(1, (n - 0.4) / 0.3));
    return 0.15 + 1.75 * (f * f * (3 - 2 * f));
  };
  for (let y = 0; y < 130; y++) {
    for (let x = 165; x < W; x++) {
      // densidade cresce pro NE profundo (longe da cidade)
      const depth = Math.min(1, (x - 165) / 120 + (60 - Math.min(y, 60)) / 120);
      if (rng() < (0.06 + depth * 0.3) * grove(x, y)) treeAt(x, y);
    }
  }
  // Bordas: paliçada natural de árvores (3 tiles), exceto onde estrada sai.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const e = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (e < 3 && rng() < (e === 0 ? 1 : e === 1 ? 0.7 : 0.35)) treeAt(x, y);
    }
  }
  // Planícies O: capim ABERTO (identidade do distrito) — bosquetes raros de
  // árvore nos miolos de grove + afloramentos de pedra pontilhando as clareiras.
  for (let y = 40; y < 300; y++) {
    for (let x = 4; x < 100; x++) {
      const g = grove(x, y);
      const r = rng();
      if (r < 0.013 * g) treeAt(x, y);
      else if (g < 0.5 && r < 0.013 * g + 0.006 && get(x, y) === TileId.Grass)
        set(x, y, TileId.Rock); // pedras nas clareiras abertas, não no meio da mata
    }
  }
  // Mata leve no sul (entre cidade e pântano) — agrupada em bosques/clareiras.
  for (let y = 200; y < 306; y++) {
    for (let x = 100; x < 328; x++) {
      if (rng() < 0.05 * grove(x, y)) treeAt(x, y);
    }
  }
  // Matagal dos Javalis: bosque FECHADO (claustrofóbico, S10) — mantém denso
  // (mín. 0.75× do grove) mas com respiros internos, não parede uniforme.
  for (let y = 230; y <= 270; y++) {
    for (let x = 235; x <= 275; x++) {
      if (rng() < 0.1 * Math.max(0.75, grove(x, y))) treeAt(x, y);
    }
  }

  // ════ 4. Estradas (§2.3) — terra batida, largura 2 ════
  const ROADS: [number, number][][] = [
    // Oeste: portão O (102,110) → Granja (40,90) → borda O
    [
      [102, 110],
      [70, 100],
      [40, 90],
      [4, 86],
    ],
    // NE: portão NE (140,82) → vau ② (212,50) → canto NE (Brumal)
    [
      [140, 82],
      [170, 66],
      [212, 50],
      [260, 30],
      [310, 12],
      [336, 6],
    ],
    // Leste: Ponte de Alvorada ① (156,132) → margem leste → borda L (Atalaia)
    [
      [156, 132],
      [200, 140],
      [260, 146],
      [336, 150],
    ],
    // Sul: portão S (120,138) → ponte dos bandidos ③ (165,272) → borda S (Charneca)
    [
      [120, 138],
      [138, 190],
      [152, 240],
      [165, 272],
      [172, 300],
      [178, 336],
    ],
  ];
  for (const road of ROADS) carvePolyline(set, road, 1.2, TileId.Dirt, rng, get);

  // ════ 5. Travessias (§2.2) — cobrem o vão d'água real da linha ════
  for (const c of CROSSINGS) {
    for (let dy = -c.half; dy <= c.half; dy++) {
      const y = c.y + dy;
      // acha o span de água na linha (entre x 120 e 280 — região do afluente)
      let x0 = -1;
      let x1 = -1;
      for (let x = 120; x < 280; x++) {
        if (get(x, y) === TileId.Water) {
          if (x0 < 0) x0 = x;
          x1 = x;
        } else if (x0 >= 0 && x - x1 > 4) break; // fim do primeiro vão
      }
      if (x0 < 0) continue;
      for (let x = x0 - 1; x <= x1 + 1; x++) set(x, y, c.tile);
    }
    if (c.lit) {
      torch(118 + (c.y === 132 ? 36 : 40), c.y - c.half - 1); // cabeceira oeste ✏️
    }
  }

  // ════ 6. Cidade de Alvorada (§3) ════
  // Clareira: nada de árvore/pedra/pântano dentro do rect P01
  for (let y = CITY_Y - 2; y <= 152; y++) {
    for (let x = CITY_X - 2; x <= 172; x++) {
      const t = get(x, y);
      if (t === TileId.Tree || t === TileId.Rock || t === TileId.Swamp) set(x, y, TileId.Grass);
    }
  }
  // Muralha (anel §3.1)
  for (let x = WALL.x0; x <= WALL.x1; x++) {
    set(x, WALL.y0, TileId.Wall);
    set(x, WALL.y1, TileId.Wall);
  }
  for (let y = WALL.y0; y <= WALL.y1; y++) {
    set(WALL.x0, y, TileId.Wall);
    set(WALL.x1, y, TileId.Wall);
  }
  // Trecho O/S "em obras" (§3.1): gap atravessável na muralha SW ✏️ estacas
  for (let y = 124; y <= 130; y++) set(WALL.x0, y, TileId.Grass);
  for (let x = 106; x <= 112; x++) set(x, WALL.y1, TileId.Grass);

  // Portões (§3.1) — vão de 3 tiles + tochas
  const GATES: { at: [number, number]; horiz: boolean }[] = [
    { at: city(40, 2), horiz: true }, // ① Portão NE
    { at: city(20, 58), horiz: true }, // ② Portão Sul
    { at: city(2, 30), horiz: false }, // ③ Portão Oeste
    { at: city(58, 52), horiz: false }, // ④ Porta d'Água (vão na muralha L; porta-âncora (56,52))
  ];
  for (const g of GATES) {
    const [gx, gy] = g.at;
    for (let d = -1; d <= 1; d++) {
      if (g.horiz) set(gx + d, gy, TileId.Dirt);
      else set(gx, gy + d, TileId.Dirt);
    }
    torch(g.horiz ? gx - 2 : gx, g.horiz ? gy : gy - 2);
    torch(g.horiz ? gx + 2 : gx, g.horiz ? gy : gy + 2);
  }

  // Praça do Poço + feira (§3.3/§3.4): piso de pedra [33..42]×[34..44]-cidade
  fillRect(set, city(33, 34), city(42, 44), TileId.StoneFloor);
  torch(...city(34, 35));
  torch(...city(41, 35));
  torch(...city(34, 43));
  torch(...city(41, 43));
  // As 5 BOCAS de esgoto (§7.1) — cada boeiro cai no A1 (atalho urbano por baixo).
  // O marcador (grade de ferro) e o portal `hole` vêm de ALVORADA_PORTALS e desenham
  // sobre QUALQUER chão; só forço pedra se o terreno original não for andável — assim
  // a grade da Capela/Guilda/Cais assenta na grama/terra natural (sem quadrado solto).
  for (const [bcx, bcy] of [
    [15, 13], // Capela do Coveiro (Alto)
    [44, 20], // pátio da Guilda
    [38, 33], // Depot
    [36, 38], // Praça do Poço — bueiro principal (Q1 aponta)
    [50, 40], // Cais (Armazéns)
  ] as const) {
    const [bx, by] = city(bcx, bcy);
    if (!WALKABLE[get(bx, by)]) set(bx, by, TileId.StoneFloor);
  }

  // Ruas de terra ligando portões → praça
  const STREETS: [number, number][][] = [
    [city(40, 3), city(40, 20), city(38, 34)], // NE → praça
    [city(20, 57), city(20, 48), city(28, 44), city(33, 42)], // S → casa inicial → praça
    [city(3, 30), city(16, 32), city(33, 38)], // O → rua das lojas → praça
    [city(56, 52), city(48, 48), city(42, 44)], // Porta d'Água → praça
    [city(20, 29), city(20, 36)], // ferreiro → rua das lojas
    [city(40, 21), city(44, 19)], // guilda
    [city(20, 15), city(20, 21), city(30, 19)], // templo/santuário/torre (Alto)
  ];
  for (const st of STREETS) carvePolyline(set, st, 0.8, TileId.Dirt, rng, get);

  // Edifícios (§3.3) — telhado (footprint p/ o cliente roofar/esconder ao entrar)
  const buildings: MapRect[] = [];
  for (const b of BUILDINGS) {
    const [cx0, cy0, cx1, cy1] = b.rect;
    const [x0, y0] = city(cx0, cy0);
    const [x1, y1] = city(cx1, cy1);
    fillRect(set, [x0, y0], [x1, y1], TileId.StoneFloor);
    for (let x = x0; x <= x1; x++) {
      set(x, y0, TileId.HouseWall);
      set(x, y1, TileId.HouseWall);
    }
    for (let y = y0; y <= y1; y++) {
      set(x0, y, TileId.HouseWall);
      set(x1, y, TileId.HouseWall);
    }
    const [dx, dy] = city(...b.door);
    set(dx, dy, TileId.StoneFloor); // porta = vão na parede
    buildings.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 });
  }

  // Santuário de respawn (R4 — §3.3): clareira de pedra ao céu aberto + chama
  fillRect(set, city(14, 20), city(18, 24), TileId.StoneFloor);
  torch(...city(15, 21), 7);
  torch(...city(17, 21), 7);

  // Hortas junto ao portão Sul (§3.4): canteiros alternados
  for (let cy = 50; cy <= 56; cy++) {
    for (let cx = 16; cx <= 24; cx++) {
      if (cy % 2 === 0) set(...city(cx, cy), TileId.Dirt);
    }
  }

  // Beco dos Ladinos (§3.3): viela estreita no Cais — esconderijo (54,40)
  fillRect(set, city(52, 37), city(55, 41), TileId.Dirt);
  set(...city(53, 39), TileId.Wall);
  set(...city(53, 41), TileId.Wall);

  // Balsa FECHADA (§3.3): píer de tábuas do Cais até a água (promessa: Pontal)
  for (let x = 159; x <= 166; x++) set(x, 128, TileId.Bridge);

  // ════ 6b. MOBÍLIA URBANA (MOBILIA-URBANA.md §4/§5) — vila viva ════
  // Kit PROCEDURAL (decisão de design: NÃO usar PixelLab). 3 camadas: estruturas
  // de comércio ABERTAS (tenda/balcão/placa), props de USO (barril/caixa/saco/
  // lenha/feno) e DELIMITADORES (cerca/estacas). Estratégia §4: ASSIMETRIA, nunca
  // centralizar 1-a-1, clutter AGRUPADO (3–5 peças encostadas) nos CANTOS/VÃOS —
  // jamais sobre porta, estrada, bueiro ou o caminho do nascimento.
  //
  // `dec()` ancora em coord-CIDADE (via city()); `blk` define colisão (MapDecor.
  // blocks → tile impassável na sim). Guarda: peça que BLOQUEIA só pousa em tile
  // ANDÁVEL hoje (não sela porta/rua nem duplica muro — pula em silêncio se cair em
  // sólido); decor puro (saco/placa) pode encostar em parede. Determinístico (sem
  // rng): o placement é AUTORAL (assimetria/cluster vêm das coords, não do acaso).
  const dec = (cx: number, cy: number, kind: MapDecor["kind"], blk = false) => {
    const [x, y] = city(cx, cy);
    if (blk && !WALKABLE[get(x, y)]) return; // tile já sólido: não duplica/sela
    decor.push({ x, y, kind, ...(blk ? { blocks: true } : {}) });
  };
  // braseiro = fonte de luz quente móvel (luz vem dos DADOS, como a tocha — §3).
  const brazier = (cx: number, cy: number, radius = 4) => {
    const [x, y] = city(cx, cy);
    if (!WALKABLE[get(x, y)]) return;
    decor.push({ x, y, kind: "braseiro", blocks: true });
    lights.push({ x, y, color: 0xff7a36, radius, intensity: 0.8, flicker: true });
  };

  // ── FEIRA na Praça do Poço (§4 — o maior salto de "vila") ──
  // Poço no CENTRO (assenta na água-doce city(37,39): o marco que dá nome à praça
  // e a fonte de cozinha são a MESMA peça). Bloqueia o tile; cozinha-se ao lado
  // (nearWater = Chebyshev ≤1) e os 8 vizinhos ficam livres (bueiro (36,38) e ruas
  // intactos). Tendas em ANEL IRREGULAR colado às bordas, fugindo das 4 bocas de
  // rua (N≈x38, O≈y38, S≈(33,42), SE≈(42,44)) e dos vizinhos do poço.
  dec(37, 39, "poco", true);
  // tendas (5, assimétricas — cantos NO/NE/SO/SE/S da praça, nunca enfileiradas).
  // x34 no topo é a parede L do Boticário (some na praça) → banca NO foge p/ x35.
  dec(35, 36, "tenda", true);
  dec(40, 35, "tenda", true);
  dec(34, 42, "tenda", true);
  dec(41, 41, "tenda", true);
  dec(39, 43, "tenda", true);
  // mercadoria AGRUPADA junto de cada tenda (saco/cesto = decor; caixa = bloqueia)
  dec(33, 36, "saco"); dec(33, 37, "saco"); dec(35, 37, "caixa", true); // banca NO
  dec(40, 34, "caixa", true); dec(41, 35, "saco"); dec(39, 35, "saco");  // banca NE
  dec(33, 42, "saco"); dec(35, 43, "saco"); dec(34, 43, "caixa", true);  // banca SO
  dec(42, 41, "saco"); dec(41, 42, "caixa", true);                       // banca SE
  dec(38, 42, "saco"); dec(40, 43, "saco");                              // banca S
  // pilha de caixas/barris num canto morto da praça (clutter agrupado, §4)
  dec(33, 39, "caixa", true); dec(33, 40, "barril", true); dec(34, 40, "caixa", true);

  // ── FACHADAS viram LOJAS (§4): balcão/placa/clutter NA FRENTE da porta. A parede
  // sul da casa NÃO é andável (HouseWall) → peça que bloqueia pousa UM tile à frente
  // (ground andável), nunca no vão da porta nem no tile do NPC; a PLACA pendura na
  // parede (decor puro). Tile de aproximação da porta (logo abaixo) fica LIVRE.
  // Loja Geral (Nina, porta (24,38)) — balcão a O, clutter a L; aproximação (24,39).
  dec(22, 39, "balcao", true); dec(23, 38, "placa");
  dec(26, 39, "caixa", true); dec(27, 39, "barril", true); dec(26, 40, "saco");
  // Boticário (Silas, porta (31,38)) — balcão a L, clutter a O; aproximação (31,39).
  dec(33, 39, "balcao", true); dec(32, 38, "placa");
  dec(28, 39, "barril", true); dec(29, 39, "caixa", true); dec(28, 40, "saco");
  // Ferreiro (Duarte, porta (20,28)) — balcão a L + forja (braseiro/lenha) a O;
  // a rua sai da porta pela coluna x20 (20,29)→(20,36): NADA em x20. Aprox. (20,29).
  dec(22, 29, "balcao", true); dec(22, 28, "placa");
  brazier(18, 29); dec(17, 29, "lenha", true); dec(23, 29, "caixa", true);
  // Estalagem do Vau (Bartolo, porta (20,42)) — barris de cerveja a L + placa;
  // fogão é interior (não mexer). Aproximação (20,43) livre.
  dec(22, 43, "barril", true); dec(23, 43, "barril", true); dec(22, 44, "caixa", true);
  dec(18, 42, "placa");

  // ── QUEBRAR O GRID (§4): cercas definindo quintais/becos + clutter nos vãos ──
  // Quintal a O da Loja Geral / N da Estalagem (vão uniforme entre as casas-caixa).
  // Cerca em L (autotile pega os cantos); vão deixado p/ entrar; clutter dentro.
  for (let cy = 32; cy <= 33; cy++) dec(28, cy, "cerca", true); // lance vertical
  dec(29, 33, "cerca", true); dec(30, 33, "cerca", true);        // dobra p/ leste
  dec(29, 32, "lenha", true); dec(30, 32, "lenha", true); // lenha/feno = mesmo kind
  // viela entre Boticário (sul) e Depot (norte): pilha encostada (mata canto vazio)
  dec(34, 33, "caixa", true); dec(35, 33, "barril", true);

  // ── PÁTIO DA MILÍCIA / GUILDA (R1, Guilda rect [40..50,12..18], porta (44,18)):
  // braseiro + boneco de treino (treino). Ricardo em (44,18) — fica no vão; planto
  // ao lado, sem tapar a porta nem a rua da guilda (40,21)→(44,19).
  dec(46, 19, "boneco_treino", true); dec(47, 19, "boneco_treino", true);
  brazier(42, 19); dec(41, 19, "lenha", true);

  // ── MURALHA "EM OBRAS" (§3.1): trechos de gap O (city x2, y44..50) e S (city
  // y58, x6..12) — estacas de obra + ripas soltas (gancho físico do v4). Pousa
  // na grama do gap (andável), nunca na muralha de pedra.
  dec(2, 45, "estacas", true); dec(2, 47, "estacas", true); dec(3, 46, "lenha", true);
  dec(7, 58, "estacas", true); dec(10, 58, "estacas", true); dec(9, 57, "caixa", true);

  // ════ 7. POIs fora da muralha ════
  // Gruta dos Morcegos (S3 — barranco N da colina): bolsão rochoso
  ringRocks(set, get, 137, 58, 9, 0.55, rng);
  fillRect(set, [132, 54], [142, 62], TileId.Dirt);
  // Toca dos Lobos (S4): clareira com pedras na orla
  ringRocks(set, get, 186, 67, 8, 0.3, rng);
  // Acampamento Goblin (S5): chão batido + fogueiras (tochas por ora)
  fillRect(set, [196, 44], [214, 58], TileId.Dirt);
  torch(202, 48);
  torch(210, 54);
  // Caverna dos Goblins (S6): boca telegrafada ✏️ interior é mapa separado
  ringRocks(set, get, 240, 40, 5, 0.8, rng);
  fillRect(set, [238, 38], [242, 42], TileId.Dirt);
  carveTrail(set, get, [
    [216, 52],
    [228, 46],
    [238, 42],
  ]); // trilha acampamento → boca (Q8 ato 2 → ato 3)
  // Minas Perdidas (S8) + carrinhos enferrujados (P23): boca no NE remoto
  ringRocks(set, get, 330, 30, 6, 0.8, rng);
  fillRect(set, [328, 28], [332, 32], TileId.Dirt);
  set(330, 33, TileId.Rock); // ✏️ carrinho vira decor próprio (diretor-de-arte)
  carveTrail(set, get, [
    [322, 12],
    [326, 20],
    [330, 27],
  ]); // desvio da estrada NE → boca da mina (Q13: "trilha pós-vau")
  // Juncal dos Fundeiros (S9): faixas de pântano nas margens do bojo
  for (let y = 150; y <= 185; y++) {
    for (let x = 175; x <= 205; x++) {
      if (get(x, y) === TileId.Grass && rng() < 0.5) set(x, y, TileId.Swamp);
    }
  }
  // Acampamento dos Bandidos (S11), junto à ponte ③
  fillRect(set, [152, 264], [160, 270], TileId.Dirt);
  torch(154, 266);
  torch(159, 269);
  // Moinho Velho (S12/P22 — landmark sul, corvos/Q12)
  fillRect(set, [56, 246], [64, 254], TileId.StoneFloor);
  for (let x = 56; x <= 64; x++) {
    set(x, 246, TileId.HouseWall);
    set(x, 254, TileId.HouseWall);
  }
  for (let y = 246; y <= 254; y++) {
    set(56, y, TileId.HouseWall);
    set(64, y, TileId.HouseWall);
  }
  set(60, 254, TileId.StoneFloor); // porta S
  buildings.push({ x: 56, y: 246, w: 9, h: 9 }); // telhado do moinho
  torch(60, 256);
  // Granja (S2/P11): dois celeiros + terreiro
  for (const [bx0, by0, bx1, by1, doorX] of [
    [28, 84, 34, 89, 31],
    [40, 86, 46, 91, 43],
  ] as const) {
    fillRect(set, [bx0, by0], [bx1, by1], TileId.StoneFloor);
    for (let x = bx0; x <= bx1; x++) {
      set(x, by0, TileId.HouseWall);
      set(x, by1, TileId.HouseWall);
    }
    for (let y = by0; y <= by1; y++) {
      set(bx0, y, TileId.HouseWall);
      set(bx1, y, TileId.HouseWall);
    }
    set(doorX, by1, TileId.StoneFloor);
    buildings.push({ x: bx0, y: by0, w: bx1 - bx0 + 1, h: by1 - by0 + 1 }); // telhado do celeiro
  }
  fillRect(set, [30, 92], [44, 96], TileId.Dirt);

  // ════ 8. Spots → spawns (§5) — filtra pelo bestiário implementado ════
  for (const spot of SPOTS) {
    // clareira parcial: spot precisa ser caçável (limpa ~70% das árvores)
    const [sx0, sy0, sx1, sy1] = spot.rect;
    for (let y = sy0; y <= sy1; y++) {
      for (let x = sx0; x <= sx1; x++) {
        if (get(x, y) === TileId.Tree && rng() < 0.7) set(x, y, TileId.Grass);
      }
    }
    for (const [mx, my, species] of spot.spawns) {
      if (!(species in CREATURES)) continue; // espécie ainda não implementada
      const t = get(mx, my);
      if (t === TileId.Tree || t === TileId.Rock || t === TileId.Wall) set(mx, my, TileId.Grass);
      if (get(mx, my) === TileId.Water) continue;
      monsters.push({ x: mx, y: my, species });
    }
  }

  // ════ 9. Nascimento (§3.3 casa inicial) + zona segura ════
  // Spawn DENTRO da casa inicial (Rosa, containers domésticos — sistema vem depois)
  const spawn = { x: 128, y: 124 }; // cidade (28,44), acima da porta (28,46)
  // Respawn de MORTE = Santuário do Templo (cidade 16,22, no Alto), separado do
  // nascimento (GRID §3.3): morrer renasce no santuário, não na casa-tutorial.
  const [rsx, rsy] = city(16, 22);
  const respawn = { x: rsx, y: rsy };
  torch(126, 122, 6); // lareira da casa — ninguém nasce no breu
  // Zona segura = SÓ interiores específicos (decidido jun/2026): templo, depot,
  // casas de player ✏️, barco ✏️. A cidade NÃO é mais toda segura — combate na rua.
  // Interior = retângulo do edifício menos a parede (rect+1 .. rect-1).
  const safeBuildings = ["Templo (Gabriel — R4)", "Depot (banco/armazém)", "Casa inicial (Rosa — nascimento)"];
  const safeZones: MapRect[] = [];
  for (const b of BUILDINGS) {
    if (!safeBuildings.includes(b.name)) continue;
    const [x0, y0] = city(b.rect[0], b.rect[1]);
    const [x1, y1] = city(b.rect[2], b.rect[3]);
    safeZones.push({ x: x0 + 1, y: y0 + 1, w: x1 - x0 - 1, h: y1 - y0 - 1 });
  }

  // NPCs falantes da fatia (GRID §4 + §3.3 portas dos edifícios). Cada um POUSA
  // na porta do seu edifício (vão = StoneFloor andável, alcançável da rua) via
  // city(). Coords-cidade da tabela §4; conferidas tile-a-tile contra o paint da
  // cidade (todas andáveis). Bento NÃO entra (fundido no Bartolo, jun/2026).
  // ✏️ posições finas = world-designer; aqui é o placement de integração.
  const npc = (npcId: string, name: string, cx: number, cy: number) => {
    const [x, y] = city(cx, cy);
    return { npcId, name, x, y };
  };
  // FIX (jun/2026 — "Bartolo travando a porta"): antes, cada NPC de prédio caía
  // EM CIMA do tile-porta do seu edifício (a coord-âncora do GRID é a porta) e,
  // com o anda-pra-abrir + bloqueio de corpo, SELAVA a entrada. Agora cada um
  // pousa 1–2 tiles DENTRO (atrás do balcão), em tile andável do interior, longe
  // da porta/baú/spawn. Coords antigas (= porta) anotadas ao lado. Os que já
  // estavam fora do vão (hugo/rosa/telmo/vincente/amaro/augusto/marco) ficam.
  const npcSpawns = [
    // ── Baixa (cluster de utilidade + ofícios) ──
    npc("bartolo", "Bartolo", 20, 40), // Estalagem do Vau (Q1/Q6) — atrás do balcão (era a porta 20,42)
    npc("nina", "Nina", 24, 36), // Loja Geral (Q2) — interior (era a porta 24,38)
    npc("silas", "Silas", 31, 36), // Boticário (Q3) — interior (era a porta 31,38)
    npc("duarte", "Duarte", 20, 26), // Ferreiro (Q4/Q9) — interior (era a porta 20,28)
    npc("vidal", "Vidal", 8, 34), // Quartel da Guarda (Q5/Q8/Q9) — interior (era a porta 8,36)
    npc("hugo", "Hugo", 26, 30), // mineiro aposentado (Q13 — sussurrador), canto da Baixa
    npc("rosa", "Rosa", 28, 43), // casa inicial (tutorial) — interior andável (128,123),
    //   na safeZone, SEM tapar a PORTA (128,126), o spawn (128,124) nem os baús
    //   (127/129,123). Antes caía em (128,126) = único vão de saída da casa, FORA
    //   da safeZone interior, e BLOQUEAVA o player preso lá dentro (fix jun/2026).
    // ── Alto (fé/arcano + treino) ──
    npc("abel", "Abel", 15, 10), // Capela do Coveiro (Q10) — interior (era a porta 15,12)
    npc("gabriel", "Gabriel", 20, 12), // Templo (R4) — interior (era a porta 20,14)
    npc("leonor", "Leonor", 30, 16), // Casa do Mago / Torre (R2) — interior (era a porta 30,18)
    npc("ricardo", "Ricardo", 44, 16), // Pátio da Milícia / Guilda (R1) — interior (era a porta 44,18)
    // ── Cais (taverna/becos/armazéns) ──
    npc("tobias", "Tobias", 50, 28), // Taverna do Cais (Q12 — sussurrador) — interior (era a porta 50,30)
    npc("telmo", "Telmo", 51, 29), // Taverneiro (elo Q9)
    npc("vincente", "Vincente", 52, 38), // Beco dos Ladinos (R3)
    npc("amaro", "Amaro", 48, 41), // caçador-peleteiro (Q7) — junto à Câmara/Armazéns (door (48,42) cai na parede; 1 tile ao N, andável)
    npc("augusto", "Augusto", 46, 47), // Câmara (flavor) — door (46,46) clobrada pelo Armazém vizinho; 1 tile ao S, andável
    // ── Fora da muralha: Marco, vigia de Atalaia, na estrada leste perto da borda ──
    { npcId: "marco", name: "Marco", x: 336, y: 150 }, // destino da Q4 (estrada leste, P24)
  ];

  // Cozinha (COZINHA.md): fonte de calor = fogão da Estalagem do Vau (interior,
  // cozinha do Bento); água-doce = o Poço, centro da Praça do Poço. Placement
  // VALIDADO (jun/2026): ambos andáveis com 8 vizinhos livres (dá pra cozinhar ao
  // lado). ✏️ fogueiras de campo (acampamento goblin/santuário) como heat = futuro.
  const [hx, hy] = city(18, 40);
  const [wx, wy] = city(37, 39);
  const heatSources = [{ x: hx, y: hy }];
  const freshWater = [{ x: wx, y: wy }];

  // ════ Baús da fatia (GRID §8 — orçamento 8 baús, piramidal) ════
  // Loot SÓ com templateIds existentes (templates.ts). Base utilitária/armadura
  // T1 (B6/B7/B8), meio gear (B1–B4), 1 lacrado nv10 (B5). Posições = GRID §8/§9,
  // conferidas andáveis (overworld) / SewerFloor (B5 no A2). ✏️ M3/Balancista fina
  // o conteúdo. A casa inicial (containers domésticos) vem logo abaixo, NÃO conta
  // como baú do orçamento.
  const chests: ChestDef[] = [
    // ── meio (gear) ──
    { id: "b1_moinho_porao", pos: { x: 60, y: 250 }, z: 0, name: "Baú dos Corvos",
      loot: { items: [{ templateId: "tunica_de_couro" }, { templateId: "corda" }], gold: 40 } }, // Q12 (Moinho, porão)
    { id: "b2_caverna_goblin", pos: { x: 240, y: 40 }, z: 0, name: "Baú do Bando Goblin",
      loot: { items: [{ templateId: "coifa_de_couro" }], gold: 60 } }, // Q8 ato 3 (fundo da Caverna, atrás do Orc)
    { id: "b3_minas_perdidas", pos: { x: 330, y: 30 }, z: 0, name: "Baú Guardado da Mina",
      loot: { items: [{ templateId: "cota_de_malha" }], gold: 120 } }, // Q13 (fundo das Minas) — gear T2 + gold alto
    { id: "b4_margem_leste", pos: { x: 220, y: 170 }, z: 0, name: "Baú da Margem",
      loot: { items: [{ templateId: "calcas_de_couro" }], gold: 50 } }, // Q14 (segredo — pós-pedras ④)
    // ── lacrado (a promessa visível do early game) ──
    { id: "b5_esgoto_lacrado", pos: { x: 138, y: 144 }, z: -2, name: "Baú Lacrado",
      levelReq: 10, loot: { items: [{ templateId: "elmo_de_ferro" }, { templateId: "escudo_de_ferro" }], gold: 80 } }, // A2, à vista (luz fria já marca este tile)
    // ── base (armadura T1 / utilitário) ──
    { id: "b6_granja", pos: { x: 31, y: 86 }, z: 0, name: "Baú do Celeiro",
      loot: { items: [{ templateId: "botas_de_couro" }, { templateId: "corda" }] } }, // Granja (celeiro) — base
    { id: "b7_gruta_morcegos", pos: { x: 140, y: 60 }, z: 0, name: "Baú Empoeirado",
      loot: { items: [{ templateId: "tocha", qty: 3 }, { templateId: "corda" }], gold: 20 } }, // Gruta dos Morcegos (fundo) — utilitário
    { id: "b8_ninho_aranhas", pos: { x: 290, y: 82 }, z: 0, name: "Baú no Casulo",
      loot: { items: [{ templateId: "calcas_de_couro" }] } }, // Ninho de Aranhas (canto curioso S7) — armadura T1
  ];

  // ════ Casa inicial (GRID §3.3/§8) — containers domésticos do NASCIMENTO ════
  // Modelados como ChestDef (o motor de baú já existe; container doméstico = baú
  // que não conta no orçamento). Spawn é em (128,124), dentro da casa inicial
  // (rect city[25,41]→[31,46]); estes baús ficam ao lado, em tiles andáveis do
  // interior. O 1º container concede a 1ª CHAVE (grantsKey "chave_casa_inicial").
  chests.push(
    { id: "casa_inicial_bau", pos: { x: 127, y: 123 }, z: 0, name: "Baú de Casa",
      loot: { items: [{ templateId: "gibao_roto" }, { templateId: "botas_surradas" }], grantsKey: "chave_casa_inicial" } },
    { id: "casa_inicial_arca", pos: { x: 129, y: 123 }, z: 0, name: "Arca Velha",
      loot: { items: [{ templateId: "espada_cega" }, { templateId: "sacola_de_pano" }] } },
  );

  // ════ Portas de TODA casa entrável (feel Tibia/Apogea — EXPLORACAO.md) ════
  // Uma DoorDef no tile-porta de CADA edifício do BUILDINGS (vão na HouseWall, já
  // StoneFloor pelo loop acima). TODAS destrancadas — abrem ANDANDO no vão (a sim
  // abre + auto-fecha, estado GLOBAL) ou via `interact` — EXCETO a casa inicial,
  // que mantém `keyReq` "chave_casa_inicial": o loop-assinatura container→chave→
  // porta do tutorial. O player nasce preso, abre o baú (gibão/botas + a chave, que
  // NÃO tem keyReq → sempre alcançável: nunca fica preso insolúvel), e sai pela
  // porta (128,126) = city door (28,46), o único vão da casa. Fechada bloqueia
  // (mob nunca abre → casas seladas pra criatura). Coord-cidade → local via city().
  const doors: DoorDef[] = BUILDINGS.map((b) => {
    const [dx, dy] = city(...b.door);
    return {
      id: b.doorId,
      pos: { x: dx, y: dy },
      z: 0,
      name: b.doorName,
      ...(b.lockKey ? { keyReq: b.lockKey } : {}),
    };
  });
  // GARANTIA: todo tile-porta é um VÃO andável (StoneFloor). A maioria já é (o loop
  // dos BUILDINGS pinta a porta), mas prédios que se TOCAM podem ter a parede de um
  // vizinho clobrando o vão do outro na ordem de paint — caso real: a porta da Câmara
  // (146,126) cai sob a parede O dos Armazéns. Forçar aqui mantém a porta sempre
  // atravessável (senão a porta FECHADA seria bloqueio-duplo de tile sólido). A casa
  // inicial (128,126) já é StoneFloor — idempotente.
  for (const d of doors) set(d.pos.x, d.pos.y, TileId.StoneFloor);

  // ════ Interativos de quest no OVERWORLD (z=0) — hook `interact` (GRID §10) ════
  // Cada id casa com um `QuestStageDef` type:"interact" (conferidos nos defs em
  // quests/defs/*.ts). Os do SUBSOLO (q10 no A2) vão no FloorLayer do andar.
  // NOTA q11_carta_rabiscada: a Q11 é ABERTA-POR-ITEM (a Carta Rabiscada é loot
  // raro do `bandido`; LER a carta é o gatilho) — NÃO é ponto de mapa. NÃO é
  // plantada aqui; o ancoradouro de leitura vem do futuro hook item→quest (ver o
  // cabeçalho de q11_tesouro.ts). Plantá-la como interactable de mundo daria um
  // gatilho físico que a quest não quer — deixada de fora de propósito.
  const interactables: InteractableDef[] = [
    { id: "q2_fardo", pos: { x: 40, y: 92 }, name: "o fardo largado" }, // Q2 — terreiro da Granja
    { id: "q6_fogueira_estalagem", pos: { x: hx, y: hy }, name: "a fogueira da estalagem" }, // Q6 — = heatSource (118,120)
    { id: "q9_carga_roubada", pos: { x: 156, y: 267 }, name: "a carga roubada" }, // Q9 — acampamento dos bandidos
    { id: "q12_moinho_porao", pos: { x: 60, y: 250 }, name: "o porão do moinho" }, // Q12 — porão do Moinho Velho
    { id: "q13_bau_guardado", pos: { x: 330, y: 30 }, name: "o baú guardado" }, // Q13 — fundo das Minas
    { id: "q14_pedras", pos: { x: 185, y: 161 }, name: "as pedras de passagem" }, // Q14 — a travessia ④ (tile real das pedras no junco)
  ];

  // ════ Regiões de quest no OVERWORLD (z=0) — hook `region_enter` (GRID §10) ════
  // Cada id casa com um `QuestStageDef` type:"region_enter". As do SUBSOLO
  // (esgoto_a2 / porao_afogado_a3) vão nos FloorLayers dos andares.
  const questRegions: QuestRegionDef[] = [
    { id: "acampamento_goblin", rect: { x: 185, y: 35, w: 45, h: 35 } }, // Q8a2 — S5 [185..230]×[35..70]
    { id: "minas_perdidas", rect: { x: 325, y: 27, w: 10, h: 8 } }, // Q13 — boca da mina NE remoto [325..335]×[27..35]
    { id: "moinho_porao", rect: { x: 56, y: 246, w: 8, h: 8 } }, // Q12 — interior do Moinho [56..64]×[246..254]
    { id: "q14_margem_leste", rect: { x: 210, y: 160, w: 20, h: 20 } }, // Q14 — pouso da travessia ④ [210..230]×[160..180]
  ];

  // Garante que todo ANCORADOURO de overworld (baú z=0 + interactable) pouse em
  // tile ANDÁVEL — mesma régua do loop de spawns: se caiu em árvore/pedra/muro
  // (scatter procedural por cima de um POI, ex. B8 no Ninho), abre pra grama.
  // Determinístico e idempotente; não mexe em água (anchors foram escolhidos
  // fora d'água). Subsolo (z≠0) é alvenaria sólida — não passa por aqui.
  const clearAnchor = (x: number, y: number) => {
    const t = get(x, y);
    if (t === TileId.Tree || t === TileId.Rock || t === TileId.Wall || t === TileId.HouseWall)
      set(x, y, TileId.StoneFloor);
  };
  for (const c of chests) if (c.z === 0) clearAnchor(c.pos.x, c.pos.y);
  for (const it of interactables) clearAnchor(it.pos.x, it.pos.y);

  return {
    id: "alvorada",
    width: W,
    height: H,
    tiles,
    lights,
    decor,
    monsters,
    safeZones,
    passZones: [],
    buildings,
    spawn,
    respawn,
    npcSpawns,
    chests,
    doors,
    interactables,
    questRegions,
    heatSources,
    freshWater,
    portals: ALVORADA_PORTALS,
    floors: [buildSewerA1(), buildSewerA2(), buildSewerA3()],
  };
}

// ─── esgotos (z-levels) — A1/A2/A3, visão completa do GRID §7 (3 andares) ───

// Origens/tamanhos das 3 camadas (coords de MUNDO — modelo esparso do SISTEMA-ANDARES).
// O A1 cobre o footprint da cidade (as 5 bocas caem aqui dentro = atalho urbano).
const A1_OX = 110, A1_OY = 88, A1_W = 52, A1_H = 50;
const A2_OX = 110, A2_OY = 120, A2_W = 98, A2_H = 56; // dungeon O + galeria alagada → margem leste
const A3_OX = 128, A3_OY = 150, A3_W = 28, A3_H = 16; // Porão Afogado (bolsão minúsculo)

// As 5 bocas em coord-LOCAL do A1 (world boca − origem A1). Ver §7.1.
const A1_BOCAS: Record<string, [number, number]> = {
  capela: [5, 5],   // world (115,93)
  guilda: [34, 12], // world (144,100)
  depot: [28, 25],  // world (138,113)
  praca: [26, 30],  // world (136,118) — bueiro principal (Q1)
  cais: [40, 32],   // world (150,120)
};

/** Helper de pintura por andar (coords LOCAIS à camada). */
function floorPainter(w: number, h: number) {
  const t: TileId[] = new Array(w * h).fill(TileId.SewerWall);
  const lset = (lx: number, ly: number, tile: TileId) => {
    if (lx >= 0 && ly >= 0 && lx < w && ly < h) t[ly * w + lx] = tile;
  };
  const room = (x0: number, y0: number, x1: number, y1: number, tile: TileId) => {
    for (let ly = y0; ly <= y1; ly++) for (let lx = x0; lx <= x1; lx++) lset(lx, ly, tile);
  };
  return { t, lset, room };
}

/**
 * Esgoto A1 (z=−1) — galerias rasas T1, o ATALHO URBANO sob a cidade (GRID §7.2):
 * uma ESPINHA E-W ligando as 5 bocas (Capela/Guilda/Depot/Praça/Cais), com câmaras
 * tapando nela. Trincheira de água servida na espinha; câmara-SUMP com poça funda
 * (hazard) a SO; câmara de RUÍNAS ao N com alvenaria antiga (telegrafa o A2). Ratos
 * nas galerias + 2 esqueletos T2 no fundo (ruínas/SE). 2 descidas (escada) pro A2.
 */
function buildSewerA1(): FloorLayer {
  const { t, lset, room } = floorPainter(A1_W, A1_H);
  const wx = (lx: number) => A1_OX + lx, wy = (ly: number) => A1_OY + ly;

  // ESPINHA-ATALHO: corredor E-W no meio (y23-25), liga a cidade inteira por baixo
  room(4, 23, 47, 25, TileId.SewerFloor);

  // CÂMARAS de boca + conteúdo
  room(3, 3, 9, 9, TileId.SewerFloor);     // Capela (NO)
  room(30, 8, 39, 15, TileId.SewerFloor);  // Guilda (NE)
  room(23, 20, 33, 28, TileId.SewerFloor); // Depot (centro) — encosta na espinha
  room(21, 27, 31, 35, TileId.SewerFloor); // Praça (centro-S, entrada principal)
  room(35, 27, 45, 35, TileId.SewerFloor); // Cais (SE)
  room(15, 2, 28, 9, TileId.SewerFloor);   // RUÍNAS (N) — telegrafa o A2
  room(3, 33, 12, 45, TileId.SewerFloor);  // câmara-SUMP (SO)

  // TAPS verticais ligando cada câmara à espinha
  room(5, 8, 7, 23, TileId.SewerFloor);    // Capela → espinha
  room(33, 15, 35, 23, TileId.SewerFloor); // Guilda → espinha
  room(21, 9, 23, 23, TileId.SewerFloor);  // Ruínas → espinha
  room(25, 25, 27, 30, TileId.SewerFloor); // Praça/Depot → espinha
  room(39, 25, 41, 28, TileId.SewerFloor); // Cais → espinha
  room(6, 25, 8, 33, TileId.SewerFloor);   // espinha → sump

  // TRINCHEIRA de água servida na espinha (fora das câmaras)
  for (let lx = 12; lx <= 20; lx++) lset(lx, 24, TileId.Sewage);
  for (let lx = 30; lx <= 38; lx++) lset(lx, 24, TileId.Sewage);
  // POÇA FUNDA no sump (impassável)
  room(5, 37, 10, 43, TileId.DeepWater);

  // RUÍNAS: pilares de alvenaria antiga (telegrafa o A2)
  lset(18, 4, TileId.OldMasonryWall); lset(19, 4, TileId.OldMasonryWall);
  lset(24, 6, TileId.OldMasonryWall); lset(25, 7, TileId.OldMasonryWall);
  lset(21, 8, TileId.OldMasonryWall);

  // chão seco garantido sob cada boeiro (landing)
  for (const [bx, by] of Object.values(A1_BOCAS)) lset(bx, by, TileId.SewerFloor);

  const decor: MapDecor[] = [];
  const lights: MapLight[] = [];
  const torch = (lx: number, ly: number, radius = 5) => {
    decor.push({ x: wx(lx), y: wy(ly), kind: "torch" });
    lights.push({ x: wx(lx), y: wy(ly), color: 0xffa14e, radius, intensity: 0.85, flicker: true });
  };
  torch(6, 6); torch(34, 11); torch(27, 23); torch(24, 30); torch(40, 30);
  torch(22, 4, 6); torch(5, 35, 6);

  // ESCADAS DE VOLTA: uma sob cada boeiro (sobe pra superfície)
  const ups: MapPortal[] = Object.values(A1_BOCAS).map(([bx, by]) => ({
    x: wx(bx), y: wy(by), kind: "stairs", to: { x: wx(bx), y: wy(by), z: 0 },
  }));
  // DESCIDAS A1→A2 (escada; o v4 mostra duas — §7.2): ruínas (N) e SE (fundo)
  const downRuins: MapPortal = { x: wx(22), y: wy(4), kind: "stairs", to: { x: A2_OX + 12, y: A2_OY + 9, z: -2 } };
  const downSE: MapPortal = { x: wx(43), y: wy(33), kind: "stairs", to: { x: A2_OX + 48, y: A2_OY + 30, z: -2 } };

  return {
    z: -1, ox: A1_OX, oy: A1_OY, width: A1_W, height: A1_H,
    tiles: t, lights, decor,
    monsters: [
      { x: wx(7), y: wy(20), species: "rato" },
      { x: wx(34), y: wy(20), species: "rato" },
      { x: wx(15), y: wy(24), species: "rato" },
      { x: wx(40), y: wy(24), species: "rato" },
      { x: wx(22), y: wy(6), species: "esqueleto" },  // ruínas (T2 — fundo)
      { x: wx(42), y: wy(31), species: "esqueleto" }, // SE (T2 — fundo)
    ],
    portals: [...ups, downRuins, downSE],
    openings: [],
    ambient: 0x0a0e14, // breu do subsolo
  };
}

/**
 * Esgoto A2 (z=−2) — galerias antigas T2, "dungeon de verdade" (GRID §7.3): câmaras
 * de alvenaria a O (sob a cidade), a ALVENARIA MANCHADA do Q10, o BAÚ LACRADO nv10
 * visível (promessa early-game), e uma GALERIA ALAGADA correndo a LESTE até desembocar
 * na margem do rio (travessia secreta ⑤). O MERGULHO alagado desce pro A3 (mão-única).
 * Aranhas T2. Custo de fuga já maior que o A1.
 */
function buildSewerA2(): FloorLayer {
  const { t, lset, room } = floorPainter(A2_W, A2_H);
  const wx = (lx: number) => A2_OX + lx, wy = (ly: number) => A2_OY + ly;

  // CÂMARAS do trecho-dungeon (oeste, sob a cidade)
  room(8, 5, 24, 16, TileId.SewerFloor);   // entrada vinda da descida das ruínas
  room(38, 24, 54, 38, TileId.SewerFloor); // câmara SE (vinda da descida SE) — fundo
  room(12, 22, 30, 40, TileId.SewerFloor); // galeria central (Q10 + baú)
  room(16, 16, 22, 22, TileId.SewerFloor); // liga entrada → central
  room(30, 28, 38, 32, TileId.SewerFloor); // liga central → SE

  // GALERIA ALAGADA → margem leste (travessia secreta ⑤): some da câmara SE,
  // SERPENTEIA e MERGULHA sob o rio (x~175-189) com poças fundas ladeando e um
  // RESPIRO seco no meio, e emerge na margem leste (no lugar do antigo tubo reto).
  room(52, 28, 67, 33, TileId.SewerFloor); // saída da câmara SE
  room(62, 33, 67, 40, TileId.SewerFloor); // curva pro sul
  room(64, 37, 95, 41, TileId.SewerFloor); // corrida sob o rio → leste
  room(70, 34, 75, 41, TileId.SewerFloor); // air-pocket (respiro sob o rio)
  room(88, 34, 95, 41, TileId.SewerFloor); // câmara de saída (margem leste)
  // POÇAS FUNDAS ladeando (hazard que se contorna — NÃO bloqueia a passagem)
  room(78, 33, 84, 35, TileId.DeepWater);
  room(66, 41, 71, 43, TileId.DeepWater);
  room(84, 41, 90, 43, TileId.DeepWater);
  // lâmina de água servida correndo no meio (rasa, vadeável) — pintada por último
  // pra garantir que o caminho nunca fica vedado por poça
  for (let lx = 54; lx <= 66; lx++) lset(lx, 31, TileId.Sewage);
  for (let lx = 64; lx <= 94; lx++) lset(lx, 39, TileId.Sewage);

  // ALVENARIA ANTIGA manchada (Q10) — "mais velha que a cidade"
  lset(20, 30, TileId.OldMasonryWall); lset(21, 30, TileId.OldMasonryWall);
  lset(20, 31, TileId.OldMasonryWall); lset(21, 31, TileId.OldMasonryWall);

  // MERGULHO pro A3: lip de água servida (vadeável, andável) → poça funda atrás.
  // O buraco fica no lip (Sewage), senão cairia em DeepWater (não-andável = inalcançável).
  room(17, 38, 21, 40, TileId.DeepWater);
  lset(18, 37, TileId.Sewage); lset(19, 37, TileId.Sewage); lset(20, 37, TileId.Sewage);

  const decor: MapDecor[] = [];
  const lights: MapLight[] = [];
  const torch = (lx: number, ly: number, radius = 5) => {
    decor.push({ x: wx(lx), y: wy(ly), kind: "torch" });
    lights.push({ x: wx(lx), y: wy(ly), color: 0xffa14e, radius, intensity: 0.8, flicker: true });
  };
  torch(10, 7); torch(22, 23); torch(50, 26); torch(36, 30, 6);
  torch(72, 37, 4); // respiro sob o rio (air-pocket)
  torch(91, 37, 4); // câmara de saída na margem
  // baú lacrado: marco luminoso frio pra "promessa visível" (sistema de baú = track Itens)
  lights.push({ x: wx(28), y: wy(24), color: 0x6fa8ff, radius: 4, intensity: 0.5, flicker: false });

  return {
    z: -2, ox: A2_OX, oy: A2_OY, width: A2_W, height: A2_H,
    tiles: t, lights, decor,
    monsters: [
      { x: wx(14), y: wy(10), species: "aranha" },
      { x: wx(16), y: wy(26), species: "aranha" }, // galeria central (longe da alvenaria Q10)
      { x: wx(46), y: wy(30), species: "aranha" },
      { x: wx(48), y: wy(34), species: "esqueleto" }, // fundo SE
    ],
    portals: [
      // volta pro A1 (sob as descidas que chegam aqui)
      { x: wx(12), y: wy(9), kind: "stairs", to: { x: A1_OX + 22, y: A1_OY + 4, z: -1 } },
      { x: wx(48), y: wy(30), kind: "stairs", to: { x: A1_OX + 43, y: A1_OY + 33, z: -1 } },
      // galeria alagada → margem leste do rio (travessia secreta ⑤): emerge logo a
      // leste do rio, FORA da muralha (cruzou por baixo da água)
      { x: wx(92), y: wy(38), kind: "cave", to: { x: 202, y: 158, z: 0 } },
      // MERGULHO alagado → A3 (mão-única, custo de fuga máximo): some no lip alagado
      { x: wx(19), y: wy(37), kind: "hole", to: { x: A3_OX + 12, y: A3_OY + 8, z: -3 } },
    ],
    openings: [],
    // Q10 (A Água do Poço): a alvenaria manchada das ruínas (interact) + a região
    // do andar inteiro (region_enter). O ancoradouro do interact pousa no chão
    // SECO (SewerFloor) colado à mancha (alvenaria = parede não-andável), pra o
    // alcance do `interact` casar. A região é o footprint do A2.
    interactables: [
      { id: "q10_alvenaria_manchada", z: -2, pos: { x: wx(19), y: wy(30) }, name: "a alvenaria manchada" }, // mancha em (130,150)
    ],
    questRegions: [
      { id: "esgoto_a2", z: -2, rect: { x: A2_OX, y: A2_OY, w: A2_W, h: A2_H } }, // Q10 — todo o andar A2
    ],
    ambient: 0x070a10, // mais escuro que o A1
  };
}

/**
 * Esgoto A3 (z=−3) — o PORÃO AFOGADO T3 (GRID §7.4): bolsão minúsculo, breu quase
 * total, água por toda parte. NÃO é spot de farm — é arrepio (1º sussurro da
 * Contaminação por baixo). Só se chega pelo mergulho do A2. ✏️ GHOUL (T3, undead)
 * agora no bestiário — substitui o esqueleto-placeholder. Escada de volta
 * provisória (o gate por CORDA do §3 entra quando a ferramenta existir).
 */
function buildSewerA3(): FloorLayer {
  const { t, lset, room } = floorPainter(A3_W, A3_H);
  const wx = (lx: number) => A3_OX + lx, wy = (ly: number) => A3_OY + ly;

  room(4, 4, 23, 11, TileId.SewerFloor); // a câmara afogada
  // lâmina d'água cobrindo o chão (rasa, vadeável) + uma poça funda ao fundo
  for (let lx = 5; lx <= 22; lx++) for (let ly = 5; ly <= 10; ly++) if ((lx + ly) % 3 === 0) lset(lx, ly, TileId.Sewage);
  room(18, 8, 22, 10, TileId.DeepWater);
  lset(12, 8, TileId.SewerFloor); // landing seco do mergulho (world 140,158)

  const decor: MapDecor[] = [];
  const lights: MapLight[] = [];
  // uma única tocha mortiça — o resto é breu (custo de fuga = medo)
  decor.push({ x: wx(6), y: wy(5), kind: "torch" });
  lights.push({ x: wx(6), y: wy(5), color: 0x8fb0c0, radius: 4, intensity: 0.55, flicker: true });

  return {
    z: -3, ox: A3_OX, oy: A3_OY, width: A3_W, height: A3_H,
    tiles: t, lights, decor,
    monsters: [
      { x: wx(16), y: wy(7), species: "ghoul" }, // T3 undead — fundo do Porão Afogado
      { x: wx(8), y: wy(6), species: "ghoul" },
    ],
    portals: [
      // volta provisória pro A2 (no fim do bolsão) — vira gate de CORDA depois
      { x: wx(12), y: wy(8), kind: "stairs", to: { x: A2_OX + 19, y: A2_OY + 37, z: -2 } },
    ],
    openings: [],
    // Q15 (O Porão Afogado): ENTRAR no A3 É a descoberta (region_enter). A região
    // cobre a câmara afogada (room(4,4,23,11)). Sem interactable/NPC: a quest fecha
    // no registro do diário (ver q15_porao.ts). Os ghouls já vivem aqui (arrepio).
    questRegions: [
      { id: "porao_afogado_a3", z: -3, rect: { x: wx(4), y: wy(4), w: 20, h: 8 } }, // [132..151]×[154..161]
    ],
    ambient: 0x04060a, // o mais escuro: breu do fundo
  };
}

/** As 5 BOCAS na superfície (z=0): `hole` = clica pra descer DIRETO embaixo pro A1
 *  (mesma coluna). Marcador = grade de ferro (WorldRenderer.buildPortalMarkers). */
const ALVORADA_PORTALS: MapPortal[] = (
  [
    [115, 93], // Capela
    [144, 100], // Guilda
    [138, 113], // Depot
    [136, 118], // Praça (Q1)
    [150, 120], // Cais
  ] as const
).map(([x, y]) => ({ x, y, kind: "hole", to: { x, y, z: -1 } }));

// ─────────────────────────── helpers de pintura ───────────────────────────

/**
 * Pinta um traço ao longo de uma polilinha com raio dado (em tiles).
 * Com `overLandOnly` (estradas), só pinta por cima de terreno raso
 * (capim/terra/pântano/árvore) — água e muros ficam pras travessias/portões.
 */
function carvePolyline(
  set: (x: number, y: number, t: TileId) => void,
  points: [number, number][],
  radius: number,
  tile: TileId,
  rng: () => number,
  overLandOnly?: (x: number, y: number) => TileId,
): void {
  const LAND = new Set([TileId.Grass, TileId.Dirt, TileId.Swamp, TileId.Tree]);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 2;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = ax + (bx - ax) * t + (rng() - 0.5) * 1.2;
      const cy = ay + (by - ay) * t + (rng() - 0.5) * 1.2;
      const r = radius + (rng() - 0.5) * 0.8;
      for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
        for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const x = Math.round(cx + dx);
          const y = Math.round(cy + dy);
          if (overLandOnly && !LAND.has(overLandOnly(x, y))) continue;
          set(x, y, tile);
        }
      }
    }
  }
}

function fillRect(
  set: (x: number, y: number, t: TileId) => void,
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  tile: TileId,
): void {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, tile);
}

/** Trilha estreita de terra: abre passagem por capim/árvore/pedra/pântano. */
function carveTrail(
  set: (x: number, y: number, t: TileId) => void,
  get: (x: number, y: number) => TileId,
  points: [number, number][],
): void {
  const OPEN = new Set([TileId.Grass, TileId.Tree, TileId.Rock, TileId.Swamp, TileId.Dirt]);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / steps);
      const y = Math.round(ay + ((by - ay) * s) / steps);
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
      ] as const) {
        if (OPEN.has(get(x + dx, y + dy))) set(x + dx, y + dy, TileId.Dirt);
      }
    }
  }
}

/** Anel orgânico de rochas em volta de um ponto (bocas de gruta/caverna/mina). */
function ringRocks(
  set: (x: number, y: number, t: TileId) => void,
  get: (x: number, y: number) => TileId,
  cx: number,
  cy: number,
  r: number,
  density: number,
  rng: () => number,
): void {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < r - 1.5 || d > r + 0.5) continue;
      if (rng() < density && get(cx + dx, cy + dy) === TileId.Grass) set(cx + dx, cy + dy, TileId.Rock);
    }
  }
}
