# Bateria — Armadura/Escudo T1 × TTL "matilha pune"

**Data:** 2026-06-11 · **Skill:** Balancista · **Branch:** `feat/armadura-escudo` · **Harness:** descartável (esbuild+node, sim headless, `/tmp/bat-armor.mjs`).
**Atacante de referência:** knight lvl 1, espada curta, **114 HP** (mesma régua das baterias anteriores). Arena 21×21 grama, sem safe zone, mobs forçados adjacentes ao player **passivo** (não revida). Morte detectada pelo salto de HP do respawn (regen food-gated = 0 sem comer).

**Objetivo:** validar a mitigação recém-implementada (`applyDamage`, ordem **bloqueio% → Def flat → piso 1**) — o set de couro T1 (Σ Def 3, split 1/1/1/0) preserva o pilar 2 (descuido = morte) ou trivializa o perigo T1?

**Dano dos mobs T1 (bestiário atual):** morcego 5@1,4s · rato 7@1,6s · esqueleto 9@2,0s · goblin 11@1,8s · lobo 14@1,7s.

---

## TTL (segundos apanhando sem reagir) — facetank forçado

| Matilha | sem armadura | couro Σ3 | couro + escudo (20%/70%) |
|---|---|---|---|
| morcego ×2 | 15,4 | **39,3** | 42,0 |
| **rato ×2** | 12,8 | **22,4** | 25,6 |
| rato ×3 | 8,1 | 14,4 | 16,1 |
| esqueleto ×2 | 12,1 | 18,1 | 22,1 |
| goblin ×2 | 9,1 | 12,7 | 14,4 |
| **lobo ×2** | 6,8 | **8,6** | 10,3 |
| lobo ×3 | 3,5 | 5,2 | 6,8 |
| rato+lobo | 8,6 | 11,9 | 13,7 |
| goblin+lobo | 6,8 | 9,1 | 12,7 |

> Baseline (sem armadura) é deste harness (facetank, adjacência forçada t0) — um pouco mais cru que a medição de campo da bateria 2026-06-10; o que vale é o **efeito relativo** da armadura, medido idêntico nos três casos.

---

## Veredito

1. **rato ×2 = 22,4s com couro — bate em cheio o alvo de design** do `EQUIPAMENTO.md` ("Com Σ2–3, TTL contra 2 ratos continua matando o descuidado ~20–25s"). ✓ O split **Σ3 = 1/1/1/0 (coifa/túnica/calças/botas)** está **calibrado**, não mais provisório.
2. **Pilar 2 preservado onde importa.** As matilhas que de fato punem continuam letais com armadura: **lobo ×2 = 8,6s**, lobo ×3 = 5,2s, goblin+lobo = 9,1s. "A alcateia é a skill" sobrevive à armadura — o descuidado morre. ✓
3. **Escudo (bloqueio 20%/70%) = +~15% de TTL** sobre o couro (rato ×2 22,4→25,6; lobo ×2 8,6→10,3). Modesto e coerente com a identidade defensiva do Knight, sem virar muro (bloqueio comum nunca é 100% — regra de identidade do *Inabalável*). ✓ Mantido.
4. **Custo conhecido e aceito — Def flat guta o mob de dano baixo.** morcego ×2 vai de 15,4→39,3s (com escudo 42s): 5−3=2 perde 60% do dano, e a dupla de morcego vira **quase inofensiva**. É a consequência matemática de Def plana contra atacante de base baixa — e o próprio `EQUIPAMENTO.md` aceitou esse tradeoff ao escolher Σ2–3 (Σ5–6 derrubaria o T1 INTEIRO ao piso). Como o **morcego já era a matilha mais fraca** (maior TTL mesmo sem armadura) e é mob-piso de atmosfera (12 xp, Sentinela), trivializá-lo é tolerável: nenhum spot lucrativo vira facetank seguro (lobo/goblin/ratos-em-número seguem letais → Sirlin ✓).

## Recomendações

- **Sem mudança de número.** Os provisórios (`couro Σ3 split 1/1/1/0`, `escudo 0.2/0.7`) **passaram na régua** — promover de ✏️ para calibrado.
- **TTK inalterado** (player→mob): mob não tem armadura (`armorDef 0`), confirmado na sanidade da feature — a armadura só mexe no TTL, como deve.
- **Opção ✏️ Designer de Sistemas (não obrigatória):** se o criador quiser o morcego_**sanguessuga** ainda relevante contra alvo blindado, o caminho é mecânico, não numérico — um **leech pequeno que ignora Def** (tema do bicho), não subir Σ (que estragaria o pilar 2 dos ratos). Fica como gancho, não pendência.

## Próximo

- Re-medir XP/h e o **TTL realista** (com caminhada/regen) quando a **comida entrar na sim** e o **re-layout da vila** assentar os spots (backlog Balancista #7) — esta bateria é facetank puro, o teto de letalidade.
