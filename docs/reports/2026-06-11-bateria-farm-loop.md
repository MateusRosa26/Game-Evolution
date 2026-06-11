# Bateria — Farm-loop (XP/h real) → re-pin do SCALE da curva + decisão do regen rogue/mage

**Data:** 2026-06-11
**Objetivo:** medir XP/h real por classe/nível (sim, rotação skill+auto, saciado) pra (1) re-pinar o SCALE da curva de XP e (2) decidir se rogue/mage precisam de regen ainda menor. Destrava o backlog #7/#11.

## Método

Harness 1v1 controlado (arena blank, sem safezone), `Simulation` real. Por classe×nível: bot saciado-carne (1,5×), HP cheio a cada kill, mob spawnado adjacente, **rotação = skill principal a cada tick + auto-attack**. 25 kills/cenário. Mede TTK e HP perdido/kill; o loop (downtime, XP/h) é computado: `downtime = HP_perdido/regen`; `cycle = TTK + travel(1s) + downtime`; `XP/h = 3600/cycle × xp_mob`.

## Resultados — rotação (skill + auto), saciado-carne

| cls | lvl | mob | maxHP | TTK | HP/kill | down% | **XP/h** |
|---|---|---|---|---|---|---|---|
| knight | 1 | rato | 129 | 2,7s | 9,1 | 45% | 7.967 |
| rogue | 1 | rato | 105 | 2,4s | 7,3 | 42% | 9.265 |
| mage | 1 | rato | 95 | 1,9s | 8,4 | 49% | 9.434 |
| priest | 1 | rato | 102 | 2,5s | 7,8 | 43% | 8.899 |
| knight | 8 | lobo | 219 | 3,8s | 28,1 | 59% | 11.006 |
| rogue | 8 | lobo | 147 | 2,8s | 20,2 | 60% | 13.912 |
| mage | 8 | lobo | 125 | 3,0s | 22,7 | 63% | 12.234 |
| priest | 8 | lobo | 174 | 3,5s | 24,0 | 58% | 12.043 |

(Auto-attack PURO medido à parte: casters despencam — mage L8 TTK 11,4s/XP-h 4,2k — porque a wand é sustain fraco de propósito; a rotação é o número realista.)

## Achado 1 — re-pin do SCALE 125 → 175

O XP/h MEDIDO (rotação) é **~35% acima** do modelo estimado pré-bateria (early 8,9k vs 6,6k; mid 12,3k vs 9k). Com isso, SCALE=125 dava só **~25h** (rápido demais). Re-solvido pelo tempo:

| SCALE | 1→8 | 8→15 | 15→20 | 20→25 | TOTAL | últ5 | total(25) |
|---|---|---|---|---|---|---|---|
| 125 | 1,8 | 6,1 | 7,2 | 9,8 | 25,0h | 39% | 353k |
| **175** | **2,5** | **8,6** | **10,1** | **13,7** | **34,9h** | **39%** | **494k** |
| *alvo* | 2-3 | 8-12 | 9-13 | 11-17 | 30-45 | >33% | — |

**SCALE=175 aplicado** (`formulas.ts`): 1→25 em ~35h eficientes, split inteiro dentro do alvo, últimos 5 níveis = 39%. Casual (2-3×) = 70-105h. Morte −10% no cap = 49.381 XP ≈ **3,1h** (no "dói muito, sem rage-quit"). `tsc` limpo.

**Ressalva honesta:** early (1→8) e mid (8→15) são **medidos**; late (15→25) usa XP/h **extrapolado** (~14,5-16k, mob mais tankudo + mais downtime) — re-ancorar quando T2/T3 on-level existirem (mesmo gate do bestiário). Travel assumido 1s (spot denso); spots ralos baixam o XP/h e alongam — coerente com "casual 2-3×".

## Achado 2 — rogue/mage NÃO precisam de regen pior

A pergunta era se o glass cannon devia ter regen ainda menor. **Os dados dizem que não:**

| | knight | rogue | mage | priest |
|---|---|---|---|---|
| downtime L1 | 45% | 42% | 49% | 43% |
| downtime L8 | 59% | 60% | 63% | 58% |

Os downtimes são **equivalentes entre classes** (não há glass cannon descansando muito mais). Razão confirmada empiricamente: o damage **mata mais rápido** (rogue TTK 2,8s vs knight 3,8s @L8) → **toma menos porrada** (rogue perde 20 HP vs knight 28) → o kill rápido **paga** a fragilidade do pool/regen menor. Baixar o regen deles empurraria o downtime ACIMA dos tanks (over-tax) e mataria a viabilidade solo.

**Conclusão:** a fragilidade do glass cannon vive no **pool de HP** (TTL: rogue 147 vs knight 219 HP — morre rápido se errar), não no regen de farm. Separação saudável: HP=eixo de fragilidade, regen=recuperação proporcional (solo viável p/ todos). O spread corrigido hoje (K>P>R>M, priest 0,08/rogue 0,06) **fica** — sem cortes extras.

## Decisões aplicadas

- `formulas.ts` `XP_CURVE_SCALE` **125 → 175** (re-pin pelo XP/h medido).
- `formulas.ts` `CLASS_GROWTH.hpRegenPerLevel`: priest 0,06→0,08, rogue 0,07→0,06 (alinha à matriz; aplicado nesta sessão). **Sem corte extra** em rogue/mage (data acima).

## Achado 3 — KITE: o ranged tem vantagem estrutural de farm (Sirlin watch)

Re-medido com o mob spawnando a **5 tiles** e o bot KITANDO (ranged recua atirando; melee aproxima e tanka). Wand range 3 = ranged (mage/priest); melee range 1 (knight/rogue). @L8, saciado-carne:

| cls | tipo | vs Esqueleto (lento, kitável) | vs Rato (rápido) |
|---|---|---|---|
| knight | melee | TTK 2,9s · 8,6 HP · 35% · **10.747** | 2,4s · 7,0 HP · 34% · **10.477** |
| rogue | melee | 1,8s · 7,6 HP · 43% · **13.266** | 1,6s · 7,3 HP · 44% · **11.792** |
| mage | ranged | 1,9s · **0,0 HP** · **0%** · **22.056** | 1,8s · **0,0 HP** · 0% · **19.551** |
| priest | ranged | 1,4s · 0,0 HP · 0% · **26.536** | 1,7s · 0,0 HP · 0% · **19.694** |

**O ranged toma ZERO dano — até contra o rato (que é mais rápido que o player).** Razão: TTK ~1,8s é curto demais; abrindo a 5 tiles, o mob (mesmo a 200ms) não fecha o gap de 5→1 antes de morrer (em 1,8s o rato ganha só ~2 tiles líquidos sobre o player que recua). Resultado: **HP-downtime 0% → XP/h ~2× o do melee** (que é obrigado a tankar, 34-44%). É um **sinal de Sirlin**: um playstyle out-farma o outro sem counterplay no número cru.

**MAS — caveat que segura o "2×":** essa medição zera HP a cada kill e ignora o **downtime de MANA**, que é o contrapeso do caster (bateria economia-mana: regen 6/s < demanda ~9,3/s → o caster mana-capa em farm sustentado e pausa pra mana). Esse downtime de mana o melee NÃO tem (sustenta infinito na comida). Estimativa grossa: ~35% de mana-downtime derrubaria o caster de ~22k → ~14k, **estreitando o gap pra ~1,1-1,3×**, não 2×. O número honesto exige uma bateria de **throughput sustentado com OS DOIS downtimes (HP do melee + mana do caster)** — agora destravada (regen-core fixado).

**Implicações de design (não é pra nerfar o caster):**
- O contrapeso do ranged é **mana** (downtime de recurso) + **mob/zona anti-kite**: o bestiário já tem isso (goblin com salto gap-closer, matilhas rápidas, packs que cercam) — a defesa contra "ranged domina" é **design de spot** (misturar kitável e não-kitável, espaços apertados, mobs ranged que revidam), não número.
- O melee compensa com **TTL/escudo** (sobrevive a pack/erro) e **independência de mana** (farm steady infinito na comida).
- **Reforça a decisão do regen rogue/mage:** kitando eles quase não usam regen de HP; cortá-lo só puniria os casos em que NÃO dá pra kitar (pack/tight). Fica como está.
- **Curva:** o SCALE=175 está pinado no número melee/stand-fight (~12k mid). Casters que kitam + mana-permitindo levelam pro lado rápido da banda (~25-30h); melee ~35h. Spread de ritmo por playstyle — aceitável dentro de 30-45h.

## Achado 4 — THROUGHPUT SUSTENTADO (definitivo): a mana NÃO segura o kite em farm

Farm contínuo de 30min (HP+mana carregam; melee descansa <35%→90% HP; caster casta-quando-tem-mana, wand-quando-não, trava se zerar). Mob **on-level** (sem falloff): rato@L1, **javali T2@L8**. XP via `xpFromKill` real.

| cls | tipo | vs Rato @L1 | vs Javali @L8 (on-level) |
|---|---|---|---|
| knight | melee | 17.790 · rest 0% | **23.640** · rest **39%** |
| rogue | melee | 18.600 · rest 11% | **23.160** · rest **52%** |
| mage | ranged | 24.420 · rest 0% | **45.120** · rest **0%** |
| priest | ranged | 19.800 · rest 0% | **36.480** · rest 0% |

**Conclusão que CORRIGE o caveat do Achado 3:** o `manaDry` deu **0%** em todos — a mana **NÃO** trava o caster em FARM. O throttle de mana que a bateria economia-mana achou vale pra **single-target longo (boss)**, não pra farm (fights curtos + gaps de travel + pool grande no L8 deixam a mana sempre recuperar). Então o kite roda **sem contrapeso de recurso**.

**O gap é real e CRESCE com o nível:** contra o mob on-level que pune (javali @L8), o **mage farma 1,9× o knight** (45k vs 24k). O melee paga **39-52% de descanso** (javali bate 16); o caster kita, toma 0, descansa 0 e fica **~80% em combate**. No L1 (rato fraco) o gap é só ~1,37×; no L8 já é ~1,9× — **abre conforme o burst do caster cresce e os mobs batem mais**.

**Nuance importante (não é "rogue"):** o **rogue é melee (adaga) e está no FUNDO junto com o knight** (23k, rest 52%) — NÃO é o dominante. Os dominantes são os **ranged-kite (mage/priest)**. "Glass cannon difícil" é sobre o **ranged**, não o arquétipo: rogue-adaga apanha igual; só viraria problema com **arco** (aí kita como caster). Priest vs undead é à parte (bônus sagrado = identidade, ok).

**Levers pra "deixar o ranged mais difícil" (decisão de design — criador/Designer):**
1. **Conteúdo anti-kite (recomendado — Sirlin: counterplay, não nerf):** mobs ranged que revidam, gap-closers (salto do goblin já existe), summons, terreno apertado, packs que cercam. Torna o kite SITUACIONAL, não universal. É world-design/bestiário.
2. **Mana que morde em farm:** subir custo de skill/wand ou baixar regen pra o farm sustentado depletar → pausa/auto. Risco: mexe no que a economia-mana acabou de calibrar; pode deixar o caster travado.
3. **Nerf direto** (range/cast-time/burst): mais arriscado, já calibrado.
- **NÃO é via regen de HP** (kitando o caster nem usa) nem nerfando o rogue (que é melee balanceado).

## Pendências

- [ ] Re-ancorar o XP/h **late (15→25)** quando mobs T2/T3 on-level existirem — hoje extrapolado.
- [ ] Medir XP/h com **travel realista** (spots do re-layout da vila) e **economia de comida** (uptime de saciedade real, não saciado-constante) — pode baixar o XP/h e exigir SCALE menor; revisitar.
- [ ] Downtime de farm 40-60% (saciado-carne): confirmar com o criador que é o "custo de jogo difícil" aceitável (reduzível por poção/play); subir o regen-base reduziria mas comeria a margem de out-heal.
