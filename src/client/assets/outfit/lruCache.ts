/**
 * Cache LRU minúsculo para texturas COMPOSTAS de outfit (canvas → GPU).
 *
 * Por que existe: as combinações de peças×cores são um espaço aberto — um Map
 * sem teto guarda cada combinação já vista como texturas vivas para sempre
 * (vazamento de memória GPU). Com teto, a entrada menos recentemente usada é
 * evictada e suas texturas DESTRUÍDAS (libera o recurso GL, não só o JS).
 *
 * O teto é generoso de propósito: no M1 (single player) existem ~1–2
 * combinações simultâneas — a evicção é dormente. CAVEAT (online): destruir na
 * evicção pressupõe que nenhum sprite na tela ainda usa a textura; com mais
 * jogadores simultâneos que o teto seria preciso refcount — subir o teto e/ou
 * refcontar é a evolução natural quando o online chegar.
 */
import type { Texture } from "pixi.js";
import type { Facing } from "../../../shared/types";

/** Texturas de um outfit composto: frames por facing. */
type FacingTextures = Record<Facing, Texture[]>;

export class OutfitTextureLru {
  /** Map preserva ordem de inserção — re-inserir no get = recência LRU. */
  private map = new Map<string, FacingTextures>();

  constructor(private readonly maxEntries: number) {}

  /** Busca e refresca a recência da entrada. */
  get(key: string): FacingTextures | undefined {
    const hit = this.map.get(key);
    if (hit) {
      this.map.delete(key);
      this.map.set(key, hit);
    }
    return hit;
  }

  /** Insere; se estourar o teto, evicta a menos recente destruindo as texturas. */
  set(key: string, value: FacingTextures): void {
    if (this.map.size >= this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) {
        const evicted = this.map.get(oldest)!;
        this.map.delete(oldest);
        for (const frames of Object.values(evicted)) {
          for (const t of frames) t.destroy(true);
        }
      }
    }
    this.map.set(key, value);
  }
}
