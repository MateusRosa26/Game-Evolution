# Curva de XP — migração cúbica → lei de potência (calibrada por tempo)

**Data:** 2026-06-11
**Pedido:** migrar a curva de XP da cúbica do Tibia para "exponencial" (DESIGN-EVOLUCAO §Ritmo), fechando a flag ⚠️ L133. Alvo: 1→25 em ~30–45h eficientes; lvl 1-8 rápido; últimos 5 níveis ≈ 1/3 do tempo.

## Achado principal — "exponencial pura" está ERRADO para cap-25

O doc pedia "cada nível ≈ 2× o anterior" (geométrica). Num jogo de **cap 25**, geométrica explode:

| Razão r | F(8) (% do XP em 1→8) | % do jogo no ÚLTIMO nível | % nos últimos 5 níveis |
|---|---|---|---|
| 2,0 | ~0% | ~50% | ~94% |
| 1,5 | 0,1% | 33% | — |
| 1,3 | 1,0% | 23% | — |
| 1,2 | 0,7% | **17%** | 61% |

Até `r=1,2` joga 17% do jogo inteiro **no último nível sozinho** e 61% nos últimos 5 — passando do próprio split-alvo do criador (37%). A advertência do gênero (Luban/OSRS: "evite exponencial pura, explode no late") vale aqui.

O que o **split-alvo de horas** realmente pede (método Luban — desenhar pelo tempo, ancorar no XP/h medido) é uma **LEI DE POTÊNCIA** de expoente ~2,5 — na verdade **mais suave** que a cúbica (expoente 3). A cúbica errava no sentido OPOSTO ao que a flag sugeria: não era "pouco íngreme", era **early raso demais** (lvl 1-8 = ~2% do XP) e **total mal escalado** ao alvo de horas.

## Forma adotada

```
total(n) = round( SCALE · (n−1)^EXP )    // SCALE=125, EXP=2,5
```

- `EXP` (formato): 2,5 — levanta o early acima da cúbica e mantém peso forte no late, sem o blow-up geométrico.
- `SCALE` (escala/tempo): 125 — pina o total ao alvo de horas. **Re-pinável** (1 constante).
- total(1)=0 (pow(0,p)=0); `xpToNextLevel`/`levelForXp` derivam sem mudança.

## Âncora empírica de XP/h

| Faixa | XP/h | Fonte |
|---|---|---|
| Early (lvl 1-9, vs Rato, 73% descanso) | **6.597** medido | bateria M1.2 (2026-06-05) |
| Teto por-respawn (8 spots) | 14–31k (ceiling) | bateria mobs-Alvorada (2026-06-10) |

Só o early tem medição firme. Mid/late = **modelados** (XP/h crescente, mobs T2/T3 ainda mínimos, comida fora da sim). Por isso a entrega é **parametrizada + sensibilidade**, não falsa precisão.

## Tabela de níveis resultante

| lvl | total XP | Δ p/ próximo |
|---|---|---|
| 2 | 125 | 582 |
| 5 | 4.000 | 2.988 |
| 8 | 16.205 | 6.422 |
| 10 | 30.375 | 9.153 |
| 15 | 91.671 | 17.257 |
| 20 | 196.695 | 26.912 |
| 25 | 352.727 | 37.898 |

Último nível (37.898) custa ~5,9× um nível do early (lvl 8→9 = 6.422): "cada level vira projeto" sem geométrica.

## Horas por faixa (2 modelos de XP/h — o bracket honesto)

| Modelo XP/h | 1→8 | 8→15 | 15→20 | 20→25 | TOTAL | últimos 5 |
|---|---|---|---|---|---|---|
| **Plano (8k)** | 2,0h | 9,4h | 13,1h | 19,5h | **44,1h** | 44% |
| **Crescente (6,6k→14k)** | 2,5h | 8,4h | 8,8h | 11,1h | **30,7h** | 36% |
| *Split-alvo* | 2-3 | 8-12 | 9-13 | 11-17 | 30-45 | >33% |

✅ Em **ambos** os modelos o 1→25 cai em **30–45h** e os últimos 5 níveis ficam em **36–44%**. Robusto à incerteza de XP/h.

## Sensibilidade do expoente (SCALE=125 fixo, modelo crescente)

| EXP | total 1→25 | últimos 5 | total(25) |
|---|---|---|---|
| 2,2 | 12,2h | 32% | 136k |
| **2,5** | **30,7h** | **36%** | **353k** |
| 2,8 | 77,8h | 40% | 915k |
| 3,0 (cúbica) | 144,9h | 43% | 1,73M |

O expoente é o lever dominante do formato; 2,5 é o ponto que bate o split. (Cúbica a SCALE=125 = 145h, fora; a cúbica original usava SCALE≈16,7, dando ~17h — escala errada pro alvo.)

## Interação com a MORTE (−10% do XP TOTAL)

| lvl (acabou de upar) | perde | % do custo do nível | cai p/ | custo em tempo |
|---|---|---|---|---|
| 10 | 3.037 | 39% | 9 | 0,3–0,4h |
| 15 | 9.167 | 59% | 14 | 1,0–1,1h |
| 20 | 19.669 | 79% | 19 | 1,6–2,5h |
| 25 | 35.272 | 99% | 24 | 2,5–4,4h |

- ✅ "Quem acabou de upar **deslevela**" — confirmado em toda a faixa.
- ⚠️ **Consequência nova p/ o criador:** com a lei de potência, 10% do total ≈ **39% → 99%** do custo do nível atual (cresce com o nível), NÃO os "~20%" que o doc estimava (aquilo pressupunha curva geométrica). Uma morte agora custa **quase um nível inteiro** no late. No cap, 10% = **2,5–4,4h** — o caso plano (4,4h) encosta no teto "dói muito sem rage-quit" (~3-4h). **Knob visceral do criador:** manter 10% (mais brutal que o doc previa) ou suavizar p/ ~7-8% (→ ~2-3,5h no cap).

## Implementado

- `src/sim/formulas.ts` — `xpForLevel` trocada (cúbica → potência); `XP_CURVE_SCALE`/`XP_CURVE_EXPONENT` expostas e comentadas; docstring atualizada.
- `npx tsc --noEmit` limpo (exit 0). Consumidores (`progression.ts`, `Simulation.ts` snapshot, level-down) derivam de `xpForLevel` — adaptam sozinhos.

## Pendências / re-pin

- [ ] **Re-pinar SCALE quando a COMIDA entrar na sim** (backlog #7): comida sobe o XP/h (descanso 60-90% é o gargalo) → provável subir SCALE ~1,3-1,6× pra segurar o 1→25 em ~35h.
- [ ] Medir XP/h real de mid/late quando mobs T2/T3 + farm-loop existirem (hoje modelado).
- [ ] **Criador:** confirmar DEATH_XP_PENALTY (10% vs ~7-8%) à luz do "quase um nível por morte no late".
- [ ] **Designer/criador:** a linguagem do doc ("curva exponencial, ~2×/nível") agora descreve a forma ERRADA — atualizar p/ "lei de potência calibrada por tempo".
