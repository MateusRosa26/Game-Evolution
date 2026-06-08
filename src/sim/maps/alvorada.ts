import { TileId, type FloorLayer, type MapData, type MapDecor, type MapLight, type MapMonster, type MapPortal, type MapRect } from "../../shared/types";
import { CREATURES } from "../bestiary";
import { mulberry32 } from "../rng";

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
type Building = { name: string; rect: [number, number, number, number]; door: [number, number] };
const BUILDINGS: Building[] = [
  { name: "Estalagem do Vau (Bartolo/Bento — Q1/Q6)", rect: [16, 37, 24, 42], door: [20, 42] },
  { name: "Loja Geral (Nina — Q2)", rect: [21, 34, 27, 38], door: [24, 38] },
  { name: "Boticário (Silas — Q3)", rect: [28, 34, 34, 38], door: [31, 38] },
  { name: "Ferreiro (Duarte — Q4/Q9)", rect: [16, 24, 24, 28], door: [20, 28] },
  { name: "Depot (banco/armazém)", rect: [35, 27, 42, 32], door: [38, 32] },
  { name: "Câmara (Augusto)", rect: [42, 42, 50, 46], door: [46, 46] },
  { name: "Quartel da Guarda (Capitão Vidal — Q5/Q8)", rect: [3, 31, 12, 36], door: [8, 36] },
  { name: "Capela do Coveiro (Abel — Q10)", rect: [12, 8, 18, 12], door: [15, 12] },
  { name: "Templo (Gabriel — R4)", rect: [16, 9, 26, 14], door: [20, 14] },
  { name: "Torre Arcana (Leonor — R2)", rect: [27, 13, 33, 18], door: [30, 18] },
  { name: "Guilda dos Guerreiros (Ricardo — R1)", rect: [40, 12, 50, 18], door: [44, 18] },
  { name: "Taverna do Cais (Tobias/Telmo — Q12/Q9)", rect: [46, 25, 54, 30], door: [50, 30] },
  { name: "Armazéns (Cais)", rect: [46, 42, 55, 46], door: [50, 46] },
  { name: "Casa inicial (Rosa — nascimento)", rect: [25, 41, 31, 46], door: [28, 46] },
];
// DESVIO: Capela [12..18] e Templo [16..26] do GRID colidiam; Capela encolhida
// 1 tile a oeste mantendo a porta canônica (15,12). Templo porta (20,14) exata.

// ── §5: spots de caça — espécies do GRID; spawns só acendem se a espécie
// existir no bestiário (hoje: só rato_lanhoso). O resto entra com o bestiário.
type Spot = { id: string; rect: [number, number, number, number]; spawns: [number, number, string][] };
const SPOTS: Spot[] = [
  {
    // PLACEHOLDER da Q1 até o mapa do PORÃO (multi-mapa) existir: ratos logo
    // fora do portão sul (fora da safe zone), ao alcance do Bartolo. ✏️ remover
    // quando o porão entrar — os ratos passam a viver lá dentro.
    id: "Porao (placeholder Q1 — fora do portao S)",
    rect: [114, 139, 126, 147],
    spawns: [
      [118, 141, "rato_lanhoso"],
      [121, 141, "rato_lanhoso"],
      [116, 143, "rato_lanhoso"],
      [123, 143, "rato_lanhoso"],
      [119, 145, "rato_lanhoso"],
      [122, 145, "rato_lanhoso"],
      [117, 146, "rato_lanhoso"],
      [124, 146, "rato_lanhoso"],
    ],
  },
  {
    id: "S1 Planícies (T1)",
    rect: [10, 60, 70, 200],
    spawns: [
      [30, 95, "rato_lanhoso"],
      [24, 120, "rato_lanhoso"],
      [40, 140, "rato_lanhoso"],
      [55, 110, "rato_lanhoso"],
      [35, 170, "rato_lanhoso"],
      [60, 185, "rato_lanhoso"],
      [20, 150, "lobo_cinzento"],
      [50, 80, "lobo_cinzento"],
      [65, 160, "lobo_cinzento"],
    ],
  },
  {
    id: "S2 Granja (T1 — Q2)",
    rect: [20, 80, 55, 100],
    spawns: [
      // pontos no terreiro/arredores — NUNCA em cima dos muros dos celeiros
      [31, 92, "rato_lanhoso"],
      [36, 93, "rato_lanhoso"],
      [43, 94, "rato_lanhoso"],
      [48, 89, "rato_lanhoso"],
      [38, 97, "rato_lanhoso"],
    ],
  },
  {
    id: "S3 Gruta dos Morcegos (T1 — Q3)",
    rect: [125, 48, 150, 68],
    spawns: [
      [132, 55, "morcego_sanguessuga"],
      [138, 60, "morcego_sanguessuga"],
      [143, 53, "morcego_sanguessuga"],
      [135, 64, "morcego_sanguessuga"],
      [146, 62, "morcego_sanguessuga"],
      [129, 60, "morcego_sanguessuga"],
    ],
  },
  {
    id: "S4 Toca dos Lobos (T1 — Q5/Q6)",
    rect: [172, 55, 200, 80],
    spawns: [
      [180, 62, "lobo_cinzento"],
      [188, 68, "lobo_cinzento"],
      [194, 60, "lobo_cinzento"],
      [177, 73, "lobo_cinzento"],
      [191, 76, "lobo_cinzento"],
      [185, 58, "lobo_cinzento"],
    ],
  },
  {
    id: "S5 Acampamento Goblin (T1 — Q8a2)",
    rect: [185, 35, 230, 70],
    spawns: [
      [195, 42, "goblin_batedor"],
      [205, 38, "goblin_batedor"],
      [215, 45, "goblin_batedor"],
      [222, 40, "goblin_batedor"],
      [200, 55, "goblin_batedor"],
      [212, 60, "goblin_batedor"],
      [225, 52, "goblin_batedor"],
      [192, 63, "goblin_batedor"],
    ],
  },
  {
    id: "S7 Ninho de Aranhas (T2 — sem trilha)",
    rect: [260, 60, 300, 90],
    spawns: [
      [268, 68, "aranha_das_cavernas"],
      [278, 75, "aranha_das_cavernas"],
      [288, 70, "aranha_das_cavernas"],
      [272, 84, "aranha_das_cavernas"],
      [292, 82, "aranha_das_cavernas"],
    ],
  },
  {
    id: "S9 Juncal dos Fundeiros (T1→T2 — Q14)",
    rect: [175, 150, 205, 185],
    spawns: [
      [198, 155, "goblin_fundeiro"],
      [201, 165, "goblin_fundeiro"],
      [197, 175, "goblin_fundeiro"],
      [202, 180, "goblin_fundeiro"],
      [180, 153, "goblin_fundeiro"],
      [178, 170, "goblin_fundeiro"],
    ],
  },
  {
    id: "S10 Matagal dos Javalis (T2 — Q6/Q7, named Presa-Torta ✏️)",
    rect: [235, 230, 275, 270],
    spawns: [
      [242, 238, "javali_de_presas"],
      [252, 245, "javali_de_presas"],
      [263, 240, "javali_de_presas"],
      [248, 258, "javali_de_presas"],
      [260, 263, "javali_de_presas"],
      [270, 252, "javali_de_presas"],
    ],
  },
  {
    id: "S11 Bandidos da Ponte (T2 — Q9/Q11)",
    rect: [150, 260, 185, 290],
    spawns: [
      [155, 266, "bandido_da_estrada"],
      [160, 275, "bandido_da_estrada"],
      [156, 284, "bandido_da_estrada"],
      [175, 280, "bandido_da_estrada"],
      [180, 268, "bandido_da_estrada"],
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
  for (let y = 0; y < 130; y++) {
    for (let x = 165; x < W; x++) {
      // densidade cresce pro NE profundo (longe da cidade)
      const depth = Math.min(1, (x - 165) / 120 + (60 - Math.min(y, 60)) / 120);
      if (rng() < 0.06 + depth * 0.3) treeAt(x, y);
    }
  }
  // Bordas: paliçada natural de árvores (3 tiles), exceto onde estrada sai.
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const e = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (e < 3 && rng() < (e === 0 ? 1 : e === 1 ? 0.7 : 0.35)) treeAt(x, y);
    }
  }
  // Planícies O: capim aberto com árvores raras + pedras
  for (let y = 40; y < 300; y++) {
    for (let x = 4; x < 100; x++) {
      const r = rng();
      if (r < 0.012) treeAt(x, y);
      else if (r < 0.016 && get(x, y) === TileId.Grass) set(x, y, TileId.Rock);
    }
  }
  // Mata leve no sul (entre cidade e pântano) + Matagal dos Javalis mais denso
  for (let y = 200; y < 306; y++) {
    for (let x = 100; x < 328; x++) {
      if (rng() < 0.05) treeAt(x, y);
    }
  }
  for (let y = 230; y <= 270; y++) {
    for (let x = 235; x <= 275; x++) {
      if (rng() < 0.1) treeAt(x, y); // S10: bosque fechado de javali
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
  // Bueiro da Praça (E01, Q1 aponta): marcado como pedra escura ✏️ vira escada
  // de esgoto quando A1 existir (mapa separado, próximo milestone)
  set(...city(36, 38), TileId.StoneFloor);

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

  // Edifícios (§3.3)
  for (const b of BUILDINGS) {
    const [cx0, cy0, cx1, cy1] = b.rect;
    const [x0, y0] = city(cx0, cy0);
    const [x1, y1] = city(cx1, cy1);
    fillRect(set, [x0, y0], [x1, y1], TileId.StoneFloor);
    for (let x = x0; x <= x1; x++) {
      set(x, y0, TileId.Wall);
      set(x, y1, TileId.Wall);
    }
    for (let y = y0; y <= y1; y++) {
      set(x0, y, TileId.Wall);
      set(x1, y, TileId.Wall);
    }
    const [dx, dy] = city(...b.door);
    set(dx, dy, TileId.StoneFloor); // porta = vão no muro
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
    set(x, 246, TileId.Wall);
    set(x, 254, TileId.Wall);
  }
  for (let y = 246; y <= 254; y++) {
    set(56, y, TileId.Wall);
    set(64, y, TileId.Wall);
  }
  set(60, 254, TileId.StoneFloor); // porta S
  torch(60, 256);
  // Granja (S2/P11): dois celeiros + terreiro
  for (const [bx0, by0, bx1, by1, doorX] of [
    [28, 84, 34, 89, 31],
    [40, 86, 46, 91, 43],
  ] as const) {
    fillRect(set, [bx0, by0], [bx1, by1], TileId.StoneFloor);
    for (let x = bx0; x <= bx1; x++) {
      set(x, by0, TileId.Wall);
      set(x, by1, TileId.Wall);
    }
    for (let y = by0; y <= by1; y++) {
      set(bx0, y, TileId.Wall);
      set(bx1, y, TileId.Wall);
    }
    set(doorX, by1, TileId.StoneFloor);
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

  // NPCs da fatia (elenco NPCS.md — só os necessários pra quest implementada).
  // Bartolo: Estalagem do Vau, atrás do balcão — city(20,39) → local (120,119).
  const npcSpawns = [{ npcId: "bartolo", name: "Bartolo", x: 120, y: 119 }];

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
    spawn,
    npcSpawns,
    portals: ALVORADA_PORTALS,
    floors: [buildSewerA1()],
  };
}

// ─────────────────────────── esgotos (z-levels) ───────────────────────────

/**
 * Esgoto A1 (z=-1) — PRIMEIRO CORTE da Fase 1 de andares (SISTEMA-ANDARES).
 * Galeria de pedra úmida sob a cidade: câmara com canal de água servida (rasa,
 * vadeável), poça funda (hazard impassável), pilar de alvenaria antiga
 * (mistério do A2 antecipado) e a escada de volta à grelha da praça. Ratos T1.
 * ✏️ layout de primeiro corte — refinar com GRID §7 (5 bocas, A2/A3, baú lacrado).
 */
const A1_OX = 112, A1_OY = 94, A1_W = 40, A1_H = 36;
function buildSewerA1(): FloorLayer {
  const t: TileId[] = new Array(A1_W * A1_H).fill(TileId.SewerWall);
  const lset = (lx: number, ly: number, tile: TileId) => {
    if (lx >= 0 && ly >= 0 && lx < A1_W && ly < A1_H) t[ly * A1_W + lx] = tile;
  };
  // câmara: chão de esgoto com borda de 2 tiles de parede
  for (let ly = 2; ly < A1_H - 2; ly++) for (let lx = 2; lx < A1_W - 2; lx++) lset(lx, ly, TileId.SewerFloor);
  // canal de água servida (rasa, vadeável) cruzando o meio
  for (let lx = 2; lx < A1_W - 2; lx++) { lset(lx, 17, TileId.Sewage); lset(lx, 18, TileId.Sewage); }
  // poça funda (impassável — custo de fuga / arrepio)
  for (let ly = 24; ly <= 27; ly++) for (let lx = 28; lx <= 31; lx++) lset(lx, ly, TileId.DeepWater);
  // pilares de alvenaria antiga (telegrafa o A2)
  lset(8, 8, TileId.OldMasonryWall); lset(9, 8, TileId.OldMasonryWall); lset(30, 30, TileId.OldMasonryWall);
  const wx = (lx: number) => A1_OX + lx, wy = (ly: number) => A1_OY + ly;
  return {
    z: -1, ox: A1_OX, oy: A1_OY, width: A1_W, height: A1_H,
    tiles: t,
    lights: [], decor: [],
    monsters: [
      { x: wx(12), y: wy(8), species: "rato_lanhoso" },
      { x: wx(26), y: wy(10), species: "rato_lanhoso" },
      { x: wx(14), y: wy(28), species: "rato_lanhoso" },
    ],
    // escada de volta: pisar em (130,110) sobe pra grelha da praça (138,118)
    portals: [{ x: wx(18), y: wy(16), kind: "stairs", to: { x: 138, y: 118, z: 0 } }],
    openings: [],
    ambient: 0x0a0e14, // breu do subsolo
  };
}

/** Grelha de esgoto na praça (z=0) → desce pro A1. 1ª das 5 bocas (✏️ +4). */
const ALVORADA_PORTALS: MapPortal[] = [{ x: 138, y: 118, kind: "cave", to: { x: 130, y: 110, z: -1 } }];

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
