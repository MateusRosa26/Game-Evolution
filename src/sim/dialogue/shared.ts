/**
 * Peças compartilhadas do diálogo de NPCs — tipos, opções padrão e a factory dos
 * treinadores. Cada NPC concreto mora em `dialogue/npcs/<id>.ts` e importa daqui.
 *
 * O diálogo é AUTORITATIVO na sim: o client só renderiza `DialogueViewState`
 * e devolve `dialogueChoice`. Os nós são FUNÇÕES do estado do jogador (quests),
 * então oferta → andamento → report → pós-quest saem do mesmo lugar, sem
 * máquina de estados paralela.
 *
 * Falas = rascunho dos docs (✏️ Loremaster finaliza).
 */
import type { PlayerClass } from "../../shared/types";
import { QUESTS, stageCounter, type QuestState } from "../quests";
import { RITO_COST_GOLD } from "../balance";

export interface DialogueChoiceResult {
  /** Próxima visão (null = fecha a janela). */
  view: { text: string; options: { id: string; label: string }[] } | null;
  /** Efeitos que a Simulation aplica (aceitar quest, pagar recompensa…). */
  effects?: {
    acceptQuest?: string;
    completeQuest?: string;
    /**
     * Entrega de etapa `collect` (questId): a Simulation confere que o bolso tem
     * o lote (`count×templateId` da etapa atual deste NPC), CONSOME e avança a
     * etapa. O diálogo só oferece a opção quando `questCollectStage` casa e o
     * jogador tem os itens.
     */
    turnInStage?: string;
    /** Abre a loja deste NPC (se ele tiver sortimento em `COMMERCE`). */
    openShop?: boolean;
    /** Rito de classe: o jogador classless vira esta classe (a sim valida o
     *  gate gold+quest e cobra). Só nos treinadores. */
    performRito?: PlayerClass;
  };
}

export interface NpcDialogue {
  /** Visão inicial ao falar (talk). `cls` = classe atual do jogador (ciência de
   *  classe: classless vê oferta de rito; já-classe vê banter). */
  root(
    quests: Map<string, QuestState>,
    cls: PlayerClass,
  ): { text: string; options: { id: string; label: string }[] };
  /** Resolve uma escolha. */
  choose(
    optionId: string,
    quests: Map<string, QuestState>,
    cls: PlayerClass,
  ): DialogueChoiceResult;
}

export const TCHAU = { id: "bye", label: "Até mais." };
/** Abre a loja do NPC (efeito openShop). Só em NPCs com sortimento em COMMERCE. */
export const NEGOCIAR = { id: "trade", label: "Quero negociar." };

// ── Treinadores de classe (ritos R1-R4, NPCS.md) ───────────────────────────
// Os 4 treinadores compartilham o MESMO fluxo (oferta do trial → andamento →
// report → rito), diferindo só em classe/quest/voz — daí a factory. Ciência de
// classe: classless vê o caminho; quem já é classe ouve banter. Falas = rascunho
// ✏️ Loremaster. O gate real (gold + quest concluída) é validado no `performRito`.

export interface TrainerVoice {
  className: string; // "Cavaleiro" — exibido no fecho do rito
  pitch: string; // root, classless sem quest: apresenta o trial
  trialLabel: string; // rótulo da opção que aceita o trial
  onAccept: string; // texto após aceitar
  reportLabel: string; // rótulo da opção de reportar o trial cumprido
  ritoLabel: string; // rótulo da opção "fazer o rito"
  ritoPrompt: string; // texto que oferece o rito (trial em report/concluído)
  confirm: string; // texto-cerimônia da confirmação (custo/sem-volta são anexados)
  banter: string; // quando o jogador JÁ tem classe
}

export function makeTrainer(
  cls: Exclude<PlayerClass, "classless">,
  questId: string,
  v: TrainerVoice,
): NpcDialogue {
  const ACCEPT = `${cls}_accept`, REPORT = `${cls}_report`, RITO = `${cls}_rito`, CONFIRM = `${cls}_confirm`;
  const NAO_AGORA = { id: "bye", label: "Ainda não." };
  // Cerimônia: anexa o custo + "sem volta" à fala da classe (DRY, consistente).
  const confirmView = {
    text: `${v.confirm} (Custa ${RITO_COST_GOLD} de ouro — e não há volta.)`,
    options: [{ id: CONFIRM, label: v.ritoLabel }, NAO_AGORA],
  };
  return {
    root(quests, playerCls) {
      if (playerCls !== "classless") return { text: v.banter, options: [TCHAU] };
      const st = quests.get(questId);
      if (!st) return { text: v.pitch, options: [{ id: ACCEPT, label: v.trialLabel }, TCHAU] };
      if (st.stage === "active") {
        const def = QUESTS[questId];
        const c = def ? stageCounter(def, st) : null;
        const tally = c ? ` (${c.cur}/${c.max})` : "";
        return { text: `Ainda não terminou?${tally}`, options: [TCHAU] };
      }
      if (st.stage === "report") {
        return { text: v.ritoPrompt, options: [{ id: REPORT, label: v.reportLabel }, TCHAU] };
      }
      // concluído mas ainda classless (voltou depois) → oferece o rito direto
      return { text: v.ritoPrompt, options: [{ id: RITO, label: v.ritoLabel }, TCHAU] };
    },
    choose(optionId, _quests, _playerCls) {
      if (optionId === ACCEPT) {
        return { view: { text: v.onAccept, options: [TCHAU] }, effects: { acceptQuest: questId } };
      }
      // Reportar o trial: conclui a quest (recompensa) E já leva à cerimônia do rito.
      if (optionId === REPORT) {
        return { view: confirmView, effects: { completeQuest: questId } };
      }
      if (optionId === RITO) {
        return { view: confirmView };
      }
      // Confirmar: dispara o rito (a sim valida gold+quest e cobra; mensagem de sistema
      // dá o resultado). Fecha a janela.
      if (optionId === CONFIRM) {
        return { view: null, effects: { performRito: cls } };
      }
      return { view: null };
    },
  };
}
