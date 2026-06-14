/** Vincente — treinador de Ladino (rito R3, NPCS.md). */
import { makeTrainer } from "../shared";

export const vincente = makeTrainer("rogue", "rito_rogue", {
  className: "Ladino",
  pitch:
    "Vincente sorri de canto. “O Beco não confia em currículo. Tem uns ratos que ninguém quer sujar a mão — suje a sua. Seis, sem plateia. Aí a gente fala de rito.”",
  trialLabel: "Sem plateia. Combinado.",
  onAccept: "“Se alguém te vir, não fui eu que pedi. E nada de sorte — habilidade.”",
  reportLabel: "Conta saldada.",
  ritoLabel: "Me ensine a sumir.",
  ritoPrompt:
    "“Ninguém viu, ninguém soube. É o tipo de gente que eu treino. Pronto pra pagar a entrada?”",
  confirm: "“Sem juramento, sem testemunha. Você entra no Beco e sai outro.”",
  banter: "“Olho vivo. No Beco, quem relaxa vira história curta.”",
});
