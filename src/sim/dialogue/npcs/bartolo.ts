/**
 * Bartolo — estalajadeiro-cozinheiro da Estalagem do Vau (Bento fundido nele,
 * NPCS.md jun/2026). Voz: reclamão afável — o balcão é dele, o fogão também; o
 * mundo é que está errado.
 *
 * Papéis: quest-giver (Q1 Ratos no Porão + Q6 O Prato do Cozinheiro) + mercador
 * (comida/pratos prontos; ingredientes destravam pós-Q6 — sortimento vive em
 * commerce/, não aqui). Q1 e Q6 são DUAS quests diretas independentes (nenhuma
 * com `requires`), ambas oferecidas "de cara" — quando nenhuma está em curso, o
 * jogador escolhe qual começar. As duas têm `talk:bartolo` como 1ª etapa, então
 * aceitar JÁ credita o talk na sim e a quest cai direto na etapa seguinte
 * (kill p/ Q1, collect p/ Q6 — ver Simulation.ts / amaro.ts).
 *
 * Q6 (collect carne_de_caca ×4) → cozinhar na fogueira fixa (`interact`): a
 * Simulation só aceita a entrega (`turnInStage`) se o bolso tiver o lote — a
 * opção é oferecida sempre na etapa collect e no-opa sem a carne. Depois da
 * entrega a quest fica ATIVA na etapa `interact` (cozinhar juntos na fogueira —
 * a emissão de mundo vem na Fase 1e); aí Bartolo só aponta o fogão. O `report`
 * (pagar + ensinar a receita) cai quando a interação fecha a última etapa.
 *
 * Falas = rascunho do QUESTS.md/NPCS.md (✏️ Loremaster afina o tom).
 */
import { QUESTS, stageCounter, currentStage, isQuestAvailable } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

export const bartolo: NpcDialogue = {
  root(quests, _cls) {
    const q1 = quests.get("q1_ratos");
    const q6 = quests.get("q6_prato");

    // ── Q1 Ratos no Porão (em curso/feito tem prioridade de fala) ────────────
    if (q1 && q1.stage === "active") {
      const c = stageCounter(QUESTS.q1_ratos, q1);
      const tally = c ? ` (${c.cur}/${c.max})` : "";
      return {
        text: `Ainda ouço os bichos arranhando lá embaixo…${tally}`,
        options: [NEGOCIAR, TCHAU],
      };
    }
    if (q1 && q1.stage === "report") {
      return {
        text: "O silêncio lá embaixo… que beleza. Conseguiu mesmo, hein?",
        options: [{ id: "q1_done", label: "Os ratos já eram." }, NEGOCIAR, TCHAU],
      };
    }

    // ── Q6 O Prato do Cozinheiro (em curso/feito) ────────────────────────────
    if (q6 && q6.stage === "active") {
      const stg = currentStage(QUESTS.q6_prato, q6);
      // Etapa collect (carne_de_caca ×4): oferece a entrega — a sim confere o
      // bolso e consome; sem a carne a opção no-opa.
      if (stg?.type === "collect") {
        const c = stageCounter(QUESTS.q6_prato, q6);
        const tally = c ? ` (${c.cur}/${c.max})` : "";
        return {
          text:
            "A panela continua chorando de vazia. Quatro cortes de caça de " +
            `verdade — carne, não esse desgosto de celeiro.${tally}`,
          options: [
            { id: "q6_turnin", label: "Trouxe a carne." },
            NEGOCIAR,
            TCHAU,
          ],
        };
      }
      // Etapa interact: carne entregue, falta cozinhar juntos na fogueira fixa.
      return {
        text:
          "A carne já está na bancada. Acende a fogueira ali no canto que eu te " +
          "mostro o ensopado da casa — pé na brasa, mexe sem pressa.",
        options: [NEGOCIAR, TCHAU],
      };
    }
    if (q6 && q6.stage === "report") {
      return {
        text:
          "Cheira a comida de gente nesta estalagem, afinal. Esse ensopado é " +
          "teu agora — leva na cabeça, não no papel.",
        options: [{ id: "q6_done", label: "Valeu pela receita." }, NEGOCIAR, TCHAU],
      };
    }

    // ── Nenhuma em curso: oferta (gate por isQuestAvailable) ──────────────────
    const q1Available = !q1 && isQuestAvailable(quests, QUESTS.q1_ratos);
    const q6Available = !q6 && isQuestAvailable(quests, QUESTS.q6_prato);
    const offers: { id: string; label: string }[] = [];
    if (q1Available) offers.push({ id: "q1_ask", label: "Posso dar um jeito nos ratos." });
    if (q6Available) offers.push({ id: "q6_ask", label: "Por que a panela está vazia?" });

    if (offers.length > 0) {
      // Texto da oferta: o porão ainda pesa enquanto Q1 não foi feita; senão a
      // dor passa a ser a despensa (Q6). Os dois ganchos podem coexistir.
      const text = q1Available
        ? "Bem-vindo à Estalagem do Vau. Cama seca, sopa quente… e um PORÃO " +
          "cheio de ratos, pra minha desgraça. Os malditos roem até as vigas."
        : "Sente-se. Tenho cama e tenho fogão — o que não tenho é carne decente " +
          "pra honrar essa panela.";
      return { text, options: [...offers, NEGOCIAR, TCHAU] };
    }

    // Tudo resolvido (Q1 e Q6 concluídas ou indisponíveis): banter de pós-quest.
    // Mantém o gancho do bueiro (Q1 planta os Esgotos) e a estalagem viva (Q6).
    return {
      text:
        "O porão segue quieto e a panela, cheia — graças a você. Mas eu disse e " +
        "repito: aqueles ratos SUBIAM de algum lugar. Dá uma olhada no bueiro da " +
        "praça, se tiver estômago. E traz caça quando tiver — eu compro.",
      options: [NEGOCIAR, TCHAU],
    };
  },

  choose(optionId, _quests, _cls) {
    // ── Q1: oferta → aceite → report ─────────────────────────────────────────
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

    // ── Q6: oferta → aceite → entrega da carne → report ──────────────────────
    if (optionId === "q6_ask") {
      return {
        view: {
          text:
            "Pão eu tenho. Cebola, sal, o caldeirão da minha avó — tudo. O que " +
            "falta é carne de VERDADE: caça, não essa miséria de celeiro. Traz-me " +
            "quatro cortes e eu te mostro o ensopado da casa.",
          options: [
            { id: "q6_accept", label: "Trarei a carne." },
            { id: "bye", label: "Depois eu vejo." },
          ],
        },
      };
    }
    if (optionId === "q6_accept") {
      return {
        view: {
          text:
            "Lobo às vezes dá, mas é magro. Javali é que enche a panela — fundo " +
            "do Matagal, ao sul. Faca afiada e volta inteiro, ouviu?",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q6_prato" },
      };
    }
    // Entrega da carne (etapa collect): a Simulation confere o bolso e consome.
    if (optionId === "q6_turnin") {
      return {
        view: {
          text:
            "Deixa eu ver… isso sim é carne. Firme, vermelha, cheirando a mato. " +
            "Agora acende a fogueira ali e vem cozinhar comigo — receita não se " +
            "aprende de ouvido.",
          options: [TCHAU],
        },
        effects: { turnInStage: "q6_prato" },
      };
    }
    if (optionId === "q6_done") {
      const def = QUESTS.q6_prato;
      return {
        view: {
          text:
            `Toma — ${def.rewards.gold} de gold pelo trabalho, e o ensopado é teu pra sempre. ` +
            "De agora em diante, traz o que caçares: carne, ingrediente, o que for — " +
            "eu pago e ainda te vendo prato pronto pro caminho.",
          options: [TCHAU],
        },
        effects: { completeQuest: "q6_prato" },
      };
    }

    // NEGOCIAR: fecha a janela de diálogo; a Simulation abre a loja (openShop).
    if (optionId === "trade") {
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
