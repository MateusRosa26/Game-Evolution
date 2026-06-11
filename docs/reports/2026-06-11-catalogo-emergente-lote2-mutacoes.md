# Catálogo Emergente — Lote 2 (dedicado a MUTAÇÕES de skill)

> **Lote dedicado a EVOLUÇÃO DE SKILL** (gerado pelo Chat A enquanto o Chat B fecha
> a revisão do Lote 1; alimenta o P7 skillSwap quando destravar). Mutação = a skill
> base RESOLVE com uma def alternativa (P7 `skillSwap`), decidida pelo **perfil de
> uso** (contador absoluto por perfil — engine já migrada). Substitui a base → tem
> que ser **sidegrade de ESTILO, não upgrade puro** (constituição/Koster: verbo novo,
> nunca número maior; senão = treadmill/Sirlin).
>
> Cada mutação = **Perfil-gatilho** (o que você fez) · **Verbo novo** (o que muda) ·
> **Def mutada** (sketch do SkillDef) · **Primitivo de skill** (harvest p/ o executor) ·
> **Significado** (rascunho ✏️ Loremaster/Chat B). Números = ✏️ Balancista.
>
> Status do tree: SkillDef hoje tem 5 targetings (`meleeTarget`/`meleePositional`/
> `projectileTarget`/`lineThrough`/`healTarget`) + `applyStatus` (burn/slow/poison).
> Primitivos marcados **[engine]** vêm da branch `feat/skills-engine` (não mergeada);
> **[novo]** = primitivo de skill a criar. Isso é a dependência real do P7.

> ### ⚠️ INVARIANTE — mutação vem de HÁBITO, nunca de ATRIBUTO
> O `For`/`Des`/`Int`/`Esp` no cabeçalho de cada skill é **só metadado da base** (qual
> stat escala o dano dela — herdado do catálogo de skills). A **condição de mutar é
> SEMPRE o perfil de uso** (distância, ângulo, estado do alvo, nº de alvos, HP do
> caster…). Atributo **nunca** gateia uma mutação — seria o oposto do tracking
> ("identidade vem do que você FEZ"). As skills foram escolhidas por variedade de
> **mecânica/verbo**, não de atributo.

---

## Princípio de cada mutação (o filtro que apliquei)

1. **Verbo, não número.** Cada mutação muda *como a skill se usa*, não "mais dano".
2. **Sidegrade.** Como substitui a base, abre um nicho de uso e fecha outro — quem
   muta ganha identidade, não poder bruto. (Curva exata = ✏️ Balancista.)
3. **Perfil mutuamente exclusivo.** Os 2–3 perfis por skill não se sobrepõem (zona
   morta intencional entre eles) → 1º a cruzar a própria meta resolve.
4. **Reusa primitivo onde dá.** Prefiro targeting/status que já existem; só proponho
   primitivo novo quando o verbo exige (e marco no harvest).

---

## 1. Golpe Forte (`golpe_forte` · For · meleeTarget · físico)

| Mutação | Perfil-gatilho | Verbo novo | Def mutada | Primitivo |
|---|---|---|---|---|
| **Talho Amplo** / *Cleave* | usado cercado (`enemiesAdjacent≥2`) N vezes | single → **golpe em arco** (acerta adjacentes) | targeting `selfRadius`/cone, power↓ por alvo | **[engine]** selfRadius |
| **Quebra-Guarda** / *Sunder* | usado como abertura (`targetHpPctBefore≥0.9`) | adiciona **quebra de armadura** (alvo recebe +dano por Xs) | `applyStatus:{kind:"armorShred"}` | **[novo]** status `armorShred` |

- Significado: Talho Amplo = "o golpe não escolhe um — varre a todos". Quebra-Guarda =
  "a primeira pancada abre a brecha". ✏️
- Zona morta: usos no meio (1 inimigo adjacente, alvo a 50% HP) não contam p/ nenhum.

## 2. Lança de Gelo (`lanca_de_gelo` · Int · lineThrough · gelo+slow)

| Mutação | Perfil-gatilho | Verbo novo | Def mutada | Primitivo |
|---|---|---|---|---|
| **Permafrost** | cast em alvo já lento (`targetWasSlowed`) N vezes | slow → **congela** (root: não anda) | `applyStatus:{kind:"root"}` | **[novo]** status `root` |
| **Estilhaço** / *Shatter* | cast acertando ≥2 na linha (`targetsHit≥2`) | linha → **estilhaça** num leque atrás do 1º alvo | targeting linha+cone | **[engine]** cone/selfRadius |

- Significado: Permafrost = "o frio para de empurrar e passa a prender". Estilhaço =
  "a lança não atravessa: explode em cacos". ✏️
- ⚠️ root é controle forte — Balancista cuida da duração (curtíssima); hub §AoE: é
  controle, não deleta-pack.

## 3. Apunhalar (`apunhalar` · Des · meleePositional · posicional)

| Mutação | Perfil-gatilho | Verbo novo | Def mutada | Primitivo |
|---|---|---|---|---|
| **Hemorragia** / *Bleed* | conectado pelas costas (`hitFromBehind`) N vezes | burst → **sangramento** (DoT que cresce com o movimento do alvo) | `applyStatus:{kind:"bleed"}` (poison-like) | reusa `poison`/**[novo]** `bleed` |
| **Passo Sombrio** / *Shadowstep* | cast longe do alvo (`castDistance≥3`) N vezes | melee → **teleporta pras costas** e apunhala | targeting com dash pré-golpe | **[engine]** dash |

- Significado: Hemorragia = "o corte não fecha". Passo Sombrio = "você já estava atrás
  dele". ✏️
- Passo Sombrio reposiciona = garante o ângulo de backstab → casa com a fantasia Rogue.

## 4. Luz Sagrada (`luz_sagrada` · Esp · projectileTarget · sagrado)

| Mutação | Perfil-gatilho | Verbo novo | Def mutada | Primitivo |
|---|---|---|---|---|
| **Exorcismo** / *Banish* | golpes em profanos (`target.family in undead\|demon`) N vezes | projétil → **explode** ao acertar profano (área vs profano) | selfRadius condicional à família | **[engine]** selfRadius + gate por família no executor |
| **Raio Solar** / *Sunbeam* | cast à distância (`castDistance≥4`) N vezes | projétil → **feixe perfurante** instantâneo | targeting `lineThrough` (já existe!) | reusa `lineThrough` |

- Significado: Exorcismo = "a luz não fere o profano: o expulsa, e a quem está perto".
  Raio Solar = "deixa de ser bola e vira lança de sol". ✏️
- Raio Solar é o mais barato de implementar (só troca o targeting pra um que existe).

## 5. Curar Ferimentos (`curar_ferimentos` · Esp · healTarget)

| Mutação | Perfil-gatilho | Verbo novo | Def mutada | Primitivo |
|---|---|---|---|---|
| **Fôlego** / *Second Wind* | self-cast sob pressão (`targetSelf && casterHpPct<0.4`) N vezes | cura instantânea → **regeneração por Xs** (HoT) | `applyStatus:{kind:"regenHoT"}` no alvo | **[novo]** status `regenHoT` (cura-por-tick) |
| **Transfusão** | cura em ALIADO (`!targetSelf`) N vezes (online) | cura → **cura + escudo breve** | heal + `applyStatus:{kind:"shield"}` | **[engine]** shield (Barreira) |

- Significado: Fôlego = "o corpo aprende a se remendar sozinho". Transfusão = "curar é
  também blindar". ✏️
- Transfusão só brilha no online (party) — aposta de longo prazo, como os Caminhos de
  Mártir. Fôlego é o solo-viável.

---

## 6. HARVEST — primitivos de skill que o Lote 2 exige (dependência do P7)

| Primitivo | Mutações | Origem |
|---|---|---|
| `selfRadius` / cone | Talho Amplo, Estilhaço, Exorcismo | **[engine]** feat/skills-engine |
| `dash` (pré-golpe) | Passo Sombrio | **[engine]** feat/skills-engine |
| `shield` (status) | Transfusão | **[engine]** feat/skills-engine (Barreira) |
| status **`root`** | Permafrost | **[novo]** — slow que zera o passo |
| status **`armorShred`** | Quebra-Guarda | **[novo]** — +dano recebido por Xs |
| status **`bleed`** | Hemorragia | **[novo]** ou reusar `poison` com flavor |
| status **`regenHoT`** | Fôlego | **[novo]** — cura-por-tick (inverso do DoT) |
| gate de área por família | Exorcismo | **[novo]** no executor (área só vs profano) |

**Conclusão do harvest:** as Mutações do Lote 2 precisam de (a) o **merge da
`feat/skills-engine`** (selfRadius/dash/shield) e (b) **4 status novos declarativos**
(`root`/`armorShred`/`bleed`/`regenHoT`) — todos no molde do `SkillStatusApply`
existente. Nenhum exige executor exótico além do que a skills-engine já traz. **Isso é
exatamente o que o Chat A implementa no P7** (após o merge + as defs deste doc).

## 7. Handoff

- **Para o Chat B (quando fechar o Lote 1):** revisar o SIGNIFICADO destas 10 mutações
  (identidade, coerência verbo↔fantasia, anti-treadmill, flavor EN/PT no cânone).
  Mesmo processo do Lote 1. Mudanças de efeito → fila.
- **Para o Chat A (eu, no P7):** depois do merge da skills-engine + revisão do B,
  (1) criar os 4 status novos, (2) escrever as 10 defs mutadas como `SkillDef`,
  (3) ligar via `{kind:"skillSwap", mutatedSkillId}` nas `MutationDef`, (4) smoke por
  mutação (perfil resolve → cast resolve com a def mutada → verbo novo medido).
- **Perfis-gatilho** já usam fatos que o sensor EMITE hoje (`enemiesAdjacent`,
  `targetWasSlowed`, `hitFromBehind`, `castDistance`, `targetsHit`, `targetSelf`,
  `casterHpPct`, `targetHpPctBefore`, `target.family`) — **zero sensor novo**. ✓
- Thresholds por perfil = ✏️ Balancista; nomes/flavor = ✏️ Loremaster/Chat B.
