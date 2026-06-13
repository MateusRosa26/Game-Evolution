# Plano de implementação — Fatia ① Alvorada (swarm, jun/2026)

> Documento de execução. O **design** está fechado nos `design/fatia-1-alvorada/*` (GRID/QUESTS/NPCS/ITENS-LOOTS/ESGOTOS/MOBILIA-URBANA, todos aprovados). Aqui mora **o que falta codar** e **como o swarm vai rodar**. Atualizar conforme as fases fecham.

## Diagnóstico (13/jun/2026)

O motor e o **mapa** da Alvorada estão prontos. `src/sim/maps/alvorada.ts` já monta o overworld 340×340 (rio, travessias, estradas, muralha, edifícios, 12 spots) **e os 3 andares de esgoto A1/A2/A3** (z-levels, portais, monstros, luz). O client renderiza tudo. **O gap é conteúdo-como-dados + render de mobília + calibração**, não arquitetura.

| Sistema | Estado | Gap |
|---|---|---|
| Mapa (over + esgoto + portais) | ✅ | afinar coords vendo rodar |
| Motor de quest | ⚠️ só etapa `kill` única | etapas `collect`/`interact`/`region_enter`/cadeia/multi-ato |
| Quests | 5/15 (Q1 + R1–R4) | Q2–Q15 como dados |
| IA de mob | só `chaser` | `territorial` (javali), `shooter` (goblin fundeiro) |
| Bestiário | 11 espécies | `aranha`, `goblin_fundeiro`, `ghoul`; reconciliar `bandido`↔`bandido_da_estrada` |
| NPCs diálogo | 5/18 | 12 diálogos (Bento fundido em Bartolo) |
| Comércio | esqueleto p/ 5 | sortimentos + gating dos 7 traders |
| Itens | 23 templates | quest items, armadura/escudo T1–T2, reagentes, peles, mochila |
| Baús | 4 de teste | 8 reais B1–B8 + casa-inicial |
| Mobília urbana | `MapDecor.kind="torch"` só | kinds + sprites + render + placement |
| Números | placeholder | calibração (Balancista) |

**Mismatch crítico achado:** os spots S7 (`aranha`), S9 (`goblin_fundeiro`), S11 (`bandido_da_estrada`) e o esgoto A2 (`aranha`) referenciam espécies que **não existem** em `bestiary.ts` (ou nome divergente) → o filtro `if (!(species in CREATURES)) continue` faz esses spots spawnarem **nada** hoje.

## Regra de orquestração

`sim` é o **gargalo sequencial** (vários arquivos compartilhados: `quests.ts`, `dialogue.ts`, `bestiary.ts`, `maps/alvorada.ts`); client/mobília e verificação **paralelizam**. O fan-out de verdade vem da **modularização dos registries** (Fase 0c): com 1 arquivo por quest/NPC, N agentes autoram em paralelo sem colidir. Único ponto de colisão em `shared/`: `types.ts` (`MapDecor.kind`) — tocado UMA vez, primeiro, na Fase 2a.

## Fases

### Fase 0 — Motor (sequencial, fundacional)
- **0a. Quest engine staged.** `QuestDef` vira lista ordenada de `stages` (`talk`/`kill`/`collect`/`interact`/`region_enter`), com multi-ato; `QuestState` rastreia stage atual + progresso; `creditQuestKill`→`creditQuestEvent` (kill/collect/interact/region). Wire em `Simulation.ts` (onde kill/interact/region são emitidos) + `dialogue.ts` (acessos a `def.kill`). Preserva snapshot/diário (`JournalPanel`/protocol). Migra Q1 + R1–R4 pro novo shape. **DoD:** `tsc` verde + Q1/ritos completáveis (smoke headless).
- **0b. Bestiário + IA.** Add `aranha` (T2), `goblin_fundeiro` (`shooter`, T1→T2), `ghoul` (T3, undead — substitui placeholder esqueleto no A3); reconcilia `bandido`/`bandido_da_estrada`. Implementa `territorial` (neutro até apanhar — javali) e `shooter` (ataque à distância através da água) em `monsterAi.ts` + dispatch na `Simulation`. **DoD:** `tsc` verde + S7/S9/S11 + A2/A3 spawnam.
- **0c. Modulariza registries.** `QUESTS`→`quests/defs/*.ts`+barrel; `DIALOGUES`→`dialogue/npcs/*.ts`+barrel; `COMMERCE`→`npc/commerce/*.ts`+barrel. Preserva comportamento. **DoD:** `tsc` verde. (Habilita o fan-out.)

### Fase 1 — Conteúdo-dados (fan-out paralelo; depende de 0)
- **1a. Itens & loot** (1 agente — `items/templates.ts` + loot em `bestiary.ts`): quest items (pacote, carta_rabiscada, sucata_de_arma marcada, orelha_de_goblin), reagentes (asa_de_morcego, glandula_de_veneno, seda), peles (pele_de_lobo, couro_grosso, presa_de_javali), carne_de_caca, osso, faca_de_esfolar, mochila (recompensa Q2), armadura/escudo T1–T2 (EQUIPAMENTO.md). Preenche loot tables das espécies (ITENS-LOOTS.md).
- **1b. Quests Q2–Q15** (N agentes paralelos, 1 por quest em `quests/defs/`): cada um autora seu módulo conforme `QUESTS.md` (stages, XP/gold já calibrados no doc, journal PT). Depende de 0a (shape) + 1a (item ids) + cast (npcIds).
- **1c. Diálogos** (N agentes paralelos, 1 por NPC em `dialogue/npcs/`): Nina, Silas, Duarte, Vidal, Amaro, Abel, Tobias, Telmo, Hugo, Rosa, Marco, Augusto. Wire às quests. Depende de 0a/0c + 1b.
- **1d. Comércio** (1 agente, `commerce/`): sortimentos dos 7 traders gated por quest (ITENS-LOOTS §mapa de comércio). Depende de 1a + 1b.
- **1e. Placement** (1 agente, sim — `alvorada.ts`, sequencial): npcSpawns dos 13 NPCs faltantes nas coords do GRID (treinadores pros distritos canônicos); 8 baús reais B1–B8 (substitui teste) com loot/locks/level; containers domésticos da casa-inicial + 1ª chave; Presa-Torta no Matagal (respawn longo). Depende de tudo acima.

### Fase 2 — Mobília urbana (client, paralelo ao sim)
- **2a.** `shared/types.ts` `MapDecor.kind` união (barril, caixa, cerca, tenda, poco, balcao, placa, braseiro, boneco_treino, estacas, saco, lenha) — toque único em shared, primeiro.
- **2b.** `sprites.ts` `make*()` procedurais (S→A→B tier, MOBILIA-URBANA.md).
- **2c.** `WorldRenderer.ts` cases por kind + colisão.
- **2d.** placement na `alvorada.ts` (feira ao redor do poço, fachadas viram lojas) — sim-owned, depois de 2a–2c + 1e.

### Fase 3 — Calibração (Balancista)
Baterias headless: curva XP 1→8 com quests (orçamento forte do QUESTS.md), economia gold ponta-a-ponta (rito 150 → arco early), loot rates (M2), food uptime. Ajusta `balance.ts`/`formulas.ts`/números do bestiário.

### Fase 4 — Verificação final
`tsc`; playtests headless da sim (criar player → completar Q1 + 1 rito → descer esgoto → abrir baú → comprar/vender). Visual da mobília = **flag p/ review humano** (WebGL headless = tela preta). Relatório de execução.

## Skills como veto (passos dentro das fases)
designer-de-sistemas (shape do quest engine, 0a) · world-designer (placement, 1e/2d) · diretor-de-arte (mobília, 2) · balancista (3) · loremaster (nomes/flavor já nos docs — agentes consomem).

## Fora de escopo
Cidades 2–4; arte PixelLab nova de char/mob (usa o existente + fallback procedural); efeito real de Marcas/Mutações; save/load; day/night.

## Decisões deste passe (sem perguntar — review no final)
- Branch de trabalho: `feat/alvorada-conteudo` (off `recover/esgoto-128`). Não mergeia na `main` — fica pro review.
- Recuperados 21 candidatos de char apagados no crash (`design/pixellab-candidatos/chars/`) — regra "não apagar candidatos sem OK" + propósito do branch `recover/`.
- Swarm rodado via motor de Workflow (não o skill genérico) por causa da regra sim-sequencial + autonomia sem checkpoints humanos.
