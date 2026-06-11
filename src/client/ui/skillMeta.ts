/**
 * Metadados de APRESENTAÇÃO das skills (client). O snapshot só carrega
 * `id`, `cooldownMs` e `manaCost` (ver `KnownSkillState`) — aqui ficam nome
 * pt-BR, cor e glifo procedural para a barra/projétil, além da semântica de
 * alvo usada APENAS para preencher `targetId` no comando (a sim valida tudo).
 *
 * NENHUMA regra de jogo: não há mana/cooldown/alcance aqui. Se um id não for
 * conhecido (skill nova na sim), há um fallback genérico.
 */

import type { DamageType } from "../../shared/types";

export type SkillTargetMode =
  /** Precisa do alvo selecionado (ofensivas). */
  | "enemy"
  /** Cura sem alvo = self (omite targetId). */
  | "self"
  /** Skillshot: mira um TILE no chão (groundTarget) — manda `aim` em vez de `targetId`. */
  | "ground"
  /** Burst centrado no caster (selfRadius ofensivo) — sem alvo nem aim. */
  | "selfBurst";

export interface SkillMeta {
  /** Nome exibível (pt-BR). */
  name: string;
  /** Glifo curto desenhado no slot (inicial/símbolo). */
  glyph: string;
  /** Cor base do slot e do projétil (0xRRGGBB). */
  color: number;
  /** Como o client decide o `targetId` ao enviar `useSkill`. */
  target: SkillTargetMode;
  /**
   * Tipo de dano da skill — só APRESENTAÇÃO (cor do floating number + partícula
   * de impacto). Espelha o `damageType` da definição na sim (que NÃO viaja no
   * snapshot do evento `damage`): o client correlaciona o `cast` do mesmo tick
   * pra colorir o golpe. `undefined` em skills de cura. A sim é a autoridade.
   */
  damageType?: DamageType;
  /**
   * Raio de área (em tiles, Chebyshev) — só APRESENTAÇÃO: dimensiona o telegraph
   * de chão (groundTarget) e o burst de área (selfRadius/groundTarget). Espelha o
   * `areaRadius` da definição na sim (que não viaja no snapshot). Ausente = sem área
   * (alvo único / projétil). A sim é a autoridade do efeito.
   */
  areaRadius?: number;
}

/** Tabela id → apresentação. Espelha as 6 skills do kit M1 (só visual). */
export const SKILL_META: Record<string, SkillMeta> = {
  golpe_forte: { name: "Golpe Forte", glyph: "GF", color: 0xc9c2b0, target: "enemy", damageType: "physical" },
  bola_de_fogo: { name: "Bola de Fogo", glyph: "BF", color: 0xff7a32, target: "enemy", damageType: "fire" },
  lanca_de_gelo: { name: "Lança de Gelo", glyph: "LG", color: 0x6fc8e8, target: "enemy", damageType: "ice" },
  apunhalar: { name: "Apunhalar", glyph: "AP", color: 0xb86fd0, target: "enemy", damageType: "physical" },
  luz_sagrada: { name: "Luz Sagrada", glyph: "LS", color: 0xf2e08a, target: "enemy", damageType: "holy" },
  curar_ferimentos: { name: "Curar Ferimentos", glyph: "CF", color: 0x5fc86a, target: "self" },
  // ── Kit T2+ (groundTarget skillshot · selfRadius burst · chain · lifedrain) ──
  // areaRadius espelha src/sim/skills/numbers.ts (só p/ telegraph/burst visual).
  earthen_grasp: { name: "Garras da Terra", glyph: "GT", color: 0x9b7b44, target: "ground", damageType: "earth", areaRadius: 1 },
  storm: { name: "Tempestade", glyph: "TP", color: 0xeae27a, target: "ground", damageType: "lightning", areaRadius: 1 },
  whirlwind: { name: "Redemoinho", glyph: "RD", color: 0xc9c2b0, target: "selfBurst", damageType: "physical", areaRadius: 1 },
  sacred_aura: { name: "Aura Sagrada", glyph: "AS", color: 0xffd86a, target: "self", areaRadius: 2 },
  sparks: { name: "Fagulhas", glyph: "FG", color: 0xf0e98a, target: "enemy", damageType: "lightning" },
  life_drain: { name: "Dreno Vital", glyph: "DV", color: 0x9a6ad8, target: "enemy", damageType: "death" },
};

/** Fallback quando um id não está na tabela (skill nova/desconhecida). */
export function skillMeta(id: string): SkillMeta {
  return (
    SKILL_META[id] ?? {
      name: id,
      glyph: id.slice(0, 2).toUpperCase(),
      color: 0x9aa0b0,
      target: "enemy",
    }
  );
}

/** Ordem estável das skills do kit M1 — usada pelo DEV helper (F9). */
export const ALL_SKILL_IDS = [
  "golpe_forte",
  "bola_de_fogo",
  "lanca_de_gelo",
  "apunhalar",
  "luz_sagrada",
  "curar_ferimentos",
] as const;

/**
 * Kit T2+ (groundTarget/selfRadius/chain/lifedrain) — usado pelo DEV helper (F10)
 * para exercitar as skills novas no client (skillshot, burst, cadeia, dreno).
 */
export const T2_SKILL_IDS = [
  "earthen_grasp",
  "storm",
  "whirlwind",
  "sacred_aura",
  "sparks",
  "life_drain",
] as const;
