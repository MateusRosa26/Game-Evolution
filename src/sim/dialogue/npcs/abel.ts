/**
 * Abel — coveiro da Capela (muralha N). Voz: fúnebre-gentil; sente o que os
 * outros ainda não sentem. Papéis (cast.ts): quest_giver + whisperer — NÃO é
 * mercador (sem entrada em COMMERCE), então o diálogo não tem NEGOCIAR.
 *
 * Quest: Q10 "A Água do Poço" (`q10_agua`, QUESTS.md §Esgotos) — o 1º fio do
 * arco da Contaminação. Etapas (q10_agua.ts): talk:abel → region_enter:esgoto_a2
 * → interact:q10_alvenaria_manchada. NÃO há etapa `talk` de report no fim: a
 * última etapa é `interact`, então ao tocar a alvenaria a quest vai direto pra
 * `report` e o jogador volta ao Abel pra ele pagar (completeQuest).
 *
 * Como a aceitação credita um `talk:abel` na hora (Simulation), depois de aceitar
 * a etapa atual já é region_enter — por isso o andamento ramifica por
 * `currentStage(...).type` (descer ao A2 × achar a mancha), não por índice fixo.
 *
 * Whisperer: Abel só PLANTA a pista — aponta vagamente o sul (Charneca, "onde os
 * mortos não descansam") sem marker, e nunca pronuncia "Contaminação". A
 * maturação (fatia ②) vive no journalCompleted da quest; aqui ele a sussurra.
 *
 * Falas pt-BR = rascunho do QUESTS.md/NPCS.md (✏️ Loremaster afina o tom).
 */
import { QUESTS, currentStage, isQuestAvailable } from "../../quests";
import { type NpcDialogue, TCHAU } from "../shared";

/** Sussurro do coveiro — a pista que aponta vagamente o sul, sem marker. */
const SUL_HINT =
  "“Quando descer demais… escuta o sul. Dizem que em Charneca os mortos não " +
  "descansam. Eu não duvido mais de nada que venha de baixo.”";

export const abel: NpcDialogue = {
  root(quests, cls) {
    const q10 = quests.get("q10_agua");

    // Ainda não aceitou — oferece, se disponível (Q10 não tem `requires`).
    if (!q10) {
      if (!isQuestAvailable(quests, QUESTS.q10_agua)) {
        // Defensivo: hoje Q10 é sempre disponível, mas se um dia ganhar `requires`
        // o coveiro ainda recebe quem chega — só não abre a quest.
        return {
          text:
            "Abel ergue os olhos da cova pela metade. “A terra anda inquieta, " +
            "forasteiro. Volte quando tiver descido um pouco mais no mundo.”",
          options: [{ id: "abel_whisper", label: "O que te inquieta?" }, TCHAU],
        };
      }
      return {
        text:
          "Um homem magro larga a pá e te encara com olhos calmos demais. “A água " +
          "do poço baixo anda turva. Os outros bebem e não sentem o gosto. Eu sinto. " +
          "Vem de baixo — sempre vem de baixo.”",
        options: [
          { id: "abel_q10_ask", label: "Que gosto é esse?" },
          { id: "abel_whisper", label: "O que mais você sente?" },
          TCHAU,
        ],
      };
    }

    // Aceita — em andamento. Ramifica pela etapa atual (descer × achar a mancha).
    if (q10.stage === "active") {
      const stg = currentStage(QUESTS.q10_agua, q10);
      if (stg?.type === "interact") {
        // Já está lá embaixo; falta tocar a alvenaria manchada.
        return {
          text:
            "“Você desceu. Está na cara — traz o cheiro do fundo no casaco.” Ele se " +
            "aproxima. “Procure a parede velha. Uma alvenaria mais antiga que a cidade, " +
            "com uma mancha escura. É dela que vem.”",
          options: [TCHAU],
        };
      }
      // Etapa region_enter (logo após aceitar): mandar descer ao A2.
      return {
        text:
          "“O bueiro da praça abre pro esgoto. Desça ao segundo nível — onde a pedra " +
          "fica mais fria e mais antiga. O que adoeceu a água está por lá. Eu sei que " +
          "está.”",
        options: [TCHAU],
      };
    }

    // Cumprida (achou a mancha) — falta o coveiro pagar. Ele empalidece.
    if (q10.stage === "report") {
      return {
        text:
          "Abel para de cavar antes mesmo de você falar. “Você viu, não viu? A pedra " +
          "manchada.” A voz baixa um tom. “Conte. Conte tudo.”",
        options: [{ id: "abel_q10_report", label: "Há uma mancha numa parede velha demais." }, TCHAU],
      };
    }

    // Pós-quest — o coveiro segue sussurrando; a pendência amadurece (fatia ②).
    return {
      text:
        "“A mancha continua lá, crescendo no escuro, e ninguém quer saber.” Ele aperta " +
        "o cabo da pá. “Você sentiu o cheiro. Não vai esquecer tão cedo.”",
      options: [
        { id: "abel_whisper", label: "Pra onde isso aponta?" },
        ...(cls === "priest"
          ? [{ id: "abel_priest", label: "A luz alcança o que está sob a terra?" }]
          : []),
        TCHAU,
      ],
    };
  },

  choose(optionId, _quests, _cls) {
    // Oferta da Q10 → aceitar.
    if (optionId === "abel_q10_ask") {
      return {
        view: {
          text:
            "“Gosto de coisa parada. De fundo de poço que não devia ter fundo.” Ele te " +
            "estende a pá com o olhar. “Desça ao esgoto pelo bueiro da praça e me diga o " +
            "que há lá embaixo. Faça isso por um velho que enterra gente faz tempo.”",
          options: [
            { id: "abel_q10_accept", label: "Eu desço." },
            { id: "bye", label: "Outra hora." },
          ],
        },
      };
    }
    if (optionId === "abel_q10_accept") {
      return {
        view: {
          text:
            "“Que os mortos te deixem passar.” Um meio-sorriso, sem alegria. “A pedra " +
            "manchada é mais velha que estas muralhas. Você vai reconhecer quando vir.”",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q10_agua" },
      };
    }

    // Report → paga e planta a pista do sul (a maturação do arco).
    if (optionId === "abel_q10_report") {
      const def = QUESTS.q10_agua;
      return {
        view: {
          text:
            `Abel ouve em silêncio e empalidece. Demora a falar. “Mais velha que a ` +
            `cidade… eu temia isso.” Põe ${def.rewards.gold} de prata na sua mão, sem ` +
            `contar. ` +
            SUL_HINT,
          options: [TCHAU],
        },
        effects: { completeQuest: "q10_agua" },
      };
    }

    // Sussurros (whisperer) — plantam a pista, sem abrir nada mecânico.
    if (optionId === "abel_whisper") {
      return {
        view: { text: SUL_HINT, options: [TCHAU] },
      };
    }
    if (optionId === "abel_priest") {
      return {
        view: {
          text:
            "Ele te mede como quem reconhece um par. “A luz alcança. Mas o que apodrece lá " +
            "embaixo não pede luz — pede que alguém ESCUTE. E poucos escutam, sacerdote.”",
          options: [TCHAU],
        },
      };
    }

    return { view: null };
  },
};
