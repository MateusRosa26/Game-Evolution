# Bateria — Velocidade de movimento do jogador (2026-06-10)

## Pergunta
Implementar MS estilo Tibia (sobe um pouco por level) + bônus de itens. Calibrar
SPEED_BASE, SPEED_PER_LEVEL, MIN_STEP_MS e faixas de bota.

## Achado estrutural (bloqueante)
A sim quantiza TODO movimento em degraus de TICK_MS=50 (`Simulation.quantizeToTickMs`,
aplicado em `tryStep` a player E mobs). Velocidade efetiva é DISCRETA:

| Tier | stepMs | tiles/s | naturalStepMs que cai aqui |
|---|---|---|---|
| Atual (player) | 250 | 4,00 | 225–274 |
| +1 tier | 200 | 5,00 | 175–224 |
| +2 tiers | 150 | 6,67 | 150–174 |

Consequências:
- Menor incremento de velocidade possível = 1 tick = 250→200 = +25% de uma vez.
- "+1 por level imperceptível" (Tibia) é IMPOSSÍVEL nesta engine.
- Curva proposta (SPEED_BASE=1000, +5/level): preso em 250ms do lvl 1 ao 23,
  salta pra 200ms só no lvl 24. Oposto de "gradual".

## Bug latente flagado
`baseStepMs` dos mobs também é quantizado:
- Lobo 220 → efetivo **200ms** (5 t/s) — bestiário diz "ligeiramente mais rápido
  que o player", mas é um TIER INTEIRO mais rápido (+25%). Valor 220 é enganoso.
- Esqueleto 280 → 300ms (3,33 t/s). Player 250 → 250 (4 t/s).
- Kiting: player que alcance o tier 200ms EMPATA com o lobo (lobo deixa de pegar
  quem foge em linha reta) — deve ser conquista de gear, não milestone de level.

## Recomendação
- Metade "itens" da decisão: APROVADA — velocidade = tiers discretos ganhos via
  botas/haste/slow. Uma bota 250→200 é upgrade visceral e é loot (Pilar 5/6).
- Metade "por level": INCOMPATÍVEL com tick de 50ms. Devolvida ao criador.
- Pendência separada: revisar baseStepMs dos mobs já pensando no degrau de 50
  (220 e 280 não são os valores que o comentário sugere).

## Números (se for caminho "só itens / tiers")
- Player base permanece BASE_WALK_MS=250 (tier 4 t/s).
- Bota comum → mantém 250 (sem efeito de speed) ou pequeno; bota boa/nomeada →
  empurra pro tier 200 (5 t/s). Haste (efeito temporário) → 200 ou 150.
- MIN_STEP_MS piso anti-stack: 150 (6,67 t/s) sugerido — calibrar quando haste
  + bota + buff coexistirem.

## DECISÃO FINAL (criador, 2026-06-10)
Pesquisa de referência (OSRS vs Tibia) fechou o caminho:
- **OSRS**: velocidade plana/binária (walk 1 tile/tick, run 2). Level NÃO dá
  velocidade. Profundidade de PvP = energia + freeze + posição. Agility só mexe
  na stamina, não no teto. Plano de propósito p/ PvP justo.
- **Tibia**: speed escala com level (breakpoints de 50ms — MESMO mecanismo da
  nossa engine!) + boots (+20) + haste (Utani Hur +30%, Charge +90%). Per-level
  é pequeno; gear/haste são os swings reais.

**Escolhido: base plana + item + magia (+ comida ✏️). SEM MS por nível.**
Mobilidade vira loot/escolha (Pilar 5/6); anti-Sirlin. Velocidade fica em tiers
de 50ms ganhos por gear/haste — 250→200 (25%) é visceral e conquistado.

Consequência: o motivo forte p/ tick fino (densidade de breakpoint p/ curva
por-level) **caiu**. Tick fica em 50ms; mudança de tick fica reservada.

## Refactor de unidades — FEITO (2026-06-10)
Todo número de tempo virou **ms** (design) com conversão única `msToTicks` na sim:
- `shared/constants.ts`: + helper `msToTicks(ms)`.
- skills `numbers.ts`/`types.ts`/`definitions.ts`: `cooldownTicks`→`cooldownMs`
  (×50); burn `durationTicks`/`tickEveryTicks`→`durationMs`/`intervalMs`; slow
  `durationTicks`→`durationMs`.
- `status.ts`: params em ms, converte p/ ticks internos; snapshot `remainingMs`.
- `protocol.ts`: `StatusEffectState.remainingTicks`→`remainingMs`.
- `bestiary.ts`: `respawnTicks`→`respawnMs` (×50).
- `formulas.ts`/`progression.ts`: regen `perTick`→`perSecond` (×20), escalado
  por `SECONDS_PER_TICK` no `regenTick` → independente da taxa de tick.
Conversões identity-preserving em TICK_MS=50. Validado: `tsc --noEmit` limpo +
smoke headless (200 ticks, 200 snapshots, sem erro).

## Revisão do MS dos mobs — FEITO (2026-06-10)
`baseStepMs` autorado ≠ efetivo (a sim quantiza em 50ms) e os comentários citavam
um player stale de 260 (é 250). Reautorado em múltiplos de 50 (autorado = efetivo),
SEM mudar a velocidade ortogonal testada nas baterias:

| Mob | Antes | Orto efet. | Depois | Orto | Diag | Δ |
|---|---|---|---|---|---|---|
| Rato Lanhoso | 220 | 200 (5 t/s) | **200** | 200 | 300 | zero (orto+diag idênticos) |
| Esqueleto | 280 | 300 (3,33 t/s) | **300** | 300 | 450 | orto igual; diag 400→450 (+kitável) |

Tiers vs jogador (250ms / 4 t/s): Rato = 1 tier ACIMA (te alcança, swarm); Esqueleto
= 1 tier ABAIXO (arrastado, kitável). Regra p/ mobs futuros: autorar `baseStepMs`
em múltiplo de 50. Validado: tsc limpo.
