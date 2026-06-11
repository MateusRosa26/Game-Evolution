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

## ADENDO — Rogue (single) × Mage (AoE) e o early (2026-06-11)

Correção do criador: **Bola de Fogo é SINGLE-TARGET**; o AoE do mago vem das skills
FORTES futuras — é aí que o mago se destaca. Logo, no early (só Bola), o **rogue é o
carry single-target** e o **mago deve ficar ABAIXO dele** (e brilhar depois, no AoE).

A medição anterior (mage 16,7 > rogue 15,2 single-target) estava INVERTIDA. Ajuste:
**Bola `power` 15 → 12** → mage single-target 14,6 < rogue 15,2 (rogue "um pouco
melhor cedo", como pedido), ainda acima dos sustains (priest 12,8, knight 11,6).

Paridade final (single-target / HP L10):
- Rogue 15,2 / 161 — AD damage, rei single-target.
- Mage 14,6 / 135 — AP damage, single fraco; **AoE = skills futuras** (aí destaca).
- Priest 12,8 / 198 — AP sustain.
- Knight 11,6 / 249 — AD sustain.

Reforça "early do mage levemente mais difícil": single-fraco + frágil + gestão de mana.
✏️ quando as skills AoE do mago entrarem, medir o destaque dele vs matilha (deve virar
o rei de pack, mantendo o single abaixo do rogue).

## ADENDO 2 — Sagrado especialista + AD variável × AP constante (2026-06-11)

Duas decisões do criador que mudam o combate:

**1. Sagrado REDUZIDO fora de undead** (`HOLY_NONUNDEAD_MULT = 0.5` no executor):
holy bate cheio vs profano (undead/demon), metade vs o resto. Resolve o priest
over-loaded — vira ESPECIALISTA anti-undead (a fraqueza que faltava):
- priest DPS vs não-undead: 17,6 → **8,3** (geral baixo = sustain/suporte).
- priest DPS vs undead: **19,5** (nuke do nicho).
✏️ magnitude (0.5 talvez duro demais — priest fica < knight no geral; testar 0.6–0.7).

**2. Físico (AD) VARIÁVEL × Mágico (AP) CONSTANTE** (`physicalVariance`,
`PHYSICAL_DAMAGE_SPREAD = 0.4`): diferença gigante AD×AP (Tibia/Apogea). O físico
(auto + skills) rola ±40% em torno da média; a magia é fixa. Knight (média 14):
golpes 8–17 (swingy). Média preservada (balance se mantém); muda o FEEL — AD
imprevisível/gear-chase, AP confiável/planejável. (Nota: `floor` enviesa a média
~−0,5; ✏️ trocar por round se quiser preservar exata.)

## ADENDO 3 — gap single-target rogue↔mage + holy 0,65 (2026-06-11)

- **HOLY_NONUNDEAD_MULT 0,5 → 0,65**: priest geral ~12,7 (≈ knight, contribui sem
  nukear) e **28,1 vs undead** (especialista). 0,5 deixava o priest peso-morto.
- **Bola power 12 → 7**: o físico variável baixou o rogue (floor da variância, ~−8%)
  pra 18,9, e o mage no power 12 ficava acima (19,9) — invertido. Bola 7 → mage
  single **15,4** (~18% abaixo do rogue). Rogue = rei single-target; mage = #2 de
  dano (acima dos sustains), com o destaque dele reservado pro **AoE (skills futuras)**.

Paridade final L6 (single-target, não-undead) / HP:
- Rogue 18,9 / 133 — AD damage, rei single.
- Mage 15,4 / 115 — AP damage, single fraco de propósito (AoE futuro).
- Priest 12,7 (28,1 undead) / 150 — AP sustain especialista anti-undead + cura.
- Knight 10,8 / ~245 — AD sustain tanque.

## ADENDO 4 — Espírito útil pro mago + Knight bruiser (2026-06-11)

Dois ajustes de identidade de atributo (criador):

**1. Espírito = REGEN de mana (Int = POOL).** O regen estava desacoplado de atributo
(só nível+classe), o que deixava o Espírito INÚTIL pro mago (mago não cura/holy).
Religado: `manaRegenPerSecond` agora soma `Esp × MANA_REGEN_PER_SPIRIT` (0,5), com
`MANA_REGEN_BASE` 6,0 → 3,0 pra preservar o baseline. Atributos DIFERENTES p/ pool
(Int) vs regen (Esp) ⇒ sem double-dip. Resultado:
- mage base (Esp 6): **6,0/s** (= alvo da bateria, casters viáveis preservado).
- mage investindo Esp (14): **10,0/s** — Esp vira alavanca de sustain (burst-mage Int
  × sustain-mage Esp = escolha de build real).
- priest base (Esp 8): **7,0/s** — o AP-sustain lidera naturalmente, sem termo de classe.

Espelho: **Int continua útil pro priest** (já alimenta `maxMana` = pool) — os dois
casters querem os dois atributos (Int=capacidade de burst, Esp=taxa de sustain).

**2. Knight bruiser — base Str 8 → 11.** O gap single-target knight×rogue (57–69%)
era largo demais: com a escalada dos mobs a vantagem de tank erode e a armadura só
mitiga 10–20%, então exp/h exige dano. O tank do knight vem do `hpPerLevel` (15,
automático), então o piso de Str sobra pra dano sem custar sobrevivência. Antes→depois L6:
| build | DPS antes | DPS depois | % do rogue | HP |
|---|---|---|---|---|
| knight Str (bruiser) | 13,2 | **13,9** | 69→**74%** | 189 |
| knight Vit (tank) | 10,8 | **11,6** | 57→**61%** | 245 |

Rogue segue rei single-target (18,9) — a liderança dele está no KIT (apunhalar backstab
2,0 + cadência da adaga), não no atributo, então mesmo com base Str > base Dex do rogue
o knight fica abaixo. Bruiser a 74% com +42% de HP = exp/h competitivo (menos downtime).
✏️ se ainda largo, alavancas: + base Str, ou multiplicador no golpe_forte (igualar o
backstab estrutural do rogue).
