# Roadmap — do estado atual ao MVP

> Documento de execução (jun/2026). O **design** mora nos `DESIGN-*.md`; aqui mora o **passo a passo** de implementação e a organização do trabalho paralelo. Atualizar conforme as fases fecham.

## Alvo do MVP (decidido — criador, jun/2026)

O **primeiro ato completo do jogo**, jogável de ponta a ponta:

- **3–4 cidades** iniciais (Alvorada é a 1ª — `design/fatia-1-alvorada/`; as 2ª–4ª ainda precisam de world-design).
- **~20–30 criaturas** dos tiers **T1–T3** (subconjunto das 36 já desenhadas em `design/bestiario/FAMILIAS.md`).
- **30–50 quests** (Alvorada já tem 15 + 4 ritos especificados; o resto vem com as outras cidades).
- **Loop de progressão calibrado até o lvl ~25** (≈ T3).
- **Arte PixelLab integrada** (não só procedural).

## Estado atual — a boa notícia

**A arquitetura e todos os motores core estão prontos e o loop roda hoje** (explorar → matar → lootear → subir → quest → equipar). O que falta **não é código de sistema** — é **conteúdo-como-dados + calibração + arte + world-design**, tudo paralelizável.

| Camada | Estado |
|---|---|
| **Motores da sim** (combate, skills, movimento/A*, inventário/equip/containers, progressão/XP, diálogo, quests, tracking de Marcas, andares/z, fome decidida) | ✅ implementados |
| **Client** (render em chunks, y-sort, iluminação, EntityRenderer/interp, 10 painéis de HUD, input, drag&drop) | ✅ implementado |
| **Conteúdo na sim** | ⚠️ mínimo — 2/36 criaturas, **0/15 quests** (Q1 hardcoded), **0/17 NPCs** (1 Bartolo), 0 loot tables, 0 armaduras/consumíveis |
| **Números** | ⚠️ placeholder — skill/combate/loot não calibrados (framework de classe já validado) |
| **Arte** | ⚠️ terreno + 1 mob procedural; 5 mobs + 4 itens em **candidato** PixelLab (não integrados) |
| **Mundo** | ⚠️ Alvorada 340×340 montada (95%) sem NPCs/quests/spots wired; esgotos A1–A3 inexistentes; cidades 2–4 não desenhadas |

## Princípios de execução

1. **Vertical slice primeiro, depois escala.** Fechar o loop jogável numa cidade (Alvorada) antes de multiplicar conteúdo. Valida o loop e de-risca.
2. **Conteúdo = dados, não código** (padrão do projeto). Mob/quest/NPC/item novo = nova entrada declarativa, não nova lógica.
3. **`sim` sequencial ∥ `client` paralelo** (regra do swarm, ver `swarm-worktree-setup`): só **um agente por vez** mexe em `src/sim/` (conflitos de merge); `src/client/`, arte e docs paralelizam à vontade.
4. **Calibrar na sim, por lote** (Balancista): cada leva de conteúdo novo roda bateria headless antes de virar "número de verdade".
5. **Toda regra na sim, apresentação no client, protocolo serializável** (regra de ouro da arquitetura).

---

## As 6 frentes de trabalho (trilhas)

| # | Frente | Onde toca | Paraleliza? | Dono típico |
|---|---|---|---|---|
| **F1** | **Engine** — lacunas de código da sim | `src/sim/` | ❌ sequencial | 1 agente sim |
| **F2** | **Conteúdo-dados** — mobs/quests/NPCs/itens/loot | `src/sim/**` (dados) | ❌ sequencial c/ F1 | 1 agente sim (reveza com F1) |
| **F3** | **Client/UI/Arte** — render, painéis, integração PixelLab | `src/client/`, assets | ✅ paralelo | N agentes client |
| **F4** | **Calibração** — baterias headless | `balance.ts`/`formulas.ts`/`numbers.ts`/`bestiary.ts` | ⚠️ após F1+F2 do lote | Balancista |
| **F5** | **World-design** — mapas, cidades 2–4, spots/baús | `design/`, `src/sim/maps/` | ✅ paralelo (design) | World-designer + Loremaster |
| **F6** | **Infra & organização** — WSL, swarm, limpeza de código/assets/docs | raiz, tooling | ✅ paralelo | 1 passe dedicado |

> Regra de colisão: **F1 e F2 compartilham `src/sim/`** → revezam (um agente sim por vez, ou janelas separadas). F3/F5/F6 rodam em paralelo livre.

---

## Fase 0 — Destravar o conteúdo (engine gaps) + vertical slice

Objetivo: **Alvorada jogável de ponta a ponta** com poucos mobs/quests, mas com todos os sistemas que o conteúdo precisa. Sem isto, escalar conteúdo trava.

**F1 — Engine (código que o conteúdo exige):**
- [ ] **Loot-on-death**: tabela de loot por espécie → itens no cadáver (hoje só dropa gold). `bestiary.ts` (loot table) + `Simulation.onKill`/corpse.
- [ ] **Quests-como-dados**: tirar o Q1 hardcoded → registro declarativo de quests (stages: talk/kill/collect/report, gating, rewards). `src/sim/quests.ts`.
- [ ] **NPCs-como-dados**: registro de NPC (nome, pos, papel, diálogo) carregado do mapa. `src/sim/dialogue.ts` + `maps/alvorada.ts`.
- [ ] **Consumíveis**: usar item → efeito (poção cura, comida sacia). `items/` + `Simulation`.
- [ ] **Alinhar skills de-classadas** (decisão jun/2026): tirar a lista de **magias** iniciais (`skills/kits.ts` — só skills; **o equipamento inicial FICA**), gate de aprendizado por atributo+nível, mecânica do **tomo** (item consome→aprende), **desconto Forma B** (faixa −1 no stat principal) e **retroativo ao classar** (corpo automático recalcula). `formulas.ts`/`progression.ts`/`skills/`.

**F2 — Conteúdo mínimo do slice:**
- [ ] 3–4 mobs T1–T2 como dados (Rato ✓, Esqueleto ✓ + Lobo, Goblin) — copiar o padrão.
- [ ] 4 ritos de classe + 3–4 quests simples como dados.
- [ ] ~5 NPCs-chave (4 treinadores + 1 estalajadeiro) como dados.
- [ ] Loot tables dessas espécies + 1–2 consumíveis (pão, poção pequena).

**F3 — Client/Arte (paralelo):**
- [ ] Integrar candidatos PixelLab dos mobs do slice (Rato/Lobo/Goblin) — `client/assets/pixellab.ts`.
- [ ] Toast de tracking finalizado; nomes de item reais nos containers.

**F4 — Calibração:**
- [ ] **Bateria T2 de skills** (já destravada pelo Esqueleto): dano/custo/cooldown relativo, coeficientes de combate, wands de caster, re-check do one-shot do desconto. Backlog #6 do Balancista.

**F6 — Infra (fazer cedo, destrava o paralelo limpo):**
- [ ] Decidir/executar **migração OneDrive → WSL `~/rpg`** (ver `migracao-onedrive-pendente`) — polling do Vite e worktree swarm sofrem em `/mnt/c`.
- [ ] Validar o **worktree swarm** (`~/rpg-worktrees`, symlink de node_modules) pros 3 agentes.

**✅ Saída da Fase 0:** dá pra criar mob/quest/NPC/item **só adicionando dados**, e o slice de Alvorada é jogável com arte de verdade.

---

## Fase 1 — Alvorada completa (1ª cidade)

**F2 — Conteúdo (dados):**
- [ ] Todas as criaturas T1–T2 da região (~8–10): Lobo, Javali, Goblin/Fundeiro, Morcego, Aranha, Bandido, Orc, Esqueleto, Zumbi.
- [ ] 15 quests + 4 ritos (specs em `QUESTS.md`).
- [ ] 17 NPCs (specs em `NPCS.md`) com diálogos.
- [ ] Loot tables completas (`design/itens/`), armaduras/escudo T1–T2, consumíveis (CONSUMIVEIS.md).
- [ ] Wire dos 12 spots overworld + baús no mapa.

**F1 — Engine (conforme o conteúdo pedir):**
- [ ] **IA além de chaser**: territorial, shooter (Goblin Fundeiro), caster — os mobs desenhados pedem. `monsterAi.ts`.
- [ ] **Andares/z**: transição escada/buraco/portal → 3 andares do **esgoto A1–A3**. `Simulation.transition` + mapas de subsolo.
- [ ] Wands/cajados: auto-attack mágico (cajado/cetro hoje são placeholder).

**F3 — Arte:** integrar todos os candidatos PixelLab (mobs + itens + tilesets esgoto/caverna); sprite do classless ✏️; sprites de armadura no paperdoll.

**F4 — Calibração:** economia gold ponta-a-ponta (150 do rito → arco early); curva 1→8 com quests; loot rates; comida (uptime).

**F5 — World-design:** afinar coords/spawns/baús no editor; densidade de respawn.

**✅ Saída da Fase 1:** Alvorada é uma cidade completa e calibrada (lvl 1→8, T1–T2).

---

## Fase 2 — Escalar até T3 / lvl 25

- [ ] **F2/F4**: criaturas T3 (Ghoul, Lagarto, Aranha grande, etc.) + AI; calibrar curva e dificuldade até lvl 25.
- [ ] **F2**: 2ª leva de quests (as compostas/longas/segredos da Alvorada: Q7–Q15).
- [ ] **F1**: aplicar **efeito** das Mutações (tracking hoje só registra unlock); thresholds reais de Marca.
- [ ] **F4**: re-régua inter-classe no T3; fechar os números de skill ainda ✏️.

## Fase 3 — Cidades 2–4 → a estrada pra dentro + a Capital

> **Reframe pelo espinho de progressão (jun/2026, ver `DESIGN-MUNDO.md` §Progressão do mundo):** "cidades 2–4" **não** são 3 vilas-irmãs da fronteira. O escopo do lançável é **"o primeiro ato até a Capital"** — direção: fronteira (Região 1) → **estrada pra dentro** (1–2 regiões MIDLANDS T3–4, arco ② do Necromante) → **a Capital monumental** como clímax (o "cheguei à civilização", marcado via bind de santuário). Charneca/Brumal seguem como fronteira (**destinos, não berços** — modelo de spawn revisado jun/2026: berço único no MVP = Alvorada, ver `EXPLORACAO.md`); o que muda é que o pós-MVP **aponta inward**, não pra mais fronteira. Cap-alvo ~lvl 35–40.

- [ ] **F5 (design primeiro)**: world-designer + loremaster desenham as cidades 2–4 (mapa, POIs, NPCs, quests) no padrão da fatia-1. **Pré-requisito de tudo abaixo.**
- [ ] **F2/F3**: portar conteúdo dessas cidades (mobs T2–T3, ~15–35 quests, NPCs, mapas).
- [ ] **F1**: conexões entre cidades (rotas, transições de mapa — hoje é 1 mapa só).

## Fase 4 — Loop fechado + polish

- [ ] Conteúdo real de Marcas/Caminhos (substituir DUMMY) + efeitos aplicados.
- [ ] Day/night cycle (modificador de combate noturno hoje é `false` fixo).
- [ ] Save/load (M4 do roadmap original).
- [ ] Passe de áudio/partículas/feedback (M4).
- [ ] Balance final do loop 1→25 com tudo ligado.

---

## Como rodar os 3 agentes (organização)

Hoje rodam 3 em paralelo meio soltos. Organização proposta:

- **Agente A — "Sim"** (sequencial): pega F1+F2 em janelas separadas (um lote de engine, depois um lote de conteúdo). **Único a tocar `src/sim/`.** Commita antes de passar a vez.
- **Agente B — "Client/Arte"** (paralelo): F3 — render, painéis, integração PixelLab. Toca só `src/client/` e assets.
- **Agente C — "Mundo/Design"** (paralelo): F5 — mapas, cidades 2–4, specs; e F6 — limpeza de docs/assets.
- **Balancista** (sob demanda): F4, após cada lote de A.

**Fluxo:** cada agente em seu **worktree** (`~/rpg-worktrees/<frente>`, ver `swarm-worktree-setup`). Sincronizar via `main`: A commita sim → B/C rebasam. Lotes pequenos = menos conflito. **Nunca dois agentes em `src/sim/` ao mesmo tempo.**

## Organização de código / assets / docs (passe F6)

- [ ] **Código**: a arquitetura está sã; o trabalho é só garantir que conteúdo novo entra como **dados** (registries) e não como casos especiais. Conferir que `bestiary.ts`/`templates.ts`/`quests.ts`/diálogo seguem o padrão declarativo ao escalar.
- [ ] **Assets**: mover candidatos PixelLab aprovados de `design/pixellab-candidatos/` → carregados em `client/assets/` (com OK item a item — ver `pixellab-candidatos-nao-deletar`). Padronizar naming (mob 64px, char 32px 1:1, item 32px).
- [ ] **Docs**: manter o padrão hub+sub-docs; doc novo = entrada no `DOCS` de `wiki/wiki.js`. Specs das cidades 2–4 entram em `design/fatia-N-<nome>/` no molde da fatia-1.
- [ ] **Infra**: resolver a migração WSL (Fase 0/F6) antes de escalar o paralelo.

---

## Resumo de uma linha

Motores prontos → o caminho é **dados + calibração + arte + world-design**, em 4 fases (slice Alvorada → Alvorada completa → escala T3/lvl25 → cidades 2–4), distribuído em 3 trilhas paralelas com a regra `sim sequencial ∥ resto paralelo`.
