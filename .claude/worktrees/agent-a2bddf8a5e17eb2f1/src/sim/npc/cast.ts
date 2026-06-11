/**
 * Elenco de NPCs — fonte única de verdade dos NPCs como DADOS (fatia ① —
 * `design/fatia-1-alvorada/NPCS.md`, batismo aprovado jun/2026).
 *
 * Cada NPC é um registro declarativo que AMARRA por `id` os subsistemas:
 *  - diálogo  → `DIALOGUES[id]`            (`sim/dialogue.ts`)
 *  - comércio → `COMMERCE[id]`             (`sim/npc/commerce.ts`)
 *  - quests   → `QUESTS` com `giverNpcId === id` (`sim/quests.ts`)
 *  - treino   → `trainsClass`              (treinadores de classe)
 *
 * `location` é o LABEL do POI (a posição no grid vem com o grid ⑥ — hoje só o
 * Bartolo tem spawn em `maps/alvorada.ts`). Este registro existe ANTES do grid
 * para que sortimentos e papéis já estejam definidos (direção do criador: criar
 * todos os NPCs previstos e suas sale lists primeiro). Comentários pt-BR.
 *
 * SIM only — dados puros. Nomes próprios = invariantes (iguais EN/PT — NPCS.md).
 */
import type { PlayerClass } from "../../shared/types";

/**
 * Papéis de NPC (SISTEMA-NPCS.md §"quatro papéis"). Misturam-se no MESMO NPC
 * (o ferreiro vende, treina e tem quest pessoal).
 */
export type NpcRole =
  | "merchant" // mercador — compra/vende (sortimento em COMMERCE)
  | "trainer" // treinador — vende skills do tier (gold + nível) ✏️ wave de treino
  | "quest_giver" // oferece/recebe quests
  | "whisperer" // sussurrador — solta rumores/hints (descoberta sem UI)
  | "guide"; // NPC-guia (tutorial diegético)

/** Definição declarativa de um NPC do elenco. */
export interface NpcDef {
  /** ID estável (chave de dados — liga diálogo/comércio/quests). */
  id: string;
  /** Nome exibível (invariante EN/PT). */
  name: string;
  /** Epíteto descritivo — TRADUZ no EN (ex.: "Gralha"/"the Jackdaw"). */
  epithet?: string;
  /** Ocupação (uma palavra/frase curta). */
  occupation: string;
  /** Label do POI onde mora (posição no grid vem depois). */
  location: string;
  roles: NpcRole[];
  /** Classe que treina — só em treinadores (âncoras dos ritos). */
  trainsClass?: PlayerClass;
}

/**
 * Elenco da fatia ① (NPCS.md). ~⅓ luso / ⅔ universal — piloto da regra de
 * nomes. Jonas (o moleiro sumido) é APENAS citado, nunca visto → fora do elenco
 * spawnável. Papéis marcados ✏️ no doc ficam conservadores aqui.
 */
export const NPC_CAST: Record<string, NpcDef> = {
  // ── Cluster de utilidade (hub) ──────────────────────────────────────────
  bartolo: {
    id: "bartolo",
    name: "Bartolo",
    occupation: "estalajadeiro",
    location: "Estalagem do Vau",
    roles: ["merchant", "quest_giver"],
  },
  bento: {
    id: "bento",
    name: "Bento",
    occupation: "cozinheiro",
    location: "Estalagem do Vau",
    roles: ["merchant", "quest_giver"],
  },
  nina: {
    id: "nina",
    name: "Nina",
    occupation: "lojista",
    location: "Loja Geral (Baixa)",
    roles: ["merchant", "quest_giver"],
  },
  silas: {
    id: "silas",
    name: "Silas",
    occupation: "boticário",
    location: "Loja de Poções (Baixa)",
    roles: ["merchant", "quest_giver"],
  },
  duarte: {
    id: "duarte",
    name: "Duarte",
    occupation: "ferreiro",
    location: "Baixa",
    roles: ["merchant", "quest_giver"], // treina Knights? ✏️ NPCS.md
  },

  // ── Espalhados pela cidade (valor nos cantos) ───────────────────────────
  vidal: {
    id: "vidal",
    name: "Capitão Vidal",
    occupation: "guarda-capitão",
    location: "Quartel da Guarda",
    roles: ["quest_giver", "merchant"], // bounty de orelhas pós-Q5
  },
  amaro: {
    id: "amaro",
    name: "Amaro",
    occupation: "caçador-peleteiro",
    location: "Cais",
    roles: ["merchant", "quest_giver"],
  },
  abel: {
    id: "abel",
    name: "Abel",
    occupation: "coveiro",
    location: "Capela (muralha N)",
    roles: ["quest_giver", "whisperer"],
  },
  tobias: {
    id: "tobias",
    name: "Tobias",
    occupation: "bêbado",
    location: "Taverna do Cais",
    roles: ["whisperer"], // amarração canônica: "o velho Tobias" do rumor-exemplo
  },
  telmo: {
    id: "telmo",
    name: "Telmo",
    occupation: "taverneiro",
    location: "Taverna do Cais",
    roles: ["merchant", "whisperer"],
  },
  hugo: {
    id: "hugo",
    name: "Hugo",
    occupation: "mineiro aposentado",
    location: "canto da Baixa",
    roles: ["whisperer"], // sussurrador puro — descoberta, não checklist
  },
  marco: {
    id: "marco",
    name: "Marco",
    occupation: "vigia",
    location: "Atalaia (estrada leste)",
    roles: ["whisperer"], // quest_giver? ✏️ NPCS.md
  },

  // ── Treinadores de classe (âncoras dos ritos) ───────────────────────────
  ricardo: {
    id: "ricardo",
    name: "Ricardo",
    occupation: "instrutor",
    location: "Guilda dos Guerreiros",
    roles: ["trainer", "quest_giver"],
    trainsClass: "knight",
  },
  leonor: {
    id: "leonor",
    name: "Leonor",
    occupation: "arcanista",
    location: "Torre Arcana",
    roles: ["trainer", "quest_giver"],
    trainsClass: "mage",
  },
  vincente: {
    id: "vincente",
    name: "Vincente",
    epithet: "Gralha", // the Jackdaw
    occupation: "ladino",
    location: "Beco dos Ladinos (Cais)",
    roles: ["trainer", "quest_giver", "whisperer"],
    trainsClass: "rogue",
  },
  gabriel: {
    id: "gabriel",
    name: "Gabriel",
    occupation: "sacerdote",
    location: "Templo (Alto)",
    roles: ["trainer", "quest_giver"],
    trainsClass: "priest",
  },

  // ── Cenário / tutorial ──────────────────────────────────────────────────
  rosa: {
    id: "rosa",
    name: "Rosa",
    occupation: "guia da casa inicial",
    location: "cidade de spawn",
    roles: ["guide"],
  },
  augusto: {
    id: "augusto",
    name: "Augusto",
    occupation: "prefeito",
    location: "Câmara (Baixa)",
    roles: [], // sem quest no MVP — cenário/falas
  },
};

/** Lookup de NPC por id (undefined = desconhecido). */
export function getNpc(id: string): NpcDef | undefined {
  return NPC_CAST[id];
}

/** Todos os NPCs que têm um papel específico (treinadores, mercadores…). */
export function npcsByRole(role: NpcRole): NpcDef[] {
  return Object.values(NPC_CAST).filter((n) => n.roles.includes(role));
}
