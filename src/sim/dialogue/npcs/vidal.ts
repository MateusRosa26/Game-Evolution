/**
 * Capitão Vidal — guarda-capitão do Quartel da Guarda. Voz: justo e exausto,
 * "a muralha consome tudo" (NPCS.md). Quest-giver da orla NE + mercador de
 * bounty (pós-Q5).
 *
 * Papel (QUESTS.md §Nordeste):
 *  - Q5 Lobos Demais (q5_lobos): direta de entrada — reduzir a alcateia da orla.
 *    Concluí-la destrava o **bounty de orelhas de goblin** (comércio gated; o
 *    sortimento vive em `npc/commerce/vidal.ts`, NÃO aqui) e abre a cadeia Q8.
 *  - Q8 Orelha por Orelha — 3 atos encadeados (q8_a1 → q8_a2 → q8_a3), cada um
 *    `requires` o anterior; q8_a1 `requires` q5. a1: 10 orelhas. a2: achar +
 *    reduzir o Acampamento Goblin. a3: a Caverna, o Orc que os arma, a prova.
 *
 * LIFECYCLE (conferido na Simulation.ts):
 *  - Abrir o diálogo já CREDITA um evento `talk` antes de `root()` rodar — então
 *    etapas `talk:vidal` no MEIO da quest (ex.: o "report da localização" do a2)
 *    avançam só por visitar o Capitão, e `root()` já vê o passo cumprido.
 *  - `acceptQuest` também credita `talk` na hora → uma 1ª etapa `talk:vidal`
 *    (aceite) avança direto pra etapa seguinte (kill/collect/region).
 *  - `completeQuest` só paga quando a quest está em `report`.
 *  - `turnInStage` (collect) é resolvido pela sim: ela confere o bolso e CONSOME
 *    os itens; o diálogo só não tem como ver o bolso, então oferece a entrega
 *    enquanto a etapa `collect:vidal` está ativa (a sim no-opa se faltar item).
 *    Como o collect é a ÚLTIMA etapa de a1/a3, entregar leva a quest pra
 *    `report` — daí o pagamento vem no mesmo nó (efeitos rodam ANTES da view).
 *
 * Vidal NÃO é treinador → não tem ciência de classe (classless e classe veem o
 * mesmo); `cls` fica sem uso. Mercador: NEGOCIAR só aparece pós-Q5, quando o
 * bounty existe (antes a loja é vazia).
 *
 * questIds REAIS (conferidos: existem em QUESTS): q5_lobos, q8_a1, q8_a2, q8_a3.
 * Falas pt-BR = rascunho do QUESTS.md/NPCS.md (✏️ Loremaster afina o tom).
 */
import { QUESTS, stageCounter, currentStage, isQuestAvailable } from "../../quests";
import type { QuestState } from "../../quests";
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

/** Contador "(cur/max)" da etapa atual, ou "" se a etapa não conta. */
function tally(questId: string, st: QuestState): string {
  const c = stageCounter(QUESTS[questId], st);
  return c ? ` (${c.cur}/${c.max})` : "";
}

export const vidal: NpcDialogue = {
  root(quests, _cls) {
    const completed = (id: string) => quests.get(id)?.stage === "completed";
    // Pós-Q5 o bounty existe → o Capitão "negocia" (compra orelhas).
    const negociar = completed("q5_lobos") ? [NEGOCIAR] : [];

    // ── Q5 Lobos Demais ──────────────────────────────────────────────────
    const q5 = quests.get("q5_lobos");
    if (!q5) {
      if (isQuestAvailable(quests, QUESTS.q5_lobos)) {
        return {
          text:
            "O Capitão Vidal mal levanta os olhos do mapa da muralha. “A alcateia " +
            "da orla atacou dois viajantes esta semana. Não tenho homens — a " +
            "muralha consome tudo. Você anda armado. Reduza a matilha por mim.”",
          options: [
            { id: "q5_ask", label: "Quantos lobos?" },
            ...negociar,
            TCHAU,
          ],
        };
      }
    } else if (q5.stage === "active") {
      // Aceite já avançou pra etapa de caça (kill 8 lobos na Toca, orla NE).
      return {
        text: `“A Toca fica na orla da mata, a nordeste. Oito a menos e eu durmo melhor.”${tally("q5_lobos", q5)}`,
        options: [TCHAU],
      };
    } else if (q5.stage === "report") {
      return {
        text: "Vidal nota o sangue seco na sua roupa. “A orla está mais quieta. Conseguiu mesmo.”",
        options: [{ id: "q5_done", label: "A matilha foi reduzida." }, TCHAU],
      };
    }

    // Q5 concluída → a cadeia Q8 abre (e o bounty já está no balcão).
    if (completed("q5_lobos")) {
      // ── Q8 ato 1 — Orelha por Orelha (collect 10 orelhas) ──────────────
      const a1 = quests.get("q8_a1");
      if (!a1) {
        if (isQuestAvailable(quests, QUESTS.q8_a1)) {
          return {
            text:
              "“Praga pior que lobo, os goblins. Batedores rondando o vau. Eu pago " +
              "por prova: traga as orelhas deles. Dez, pra começar.”",
            options: [{ id: "q8a1_ask", label: "Orelhas de goblin." }, ...negociar, TCHAU],
          };
        }
      } else if (a1.stage === "active") {
        // Etapa collect (entregar 10 ao Vidal). Oferece a entrega; a sim confere
        // o bolso e consome — se faltar, no-opa e o contador segue mostrando.
        return {
          text: `“Os goblins vêm de algum canto. Dez orelhas no balcão e a gente segue daí.”${tally("q8_a1", a1)}`,
          options: [{ id: "q8a1_turnin", label: "Trouxe as orelhas." }, ...negociar, TCHAU],
        };
      } else if (a1.stage === "report") {
        return {
          text: "Vidal conta as orelhas em silêncio, sem pressa.",
          options: [{ id: "q8a1_pay", label: "Está tudo aí." }, ...negociar, TCHAU],
        };
      } else if (a1.stage === "completed") {
        // ── Q8 ato 2 — O Acampamento (achar + reduzir) ───────────────────
        const a2 = quests.get("q8_a2");
        if (!a2) {
          if (isQuestAvailable(quests, QUESTS.q8_a2)) {
            return {
              text:
                "“Dez orelhas e ainda vêm mais. Isso não é matilha solta — tem um ninho. " +
                "Suba a trilha, ache o acampamento deles e volte com a posição.”",
              options: [{ id: "q8a2_ask", label: "Acho o ninho." }, ...negociar, TCHAU],
            };
          }
        } else if (a2.stage === "active") {
          const stg = currentStage(QUESTS.q8_a2, a2);
          if (stg?.type === "kill") {
            // O report da localização (etapa talk) já avançou ao ABRIR o diálogo;
            // agora é reduzir o acampamento (kill 12 goblins).
            return {
              text: `“Um acampamento inteiro, então. Reduza o que puder — doze ao menos, pra eles sentirem.”${tally("q8_a2", a2)}`,
              options: [TCHAU],
            };
          }
          // Ainda procurando (etapa region_enter): só plantar a direção.
          return {
            text: "“A trilha das orelhas sobe pela orla, a nordeste. Ache o ninho e volte me dizer onde.”",
            options: [TCHAU],
          };
        } else if (a2.stage === "report") {
          return {
            text: "Vidal franze a testa ao ouvir o relato. “Goblin não se organiza sozinho.”",
            options: [{ id: "q8a2_pay", label: "O acampamento foi reduzido." }, ...negociar, TCHAU],
          };
        } else if (a2.stage === "completed") {
          // ── Q8 ato 3 — Quem os Arma (a Caverna, o Orc, a prova) ─────────
          const a3 = quests.get("q8_a3");
          if (!a3) {
            if (isQuestAvailable(quests, QUESTS.q8_a3)) {
              return {
                text:
                  "“O acampamento respondia a alguém mais fundo. A Caverna dos Goblins, " +
                  "a nordeste. Desça até o fim, descubra quem os arma — e me traga prova.”",
                options: [{ id: "q8a3_ask", label: "Vou ao fundo." }, ...negociar, TCHAU],
              };
            }
          } else if (a3.stage === "active") {
            const stg = currentStage(QUESTS.q8_a3, a3);
            if (stg?.type === "collect") {
              // Orc já caído → trazer a Sucata de Arma marcada (entrega = report).
              return {
                text: "“Você o matou. Então traga o que ele carregava — a prova fala mais que orelha.”",
                options: [{ id: "q8a3_turnin", label: "Trouxe a prova." }, ...negociar, TCHAU],
              };
            }
            // Ainda descendo (etapa kill do Orc Soldado).
            return {
              text: "“No fundo da caverna tem quem manda. Desça, mate, e não volte de mãos vazias.”",
              options: [TCHAU],
            };
          } else if (a3.stage === "report") {
            return {
              text: "Vidal pega a sucata, vira na mão, e o rosto fecha.",
              options: [{ id: "q8a3_pay", label: "Era um orc. Armado." }, ...negociar, TCHAU],
            };
          }
          // ── Cadeia Q8 inteira fechada → fio solto (Fortaleza, fatia futura).
          return {
            text:
              "Vidal guarda a sucata marcada numa gaveta e tranca. “Orc armado, " +
              "armadurado, esperando no escuro. Isso não vem de goblin. Vem do norte, " +
              "de onde eu não tenho homens pra chegar. Por ora, obrigado — fica de olho na orla.”",
            options: [...negociar, TCHAU],
          };
        }
      }
      // Q5 feita mas Q8 ainda não pegou (ou aguardando passo de mundo): banter
      // do capitão exausto + a loja do bounty aberta.
      return {
        text: "“A muralha não se ergue sozinha, e os monstros não esperam ela ficar pronta. Se trouxer orelhas de goblin, eu pago.”",
        options: [...negociar, TCHAU],
      };
    }

    // Estado-base (Q5 indisponível por algum gate futuro): só o capitão exausto.
    return {
      text: "“Tenho meia dúzia de homens e uma muralha pela metade. Se não é serviço, não é hora.”",
      options: [TCHAU],
    };
  },

  choose(optionId, _quests, _cls) {
    // ── Aceites (talk:vidal stage 0 → a sim credita o talk e avança a etapa) ──
    if (optionId === "q5_ask") {
      return {
        view: {
          text:
            "“Oito. A alcateia toda, se der. Não tenho recompensa de cofre — tenho " +
            "gratidão e o que a guarda puder soltar. Topa?”",
          options: [{ id: "q5_accept", label: "Topo." }, { id: "bye", label: "Agora não." }],
        },
      };
    }
    if (optionId === "q5_accept") {
      return {
        view: {
          text: "“A Toca é na orla, a nordeste. Volte inteiro — não tenho homens pra te procurar.”",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q5_lobos" },
      };
    }
    if (optionId === "q5_done") {
      const def = QUESTS.q5_lobos;
      return {
        view: {
          text:
            `“Toma — ${def.rewards.gold} de ouro, e a gratidão da guarda.” Ele baixa a voz. ` +
            "“Outra coisa: os goblins. Praga pior que lobo. A partir de agora eu pago por " +
            "orelha deles — contrato em pé. Procure-me quando tiver estômago pro vau.”",
          options: [TCHAU],
        },
        effects: { completeQuest: "q5_lobos" },
      };
    }

    if (optionId === "q8a1_ask") {
      return {
        view: {
          text: "“Dez orelhas. Cada batedor que cair, corte a prova. Eu pago por peça e por silêncio.”",
          options: [{ id: "q8a1_accept", label: "Combinado." }, { id: "bye", label: "Agora não." }],
        },
      };
    }
    if (optionId === "q8a1_accept") {
      return {
        view: { text: "“No vau, a nordeste. Não me traga orelha de coelho achando que sou cego.”", options: [TCHAU] },
        effects: { acceptQuest: "q8_a1" },
      };
    }

    if (optionId === "q8a2_ask") {
      return {
        view: {
          text: "“Não quero que limpe nada ainda. Quero a POSIÇÃO. Ache o ninho, volte, e aí a gente decide.”",
          options: [{ id: "q8a2_accept", label: "Entendido." }, { id: "bye", label: "Agora não." }],
        },
      };
    }
    if (optionId === "q8a2_accept") {
      return {
        view: { text: "“Suba a trilha das orelhas. E não se faça de herói lá em cima.”", options: [TCHAU] },
        effects: { acceptQuest: "q8_a2" },
      };
    }

    if (optionId === "q8a3_ask") {
      return {
        view: {
          text:
            "“A Caverna dos Goblins, no fundo da orla. Desça até onde der, mate quem " +
            "estiver dando as ordens, e me traga o que ele carregava. Prova, não história.”",
          options: [{ id: "q8a3_accept", label: "Está feito." }, { id: "bye", label: "Agora não." }],
        },
      };
    }
    if (optionId === "q8a3_accept") {
      return {
        view: { text: "“Vá com cuidado. O que arma goblin não é coisa de goblin.”", options: [TCHAU] },
        effects: { acceptQuest: "q8_a3" },
      };
    }

    // ── Entregas de collect (turnInStage): a sim confere o bolso e consome; como
    // é a última etapa, a quest cai em report e o pagamento vem no mesmo nó. ──
    if (optionId === "q8a1_turnin") {
      return {
        view: {
          text: "Vidal alinha as orelhas no balcão e conta, uma a uma, em silêncio.",
          options: [{ id: "q8a1_pay", label: "Está tudo aí." }, TCHAU],
        },
        effects: { turnInStage: "q8_a1" },
      };
    }
    if (optionId === "q8a3_turnin") {
      return {
        view: {
          text: "Vidal recebe a sucata, gira na mão e o queixo trava.",
          options: [{ id: "q8a3_pay", label: "Era um orc. Armado." }, TCHAU],
        },
        effects: { turnInStage: "q8_a3" },
      };
    }

    // ── Pagamentos (completeQuest: só paga se a quest está em report) ──
    if (optionId === "q8a1_pay") {
      const def = QUESTS.q8_a1;
      return {
        view: {
          text:
            `“Dez certas.” Ele empurra ${def.rewards.gold} de ouro pelo balcão. ` +
            "“Mas dez orelhas não saem de uns poucos batedores. Vêm de algum canto. Vai ter mais.”",
          options: [TCHAU],
        },
        effects: { completeQuest: "q8_a1" },
      };
    }
    if (optionId === "q8a2_pay") {
      const def = QUESTS.q8_a2;
      return {
        view: {
          text:
            `“Um acampamento inteiro.” Vidal solta ${def.rewards.gold} de ouro e fica olhando o mapa. ` +
            "“Goblin não cava trincheira, não posta sentinela. Alguém os organiza. Eu quero saber quem.”",
          options: [TCHAU],
        },
        effects: { completeQuest: "q8_a2" },
      };
    }
    if (optionId === "q8a3_pay") {
      const def = QUESTS.q8_a3;
      return {
        view: {
          text:
            `“Não era goblin no fundo. Era um orc — armado, armadurado, esperando.”` +
            ` Ele te entrega ${def.rewards.gold} de ouro e uma peça do arsenal da guarda. ` +
            "“Isso vem do norte, de onde eu não alcanço. Você fez sua parte. O resto… vai ter que esperar.”",
          options: [TCHAU],
        },
        effects: { completeQuest: "q8_a3" },
      };
    }

    // Abrir o bounty (loja): fecha o diálogo; a Simulation abre o comércio.
    if (optionId === "trade") {
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
