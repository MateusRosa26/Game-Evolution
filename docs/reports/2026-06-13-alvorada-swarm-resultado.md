# Alvorada — resultado da implementação por swarm (13/jun/2026)

> Execução autônoma do plano `2026-06-13-plano-implementacao-alvorada.md` via swarm multi-agente (motor de Workflow), 6 fases. Branch **`feat/alvorada-conteudo`** — **NÃO mergeado na `main`** (aguarda review do criador). Tudo verde: `tsc` + `npm run build` (prod) + 3 smokes headless + boot do client (0 erros).

## O que foi feito (6 commits)

| Commit | Fase | Conteúdo |
|---|---|---|
| `cfc9cae` | **0 — Motor** | Quest engine STAGED (etapas talk/kill/collect/interact/region_enter + multi-ato + `requires` + rewards items/key); hooks de mundo `interact` (reach-based, reusa openChest) + `region_enter` (one-shot); bestiário +aranha/+ghoul, IA `territorial` (javali), **regra de nome singular** (sem goblin_fundeiro/bandido_da_estrada; orc_soldado→orc, urso_pardo→urso); registries `QUESTS`/`DIALOGUES`/`COMMERCE` modularizados (1 arquivo/entidade). |
| `a6c0d13` | **1A — Itens+Quests** | 49 templates (armadura/escudo T1-T2, reagentes, peles, quest items, mochila); loot tables preenchidas; **Q2–Q15** (+ atos q7/q8) como dados, XP/gold = QUESTS.md. |
| `1cab930` | **1B — NPCs** | 12 diálogos novos (17 NPCs falantes; Bento fundido no Bartolo); gating `requires` (Q8 pós-Q5, Q9 pós-Q4); comércio real dos 7 traders, gated por quest. |
| `7f9abf9` | **1C — Placement** | 17 NPCs nas coords do GRID; 8 baús B1-B8 + casa inicial; 7 interactables + 6 regions (todo id de quest existe no mapa); Presa-Torta no Matagal. |
| `12ebd83` | **2 — Mobília** | 12 props procedurais (feira + fachadas-loja + cercas + pátio + obras); colisão na sim; 81 decor (44 bloqueantes). |
| `6a90779` | **3 — Calibração** | Fix dos números dos ritos (xp 50/gold 0/custo 150); relatório de medição (TTK, XP/h, gold/h, curva 1→8). |

## Verificação (Fase 4)

- `npx tsc --noEmit`: **verde**.
- `npm run build` (tsc + vite build de produção): **PASS** (1086 módulos; único aviso = tamanho de chunk, informativo).
- Smokes headless `tools/_smoke-*.ts`: **3/3 PASS** — placement (0 órfão quest↔mapa), mobília-colisão (44 bloqueiam, cidade atravessável, NPCs não soterrados), quest-hooks (interact+region avançam, one-shot).
- Boot do client (Playwright, `localhost:5173`): **0 erros**, canvas 1280×720, WebGL ativo.
- Contagens do mapa: **22 quests · 17 NPCs · 10 baús (8 B1-B8) · 66 mobs (+Presa-Torta) · 95 decor (44 block) · 7 interactables · 6 regions · 3 andares**, 340×340.

## Precisa do teu olho / feel (a curta lista)

1. **VISUAL da mobília** (procedural) — Praça do Poço + fachadas. Não dá pra validar headless (WebGL = preto). Rodar `npm run dev` e olhar.
2. **Calibração de FEEL** — `docs/reports/2026-06-13-calibracao-alvorada.md` §6 **dimensiona** (não aplica) as opções de re-escala de curva/economia/custo-rito. Decisão tua, com os números na mão.
3. **Nits de placement** (afinar vendo o mapa, estilo GRID): 2 props bloqueantes empilhados em `(133,119)`; 2 tochas sobre prop em `(141,115)`/`(134,123)`.
4. **Warning de runtime no `EquipPanel.layout`** — vem do TEU trabalho de UI pré-existente (commit `a936376`/`a823521`), **não do swarm**; um glance quando mexer no painel.
5. **Ritos** — mudei xp 40→50, recompensa de gold 15→0, `RITO_COST_GOLD` 200→150 pra casar com QUESTS.md. Confere se é o que querias.
6. **Q11 (Tesouro do Bando)** — é aberta-por-item; como não há hook item→quest no motor, ficou stub de descoberta (amadurece na fatia ③ de qualquer forma). Anotado em `q11_tesouro.ts`.
7. **Casa inicial** — a 1ª chave é concedida, mas se não existir sistema de porta-com-fechadura, o "abre a porta de saída" fica pendente (o agente de placement anotou).

## Como revisar

Já estás em `feat/alvorada-conteudo`. `npm run dev` → jogar o loop: nascer na casa inicial (Rosa) → fazer um rito (Ricardo/Leonor/Vincente/Gabriel) → Q1 ratos (Bartolo) → cadeias Q5→Q8 (Vidal) e Q4→Q9 (Duarte) → descer o bueiro da praça (esgoto A1→A2→A3) → comprar/vender (Nina/Silas/Duarte) → abrir baús.

## Notas

- **Regra de nome de mob = singular** registrada na memória (`mob-nomes-singulares`) e aplicada em todo o conteúdo.
- 3 smokes em `tools/_smoke-*.ts` ficam como **regressão** (dá pra formalizar num test runner depois).
- **Fora de escopo** (próximas frentes): cidades 2–4, arte PixelLab nova de char/mob, efeito real de Marcas/Mutações, save/load, day/night.
- **Não mergeei na `main`** — a fatia inteira está na branch pro teu review + merge.
