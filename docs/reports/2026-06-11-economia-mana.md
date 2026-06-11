# Bateria — Economia de mana (throughput AP × AD)

**Data:** 2026-06-11
**Problema:** a bateria da matriz de classes mostrou casters mana-bound — sustentado muito abaixo do martial. Esta bateria mede e calibra a economia de mana (regen saciado + custo) pra fechar a paridade de throughput.

## Baseline (regen 1/s — quebrado)
| caster | maxMana | regen saciado | seca em | DPS sustentado (60s) |
|---|---|---|---|---|
| mage | 58 | 1,0/s | **3s** | 6,4 |
| priest | 46 | 1,0/s | 3s | 5,5 |

Demanda da Bola = 14 mana / 1,5s ≈ **9,3 mana/s** >> regen 1/s → "burst e seca". Sustentado virava metade do knight (12,7) e 1/3 do rogue (15,9).

## Varredura (regen R/s → DPS sustentado)
| R/s | mage | priest |
|---|---|---|
| 1 | 4,5 | 2,5 |
| 5 | 14,7 | 8,9 |
| 6 | ~16 | ~11 |
| 7 | 17,9 | 12,0 |
| 9+ | 19,9 (teto cd) | 12,7 (teto cd) |

Alvo da matriz: mage (carry) ~16 (≈rogue), priest (sustain) ~12 (≈knight). Cai em **R≈6**.

## Decisão aplicada
- **`MANA_REGEN_BASE_PER_SEC` 1,0 → 6,0** (saciado, L1). Mana = downtime do caster (espelho do HP do tank): a 6/s ainda há ciclo burst→recupera (demanda 9,3 > regen 6), mas recuperável, não punitivo.
- **`manaRegenPerLevel` Priest > Mage** (0,08→0,10 priest; 0,10→0,06 mage): endurance de mana é a identidade do AP-sustain; o dano do mage vem do BURST (pool+base), não do regen. (Afeta níveis altos; L1 usa a base.)

## Paridade final (regen 6/s, L1)
| classe (papel) | DPS sustentado | HP L10 |
|---|---|---|
| knight (AD sustain) | 11,6 | 249 |
| priest (AP sustain) | 12,8 | 198 |
| rogue (AD damage) | 15,2 | 161 |
| mage (AP damage) | 16,7 | 135 |

**Matriz realizada nos dois eixos:** damage > sustain em DPS; sustain > damage em HP. Eixos opostos.

## Pendências ✏️
1. **Throughput COMPLETO** (kills/h com downtime de HP/mana + mortes/h) — precisa do modelo de descanso (regen core #11) + a curva de HP dos mobs (já no bestiário pós-merge). Esta bateria mede DPS sustentado contínuo-saciado, não o ciclo com downtime real.
2. **Upside do caster não medido aqui** (AoE da Bola, alcance, burn DoT) — o mage single-target 16,7 + AoE/range é forte, balanceado pela fragilidade (135 HP). Re-checar vs grupos.
3. **Poção/comida de mana** (sustain de emergência do caster) — não existe; entra se o food-gating de mana pesar demais.
4. **Custos das magias** (Bola 14, Lança 16, Luz 12) seguem ✏️ — ajustáveis junto do regen.
