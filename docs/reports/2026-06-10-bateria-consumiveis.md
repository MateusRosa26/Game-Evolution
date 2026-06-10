# Bateria — Consumíveis com efeito (poção + comida)

**Data:** 2026-06-10
**Contexto:** o verbo `useItem` acabou de entrar na sim (poção = cura instantânea; comida = status `wellFed` que multiplica regen). Os números nasceram placeholder; esta bateria os calibra empiricamente. Ancoragem: caça T1, Knight L1 vs Rato Lanhoso, na sim determinística (harness headless descartável).

## Baseline medido (Knight L1)

| Métrica | Valor |
|---|---|
| maxHp | 114 |
| maxMp | 34 |
| Regen base | 1,98 HP/s (≈ 2,0; fórmula `0,4 + Vit·0,2`, Vit 8) |
| TTK 1 rato (1v1) | 1,95 s |
| HP perdido por rato (1v1 limpo) | **11 (10% do maxHp)** |

> ⚠️ Medição inicial deu "53 HP/rato" — era a **matilha inteira** do testMap (aggro 6) batendo junto. Isolado o 1v1, o rato tira só 11. O número de matilha (53) confirma a régua do bestiário ("matilha mata em ~6,4 s").

## Achado estrutural: o gargalo é o REGEN BASE, não o consumível

Downtime = tempo pra regenerar os 11 HP perdidos num 1v1; uptime = TTK / (TTK + downtime):

| Multiplicador de comida | Downtime | Uptime |
|---|---|---|
| 1,0× (sem comida) | 5,6 s | 26% |
| **1,5×** (placeholder) | 3,7 s | 35% |
| **2,0× (escolhido)** | **2,8 s** | **41%** |
| 2,5× | 2,2 s | 47% |
| 3,0× | 1,9 s | 51% |

Mesmo num 1v1 trivial (11 HP de dano), o jogador passa **74% do tempo descansando** sem comida — porque o regen base (2,0 HP/s) é lentíssimo. Isso é calibração de **regen core** (backlog #11, ainda placeholder), que a comida sozinha não conserta. A régua de consumível aqui é **relativa** (robusta a maxHp/regen); o **absoluto** (a comida 2,0× produz o uptime certo?) precisa ser revisto quando o regen base sair de placeholder. Acopla os backlogs #7 (recalibrar XP/h com comida — feito, comida entrou) e #11.

## Poção: cura como % do maxHp

| Cura | % maxHp | Ratos de fôlego |
|---|---|---|
| 25 | 22% | 2,3 |
| **30 (escolhido)** | **26%** | **2,7** |
| 40 | 35% | 3,6 |
| 50 (placeholder) | 44% | 4,5 |

50 (44%) era generoso demais pra "emergência pequena" (quase um reset contra mob único). **30 (26%)** é botão de pânico real sem trivializar. Alvo de régua: **poção pequena = 25–30% do maxHp**.

## Economia (preço como luxo)

Ciclo de caça ~4,7 s no harness (1v1, sem deslocamento/respawn) → teto irreal de 306 gold/h. A régua realista é a do passe-1 de economia (**40–80 gold/h nu, 120–220 informado**). Com isso:

- **Poção 65 g** ≈ 50–90 min de caça nua → **luxo de early** ✓ (confirma a decisão do criador de 65 g).
- **Pão 2 g / Carne 6 g** ≈ < 1–3 min de caça → sustain trivial de manter, como deve ser.

Custo-eficiência da comida: pão 60 s/g, carne 50 s/g. Pão = grind mais barato por segundo (mais cliques/peso); carne = conveniência premium (menos cliques, mais duração por porção). Tradeoff saudável — mantido.

## Diff aplicado (antes → depois)

| Número | Antes | Depois | Motivo |
|---|---|---|---|
| Poção `heal.hp` | 50 | **30** | 44% → 26% do maxHp (emergência, não reset) |
| Poção `heal.exhaustMs` | 1000 | 1000 | mantido (1 pot/luta, fiel ao Tibia) |
| Pão `food.regenMult` | 1,5 | **2,0** | 1,5× fraco demais pra sentir; 2,0× quase metade o downtime |
| Carne `food.regenMult` | 1,5 | **2,0** | mesma intensidade do pão (diferença é duração) |
| Pão/Carne `durationMs` | 120 s / 300 s | mantidos | cobre ~5–15 mobs/porção em caça realista |
| `FOOD_SATIETY_CAP_MS` | 600 s | mantido | buffer de ~10 min de saciedade |

## ADENDO — Decisão do criador: regen FOOD-GATED (modelo Tibia/Apogea)

A partir do achado acima (o gargalo é o regen-espera grátis, que fere o pilar 7),
o criador decidiu **mudar o modelo de sustain** (2026-06-10):

- **Sem comida = regen ZERO** (HP **e** mana), em **qualquer lugar** (sem piso de
  santuário). Comida é pré-condição do regen.
- **Regen acontece sempre que saciado**, inclusive em combate, em ritmo **lento**.

Isso converte o "rest grátis e lento" (anti-padrão do pilar 7) num **loop de
economia**: o downtime agora custa comida (gold + peso + teto de saciedade), e a
poção vira a única cura sem comida (emergência de verdade).

**Implementação:** `wellFedRegenMult` retorna **0** quando não-saciado (antes 1);
`HP/MANA_REGEN_*_PER_SEC` passam a ser a *taxa enquanto saciado*; a comida
multiplica essa taxa por sua qualidade.

**Re-medição do modelo novo (Knight L1 base):**

| Estado | HP/s | Mana/s | Observação |
|---|---|---|---|
| Sem comida | **0** | **0** | não recupera de jeito nenhum |
| Pão (1,0×) | ~2 | ~2 | sustain mínimo de grind |
| Carne (1,5×) | **3** | ~3 | premium: regen + duração melhores |
| DPS do rato | 4,4 | — | comida **NÃO out-heala** (3 < 4,4) ✓ |

1v1: sem comida perde 14 HP; com carne perde 9 (regen-em-combate abate ~5 sem
trivializar — o rato ainda machuca líquido). Downtime saciado p/ +11 HP: pão
5,6 s, carne 3,7 s. **Sem comida não há downtime que recupere — só a poção.**

### Diff final aplicado (modelo food-gated)

| Número | Antes | Depois | Motivo |
|---|---|---|---|
| `wellFedRegenMult` não-saciado | 1 (regen base grátis) | **0** | comida é pré-condição |
| Pão `food.regenMult` | 1,5 | **1,0** | taxa-base saciado (~2 HP/s) |
| Carne `food.regenMult` | 1,5 | **1,5** | premium ~3 HP/s, < DPS do rato |
| Poção `heal.hp` | 50 | **30** | 26% maxHp; única cura sem comida |

## ADENDO 2 — Escala do regen por nível (invariante + decisão)

Régua do criador (2026-06-10): **o regen cresce com o nível e eventualmente
SUPERA o dano de conteúdo out-levelado, mas NUNCA o do nível atual.** Contra mob
do seu tier, sustain ainda exige cuidado/comida/poção; contra tier velho, lvl alto
engole o dano (voltar à zona inicial e mal ser arranhado).

**Como o regen cresce — decisão:** `base + (regen/nível por classe)`, **DESACOPLADO
da Vitalidade/Espírito**. Motivo (insight do criador): Vit já compra o POOL (maxHp);
deixá-la comprar também a VELOCIDADE de encher = double-dip (stat dominante, Sirlin).
Separação limpa: **Vit/Esp = tamanho do tanque; nível/classe = velocidade de encher.**
Emergência saudável: pure-Vit = tanque grande mas enche devagar relativo ao pool.
Tensão com o anti-treadmill (pilar 7): mínima — regen-por-nível é a MESMA categoria
do `hpPerLevel` já aceito (infraestrutura de sobrevivência, não recompensa-isca).

**Curva verificada (knight, saciado):**

| lvl | base | pão 1,0× | carne 1,5× | out-heala rato (DPS 4,4)? |
|---|---|---|---|---|
| 1 | 2,0 | 2,0 | 3,0 | não |
| 10 | 2,9 | 2,9 | 4,35 | não |
| 15 | 3,4 | 3,4 | 5,1 | só carne |
| 25 | 4,4 | 4,4 | 6,6 | pão+carne |

Invariante OK no T1 (L1 carne 3,0 < 4,4). Diferenciação de classe (L20): knight HP
3,90 > rogue 3,33 > priest 3,14 > mage 2,76; mana invertido (mage 2,90 > … > knight
1,38). `CLASS_GROWTH` ganhou `hpRegenPerLevel`/`manaRegenPerLevel`.

**Calibração em 2 âncoras (rato T1 + esqueleto T2):** o slope do knight (0,10/nível)
foi validado contra os DOIS mobs que existem, no nível-alvo de cada tier:

| mob | tier | lvl-alvo | carne/s | DPS | razão | out-heala? |
|---|---|---|---|---|---|---|
| Rato | T1 | 1 | 3,00 | 4,38 | **69%** | não |
| Esqueleto | T2 | 8 | 4,05 | 6,00 | **68%** | não |
| Esqueleto | T2 | 15 (topo) | 5,10 | 6,00 | 85% | não |

A razão **~68% do DPS no nível-alvo** se repete nos dois tiers independentes — o
0,10 não é arbitrário, é o valor que segura essa régua. Crossover (out-heal): rato
~lvl 11, esqueleto ~lvl 21 — sempre bem depois do nível-alvo. **Régua: regen saciado
no nível-alvo ≈ 65–70% do DPS do mob daquele tier.**

> ⚠️ Ainda aberto: HP regen das OUTRAS classes (derivado por analogia de
> `hpPerLevel`, não medido), o regen de MANA (sem âncora de dreno ainda), e a
> extrapolação a T3–T5 (sem mobs). A régua dos 68% prevê o slope; #11 confirma
> quando o bestiário crescer.

## ADENDO 3 — Regen em PULSOS + escala de comida 1–3× (decisão do criador)

Decisão (2026-06-10): (a) o regen aplica um **CHUNK a cada `REGEN_INTERVAL_MS`
(5s)**, não contínuo — feel de "curas em pulsos" (fights curtos podem não pegar um
pulso). (b) O mult da comida vai de **1× a 3×** pela escala de preparo: básico/cru
~1×, receita simples (cozido) ~2×, premium (receita combinada) ~3×. Cap ~3×.

Implementação: `regenTick` virou timer (`Progression.regenTimerMs`); chunk =
taxa/seg (nível+classe) × mult × 5. Carne re-slotada 1,5→**2,0×** (cozido).

**Medido (knight L1, base 2/s):**

| mult (tier) | pulso/5s | média | vs rato 4,4 |
|---|---|---|---|
| 1× cru/básico | 10 HP | 2,0/s | não out-heala ✓ |
| 2× cozido/simples | 20 HP | 4,0/s | não out-heala ✓ |
| 3× premium | 30 HP | 6,0/s | **OUT-HEALA** ⚠️ |

Sem comida = pulso vazio (0 regen) ✓. Primeiro pulso aos 5,0s.

> ⚠️ **Tensão de design:** com cap 3×, comida premium trivializa conteúdo do
> PRÓPRIO nível (3× = 6/s > rato 4,4). Só não quebra hoje porque receita premium
> não existe (só 1× e 2× existem). **Gating do premium 3× = decisão do sistema de
> cozinha** (receita gated por nível/ingredientes que acompanham o tier do conteúdo),
> OU baixar a taxa-base. Lumpiness: chunk de 20–30 HP num pool de 114 é visível em
> combate — se incomodar, baixar `REGEN_INTERVAL_MS` (ex. 3s) suaviza.

## Pendências ✏️ (criador / futuro)

1. **Calibrar os coeficientes de regen/nível** (`CLASS_GROWTH.*RegenPerLevel` +
   bases) na bateria do regen core (#11), com a curva de DPS×nível-alvo por tier.
2. Confirmar "poção pequena = 25–30% maxHp" como régua das poções maiores.
3. Poção de **mana** (caster) — agora mais necessária (mana também é food-gated).
4. **HUD de saciedade** (F2): "Bem Alimentado" deixou de ser bônus e virou estado
   NECESSÁRIO — o jogador precisa enxergar quando o regen está ligado/desligado.
5. **Comida inicial** garantida ao novato (kit/quest/fonte barata) p/ o modelo
   zero-regen não virar softlock no começo.
6. Verbo de **ferramentas** (corda/pá/tocha) é outro sistema — fora desta bateria.
