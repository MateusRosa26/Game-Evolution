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
  | "self";

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
}

/** Tabela id → apresentação. Espelha as 6 skills do kit M1 (só visual). */
export const SKILL_META: Record<string, SkillMeta> = {
  golpe_forte: { name: "Golpe Forte", glyph: "GF", color: 0xc9c2b0, target: "enemy", damageType: "physical" },
  bola_de_fogo: { name: "Bola de Fogo", glyph: "BF", color: 0xff7a32, target: "enemy", damageType: "fire" },
  lanca_de_gelo: { name: "Lança de Gelo", glyph: "LG", color: 0x6fc8e8, target: "enemy", damageType: "ice" },
  apunhalar: { name: "Apunhalar", glyph: "AP", color: 0xb86fd0, target: "enemy", damageType: "physical" },
  luz_sagrada: { name: "Luz Sagrada", glyph: "LS", color: 0xf2e08a, target: "enemy", damageType: "holy" },
  curar_ferimentos: { name: "Curar Ferimentos", glyph: "CF", color: 0x5fc86a, target: "self" },
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
