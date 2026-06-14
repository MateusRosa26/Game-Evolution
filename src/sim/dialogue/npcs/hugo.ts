/**
 * Hugo — mineiro aposentado, sussurrador PURO (canto da Baixa). Voz: pó de pedra
 * na garganta; fala da mina como de um morto querido (NPCS.md).
 *
 * Papel duplo, mas leve: NÃO é quest giver de balcão. É o velho que quebra o
 * "sexto sentido de utilidade" (Disco Elysium) — conversar com ele é DESCOBERTA,
 * não checklist. Por isso Q13 (Minas Perdidas) é camada ABERTA: sem marker, sem
 * contador. O diálogo só PLANTA a pista (a viagem É a quest) e, no fim, recebe a
 * notícia de volta. Sem loja (sussurrador puro: a opção NEGOCIAR não existe).
 *
 * Q13 (defs/q13_minas.ts) — etapas: talk(hugo) → region_enter(minas_perdidas) →
 * interact(q13_bau_guardado) → talk(hugo, report). O `acceptQuest` aqui derruba
 * o rumor no diário; a sim credita a 1ª etapa `talk` ao falar (creditQuestEvent),
 * avançando pro `region_enter`. Como é aberta, o andamento NÃO mostra tally —
 * só repete a pista de onde procurar (referências localizáveis do QUESTS.md:
 * além do vau, onde os carrinhos enferrujam).
 *
 * Ciência de classe: classless e já-classe ouvem o MESMO velho (o rumor não é
 * privilégio de classe) — mas quem já trilhou um caminho ganha uma meia-linha de
 * reconhecimento. Falas pt-BR = rascunho de tom (✏️ Loremaster afina).
 */
import { QUESTS, isQuestAvailable } from "../../quests";
import { type NpcDialogue, TCHAU } from "../shared";

export const hugo: NpcDialogue = {
  root(quests, cls) {
    const q13 = quests.get("q13_minas");

    // Ainda não plantamos o rumor (ou voltou antes de o aceitar).
    if (!q13) {
      // Gating de cadeia: Q13 não tem `requires`, mas respeitamos isQuestAvailable
      // por higiene (se um dia ganhar pré-requisito, o velho cala a boca sozinho).
      const open = isQuestAvailable(quests, QUESTS.q13_minas);
      if (!open) {
        return {
          text:
            "O velho mexe o cascalho com a bota e não levanta os olhos. " +
            "“Tem coisa que a gente só conta quando o ouvinte já viu o bastante.”",
          options: [TCHAU],
        };
      }
      const ouvir =
        cls === "classless"
          ? "O que aconteceu com a mina?"
          : "Fala da mina, velho."; // já-classe: mais direto, sem cerimônia
      return {
        text:
          "Pó de pedra na voz, os dedos lembram o cabo da picareta. “Mineiro eu " +
          "fui, moço. Bom, dos bons — até no dia em que as picaretas começaram a " +
          "responder.” Ele para. “Você não tem cara de quem se assusta fácil.”",
        options: [{ id: "q13_ask", label: ouvir }, TCHAU],
      };
    }

    // Rumor plantado, viagem em curso (region_enter → interact). Camada aberta:
    // SEM contador — só a pista de onde procurar, repetida com a mesma saudade.
    if (q13.stage === "active") {
      return {
        text:
          "“Já foi lá em cima? Depois do vau, onde os carrinhos enferrujam. " +
          "A boca da mina não fugiu — quem some é quem entra.” Ele aperta os olhos. " +
          "“Desce até onde o ar fica frio. Lá embaixo é que o veio dorme.”",
        options: [TCHAU],
      };
    }

    // Todas as etapas de campo cumpridas (abriu o baú guardado): falta contar
    // ao velho — o report fecha a quest (completeQuest paga o XP de aberta).
    if (q13.stage === "report") {
      return {
        text:
          "Hugo te mede de cima a baixo, e algo no rosto dele afunda. “Você voltou. " +
          "Da mina, voltou.” Engole em seco. “Então conta. Conta tudo.”",
        options: [{ id: "q13_done", label: "Achei a mina. E o que mora nela." }, TCHAU],
      };
    }

    // Pós-quest: o velho já sabe o fim, e carrega junto.
    const luto =
      cls === "classless"
        ? "“Cuida desses ouvidos, moço. Eles ainda vão te servir.”"
        : "“Você desceu e subiu. Poucos fazem as duas coisas.” Ele assente, devagar.";
    return {
      text:
        "“Então as picaretas ainda respondem.” Ele olha pro chão, como quem reza. " +
        "“Eu fiz bem em fechar. E você fez bem em ver com os próprios olhos.” " +
        luto,
      options: [TCHAU],
    };
  },

  choose(optionId, _quests, _cls) {
    // Planta o rumor: aceita Q13 (cai no diário como pista, sem marker). A 1ª
    // etapa `talk(hugo)` é creditada pela sim ao falar — o estado já entra
    // rumando pro region_enter, daí o texto de despedida aponta o caminho.
    if (optionId === "q13_ask") {
      return {
        view: {
          text:
            "“Fechamos a mina quando as picaretas começaram a responder. Mas o " +
            "veio… o veio ainda está lá em cima. Depois do vau, onde os carrinhos " +
            "enferrujam.” A voz baixa. “Ninguém volta pra contar por quê. Talvez " +
            "você volte.”",
          options: [TCHAU],
        },
        effects: { acceptQuest: "q13_minas" },
      };
    }

    // Report: o velho ouve, e a notícia o atravessa. completeQuest paga o XP
    // (o loot de verdade veio do baú guardado, não daqui).
    if (optionId === "q13_done") {
      return {
        view: {
          text:
            "Ele ouve sem interromper. No fim, fecha os olhos um instante. " +
            "“Os carrinhos. Eu sabia que ainda estavam lá. E o som… o som que " +
            "responde.” Aperta seu braço com a mão de calo. “Obrigado. Por ver. " +
            "Carrega isso por mim — eu já carreguei demais.”",
          options: [TCHAU],
        },
        effects: { completeQuest: "q13_minas" },
      };
    }

    return { view: null };
  },
};
