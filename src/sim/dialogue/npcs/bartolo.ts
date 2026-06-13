/** Bartolo — estalajadeiro (Q1 Ratos no Porão). Voz: reclamão afável. */
import { QUESTS, stageCounter } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

export const bartolo: NpcDialogue = {
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
      const c = stageCounter(QUESTS.q1_ratos, q1);
      const tally = c ? ` (${c.cur}/${c.max})` : "";
      return {
        text: `Ainda ouço os bichos arranhando lá embaixo…${tally}`,
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
