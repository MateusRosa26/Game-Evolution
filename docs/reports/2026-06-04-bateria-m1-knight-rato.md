# Bateria M1 — TTK/TTL/XP-hora/mana/curva (knight vs Rato Lanhoso)

**Data:** 2026-06-04 · **Balancista** · primeira bateria completa do backlog (item 1).
Harness descartável (`esbuild --bundle` + node, sim headless, 20 ticks/s). A sim é
**determinística** (zero RNG em combate no M1) — uma run por cenário é exata, não amostra.

## Setup

- Mapa: arena 64×64 plana sem PZ (TTK/TTL) e `generateTestMap()` real (farm: 6 spawns de rato, respawn 10s, PZ 3×3 no spawn).
- Bot de farm "jogador cuidadoso": alveja o rato vivo mais próximo, anda até tile de ataque fora da PZ, GF quando pronto, **recua pra PZ a 35% de HP e volta a 90%** (regen incluso na taxa — régua de farm contínuo realista).
- Números efetivos no nível 1 (knight, espada curta): **114 HP, 34 mana, auto 14 dmg @1,9s** (1875ms quantizado → 1900), **GF 25 dmg @6s/6 mana**, regen 2,0 HP/s e 1,9 mana/s. Rato: 24 HP, 8 dmg @1,6s, passo efetivo 200ms, 20 XP.

## A. TTK vs 1 rato (alvo adjacente)

| Classe | Rotação | TTK | Golpes |
|---|---|---|---|
| Knight | auto | 2,0s | 14, 14 |
| Knight | auto+Golpe Forte | **0,1s** | 25* |
| Rogue | auto | 1,5s | 14, 14 |
| Rogue | auto+Apunhalar (frontal) | **0,1s** | 22*, 14 |
| Mage | auto (cajado) | **6,4s** | 7×4 |
| Mage | auto+Bola de Fogo | **0,1s** | 22*, 7 |
| Priest | auto (cetro) | **6,4s** | 7×4 |
| Priest | auto+Luz Sagrada | **0,1s** | 19*, 7 |

`*` = golpe de skill. **Toda classe one-shota o T1 com a skill de abertura** (burst do
knight: auto+GF = 39 no mesmo instante). Auto de caster (7 dmg, ~2,1s) leva 6,4s no mob
mais fraco do jogo — única leitura "esponja" da bateria; wands fixas (DESIGN-ITENS) são o fix previsto.

## B. TTL — knight lvl 1 PARADO (descuido total)

| Ratos | TTL (do 1º golpe à morte) | Dano absorvido (regen incluso) |
|---|---|---|
| 1 | 35,2s | 184 |
| 2 | **12,8s** | 144 |
| 3 | **8,0s** | 136 |
| 5 (2 grupos) | **3,2s** | 120 |

Régua "descuido contra 2+ T1 = morte real" ✓. 1 rato mata um AFK em 35s (justo: tempo
de sobra pra reagir). Puxar 2 grupos = morte em 3 segundos ✓ pilar punitivo.

## C. Economia de mana (derivada das fórmulas, conferida na sim)

| Classe / skill | Pool | Custo | Burst até secar | Cadência sustentada (regen) |
|---|---|---|---|---|
| Knight / Golpe Forte | 34 | 6 | n/a (CD 6s > regen) | **nunca seca** (1 mana/s vs 1,9/s; mín. observado em 1h: 28/34) |
| Mage / Bola de Fogo | 58 | 14 | 4 casts (~4,5s) | 1 cast/6,4s |
| Mage / Lança de Gelo | 58 | 16 | 3 casts | 1 cast/7,3s |
| Rogue / Apunhalar | 40 | 5 | 8 casts (~8s) | 1 cast/3,1s |
| Priest / Luz Sagrada | 46 | 12 | 3 casts | 1 cast/4,3s |
| Priest / Curar Ferimentos | 46 | 10 | 4 casts | cura 28 HP (2,8 HP/mana) |

Casters são mana-gated ✓ ("spam não é grátis"). **Exceção: GF do knight — o custo é
decorativo.** Ou sobe (ex.: 12–15, vira decisão de burst), ou se aceita o knight como
classe sem pressão de mana por identidade. ✏️ criador.

## D. Farm 1h real (testMap) + E. Curva de level

| Variante de jogo | Kills/h | XP/h | Mortes | % tempo descansando | Level ao fim de 1h |
|---|---|---|---|---|---|
| auto-only, sem alocar stats | 144 | 2.824 | 0 | **85%** | 7 |
| auto+GF, sem alocar | 202 | 3.752 | 0 | **87%** | 7 |
| auto+GF, all-in STR | 296 | 4.992 | 0 | 36% | 8 |

Curva medida (run all-in STR): lvl 2 @ 1,2min · lvl 3 @ 2,7min · lvl 4 @ 6min ·
**lvl 5 @ 12,3min** · lvl 6 @ 14,2min · lvl 7 @ 17,6min · lvl 8 @ 25,3min.
Falloff anti-farm funciona: rato decai a partir do lvl 7 e zera ~lvl 11 — beco sem
saída natural que empurra pra T2 ✓. Curva cúbica Tibia-like **já implementada** em
`formulas.ts` (item 2 do backlog do Balancista estava stale).

### Leituras

1. **Sustain é O gargalo, não o combate.** 85–91% do tempo é regen parado (2 HP/s vs 114+ HP). Valida com força a economia de comida desenhada (comida = drain que compra uptime). **Recalibrar XP/h quando a comida entrar na sim** — os números absolutos daqui são piso.
2. **Degeneração (Sirlin): all-in STR** one-shota o rato no auto a partir de STR 18 (lvl ~4–5 com 3 pts/nível) → descanso despenca 87%→36% e kills/h sobe 50%. Sem counterplay dentro do T1. O **custo de stat por faixa (regra do RO, backlog #3)** é o counter estrutural — subiu de prioridade.
3. **Morte é de graça NA SIM**: respawn com HP/mana cheios, zero perda. A decisão de design JÁ EXISTE (macro do MVP: **morte = −10% do XP total**) — pendência é de implementação (e recalibrar TTL/farm quando entrar: morrer pra matilha passa a custar progresso real).
4. **Farm de borda de PZ** (achado emergente): mobs que perderam aggro acampam na fronteira da zona segura e "se entregam" quando o jogador sai — na variante V1 isso rendeu 475 kills/h com 74% de descanso, melhor que caçar andando. Flag pro world-designer: PZ colada em spawn de mob cria o spot degenerado (cidades da fatia ①!).

## F. Propostas — variantes do rato simuladas (✏️ decisão do criador)

Knight, farm 1h auto+GF+all-in-STR; TTK/TTL no lvl 1:

| Variante | TTK auto | TTK c/ GF | TTL 1 rato | TTL 2 ratos | XP/h | lvl 5 em | Leitura |
|---|---|---|---|---|---|---|---|
| **atual** 24hp/8dmg/20xp | 2,0s | 0,1s (1 golpe) | 35s | 12,8s | 4.992 | 12,3min | skill deleta o mob; early rápido |
| **V1** 30hp/8dmg/20xp | 3,9s | 0,1s (burst 39) | 35s | 12,8s | 6.835* | 12,5min | GF sozinho não mata, mas burst sim |
| **V2** 30hp/8dmg/**10xp** | 3,9s | 0,1s | 35s | 12,8s | 2.080 | **22,3min** | metade do ritmo de XP |
| **V3** 30hp/**11dmg**/15xp | 3,9s | 0,1s | 22s | 8,0s | 2.235 | 23,0min | letalidade ↑, descanso 91% (pede comida) |
| **V4** **42hp**/8dmg/20xp | 3,9s | **2,0s** (3 golpes) | 35s | 12,8s | 3.224 | 16,2min | único que sobrevive ao burst de abertura |

`*` V1 inflado pelo farm de borda de PZ (leitura 4) — comparar com cautela.

- Se "skill one-shotar o primeiro mob é OK" (é o primeiro sangue): manter 24 HP e mexer só no XP (V2-like) se o ritmo estiver rápido.
- Se o T1 deve exigir **2 tempos** mesmo com burst: V4 (42 HP) é o piso matemático (burst lvl 1 = 39).
- Letalidade (V3) é o knob que mais pressiona sustain — segurar até a comida existir na sim, senão o early vira simulador de descanso.

## Régua p/ thresholds de Marca (backlog #5)

Taxa real medida: **150–475 kills de rato/h** num spot T1 dedicado (teto: bot degenerado
+ farm de borda; jogador real fica abaixo). **Decisão do criador (jun/2026): threshold de
Marca T1 na casa de 10.000 kills** — consistente com a faixa 10–20k já no DESIGN-EVOLUCAO.
Nas taxas medidas: **~25–50h de farm dedicado** (mais quando sustain custar comida/gold).

**Princípio registrado (feedback do criador):** thresholds de Marca são **segredos do
jogo**, descobertos com o tempo — NUNCA meta comunicada, NUNCA justificativa para o
ritmo do loop sólido. Upar/caçar/melhorar o char/quests têm que ser divertidos por si
sós; a camada emergente é surpresa por cima, não compensação.

## Decisões do criador (mesma sessão)

- **XP do rato: 20 → 10 (variante V2) — APLICADO** em `bestiary.ts`. lvl 5 passa a ~22min de farm dedicado pós-rito.
- **Custo de mana do GF: adiado** — Golpe Forte só existe pós-rito de classe; refinar na onda de skills.
- **HP do rato: pergunta invalidada** — o criador apontou que a bateria parametrizou com o início ANTIGO (classe na criação + kit com skill). O início real (decidido jun/2026, DESIGN-EVOLUCAO/DESIGN-ITENS) é **sem classe, Espada Cega, sem skills**. Re-medido abaixo.

## ADENDO — abertura real: classless + Espada Cega (rato 24hp/8dmg/**10xp**)

A sim ainda não implementa classless (pendência de código); aproximado no harness mutando
as tabelas vivas (atributos/growth/arma/kit). Sem alocação de pontos (baseline conservador).

| Parametrização (✏️) | HP | Auto | TTK | TTL 1/2/3 ratos | XP/h | Mortes/h | lvl 3 em | lvl 5 em |
|---|---|---|---|---|---|---|---|---|
| REF: knight pós-rito s/ skill (curta 6) | 114 | 14 @1,9s | 2,0s | 35 / 12,8 / 8,0s | 1.040 | 0 | 11,5min | 41min |
| **P1 neutro-5** (todos atrib. 5, cega 4, +8hp/lvl) | 90 | 9 @1,9s | 3,9s (3 golpes) | **24 / 9,6 / 4,8s** | 650 | **3** | 23min | >1h |
| P2 fraco (atrib. 4–5, cega 4, +6hp/lvl) | 90 | 8 | 3,9s | 24 / 9,6 / 4,8s | 650 | 3 | 23min | >1h |
| P3 neutro-5, cega 3 | 90 | 8 | 3,9s | 24 / 9,6 / 4,8s | 650 | 3 | 23min | >1h |

Leituras do adendo:

- **P1≈P2≈P3 na prática** (efeito de floor nas fórmulas): o knob fino não é sensível nessa faixa — escolher o mais limpo. **Recomendação do Balancista: P1** (atributos todos 5, Espada Cega dano-base 4, crescimento +8hp/+3mana por nível ≈ metade do knight).
- A pressão pra se classar emerge sozinha ✓: classless morre pra matilha (TTL 3 ratos = 4,8s, 3 mortes/h no farm), TTK 2× pior, lvl 5 nem sai em 1h. Nenhum gate artificial necessário.
- TTK classless 3,9s (3 golpes) — desconfortável sem ser esponja ✓.
- Com XP 10, o pós-rito (knight + GF) fica: **2.080 XP/h, lvl 5 @ ~22min** (linha V2 da tabela F).
- Pendências que continuam: implementar classless NA SIM (rito = troca de "classe" + entrega de arma + venda de skills), recalcular retroativo ao classar (✏️ DESIGN-EVOLUCAO), wands de caster, penalidade de morte.

## ADENDO 2 — refino do rato (bateria M1.1, decisões aplicadas)

Pedido do criador: início classless ligeiramente mais fácil sem estragar a dificuldade;
XP 15. Matriz dano×cadência simulada (XP 15, rato 24 HP):

| Rato | Classless: TTL 1/2/3 · mortes/h · lvl 3 | Pós-rito: TTL 3 · XP/h · descanso |
|---|---|---|
| atual 8dmg@1,6s | 24 / 9,6 / 4,8s · 3 · 18min | 8s · 7.107 · 65% |
| **A: 7dmg@1,6s ✓ APLICADO** | 28,8 / 11,2 / **6,4s** · **1** · 17min | 9,6s · 7.847 · 57% |
| B: 6dmg@1,6s | 36,8 / 12,8 / 8s · 0 · 16min | 11,2s · 9.452 · **39%** (estraga) |
| C: 8dmg@2,0s | 32 / 12 / 8s · 1 · 12min | 10s · 7.597 · 60% |

**Aplicado em `bestiary.ts`: dano 8→7, XP 10→15** (escolha A do criador). Classless cai
de 3 pra 1 morte/h e ganha respiro contra matilha (4,8→6,4s) — descuido segue letal;
pós-rito quase intacto. Com XP 15: lvl 5 pós-rito ~14min dedicado, lvl 8 = 280 kills;
falloff continua zerando o rato ~lvl 11. A "subida exponencial por nível" vem da curva
cúbica (custo) + salto de perigo por TIER (calibrar T2 quando o segundo mob existir —
princípio: T2 deve assustar quem chega confortável no T1).

## ADENDO 3 — orçamento de quest-XP da fatia ① (decidido e aplicado)

Apontamento do criador: as quests fáceis/iniciais auxiliam a upar os primeiros níveis —
o modelo de farm puro da bateria subestimava o early real. Fechada a pendência
"valores de XP/contagens — Balancista (pós-bateria M1)" do `QUESTS.md` com o
**orçamento FORTE** (escolhido entre FORTE/MODERADO simulados em aritmética sobre a
régua medida):

- Rito 50 · simples 50–100 · compostas/encadeadas 100–350 por ato · abertas 150–250 ·
  **segredos e aberta-por-item = 0 XP** (pagam em baú/conhecimento/registro).
- Efeito na curva: **lvl 5 sai ~60% de quest** (rito + 6 simples + atos iniciais ≈ 850 XP
  — chega "jogando o conteúdo", sem farm dedicado); como quest não repete, a fração
  despenca sozinha: **~33% no lvl 8, ~13% no lvl 12** — a subida exponencial fica com a caça.
- Contagens fixadas: Q1 8 ratos · Q3 4+4 reagentes · Q5 8 lobos · Q6 4 carnes ·
  Q8 10 orelhas / 12 goblins.
- Gold das quests: ✏️ aguarda economia de loot na sim (âncora relativa mantida:
  6 simples ≈ rito + caça T1 até lvl 6–8).
- Tabela completa em `design/fatia-1-alvorada/QUESTS.md` §"Orçamento de XP".
