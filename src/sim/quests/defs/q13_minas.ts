/**
 * Q13 — Minas Perdidas / *Forsaken Mines* (QUESTS.md §Nordeste; mesmo nome do POI).
 *
 * Camada ABERTA (rumor, sem marker): Hugo, o mineiro aposentado, é um sussurrador
 * puro — conversar com ele é descoberta, não checklist (NPCS.md). A quest é uma
 * EXPLORAÇÃO: a viagem É a quest. Achar a boca da mina no canto NE remoto (além do
 * vau, "onde os carrinhos enferrujam"), descer (T1→T2) até o baú guardado no fundo,
 * e voltar ao velho com a notícia. Sem contador (regra jun/2026: só as diretas
 * mostram contagem) e sem item/kill rastreado — só lugares.
 *
 * IDs EXTERNOS referenciados (tsc não valida strings — conferidos à mão):
 *   - npcs (npc/cast.ts):        hugo   (giver + report — "mineiro aposentado", sussurrador puro)
 *   - regionIds (alvorada.ts):   minas_perdidas      (a boca da mina no NE remoto — S8/P23,
 *                                já esboçada em alvorada.ts ~L488; a Fase 1e fecha a região +
 *                                emite `region_enter`. Par canônico EN: "Forsaken Mines")
 *   - interactableId (alvorada): q13_bau_guardado    (o baú guardado no fundo da mina — a
 *                                Fase 1e planta o baú real B-* e o ancoradouro de interact)
 *   - requires:                  NENHUM (rumor disponível a quem conversa com Hugo)
 *   - items / species:           NENHUM (sem item de quest, sem kill rastreado)
 *   - grantsKey:                 NENHUM
 *
 * Recompensa: **250 XP** (QUESTS.md §Orçamento de XP — paga como aberta, acima da
 * camada direta) + **0 gold direto**. O loot de verdade (gear incomum + gold alto)
 * vem do **baú guardado** no fundo (item de mundo plantado na Fase 1e — orçamento de
 * baús M3), NÃO de `rewards.items` — abertas/segredos pagam em baú, igual a Q9/Q11/Q12.
 *
 * Camada vs. enum: o doc classifica Q13 como "aberta"; o enum de `layer` tem
 * direta/aberta/segredo — `aberta` direto (aberta nunca mostra contador).
 */
import type { QuestDef } from "../index";

export const q13_minas: QuestDef = {
  id: "q13_minas",
  name: "Minas Perdidas",
  layer: "aberta",
  giverNpcId: "hugo",
  // talk (ouvir o rumor de Hugo) → ENTRAR na boca da mina no NE remoto
  // (region_enter — a viagem É a quest) → descer (T1→T2) e abrir o baú guardado
  // no fundo (interact) → report (voltar contar ao velho Hugo). A região
  // "minas_perdidas" e o ancoradouro "q13_bau_guardado" são plantados na
  // alvorada.ts (Fase 1e); a emissão de region_enter/interact já roda no motor.
  stages: [
    { type: "talk", npcId: "hugo" },
    { type: "region_enter", regionId: "minas_perdidas" },
    { type: "interact", interactableId: "q13_bau_guardado" },
    { type: "talk", npcId: "hugo" },
  ],
  rewards: { xp: 250, gold: 0 },
  journalActive:
    "Hugo fechou a mina quando “as picaretas começaram a responder”. O veio ainda está lá em cima, depois do vau, onde os carrinhos enferrujam. Ninguém volta pra contar por quê.",
  journalCompleted:
    "Achei a mina do velho Hugo. Os carrinhos ainda estão lá. O que “responde” lá embaixo também.",
};
