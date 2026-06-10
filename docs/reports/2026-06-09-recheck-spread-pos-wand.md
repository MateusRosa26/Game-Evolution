# Re-check do spread single-target pós-fix da wand

**Data:** 2026-06-09 · **Balancista** · fecha o loop do fix da wand
(`2026-06-09-bateria-wand.md`): o "mage 3,0s" da bateria T2 foi medido com a wand QUEBRADA;
re-medir o spread inter-classe pra garantir que o buff não desbalanceou o relativo.

**Setup:** 4 classes lvl 10 on-level (36 pts distribuídos 2:1 **stat-de-afinidade**:Vit —
Knight=For, Mage=Int, Rogue=Des, **Priest=Esp**, conforme o design), rotação = auto + skill
principal (GF / BdF / Apunhalar / Luz Sagrada), vs 1 Esqueleto adjacente (face-a-face).

## Resultado

| Classe | TTK novo | TTK T2 antigo | HP perd | Leitura |
|---|---|---|---|---|
| knight | 3,9s | 3,9s | 14 | **inalterado** — a wand não toca melee (sanity check ✓) |
| mage | **2,3s** | 3,0s | 20 | mais rápido — **o buff pretendido da wand** (auto ~7 fixo → 8-12) |
| rogue | 1,2s | 1,3s | 10 | inalterado (ruído) |
| priest | 3,0s | 2,1s | 18 | **NÃO é a wand** — ver achado abaixo |

**Veredito da wand:** o fix está **equilibrado**. O mago subiu de meio-de-tabela pra 2º
(rogue 1,2 < mage 2,3 < knight 3,9), **sem ultrapassar o rogue** — coerente com glass cannon de
burst. **Nenhum ajuste reativo de número** (disciplina: coeficientes single-target seguem OK,
re-check no T3).

## Achado estrutural (pré-existente, destapado pelo re-check) — Luz Sagrada escala Int, não Esp

O priest "2,1→3,0" **não é regressão da wand**. Diagnóstico (priest lvl 10, varia o build):

| Build do priest | int | TTK | Luz |
|---|---|---|---|
| Espírito (afinidade do design) | 6 | **3,0s** | fraca |
| Inteligência | 16 | **1,6s** | forte |

**Causa:** `Luz Sagrada` (e toda ofensiva sagrada) passa por `formulas.magicDamage`, que escala
com **Inteligência** (`executor.ts:134`). Só a CURA (`Curar Ferimentos` → `healPower`) escala
Espírito. Um priest construído na sua afinidade (Esp, como o design manda) tem **nuke fraco**.

**Conflito no doc** (DESIGN-EVOLUCAO.md):
- L341 (ficha do Priest): "Inteligência (dano sagrado)" ← o código segue esta.
- L386 (tabela de atributos): "Espírito … sagrado/anti-profano (**Esp manda na força**)".
- L24 / L423: gate de *Luz Sagrada* = **Esp + nível**; de-classing: "o Priest continua o melhor
  conjurador sagrado porque seu corpo bomba **Espírito**".

**Consequência de balance:** como está, **um Mage (Int) nuka mais forte com Luz Sagrada que o
Priest (Esp)** — contradiz frontalmente o de-classing. Se o sagrado deve ser do Priest "por
corpo", a ofensiva sagrada precisa escalar **Espírito**.

**RESOLVIDO (criador, 09/jun): ofensiva sagrada escala ESPÍRITO.** Aplicado: `formulas.holyDamage`
(espelha `magicDamage`, escala Esp via `SPIRIT_DAMAGE_FACTOR 1.1`); `executor.computeDamage` usa
`holyDamage` quando `def.damageType === "holy"`. Doc corrigido (DESIGN-EVOLUCAO L341: "dano sagrado"
= Esp, não Int). Re-medido vs Esqueleto:

| Quem (build) | int/spi | TTK Luz | leitura |
|---|---|---|---|
| priest (Esp) | 6/18 | **1,6s** | forte — o especialista anti-undead comendo a presa (×1,8 vs profano + Esp alto) |
| mage (Int) | 18/6 | **3,0s** | fraco — **o mago não nuka mais sagrado melhor que o priest** ✓ |

1,6s = ~2 casts de Luz: bate o alvo "forte sem trivializar a família-coração" (report T2,
`unholyMultiplier 1.8`). `power` é lever fraco vs undead (o termo de Esp domina) → mantido em **13**
(placeholder), a calibrar contra um mob NÃO-undead T2 quando existir (lá o ×1,8 não entra e o
`power` importa). Priest fastest single-target vale SÓ vs undead (sua comida) — por design.

## Achado #2 — Apunhalar (Rogue) era SPAM degenerado (cd 1s) — CORRIGIDO

O rogue 1,2s (de frente, sem backstab) puxou o olho. Investigado: parte do gap visual vs knight
(3,9s) é o **knight sem AoE** (Redemoinho), mas o Apunhalar tinha degeneração real **por cima**.

**Varredura (rogue lvl 10, 1v1 Esqueleto, de frente):**

| Apunhalar cd | TTK | casts | skill/auto |
|---|---|---|---|
| **20t (1s) — era** | **1,2s** | 2 | 68 / 52 |
| 40t (2s) | 2,0s | 2 | 68 / 52 |
| **60t (3s) — agora** | **2,4s** | 1 | 34 / 78 |
| 90t+ | 2,4s | 1 | 34 / 78 |

Varredura de POWER (cd 1s): TTK fica em 1,2s mesmo com power 0 → **a cadência é o lever, não o
dano por golpe**. Com cd 1s o rogue front-loadava 2 Apunhalares e deletava o mob no opening
(falha Sirlin: "vence repetindo um movimento"), contradizendo a própria ficha ("melee
**posicional**, ~2× pelas costas").

**Aplicado (criador, 09/jun):** `APUNHALAR.cooldownTicks 20 → 60` (1s → 3s). TTK 1,2 → **2,4s**:
1 strike + auto da adaga (auto vira 78 do dano, skill 34). O rogue **segue o mais rápido**
(knight 3,9 / mage 2,3 / priest ~3 / **rogue 2,4**) — fantasia de assassino veloz preservada —
mas para de trivializar o T2 e o Apunhalar volta a ser golpe tático (vale manobrar pro
backstab 2×). ⚠️ TTK-alvo relativo final re-checar na bateria de kit completo (com Redemoinho).

## Próximos passos
1. **Rotear o achado da Luz pro Designer de Sistemas** (decisão de fórmula).
2. Redemoinho (AoE Knight) — destrava o teste justo de pack **e** o re-check do TTK-alvo do rogue.
3. Bateria de farm T2 (XP/h) — quando a comida entrar na sim.
