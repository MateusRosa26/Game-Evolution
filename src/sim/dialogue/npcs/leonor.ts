/** Leonor — treinadora de Mago (rito R2, NPCS.md). */
import { makeTrainer } from "../shared";

export const leonor = makeTrainer("mage", "rito_mage", {
  className: "Mago",
  pitch:
    "Leonor vira uma página sem te olhar. “Talento eu não vendo — disciplina, talvez ensine. Cinco morcegos, as asas intactas. Traga, e veremos se há mente aí dentro.”",
  trialLabel: "Trarei as asas.",
  onAccept: "“Intactas, eu disse. Quem esmaga a asa esmaga o eco. Vá.”",
  reportLabel: "As asas estão aqui.",
  ritoLabel: "Quero o caminho arcano.",
  ritoPrompt:
    "“Hm. Pesa certo. Você colhe com cuidado — raro. O rito, então. Você paga; eu nunca esqueço uma dívida.”",
  confirm: "“Repita o nome que eu te der, e não o esqueça. O arcano não perdoa hesitação.”",
  banter: "“Estude. O que você ainda não entende vai te matar primeiro.”",
});
