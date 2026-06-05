# Catálogo T1/T2 numerado — PROPOSTA validada em simulação

**Data:** 2026-06-05 · **Balancista** · backlog de calibração #3 (M2, itens implementados),
pré-requisito numérico das tabelas T1/T2 já aprovadas em `DESIGN-ITENS.md` (jun/2026).

> **Tudo aqui é PROPOSTA ✏️ — a decisão é do criador.** O Balancista não opina, SIMULA: a sim
> é determinística (zero RNG em combate no M1), então cada cenário é exato, não amostra. Onde a
> sim ainda não modela o sistema (Def flat de armadura, bloqueio de escudo, dano fixo de
> caster/wand, distância), o número é **derivado na aritmética da fórmula proposta** e marcado
> `derivado (não simulável ainda)`.

## Metodologia

Harness descartável em `/tmp` (esbuild `--bundle` + node, sim headless 20 ticks/s). Instancia
`Simulation` numa **arena 64×64 grass, sem safeZones**, planta o Rato Lanhoso (`bestiary.ts`)
adjacente ao jogador e **muta em memória os objetos exportados** antes de `addPlayer`
(`ESPADA_CURTA.weapon.baseDamage`, `ADAGA.weapon.*`, `CLASS_BASE_ATTRIBUTES`, `CLASS_GROWTH`).
Mede:

- **TTK** — `selectTarget` no rato, tica até a morte do mob (contagem de monstros = 0).
- **TTL** — jogador PARADO sem alvo, N ratos adjacentes, conta do 1º golpe recebido ao evento
  `death` do jogador (a sim respawna com HP cheio — TTL **tem** que ler o evento, não a barra).
- **Auto-dano efetivo** lido direto da entidade da sim (`entity.attackDamage`/`attackCooldownMs`,
  já quantizado à grade de ticks).

**Validação da régua:** o harness reproduz a bateria M1 ao dígito — knight pós-rito lvl 1, espada
curta base 6 → **auto 14 @1900ms, 114 HP, TTK 1,95s** vs rato 24hp/7dmg@1600ms/15xp. É a régua.

### ⚠️ Achado estrutural que governa o catálogo T1: **quantização por contagem de golpes**

O dano do jogo é estável e legível (sem crit, sem accuracy, mob não esquiva). Consequência: contra
um mob de **24 HP**, o que importa não é o dano por golpe, é **quantos golpes** ele exige —
`ceil(24 / auto)`. E a fórmula `physicalDamage = floor(base + STR·1.0)` tem o atributo dominando a
base no early. Medido:

| Contexto | STR | base 3 | base 4 | base 6 | base 8 | base 10 |
|---|---|---|---|---|---|---|
| Knight pós-rito (geared) | 8 | — | — | auto 14 → **2 golpes** | auto 16 → **2** | auto 18 → **2** |
| Classless (atrib. 5) | 5 | auto 8 → **3 golpes** | auto 9 → **3** | auto 11 → **3** | auto 13 → **2** | — |

**Leitura:** para o knight geared, base 5→10 **todos matam o rato em 2 golpes** (TTK idêntico
1,95s). Para o classless, base 3→6 **todos em 3 golpes**. A base só "vira" o TTK quando cruza um
**breakpoint de contagem** (ex.: classless base 8 cai de 3→2 golpes). **Por isso o diferenciador
sentido entre as armas T1 NÃO é o dano-base — é a CADÊNCIA (cooldown).** Isso casa com o design
("velocidade é perfil da família", `DESIGN-ITENS.md`) e é o eixo que proponho usar para numerar o T1.

> Implicação importante p/ o criador: a faixa de base que proponho abaixo (4–11) é praticamente
> **invisível vs o rato**; ela existe para (a) o perfil família-a-família, (b) o momento em que
> mobs T1 mais gordos e o T2 entrarem (onde 1–2 pontos de base mudam a contagem), e (c) o teto de
> ±10% do subtipo físico ser legível. **Re-medir quando existir um 2º mob T1 mais gordo.**

---

## Réguas-alvo declaradas (a partir da bateria M1)

| Slot/eixo | Régua | Justificativa |
|---|---|---|
| **Arma T1 de rito (melee)** | TTK ≈ **2,0s** vs rato pro knight geared; **3 golpes** pro classless | "desconfortável sem ser esponja" (M1 adendo); mantém o pós-rito ágil sem esponja |
| **Arma T1 (perfil)** | diferenciação por **cadência**, teto **±10%** de subtipo físico | base é invisível vs 24hp; cadência é o dial real |
| **Adaga T1 (Rogue)** | TTK **< espada** por cadência rápida; "fraca por golpe" | escala DEX (×1.2), CD curto — fantasia da classe |
| **Arma T2 (melee)** | melhora **sentida** o TTK vs o mob da SUA faixa, **sem one-shot de auto do T1** no próprio mob-alvo | "T2 deve assustar quem chega confortável no T1" (M1) — derivado, ver §D |
| **Armadura/escudo T1** | mitigação que **estica o TTL** sem zerar o perigo: TTL 2 ratos **continua matando** o descuidado | "punir descuido ≠ combate longo"; flat não salva do que é maior (pilar 2) |
| **Não-degeneração (Sirlin)** | nenhuma arma T1 deve **one-shotar** o rato no auto pra qualquer build lvl 1 | all-in STR já one-shota a partir do lvl ~5 — é knob de *stat*, não de *arma* |

---

## A. T1 — Armas melee (proposta) · medido no knight e no classless

Números mutados na sim; auto/TTK **medidos**, não estimados.

| Item (par EN) | base ✏️ | CD ms ✏️ | Subtipo | Escala | Auto knight L1 · TTK | Auto classless · TTK | Perfil |
|---|---|---|---|---|---|---|---|
| **Espada Curta** (Short Sword) | **6** | **2000** | corte | STR | 14 · **1,95s** | 11 (3 golpes) · **3,85s** | a equilibrada — a régua |
| **Machado de Mão** (Hand Axe) | **8** | **2400** | corte | STR | 16 · **2,35s** | 13 (2 golpes) · **2,35s** | lento, golpe pesado |
| **Clava** (Club) | **6** | **2100** | impacto | STR | 14 · **2,05s** | 11 · **4,05s** | intermediária; o impacto é a identidade |
| **Adaga** (Dagger) | **5** | **1600** | perfuração | **DEX** | (Rogue) 14 · **1,45s** | — | rápida, fraca por golpe |

- **Espada Cega** (Blunt Sword, kit de nascimento): **base 4 @2000ms** — abaixo da espada de rito,
  ZERO bônus, venda ≈ 0 (a régua do zero; classless mede auto 9, 3 golpes, TTK 3,85s).
- **Por que machado lento E base alto:** é o único perfil cujo TTK se separa dos demais vs 24hp
  (cruza o breakpoint pra 2 golpes mesmo classless), entregando a fantasia "dano máximo, lenta"
  de forma **sentida** sem inflar dano. O custo é o CD (2400 vs 2000).
- **Clava (impacto):** base = espada, CD ligeiramente maior (2100) — a identidade "impacto" mora
  no **subtipo físico** (a camada-sussurro ±10%, autoral vs esqueletos), não no número bruto.
- **Adaga:** base **menor** que a espada (5 < 6) — "fraca por golpe" — mas CD 1600 e escala DEX
  entregam TTK **1,45s** (vs 1,95s da espada). É a arma mais rápida do T1, como manda o design.

### Variantes 2H do T1 melee (regra "2H compra dano, paga a off-hand")

A grade não estreia 2H no T1 (matriz esparsa), mas o knight pode escolher machado no rito. Proposta
de **delta 2H** quando as variantes entrarem (derivado da fórmula, p/ não inflar): **+2 a +3 de
base** sobre a versão 1H da mesma família, **mesmo CD** (velocidade é da família). Ex.: Machado de
Batalha 2H ≈ base 10–11. Validar contra mob-alvo da faixa, não o rato.

## B. T1 — Armas de caster (cajado / cetro / wand) — `derivado (não simulável ainda)`

O auto-attack mágico tem **dano fixo em faixa por tier, NÃO escala com Int** (`DESIGN-ITENS.md`).
A sim hoje trata cajado/cetro como dano físico placeholder (base 3) — número **errado por design**,
não é a wand fixa. Proposta de **faixa fixa por tier** (o auto fixo; magias continuam escalando Int):

| Item (par EN) | Faixa de dano fixo ✏️ | CD ms ✏️ | Elemento | Nota |
|---|---|---|---|---|
| **Cajado de Fogo / Gelo** (Fire/Ice Staff) 2H | **7–9** | 2100 | fogo/gelo | dano fixo maior (2H); conta p/ *Duas Mãos* |
| **Cetro** (Scepter) 1H | **6–8** | 2100 | holy | a wand holy do Priest; off-hand livre |
| **Wand de Fogo / Gelo** (estreia **T2**) | **8–10** | 2000 | fogo/gelo | 1H, dano fixo > cajado-T1, libera off-hand |

- **Régua:** o cajado-T1 (7–9 fixo) deve dar TTK vs rato ≈ **3 golpes** (24/8 = 3) — pior que o
  melee geared, como na bateria M1 ("auto de caster é a única leitura esponja; wands fixas são o
  fix"). O caster **não vive do auto**; vive da skill (que one-shota o T1). A faixa fixa é só pra
  ele não ficar indefeso entre cooldowns/mana.
- **Wand 1H (T2) > cajado-T1** no dano fixo é o tradeoff de loadout nascendo (libera off-hand
  pagando nada de dano — proposital: o cajado-2H paga a off-hand, então a wand-1H precisa de um
  motivo, e o motivo é o livro/escudo na outra mão, não mais dano).

## C. T1 — Vestir & joias (Def flat / bônus) — `derivado (não simulável ainda)`

Mitigação não está na sim (`combat.ts` subtrai dano cru; sem camada de Def). Derivo na fórmula
**decidida** `final = max(1, bruto − ΣDef)` (consolidação jun/2026). Rato bate **7**. Régua: Def
total T1 **estica** o TTL sem zerar o perigo.

### Def flat por peça (vendor genérico, sem bônus)

| Item (par EN) | Slot | Def ✏️ |
|---|---|---|
| **Coifa de Couro** (Leather Coif) | capacete | **1** |
| **Túnica de Couro** (Leather Tunic) | armadura | **2** |
| **Calças de Couro** (Leather Trousers) | calça | **1** |
| **Botas de Couro** (Leather Boots) | botas | **1** |
| **Escudo de Madeira** (Wooden Shield) — Def passiva | off-hand | **1** |

**Σ Def couro completo = 5** (sem escudo) / **6** (com escudo). Efeito **derivado** sobre o rato
(7 dmg → `max(1, 7−Def)`):

| Def total | Dano/golpe do rato | TTL 1 rato (derivado) | TTL 2 ratos (derivado) | Leitura |
|---|---|---|---|---|
| 0 (medido) | 7 | **44,75s** | **15,95s** | régua nua |
| 3 (peito+1) | 4 | ~78s | ~28s | confortável demais p/ 1 rato |
| **5 (couro full)** | **2** | ~157s | ~56s | 1 rato vira trivial; **2 ratos ainda assustam** |
| 6 (couro+escudo) | 1 (piso) | ~314s | ~112s | **flag:** piso 1 torna o rato quase inócuo |

> **🚩 Flag de balance pro criador:** com couro completo (Σ5–6) o rato de **7 dmg** cai ao **piso
> de 1**. Isso é o pilar 2 ao contrário — a armadura T1 *salvaria* do perigo T1 inteiro. Duas
> saídas (ambas ✏️): (a) **Def T1 menor** (Σ couro = 2–3, escudo 0 de Def passiva — o escudo paga
> em *bloqueio*, não em Def flat), mantendo o rato relevante; ou (b) aceitar que **couro completo
> é conquista de baú/vendor que** *deve* **domesticar o T1**, e o perigo real reaparece no T2.
> **Recomendo (a)** — couro Σ **2–3** (coifa 0–1, túnica 1–2, calça 0–1, botas 0–1) — pra TTL 2
> ratos ainda morder (~20–25s) e o flat só "brilhar" contra mobs de dano baixo. A escala de Def
> por tier só fecha com o dano dos mobs por tier (não existem ainda).

### Joias & vestir-de-baú T1 (bônus de identidade, sem Def-base em joia)

| Item (par EN) | Slot | Bônus ✏️ | Régua |
|---|---|---|---|
| **Capuz do Caçador** (Hunter's Hood) | capacete | **+1 dano distância** | regime ⚡ raro/pequeno; +1 é 1 breakpoint de cadência ranged |
| **Robe do Erudito** (Scholar's Robe) | armadura | **+8 mana** (≈ +1 cast de margem) | "legal pro Mage, inútil pro Knight" por essência |
| **Peitoral da Muralha** (Bulwark Breastplate) | armadura | **+10 HP** | ~+1 golpe de rato de sobrevida (regra "recurso flat ok") |
| **Botas do Viajante** (Traveler's Boots) | botas | velocidade leve (canon facilitação) | não numerar como combate |
| **Anel de Regeneração Menor** (Lesser Ring of Regen) | anel | **+0,5 HP/s** (≈ +0,025/tick) | dobra ~o regen base; sustain, não combate |

## D. T2 — o centro de gravidade (lvl 8–15) — `derivado` + medido vs rato

**O rato é inútil como régua de T2.** Medido: knight lvl 12 com a *própria espada curta T1*
(base 6) já dá **auto 36, one-shota o rato (TTK 0,05s)**. Subir a base de 6→14 só move o auto de
36→44 — **todos one-shotam**. Conclusão metodológica: **T2 tem que ser numerado contra o mob da
SUA faixa**, que ainda não existe na sim → números **derivados**, validados quando o 1º mob T2
entrar (princípio M1: "T2 deve assustar quem chega confortável no T1").

| Item (par EN) | base/efeito ✏️ | CD ms ✏️ | Req. nível ✏️ | Nota |
|---|---|---|---|---|
| **Espada Longa** (Long Sword) | base **10** | 2000 | **12** | o exemplo canônico de requisito; +4 base sobre a curta |
| **Punhal** (Stiletto) — Rogue | base **7** | 1500 | 10 | a dupla evolui: +2 base, CD mais curto que a adaga |
| **Wand de Fogo/Gelo** (Fire/Ice Wand) 1H | fixo **8–10** | 2000 | 10 | ⭐ estreia wand 1H — tradeoff de loadout |
| **Escudo de Ferro** (Iron Shield) | Def **2** + bloqueio | — | 12 | passo de Def + chance de bloqueio ↑ vs madeira |
| **Cota de Malha** (Chain Mail) | Def **4** | — | 12 | o peito-ponte do T2 |
| **Elmo de Ferro** (Iron Helmet) | Def **2** | — | 10 | |
| **Machado de Batalha** (Battle Axe) — drop | base **12** @2400 | — | 12 | 2H, "compra dano paga off-hand" |
| **Arco Longo** (Longbow) | base **8** dist. @1700 | — | 12 | ranged: rápido < besta |
| **Besta de Caça** (Hunting Crossbow) | base **12** dist. @2400 | — | 12 | ⭐ estreia besta — lenta, pesada |
| **Tomo do Erudito** (Scholar's Tome) | +mana + regen mana | — | — | ⭐ estreia livro |
| **Robe do Arcanista** (Arcanist's Robe) | **+poder mágico (pequeno)** ⚡ | — | — | ⭐ estreia o stat raro |
| **Amuleto de Gelo** (Ice Amulet) | +resist gelo % | — | — | ⭐ estreia colar/resist |

### Régua T2 derivada (a validar com mob T2 real)

- **Espada Longa base 10 (req. 12):** vs a Espada Curta base 6 no MESMO nível, é **+4 de auto
  flat** (lvl 12 balanceado: 36→40, medido). Contra um mob T1 isso é ruído (já one-shota); contra
  um mob T2 com ~50–70 HP (estimativa de faixa) é **−1 golpe** de TTK — a melhora "sentida" sem
  one-shot do auto. **Mantém a régua: melhora o TTK, não trivializa.**
- **±10% de subtipo físico** sobre auto 40 = ±4 — legível, nunca decisivo (±25% seria "caçar 25%
  mais rápido", otimização real — proibido). ✓ teto da camada-sussurro.

### As 1ªs armas elementais (nunca compráveis) — `derivado`

| Item (par EN) | Modelo | Proposta ✏️ |
|---|---|---|
| **Espada de Fogo** (Fire Sword) — drop raro | híbrido (Tibia: 24 fís + 11 fogo) | base **fís ~10 (= Longa) + 4–6 de fogo adicional**; o "+fogo" é a 1ª linha elemental do jogo (evento), não escala Int, passa pela matriz 10-20 do mob |
| **Maça Consagrada** (Consecrated Mace) — quest difícil | impacto + sagrado vs esqueletos | impacto base **~11 + sagrado ~5**; o sagrado vs undead usa o quebrador autoral (~125%, Regra 10-20) — a arma do arco da Charneca |

> O "+X elemental adicional" é parcela SEPARADA que **não** passa por Def flat (resist % na parcela
> do tipo, ordem de camadas decidida) — derivado, a confirmar quando dano elemental entrar na sim.

## E. Degeneração (teste de Sirlin)

| Cenário medido | Resultado | Veredicto |
|---|---|---|
| Knight lvl 5 **all-in STR (+12)**, espada base 6 | auto **26** → **one-shota o rato** (TTK 0,05s) | 🚩 degenerado — MAS é knob de **stat**, não de arma |
| Knight lvl 5 balanceado (+6 STR), base 6 | auto 20 → 2 golpes (TTK 1,95s) | saudável |
| Nenhuma arma T1 (base 5→11) | one-shota o rato no lvl 1 em qualquer build | ✓ nenhuma arma domina |

**Conclusão:** **nenhuma arma do catálogo T1 proposto degenera** — o auto one-shot vem do
**all-in STR**, exatamente o que a bateria M1 já flagrou (backlog #3: **custo de stat por faixa**,
regra do RO, é o counter estrutural). O catálogo de armas não cria nem agrava a degeneração; o fix
é em `formulas.ts`/custo de stat, não nos itens. **Nenhuma arma T1 dá ±25%+ de vantagem entre si**
(o teto ±10% de subtipo é o único modificador) → muitas opções viáveis, sem "movimento único que
vence". ✓ Sirlin.

## F. TTL — régua de descuido preservada (medido, rato atual 7dmg@1600ms)

| Ratos | TTL (1º golpe → morte) | Régua |
|---|---|---|
| 1 | **44,75s** | AFK vs 1 rato = tempo de sobra pra reagir ✓ |
| 2 | **15,95s** | descuido contra 2+ T1 = morte real ✓ |
| 3 | **9,55s** | puxar grupo = morte rápida ✓ pilar punitivo |

A armadura T1 proposta (§C) **NÃO pode** apagar a coluna "2 ratos" — daí a flag de Def couro Σ2–3.

---

## Resumo dos 5 números-âncora da proposta

1. **Espada Curta (rito) = base 6 @2000ms** → auto 14, **TTK 1,95s** (a régua; classless 3 golpes).
2. **Machado de Mão = base 8 @2400ms** → o único perfil que separa o TTK (2 golpes, 2,35s) —
   "dano máximo, lenta" sentido sem inflar dano.
3. **Adaga = base 5 @1600ms (DEX)** → **TTK 1,45s**, a mais rápida do T1 ("fraca por golpe").
4. **Espada Longa T2 = base 10, req. nível 12** → +4 de auto flat sobre a curta (o exemplo
   canônico de requisito); melhora o TTK sem one-shot de auto no mob da sua faixa.
5. **Def couro recomendada Σ 2–3** (NÃO 5–6) → senão o rato de 7 dmg cai ao piso 1 e a armadura
   T1 domestica o perigo T1 inteiro (anti-pilar-2).

## Pendências / o que NÃO foi possível simular (e por quê)

- **Mitigação (Def flat, bloqueio de escudo):** não está na sim — `combat.ts` aplica dano cru. §C
  e §D são **derivados** da fórmula decidida `max(1, bruto−ΣDef)`. Validar quando a camada entrar.
- **Dano fixo de caster/wand:** a sim trata cajado/cetro como físico placeholder (base 3). As
  faixas fixas de §B são proposta de design, não medição — validar quando o auto mágico fixo entrar.
- **Distância (arco/besta):** sem projétil na sim; CD/base de §A/§D são derivados do perfil
  rápido×pesado.
- **T2 sem mob-alvo:** o rato (24hp) é trivial pra qualquer gear lvl 12 (one-shot) — T2 só se
  numera de verdade contra o 1º mob T2. **Re-rodar esta bateria quando o 2º mob existir.**
- **Quantização por contagem de golpes** (achado): a base T1 é quase invisível vs 24hp; a faixa
  proposta vale pelo perfil, pelo T2 e por mobs T1 mais gordos. Considerar um **2º mob T1 mais
  gordo** (~30–40 HP) pra dar resolução à base das armas.
- **Custo de stat por faixa (RO)** segue sendo o counter da degeneração all-in STR — não é deste
  report, mas o catálogo de armas depende dele pra não ser trivializado por build.
- **Preços/gold/requisitos de stat:** fora de escopo (economia ✏️, acoplada a PvP/perda de loot).

> Harness descartável em `/tmp` (não versionado). Sim/design **não** foram tocados — a entrega é
> este report. Números marcados ✏️ aguardam o criador.
