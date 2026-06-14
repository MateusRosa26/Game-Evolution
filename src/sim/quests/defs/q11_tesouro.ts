/**
 * Q11 — O Tesouro do Bando / *The Brigands' Hoard* (QUESTS.md §Sul).
 *
 * Camada ABERTA-POR-ITEM → longa maturação: sem NPC giver, sem marker. O gatilho
 * é a **Carta Rabiscada** (loot RARO do Bandido da Estrada): o jogador LÊ e
 * descobre — a carta aponta a Fortaleza Abandonada (fecha na fatia ③). XP/gold
 * diretos = **0** (paga em baú/conhecimento/registro — orçamento de XP do doc).
 *
 * IDs EXTERNOS referenciados:
 *   - items:          "carta_rabiscada"  (CARTA_RABISCADA — items/templates.ts; loot raro do `bandido`)
 *   - npcs:           NENHUM (aberta-por-item — não há giver/turn-in; `giverNpcId: ""`)
 *   - species:        "bandido"          (BANDIDO — bestiary.ts; dropa a carta @ chance 0.005) — referência de design, não citada em stage
 *   - interactableId: "q11_carta_rabiscada" (stage de leitura — a Fase 1e/futuro hook planta o ancoradouro)
 *   - regionId:       NENHUM
 *
 * ─── LIMITAÇÃO DO MOTOR (stub mínimo — anotada, sem inventar mecânica) ───────
 * Esta quest é "aberta-por-item": deveria AUTO-INICIAR quando o jogador saqueia
 * E LÊ a `carta_rabiscada`. O motor staged (quests/index.ts) **NÃO tem gatilho
 * item→quest**: `QuestEvent` só cobre kill/talk/interact/region_enter, e quests
 * só entram no `quests` do player via efeito de diálogo `acceptQuest` (um `talk`)
 * ou pelo helper de teste `__debugAcceptQuest`. NÃO há evento de "item adquirido"
 * nem de "item lido" em parte alguma da Simulation. Como NÃO existe NPC giver
 * (`giverNpcId: ""` — sentinela que nunca casa um npcId no diálogo), hoje esta
 * quest **não tem como iniciar pelo fluxo normal** — fica registrada para o seu
 * texto de descoberta existir no diário (o troféu) e para o futuro hook.
 *
 * STAGE ÚNICO (stub): um `interact` em "q11_carta_rabiscada" — o ATO DE LER a
 * carta saqueada — é o ancoradouro honesto: quando o gatilho item→quest existir
 * (ou um `interact` plantado pela leitura do item), ele emite esse id e fecha a
 * descoberta → `report`. As etapas seguintes do doc (chegar à Fortaleza, achar o
 * esconderijo/cavar, abrir o baú do bando) vivem na **fatia ③** (Fortaleza
 * Abandonada, que ainda NÃO existe) — fora de escopo aqui, NÃO modeladas.
 */
import type { QuestDef } from "../index";

export const q11_tesouro: QuestDef = {
  id: "q11_tesouro",
  name: "O Tesouro do Bando",
  layer: "aberta", // aberta-por-item → sem contador, sem marker (a leitura é a quest)
  // Sem NPC: o gatilho é a Carta Rabiscada (item), não uma conversa. String vazia
  // = sentinela que nunca casa um npcId no diálogo (ver LIMITAÇÃO no topo).
  giverNpcId: "",
  // Stub mínimo: LER a carta saqueada (drop raro do `bandido`) registra a
  // descoberta. As etapas da Fortaleza (interact/cavar → baú) são da fatia ③.
  stages: [{ type: "interact", interactableId: "q11_carta_rabiscada" }],
  // Q11 NÃO paga XP/gold direto (orçamento do doc): paga em baú na Fortaleza
  // (fatia ③) — recompensa de item fica para quando aquela fatia existir.
  rewards: { xp: 0, gold: 0 },
  journalActive:
    "Um bandido carregava uma carta rabiscada: o bando guarda o pagamento na “fortaleza velha”. Que fortaleza?",
  journalCompleted:
    "A carta dizia a verdade — o tesouro do bando estava na fortaleza velha, atrás de tudo o que ela esconde.",
};
