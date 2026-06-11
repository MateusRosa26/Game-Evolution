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
import type { PlayerClass } from "../shared/types";
import { QUESTS, type QuestState } from "./quests";
import { RITO_COST_GOLD } from "./balance";

export interface DialogueChoiceResult {
  /** Próxima visão (null = fecha a janela). */
  view: { text: string; options: { id: string; label: string }[] } | null;
  /** Efeitos que a Simulation aplica (aceitar quest, pagar recompensa…). */
  effects?: {
    acceptQuest?: string;
    completeQuest?: string;
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

const TCHAU = { id: "bye", label: "Até mais." };
/** Abre a loja do NPC (efeito openShop). Só em NPCs com sortimento em COMMERCE. */
const NEGOCIAR = { id: "trade", label: "Quero negociar." };

/** Bartolo — estalajadeiro (Q1 Ratos no Porão). Voz: reclamão afável. */
const bartolo: NpcDialogue = {
  root(quests, _cls) {
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
  choose(optionId, _quests, _cls) {
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

// ── Treinadores de classe (ritos R1-R4, NPCS.md) ───────────────────────────
// Os 4 treinadores compartilham o MESMO fluxo (oferta do trial → andamento →
// report → rito), diferindo só em classe/quest/voz — daí a factory. Ciência de
// classe: classless vê o caminho; quem já é classe ouve banter. Falas = rascunho
// ✏️ Loremaster. O gate real (gold + quest concluída) é validado no `performRito`.

interface TrainerVoice {
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

function makeTrainer(
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
        const n = QUESTS[questId]?.kill?.count ?? 0;
        return { text: `Ainda não terminou? (${st.kills}/${n})`, options: [TCHAU] };
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

const ricardo = makeTrainer("knight", "rito_knight", {
  className: "Cavaleiro",
  pitch:
    "Ricardo te mede de cima a baixo. “O aço não se promete, se prova. Há ratos demais no porão pra um homem só — me traga seis a menos. Aí conversamos sobre rito.”",
  trialLabel: "Aceito a prova.",
  onAccept: "“Desce, bate, volta inteiro. O difícil não é matar rato — é não tremer.”",
  reportLabel: "Está feito.",
  ritoLabel: "Faça de mim um Cavaleiro.",
  ritoPrompt:
    "“Mãos firmes. Já vi recruta vomitar no primeiro osso — você, não. Pronto pro rito, então?”",
  confirm: "“Ajoelha. O aço que empunhar daqui em diante responde por você — e você por ele.”",
  banter: "“Mantém o braço firme, soldado. O aço não descansa, nem você.”",
});

const leonor = makeTrainer("mage", "rito_mage", {
  className: "Mago",
  pitch:
    "Leonor vira uma página sem te olhar. “Talento eu não vendo — disciplina, talvez ensine. Cinco morcegos, as asas intactas. Traga, e veremos se há mente aí dentro.”",
  trialLabel: "Trarei as asas.",
  onAccept: "“Intactas, eu disse. Quem esmaga a asa esmaga o eco. Vá.”",
  reportLabel: "As asas estão aqui.",
  ritoLabel: "Quero o caminho arcano.",
  ritoPrompt:
    "“Hm. Pesa certo. Você colhe com cuidado — raro. O rito, então. Você paga; eu nunca esqueço uma dívida.”",
  confirm: "“Repita o nome que eu te der, e não o esqueça. O arcano não perdoa hesitação.”",
  banter: "“Estude. O que você ainda não entende vai te matar primeiro.”",
});

const vincente = makeTrainer("rogue", "rito_rogue", {
  className: "Ladino",
  pitch:
    "Vincente sorri de canto. “O Beco não confia em currículo. Tem uns ratos que ninguém quer sujar a mão — suje a sua. Seis, sem plateia. Aí a gente fala de rito.”",
  trialLabel: "Sem plateia. Combinado.",
  onAccept: "“Se alguém te vir, não fui eu que pedi. E nada de sorte — habilidade.”",
  reportLabel: "Conta saldada.",
  ritoLabel: "Me ensine a sumir.",
  ritoPrompt:
    "“Ninguém viu, ninguém soube. É o tipo de gente que eu treino. Pronto pra pagar a entrada?”",
  confirm: "“Sem juramento, sem testemunha. Você entra no Beco e sai outro.”",
  banter: "“Olho vivo. No Beco, quem relaxa vira história curta.”",
});

const gabriel = makeTrainer("priest", "rito_priest", {
  className: "Sacerdote",
  pitch:
    "Gabriel te encara com uma calma desconcertante. “Há ossos que ainda andam, e ninguém os culpa. Cinco. Devolva-os ao silêncio — com piedade, não ódio. Então falaremos.”",
  trialLabel: "Eu os farei descansar.",
  onAccept: "“Piedade, lembre. Quem golpeia com raiva carrega a raiva de volta.”",
  reportLabel: "Eles descansam.",
  ritoLabel: "Aceito a vocação.",
  ritoPrompt:
    "“Você os deitou sem crueldade. Isso eu vi. A vocação não é poder — é peso. Carrega comigo?”",
  confirm: "“Estenda as mãos. A luz que pedir vai cobrar o mesmo de você.”",
  banter: "“A luz pesa. Carregue-a com cuidado — e descanse quando puder.”",
});

/** Registro de diálogos por npcId (cresce com o elenco de NPCS.md). */
export const DIALOGUES: Record<string, NpcDialogue> = {
  bartolo,
  ricardo,
  leonor,
  vincente,
  gabriel,
};

/** Monta a projeção para o snapshot. */
export function dialogueView(
  npcEntityId: number,
  npcName: string,
  view: { text: string; options: { id: string; label: string }[] },
): DialogueViewState {
  return { npcId: npcEntityId, npcName, text: view.text, options: view.options };
}
