/** Nina — lojista da Loja Geral (Q2 A Mochila). Voz: faladeira, conta vantagem de tudo que vende. */
import { QUESTS, currentStage, isQuestAvailable } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

export const nina: NpcDialogue = {
  root(quests, _cls) {
    const q2 = quests.get("q2_mochila");
    // Sem estado: oferta — só se a quest está disponível (Q2 não tem requires,
    // então `isQuestAvailable` é sempre true; o gate fica explícito por simetria
    // com os givers encadeados).
    if (!q2) {
      if (isQuestAvailable(quests, QUESTS.q2_mochila)) {
        return {
          text:
            "Loja Geral da Nina — corda, vela, panela, o que o aventureiro " +
            "esquecer eu tenho! Mas olha minha sorte: o carroceiro largou meu " +
            "FARDO na granja quando viu os ratos. Mercadoria boa parada lá fora…",
          options: [
            { id: "q2_ask", label: "Que fardo é esse?" },
            NEGOCIAR,
            TCHAU,
          ],
        };
      }
      return {
        text:
          "Loja Geral da Nina — corda, vela, panela, tocha pro escuro… diz o que " +
          "precisa que eu acho no fundo da prateleira!",
        options: [NEGOCIAR, TCHAU],
      };
    }
    if (q2.stage === "active") {
      // Etapa atual: o `talk:nina` final é creditado pelo comando `talk` ANTES
      // desta view (Simulation), então quando o fardo já foi recuperado a quest
      // já está em `report`. Aqui (active) o jogador ainda não pegou o fardo.
      const stg = currentStage(QUESTS.q2_mochila, q2);
      const aindaTalk = stg?.type === "talk"; // só se ele aceitou e voltou sem ir à granja
      return {
        text: aindaTalk
          ? "Então? Vai buscar meu fardo na granja ou veio só pra prosear?"
          : "E o meu fardo? Tá lá na GRANJA, passando o portão oeste — bem onde " +
            "o medroso do carroceiro largou. Traz inteiro que a mochila é tua.",
        options: [NEGOCIAR, TCHAU],
      };
    }
    if (q2.stage === "report") {
      return {
        text:
          "É ESSE mesmo, o fardo! Inteirinho, olha só — eu sabia que tu servia. " +
          "Deixa eu te pagar como combinado.",
        options: [
          { id: "q2_done", label: "Aqui está. A mochila era o trato." },
          NEGOCIAR,
          TCHAU,
        ],
      };
    }
    // Concluída — banter de freguês.
    return {
      text:
        "A mochila tá te servindo bem, hein? Eu disse que tu tinha futuro de " +
        "carregador! Aparece sempre — sempre tem coisa nova na prateleira.",
      options: [NEGOCIAR, TCHAU],
    };
  },
  choose(optionId, _quests, _cls) {
    if (optionId === "q2_ask") {
      return {
        view: {
          text:
            "Um fardo de mercadoria que pedi de fora — ficou na granja, passando " +
            "o portão oeste. Me traz ele inteiro e eu te dou uma MOCHILA de " +
            "amostra, de couro, dessas que aguentam o mundo nas costas. Topas?",
          options: [
            { id: "q2_accept", label: "Topo. Vou buscar." },
            { id: "bye", label: "Depois eu vejo." },
          ],
        },
      };
    }
    if (optionId === "q2_accept") {
      return {
        view: {
          text:
            "Ótimo! Portão oeste, segue pra granja. Cuidado com os ratos pelos " +
            "celeiros — o carroceiro fugiu deles, mas tu não foge, né?",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q2_mochila" },
      };
    }
    if (optionId === "q2_done") {
      const def = QUESTS.q2_mochila;
      return {
        view: {
          text:
            `Toma — a mochila, como prometido, e mais ${def.rewards.gold} de ouro pelo ` +
            "trabalho. Te disse: tu tem futuro de carregador. Bota nas costas e vai!",
          options: [TCHAU],
        },
        effects: { completeQuest: "q2_mochila" },
      };
    }
    if (optionId === "trade") {
      // Fecha a janela de diálogo; a Simulation abre a loja (efeito openShop).
      // Sortimento (só utilitários, sem armas) vive em commerce/, não aqui.
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
