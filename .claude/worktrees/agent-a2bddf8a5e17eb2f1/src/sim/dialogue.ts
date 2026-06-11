/**
 * Diálogo de NPCs — janela híbrida do design (SISTEMA-NPCS.md): opções
 * clicáveis cobrem o essencial; keywords digitáveis são camada v2 (✏️).
 *
 * O diálogo é AUTORITATIVO na sim: o client só renderiza `DialogueViewState`
 * e devolve `dialogueChoice`. Os nós são FUNÇÕES do estado do jogador (quests),
 * então oferta → andamento → report → pós-quest saem do mesmo lugar, sem
 * máquina de estados paralela.
 *
 * Falas = rascunho dos docs (✏️ Loremaster finaliza).
 */
import type { DialogueViewState } from "../shared/protocol";
import { QUESTS, type QuestState } from "./quests";

export interface DialogueChoiceResult {
  /** Próxima visão (null = fecha a janela). */
  view: { text: string; options: { id: string; label: string }[] } | null;
  /** Efeitos que a Simulation aplica (aceitar quest, pagar recompensa…). */
  effects?: {
    acceptQuest?: string;
    completeQuest?: string;
    /** Abre a loja deste NPC (se ele tiver sortimento em `COMMERCE`). */
    openShop?: boolean;
  };
}

export interface NpcDialogue {
  /** Visão inicial ao falar (talk). */
  root(quests: Map<string, QuestState>): { text: string; options: { id: string; label: string }[] };
  /** Resolve uma escolha. */
  choose(
    optionId: string,
    quests: Map<string, QuestState>,
  ): DialogueChoiceResult;
}

const TCHAU = { id: "bye", label: "Até mais." };
/** Abre a loja do NPC (efeito openShop). Só em NPCs com sortimento em COMMERCE. */
const NEGOCIAR = { id: "trade", label: "Quero negociar." };

/** Bartolo — estalajadeiro (Q1 Ratos no Porão). Voz: reclamão afável. */
const bartolo: NpcDialogue = {
  root(quests) {
    const q1 = quests.get("q1_ratos");
    if (!q1) {
      return {
        text:
          "Bem-vindo à Estalagem do Vau. Cama seca, sopa quente… e um PORÃO " +
          "cheio de ratos, pra minha desgraça. Os malditos roem até as vigas.",
        options: [
          { id: "q1_ask", label: "Posso dar um jeito nos ratos." },
          NEGOCIAR,
          TCHAU,
        ],
      };
    }
    if (q1.stage === "active") {
      const def = QUESTS.q1_ratos;
      return {
        text: `Ainda ouço os bichos arranhando lá embaixo… (${q1.kills}/${def.kill!.count})`,
        options: [NEGOCIAR, TCHAU],
      };
    }
    if (q1.stage === "report") {
      return {
        text: "O silêncio lá embaixo… que beleza. Conseguiu mesmo, hein?",
        options: [{ id: "q1_done", label: "Os ratos já eram." }, NEGOCIAR, TCHAU],
      };
    }
    return {
      text:
        "O porão segue quieto, graças a você. Mas eu disse e repito: eles SOBEM " +
        "de algum lugar. Dá uma olhada no bueiro da praça, se tiver estômago.",
      options: [NEGOCIAR, TCHAU],
    };
  },
  choose(optionId, _quests) {
    if (optionId === "q1_ask") {
      return {
        view: {
          text:
            "Faria isso? Desce lá e me livra deles — uns oito que eu tenha PAZ. " +
            "E olha que eles não param de aparecer, devem subir de algum lugar…",
          options: [
            { id: "q1_accept", label: "Pode deixar." },
            { id: "bye", label: "Agora não." },
          ],
        },
      };
    }
    if (optionId === "q1_accept") {
      return {
        view: {
          text: "A escada é ali atrás do balcão. Cuidado com os dentes deles.",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q1_ratos" },
      };
    }
    if (optionId === "q1_done") {
      const def = QUESTS.q1_ratos;
      return {
        view: {
          text:
            `Toma — ${def.rewards.gold} de gold, bem merecido. Agora me diz: oito ratos não ` +
            "nascem de tábua. Eles sobem de algum lugar. O bueiro da praça, eu apostaria…",
          options: [TCHAU],
        },
        effects: { completeQuest: "q1_ratos" },
      };
    }
    if (optionId === "trade") {
      // Fecha a janela de diálogo; a Simulation abre a loja (efeito openShop).
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};

/** Registro de diálogos por npcId (cresce com o elenco de NPCS.md). */
export const DIALOGUES: Record<string, NpcDialogue> = {
  bartolo,
};

/** Monta a projeção para o snapshot. */
export function dialogueView(
  npcEntityId: number,
  npcName: string,
  view: { text: string; options: { id: string; label: string }[] },
): DialogueViewState {
  return { npcId: npcEntityId, npcName, text: view.text, options: view.options };
}
