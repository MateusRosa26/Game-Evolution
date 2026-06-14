/**
 * Q14 — As Pedras de Passagem / *The Stepping Stones* (QUESTS.md §Sul).
 *
 * Camada SEGREDO (nunca anunciada): sem NPC giver, sem marker, sem contador. O
 * gatilho são as **pedras de passagem escondidas no junco** (travessia ④ do
 * layout — o caminho curioso) que o jogador NOTA sozinho (telegrafia sutil no
 * cenário). Ensina que o mapa tem travessias que ninguém anuncia (prepara a ⑤,
 * a galeria alagada do esgoto). Nível-alvo 5+ é só telegrafia (os fundeiros do
 * Juncal atiram através da água) — sem `requires`. XP/gold diretos = **0**: paga
 * em baú escondido + registro no diário + o conhecimento da travessia (atalho
 * permanente do jogador) — orçamento de XP do doc (segredos não pagam em XP).
 *
 * IDs EXTERNOS referenciados:
 *   - items:          NENHUM (sem etapa collect; a recompensa é baú no mundo + registro, não item do QuestDef)
 *   - npcs:           NENHUM (segredo — não há giver/turn-in; `giverNpcId: ""`)
 *   - species:        NENHUM (sem etapa kill)
 *   - interactableId: "q14_pedras"        (as pedras de passagem no junco — a Fase 1e planta o ancoradouro em alvorada.ts)
 *   - regionId:       "q14_margem_leste"  (o pouso da travessia ④ na margem leste — a Fase 1e planta a região em alvorada.ts)
 *
 * NOTA de placement (1e): a região é PREFIXADA `q14_` de propósito. A "margem
 * leste" do rio é alcançável por VÁRIAS rotas (a Ponte ① e a galeria alagada do
 * esgoto ⑤ também emergem lá — ver alvorada.ts); um `region_enter` da margem
 * inteira dispararia pela ponte/esgoto, não pela travessia das pedras. O id
 * próprio amarra a região ao POUSO específico da travessia ④ (o pé leste das
 * pedras), preservando o significado da quest: o conhecimento DESTA travessia.
 *
 * O **baú escondido na margem leste** (recompensa-chave do doc) é um container de
 * loot do mundo (B-series, posição ✏️ M3), NÃO uma recompensa do QuestDef — por
 * isso `rewards.items` fica vazio: abrir o baú é um ato à parte; o registro no
 * diário (journalCompleted) é o troféu da quest.
 *
 * ─── LIMITAÇÃO DO MOTOR (mesma de Q11 — anotada, sem inventar mecânica) ──────
 * Sendo SEGREDO sem NPC, esta quest deveria AUTO-INICIAR quando o jogador NOTA as
 * pedras (examinar/aproximar). O motor staged (quests/index.ts + Simulation.ts)
 * **NÃO tem gatilho objeto→quest de INÍCIO**: `creditQuestEvent` só AVANÇA quests
 * que JÁ estão no `quests` do player (itera o map existente), e uma quest só ENTRA
 * nesse map via efeito de diálogo `acceptQuest` (um `talk`) ou pelo helper de teste
 * `__debugAcceptQuest`. Não há evento de "interagiu com X → começa a quest" nem
 * "entrou na região Y → começa a quest". Como NÃO existe NPC giver (`giverNpcId:
 * ""` — sentinela que nunca casa um npcId no diálogo), hoje esta quest **não tem
 * como iniciar pelo fluxo normal** — fica registrada para o texto de descoberta
 * existir no diário (o troféu) e para o futuro hook objeto→quest. As etapas abaixo
 * (examinar as pedras → alcançar a margem leste) são os ancoradouros HONESTOS: uma
 * vez ativa, os hooks `interact`/`region_enter` (Simulation.interact /
 * checkRegionEnter, plantados na Fase 1e) a fazem progredir até `report` — sem NPC
 * para reportar, a quest fecha no registro do diário (igual ao terminal de Q11).
 */
import type { QuestDef } from "../index";

export const q14_pedras: QuestDef = {
  id: "q14_pedras",
  name: "As Pedras de Passagem",
  layer: "segredo", // segredo → nunca anunciado, sem contador, sem marker
  // Sem NPC: o gatilho são as pedras escondidas no junco, não uma conversa. String
  // vazia = sentinela que nunca casa um npcId no diálogo (ver LIMITAÇÃO no topo).
  giverNpcId: "",
  // interact (NOTAR/examinar as pedras escondidas no junco) → region_enter
  // (atravessar e ALCANÇAR a margem leste) → report. O baú da margem leste é um
  // container de mundo à parte (B-series, M3); o registro no diário é o troféu.
  stages: [
    { type: "interact", interactableId: "q14_pedras" },
    { type: "region_enter", regionId: "q14_margem_leste" },
  ],
  // Q14 NÃO paga XP/gold direto (orçamento do doc — segredos pagam em baú,
  // conhecimento e registro). O baú escondido é loot de mundo, não item do QuestDef.
  rewards: { xp: 0, gold: 0 },
  journalActive:
    "Há pedras firmes escondidas no junco — uma travessia que ninguém anuncia. Para onde levam, do outro lado da água?",
  journalCompleted:
    "O junco esconde pedras firmes. Atravessei: a margem leste guarda mais do que parece.",
};
