/**
 * Tobias — o bêbado da Taverna do Cais (sussurrador, gatilho de Q12 — NPCS.md).
 *
 * Amarração canônica (DESIGN-MUNDO): é "o velho Tobias" do rumor-exemplo —
 * voltou rico de onde ninguém volta e bebeu a fortuna; seus rumores são verdade
 * vivida, não fofoca. NÃO é mercador (sem NEGOCIAR) nem treinador: o papel dele
 * é PLANTAR a pista de Q12 (Os Corvos do Moinho), uma quest da camada ABERTA —
 * sem marker, só descoberta.
 *
 * Q12 é staged: talk(tobias) → region_enter(moinho_porao) → interact → report.
 * Como a 1ª etapa é `talk:tobias`, aceitar a quest JÁ credita o `talk` (a
 * Simulation faz isso no efeito `acceptQuest`), então a quest se assenta no
 * diário direto na etapa de achar o porão — o rumor é o gatilho, não uma ordem.
 * Q12 não tem `requires`, mas a oferta passa por `isQuestAvailable` mesmo assim
 * (padrão correto p/ gating de cadeia/ato). O fecho volta a ele: não há entrega
 * de item, e a sim só paga o XP num `completeQuest` — Tobias é o `giverNpcId`,
 * então reportar a ele é o que fecha a quest (e confirma o destino de Jonas).
 *
 * Ciência de classe: Tobias é um bêbado, não liga pra sua via — o rumor é
 * idêntico pra todos. A classe só muda um tempero de banter (já-classe leva uma
 * alfinetada do bêbado; classless é tratado como mais um do cais).
 *
 * Falas = rascunho dos docs (QUESTS.md §Q12 / NPCS.md) — ✏️ Loremaster afina o tom.
 */
import { type NpcDialogue, TCHAU } from "../shared";
import { QUESTS, isQuestAvailable } from "../../quests";

export const tobias: NpcDialogue = {
  root(quests, cls) {
    const q12 = quests.get("q12_corvos");

    // Pós-quest: o porão visto, a verdade na mesa. Luto pelo Jonas + o elo da
    // ponte (Q9) plantado, sem marker — quem juntar as duas entende tudo.
    if (q12?.stage === "completed") {
      return {
        text:
          "Então você desceu… e voltou. Pouca gente volta, moço. O Jonas não " +
          "teve essa sorte. Aquelas botas que pisaram o porão dele pisam a ponte " +
          "do sul também — pergunte ao rio quem passa por lá de noite.",
        options: [TCHAU],
      };
    }

    // Achou o porão (etapa interact fechou → report): falta fechar comigo.
    // Não há entrega; reportar a Tobias é o que paga o XP (completeQuest).
    if (q12?.stage === "report") {
      return {
        text:
          "Tem cheiro de mofo e de corvo em você. Achou o moinho, não achou? " +
          "Senta aqui. Me conta o que tinha lá embaixo — eu pago a próxima rodada.",
        options: [
          { id: "q12_report", label: "O porão. E as marcas de bota." },
          TCHAU,
        ],
      };
    }

    // Quest aceita e em andamento: já soltei o que sabia. Não aponto o caminho
    // (camada aberta) — só empurro a memória, embriagada, pro sul.
    if (q12?.stage === "active") {
      return {
        text:
          "Os corvos, moço… ainda penso neles. O moinho fica na estrada do sul, " +
          "onde a roda parou de girar. Vai lá com luz. E não conta que fui eu " +
          "que mandei — eu não mandei nada, eu só bebo.",
        options: [TCHAU],
      };
    }

    // Ainda não plantei a pista. Divago bêbado e abro a brecha pra puxar o rumor.
    const offerable = isQuestAvailable(quests, QUESTS.q12_corvos);
    const banter =
      cls !== "classless"
        ? "Armado e tudo, hein. Pois é, ferro não espanta o que mora naquele moinho. "
        : "";
    return {
      text:
        banter +
        "Mais uma rodada e eu te conto onde o ouro vai parar… ou onde ele some. " +
        "Eu sei dessas coisas. Já voltei de onde ninguém volta — e olha onde " +
        "fui parar: nesse caneco.",
      options: [
        ...(offerable
          ? [{ id: "tobias_jonas", label: "O que sabe que os outros não sabem?" }]
          : []),
        TCHAU,
      ],
    };
  },

  choose(optionId, _quests, _cls) {
    // Puxa o rumor: o bêbado baixa a voz e desfia a pista do moinho. Encerra
    // numa última opção que ASSENTA a quest (sem ordem, sem marker — descoberta).
    if (optionId === "tobias_jonas") {
      return {
        view: {
          text:
            "Baixa a voz. O Jonas, o moleiro… sumiu faz duas luas. E os corvos? " +
            "Os corvos não desgrudam do moinho. Corvo não fica onde não tem o que " +
            "comer, moço. Pensa nisso.",
          options: [
            { id: "tobias_corvos", label: "Vou dar uma olhada nesse moinho." },
            { id: "bye", label: "Você bebeu demais, velho." },
          ],
        },
      };
    }
    // Aceitar = a pista entra no diário. A sim cria a quest e já credita o
    // `talk:tobias` (1ª etapa), assentando-a direto na etapa de achar o porão.
    if (optionId === "tobias_corvos") {
      return {
        view: {
          text:
            "Olha por baixo da roda. O que os corvos guardam não é pão. E se " +
            "achar bota onde devia ter farinha… não fui eu que te disse.",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q12_corvos" },
      };
    }
    // Reportar o que achou no porão: fecha a quest comigo (paga o XP). A sim só
    // efetiva se a quest estiver em `report`. A verdade dura sobre o Jonas.
    if (optionId === "q12_report") {
      return {
        view: {
          text:
            "Um baú que os corvos velavam… e marcas de bota de bando. Eu sabia. " +
            "O Jonas não sumiu, moço — foi tirado. Bebe comigo à memória dele, " +
            "que ninguém mais vai.",
          options: [TCHAU],
        },
        effects: { completeQuest: "q12_corvos" },
      };
    }
    return { view: null };
  },
};
