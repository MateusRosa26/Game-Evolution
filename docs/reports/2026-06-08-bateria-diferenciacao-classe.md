# Bateria — Diferenciação de classe (magia de-classada)

**Data:** 2026-06-08 · **Balancista** · contexto: sessão que de-classou a magia (gate só por
atributo+nível) e moveu o peso da diferenciação pro **corpo automático + atributos iniciais +
desconto de afinidade** (DESIGN-EVOLUCAO.md §Sistema de Stats).

Harness descartável `/tmp/harness-magias.ts` (esbuild+node), **funções puras** de
`formulas.ts`/`numbers.ts` — resource/economia/curva-de-build são determinísticas e fechadas
(não precisam da sim de combate). Build "fiel à fantasia" por classe (pesos de distribuição
dos 4 pts/nível); custo de stat RO puro ativo.

## Restrição estrutural (enquadra o escopo)

Só existe o **Rato Lanhoso** (24 HP, T1) na sim. A bateria M1.2 já provou: *contra mob que
morre em 1 cast, a skill mais barata domina sempre* — **diferenciação fina de dano/custo/
cooldown de skill está travada até existir um mob T2**. Esta bateria calibra o que NÃO depende
disso: pools de recurso, freio dos híbridos, survivability e a curva do desconto.

## Tabela 1 — Pools sob build fiel (HP / Mana)

| lvl | knight | mage | rogue | priest |
|---|---|---|---|---|
| 1 | 114/34 | 90/58 | 98/40 | 90/46 |
| 10 | 305/52 | 183/220 | 219/85 | 185/166 |
| 20 | 511/72 | 265/388 | 357/135 | 271/290 |
| 25 | 602/82 | 298/472 | 410/160 | 314/352 |

→ Spread **certo por design**: Knight muralha (HP ~2× Mage, mana ~1/6), Mage canhão de vidro.
Rogue e Priest no meio. **As CLASS_GROWTH placeholder já produzem a forma desejada.**

## Tabela 2 — Freio dos híbridos: Bola de Fogo (14 mana) — casts até secar

| lvl | knight | mage | rogue | priest |
|---|---|---|---|---|
| 1 | 2× | 4× | 2× | 3× |
| 10 | 3× | 15× | 6× | 11× |
| 20 | 5× | 27× | 9× | 20× |
| 25 | 5× | 33× | 11× | 25× |

Regen p/ 1 cast: knight 7,4s · mage 6,4s · rogue 8,8s · priest 5,0→1,8s.

→ **O freio funciona em escala**: um Knight que aprende Bola de Fogo dispara ~5 e seca por
~37s (7,4s/cast pra refill). É **ferramenta situacional, não rotação** — exatamente o
auto-balanceamento decidido. Reforçado pelo build: o Knight-fantasia tem Int baixa (mana
pequena E dano de fogo fraco); virar híbrido custa For/Vit (custo-crescente). O corpo
automático + build + custo-crescente **juntos** são o freio que substitui o lock-de-classe. ✓

## Tabela 3 — Survivability: TTL apanhando sem reagir (1 rato / 3 ratos)

| lvl | knight | mage | rogue | priest |
|---|---|---|---|---|
| 1 | 26s / 8,7s | 21s / 6,9s | 22s / 7,5s | 21s / 6,9s |
| 20 | 117s / 38,9s | 61s / 20,2s | 82s / 27,2s | 62s / 20,6s |

→ 1 rato nunca é letal (correto, é "primeiro sangue"). **Matilha de 3 = morte real** se não
reagir (lvl 1: 6,9–8,7s, bate com a M1.1 "matilha mata classless ~6,4s"). Spread mantém
identidade: Mage sobrevive ~½ do Knight no swarm.

## Tabela 4 — Desconto de afinidade no stat principal (A SACADA)

Nível p/ atingir o PRINCIPAL = 30 e = 40 (build focada no principal):

| | sem desconto | **Forma A** (rebate 1-a-cada-5 = 20%) | **Forma B** (faixa −1) |
|---|---|---|---|
| principal = 30 | lvl 19 | lvl 18 (**−1**) | lvl 14 (**−5**) |
| principal = 40 | lvl 32 | lvl 30 (**−2**) | lvl 24 (**−8**) |

→ **Forma A (o palpite "1 a cada 5") é INVISÍVEL**: economiza 1–2 níveis numa vida inteira —
o rebate volta pro pool e cai numa faixa mais cara, então 20% de rebate ≠ 20% menos níveis.
Não compensa o contador na UI.
→ **Forma B (faixa −1) é FELT**: −5 a −8 níveis pra chegar ao extremo (~25% mais rápido). Zero
bookkeeping (custo já aparece menor), integra direto em `statPointCost`.
→ **Forma B preserva a anti-degeneração da M1.2**: o vilão da M1.2 era o custo FLAT (não subia).
Faixa −1 **mantém a curva subindo** (só desloca uma faixa pra baixo: 1/1/2/3 vs 2/2/3/4) — não
achata, não libera all-in infinito. O único efeito colateral a vigiar é o Knight (principal=Força)
cruzar o one-shot do rato ~1 faixa antes; como o rato é T1 e o jogador já o ultrapassou nessa
altura, é artefato de T1 — **re-checar na bateria T2 quando o desconto estiver implementado**.

**RECOMENDAÇÃO: Forma B (faixa de custo −1 no stat principal), cobrindo só o principal (1 stat).**

## Sagrado de-classado escala por Esp (validação)

Curar Ferimentos (power 18, +Esp×1,3): lvl 20 → Knight (Esp 5) cura **24** vs Priest (Esp 22)
cura **46** (~2×). Confirma: qualquer classe aprende sagrado, mas **o Espírito gateia a
potência** — o Priest cura ~2× um Knight sem precisar de lock de classe. A de-classação fecha
numericamente. ✓

## Decisões / entregáveis

1. **CLASS_GROWTH + CLASS_BASE_ATTRIBUTES validados** (promover de ✏️ a calibrado-MVP): o spread
   produz muralha-vs-canhão, freio de híbrido e survivability na régua. Escala ABSOLUTA de HP e
   coeficientes de dano ficam pra re-régua na **bateria T2** (mob que sobrevive ao 1º hit).
2. **Desconto de afinidade = Forma B (faixa −1), só no principal.** Forma A descartada (invisível).
3. **DEFERIDO (travado em T2):** dano/custo/cooldown RELATIVO das skills; coeficientes finais de
   combate (`STRENGTH_DAMAGE_FACTOR` etc.). Pré-requisito: criar um mob T2 no bestiário/sim.

## Mob T2 criado — Esqueleto (destrava a diferenciação) ✓

Adicionado `ESQUELETO` em `src/sim/bestiary.ts` (família-coração undead, T2, Perseguidor, só
básico → encaixa no comportamento `chaser`). Números: **HP 48** (sobrevive a 1 cast no nível-alvo
8–15), dano 12, XP 45, 2000ms, baseStep 280 (kitável), respawn 15s, loot 1–3 gold.

**Prova na SIM REAL** (`/tmp/harness-esqueleto.ts`, Mage lvl 1 vs 1 Esqueleto isolado):

| Skill | dano do 1º cast | sobreviveu ao 1º cast? | efeito que passou a importar | TTK |
|---|---|---|---|---|
| Bola de Fogo | 29 → HP 19 | **sim** | 3 ticks de queimadura contribuíram | 2 casts / 1,5s |
| Lança de Gelo | 27 → HP 21 | **sim** | **slow** aplicado no alvo | 2 casts / 2,1s |

Contra o Rato (M1.2), ambas eram kill idêntico em 1 cast (burn/slow nunca existiam). Contra o
Esqueleto **divergem** — fogo mata mais rápido via DoT, gelo controla. **Diferenciação de skill
destravada.** `npx tsc --noEmit` limpo.

## Próximo passo recomendado

**Bateria T2 de skills** (backlog #6), agora possível: orçamento "T2 assusta quem chega do T1",
re-régua de LdG/burn/slow, coeficientes de dano (`STRENGTH_/INTELLIGENCE_DAMAGE_FACTOR`), wands de
caster (fix do auto-esponja), e o re-check do one-shot do desconto Forma B. Em paralelo: **alinhar
o código ao design** (tirar `STARTER_KITS`/campo `cls`, implementar tomo + desconto + retroativo).
