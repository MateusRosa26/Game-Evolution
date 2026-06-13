/**
 * Quest engine — defs declarativas + estado por jogador (fatia ① — QUESTS.md).
 *
 * Modelo STAGED (SISTEMA-QUESTS.md): cada quest é uma LISTA ORDENADA de etapas
 * (`stages`) que a sim rastreia uma de cada vez. As etapas são uma união
 * discriminada por `type` — `talk`/`kill`/`collect`/`interact`/`region_enter`.
 * O `QuestState` guarda a etapa atual (`stageIndex`) + o progresso dentro dela
 * (`progress`) + o ciclo de vida (`stage`): a sim avança a etapa; quando a
 * última fecha, a quest vai pra `report` (falta o NPC pagar) e depois
 * `completed`.
 *
 * O `stage` (lifecycle) é MANTIDO como antes (`active`/`report`/`completed`) —
 * todo consumidor externo (commerce gating, gate do rito, flag do diário) lê
 * só ele e não muda. O que é novo é o `stageIndex`/`progress` e o shape do def.
 *
 * Wiring nesta fase: `talk`/`kill`/`collect` ligados ponta a ponta (kill e talk
 * pelo `creditQuestEvent`; collect pela entrega em diálogo). `interact` e
 * `region_enter` ficam DEFINIDOS (a emissão de mundo vem na fatia 0a-bis).
 *
 * Recompensas: XP (progression) + gold (bolso) + items (bolso) + chave
 * abstrata (`grantsKey` no personagem). `requires` gateia cadeia/ato (todas as
 * quests listadas precisam estar `completed`).
 *
 * Contador no diário SÓ nas diretas (decisão jun/2026) — projetado quando a
 * etapa atual conta progresso (kill/collect).
 *
 * TOPOLOGIA (jun/2026): cada quest mora em `quests/defs/<id>.ts` (1 export por
 * arquivo) — este barrel re-monta o registro `QUESTS` e expõe tipos/helpers. O
 * specifier `./quests` / `../quests` segue resolvendo pra cá (index do dir).
 */
import { q1_ratos } from "./defs/q1_ratos";
import { q2_mochila } from "./defs/q2_mochila";
import { q3_reagentes } from "./defs/q3_reagentes";
import { q4_entrega } from "./defs/q4_entrega";
import { q5_lobos } from "./defs/q5_lobos";
import { q6_prato } from "./defs/q6_prato";
import { q7_a1 } from "./defs/q7_a1";
import { q7_a2 } from "./defs/q7_a2";
import { q8_a1 } from "./defs/q8_a1";
import { q8_a2 } from "./defs/q8_a2";
import { q8_a3 } from "./defs/q8_a3";
import { q9_estrada } from "./defs/q9_estrada";
import { q10_agua } from "./defs/q10_agua";
import { q11_tesouro } from "./defs/q11_tesouro";
import { q12_corvos } from "./defs/q12_corvos";
import { q13_minas } from "./defs/q13_minas";
import { q14_pedras } from "./defs/q14_pedras";
import { q15_porao } from "./defs/q15_porao";
import { rito_knight } from "./defs/rito_knight";
import { rito_mage } from "./defs/rito_mage";
import { rito_rogue } from "./defs/rito_rogue";
import { rito_priest } from "./defs/rito_priest";

/** Ciclo de vida da quest no estado do jogador (inalterado entre eras). */
export type QuestStage =
  /** Aceita — etapas em andamento. */
  | "active"
  /** Todas as etapas cumpridas — falta reportar ao NPC (pagar). */
  | "report"
  /** Entregue e paga. */
  | "completed";

/**
 * Uma etapa de quest — união discriminada por `type`. A sim rastreia uma por
 * vez (a `stageIndex` do `QuestState`).
 */
export type QuestStageDef =
  /** Falar com um NPC (avança ao abrir/escolher o nó certo do diálogo). */
  | { type: "talk"; npcId: string }
  /**
   * Caçar N criaturas de uma espécie. `mapId` restringe a contagem a um mapa
   * (ex.: "porao_estalagem"); undefined = qualquer lugar.
   */
  | { type: "kill"; species: string; count: number; mapId?: string }
  /**
   * Entregar N itens (`templateId`) a um NPC (`turnInNpcId`). A entrega é por
   * DIÁLOGO: o NPC oferece a opção só quando o bolso tem os itens; resolver
   * confere, CONSOME e avança.
   */
  | { type: "collect"; templateId: string; count: number; turnInNpcId: string }
  /**
   * Interagir com um objeto de mundo (`interactableId`). DEFINIDO aqui; a
   * emissão (`creditQuestEvent` com evento `interact`) vem na fatia 0a-bis.
   */
  | { type: "interact"; interactableId: string }
  /**
   * Entrar numa região (`regionId`). DEFINIDO aqui; a emissão (`region_enter`)
   * vem na fatia 0a-bis.
   */
  | { type: "region_enter"; regionId: string };

/** Uma recompensa de item depositada no bolso ao concluir. */
export interface QuestItemReward {
  templateId: string;
  /** Quantas unidades (default 1). */
  qty?: number;
}

export interface QuestDef {
  id: string;
  /** Nome no diário (PT — par EN na wiki/loc futura). */
  name: string;
  /** Camada (direta mostra contador; aberta/segredo nunca). */
  layer: "direta" | "aberta" | "segredo";
  /** NPC que oferece/recebe (npcId estável — ver npcs do mapa). */
  giverNpcId: string;
  /** Etapas ORDENADAS — a sim avança uma por vez. */
  stages: QuestStageDef[];
  /**
   * Quests (ids) que precisam estar `completed` pra esta ficar disponível —
   * gating de cadeia/ato. Ausente/vazio = sempre disponível. Lido por
   * `isQuestAvailable` (os diálogos usam na Fase 1).
   */
  requires?: string[];
  /** Recompensas pagas no report→completed. */
  rewards: {
    xp: number;
    gold: number;
    /** Itens depositados no bolso. */
    items?: QuestItemReward[];
    /** Chave abstrata concedida ao personagem (`SimEntity.keys`). */
    grantsKey?: string;
  };
  /** Texto do diário enquanto ativa (as palavras do NPC). */
  journalActive: string;
  /** Registro após completar (o diário é o troféu). */
  journalCompleted: string;
}

export interface QuestState {
  /** Índice da etapa atual em `QuestDef.stages`. */
  stageIndex: number;
  /** Progresso DENTRO da etapa atual (kills feitas / itens entregues). */
  progress: number;
  /** Ciclo de vida (inalterado — consumido por commerce/rito/diário). */
  stage: QuestStage;
}

/**
 * Registro de quests por id (re-montado dos módulos em `defs/`). Q1-Q15 da
 * fatia ① (Alvorada) + ritos R1-R4. Doc novo em `defs/` = mais uma entrada aqui.
 */
export const QUESTS: Record<string, QuestDef> = {
  q1_ratos,
  q2_mochila,
  q3_reagentes,
  q4_entrega,
  q5_lobos,
  q6_prato,
  q7_a1,
  q7_a2,
  q8_a1,
  q8_a2,
  q8_a3,
  q9_estrada,
  q10_agua,
  q11_tesouro,
  q12_corvos,
  q13_minas,
  q14_pedras,
  q15_porao,
  rito_knight,
  rito_mage,
  rito_rogue,
  rito_priest,
};

/** Estado inicial de uma quest recém-aceita (na 1ª etapa, sem progresso). */
export function initialQuestState(): QuestState {
  return { stageIndex: 0, progress: 0, stage: "active" };
}

/** A etapa que a quest está rastreando agora (undefined = fora de faixa). */
export function currentStage(def: QuestDef, st: QuestState): QuestStageDef | undefined {
  return def.stages[st.stageIndex];
}

/**
 * Contador a mostrar no diário/diálogo pra etapa atual (cur/max), ou null se a
 * etapa não conta progresso. SÓ etapas `kill`/`collect` têm contador.
 */
export function stageCounter(
  def: QuestDef,
  st: QuestState,
): { cur: number; max: number } | null {
  const stg = currentStage(def, st);
  if (!stg) return null;
  if (stg.type === "kill" || stg.type === "collect") {
    return { cur: st.progress, max: stg.count };
  }
  return null;
}

/**
 * Uma quest está disponível pro jogador? Respeita `requires` (todas as quests
 * exigidas precisam estar `completed`). Os diálogos usam isto na Fase 1 pra
 * decidir se OFERECEM a quest (gating de cadeia/ato).
 */
export function isQuestAvailable(
  quests: Map<string, QuestState>,
  def: QuestDef,
): boolean {
  if (!def.requires || def.requires.length === 0) return true;
  return def.requires.every((req) => quests.get(req)?.stage === "completed");
}

/**
 * Avança a etapa atual depois de cumprir o objetivo dela. Bump em `progress`
 * até o `count` (kill/collect); ao atingir, passa pra próxima (`stageIndex++`,
 * `progress=0`). Se era a ÚLTIMA etapa, a quest vai pra `report`. Helper interno
 * compartilhado por `creditQuestEvent` (kill) e pela entrega de collect.
 */
function advanceStage(def: QuestDef, st: QuestState): void {
  const stg = currentStage(def, st);
  if (!stg) return;
  // Etapas com contagem precisam encher antes de fechar; as demais fecham direto.
  if (stg.type === "kill" || stg.type === "collect") {
    st.progress = Math.min(stg.count, st.progress + 1);
    if (st.progress < stg.count) return; // ainda falta
  }
  // Etapa cumprida → próxima (ou report se era a última).
  if (st.stageIndex >= def.stages.length - 1) {
    st.stage = "report";
  } else {
    st.stageIndex++;
    st.progress = 0;
  }
}

/** Eventos de mundo que podem fazer uma etapa progredir. */
export type QuestEvent =
  | { kind: "kill"; species: string; mapId: string }
  /** Falar/escolher nó com um NPC (etapa `talk`). */
  | { kind: "talk"; npcId: string }
  /** Interagir com objeto de mundo (etapa `interact`). Emissão = fatia 0a-bis. */
  | { kind: "interact"; interactableId: string }
  /** Entrar numa região (etapa `region_enter`). Emissão = fatia 0a-bis. */
  | { kind: "region_enter"; regionId: string };

/**
 * Crédito de um evento de mundo: avança as quests ativas cuja ETAPA ATUAL casa
 * com o evento. Generaliza o antigo `creditQuestKill` — kill/talk/interact/
 * region passam por aqui. (Collect NÃO: a entrega é por diálogo, resolvida com
 * `creditQuestTurnIn` quando a Simulation já confirmou/consumiu os itens.)
 */
export function creditQuestEvent(
  quests: Map<string, QuestState>,
  evt: QuestEvent,
): void {
  for (const [id, st] of quests) {
    if (st.stage !== "active") continue;
    const def = QUESTS[id];
    if (!def) continue;
    const stg = currentStage(def, st);
    if (!stg) continue;
    switch (evt.kind) {
      case "kill":
        if (stg.type !== "kill" || stg.species !== evt.species) continue;
        if (stg.mapId && stg.mapId !== evt.mapId) continue;
        break;
      case "talk":
        if (stg.type !== "talk" || stg.npcId !== evt.npcId) continue;
        break;
      case "interact":
        if (stg.type !== "interact" || stg.interactableId !== evt.interactableId) continue;
        break;
      case "region_enter":
        if (stg.type !== "region_enter" || stg.regionId !== evt.regionId) continue;
        break;
    }
    advanceStage(def, st);
  }
}

/**
 * Resolve a ENTREGA de uma etapa `collect` (chamada pela Simulation via efeito
 * de diálogo `turnInStage`, DEPOIS de conferir o bolso e CONSUMIR os itens). A
 * etapa atual da quest precisa ser `collect`; avança contando todos os itens
 * de uma vez (o player entrega o lote inteiro). Retorna o def da etapa entregue
 * (pra Simulation saber `templateId`/`count` a consumir) ou null se não casa.
 *
 * NOTA: a Simulation chama `questCollectStage` ANTES (pra saber o que pedir) e
 * só dispara isto quando confirma o consumo — daí o avanço aqui é direto.
 */
export function creditQuestTurnIn(
  quests: Map<string, QuestState>,
  questId: string,
): void {
  const def = QUESTS[questId];
  const st = quests.get(questId);
  if (!def || !st || st.stage !== "active") return;
  const stg = currentStage(def, st);
  if (!stg || stg.type !== "collect") return;
  // Entrega do lote inteiro: enche o progresso e fecha a etapa de uma vez.
  st.progress = stg.count;
  if (st.stageIndex >= def.stages.length - 1) {
    st.stage = "report";
  } else {
    st.stageIndex++;
    st.progress = 0;
  }
}

/**
 * A etapa `collect` que `npcId` pode receber AGORA pra `questId` (etapa atual,
 * ainda ativa, do tipo collect, com este `turnInNpcId`). Retorna o def da etapa
 * (templateId/count) ou null. A Simulation usa pra (1) decidir se o NPC oferece
 * a entrega — só se o bolso tem `count×templateId` — e (2) saber o que consumir.
 */
export function questCollectStage(
  quests: Map<string, QuestState>,
  questId: string,
  npcId: string,
): Extract<QuestStageDef, { type: "collect" }> | null {
  const def = QUESTS[questId];
  const st = quests.get(questId);
  if (!def || !st || st.stage !== "active") return null;
  const stg = currentStage(def, st);
  if (!stg || stg.type !== "collect" || stg.turnInNpcId !== npcId) return null;
  return stg;
}
