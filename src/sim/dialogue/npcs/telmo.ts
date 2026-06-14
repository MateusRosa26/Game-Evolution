/**
 * Telmo — taverneiro da Taverna do Cais (NPCS.md). Papéis: `merchant` (bebida +
 * comida simples; sortimento vive em COMMERCE, não aqui) + `whisperer`.
 *
 * Voz: ouve o cais inteiro, fala o mínimo — neutralidade de balcão. Não dá nem
 * recebe quest: é ELO da cadeia Q9 (A Estrada Roubada). A etapa dele é um `talk`
 * (Duarte → Vidal → **Telmo** → caçar os bandidos), e o crédito desse `talk`
 * acontece na Simulation ANTES de `root()` rodar (ao abrir o diálogo) — então
 * aqui não há efeito: Telmo só REAGE ao estado, soltando a pista (descoberta,
 * sem marker) de quem anda gastando demais, e apontando a ponte do sul.
 *
 * IDs EXTERNOS referenciados (tsc não valida strings — conferidos à mão):
 *   - quests (QUESTS): q9_estrada (Telmo é a 3ª etapa `talk`, stageIndex 2)
 *
 * Como o `talk:telmo` já foi creditado quando este `root()` roda, o jogador que
 * acaba de chegar pra ouvir a pista aparece com a etapa JÁ avançada para a de
 * caça (stageIndex 3). Por isso a pista é servida em `stageIndex >= 2`: cobre o
 * instante exato em que Telmo "fala" (e o re-visitar enquanto caça os bandidos).
 */
import { type NpcDialogue, TCHAU, NEGOCIAR } from "../shared";

export const telmo: NpcDialogue = {
  root(quests, cls) {
    const q9 = quests.get("q9_estrada");

    // Elo da cadeia Q9: só fala da estrada DEPOIS que o jogador passou por Vidal
    // (stageIndex 2 = a etapa de Telmo; o crédito do `talk` a empurra pra 3, a de
    // caça). Antes disso (sem Q9, ou ainda em Duarte/Vidal) ele não sabe de nada.
    if (q9 && q9.stage === "active" && q9.stageIndex >= 2 && q9.stageIndex <= 4) {
      // Etapa de caça/recuperação em aberto → a pista (o rumor que o cais soltou).
      return {
        text:
          "Você que o Capitão mandou. Ele me conhece — eu não esqueço uma cara que " +
          "paga com prata nova. Teve um sujeito desses semana passada, três deles, " +
          "bebendo como quem roubou e não como quem trabalhou. Pegaram a estrada do " +
          "sul, pra banda da ponte. Mais que isso eu não vi — e não vi nada, se " +
          "alguém perguntar.",
        options: [NEGOCIAR, TCHAU],
      };
    }

    // Pós-pista (caça/carga já em report ou quest concluída): balcão neutro, mas
    // ele lembra que falou — e nada mais sai dele de graça.
    if (q9 && (q9.stage === "report" || q9.stage === "completed")) {
      return {
        text:
          "Já te disse o que ouvi. O resto da estrada não é assunto de balcão. " +
          "Bebe alguma coisa ou abre caminho pra quem tem sede.",
        options: [NEGOCIAR, TCHAU],
      };
    }

    // Balcão padrão. Neutralidade de quem ouve tudo e repete nada — uma pitada de
    // ciência de classe, sem revelar nada.
    const cabeca =
      cls === "classless"
        ? "Sem brasão, sem fama — do jeito que eu gosto. Aqui ninguém te deve nada e você não deve a ninguém."
        : "Bebem todos igual no meu balcão, com brasão ou sem.";
    return {
      text:
        `${cabeca} Tenho bebida e o que sobrou da panela. ` +
        "O resto eu guardo pra mim.",
      options: [NEGOCIAR, TCHAU],
    };
  },

  choose(optionId, _quests, _cls) {
    if (optionId === "trade") {
      // Fecha a janela de diálogo; a Simulation abre a loja (efeito openShop).
      return { view: null, effects: { openShop: true } };
    }
    return { view: null };
  },
};
