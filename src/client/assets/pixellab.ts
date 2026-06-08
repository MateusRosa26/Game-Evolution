/**
 * Assets PixelLab (IA + curadoria do criador) — decisão jun/2026: a pixel art
 * de chars/mobs/cenário migra do procedural para PNGs gerados via PixelLab e
 * aprovados na pasta de candidatos. Os PNGs aprovados vivem em `img/` (o
 * .gitignore tem exceção para PNGs dentro de src) e são carregados aqui.
 *
 * Knight: REBOOT jun/2026 — pipeline canônico dos mobs (referência limpa →
 * 8 rotações v3 → walk por template por direção → snap de paleta → QA por
 * frame). Frames em img/chars/knight/walk via glob; ausência = fallback
 * procedural. Oeste = flip de leste.
 */
import { Assets, Texture } from "pixi.js";
import type { Facing } from "../../shared/types";
import tree1Url from "./img/scenery/tree1.png";
import tree2Url from "./img/scenery/tree2.png";

/** Norma de densidade jun/2026: chars exibidos 1:1 (1 px do sprite = 1 px do mundo). */
export const PIXELLAB_CHAR_SCALE = 1.0;

/** Registry preenchido por loadPixellabAssets() antes do Game nascer. */
export const PIXELLAB: {
  /** Árvores do bioma ATUAL (1 tipo por bioma — coerência). */
  trees: Texture[];
  /** Reserva p/ bioma de pântano (a variação com musgo escorrendo). */
  swampTrees: Texture[];
  /**
   * CORPOS por classe/set (receita canônica jun/2026): img/chars/<set>/walk/
   * <dir><frame>.png em S/E/N (W = flip). O client escolhe o corpo pelo SET
   * do outfit da sim (janela O troca classe visual inteira).
   */
  charBodies: Record<string, Record<Facing, Texture[]>>;
  /** Corpo padrão (primeiro disponível; knight quando existir). */
  knight: Record<Facing, Texture[]> | null;
  /**
   * MOBS por espécie (norma de densidade jun/2026): canvas 64×64 exibido 1:1,
   * figura no tamanho natural da criatura. 4 direções × 4 frames de walk
   * (frame 0 = idle aproximado), carregados de img/mobs/<species>/<dir><i>.png.
   */
  mobs: Record<string, Record<Facing, Texture[]>>;
  /**
   * Animações de ATAQUE por espécie (decisão jun/2026, flavor estilo Apogea):
   * img/mobs/<species>/atk_<dir><i>.png. Tocadas pelo client quando o evento
   * `damage` aponta a entidade como atacante (one-shot, ~380ms).
   */
  mobAttacks: Record<string, Record<Facing, Texture[]>>;
  /**
   * Deslocamento (px, +pra baixo) que GROUNDEIA cada espécie: o frame 64×64
   * costuma ter padding transparente embaixo, então a criatura "flutuava" acima
   * do tile. Medido no load (padding inferior do frame sul idle) e aplicado pelo
   * EntityRenderer — apoia os pés na base do tile, igual ao char.
   */
  mobBaseline: Record<string, number>;
  /** Ataque do CHAR (golpe de espada) — img/chars/knight/attack/<dir><i>.png. */
  knightAttack: Record<Facing, Texture[]> | null;
  /**
   * PEÇAS do paper-doll (jun/2026): cada peça de outfit é uma CAMADA extraída
   * por /inpaint — img/chars/knight/pieces/<peca>/<dir><i>.png. Compostas e
   * tintadas por slot em outfit/paperdoll.ts. W = flip de E (no carregamento).
   */
  knightPieces: Record<string, Record<Facing, Texture[]>>;
  /** Peças sobre os frames de ATAQUE (atk_<dir><i>.png) — golpe vestido. */
  knightPiecesAtk: Record<string, Record<Facing, Texture[]>>;
  /**
   * TILESETS Wang por par de terreno (chão com transição, jun/2026):
   * wang[par][cornerCode] onde cornerCode = "NWNESWSE" (0=lower, 1=upper).
   * O dual-grid no WorldRenderer escolhe a tile pelos 4 cantos.
   */
  wang: Record<string, Record<string, Texture>>;
} = {
  trees: [],
  swampTrees: [],
  charBodies: {},
  knight: null,
  mobs: {},
  mobAttacks: {},
  mobBaseline: {},
  knightAttack: null,
  knightPieces: {},
  knightPiecesAtk: {},
  wang: {},
};

/** Espécies que voam: o client desenha levemente acima do chão (charme barato). */
export const FLYING_SPECIES = new Set(["morcego_sanguessuga"]);

// Frames de mob descobertos no build (pasta por espécie — padrão do projeto).
const MOB_FRAME_URLS = import.meta.glob("./img/mobs/*/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// Peças do paper-doll e ataque do char (descobertos no build).
const PIECE_FRAME_URLS = import.meta.glob("./img/chars/knight/pieces/*/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
const KNIGHT_ATTACK_URLS = import.meta.glob("./img/chars/knight/attack/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;
// Wang tilesets (chão com transição) — img/tiles/<par>/wang-NWNESWSE.png
const WANG_URLS = import.meta.glob("./img/tiles/*/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Flip horizontal de uma textura (oeste = espelho de leste). */
function flipped(tex: Texture): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = tex.width;
  canvas.height = tex.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(tex.source.resource as CanvasImageSource, 0, 0);
  return Texture.from(canvas);
}

// Walk dos corpos por classe — glob, ausência = fallback procedural.
const CHAR_WALK_URLS = import.meta.glob("./img/chars/*/walk/*.png", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/**
 * Conta as linhas TRANSPARENTES na base do frame (alpha≈0) — o "pé flutuante"
 * do sprite gerado. Lê 1× no load via canvas; se falhar (textura sem resource),
 * devolve 0 (sem correção, comportamento antigo).
 */
function bottomPadOf(tex: Texture): number {
  try {
    const src = tex.source.resource as CanvasImageSource;
    const w = tex.width | 0;
    const h = tex.height | 0;
    if (!w || !h) return 0;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(src, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    for (let y = h - 1; y >= 0; y--) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 16) return h - 1 - y;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

export async function loadPixellabAssets(): Promise<void> {
  const [t1, t2] = await Promise.all([
    Assets.load<Texture>(tree1Url),
    Assets.load<Texture>(tree2Url),
  ]);
  PIXELLAB.trees = [t1];
  PIXELLAB.swampTrees = [t2];

  // Corpos por classe: img/chars/<set>/walk/<dir><frame>.png (W = flip de E)
  const bySet = new Map<string, { dir: string; frame: number; url: string }[]>();
  for (const [path, url] of Object.entries(CHAR_WALK_URLS)) {
    const mw = path.match(/chars\/([^/]+)\/walk\/([sen])(\d+)\.png$/);
    if (!mw) continue;
    const list = bySet.get(mw[1]) ?? [];
    list.push({ dir: mw[2], frame: Number(mw[3]), url });
    bySet.set(mw[1], list);
  }
  for (const [set, frames] of bySet) {
    const dirs: Record<Facing, Texture[]> = { s: [], e: [], n: [], w: [] };
    frames.sort((a, b) => a.frame - b.frame);
    const texes = await Promise.all(frames.map((f) => Assets.load<Texture>(f.url)));
    frames.forEach((f, i) => dirs[f.dir as Facing].push(texes[i]));
    dirs.w = dirs.e.map(flipped);
    if (dirs.s.length && dirs.e.length && dirs.n.length) PIXELLAB.charBodies[set] = dirs;
  }
  PIXELLAB.knight = PIXELLAB.charBodies["knight"] ?? Object.values(PIXELLAB.charBodies)[0] ?? null;

  // Mobs: img/mobs/<species>/[atk_]<dir><frame>.png → Record<Facing, Texture[]>
  const bySpecies = new Map<string, { atk: boolean; dir: string; frame: number; url: string }[]>();
  for (const [path, url] of Object.entries(MOB_FRAME_URLS)) {
    const m2 = path.match(/img\/mobs\/([^/]+)\/(atk_)?([senw])(\d+)\.png$/);
    if (!m2) continue;
    const list = bySpecies.get(m2[1]) ?? [];
    list.push({ atk: !!m2[2], dir: m2[3], frame: Number(m2[4]), url });
    bySpecies.set(m2[1], list);
  }
  for (const [species, frames] of bySpecies) {
    const walk: Record<Facing, Texture[]> = { s: [], e: [], n: [], w: [] };
    const attack: Record<Facing, Texture[]> = { s: [], e: [], n: [], w: [] };
    frames.sort((a, b) => a.frame - b.frame);
    // carga em paralelo — em série são 100+ awaits e o load do jogo arrasta
    const texes = await Promise.all(frames.map((f) => Assets.load<Texture>(f.url)));
    frames.forEach((f, i) => {
      (f.atk ? attack : walk)[f.dir as Facing].push(texes[i]);
    });
    // espécie só entra completa (4 direções com frames) — senão fica no fallback
    if (walk.s.length && walk.e.length && walk.n.length && walk.w.length) {
      PIXELLAB.mobs[species] = walk;
      // grounding: mede o padding transparente embaixo do frame sul idle e guarda
      // o offset (o EntityRenderer empurra o sprite pra baixo nesse tanto).
      PIXELLAB.mobBaseline[species] = bottomPadOf(walk.s[0]);
    }
    if (attack.s.length && attack.e.length && attack.n.length && attack.w.length) {
      PIXELLAB.mobAttacks[species] = attack;
    }
  }

  // Peças do paper-doll: img/chars/knight/pieces/<peca>/[atk_]<dir><frame>.png (W = flip de E)
  const byPiece = new Map<string, { atk: boolean; dir: string; frame: number; url: string }[]>();
  for (const [path, url] of Object.entries(PIECE_FRAME_URLS)) {
    const m3 = path.match(/pieces\/([^/]+)\/(atk_)?([sen])(\d+)\.png$/);
    if (!m3) continue;
    const list = byPiece.get(m3[1]) ?? [];
    list.push({ atk: !!m3[2], dir: m3[3], frame: Number(m3[4]), url });
    byPiece.set(m3[1], list);
  }
  for (const [piece, frames] of byPiece) {
    const walkD: Record<Facing, Texture[]> = { s: [], e: [], n: [], w: [] };
    const atkD: Record<Facing, Texture[]> = { s: [], e: [], n: [], w: [] };
    frames.sort((a, b) => a.frame - b.frame);
    const texes = await Promise.all(frames.map((f) => Assets.load<Texture>(f.url)));
    frames.forEach((f, i) => (f.atk ? atkD : walkD)[f.dir as Facing].push(texes[i]));
    walkD.w = walkD.e.map(flipped);
    atkD.w = atkD.e.map(flipped);
    if (walkD.s.length && walkD.e.length && walkD.n.length) PIXELLAB.knightPieces[piece] = walkD;
    if (atkD.s.length && atkD.e.length && atkD.n.length) PIXELLAB.knightPiecesAtk[piece] = atkD;
  }

  // Ataque do char: img/chars/knight/attack/<dir><frame>.png (W = flip de E)
  const atkFrames: { dir: string; frame: number; url: string }[] = [];
  for (const [path, url] of Object.entries(KNIGHT_ATTACK_URLS)) {
    const m4 = path.match(/attack\/([sen])(\d+)\.png$/);
    if (m4) atkFrames.push({ dir: m4[1], frame: Number(m4[2]), url });
  }
  if (atkFrames.length) {
    const dirs: Record<Facing, Texture[]> = { s: [], e: [], n: [], w: [] };
    atkFrames.sort((a, b) => a.frame - b.frame);
    const texes = await Promise.all(atkFrames.map((f) => Assets.load<Texture>(f.url)));
    atkFrames.forEach((f, i) => dirs[f.dir as Facing].push(texes[i]));
    dirs.w = dirs.e.map(flipped);
    if (dirs.s.length && dirs.e.length && dirs.n.length) PIXELLAB.knightAttack = dirs;
  }

  // Wang tilesets: img/tiles/<par>/wang-<code>.png
  const wangByPair = new Map<string, { code: string; url: string }[]>();
  for (const [path, url] of Object.entries(WANG_URLS)) {
    const mw2 = path.match(/tiles\/([^/]+)\/wang-([01]{4})\.png$/);
    if (!mw2) continue;
    const list = wangByPair.get(mw2[1]) ?? [];
    list.push({ code: mw2[2], url });
    wangByPair.set(mw2[1], list);
  }
  for (const [pair, entries] of wangByPair) {
    const set: Record<string, Texture> = {};
    const texes = await Promise.all(entries.map((e) => Assets.load<Texture>(e.url)));
    entries.forEach((e, i) => (set[e.code] = texes[i]));
    PIXELLAB.wang[pair] = set;
  }
}
