# Calibração da Alvorada — loop completo na sim (2026-06-13)

> Balancista. Primeira bateria com **TODO o conteúdo da fatia ① dentro da sim** (quests Q1–Q15 + 4 ritos, NPCs, comércio, bestiário T1–T3, loot, baús, mobília). Método: harness headless esbuild→node na `Simulation` determinística (`/tmp/cal-harness.ts`, descartável). Mede TTK/TTL, XP/h e gold/h por spot (analítico + farm-loop end-to-end real), a curva 1→8 com o orçamento de quest, e food uptime.
>
> Fontes-alvo: `design/fatia-1-alvorada/QUESTS.md` §Orçamento · `design/itens/ECONOMIA.md` · `formulas.ts` (curva `175·(n−1)^2.5`) · reports M1/M1.1/economia-passe1/curva-xp.
>
> **DoD:** `npx tsc --noEmit` verde · fix do rito aplicado · medições rodadas · relatório escrito. **Nada commitado.**

---

## 0. O que mudei (fixes determinísticos — o doc já tinha decidido)

| Constante / def | Antes | Depois | Por quê |
|---|---|---|---|
| `rito_*.ts` `rewards.xp` (4 ritos) | 40 | **50** | QUESTS.md §Orçamento: "R1–R4 rito de classe — 50 cada". O código estava stale (40). |
| `rito_*.ts` `rewards.gold` (4 ritos) | 15 | **0** | QUESTS.md: "Ritos: custam 150… **Não pagam**." Ritos são SINK, não faucet — pagar gold contradiz o design. |
| `RITO_COST_GOLD` (`balance.ts`) | — | **150** (já estava) | O work-order supôs 200; o código **já estava em 150** (alinhado ao QUESTS.md). Nada a fazer. |

Nada mais foi alterado em número de mob/loot/curva — ver §6 (o resto é decisão de FEEL do criador, com as opções dimensionadas).

---

## 1. TTK do Knight — lvl 1→8 × cada mob T1–T2 (segundos, média 8 seeds)

Auto-attack puro (sem skill), 1v1 colado, espada curta. Físico rola ±40% → média de 8 seeds.

| lvl | rato | morcego | goblin | lobo | esqueleto | aranha | javali | bandido | abutre | orc |
|---|---|---|---|---|---|---|---|---|---|---|
| L1 | 2.4 | 1.2 | 4.1 | 5.3 | 2.9 | 10.3 | 10.3 | 10.9 | 5.8 | ~11 |
| L4 | 2.2 | 0.8 | 3.4 | 4.8 | 2.7 | 9.1 | 8.8 | 9.8 | 5.3 | 12.7 |
| L8 | 1.7 | 0.5 | 3.1 | 4.1 | 2.2 | 7.6 | 7.9 | 8.8 | 4.8 | 11.5 |

**Leitura:** o ladder T1 (rato 2,4 → esqueleto 2,9 → goblin 4,1 → lobo 5,3s) é progressivo e curto — nenhum vira esponja. T2 (aranha/javali/bandido ~10s a L1, caindo p/ ~8s a L8) é nitidamente mais longo, como o tier pede. O TTK cai pouco com nível (auto-attack escala devagar com Str+nível) — **o salto de dano real vem das skills e da arma melhor**, que não entram aqui. Tudo dentro da régua "fora da zona esponja".

## 2. TTK por classe (segundos) — L1 / L4 / L8 (`†` = houve morte em alguma seed)

| mob (HP/xp) | lvl | knight | mage | rogue | priest |
|---|---|---|---|---|---|
| rato (24/15) | L1 / L8 | 2.4 / 1.7 | 4.5 / 4.5 | 2.3 / 1.7 | 4.5 / 4.5 |
| goblin (38/24) | L1 / L8 | 4.1 / 3.1 | 6.6 / 6.6 | 4.6 / 2.9 | 6.6 / 6.6 |
| lobo (48/36) | L1 / L8 | 5.3 / 4.1 | 8.8 / 8.8 | 6.2 / 4.0 | 8.8 / 8.8 |
| esqueleto (30/18) | L1 / L8 | 2.9 / 2.2 | 5.6 / 5.6 | 3.4 / 2.0 | 5.6 / 5.6 |
| javali (80/60) | L1 / L8 | 10.3 / 7.9 | 11.6† / 17.1 | 9.8 / 6.2 | 11.6† / 17.1 |
| bandido (95/78) | L1 / L8 | 10.9† / 8.8 | 9.1† / 15.6† | 8.8† / 8.0 | 9.1† / 19.6† |

**Achados estruturais (ATENÇÃO — para o criador / designer de sistemas):**

- **O auto-attack do caster (wand/cetro) é FIXO 8–12 e não escala com nível** (decisão de design: o poder do caster vem das SKILLS). Resultado: TTK do mage/priest **NÃO melhora com o nível** no auto (rato 4,5s em L1 e em L8). Contra T2 (javali/bandido) o caster no auto puro chega a **PIORAR aparente** (17,1s a L8) — é só ruído de faixa fixa + variância, mas evidencia: **medir caster sem as magias não diz quase nada**. A bateria de skills (T2-skills, 09/jun) é a régua real do caster; aqui o número só confirma que o auto NÃO é o motor deles.
- **Rogue (adaga, Dex, cadência 1,6s) é o melhor DPS de auto-attack** em quase tudo (rato 1,7s, esqueleto 2,0s, javali 6,2s a L8) — consistente com o gap inter-classe T1 já conhecido (backlog #4). Não é degeneração (é o nicho da adaga: cadência), mas re-confirma o ✏️ inter-classe pro criador.
- Os `†` em javali/bandido a L1 são o farmer/caster apanhando num fight longo de ~10s — esperado (mob T2 vs personagem L1 sem skill/gear é luta de risco real).

## 3. TTL — descuido (segundos PARADO apanhando até morrer; >60 = sobreviveu)

Personagem on-level imóvel, sem reagir, contra N mobs já em cima. Mede o pilar "punitivo mas justo: descuido contra 2+ mobs = morte real".

| cenário | knight | mage | rogue | priest |
|---|---|---|---|---|
| 2 ratos (L1) | 14.4 | 11.3 | 11.3 | 11.3 |
| 3 ratos (L1) | 9.7 | 7.2 | 8.1 | 7.2 |
| 2 lobos (L3) | 10.3 | 6.8 | 6.9 | 6.8 |
| 2 goblins (L3) | 13.4 | 9.1 | 10.8 | 9.8 |
| 2 javalis (L6) | 13.3 | 8.8 | 8.9 | 11.1 |
| 2 bandidos (L8) | 12.7 | 7.3 | 9.1 | 10.8 |

**Leitura: o pilar de letalidade FECHA.** Parar contra 2 mobs = morte em 11–14s (knight, o mais durável) ou 7–11s (frágeis). 3 ratos derrubam até o knight em ~10s. O sustain (knight/priest) aguenta mais que o damage (mage/rogue), como a matriz de classes pede. **Nada esponja, nada injusto** — quem puxa 2 grupos e não reage, morre. ✅

## 4. XP/h e gold/h por SPOT — DOIS modelos

### 4a. Analítico (limite-teto: mobs sempre disponíveis, ciclo = TTK + andar)

| spot | mob | L | TTK | ciclo | respawn | kph | XP/h | gold/h |
|---|---|---|---|---|---|---|---|---|
| S1 Planícies | rato | 2 | 2.4 | 5.4 | 10s | 664 | 9.954 | 332 |
| S2 Granja | rato | 1 | 2.4 | 4.4 | 10s | 814 | 12.203 | 407 |
| S3 Gruta Morcegos | morcego | 2 | 1.2 | 3.2 | 10s | 1.112 | 13.344 | 556 |
| S4 Toca Lobos | lobo | 4 | 4.8 | 7.8 | 12s | 462 | 16.615 | 462 |
| S5 Acamp. Goblin | goblin | 4 | 3.4 | 6.4 | 12s | 565 | 13.553 | 1.129 |
| S7 Ninho Aranhas | aranha | 6 | 8.4 | 11.4 | 14s | 317 | 21.545 | 634 |
| S10 Matagal Javali | javali | 6 | 8.4 | 12.4 | 15s | 291 | 17.472 | 582 |
| S11 Bandidos Ponte | bandido | 8 | 8.8 | 11.8 | 15s | 304 | 23.721 | 2.129 |
| esgoto-A1 esqueleto | esqueleto | 5 | 2.4 | 5.4 | 15s | 664 | 11.945 | 1.327 |

### 4b. Farm-loop REAL (sim end-to-end, 10 min, knight on-level, COM comer)

Inclui andar até o mob + espera de respawn + variância + loot RNG. `mortes` = mortes do farmer NAÏVE (sem kite/recuo) em 10min — é **sinal de PERIGO do spot**, não de farm ótimo. XP/h e gold-drop/h = kph real × valor on-level (faucet bruto, sem penalidade de morte).

| spot | mob | L | kph real | XP/h | gold-drop/h | gold-loot/h | mortes/10min |
|---|---|---|---|---|---|---|---|
| S1 Planícies | rato | 2 | 666 | 9.990 | 333 | 321 | 5 |
| S2 Granja | rato | 1 | 666 | 9.990 | 333 | 321 | 5 |
| S3 Gruta | morcego | 2 | 858 | 10.296 | 429 | 417 | 3 |
| S4 Toca | lobo | 4 | 462 | 16.632 | 462 | 471 | 16 |
| S5 Acamp. | goblin | 4 | 516 | 12.384 | 1.032 | 993 | 9 |
| S7 Ninho | aranha | 6 | 294 | 19.992 | 588 | 597 | **22** |
| S10 Matagal | javali | 6 | 318 | 19.080 | 636 | 621 | 13 |
| S11 Ponte | bandido | 8 | 282 | 21.996 | 1.974 | 1.998 | **19** |
| esgoto | esqueleto | 5 | 546 | 9.828 | 1.092 | 1.080 | 2 |

**O analítico e o real BATEM** (kph real ≈ teto analítico, dentro de ~10–15%) — o spot é combat-bound (você mata mais rápido que o respawn repõe; o respawn de 10–15s e a densidade de 5–8 mobs nunca é o gargalo no T1). O `gold-loot/h ≈ gold-drop/h` confirma que o farmer recolhe quase todo o ouro que cai.

**Sinal de perigo (mortes do farmer naïve):** os spots T2 (aranha 22, bandido 19, lobo 16 mortes em 10min) **massacram** um jogador que só "anda e bate" sem kitar/recuar — o queijo (regen 1.0× ≈ 2 HP/s) não out-heala punição T2 sustentada. Confirma de novo: **T2 exige jogar, não só clicar.** ✅ (O farmer naïve não representa jogo competente — é o piso de quem joga mal.)

## 5. A CURVA 1→8 e o ORÇAMENTO DE QUEST — **o achado grande**

### Curva atual (`formulas.ts`: `total(n)=175·(n−1)^2.5`)

| nível | XP total p/ atingir | Δ do nível |
|---|---|---|
| L2 | 175 | 175 |
| L3 | 990 | 815 |
| L4 | 2.728 | 1.738 |
| L5 | 5.600 | 2.872 |
| L8 | 22.687 | 7.255 |

### Orçamento de quest (defs atuais = QUESTS.md, com o fix do rito)

- Rito (50) + 6 simples (Q1–Q6 = 50+50+75+75+100+100 = **450**) = **500 XP**.
- Early "completo" (rito + 6 simples + Q7a1/Q8a1/Q8a2) = **850 XP**.
- **TODAS as 19 quests da fatia somadas (incl. 4 ritos) = 2.500 XP.**

### O MISS, medido

| Afirmação do QUESTS.md §Orçamento | Realidade na curva atual |
|---|---|
| "rito + 6 simples + atos iniciais ≈ 850 XP → **lvl 5 sai ~60% de quest**" | 500 XP (rito+6 simples) → **nível 2**, cobre **9%** do caminho até L5 |
| "lvl 5 = 800 acumulados (curva cúbica)" | **lvl 5 = 5.600** (curva nova, 7× maior) |
| "Como quest não repete, a fração despenca… ~33% no lvl 8" | Early completo (850) cobre **4%** do caminho até L8 |
| (implícito) o circuito de quest LEVA o jogador ao early game | **Zerar TODAS as 19 quests → chega só ao nível 3** (2.500 < 2.728 = piso do L4) |

**Causa-raiz:** o §Orçamento foi escrito (bateria M1, jun/2026) contra a **curva CÚBICA antiga** (lvl 5 = 800). A curva migrou p/ **lei de potência** (`175·(n−1)^2.5`, lvl 5 = 5.600 — re-pin de 2026-06-11, `curva-xp-exponencial.md`), **7× mais íngreme no early**, e os números de XP das quests **NÃO foram re-escalados junto.** O orçamento "FORTE" que o criador decidiu hoje entrega **~3,7% de 1→8** — quest virou guarnição, não o motor.

### A curva em si está CERTA (não mexer)

Reconciliando com o XP/h do próprio doc da curva (8,9k early → 12,3k mid → ~16k late):

- **1→8 = 2,0h** · **1→25 = 33,4h** — dead-center no alvo do doc (30–45h). ✅
- Meu farm-loop mede ~10k early / ~16–22k mid (um pouco acima do doc porque o farmer naïve over-fight T2 sem downtime) → **consistente**. A curva está calibrada; **o problema é SÓ o orçamento de quest, que ficou preso na curva morta.**

## 6. Decisões de FEEL para o criador (medidas, NÃO aplicadas — `✏️` é dele)

### (A) Orçamento de XP das quests — re-escalar p/ a curva nova? **[a maior]**

O criador decidiu "orçamento FORTE: quests carregam o early, lvl 5 ~60% de quest". Hoje isso **não acontece** (cobre 9% até L5). Triplicar 19 quests é mudar quanto o jogo "se joga jogando conteúdo" vs "se farma" — **knob de feel do criador.** Opções dimensionadas (alvo = recriar a INTENÇÃO do doc sob a curva nova):

| Opção | O que faz | Resultado medido |
|---|---|---|
| **A1. Re-escala ~3,3×** | rito+simples×3,3, compostas idem (Q1=165, Q5/Q6=330, Q9=1.150…) | rito+6 simples ≈ 1.650 XP → **~30% do caminho até L5**; early completo ≈ 2.800 → cobre 50% até L5 (a intenção "FORTE" do doc) |
| **A2. Re-escala ~5×** | mais agressivo | rito+6 simples ≈ 2.500 → **~45% até L5**; quase-"lvl 5 só de quest" — provavelmente forte DEMAIS (mata o farm early) |
| **A3. Manter** | aceitar que quest é guarnição de XP (paga em gold/itens/conhecimento, não em nível) | quest = 4% de 1→8; o early é farm. **Contradiz o §Orçamento atual** → então re-escrever o doc p/ refletir isso |

**Recomendação do Balancista:** A1 (~3,3×) — recria exatamente o "~50–60% até L5 de quest" que o doc PEDE, sem matar o farm. Mas é **decisão do criador** (define o tom: RPG de quest vs RPG de grind). Seja qual for, **QUESTS.md §Orçamento precisa ser reescrito** (a tabela de XP e a régua cúbica citada estão obsoletas). Eu deixei os defs como estão (= doc atual) — mexer em 19 quests sem o aval do criador seria tuning de feel.

### (B) Régua de gold/h da ECONOMIA.md — está stale (food matou o gargalo de descanso)

`ECONOMIA.md`: "gold/h T1 ≈ **40–80 nu** / 120–220 informado". **Medido hoje: T1 nu = 330–460/h** (rato 333, morcego 429, lobo 462) — **4–8× a régua.** Goblin 1.030, bandido 1.970, esqueleto 1.090.

**Causa-raiz (igual à curva): a régua 40–80 foi setada (economia-passe1, jun/2026) sob o modelo SEM comida, onde "descanso 60–90% era o gargalo universal"** (ver `formulas.ts` §regen + backlog #7 + #10 "✏️ validar na sim quando loot entrarem"). Agora a comida está na sim → **zero downtime de descanso** → kph 3–6× maior → gold/h sobe na mesma proporção. **Os números POR-DROP estão certos** (rato 0–1, goblin 1–3, bandido 4–10 = os do doc, internamente coerentes); o que mudou foi o **multiplicador kph**, não nenhum drop "10× gritante". Por isso **NÃO cortei nenhum loot** (não há o "loot rate 10× fora" que o work-order autoriza fixar — a deriva é uniforme e sistêmica).

Opções (decisão do criador — afeta o tom da economia inteira):

| Opção | O que faz |
|---|---|
| **B1. Atualizar a régua** | re-escrever ECONOMIA.md: "gold/h T1 nu ≈ 300–460 (pós-comida)". Re-ancorar o sink âncora (skill T2 150–300 → talvez 600–1.200) e o preço da Poção (65 → ~200?) p/ manter as PROPORÇÕES (Koster: sink âncora > faucet do tier). **Recomendado** — preserva os ratios, só re-pina a escala. |
| **B2. Cortar gold-drop ~5×** | rato 0–1→pingo, etc. — devolve a régua 40–80, mas faz gold "raro de novo". Risco: trivializa nada e pode tornar o sink âncora barato demais. |
| **B3. Frear o kph** | respawn mais lento por spot (`MapMonster.respawnMs` override) → menos kills/h → menos gold E menos XP. Muda o ritmo de TODO o loop, não só gold. |

**Recomendação:** B1 (re-pinar a régua + os sinks na mesma proporção). É a consequência natural de "a comida entrou" que os próprios docs anteciparam (backlog #7/#10). Mas a magnitude do sink âncora e do preço da poção é **knob visceral do criador.**

### (C) Rito de classe — custo 150 ainda "uma sessão real"?

`RITO_COST_GOLD = 150` foi ancorado em "≈ soma das 6 simples / ~2h de caça T1" (sob a régua antiga 40–80/h). Com gold/h real ~330–460, **150 sai em ~20–30 min de caça** (ou só com o gold das 6 simples = 150 exato). Continua sendo "uma conquista do early" mas mais leve do que o doc imaginava. **Não mexi** (o número casa com "6 simples = 150"); se o criador re-escalar o gold (opção B), provavelmente quer subir o custo do rito junto p/ manter "uma sessão".

## 7. Coisas que estão BEM (medido — não tocar)

- **Ladder de TTK T1→T2** progressivo, sem esponja (§1). ✅
- **Letalidade / descuido** (§3): 2+ mobs matam de verdade; sustain>damage na durabilidade. ✅
- **Classless start** (medido à parte): espada cega L1 mata rato em 4,8s / morcego 3,4s / esqueleto 7,2s, 0 mortes em 1v1; o rito de 6 ratos é vencível (2 mortes só pro farmer naïve que puxa vários sem comer). Fase classless é "real mas justa" — alinhado ao M1.1. ✅
- **Curva de XP** (`175·(n−1)^2.5`): 1→25 ≈ 33h, dead-center no alvo. ✅ **Não é a curva que está errada — é o orçamento de quest preso na curva velha.**
- **Food uptime** (§8 abaixo): regen saciado < DPS on-level (invariante OK), mas sustentável entre kills. ✅

## 8. Food uptime — regen saciado vs custo de HP

| classe | regen/s L1 | regen/s L8 | HP perdido/kill (rato@L1) | HP perdido/kill (javali@L8) |
|---|---|---|---|---|
| knight | 2.00 | 2.70 | 13.8 | 66.4 |
| mage | 2.00 | 2.28 | 18.1 | 118.3 |
| rogue | 2.00 | 2.42 | 9.4 | 45.0 |
| priest | 2.00 | 2.56 | 18.1 | 118.3 |

**Leitura:** regen saciado (~2–2,7 HP/s) **nunca out-heala o DPS on-level** (invariante de design preservado — você NÃO regenera no meio do fight on-level), mas entre kills recupera o custo de um rato (13,8 HP) em ~5–7s e de um javali (66 HP) em ~25s — **food-gated sustain funciona**: com comida, o downtime entre kills é curto; SEM comida, regen = 0 → morte (é o que infla as mortes do farmer T2 que fica sem comida). O queijo (regen 1.0×, 60s) e a carne (regen 2.0×, 120s) que os mobs dropam cobrem o consumo do farm T1 sem auto-sustentar (a chance de drop ~8–10% mantém o food-gating como gold-sink, conforme `bestiary.ts`). ✅

> ✏️ Refino fino de food-uptime (drop de comida vs consumo exato por classe/spot, e se o caster precisa de mais sustain) fica para uma bateria de throughput dedicada — aqui o sinal é "funciona e não auto-sustenta", que é o alvo.

---

## Apêndice — método e reprodução

- Harness: `/tmp/cal-harness.ts` (descartável). Bundle: `npx esbuild /tmp/cal-harness.ts --bundle --platform=node --outfile=/tmp/cal.cjs && node /tmp/cal.cjs`.
- Fixture: mapa plano 80×80 de grama, sem zona segura, spawn central. Player montado por `addPlayer` + ajuste de nível/atributos (4 pts/nível, custo RO, 70% no atributo de dano / 30% Vit) via `progressions`/`recomputePlayerDerived` (igual ao que a sim concede em level-up).
- TTK: player colado ao mob, `selectTarget`, tick até morte (evento `death` do snapshot). Média 8 seeds (físico ±40%).
- TTL: mob(s) com `provoked/chasing/targetId` setados, player imóvel, tick até evento `death` do player.
- Farm-loop: player num grid esparso (espaçamento ≥15 tiles → aggro pega 1–2 por vez = caça solo, não "puxa o spot"); IA caça-mais-próximo + come quando não-saciado + loota ouro a ≤1 tile; 10 min × 2 seeds.
- Curva/orçamento: aritmética sobre `xpForLevel` + os `rewards.xp` dos defs.
- `npx tsc --noEmit`: **verde** (só os 4 ritos editados).
