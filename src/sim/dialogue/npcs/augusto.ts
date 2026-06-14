/**
 * Augusto — prefeito da Alvorada, na Câmara (Baixa). Voz: administrador atarefado
 * e meio político — orgulhoso do que ergueu, na defensiva quanto ao cofre, sempre
 * empurrando o que é de ferro e sangue pra Guarda.
 *
 * PAPÉIS (cast.ts: roles []): cenário/flavor PURO — sem quest no MVP, sem loja.
 * Logo NÃO há aqui `acceptQuest`/`completeQuest`/`turnInStage`/`openShop`, nem
 * import de QUESTS/isQuestAvailable: ele não tem questId pra gatear (decisão de
 * elenco, jun/2026 — NPCS.md/GRID.md: "Augusto cortado" como quest-giver; a vibe
 * da muralha INACABADA virou fala do Capitão Vidal). Augusto sobrevive como o
 * dono do prédio da Câmara — dá a leitura CIVIL da mesma muralha (cofre, papelada,
 * cidade que cresce mais rápido que o muro) e, no fim, planta a semente de que um
 * dia haverá trabalho de verdade saindo daqui (✏️ "futura quest-hub" do GRID),
 * SEM oferecer nada: descoberta, não tarefa, sem marker.
 *
 * NÃO PISAR NO VIDAL: o capitão é quem diz "a muralha consome tudo" (Q5/Q8) — o
 * soldado exausto sem homens. Augusto é o lado oposto da mesma moeda: quem assina
 * a verba e não a tem; manda quem quer "defender a cidade" falar com a Guarda (é
 * por isso, diegeticamente, que ele não tem quest). As duas vozes se completam,
 * não se repetem.
 *
 * Ciência de classe: classless ouve o discurso de boas-vindas do prefeito;
 * quem já escolheu um caminho ganha o aceno político de quem reconhece utilidade.
 * Falas pt-BR = rascunho de tom (✏️ Loremaster afina).
 */
import { type NpcDialogue, TCHAU } from "../shared";

export const augusto: NpcDialogue = {
  root(_quests, cls) {
    // Ciência de classe no fecho da saudação: ao classless, o prefeito vende a
    // cidade; a quem já tem vocação, mede a utilidade com olho de quem precisa de
    // braços (mas não tem nada pra dar — ainda).
    const arremate =
      cls === "classless"
        ? "Chegou agora, pelo jeito. Sem ofício ainda? A Alvorada faz e desfaz gente — escolha bem de que lado da pá você fica."
        : "Vejo que já tem um ofício. Bom. A cidade anda curta de gente que sirva pra alguma coisa.";
    return {
      text:
        "Augusto ergue os olhos de uma pilha de papéis e ajeita o colarinho, " +
        "mais por hábito que por vaidade. “Augusto, prefeito desta… ambição " +
        "chamada Alvorada. Bem-vindo à Câmara. Aqui se assina o que a cidade " +
        "promete — e se sofre pelo que ela não cumpre.” Ele suspira. “" +
        arremate + "”",
      options: [
        { id: "aug_muralha", label: "Por que a muralha está inacabada?" },
        { id: "aug_cidade", label: "Que cidade é essa, Alvorada?" },
        { id: "aug_trabalho", label: "Há trabalho pra mim aqui?" },
        TCHAU,
      ],
    };
  },

  choose(optionId, _quests, cls) {
    // A muralha — a leitura CIVIL (cofre/verba), não a militar. Augusto empurra a
    // parte de ferro e sangue pra Guarda de propósito: é a costura com o Vidal.
    if (optionId === "aug_muralha") {
      return {
        view: {
          text:
            "Ele dá um riso curto, sem graça nenhuma. “Inacabada? Está PAGA pela " +
            "metade, que é coisa diferente. Pedra custa, pedreiro custa, e o cofre " +
            "só sabe minguar. Toda moeda que entra some no muro — e o muro nunca " +
            "fecha.” Aponta a janela, pro lado do Quartel. “Quem cuida do que " +
            "trepa por cima dela é a Guarda. Procure o Capitão Vidal se o seu " +
            "assunto for lâmina. O meu, infelizmente, é só tinta e número.”",
          options: [
            { id: "aug_cidade", label: "E a cidade, cresce?" },
            { id: "aug_trabalho", label: "Há trabalho pra mim aqui?" },
            TCHAU,
          ],
        },
      };
    }

    // A cidade — Alvorada que cresce mais rápido que as próprias defesas, no vau
    // do rio. Atmosfera de fronteira (DESIGN-LORE/MUNDO), sem entregar gancho.
    if (optionId === "aug_cidade") {
      return {
        view: {
          text:
            "“Alvorada nasceu de um vau — um lugar raso onde dava pra cruzar o rio " +
            "a pé. Onde se cruza um rio, junta-se gente; onde junta-se gente, " +
            "ergue-se uma cidade.” O orgulho dura um instante e logo azeda. “Cresce " +
            "rápido demais, é esse o problema. Casa nova todo mês, boca nova toda " +
            "semana — e a muralha do mesmo tamanho de dez anos atrás. A gente avança " +
            "mais rápido do que se protege. Sempre foi assim, na orla do mapa.”",
          options: [
            { id: "aug_muralha", label: "E a muralha, então?" },
            { id: "aug_trabalho", label: "Há trabalho pra mim aqui?" },
            TCHAU,
          ],
        },
      };
    }

    // O "futura quest-hub" do GRID: planta a semente SEM oferecer nada. Augusto
    // reconhece que um dia a Câmara terá serviço de verdade — mas hoje ele só tem
    // papel. Manda o que é urgente pra Guarda/oficios. Descoberta, não tarefa.
    if (optionId === "aug_trabalho") {
      const reconhecimento =
        cls === "classless"
          ? "Volte quando tiver decidido o que é — homem de espada, de feitiço, de fé, sei lá. Gente sem rumo eu já tenho de sobra na fila."
          : "Um dia vou precisar de alguém exatamente como você. Hoje, o que eu tenho é dívida e promessa — e disso não se paga ninguém.";
      return {
        view: {
          text:
            "Augusto encosta as costas na cadeira e te avalia, demorado, como quem " +
            "calcula um custo. “Trabalho da Câmara? Hoje, não. O que eu tenho é " +
            "papelada, e papelada não pede coragem — pede paciência, e essa eu " +
            "guardo pra mim.” Bate de leve na pilha de documentos. “Mas anote o que " +
            "vou dizer: esta cidade vai dar serviço a gente capaz, e vai dar logo. " +
            "Quando der, é desta mesa que sai.” Uma pausa. “" + reconhecimento + "” " +
            "Aponta a porta com o queixo. “Por ora, se quer ser útil, fale com a " +
            "Guarda ou com quem tem ofício na Baixa. Eu só assino o que eles fazem.”",
          options: [TCHAU],
        },
      };
    }

    return { view: null };
  },
};
