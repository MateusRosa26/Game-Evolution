/**
 * Marco — vigia de Atalaia, na estrada leste (NPCS.md). Voz: sentinela paciente,
 * "olha mais o rio que a estrada".
 *
 * PAPÉIS (cast.ts: ["whisperer"]): destino da entrega da Q4 (recebe o pacote do
 * Duarte) + sussurrador. NÃO é quest-giver nem mercador — quem dá/paga a Q4 é o
 * Duarte (a volta a ele é o lifecycle `report`), e Marco não tem sortimento em
 * `commerce/`. Logo: sem `acceptQuest`/`completeQuest`/`openShop` aqui.
 *
 * COMO A Q4 AVANÇA AQUI: a etapa `talk:marco` é creditada pela própria Simulation
 * (`creditQuestEvent({kind:"talk"})`) ANTES de montar `root` — ver Simulation.ts
 * no case "talk". Então, ao falar com Marco com a Q4 na etapa dele, a quest já
 * está em `report` quando este `root` roda: a fala só CONFIRMA o recebimento e
 * manda o jogador de volta ao Duarte. Marco não precisa de opção/efeito de
 * entrega — o handshake é a visita.
 *
 * SUSSURRO (sem marker, planta a pista — QUESTS.md/DESIGN-MUNDO): a balsa que não
 * cruza e Pontal na outra margem. A Q4 já MOSTRA isso (a viagem é a lição); a fala
 * de Marco dá o nome à promessa macro sem apontar nada no mapa. Revisitar depois
 * da quest aprofunda o rumor (princípio 3 do portfólio).
 */
import type { NpcDialogue } from "../shared";
import { TCHAU } from "../shared";

/** O olho do vigia mede o forasteiro — varia com ter ou não uma vocação. */
function sizeUp(cls: string): string {
  return cls === "classless"
    ? "Ele te mede de cima a baixo, sem pressa. “Ainda verde. A estrada cura isso ou não cura.” "
    : "Ele reconhece o porte de quem já escolheu um caminho. “Pelo menos sabe o que é.” ";
}

export const marco: NpcDialogue = {
  root(quests, cls) {
    const q4 = quests.get("q4_entrega");

    // Pacote recém-entregue (a Simulation já creditou a etapa `talk:marco`, então
    // a Q4 está em `report`): confirma e devolve o jogador ao Duarte.
    if (q4 && q4.stage === "report") {
      return {
        text:
          "O vigia recebe o fardo lacrado sem abrir, pesa-o na mão e faz que sim. " +
          "“Do Duarte. Chegou inteiro — é o que importa.” Acena o queixo pro rio. " +
          "“Volta e diz a ele que está em Atalaia. E olha bem antes de ir: aquela " +
          "balsa não cruza faz tempo. Do outro lado é Pontal. Um dia, quem sabe.”",
        options: [
          { id: "marco_pontal", label: "Por que a balsa não cruza?" },
          TCHAU,
        ],
      };
    }

    // Já fez a Q4 (voltou depois): banter de sentinela — o rumor evoluiu.
    if (q4 && q4.stage === "completed") {
      return {
        text:
          "“De novo por aqui. O rio não muda — só a gente.” Marco volta os olhos " +
          "à correnteza. “Pontal continua ali, do outro lado. A balsa, parada. " +
          "Há quem diga que não é falta de balseiro… é que ninguém quer atravessar.”",
        options: [
          { id: "marco_pontal", label: "O que houve com Pontal?" },
          TCHAU,
        ],
      };
    }

    // Sem a Q4 (ou ainda na etapa do Duarte): o vigia na ponta da estrada. Planta
    // o sussurro de Pontal — descoberta, não tarefa.
    return {
      text:
        sizeUp(cls) +
        "“Atalaia. Eu vigio a estrada leste — mas confesso que olho mais o rio. " +
        "Tem uma balsa ali que não atravessa faz anos. Do outro lado, telhados: " +
        "Pontal. Perto dos olhos, longe dos pés.”",
      options: [
        { id: "marco_pontal", label: "Fala mais dessa balsa." },
        TCHAU,
      ],
    };
  },

  choose(optionId, quests, _cls) {
    if (optionId === "marco_pontal") {
      const q4 = quests.get("q4_entrega");
      // Pós-Q4 o sussurro adensa (revisitar paga — princípio 3 do portfólio).
      if (q4 && q4.stage === "completed") {
        return {
          view: {
            text:
              "“Pontal não caiu nem queimou. Só… fechou. A balsa apodrece amarrada " +
              "e ninguém manda consertar. Carga que ia pra lá agora some na estrada " +
              "do sul — pergunta ao Duarte, ele anda perdendo fardo. O rio guarda " +
              "mais segredo que a muralha, forasteiro.”",
            options: [TCHAU],
          },
        };
      }
      return {
        view: {
          text:
            "“Balsa velha, corda boa, e mesmo assim ninguém cruza. Eu fico aqui " +
            "contando os dias em que ela não se mexe.” Ele dá de ombros, o olhar " +
            "no outro barranco. “Pontal espera. As coisas, às vezes, só esperam.”",
          options: [TCHAU],
        },
      };
    }
    return { view: null };
  },
};
