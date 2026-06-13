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

---

## 8. Revisão de significado — Chat B (jun/2026)

> Mesmo processo do Lote 1 §6 (designer-de-sistemas + loremaster). Veredito por mutação;
> mudanças de EFEITO → fila `fila-motor-emergente.md`. **Direção/forma confirmada pelo
> criador onde marcado.**

### ⚠️ ACHADO MAIOR — divergência do `design/skills/CATALOGO.md`
O Lote 2 desenhou mutações **diferentes** das rascunhadas no CATALOGO.md (a fonte das skills, parseada pela wiki):
| Skill | CATALOGO.md (rascunho ✏️) | Lote 2 |
|---|---|---|
| Golpe Forte | Golpe Desesperado · Riposte · Lâmina do Fim | **Talho Amplo · Quebra-Guarda** |
| Lança de Gelo | Estilhaço Profundo · Geada Perfurante · Muralha de Inverno | **Permafrost · Estilhaço** |
| Apunhalar | Hemorragia · Golpe Súbito · Lâmina Suja | **Hemorragia · Passo Sombrio** |
| Luz Sagrada | Chama Purificadora · Nova Sagrada · Fervor | **Exorcismo · Raio Solar** |
| Curar/Heal | Reflexo Vital · Recuperação · Mãos Generosas | **Fôlego · Transfusão** |
- **DECISÃO CRIADOR (jun/2026): ADICIONAIS.** As mutações do Lote 2 **somam** ao pool de cada skill (uma skill tem 2–4 mutações POSSÍVEIS; o perfil de uso decide qual você pega). **✅ MESCLA FEITA no `design/skills/CATALOGO.md`** (jun/2026): Lote 2 adicionado + auditoria aplicada + colisões resolvidas (Estilhaço Profundo cortado p/ Permafrost; Chama Purificadora absorvida pelo Exorcismo) + cortes/renomes. Detalhe: `docs/reports/2026-06-11-audit-mutacoes-regra-3-partes.md`.

### Golpe Forte
- **Talho Amplo / Cleave** (cercado→arco) — **APROVADO c/ ajuste (CRIADOR):** forma = **arco de 3 casas À FRENTE** (não todos os adjacentes — não é nova 360°; você mira o golpe). Condicionado à **aprovação do Balancista** (risco de AoE no Knight). Dano dividido. → [B11].
- **Quebra-Guarda / Sunder** (abertura→?) — **PENDENTE direção (CRIADOR):** criador prefere "+3-5% dano" a quebrar armadura, mas flat % = **número, não verbo** (anti-Koster). Garfo: **(A)** abertura deixa o alvo **Vulnerável** (+dano por Xs = janela de combo, verbo) ou **(B)** flat +3-5% neste golpe (exceção consciente à constituição). Aguarda escolha.

### Lança de Gelo
- **Permafrost** (já-lento→root) — **APROVADO (CRIADOR):** root com duração **~0.2s** (guia firme pro Balancista — controle minúsculo, não deleta-pack). Nome "Permafrost" é loanword (considerar PT-nativo ✏️).
- **Estilhaço / Shatter** (2+ na linha→estilhaça) — **APROVADO c/ ajuste (CRIADOR):** a base **já perfura** (`lineThrough`), então Estilhaço **TROCA o pierce** por **estilhaçar em 3 casas (lateral/atrás do 1º contato)** — perde a linha, ganha o cacho (sidegrade limpo). Dano dividido. → [B11]. **Reconciliar nome** com *Estilhaço Profundo* do CATALOGO.

### Apunhalar
- **Hemorragia** (costas→?) — **PENDENTE garfo de princípio (CRIADOR):** criador quer **+10-12% dano flat no backstab** (não o bleed). Flat % = número/anti-Koster + upgrade puro. **GARFO (vale p/ todo melee, inclui Quebra-Guarda):** (1) verbo com "sabor de dano" (backstab **ignora armadura**/true damage, ou **executa** em HP baixo) — mantém constituição; ou (2) **emenda a regra**: mutações de MELEE podem ser +% pequeno (exceção consciente registrada). Aguarda escolha.
- **Passo Sombrio — CORTADA (CRIADOR).** Gatilho "cast de longe (≥3)" é **impossível** p/ skill melee (tiles colados); + ressuscita o "Passo das Sombras" removido → corte. (Apunhalar fica com 1 mutação; 2ª pode vir do CATALOGO — *Golpe Súbito*/*Lâmina Suja*.)

### Luz Sagrada
- **Exorcismo / Exorcism** (profano→explode em área) — **APROVADO c/ estrutura (CRIADOR):** (a) **obtenção mais difícil** (Priest caça profano naturalmente → senão todo Priest pega) — threshold alto, Balancista; (b) **sidegrade explícito**: single **100%→75%**, **~20% em AoE**, **~5% de perda líquida** (confirmar Balancista). ≈ *Chama Purificadora* do CATALOGO (reconciliar nome). Par EN = *Exorcism* (não "Banish").
- **Raio Solar — CORTADA (CRIADOR).** Achou fraca/situacional. Luz Sagrada fica só com Exorcismo por ora; **2ª mutação nova a pensar depois** (candidatos do CATALOGO: *Nova Sagrada* queima-roupa, *Fervor* dano sobe sem tomar dano).

### Curar Ferimentos
- **Fôlego / Second Wind** (self sob pressão→instant+HoT) — **APROVADO (CRIADOR):** cura **instantânea** (mantém, clutch) + **rabo de HoT PEQUENO** = **3-7% da cura total** como bônus over-time (guia do criador p/ Balancista). → [B10].
- **Transfusão / Transfusion** (aliado→heal+escudo) — **APROVADO (CRIADOR).** Brilha no online (como os Caminhos de Mártir); upgrade-risk leve mitigado pela condicional (só aliado). Nome ✓.

### Transversais (constituição)
1. **AoE-gate ~lvl 20** (Talho Amplo · Estilhaço · Exorcismo): mutação vira AoE-dano cedo. Mitigar com dano dividido/chip (Balancista) — mesma regra do Lote 1 ⑨⑪.
2. **Upgrade-risk dos "adiciona-status"** (Quebra-Guarda · Permafrost · Passo Sombrio): garantir **tradeoff** pra serem sidegrade, não upgrade puro (lição do Meteoro ⑩). Balancista/design.
3. **Verificar sensores** no `skill_use`: `targetHpPctBefore` (Quebra-Guarda), `hitFromBehind` (Passo Sombrio/Hemorragia), `targetWasSlowed` (Permafrost) — o catalog afirma "zero sensor novo"; confirmar que os menos óbvios são de fato emitidos.

### Decisão de design — quantas mutações por skill (DECIDIDO jun/2026)
- **1 no MVP** (cânone+engine atuais: 1º perfil vence, substitui, encerra a corrida). "2-4 possíveis no catálogo" = as OPÇÕES; o personagem GANHA **1**.
- **2ª mutação = FEATURE FUTURA** (pós-lançamento, proposta do criador): liberada a partir de **lvl ~25+**, vinda como update — encaixa na "escada de 4 camadas" (a 2ª mutação por skill é um degrau mais fundo, opt-in). **Exige regra de COMPATIBILIDADE** (não empilhar contraditórias — ex. Eclosão queima-roupa + Meteoro distância se anulam). Sem mudança de engine agora.

### Fila gerada
- **[B10] Fôlego** — efeito = instantâneo + rabo de HoT (não só HoT). Único efeito que muda; o resto é nome/tradeoff (Balancista) ou decisão de canon (reconciliar com CATALOGO).
