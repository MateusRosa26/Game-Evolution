/**
 * Silas — boticário (Q3 Reagentes do Boticário). Voz: seco e preciso — cada
 * palavra dele custa, como as poções. Frases curtas, zero floreio.
 *
 * Papéis (cast.ts): merchant + quest_giver. Sem rito, sem rumor — o diálogo é o
 * mesmo pra classless e pra quem já tem classe (a Q3 não olha classe).
 *
 * Q3 é STAGED: talk(silas) → collect cauda_de_rato×4 → collect asa_de_morcego×4
 * → talk(silas, report). O diálogo NÃO enxerga o bolso; quem confere/consome os
 * reagentes é a Simulation (turnInStage só avança se o lote está lá). Por isso a
 * fala da entrega é "deixa eu conferir o lote" — vale com ou sem os itens: se
 * faltar, a sim não avança e a próxima visita repete o pedido; se estiver
 * completo, a etapa anda e a visita seguinte mostra o próximo passo.
 *
 * Falas = rascunho do QUESTS.md (✏️ Loremaster afina o tom).
 */
import { QUESTS, isQuestAvailable, stageCounter, currentStage } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

const Q3 = "q3_reagentes";
/** Rótulo da opção de entrega do lote da etapa collect atual. */
const ENTREGAR = { id: "q3_turnin", label: "Trouxe o que pediu." };

export const silas: NpcDialogue = {
  root(quests) {
    const q3 = quests.get(Q3);

    // Ainda não pegou a quest — oferece se disponível (Q3 não tem requires).
    if (!q3) {
      if (isQuestAvailable(quests, QUESTS[Q3])) {
        return {
          text:
            "Silas mal levanta os olhos do almofariz. “Boticário. Vendo o que cura " +
            "e compro o que serve. No momento me falta material fresco — cauda de " +
            "rato e asa de morcego, não essa miséria ressecada do mercado.”",
          options: [
            { id: "q3_ask", label: "Posso trazer esses reagentes." },
            NEGOCIAR,
            TCHAU,
          ],
        };
      }
      // Sem quest disponível (não deve ocorrer p/ Silas) — só a loja.
      return {
        text: "“Diga. Veneno ou cura — não tenho o dia inteiro.”",
        options: [NEGOCIAR, TCHAU],
      };
    }

    // Quest em andamento.
    if (q3.stage === "active") {
      const stg = currentStage(QUESTS[Q3], q3);
      // Etapa collect deste NPC → oferece a entrega do lote.
      if (stg && stg.type === "collect" && stg.turnInNpcId === "silas") {
        const c = stageCounter(QUESTS[Q3], q3);
        const tally = c ? ` (${c.cur}/${c.max})` : "";
        const pede =
          stg.templateId === "cauda_de_rato" ? "as caudas de rato" : "as asas de morcego";
        return {
          text: `“Trouxe ${pede}? Fresco, lembre. Põe na bancada.”${tally}`,
          options: [ENTREGAR, NEGOCIAR, TCHAU],
        };
      }
      // Etapa talk inicial já consumida no aceite; se cair aqui, só aguardando material.
      return {
        text: "“Ainda nada? A gruta no barranco norte está cheia deles. Vá.”",
        options: [NEGOCIAR, TCHAU],
      };
    }

    // Tudo coletado e entregue — falta o boticário fechar a conta.
    if (q3.stage === "report") {
      return {
        text: "Silas cheira um dos vidros e assente, seco. “Servem. Espere.”",
        options: [{ id: "q3_done", label: "Estão fresquíssimos." }, NEGOCIAR, TCHAU],
      };
    }

    // Pós-quest — agora ele compra reagentes (gating de comércio lê a Q3 concluída).
    return {
      text:
        "“Você. O que caçar de cauda, asa ou glândula, eu compro — fresco. " +
        "Cura, vendo. O resto do mundo que se vire.”",
      options: [NEGOCIAR, TCHAU],
    };
  },

  choose(optionId, quests) {
    if (optionId === "q3_ask") {
      return {
        view: {
          text:
            "“Quatro caudas, quatro asas. A gruta no barranco norte — se tiver " +
            "estômago. Frescas. Ressecado não me serve.”",
          options: [
            { id: "q3_accept", label: "Trago para você." },
            { id: "bye", label: "Agora não." },
          ],
        },
      };
    }
    if (optionId === "q3_accept") {
      return {
        view: {
          text: "“Não demore. O frescor não espera.”",
          options: [TCHAU],
        },
        effects: { acceptQuest: Q3 },
      };
    }
    // Entrega do lote da etapa collect atual. A sim confere o bolso e CONSOME;
    // se faltar material, ela não avança e a fala de bancada continua valendo na
    // próxima visita. View aponta o próximo passo (volte que eu confiro).
    if (optionId === "q3_turnin") {
      // O option só é mostrado com Q3 ativa numa etapa collect → o estado existe.
      const q3 = quests.get(Q3);
      const stg = q3 ? currentStage(QUESTS[Q3], q3) : undefined;
      const proximo =
        stg && stg.type === "collect" && stg.templateId === "cauda_de_rato"
          ? "“Caudas conferidas. Faltam as asas de morcego — frescas.”"
          : "“Conferido. Deixa eu ver o lote.”";
      return {
        view: { text: proximo, options: [TCHAU] },
        effects: { turnInStage: Q3 },
      };
    }
    if (optionId === "q3_done") {
      const def = QUESTS[Q3];
      return {
        view: {
          text:
            `“${def.rewards.gold} de ouro. E isto—” Ele empurra um vidrinho vermelho pela ` +
            "bancada. “Poção de vida. Pra emergência. A próxima eu cobro.”",
          options: [TCHAU],
        },
        effects: { completeQuest: Q3 },
      };
    }
    if (optionId === "trade") {
      // Fecha o diálogo; a Simulation abre a loja (efeito openShop).
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
