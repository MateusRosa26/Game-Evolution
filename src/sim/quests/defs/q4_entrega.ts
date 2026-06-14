/**
 * Q4 — A Entrega do Ferreiro (QUESTS.md §Leste, XP/gold do §Orçamento — bateria
 * M1 + 1º passe de gold). Direta: Duarte manda um pacote lacrado a Marco, o
 * vigia de Atalaia, na estrada leste. A VIAGEM é a lição (mostra a Ponte, a
 * balsa fechada e Pontal na outra margem). Abre A Estrada Roubada (Q9), que
 * gateia por `requires: ["q4_entrega"]`.
 *
 * IDs EXTERNOS referenciados:
 *  - npcs (cast.ts): "duarte" (giver), "marco" (entrega em Atalaia)
 *  (sem items/species/interactableIds/regionIds rastreados — ver nota abaixo)
 *
 * STAGING: cadeia de talks (talk Duarte → talk Marco), no mesmo molde do Q1
 *   (`[talk, kill]`) e da cadeia NPC-em-NPC do Q9. O retorno final a Duarte é o
 *   lifecycle `report` (o giver paga) — NÃO uma etapa extra, igual ao talk de
 *   report do Q1.
 * NOTA (pacote): o "pacote" do doc é flavor — o template PACOTE existe
 *   (templates.ts, category "quest"), mas o motor staged não concede item numa
 *   etapa `talk` nem o `collect` casaria (collect exige o bolso JÁ ter o item, e
 *   nada o entrega no aceite). Sem inventar mecânica, o pacote fica narrativo; se
 *   o motor ganhar "talk concede item" + "collect consome no destino", trocar a
 *   2ª etapa por `collect pacote → marco`.
 */
import type { QuestDef } from "../index";

export const q4_entrega: QuestDef = {
  id: "q4_entrega",
  name: "A Entrega do Ferreiro",
  layer: "direta",
  giverNpcId: "duarte",
  // talk (Duarte: recebe o pacote) → talk (Marco, vigia de Atalaia: entrega) →
  // report (volta ao Duarte, que paga). Ver STAGING no cabeçalho.
  stages: [
    { type: "talk", npcId: "duarte" },
    { type: "talk", npcId: "marco" },
  ],
  rewards: { xp: 75, gold: 25 },
  journalActive:
    "Duarte empurrou um fardo lacrado pelo balcão: “Leva ao Marco, o vigia de Atalaia, na estrada leste. Cruza a ponte e segue o rio — e não abre.”",
  journalCompleted:
    "Atalaia vigia uma balsa que não cruza. Do outro lado do rio, telhados: Pontal. Um dia.",
};
