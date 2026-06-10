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
