/**
 * Amaro — caçador-peleteiro do Cais (Q7 A Caçada do Peleteiro, 2 atos).
 * Voz: quieto; mede você de cima a baixo antes da primeira palavra. Fala pouco,
 * pesa o couro, decide se confia. NPCS.md / QUESTS.md §Q7.
 *
 * Papéis: quest-giver (q7_a1 → q7_a2) + mercador (compra peles/couro/presas
 * SÓ depois do ato 2 — destrava o trade). Os atos são DUAS quests encadeadas:
 * q7_a2 tem `requires:[q7_a1]`, então a oferta do ato 2 só sai com o ato 1
 * `completed` (via isQuestAvailable). Ambos os atos têm `talk:amaro` como 1ª
 * etapa — aceitar JÁ credita o talk na sim, então a quest cai direto na etapa
 * de coleta/caça (Simulation.ts).
 *
 * Falas = rascunho do QUESTS.md (✏️ Loremaster afina o tom).
 */
import { QUESTS, stageCounter, isQuestAvailable } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

export const amaro: NpcDialogue = {
  root(quests, _cls) {
    const a1 = quests.get("q7_a1");
    const a2 = quests.get("q7_a2");

    // ── ATO 2 em curso/feito tem prioridade (a cadeia avançou) ──────────────
    if (a2) {
      if (a2.stage === "active") {
        // Etapa de caça: matar Presa-Torta no fundo do Matagal.
        const c = stageCounter(QUESTS.q7_a2, a2);
        const tally = c && c.max > 1 ? ` (${c.cur}/${c.max})` : "";
        return {
          text:
            "Presa-Torta ainda fuça o fundo do Matagal. Velho, mas não burro — " +
            `vais ouvi-lo antes de o ver.${tally}`,
          options: [NEGOCIAR, TCHAU],
        };
      }
      if (a2.stage === "report") {
        return {
          text:
            "Trazes algo no rosto que não estava antes. O javali… caiu?",
          options: [
            { id: "q7_a2_done", label: "Presa-Torta já era." },
            TCHAU,
          ],
        };
      }
      // q7_a2 completed → peleteiro de verdade: compra o que você esfola.
      return {
        text:
          "O peleteiro do Cais sou eu, e o caçador do Matagal és tu. " +
          "Traz couro inteiro que eu pago em prata.",
        options: [NEGOCIAR, TCHAU],
      };
    }

    // ── ATO 1 ───────────────────────────────────────────────────────────────
    if (a1) {
      if (a1.stage === "active") {
        // Etapa collect (pele_de_lobo ×3). A Simulation só aceita a entrega se
        // o bolso tiver o lote — oferece a opção sempre; ela no-opa sem as peles.
        const c = stageCounter(QUESTS.q7_a1, a1);
        const tally = c ? ` (${c.cur}/${c.max})` : "";
        return {
          text:
            "Três peles de lobo, eu disse. Inteiras — couro furado não vale o " +
            `meu tempo.${tally}`,
          options: [
            { id: "q7_a1_turnin", label: "Trouxe as peles." },
            TCHAU,
          ],
        };
      }
      if (a1.stage === "report") {
        return {
          text:
            "Couro limpo. Esfola firme. Hm. Talvez sirvas mesmo pro ofício…",
          options: [
            { id: "q7_a1_done", label: "E então?" },
            TCHAU,
          ],
        };
      }
      // q7_a1 completed mas q7_a2 ainda não aceito → oferece o ato 2 se liberado.
      if (isQuestAvailable(quests, QUESTS.q7_a2)) {
        return {
          text:
            "Já que provaste o couro — há uma coisa que me passa do braço. " +
            "Um javali velho, lá no fundo. Queres ouvir?",
          options: [
            { id: "q7_a2_ask", label: "Conte." },
            NEGOCIAR,
            TCHAU,
          ],
        };
      }
      // (defensivo: requires não satisfeitos — não deveria acontecer aqui)
      return {
        text: "Bom couro o que trouxeste. Por ora, é só.",
        options: [NEGOCIAR, TCHAU],
      };
    }

    // ── Nada começado: oferta do ato 1 (gate por isQuestAvailable) ──────────
    if (isQuestAvailable(quests, QUESTS.q7_a1)) {
      return {
        text:
          "…Hm. Caçador eu reconheço pelo couro que traz. Tu — ainda não sei " +
          "o que és. Mas dá pra descobrir.",
        options: [
          { id: "q7_a1_ask", label: "Como assim?" },
          TCHAU,
        ],
      };
    }

    // Sem oferta possível ainda: peleteiro fechado, mede e cala.
    return {
      text: "O peleteiro tem o que fazer. Volta quando tiveres couro pra mostrar.",
      options: [TCHAU],
    };
  },

  choose(optionId, _quests, _cls) {
    // ── ATO 1: oferta → aceite ───────────────────────────────────────────────
    if (optionId === "q7_a1_ask") {
      return {
        view: {
          text:
            "Simples. Traz-me três peles de lobo — inteiras, sem rasgo de lâmina " +
            "no lombo. Quem esfola bem, eu reconheço. Aí conversamos.",
          options: [
            { id: "q7_a1_accept", label: "Trarei as peles." },
            { id: "bye", label: "Talvez depois." },
          ],
        },
      };
    }
    if (optionId === "q7_a1_accept") {
      return {
        view: {
          text:
            "Os lobos rondam a orla, a nordeste. Faca afiada e mão firme — o " +
            "couro conta a história do golpe.",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q7_a1" },
      };
    }
    // Entrega das peles (etapa collect): a Simulation confere o bolso e consome.
    if (optionId === "q7_a1_turnin") {
      return {
        view: {
          text:
            "Deixa eu ver… inteiras. Inteiras de verdade. Não é qualquer um que " +
            "traz couro assim.",
          options: [TCHAU],
        },
        effects: { turnInStage: "q7_a1" },
      };
    }
    // Report do ato 1: paga o XP/gold e a fala já abre o gancho do ato 2.
    if (optionId === "q7_a1_done") {
      const def = QUESTS.q7_a1;
      return {
        view: {
          text:
            `Toma — ${def.rewards.gold} de prata pelo trabalho. E ouve: já que ` +
            "tens estômago e mão, talvez sirvas pra um serviço que me foge faz tempo. " +
            "Volta a falar comigo quando quiseres ouvir.",
          options: [TCHAU],
        },
        effects: { completeQuest: "q7_a1" },
      };
    }

    // ── ATO 2: oferta → aceite ───────────────────────────────────────────────
    if (optionId === "q7_a2_ask") {
      return {
        view: {
          text:
            "Há um javali no fundo do Matagal. Velho, com a presa torta de tantas " +
            "brigas — Presa-Torta, chamam. Grande demais pra mim sozinho, e o tempo " +
            "não me sobra como antes. Traz-me a cabeça d'ele.",
          options: [
            { id: "q7_a2_accept", label: "Vou atrás dele." },
            { id: "bye", label: "Ainda não." },
          ],
        },
      };
    }
    if (optionId === "q7_a2_accept") {
      return {
        view: {
          text:
            "Fundo do Matagal, ao sul. Não tem pressa — ele também não tem. Mas " +
            "quando o achares, não recues: javali ferido é pior que javali inteiro.",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q7_a2" },
      };
    }
    // Report do ato 2: paga + entrega a Faca de Esfolar (o símbolo do ofício).
    if (optionId === "q7_a2_done") {
      const def = QUESTS.q7_a2;
      return {
        view: {
          text:
            "A cicatriz da presa… é ele mesmo. Não acreditei até ver. Toma — " +
            `${def.rewards.gold} de prata, e isto: a Faca de Esfolar. Agora és ` +
            "peleteiro de verdade. Traz-me o que esfolares, que eu compro.",
          options: [TCHAU],
        },
        effects: { completeQuest: "q7_a2" },
      };
    }

    // NEGOCIAR: abre a loja (sortimento vive em commerce/amaro.ts).
    if (optionId === "trade") {
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
