/**
 * Duarte — ferreiro (Baixa). Quest giver de Q4 A Entrega do Ferreiro e Q9 A
 * Estrada Roubada (gateada por Q4) + mercador de gear T1–T2 (sortimento em
 * `npc/commerce/duarte.ts`). Voz: golpes curtos de martelo, confiança se forja.
 *
 * Padrão quest-giver (igual ao Bartolo): `root`/`choose` são funções do estado
 * de quests. Cascata de prioridade no `root`:
 *   report (vem buscar o pagamento) → andamento (lembra o objetivo) → oferta
 *   (gate por isQuestAvailable, respeitando requires) → ocioso/banter.
 *
 * Mecânica relevante (Simulation.ts):
 *  - `acceptQuest` já credita o evento `talk` do giver na hora — então a 1ª etapa
 *    `talk duarte` do Q4/Q9 avança sozinha pra próxima etapa ao aceitar.
 *  - `completeQuest` só paga quando a quest está em `report` (última etapa
 *    cumprida); a sim deposita gold/XP e marca `completed`.
 *  - Q9 só fica disponível com Q4 `completed` (requires) — checado por
 *    `isQuestAvailable`.
 *
 * Falas pt-BR = rascunho do QUESTS.md/NPCS.md (✏️ Loremaster afina o tom).
 */
import { QUESTS, stageCounter, isQuestAvailable } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

export const duarte: NpcDialogue = {
  root(quests, _cls) {
    const q4 = quests.get("q4_entrega");
    const q9 = quests.get("q9_estrada");

    // ── Reports primeiro: o jogador volta pra fechar a conta ────────────────
    if (q4?.stage === "report") {
      return {
        text:
          "O Marco recebeu o fardo, então. Bom. Homem de palavra cruza a ponte e " +
          "volta inteiro.",
        options: [
          { id: "q4_done", label: "A entrega está feita." },
          NEGOCIAR,
          TCHAU,
        ],
      };
    }
    if (q9?.stage === "report") {
      return {
        text:
          "A carga de volta… e três a menos na estrada. Você não só recupera ferro, " +
          "você devolve ordem. Isso vale mais que o frete.",
        options: [
          { id: "q9_done", label: "A carga voltou." },
          NEGOCIAR,
          TCHAU,
        ],
      };
    }

    // ── Andamento: lembra o objetivo da etapa atual ─────────────────────────
    if (q4?.stage === "active") {
      return {
        text:
          "O fardo é pra Atalaia. Procura o Marco, o vigia — cruza a ponte e segue " +
          "o rio. E o lacre fica intacto.",
        options: [NEGOCIAR, TCHAU],
      };
    }
    if (q9?.stage === "active") {
      const c = stageCounter(QUESTS.q9_estrada, q9);
      const tally = c ? ` (${c.cur}/${c.max})` : "";
      return {
        text:
          "A estrada do sul comeu minha carga. O Capitão Vidal sabe de bocas pra " +
          `alimentar, mas não de homens; o Telmo, do Cais, ouve o que se gasta. Puxa o fio.${tally}`,
        options: [NEGOCIAR, TCHAU],
      };
    }

    // ── Oferta: Q4 de cara; Q9 só com a confiança forjada (pós-Q4) ──────────
    if (!q4) {
      return {
        text:
          "Martelo não para sozinho. Preciso de um par de pernas honestas pra uma " +
          "entrega — você serve?",
        options: [
          { id: "q4_ask", label: "Que entrega é essa?" },
          NEGOCIAR,
          TCHAU,
        ],
      };
    }
    // Q4 concluída e Q9 destravada (requires: q4_entrega) e ainda não pega.
    if (!q9 && isQuestAvailable(quests, QUESTS.q9_estrada)) {
      return {
        text:
          "Você já provou na estrada leste. Pois a do sul me roubou a carga seguinte — " +
          "ferro que custou suor. Topa um trabalho mais pesado?",
        options: [
          { id: "q9_ask", label: "Conte o que houve." },
          NEGOCIAR,
          TCHAU,
        ],
      };
    }

    // ── Ocioso / banter: a forja sempre tem o que vender ────────────────────
    return {
      text:
        "Aço afiado e malha boa, é o que saio da bigorna. Diz o que precisa — e " +
        "não me peça desconto antes do primeiro golpe.",
      options: [NEGOCIAR, TCHAU],
    };
  },

  choose(optionId, _quests, _cls) {
    // ── Q4 — A Entrega do Ferreiro ──────────────────────────────────────────
    if (optionId === "q4_ask") {
      return {
        view: {
          text:
            "Um fardo lacrado, pro Marco, o vigia de Atalaia, na estrada leste. " +
            "Cruza a ponte, segue o rio, entrega na mão dele. Não abre, não pesa, " +
            "não pergunta.",
          options: [
            { id: "q4_accept", label: "Pode contar comigo." },
            { id: "bye", label: "Agora não." },
          ],
        },
      };
    }
    if (optionId === "q4_accept") {
      return {
        view: {
          text:
            "Tá no balcão. A ponte é logo na Porta d'Água. Volta que eu pago — " +
            "ferreiro não deve a ninguém.",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q4_entrega" },
      };
    }
    if (optionId === "q4_done") {
      const def = QUESTS.q4_entrega;
      return {
        view: {
          text:
            `Toma — ${def.rewards.gold} de ouro, sem regateio. E olha: minha bigorna ` +
            "agora é tua. Tenho sucata que ainda canta no fogo — me traz, eu compro. " +
            "Aço não morre, só troca de dono.",
          options: [TCHAU],
        },
        effects: { completeQuest: "q4_entrega" },
      };
    }

    // ── Q9 — A Estrada Roubada (pós-Q4) ─────────────────────────────────────
    if (optionId === "q9_ask") {
      return {
        view: {
          text:
            "A segunda carga sumiu na estrada do pântano, ao sul. O Capitão Vidal " +
            "te aponta o que sabe, mas anda sem homens — a muralha engole todos. O " +
            "Telmo, taverneiro do Cais, reparou em alguém gastando demais. Puxa esse " +
            "fio até o fim.",
          options: [
            { id: "q9_accept", label: "Vou trazer seu ferro de volta." },
            { id: "bye", label: "Ainda não." },
          ],
        },
      };
    }
    if (optionId === "q9_accept") {
      return {
        view: {
          text:
            "Começa pelo Vidal, no Quartel. Depois o Telmo. A estrada do sul não " +
            "perdoa, mas você já cruzou uma ponte por mim. Vai.",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q9_estrada" },
      };
    }
    if (optionId === "q9_done") {
      const def = QUESTS.q9_estrada;
      return {
        view: {
          text:
            `${def.rewards.gold} de ouro — e bem ganho. A estrada do sul ainda é deles, ` +
            "mas agora sabem que custa caro mexer com Alvorada. Charneca fica naquele " +
            "rumo, se um dia tiver estômago pra ela.",
          options: [TCHAU],
        },
        effects: { completeQuest: "q9_estrada" },
      };
    }

    // ── Negociar: fecha a janela; a Simulation abre a loja (openShop) ───────
    if (optionId === "trade") {
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
