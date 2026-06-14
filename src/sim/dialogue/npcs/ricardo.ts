/** Ricardo — treinador de Cavaleiro (rito R1, NPCS.md). */
import { makeTrainer } from "../shared";

export const ricardo = makeTrainer("knight", "rito_knight", {
  className: "Cavaleiro",
  pitch:
    "Ricardo te mede de cima a baixo. “O aço não se promete, se prova. Há ratos demais no porão pra um homem só — me traga seis a menos. Aí conversamos sobre rito.”",
  trialLabel: "Aceito a prova.",
  onAccept: "“Desce, bate, volta inteiro. O difícil não é matar rato — é não tremer.”",
  reportLabel: "Está feito.",
  ritoLabel: "Faça de mim um Cavaleiro.",
  ritoPrompt:
    "“Mãos firmes. Já vi recruta vomitar no primeiro osso — você, não. Pronto pro rito, então?”",
  confirm: "“Ajoelha. O aço que empunhar daqui em diante responde por você — e você por ele.”",
  banter: "“Mantém o braço firme, soldado. O aço não descansa, nem você.”",
});
