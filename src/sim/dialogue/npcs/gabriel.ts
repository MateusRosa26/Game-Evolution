/** Gabriel — treinador de Sacerdote (rito R4, NPCS.md). */
import { makeTrainer } from "../shared";

export const gabriel = makeTrainer("priest", "rito_priest", {
  className: "Sacerdote",
  pitch:
    "Gabriel te encara com uma calma desconcertante. “Há ossos que ainda andam, e ninguém os culpa. Cinco. Devolva-os ao silêncio — com piedade, não ódio. Então falaremos.”",
  trialLabel: "Eu os farei descansar.",
  onAccept: "“Piedade, lembre. Quem golpeia com raiva carrega a raiva de volta.”",
  reportLabel: "Eles descansam.",
  ritoLabel: "Aceito a vocação.",
  ritoPrompt:
    "“Você os deitou sem crueldade. Isso eu vi. A vocação não é poder — é peso. Carrega comigo?”",
  confirm: "“Estenda as mãos. A luz que pedir vai cobrar o mesmo de você.”",
  banter: "“A luz pesa. Carregue-a com cuidado — e descanse quando puder.”",
});
