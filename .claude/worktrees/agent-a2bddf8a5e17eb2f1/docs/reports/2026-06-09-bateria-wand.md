# Bateria da WAND — auto-attack mágico (Cajado / Cetro)

**Data:** 2026-06-09 · **Balancista** · fecha o **Achado #1** da bateria T2 de skills
(`2026-06-09-bateria-t2-skills.md`): "wand de caster QUEBRADA — mago sem mana = inútil
(>60s / 176 HP perdido)". Harness descartável (esbuild+node, sim headless, `/tmp`).

## O que mudou no código (mecanismo — fora desta bateria, já aplicado/tsc limpo)

Modelo decidido pelo criador (09/jun, Tibia): **a wand NÃO escala com nenhum atributo**; o
dano vem da PRÓPRIA arma, numa **faixa fixa** rolada por tiro; **gasta mana** (pequena) por
tiro; cadência **fixa** (sem redução por Destreza).

- `WeaponStats` (templates.ts) ganhou `magic?`, `damageMin?`, `damageMax?`, `manaCost?`.
- `formulas.wandDamage(min, max, roll)` — função PURA (recebe `roll ∈ [0,1)`; preserva o
  contrato "sem RNG" do arquivo). A Simulation passa um stream RNG próprio (`combatRng`,
  seedado) — determinismo preservado, sem perturbar o stream do loot.
- `Simulation`: `recomputePlayerDerived` e `updatePlayerAttack` ganharam o ramo mágico —
  sem mana, o tiro **não dispara e NÃO queima o cooldown** (retenta quando a mana regenera).
- `damageType` do cajado/cetro: `"physical"` → `"arcane"` (sem efeito numérico hoje;
  `applyDamage` ainda não aplica resistência por tipo — é correção de futuro).

## Cenário medido

Mago **lvl 10 on-level** (build 2:1 Int:Vit respeitando custo por faixa) vs **1 Esqueleto**
(HP 95, dano 12, cd 2,0s), **auto-only** (sem usar nenhuma skill — o pior caso, "estou sem
mana"). Mago: maxMp **226**, regen **2,2 mana/s** (≈4,8 por janela de tiro de 2,2s), HP máx ≈167.

### TTK auto-only — varia a faixa (manaCost 2, cd 2,2s)

| Faixa | TTK | HP perdido (de 167) | Sobrevive 1v1? |
|---|---|---|---|
| 6–10 | 26,4s | 110 (66%) | sim, a ~34% |
| **8–12 (ESCOLHIDA)** | **19,9s** | **77 (46%)** | **sim, a ~54%** |
| 10–14 | 17,6s | 70 | sim |
| 12–16 | 13,3s | 55 | sim |

Como a wand não escala atributo, o TTK auto-only é função **só da faixa** (≈ 95 HP ÷ DPS).
Qualquer faixa testada já mata o baseline quebrado (>60s) e o mago sobrevive ao 1v1.

### Sustento de mana — varia manaCost (faixa 8–12)

| manaCost | TTK | min mp (de 226) | nota |
|---|---|---|---|
| 1 | 19,9s | 225 | sustentou |
| **2 (ESCOLHIDO)** | 19,9s | **224** | sustentou |
| 3 | 19,9s | 223 | sustentou |
| 4 | 19,9s | 222 | sustentou |
| 5 | 19,9s | 219 | sustentou |

Com regen 2,2/s cobrindo a janela de 2,2s, **a mana nunca seca** nem a custo 5. O custo do
auto é **token** — a mana só vira constraint no nível de spammar *skills*, não no auto. Isso
**resolve o achado #1** na raiz: um mago sem mana de skill continua útil pelo wand, que se
banca no regen. Custo 2 ("bem pequena", criador) deixa a pressão de mana onde ela deve estar
(orçamento auto-vs-burst), sem tornar o auto auto-sabotável.

## Decisão (criador, 09/jun) — APLICADA

**Cajado Simples e Cetro: `damageMin 8`, `damageMax 12`, `manaCost 2`, `baseCooldownMs 2200`,
`damageType "arcane"`.** Escolha do criador entre 6–10 (mais fiel ao "tudo baixo"/doc 7-9) e
8–12: ficou **8–12** — filler competente, o mago não fica anêmico no jogo normal (a wand
dispara entre cada spell), mantendo-se bem abaixo do dano-por-golpe do melee (espada ~26 no
lvl 10) e da força real do mago (burst de magia). Cetro = mesma faixa; Priest tem Espírito
alto, então sustenta com ainda mais folga.

## Adendo (mesmo dia) — wand RANGED + custo de mana por tier

Decisão do criador após a calibração de dano: **a wand é ranged, com alcance MENOR que o
arco**, e **o custo de mana/tiro SOBE com o tier da wand**.

**Código (aplicado, tsc limpo):**
- `balance.ts`: `WAND_RANGE = 3`, `BOW_RANGE = 5` (✏️ arco ainda não numerado) com a regra
  travada `WAND_RANGE < BOW_RANGE`. `WeaponStats.range?` (ausente = melee `MELEE_RANGE` 1).
- `updatePlayerAttack` checa o alcance da ARMA equipada (não mais a constante melee).
- Cajado/Cetro: `range: WAND_RANGE` (3).
- ⚠️ **Sem linha de visão** — alcance é Chebyshev puro; LoS/projétil bloqueado por parede é
  wave futura (EQUIPAMENTO.md "numerar com projétil na sim").

**Medido (mago lvl 10, Esqueleto começa a 5 tiles, player PARADO):**

| Alcance | TTK | HP perdido | 1º acerto |
|---|---|---|---|
| 1 (melee) | 20,8s | 77 | a 1 tile (t=20) |
| **3 (wand)** | 20,2s | 78 | **a 3 tiles (t=8)** |
| 5 (arco, comparação) | 19,9s | 79 | a 4 tiles (t=1) |

Parado, o alcance é **quase neutro** no HP perdido — assim que o mob encosta, a luta é cara a
cara igual. **O valor do range é o KITE**, que o bot parado não expressa: Esqueleto anda a
`baseStepMs 280` vs jogador `260` (jogador é mais rápido) → um mago que kita **mantém o gap e
toma ~0 de retaliação**, matando em ~20s de tiros grátis. Isso é **expressão de habilidade**
(dificuldade cai com skill, não com gear — pilar 7), e o range 3 < arco 5 preserva o nicho de
**distância longa** do arqueiro (que ainda paga em munição/gold, não mana).

**Ladder de custo de mana por tier (proposta ✏️ — T1 travado, T2+ calibrar quando existirem):**
ancorada no regen do mago (~2,2/s low-spirit ≈ 4,8 mana por janela de tiro de 2,2s). Custo
cruzando ~4,8 = a wand deixa de se bancar só no regen → exige investir Espírito/Int ou racionar.

| Tier | manaCost/tiro | leitura |
|---|---|---|
| **T1** | **2** | token; sustenta fácil no regen |
| T2 | ~3 | ainda sustenta; sente um pouco |
| T3 | ~5 | beira o teto de regen low-spirit → tensão de stat |
| T4 | ~7 | exige mana investida p/ spammar |
| T5 | ~9 | wand de tier alto cobra build de mana |

(Damage por tier sobe junto — numerar com o roster de wands T2+.)

## Flags / próximos passos

- **Re-check do spread single-target.** O "mage auto+BdF 3,0s" da bateria T2 foi medido com a
  wand QUEBRADA (≈7 phys). Com 8–12, a rotação auto+BdF do mago ficou **mais rápida** → o
  spread inter-classe (knight 3,9 / mage / rogue 1,3 / priest 2,1) precisa ser re-medido numa
  próxima passada. Não é regressão — é o buff pretendido; só re-aferir o relativo.
- **Wand como ranged?** Hoje o auto da wand usa `MELEE_RANGE` (adjacência), igual ao melee.
  Wand-à-distância é outro lever (toca alcance/IA), FORA do escopo desta bateria — flag p/
  decisão futura (Designer de Sistemas).
- **Faixa por tier (T2+).** Wands melhores = a progressão do "tiro básico" do caster (gear,
  como o guerreiro troca de arma). Numerar T2/T3 quando o roster de wands entrar. ✏️
- **Variância no combate core.** A wand introduz o 1º RNG de dano da sim (melee segue fixo).
  Coerente com a decisão "faixa" do criador; se algum dia melee ganhar variância, reusar
  `combatRng` + um helper análogo.
