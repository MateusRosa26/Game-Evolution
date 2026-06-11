/**
 * Quest engine — defs declarativas + estado por jogador (fatia ① — QUESTS.md).
 *
 * Modelo (SISTEMA-QUESTS.md): etapas que a sim rastreia (`talk`/`kill`/
 * `region_enter`/`item`). M1 implementa o suficiente para a Q1 (talk → kill N
 * numa região → talk report); etapas novas entram como variantes do def sem
 * tocar o protocolo. Recompensas: XP (progression) + gold (passe 1 da economia).
 *
 * Contador no diário SÓ nas diretas (decisão jun/2026) — `showCounter`.
 */

export type QuestStage =
  /** Aceita — etapas em andamento. */
  | "active"
  /** Objetivo cumprido — falta reportar ao NPC. */
  | "report"
  /** Entregue e paga. */
  | "completed";

export interface QuestKillStep {
  species: string;
  count: number;
  /**
   * Restringe a contagem a um mapa (ex.: "porao_estalagem"). undefined = qualquer
   * lugar. ✏️ vira região poligonal se alguma quest precisar de sub-área.
   */
  mapId?: string;
}

export interface QuestDef {
  id: string;
  /** Nome no diário (PT — par EN na wiki/loc futura). */
  name: string;
  /** Camada (direta mostra contador; aberta/segredo nunca). */
  layer: "direta" | "aberta" | "segredo";
  /** NPC que oferece/recebe (npcId estável — ver npcs do mapa). */
  giverNpcId: string;
  kill?: QuestKillStep;
  rewards: { xp: number; gold: number };
  /** Texto do diário enquanto ativa (as palavras do NPC). */
  journalActive: string;
  /** Registro após completar (o diário é o troféu). */
  journalCompleted: string;
}

export interface QuestState {
  stage: QuestStage;
  kills: number;
}

/** Q1 — Ratos no Porão (QUESTS.md, XP/gold da bateria M1 + passe 1). */
export const QUESTS: Record<string, QuestDef> = {
  q1_ratos: {
    id: "q1_ratos",
    name: "Ratos no Porão",
    layer: "direta",
    giverNpcId: "bartolo",
    // ✏️ mapId: "porao_estalagem" quando o mapa do porão entrar (multi-mapa)
    kill: { species: "rato", count: 8 },
    rewards: { xp: 50, gold: 20 },
    journalActive:
      "O estalajadeiro quer o porão limpo dos ratos. “Eles não param de aparecer, devem subir de algum lugar…”",
    journalCompleted:
      "O estalajadeiro jura que os ratos sobem de algum lugar. O bueiro da praça?",
  },

  // ── Ritos de classe (R1-R4, NPCS.md) ────────────────────────────────────
  // Trial do rito: feito ENQUANTO classless (só auto-attack), então é kill-based
  // e flavored pela classe pretendida. Gateia o `chooseClass` via
  // RITO_QUEST_BY_CLASS. Falas/alvos = rascunho ✏️ Loremaster + world-designer
  // (ajustar espécie/contagem quando os distritos e spawns temáticos entrarem).
  rito_knight: {
    id: "rito_knight",
    name: "Prova de Aço",
    layer: "direta",
    giverNpcId: "ricardo",
    kill: { species: "rato", count: 6 },
    rewards: { xp: 40, gold: 15 },
    journalActive:
      "Ricardo cruzou os braços: “Caminho do Cavaleiro não começa com juramento, começa com calo. Traz seis ratos a menos no mundo. Aço aprende é apanhando.”",
    journalCompleted:
      "Seis golpes que não tremeram. Ricardo não elogiou — só assentiu. Dizem que o aceno dele vale mais que medalha.",
  },
  rito_mage: {
    id: "rito_mage",
    name: "Asa e Cinza",
    layer: "direta",
    giverNpcId: "leonor",
    kill: { species: "morcego", count: 5 },
    rewards: { xp: 40, gold: 15 },
    journalActive:
      "Leonor mal ergueu os olhos do tomo: “Magia? Primeiro a disciplina de COLHER. Cinco morcegos — a asa deles guarda um eco que eu uso. Abata-os; o resto é comigo.”",
    journalCompleted:
      "Cinco asas pesadas em olhos que já calculavam outra coisa. “Serve”, foi tudo — mas Leonor anotou seu nome.",
  },
  rito_rogue: {
    id: "rito_rogue",
    name: "Conta Saldada",
    layer: "direta",
    giverNpcId: "vincente",
    kill: { species: "rato", count: 6 },
    rewards: { xp: 40, gold: 15 },
    journalActive:
      "Vincente sorriu de canto: “O Beco tem um problema de roedores que ninguém quer resolver — o que diz muito de quem resolve. Seis. Sem alarde.”",
    journalCompleted:
      "Seis problemas resolvidos, nenhum barulho. Vincente não viu você fazer — e é por isso que aprovou.",
  },
  rito_priest: {
    id: "rito_priest",
    name: "Descanso",
    layer: "direta",
    giverNpcId: "gabriel",
    kill: { species: "esqueleto", count: 5 },
    rewards: { xp: 40, gold: 15 },
    journalActive:
      "Gabriel estendeu a mão aos ossos inquietos sem uma palavra; depois, baixo: “Há mortos que não dormem. Cinco deles. Devolva-os ao silêncio — não por ódio, por piedade.”",
    journalCompleted:
      "Cinco que vagavam, agora quietos. Gabriel apenas inclinou a cabeça. A piedade, você aprendeu, também tem gume.",
  },
};

/** Crédito de kill: avança quests ativas que pedem essa espécie/mapa. */
export function creditQuestKill(
  quests: Map<string, QuestState>,
  species: string | null,
  mapId: string,
): void {
  if (!species) return;
  for (const [id, st] of quests) {
    if (st.stage !== "active") continue;
    const def = QUESTS[id];
    const step = def?.kill;
    if (!step || step.species !== species) continue;
    if (step.mapId && step.mapId !== mapId) continue;
    st.kills = Math.min(step.count, st.kills + 1);
    if (st.kills >= step.count) st.stage = "report";
  }
}
