/**
 * Q15 — O Porão Afogado / *The Drowned Cellar* (QUESTS.md §Esgotos · §Cidade).
 *
 * Camada SEGREDO (nunca anunciada): sem NPC giver, sem marker, sem contador. O
 * gatilho é a **passagem alagada** no A2 — um mergulho curto (mão-única) que
 * quase ninguém nota — e desce ao A3, o Porão Afogado: bolsão minúsculo, breu, 1–2
 * Ghouls (T3). Não é spot de farm, é arrepio: o 1º sussurro da Contaminação POR
 * BAIXO (rima com a Água do Poço/Q10 sem se tocarem). XP/gold diretos = **0** —
 * paga em conhecimento (registro no diário) + loot dos ghouls (família-coração da
 * fatia ②, fora deste escopo).
 *
 * IDs EXTERNOS referenciados:
 *   - npcs:           NENHUM (segredo — não há giver/turn-in; `giverNpcId: ""`)
 *   - species:        "ghoul"   (BESTIARY — src/sim/bestiary.ts; T3 undead, já spawnado no A3
 *                                por buildSewerA3 em alvorada.ts) — referência de design/arrepio,
 *                                NÃO citada em stage (a recompensa do segredo é o registro, não um kill).
 *   - regionId:       "porao_afogado_a3"  (o andar A3 / z=−3 — a Fase 1e adiciona ao `regions`
 *                                do FloorLayer de buildSewerA3 em alvorada.ts; emissão `region_enter`
 *                                já existe na Simulation).
 *   - interactableId: NENHUM citado em stage (ver alternativa na LIMITAÇÃO).
 *   - items:          NENHUM (sem etapas collect; o loot dos ghouls é tabela do bestiário, não reward de quest).
 *
 * ─── LIMITAÇÃO DO MOTOR (anotada, sem inventar mecânica) ─────────────────────
 * Segredo SEM ponto de partida normal. Como Q11 (aberta-por-item), esta quest não
 * tem NPC giver — então não há `talk`/`acceptQuest` que a coloque no `quests` do
 * player. O motor staged só INSERE uma quest pelo efeito de diálogo `acceptQuest`
 * (um `talk`) ou pelo helper de teste `__debugAcceptQuest`. O `creditQuestEvent`
 * (kill/talk/interact/region_enter) apenas AVANÇA quests que o player JÁ possui
 * (`for (const [id, st] of quests)`), nunca cria uma.
 *
 * DIFERENÇA p/ Q11: aqui o gatilho de descoberta É suportado pelo motor — a etapa
 * é um `region_enter` em "porao_afogado_a3", e a Simulation JÁ emite `region_enter`
 * (entrar de novo é one-shot por personagem). O que falta é só o AUTO-START: um
 * "auto-aceitar ao mergulhar/entrar" não existe (não há gatilho de descoberta que
 * insira a quest). Quando esse hook existir (auto-aceitar segredo ao tocar a
 * passagem alagada / entrar no A3), esta etapa fecha sozinha → `report` (e como é
 * a ÚNICA etapa, a quest já vira `completed` sem precisar de NPC pra pagar — XP/gold
 * são 0). Até lá, a quest fica registrada para o seu texto de descoberta existir no
 * diário (o troféu) e para o futuro hook. Alternativa de ancoragem igualmente honesta:
 * um `interact` na própria passagem alagada (ex.: "q15_passagem_alagada") — escolhi
 * `region_enter` no A3 porque "estar no Porão" É a descoberta, e o mergulho é mão-única.
 */
import type { QuestDef } from "../index";

export const q15_porao: QuestDef = {
  id: "q15_porao",
  name: "O Porão Afogado",
  layer: "segredo", // segredo → nunca anunciado, sem contador, sem marker
  // Sem NPC: o gatilho é a passagem alagada (física), não uma conversa. String
  // vazia = sentinela que nunca casa um npcId no diálogo (ver LIMITAÇÃO no topo).
  giverNpcId: "",
  // Etapa única: ENTRAR no Porão Afogado (A3) — o mergulho mão-única é a
  // descoberta. region_enter é emitido pela Simulation; a Fase 1e adiciona
  // "porao_afogado_a3" ao `regions` do A3 (buildSewerA3 em alvorada.ts). Os ghouls
  // já vivem lá (placement do mapa) — o arrepio é o conteúdo, o registro é a paga.
  stages: [{ type: "region_enter", regionId: "porao_afogado_a3" }],
  // Segredo NÃO paga XP/gold direto (orçamento do doc): paga em conhecimento
  // (registro) + loot dos ghouls (tabela do bestiário — recompensa de item da
  // família-coração fica para a fatia ②, fora daqui).
  rewards: { xp: 0, gold: 0 },
  journalActive:
    "Há uma passagem alagada lá embaixo, no esgoto — um mergulho que ninguém faz. Algo me diz que tem mais fundo.",
  journalCompleted:
    "Mergulhei onde ninguém mergulha. Algo apodrece sob o povoado — e anda.",
};
