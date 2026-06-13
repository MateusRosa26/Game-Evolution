/**
 * Rosa — guia da casa inicial (cidade de spawn). A PRIMEIRA voz do jogo (NPCS.md):
 * acolhe sem mastigar. Papel único: `guide` — sem quest, sem loja, sem rumor.
 *
 * Ela é o tutorial DIEGÉTICO dos três verbos da casa (decidido p/ a fatia ①):
 * container → chave → porta. Mas o jogo é "difícil, opaco e recompensador, sem
 * tutorial que segura a mão" (DESIGN-FILOSOFIA, Teste da Mastigação): Rosa NÃO
 * manda apertar tecla, NÃO aponta marker, NÃO rastreia objetivo. Ela é uma
 * anfitriã — fala da arca, da chave e da porta como COISAS da casa que agora são
 * suas, e deixa a mão do jogador fazer o resto. O verbo se aprende AGINDO, não
 * ouvindo; a fala só dá a primeira ponta do fio.
 *
 * Por ser guia pura, root/choose não tocam em quest nenhuma — mas seguem o
 * contrato `NpcDialogue` (funções do estado). O eixo que importa aqui é a CLASSE:
 *  - classless (recém-nascido, antes de qualquer rito): recebe o acolhimento e o
 *    tutorial dos três verbos, num menu que ele puxa no próprio ritmo
 *    (descoberta, não sequência forçada), e uma última ponta — a cidade tem
 *    quem o faça encontrar a própria vocação (os ritos, sem dizer "rito").
 *  - já-classe (voltou à casa-tutorial depois de trilhar uma via): banter curto,
 *    o ninho que ficou pequeno. Não repete o tutorial pra quem já saiu pro mundo.
 *
 * Falas pt-BR = rascunho de tom dos docs (NPCS.md §Rosa) — ✏️ Loremaster afina.
 */
import { type NpcDialogue, TCHAU } from "../shared";

export const rosa: NpcDialogue = {
  root(_quests, cls) {
    // Já trilhou uma via: o mundo já o pegou. Rosa só acena de longe — sem
    // tutorial, porque a casa-ninho já cumpriu o papel dela.
    if (cls !== "classless") {
      return {
        text:
          "Rosa ergue os olhos do tear e sorri, sem surpresa. “Olha só quem o " +
          "mundo já mordeu. Tinha futuro, eu disse. A cama continua sua, sempre " +
          "que precisar voltar pra ela.”",
        options: [TCHAU],
      };
    }

    // Recém-nascido (classless): acolhimento + abertura do tutorial. As opções
    // são as PONTAS dos três verbos — o jogador puxa a que quiser, na ordem que
    // quiser. Nada some depois de ouvido: pode revisitar (não é checklist).
    return {
      text:
        "“Acordou.” Rosa pousa a lançadeira. “Não, não me agradeça — só apontei o " +
        "caminho de casa quando te acharam na estrada. Esta é sua, por ora: cama, " +
        "telhado, e o pouco que se deixa pra quem começa do zero. Olha em volta " +
        "antes de sair — o que é seu, ninguém devolve duas vezes.”",
      options: [
        { id: "rosa_arca", label: "Aquela arca ali, ao pé da cama…" },
        { id: "rosa_chave", label: "E como se abre o que está trancado?" },
        { id: "rosa_porta", label: "Lá fora — por onde se começa?" },
        TCHAU,
      ],
    };
  },

  choose(optionId, _quests, _cls) {
    // CONTAINER — a arca. Rosa não diz "abra a arca": diz que é sua e que dentro
    // tem o começo. Abrir, mexer, tirar o que há — é o jogador que descobre o
    // gesto. (O verbo "container" nasce da curiosidade, não da ordem.)
    if (optionId === "rosa_arca") {
      return {
        view: {
          text:
            "“É sua. Toda casa tem uma — onde se guarda o que importa e o que " +
            "ainda não serve. Abre, remexe, tira o que for teu. Não há muito: " +
            "quem começa, começa leve. Mas o que está dentro está dentro por " +
            "um motivo.”",
          options: [
            // Encadeia pro próximo verbo SEM forçar — uma ponte natural (a arca
            // guarda uma chave), mas a opção de sair existe sempre.
            { id: "rosa_chave", label: "Achei uma chave aqui dentro." },
            TCHAU,
          ],
        },
      };
    }

    // CHAVE — o elo entre o que se acha e o que se abre. Ela explica a IDEIA da
    // chave (uma coisa que serve a uma fechadura), não o atalho de uso. Aponta de
    // volta pra porta sem dizer "use a chave na porta".
    if (optionId === "rosa_chave") {
      return {
        view: {
          text:
            "“Uma chave?” Ela ri baixo. “Então a casa te recebeu de verdade. " +
            "Chave não vale pelo ferro, vale pela fechadura que combina com ela. " +
            "Guarda bem — neste mundo, o que está trancado costuma valer o " +
            "trabalho de achar com o que abrir.”",
          options: [
            { id: "rosa_porta", label: "Tem uma porta trancada ali." },
            TCHAU,
          ],
        },
      };
    }

    // PORTA — a saída. Fecha o tutorial dos três verbos e abre o mundo: aponta
    // (sem marker) que a cidade tem quem ajude o sem-rumo a achar a própria
    // vocação — a semente dos ritos, plantada sem nunca dizer "rito".
    if (optionId === "rosa_porta") {
      return {
        view: {
          text:
            "“A porta dá pra Alvorada. Lá fora não tem quem te segure a mão — " +
            "nem eu seguro. Você é o quê, ainda? Nada, e tudo bem: ninguém nasce " +
            "espada ou reza. Mas tem gente nesta cidade que sabe ver o que um " +
            "ainda-não-é pode virar. Procura. E não cruza essa soleira sem o que " +
            "é teu — o mundo não espera quem volta buscar.”",
          options: [TCHAU],
        },
      };
    }

    return { view: null };
  },
};
