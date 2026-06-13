/**
 * Q12 — Os Corvos do Moinho / *The Crows of the Mill* (QUESTS.md §Sul).
 *
 * Camada ABERTA (da v3): sem marker no mapa. O gatilho é o sussurro de Tobias,
 * o bêbado da Taverna do Cais ("o velho Tobias" do rumor-exemplo de
 * DESIGN-MUNDO) — daí o `talk` de abertura que assenta a quest no diário. Os
 * corvos que não desgrudam do moinho são atmosfera (render no mundo, NÃO um
 * kill): não existe espécie `corvo` no bestiário, e o spec não pede caça.
 *
 * Fluxo (3 beats do doc): falar com Tobias (o rumor) → achar o moinho velho e
 * descer ao porão (region_enter) → o baú escondido + os sinais de bandidos
 * (interact: restos de acampamento, a trilha aponta pra ponte). A última etapa
 * fecha → `report` (o XP cai na conclusão).
 *
 * Cross-link Q9 (A Estrada Roubada): os sinais de bota apontam a ponte dos
 * bandidos — as duas quests se iluminam sem `requires` entre elas (grafo de
 * gating: Q12 fica em "demais → sem pré-requisito"). Jonas, o moleiro sumido, é
 * só citado (fora do elenco; cast.ts) — "não sumiu, foi tirado".
 *
 * Recompensa: **150 XP** + o **baú escondido** (1 dos da base piramidal — gear
 * incomum/utilitários). O baú é objeto de MUNDO plantado pela Fase 1e/M3, NÃO um
 * payout do QuestDef → sem `items`/`grantsKey` aqui. Gold = 0 (QUESTS.md §gold:
 * "Abertas/segredos (Q11–Q15): 0 gold direto — pagam em baú/conhecimento/
 * registro"). Contador no diário: nenhum — etapas talk/region/interact não
 * contam (e a camada é aberta de qualquer forma).
 *
 * IDs EXTERNOS referenciados:
 *  - npcs (cast.ts):            tobias  (giver — o sussurro que abre a quest)
 *  - regionIds:                 "moinho_porao"      (descer ao porão do moinho — Fase 1e planta na alvorada.ts)
 *  - interactableIds:           "q12_moinho_porao"  (a cena: baú escondido + sinais de bandidos — idem Fase 1e)
 *  - items/species/requires:    — (nenhum: recompensa = baú de mundo; corvos = render, não kill; quest sem cadeia)
 */
import type { QuestDef } from "../index";

export const q12_corvos: QuestDef = {
  id: "q12_corvos",
  name: "Os Corvos do Moinho",
  layer: "aberta",
  giverNpcId: "tobias",
  // talk (o rumor de Tobias abre a quest) → region_enter (descer ao porão do
  // moinho) → interact (baú escondido + sinais de bandidos) → report. A emissão
  // de region_enter/interact vem na fatia 0a-bis; os ids "moinho_porao" e
  // "q12_moinho_porao" são plantados na alvorada.ts (Fase 1e).
  stages: [
    { type: "talk", npcId: "tobias" },
    { type: "region_enter", regionId: "moinho_porao" },
    { type: "interact", interactableId: "q12_moinho_porao" },
  ],
  rewards: { xp: 150, gold: 0 },
  journalActive:
    "Tobias arrastou a voz por cima do caneco: “O Jonas sumiu faz duas luas. E os corvos… os corvos não desgrudam do moinho. Corvo não fica onde não tem o que comer.”",
  journalCompleted:
    "O porão do moinho: um baú que os corvos guardavam e marcas de bota de bando. Jonas não sumiu — foi tirado.",
};
