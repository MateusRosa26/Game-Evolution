# Bateria M1.2 — custo de stat por faixa + economia das 6 skills

**Data:** 2026-06-05 · **Balancista** · backlog #3 (custo por faixa) e #4 (skills + Sirlin).
Harness descartável (esbuild + node, sim headless, 20 ticks/s, determinística — 1 run por
cenário é exata). Bot de farm "cuidadoso" (recua pra PZ a 35% HP, volta a 90%), mapa
`generateTestMap()` (6 spawns de rato, respawn 10s). Rato pós-M1.1: **24 HP · 7 dmg @1,6s · 15 XP**.

> Métodos de bot diferem ligeiramente da bateria M1 (aproximação/recuo) — comparar
> linhas DESTA bateria entre si, não os absolutos com a M1.

## A. Custo de stat por faixa (knight 1h, auto+GF, recuo 35/90)

Implementado em `formulas.statPointCost` + `progression.allocateStatPoint` (família RO:
`floor((valor−1)/bandSize) + baseCost`; knob `STAT_COST`). Custo do próximo ponto agora
viaja no snapshot (`statPointCosts`) e o painel de personagem mostra `+2`/apaga botão sem
ponto suficiente — o client só exibe, a regra mora na sim.

| Variante | Política | Kills/h | XP/h | Lvl @1h | STR @1h | Auto one-shota rato em | Descanso |
|---|---|---|---|---|---|---|---|
| **A0 flat-1** (antigo) | all-in STR | 726 | 7.277 | 9 | **32** | **18,6min** | 64% |
| **A1 RO puro (10/2)** | all-in STR | 141 | 2.115 | 6 | 14 | **nunca (1h)** | 90% |
| A2 suave (10/1) | all-in STR | 141 | 2.115 | 6 | 17 | nunca (1h) | 90% |
| A1b RO puro + 4 pts/lvl | all-in STR | 141 | 2.115 | 6 | 15 | nunca (1h) | 90% |
| A0 flat-1 | equilibrado (2STR:1VIT) | **1.178** | 9.396 | 10 | 26 | 26,5min | **39%** |
| A1 RO puro | equilibrado | 153 | 2.295 | 6 | 13 | nunca (1h) | 89% |

### Leituras

1. **O custo por faixa fecha a degeneração da M1** ✓: no flat, o all-in STR cruza o
   breakpoint do one-shot (auto ≥ 24) aos 18,6min e o farm explode (726/h). No RO puro,
   nenhum breakpoint é cruzado em 1h — a camada de stats vira tempero, não motor.
2. **A1 = A2 = A1b no T1**: STR 14 vs 17 não cruza breakpoint nenhum (auto 20 vs 23,
   ambos 2 golpes; GF one-shota nos dois) → timeline idêntica. A escolha de faixa/base
   só aparece no médio prazo (faixa 21–30 custa 4 no RO puro vs 3 no suave) — **RO puro
   é a recomendação**: cânon do gênero, segura mais o late, e o early é idêntico.
3. **O all-in degenerado de verdade no T1 é VIT/sustain, não STR**: no flat, o build
   equilibrado (com VIT) rendeu MAIS que o all-in STR (1.178 vs 726/h) porque o gargalo
   é descanso (39% vs 64%). O custo por faixa tempera os dois pela mesma régua. Confirma
   com força a economia de comida (comida = drain que compra uptime) como A alavanca do
   sustain — recalibrar quando entrar na sim.
4. Pontos por nível (3) não é knob sensível no T1 sob custo RO (A1b idêntico) — manter 3.

**APLICADO:** `STAT_COST = { bandSize: 10, baseCost: 2 }` (RO puro) como default.
✏️ confirmação do criador pendente p/ registrar no DESIGN-EVOLUCAO (faixas deixam de ser ✏️).

## B1. TTK lvl 1 vs 1 rato (re-medição, custo RO ativo)

| Classe / rotação | TTK | Golpes |
|---|---|---|
| knight auto+GF | 0,1s | 25 |
| rogue auto+Apunhalar (frontal) | 0,1s | 22, 14 |
| mage auto+BdF | 0,1s | 22+queima, 7 |
| mage auto+LdG | 0,1s | 20, 7 |
| priest auto+LS | 0,1s | 19, 7 |
| knight auto-only | 1,9s | 14, 14 |
| mage auto-only | **6,3s** | 7×4 |

Inalterado vs M1: toda classe one-shota (ou quase) o T1 com a skill de abertura; auto de
caster segue esponja (wands fixas do DESIGN-ITENS continuam sendo o fix previsto).

## B2. Sirlin — Mage vs matilha de 3 ratos (BdF × LdG)

| Estratégia | Clear | Mana | HP perdido | Morreu? |
|---|---|---|---|---|
| **BdF-only (atual)** | **3,7s** | 36 | **19** | não |
| LdG-only (atual 12/2s/16) | 5,5s | 37 | 37 | não |
| auto-only (cajado) | — | 0 | 88 | **SIM** |
| LdG v2 buffada (16 = one-shot em linha, 3s, 20 mana) | 6,7s | 47 | 35 | não |

**Falha de Sirlin estrutural**: BdF domina o single-target E a matilha, e a LdG perde
até buffada pra one-shotar a linha inteira. Causa: contra mob que morre em 1 cast de
QUALQUER skill, a skill mais barata/rápida domina sempre — pierce/slow/burn nunca chegam
a existir (alvo já morreu). **Diferenciação de skill só nasce quando o mob sobrevive ao
1º hit** → calibrar LdG/burn/slow na bateria T2 (Lobo/Goblin), não adiantando números
agora. Registrado como restrição de design para o orçamento de skills por tier.

## B3. Custo de mana do Golpe Forte (6 / 12 / 15 — farm 1h)

| GF mana | Kills/h | XP/h | Mana mínima vista | Casts bloqueados por mana |
|---|---|---|---|---|
| 6 (atual) | 141 | 2.115 | 28 | 0 |
| 12 | 141 | 2.115 | 22 | 0 |
| 15 | 141 | 2.115 | 19 | 0 |

**O knob é inerte no T1 em qualquer valor testado** — o descanso de HP regenera a mana
de graça; o custo nunca vira decisão. Aritmética da corrente contínua (sem descanso):
regen do knight ≈ 1,9 mana/s; GF a 15/6s = 2,5/s → só seca após ~57s de corrente
ininterrupta — cenário de pull T2+, não de farm T1. Decisão é de IDENTIDADE, não de
balance T1: ver pergunta ao criador no fim.

## B4. Priest — Curar Ferimentos compra uptime? (1h, LS + CF<70%)

| Variante | Kills/h | XP/h | Descanso | Casts LS | Mana mín. |
|---|---|---|---|---|---|
| com CF | 233 | 3.318 | **60%** | **62** | 0 |
| sem CF | 230 | 3.282 | 89% | 258 | 0 |

CF converte descanso em uptime (89%→60%) mas **rouba a mana da LS** (258→62 casts) —
throughput líquido ≈ zero no T1 solo. A cura vira valor real quando: (a) wand der DPS de
auto ao priest (mana sobra pro papel certo), (b) grupo (curar terceiros), (c) emergência
(TTL). Não é bug de número — é o tradeoff funcionando; sem mudança proposta.

## B5. Rogue — cadência real do Apunhalar (1h, frontal, sem alocar)

**590 kills/h · 6.597 XP/h · lvl 9 @1h · descanso 73% · mana mínima 5** (630 casts).
O custo 5/1s morde de leve (pool 40) ✓. Mas abre a régua inter-classe do T1:

| Classe (1h, mesmas condições) | XP/h | Δ vs knight |
|---|---|---|
| Rogue (Apunhalar 1s) | 6.597 | **3,1×** |
| Priest (LS + CF) | 3.318 | 1,6× |
| Knight (GF 6s) | 2.115 | 1× |

O freio do knight é o CD 6s do GF + dano por kill absorvido maior (TTK maior → mais
hits levados → mais descanso). Identidade (tanque fareja menos XP/h) ou aproximar
(GF CD 6s→3s)? ✏️ criador — ver perguntas.

## Backlog #5 — thresholds de Marca (régua, sem mudança de código)

Decisão do criador (M1.1) mantida: **Marca T1 na casa de 10.000 kills** (~25–50h nas
taxas medidas; hint ~50% ≈ 5.000). As defs em `tracking/definitions.ts` permanecem DUMMY
(10–15) DE PROPÓSITO: são o conteúdo de teste da engine (toasts visíveis em dev). Os 10k
entram quando a wave de conteúdo real (nomes do Loremaster + efeitos) substituir o array
`DUMMY_TRACKING_DEFS` — anotado lá e no backlog. Thresholds seguem SEGREDO do jogo.

## Decisões aplicadas nesta bateria

- **Custo de stat por faixa (RO puro 10/2)** implementado na sim + snapshot + painel
  (✏️ criador confirma faixas → registrar no DESIGN-EVOLUCAO).
- Nenhum número de skill alterado (GF mana inerte no T1; LdG adiada pra bateria T2 com
  justificativa estrutural; CF/B4 é tradeoff saudável; Apunhalar ok isolado).

## Decisões do criador (mesma sessão)

- **Custo de stat: RO puro (10/2) CONFIRMADO** — registrado no DESIGN-EVOLUCAO
  (tabela de decisões + §Stats); ✏️ de faixas fechado.
- **GF mana: 6 → 12 — APLICADO** em `skills/numbers.ts`. Zero impacto no T1 (provado);
  abre decisão de burst em correntes contínuas T2+.
- **Gap knight×rogue: ADIADO para a bateria T2** — régua real de classe aparece com
  Lobo/Goblin, wands e comida na sim.

## ADENDO — bateria M1.3: pontos por nível × largura de faixa (decidido e aplicado)

Pergunta do criador: com custo mínimo 2, faz sentido continuar dando 3 pts/nível?
"Level que não sobe nenhum stat" é sensação de progresso ruim. Medido em duas frentes:

**Sensação (aritmética, lvl 1→25, 24 level ups, gasto greedy):**

| Variante | Levels com ZERO subida (all-in) | (jogo normal 2:1) | Stat principal @25 |
|---|---|---|---|
| 3 pts · faixa 10 (era o atual) | **3** | **2** | 30 |
| **4 pts · faixa 10 ✓ APLICADO** | 1 (só no extremo, ~lvl 21+) | **0** | 35 |
| 5 pts · faixa 10 | 0 | 0 | 39 |
| 3 pts · faixa 15 | 1 | 0 | 33 |
| 4 pts · faixa 15 | 0 | 0 | 39 |

**Degeneração (sim 2h, knight all-in STR):** 3/f10, 4/f10 e 3/f15 → one-shot NUNCA chega
(STR 15–17); **5/f10 e 4/f15 reabrem o breakpoint aos 76min** (875 kills/2h vs 259).

**Decisão (criador): 4 pts/nível · faixa 10** — `STAT_POINTS_PER_LEVEL = 4` aplicado em
`formulas.ts` e registrado no DESIGN-EVOLUCAO. Zero levels vazios no jogo normal; todo
level garante ≥1 subida até atributo 41+ (fora da escala do MVP, cap ~20–25); o all-in
continua estéril — com 4 pts o one-shot só chegaria ~lvl 8–9 de farm dedicado, quando o
falloff já corta o XP do rato (40% no 8, zero no 11). A faixa de custo não existe para
impedir o extremo para sempre: existe para o breakpoint nunca chegar ENQUANTO o mob paga.

## Pendências que esta bateria gera/reitera

1. ✏️ GF mana (identidade) e gap inter-classe knight×rogue — perguntas ao criador.
2. Wands de caster (DESIGN-ITENS) — auto 6,3s segue a única leitura esponja do T1.
3. Bateria T2 (quando Lobo/Goblin entrarem): diferenciação real de LdG/burn/slow,
   orçamento "T2 assusta quem chega confortável do T1", e re-régua inter-classe.
4. Comida na sim → recalibrar TODOS os XP/h (descanso 60–90% é o gargalo universal).
5. Classless na sim (rito = classe + arma + skills) — segue pendência de código (M1.1).
