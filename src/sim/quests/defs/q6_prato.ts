/**
 * Q6 — O Prato do Cozinheiro (QUESTS.md §"Cidade de Alvorada" Q6; XP/gold da
 * bateria M1 + passe-1 de gold). Direta, sem requisitos.
 *
 * Bartolo (estalajadeiro-cozinheiro — Bento fundido nele, NPCS.md jun/2026) pede
 * carne de verdade pra encher a panela; a recompensa é o pulo do sistema de
 * comida: cru → cozido → RECEITA. O jogador caça carne (Lobo às vezes / Javali
 * sempre), ENTREGA o lote ao Bartolo e os dois COZINHAM juntos na fogueira fixa
 * da estalagem (interação de mundo).
 *
 * IDs EXTERNOS referenciados (tsc não valida strings — conferidos à mão):
 *  - npcs (cast.ts):        "bartolo" (giver + turn-in da entrega)
 *  - items (templates.ts):  "carne_de_caca" (CARNE_DE_CACA — loot de lobo/javali/urso)
 *  - interactableIds:       "q6_fogueira_estalagem" (a fogueira fixa da Estalagem
 *                           do Vau; a emissão `interact` é plantada na alvorada.ts
 *                           na Fase 1e — o motor só DEFINE a etapa)
 *  - species:               nenhuma direta (a carne vem do loot de lobo/javali, não
 *                           de uma etapa `kill`)
 *
 * NOTA — recompensas NÃO-materiais: "receita do Ensopado" (1ª buff food, modelo
 * Licensed Chef) e "destrava trade de ingredientes/pratos prontos" do Bartolo são
 * gated por ESTA quest estar `completed` (mesmo padrão do bounty da Q5 / dos
 * traders pós-quest), lidos pelo comércio/cozinha downstream — não há campo de
 * reward pra eles aqui (rewards só carrega xp/gold/items/grantsKey). Por isso só
 * xp+gold no def; o conhecimento permanente mora no gating de quem o consome.
 */
import type { QuestDef } from "../index";

export const q6_prato: QuestDef = {
  id: "q6_prato",
  name: "O Prato do Cozinheiro",
  layer: "direta",
  giverNpcId: "bartolo",
  // talk (aceitar com Bartolo) → entregar 4 Carnes de Caça ao Bartolo →
  // cozinhar juntos na fogueira fixa da estalagem (interact) → report (Bartolo
  // ensina a receita e passa a comprar ingredientes). A última etapa fechando
  // joga a quest pra `report` (o motor paga no report→completed).
  stages: [
    { type: "talk", npcId: "bartolo" },
    { type: "collect", templateId: "carne_de_caca", count: 4, turnInNpcId: "bartolo" },
    { type: "interact", interactableId: "q6_fogueira_estalagem" },
  ],
  rewards: { xp: 100, gold: 30 },
  journalActive:
    "Bartolo bateu a colher na panela vazia: “Pão eu tenho. O que falta é carne de verdade — caça, não essa miséria de celeiro. Traz quatro cortes e eu te mostro o ensopado da casa.”",
  journalCompleted:
    "O cozinheiro me ensinou o ensopado da casa. Disse que compra o que eu caçar.",
};
