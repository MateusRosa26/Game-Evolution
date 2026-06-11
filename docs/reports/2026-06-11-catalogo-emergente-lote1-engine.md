# Catálogo Emergente — Lote 1 (vocabulário-completo) + Motor de Efeitos

> **Objetivo (decidido com o criador):** os 12 itens do Lote 1 são escolhidos pra
> estrear **um de cada FORMATO de efeito** → deles colhemos o vocabulário de
> primitivos → o **motor de efeitos** nasce cobrindo tudo de uma vez (zero retrofit).
> Depois: lotes por NICHO (só mutação / só hidden class / só estilo…), que viram
> só dado sobre este motor, refinando balance por nicho.
>
> Cada ficha = **Gatilho** (sensor — engine já existe) · **Significado** (flavor —
> rascunho ✏️ Loremaster) · **Efeito** (primitivo mecânico — o que constrói o motor).
> Números = ✏️ Balancista. Aqui só a ESTRUTURA dos efeitos e do motor.

---

## 1. As 12 fichas (foco no efeito-primitivo)

Legenda do gatilho: usa o sensor já implementado (spec `2026-06-11-spec-sensores-tracking.md`).

### Marcas de arma (vivem no ledger da instância — ativas só com a arma equipada)

**① Quebra-Ossos** — Marca
- Gatilho: `kill` · `accumulator:count` · filtro `victim.family==undead` · threshold ✏️~15k
- Significado: *"as ossadas se lembram do seu nome"* ✏️
- **Efeito → `damageMult`**: ×(1+bônus) no dano quando `victim.family==undead`. *Condição sobre o ALVO.*

**② Última Resposta** — Marca
- Gatilho: `kill` · count · filtro `attackerHpPct < 0.10` · threshold ✏️~10k
- Significado: *"encurralado, o aço responde"* ✏️
- **Efeito → `damageMult`**: ×(1+bônus) quando `attackerHpPct < 0.25`. *Condição sobre o PRÓPRIO ESTADO.*

**③ Exagero** — Marca · ⚠️ **AJUSTAR nome+significado (§6 ③)** — efeito é *transbordo*, não "apaga um"; candidato **Transbordo / Overflow**
- Gatilho: `kill` · count · filtro `overkillRatio >= 3` · threshold ✏️~milhares
- Significado: *"o golpe não termina no corpo — atravessa pra quem está ao lado"* (era *"você não mata: você apaga"* — não casa com o respingo; ver §6)
- **Efeito → `onKill`**: ao matar, causa `overkill × fração` de dano em área aos inimigos adjacentes à vítima. *Gatilho on-kill + ação de dano em área, escalada por um FATO do evento.* (`damageType` do respingo → fila [B1].)

### Caminhos do personagem (vivem no estado — permanentes)

**④ Inabalável** — **Marca de ESCUDO** (acúmulo) · ⚠️ **NÃO é conduta** (sem restrição a quebrar) — reconciliar Marca×Caminho (§6 ④)
- Gatilho: desbloqueia por `block` acumulado (`accumulator:count` ou `sum:blockedAmount`) · threshold ✏️~50k
- Significado: *"nada te move"* ✏️
- **Efeito → `blockFull`**: chance % de o bloqueio absorver 100% do golpe (em vez do chunk parcial). *Modifica a resolução do bloqueio.*

**⑤ Sombra Sem Nome** — Caminho estilo
- Gatilho: desbloqueia por sessões vencidas sem dano (`combat_end` · count · filtro `damageTaken==0 && endedBy==victory`) · threshold ✏️
- Significado: *"o primeiro golpe é o último que veem"* ✏️
- **Efeito → `crit`**: o 1º ataque de cada combate é crítico garantido (×2 ✏️). *Crit condicional — precisa do flag "1º golpe da sessão".*

**⑥ Intocado** — Caminho conduta (era *Intocável*; cânone DESIGN-EVOLUCAO:348 = **Intocado** = imaculado, casa com "não suja as mãos" — §6 ⑥)
- Gatilho: lvl X sem nunca causar dano físico (conduta; `breakEvent:damage` filtro `damageType==physical`) · milestone ✏️
- Significado: *"o corpo não suja as mãos"* ✏️
- **Efeito → `regen`**: mana regenera mesmo EM combate (normalmente não). *Modifica regen, condicional a `inCombat`.*

**⑦ Senhor dos Extremos** — Caminho ratio
- Gatilho: `ratio` fogo+gelo ≥95% até lvl ✏️~20 (JÁ implementado e testado)
- Significado: *"fogo e gelo são a mesma língua"* ✏️
- **Efeito → `statusCombo`**: aplicar fogo num alvo **congelado** (ou gelo num **queimando**) dispara *choque térmico* (burst de dano + remove ambos status). *Gatilho REATIVO sobre interação status×dano — o mais novo.*

**⑧ O Naturalista** — Caminho estilo (distinct)
- Gatilho: `distinct victim.family` ≥ N famílias (JÁ implementado e testado)
- Significado: *"nenhuma criatura te é estranha"* ✏️
- **Efeito → `damageMult`**: ×(1+bônus pequeno) vs QUALQUER família já catalogada. *damageMult universal pequeno — reusa P1.*

### Mutações de skill (reusam o MOTOR DE SKILL que já existe — `feat/skills-engine`)

**⑨ Eclosão Ígnea** — Mutação de Bola de Fogo
- Gatilho: perfil queima-roupa (`castDistance<=2`) · threshold ✏️ (engine de mutação JÁ migrada)
- **Efeito → `skillSwap`**: Bola de Fogo passa a resolver com `selfRadius` (explosão centrada). *Primitivo de skill JÁ existe.*

**⑩ Meteoro Distante** — Mutação de Bola de Fogo
- Gatilho: perfil distância (`castDistance>=4`) · threshold ✏️
- **Efeito → `skillSwap`**: alcance maior + dano escala com distância. *Reusa range; dano-por-distância pode pedir 1 param novo no skill def ⚠️.*

**⑪ Fogo Voraz** — Mutação de Bola de Fogo
- Gatilho: perfil em alvo já queimando (`targetWasBurning==true`) · threshold ✏️
- **Efeito → `skillSwap`**: reacende e ESPALHA burn em área. *⚠️ "espalhar status em área" pode ser primitivo de skill novo (spreadStatus).*

### Classe escondida (o TETO — combina primitivos)

**⑫ Monge** — Caminho conduta (a 5ª classe que ninguém escolhe)
- Gatilho: lvl 25 sem nunca equipar arma (conduta; `breakEvent:equip` filtro `item.category==weapon`) — **depende do evento `equip` que acabei de implementar**
- Significado: *"suas mãos bastam"* ✏️
- **Efeito → combinação**: `grantSkills` (destrava skills marciais desarmadas) + `derivedMod` (dano desarmado real escala com nível) [+ `damageMult` opcional]. *O teto: destravar skills + reescrever um derivado.*

---

## 2. Colheita — o VOCABULÁRIO DE PRIMITIVOS (o que o motor precisa)

Os 12 produzem **9 primitivos**. Tudo o mais do catálogo (lotes por nicho) reusa estes:

| Primitivo | O que faz | Itens | Hook na sim |
|---|---|---|---|
| **P1 `damageMult`** | × dano de saída, condicional | ①②⑧ | `applyDamage` (dano de saída) |
| **P2 `onKill`** | ação ao matar (dano em área escalado por fato) | ③ | `applyDamage` (ramo fatal) |
| **P3 `blockFull`** | chance de bloqueio total | ④ | `applyDamage` (ramo de bloqueio) |
| **P4 `crit`** | crítico condicional (×mult) | ⑤ | `applyDamage` (dano de saída) |
| **P5 `regen`** | altera regen, condicional | ⑥ | `regenTick` |
| **P6 `statusCombo`** | reativo status×dano → efeito | ⑦ | aplicação de dano/status |
| **P7 `skillSwap`** | troca a skill efetiva pela mutada | ⑨⑩⑪ | **executor de skill (já existe)** |
| **P8 `grantSkills`** | destrava skills no unlock | ⑫ | handler de unlock |
| **P9 `derivedMod`** | reescreve um derivado (dano desarmado, HP…) | ⑫ | `recomputePlayerDerived`/formulas |

**Observação-chave:** **P1–P6 concentram-se quase todos em `applyDamage` + `regenTick`** — superfície pequena e bem definida. P7 reusa o que já existe. P8/P9 são pontuais. O motor é menor do que parece.

**Condições reutilizam o `Filter` que já temos:** `when` de cada efeito é um `Filter` declarativo sobre os fatos do hook (`target.family`, `attackerHpPct`, `firstHitOfCombat`, `inCombat`). Mesmo avaliador (`matchesFilter`) que move os gatilhos move as condições dos efeitos — uma só engine declarativa dos dois lados.

**⚠️ 2 primitivos de SKILL possivelmente novos** (não do motor de efeito, mas do executor): `dano-escala-com-distância` (⑩) e `spreadStatus` (⑪). Avaliar na hora de fichar as mutações — podem já caber com o que existe.

---

## 3. Arquitetura do Motor de Efeitos

### 3.1 `TrackingEffect` deixa de ser freeform → união TIPADA

Hoje: `{ description, payload: Record<string,...> }` (a engine não lê). Vira:

```ts
type EffectSpec =
  | { kind: "damageMult"; mult: number; when?: Filter }
  | { kind: "onKill"; action: "areaDamage"; scaleField: string; scale: number; radius: number; when?: Filter }
  | { kind: "blockFull"; chance: number }
  | { kind: "crit"; mult: number; when: Filter }            // when inclui firstHitOfCombat
  | { kind: "regen"; resource: "mana" | "hp"; mult: number; when?: Filter }
  | { kind: "statusCombo"; ifTargetStatus: string; onDamageType: string; burst: number; consumes: string[] }
  | { kind: "skillSwap"; mutatedSkillId: string }          // a mutação aponta a skill def alternativa
  | { kind: "grantSkills"; skills: string[] }
  | { kind: "derivedMod"; stat: "unarmedDamage" | "maxHp" | "...";  /* params ✏️ */ };
```

`TrackingEffect = { description: string; spec: EffectSpec }` (description vira só doc/UI; `spec` é o que a sim executa).

### 3.2 Quem está ATIVO — `activeEffects(entityId)`

Deriva do estado de unlock que já mantemos (nada novo a persistir):
- **Caminho/Mutação**: `pathsStyle/Conduct/Ratio[id].unlocked` / `mutations[skillId].resolved` no estado do personagem.
- **Marca**: `markProgress[id].unlocked` no ledger da instância **equipada** (arma/escudo) — Marca só vale com o item na mão (ego do item).

Engine expõe `activeEffects(entityId): EffectSpec[]`, com **cache por entidade** invalidado em: `unlock`, `equip`/`unequip`. Combate consulta o cache (O(nº de efeitos ativos), trivial).

### 3.3 Os hooks (onde cada primitivo entra)

```
applyDamage(source, target, amount, type):
  ├─ P3 blockFull   → no ramo de bloqueio (chance de absorver 100%)
  ├─ P1 damageMult  → multiplica `amount` se when(facts) casa  (facts: target.family, attackerHpPct…)
  ├─ P4 crit        → multiplica `amount` se when casa (inclui firstHitOfCombat da sessão)
  ├─ P6 statusCombo → ao aplicar: se alvo tem ifTargetStatus e type==onDamageType → burst + consome
  └─ (ramo fatal) P2 onKill → área de dano escalada por scaleField (ex: overkill)
regenTick(entity):    P5 regen → aplica mult condicional (ex: mana em combate)
recompute/formulas:   P9 derivedMod → reescreve o derivado (dano desarmado do Monge)
unlock handler:       P8 grantSkills → push em knownSkills (idempotente)
executor de skill:    P7 skillSwap → resolve a skill EFETIVA (mutada) em vez da base
```

`firstHitOfCombat` e `inCombat` saem da **sessão de combate** que já criei (`CombatSession`): adiciono um flag `dealtDamageThisSession` pra P4.

### 3.4 Princípio de balance preservado

- **Mutação = P7 (verbo novo), nunca número** — Koster intacto (a constituição veta "Fireball VI").
- **Marca/Caminho = bônus pequeno** (regra de ouro: nada é balanceado assumindo a camada emergente). Os `mult` são modestos ✏️ Balancista.
- Tudo continua **na sim, declarativo, serializável, cheat-proof** (o efeito é dado; o combate aplica).

---

## 4. Ordem de implementação do motor (depois deste design aprovado)

1. **`EffectSpec` tipado** + `activeEffects(entityId)` + cache (invalida em unlock/equip).
2. **Hooks em `applyDamage`**: P1, P3, P4, P2 (a maioria do valor num arquivo só).
3. **P5 regen** (`regenTick`) + **P8 grantSkills** (handler de unlock) — pequenos.
4. **P7 skillSwap** no executor (liga as 3 mutações ao motor de skill).
5. **P6 statusCombo** (o reativo — o mais novo) + **P9 derivedMod** (Monge).
6. Smoke headless por primitivo (igual ao que validou os sensores: detect→unlock→efeito aplicado→medido).

Cada passo é aditivo e testável. Ao fim, **uma ponta-a-ponta provada** (ex: Quebra-Ossos: matar undead → unlock → próximo golpe vs undead sai com ×bônus medido).

## 5. Pendências ✏️
- Flavor/nomes dos 12 (Loremaster) — canon: magia=mutação biológica, sem encantamento inventado, par EN/PT. **→ revisado em §6 (Chat B).**
- Todos os números (mult, chance, threshold, raio) — Balancista, por nicho.
- ⑩ dano-por-distância e ⑪ spreadStatus: confirmar se são primitivos de skill novos ou já cabem. **→ §6 ⑩/⑪ + fila.**
- `derivedMod` do Monge: forma exata (override de fórmula de dano desarmado) — desenhar junto com as skills marciais.

---

## 6. Revisão de significado — Chat B (Refino & Design)

> Passada uma-a-uma das 12 fichas pelas skills `designer-de-sistemas` (constituição/Teste
> da Mastigação) + `loremaster` (cânone, par EN/PT, sem encantamento inventado). Veredito:
> **APROVADO** (segue) · **AJUSTAR** (muda significado/flavor/rótulo, sem repensar) ·
> **REPENSAR** (efeito↔fantasia quebrados). **Toda mudança de EFEITO virou item na
> `fila-motor-emergente.md`** (referência [Bx]); mudança só de flavor/rótulo está aqui.
> Nomes são **propostas** (regra do Loremaster: criador escolhe entre candidatos).
> Números seguem ✏️ Balancista.

### ① Quebra-Ossos — **APROVADO**
- **Identidade:** máxima. É o exemplo-âncora da constituição (pilar 5) e ataca a família-coração (mortos-vivos, lore). Fantasia forte e nomeável.
- **Coerência:** `damageMult` vs `undead` ↔ "a lâmina aprendeu o cheiro das ossadas" — limpa. (É o exemplar de *condição-sobre-o-alvo* do par com ②.)
- **Constituição:** oculto, sem contador ✓. Marca = bônus pequeno/número é **permitido por contrato** (Koster-anti-treadmill vale só p/ Mutação=verbo novo; Marca é tempero). ✓
- **Gatilho↔recompensa:** 15k mortos-vivos com a mesma arma → mais dano vs mortos-vivos. Mesmo eixo, proporcional à opacidade brutal (auto-gateada no T3). ✓
- **Flavor (par EN/PT):** **Quebra-Ossos / Bonebreaker.**
  - hint (~50%): *"A lâmina fica fria quando há ossadas por perto."*
  - unlock: *"As ossadas se lembram do seu nome. Marca: Quebra-Ossos."*
  - ⚠️ ficha real usa `victim.family==undead` (o DUMMY `Roedor de Ferro` testa com `bestial` — não confundir).

### ② Última Resposta — **APROVADO**
- **Identidade:** forte, clutch. Canon (tabela de Marcas, DESIGN-EVOLUCAO). O par de ① (condição sobre o **próprio estado**), provando `damageMult` nos dois lados.
- **Coerência:** gatilho HP<10% (clutch brutal) / efeito HP<25% (banda mais larga) — **assimetria proposital e boa**: você merece no fio da navalha, usa numa faixa jogável. ✓
- **Convivência de eixos:** espelha o Caminho *Fúria Encurralada* (Knight) — **não é conflito**, é a ilustração do modelo 2-eixos (Marca=gear viaja com a arma · Caminho=comportamental viaja com o char). Nomes já distintos. ✓
- **Flavor (par EN/PT proposto):** **Última Resposta / Last Word** (idiomático: "a palavra final, decisiva"; alt. *Last Answer*). ⚠️ **não** reusar *Sobrevivente* (já é Caminho de `combat_end`).
  - hint (~50%): *"O aço esquenta na sua mão quando o sangue escorre."*
  - unlock: *"Encurralado, o aço responde. Marca: Última Resposta."*

### ③ Exagero → **AJUSTAR** (nome + significado; efeito mantém)
- **Identidade:** o overkill encarnado é forte — mas **"Exagero" é coloquial/moderno**, fora do registro FromSoft (peso mítico).
- **Coerência (o ponto crítico do briefing):** a fantasia nomeada *"você não mata: você apaga"* descreve **aniquilação de UM alvo**; o EFEITO (`onKill` → metade do overkill **respinga nos adjacentes**) é **transbordo/colateral**. Fantasia e mecânica **divergem**. O efeito (respingo de overkill) é ótimo e nomeável — o que falha é o nome/significado, que não expressam o **transbordar**.
- **Correção (só fiction):** renomear + reescrever o significado p/ o *carry-through* — o golpe é tão excessivo que **não termina no corpo, atravessa pra quem está ao lado**. Candidatos (criador escolhe):
  - **Transbordo / Overflow** — literal, expressa o respingo. (preferido pela coerência)
  - **Carnificina / Carnage** — evoca cena de vários corpos (casa com o AoE).
  - **Desmedida / Excess** — "falta de medida", poético, registro alto.
  - hint (~50%): *"O golpe não parece terminar onde devia."*
  - unlock: *"Você não fere um corpo — atravessa-o. Marca: Transbordo."*
- **Efeito → fila [B1]:** o respingo hoje **não tem `damageType`** — definir (provável: tipo do golpe fatal / físico) p/ interagir com resistências corretamente. *Significado, não número.*
- **DECISÃO CRIADOR (jun/2026):** (a) fração do overkill = ✏️ Balancista (não fixar "metade"); (b) **forma do respingo NÃO é raio-1 cheio** (8 tiles = forte/incoerente) — preferida **lateral/perpendicular ao golpe (os 2 tiles ao lado da vítima)** = cleave que atravessa (coerente c/ "transbordo"); **cruz N-S-E-W (4 tiles)** = fallback mais simples (não precisa de direção). → embutido em [B1].

### ④ Inabalável — **AJUSTAR** (rótulo errado + ambiguidade Marca×Caminho)
- **Rótulo errado:** o catálogo §1 chama de *"Caminho conduta"* — **não é conduta** (não há restrição a quebrar). É **acúmulo** (`count`/`sum:blockedAmount` de bloqueios). Categoria correta: **estilo** (Caminho) **ou Marca de escudo**. (Corrigido inline na §1.)
- **Ambiguidade a reconciliar (✏️ criador):** DESIGN-EVOLUCAO lista *Inabalável* como **Caminho do Knight** *e* na tabela de **Marcas** ("escudo bloqueou 50k"); a spec-de-sensores §2.4 a trata como **Marca de escudo** (`shieldInstanceId`). **Recomendação Chat B:** fixar como **Marca de ESCUDO** (eixo gear) — o efeito só existe com escudo na mão, "o escudo que aguentou 50k" é uma relíquia perfeita, e casa com a spec. Se quiser também a versão char, dar **outro nome** ao Caminho (não duplicar "Inabalável").
- **Coerência:** `blockFull` (chance de absorver 100%) ↔ *"nada te move"* — perfeita; e é o **verbo novo** (bloqueio total, normalmente impossível — DESIGN-ITENS). ✓
- **Flavor (par EN/PT):** **Inabalável / Unmoved** (alt. *Unshaken*).
  - hint (~50%): *"Os golpes contra o seu escudo soam cada vez mais surdos."*
  - unlock: *"Nada te move. Marca: Inabalável."*
- *(Sem mudança de EffectSpec — `blockFull` fica. A categoria real entra na ficha de Q5.)*
- **DECISÃO CRIADOR (jun/2026): efeito aprovado; THRESHOLD destoa → brief Balancista.** Bloqueio é evento frequente (vários/luta) → 50k bloqueios pode chegar MAIS rápido que 15k kills (foge da régua dos outros). Calibrar medindo **bloqueios/hora × troca de escudo por tier**, alvo "muito difícil, não inalcançável" (alinhar com a magnitude das outras Marcas, não em nº absoluto).

### ⑤ Sombra Sem Nome — **REPENSAR efeito (DECISÃO CRIADOR jun/2026)** → crit OUT, mitigação de abertura IN
- **Identidade:** o mestre que não é pego desprevenido (Rogue). Canon. Mítico.
- **Por que mudou:** crit garantido ×2 toda abertura = **power-spike ofensivo** (Rogue abriria one-shotando) → fere "emergente = tempero, nunca pilar". E **eixo cruzado**: gatilho defensivo (vencer sem tomar dano) premiando ofensiva (crit). Avaliação Chat B: **concordo com a troca.**
- **Efeito NOVO:** o **1º golpe RECEBIDO ao entrar em combate sofre redução de dano** (a abertura contra você "desliza"). Mesmo eixo do gatilho (não toma dano → mais difícil de ser ferido na abertura), **tempero defensivo, não spike**. % ✏️ Balancista.
- **Coerência:** vencer sem tomar dano → a abertura inimiga te acha menos. *"O primeiro golpe é o último que veem"* migra de "seu 1º golpe mata" p/ "o 1º golpe deles falha em te abrir". Mantém o flavor de assassino intocável.
- **Infra (parcial pronta):** reusa a `CombatSession` (já abre no 1º dano / fecha por inatividade). Falta: flag **"1º hit RECEBIDO da sessão"** + **primitivo novo de redução de dano RECEBIDO** (hoje só há efeitos de SAÍDA). → fila [B5].
- **Nota Balancista:** a janela de fim-de-combate (hoje `COMBAT_IDLE_MS=4000`) governa com que frequência re-arma; se 4s deixar proccar fácil demais, alongar a janela p/ este Caminho.
- **Crit (P4) NÃO se perde:** segue no motor p/ conteúdo ofensivo (ex: *Riposte* do Golpe Forte) — ⑤ só deixa de ser a vitrine dele.
- **Constituição:** `combat_end` oculto ✓; mitigação de abertura = verbo novo, não número ✓; agora é tempero, não pilar ✓.
- **Flavor (par EN/PT):** **Sombra Sem Nome / Nameless Shadow.**
  - hint (~50%): *"O primeiro bote contra você nunca encontra carne."*
  - unlock: *"O primeiro golpe é o último que veem. Caminho: Sombra Sem Nome."*

### ⑥ Intocável → Intocado — **AJUSTAR** (cânone + significado pedem outra palavra)
- **Cânone:** DESIGN-EVOLUCAO.md:348 grafa **"Intocado"**; o catálogo e os comentários da sim (`events.ts`/`engine.ts`) puseram **"Intocável"** — divergência. **Intocável** (untouchable) sugere **evasão/defesa**; a conduta é **nunca causar dano físico** → a fantasia é **pureza** (*"o corpo não suja as mãos"*), que é **Intocado** (untouched/imaculado). Alinhar a **Intocado**. (Corrigido inline.)
- **REPENSAR condição E efeito (DECISÃO CRIADOR jun/2026):**
  - **Efeito velho era REDUNDANTE.** A mana **já regenera em combate hoje** (base — `regenTick` todo tick, `Simulation.ts:1072`). Atualizar DESIGN-EVOLUCAO:348 (lista esse efeito velho).
  - **Proposta "regen turbinado + ratio" REJEITADA pelo criador** — regen = número (anti-Koster); ratio = cópia do ⑦. Descartada.
  - **NOVA DIREÇÃO (verbo — PENDENTE confirmação do criador):**
    - **Efeito:** *"a magia se alimenta"* — ao dar o **golpe final com magia**, devolve um tanto de **mana** (loop condicional, não regen passivo). Coerente c/ "o corpo não suja as mãos — a magia se basta". Nova `action:"restoreMana"` no `onKill` → fila [B6] (tipo 2, Chat A).
    - **Condição:** vencer ~N combates causando **só dano mágico** (físico=0 na sessão, via `combat_end` que já existe) — alcançável e **distinto do ratio do ⑦**.
- **Flavor (par EN/PT):** **Intocado / Untouched.**
  - hint (~50%): *"Quanto menos suas mãos tocam, mais o poder corre por elas."*
  - unlock: *"O corpo não suja as mãos. Caminho: Intocado."*

### ⑦ Senhor dos Extremos — **APROVADO com 2 regras (DECISÃO CRIADOR jun/2026)**
- **Identidade:** o mestre dual-elemento. Canon. Mítico.
- **Coerência:** gate de ratio (95% fogo+gelo) → **choque térmico** (fogo no alvo sob gelo/`slow` / gelo no `burn` = burst + consome ambos — status reais são `slow`/`burn`, não "frozen"; Chat A já ligou). *"Fogo e gelo são a mesma língua"* ↔ um verbo que você só fala combinando os dois. **O exemplar Koster**. ✓✓✓
- **REGRA 1 — mínimo por elemento (→ fila [B7]):** 95% fogo+gelo COMBINADO permite 94% fogo / 1% gelo. Adicionar **piso por elemento** (fogo ≥X% E gelo ≥X%) pra ser "mestre dos DOIS", não "quase-mono + tempero". Capacidade nova no gate de ratio.
- **REGRA 2 — disponibilidade não pode obrigar:** se o kit acessível no nível-alvo só tiver fogo+gelo, o ratio é satisfeito por falta de opção (não é compromisso). Garantir dano NÃO-fogo/gelo disponível. Nota de design (world/skills).
- **Choque térmico (burst)** → ✏️ Balancista, com cuidado.
- **Flavor (par EN/PT):** **Senhor dos Extremos / Lord of Extremes.**
  - hint (~50% rumo ao milestone): *"O quente e o frio começam a se confundir nas suas mãos."*
  - unlock: *"Fogo e gelo são a mesma língua na sua boca. Caminho: Senhor dos Extremos."*

### ⑧ O Naturalista — **CORTADO (DECISÃO CRIADOR jun/2026)**
- O criador confirmou **"corta"**. O trait (+dano plano = anti-Koster, o membro mais fraco do lote) **sai** do catálogo.
- **O primitivo `distinct` PERMANECE** no motor — serve Caminhos de amplitude muito melhores (Explorador = N regiões, Polímata = N skills). Só não existe mais a ficha "Naturalista".
- → fila [B2] (decisão FEITA, sem trabalho de engine).

### ⑨ Eclosão Ígnea — **AJUSTAR efeito (DECISÃO CRIADOR jun/2026)** → knockback é o ganho, SEM AoE-dano
- **Coerência:** casts à **queima-roupa** → o feitiço **empurra** quem está colado (o caster QUER espaço). O **knockback** é o valor e a mecânica própria.
- **Correção (→ fila [B8]):** "explosão centrada" **NÃO** dá dano de área a todos em volta (furaria o gate de AoE-dano ~lvl 20, hub §6 — mesmo princípio do ⑪). Dano fica essencialmente single-target; **no máximo** burn-chip (DoT) em **1–2 adjacentes** (Balancista confere se nem isso é OP).
- **Constituição:** `skillSwap` projétil→knockback = **verbo novo** (controle/reposição, não número) ✓. 1ª mutação = onramp ✓. Tempero, não power-spike ✓.
- **Lore:** *"Eclosão"* (eclodir/brotar) casa com **magia=mutação biológica** — o corpo florescendo em fogo. Ótimo.
- **Flavor (par EN/PT proposto):** **Eclosão Ígnea / Igneous Bloom** (mantém o "brotar"; alt. *Ember Bloom*).
  - **hint (~50%, PERFIL queima-roupa):** *"As chamas latejam perto da pele, como se quisessem te envolver."*
  - unlock: *"A Bola de Fogo implode ao seu redor: Eclosão Ígnea."*
  - ⚠️ **hint POR PERFIL** (design §2): o DUMMY dá o **mesmo** hint a ⑨ e ⑩ ("compartilhado") — **errado por design**. ⑨ telegrafa PERTO; ⑩ telegrafa LONGE. Corrigir nas fichas reais.
  - Depende de [Q1] (def da skill mutada: `selfRadius` + knockback).

### ⑩ Meteoro Distante — **AJUSTAR** (risco de upgrade puro + hint compartilhado)
- **Coerência:** casts à **distância máxima** → **alcance maior + dano escala com distância**. Você atira de longe → vira artilharia. ✓ "Meteoro" (cai de longe/alto) casa com distância — e ecoa a Chegada (estrela que explode, lore).
- **Constituição (o risco):** "+alcance e +dano à distância" pode virar **"Bola de Fogo VI"** (upgrade estrito) — e Mutação **substitui** a base, então um upgrade puro é **degeneração Sirlin** (por que NÃO levar?). A Mutação tem de ser **sidegrade/condicionador de estilo, nunca power-spike** (design).
- **Correção (efeito → fila [B3]):** o dano-por-distância deve ser **dois-lados** (bônus longe **e penalidade perto** / range mínimo), pra Meteoro ser **escolha**, não estritamente melhor. Confirma o "1 param novo" (`damageScalesWithDistance`) como aceitável.
- **Flavor (par EN/PT):** **Meteoro Distante / Distant Meteor.**
  - **hint (~50%, PERFIL distância):** *"O fogo anseia pelo horizonte."* (exemplo do próprio design — **não** o hint compartilhado do DUMMY)
  - unlock: *"A Bola de Fogo cai como um meteoro do horizonte: Meteoro Distante."*

### ⑪ Fogo Voraz — **APROVADO**
- **Identidade:** canon (pilar 5 da constituição cita o nome). O incêndio florestal — fogo alimenta fogo.
- **Coerência:** casts em alvo **já queimando** → **reacende e espalha o burn em área**. Você explorou o queimando → o fogo vira **contágio**. *"Fogo Voraz"* ↔ fogo que se espalha/devora. ✓✓ A mais coesa das três mutações.
- **Constituição:** `skillSwap` single-DoT→contágio = **verbo novo** ✓. **⚠️ nota Balancista:** o espalhar é **DoT-chip (lasca), não deleta-pack** — respeitar o **gate de AoE-de-dano (~lvl 20, hub §6)**: contágio de queimadura ≠ nuke de área.
- **DECISÃO CRIADOR (jun/2026) — forma FECHADA:** ao acertar alvo já queimando, **(1) reacende/intensifica o burn no alvo** + **(2) espalha burn de dano SIMBÓLICO pra CRUZ N-S-E-W (4 ortogonais)** — tudo como **STATUS/DoT (contágio), não dano cru**. Mantém a identidade, fica no nicho chip-DoT do Mage (igual Fagulhas), distinto dos cleaves de ③/⑨, e o dano simbólico resolve o medo de OP. Intensidade ✏️ Balancista.
- **Efeito → fila [B4]:** **`spreadStatus`** primitivo novo (reacende primário + espalha burn-simbólico na cruz N-S-E-W; o executor hoje não espalha status).
- **Flavor (par EN/PT proposto):** **Fogo Voraz / Ravenous Fire** (alt. *Wildfire*, se a ênfase for o espalhar).
  - **hint (~50%, PERFIL alvo-queimando):** *"As chamas que você lança procuram outras chamas."*
  - unlock: *"O fogo encontra fogo e não se sacia: Fogo Voraz."*

### ⑫ Monge (Mão Vazia) — **APROVADO** (o teto — com ajustes do criador)
- **Identidade:** máxima. A 5ª classe que ninguém escolhe, emergente do Priest. A coroa do sistema (camada 3 da escada).
- **Coerência:** **lvl ~20** sem nunca equipar **arma primária** → `grantSkills` (marciais desarmadas, *Punhos da Fé*) + `derivedMod` (dano desarmado real escala). Recusou a arma → o punho VIRA a arma. O "teto" combinando P8+P9 = prêmio máximo p/ a opacidade máxima. Pilar 3+6 em estado puro. ✓✓✓
- **AJUSTES DO CRIADOR (jun/2026):**
  - **Milestone lvl 25 → ~20** (alinha com Intocado/Senhor dos Extremos; atualizar DESIGN-EVOLUCAO que diz 25).
  - **Quebra só ao equipar ARMA PRIMÁRIA (main-hand).** **Luva e off-hands são LIBERADOS** (o Monge luta de luva/punho; a luva já era o hint do rito do Priest). `breakFilter` = `slot==mainHand && category==weapon`, não "qualquer arma". **Exige o sistema de slots distinguir main-hand-arma de off-hand/luva** → fila [B9] (depende do equipamento).
- **Notas (sem mudar efeito):**
  1. **Escopo da conduta = `sinceClass`** (conta da aquisição da classe; o glove do rito do Priest é o hint silencioso). A ficha deve fixar isso.
  2. **Sem class-lock duro (recomendado):** a conduta é agnóstica, mas *Punhos da Fé* é **sagrado (escala Espírito)** + o corpo automático do Priest → **auto-gateia ao Priest** sem trava (consistente com o de-classing: nada é exclusivo de classe; o corpo é o freio). Um Knight-Monge teria Esp baixo → punho fraco.
  3. **Quebrar antes de destravar = ✏️ ABERTO** (NetHack "perde p/ sempre" vs "só zera" — DESIGN-EVOLUCAO). O DUMMY `Punho Bruto` escreve "perdida para sempre" — **não deixar isso virar cânone por inércia**; é decisão do criador.
  4. `derivedMod` (fórmula de desarmado) + as marciais desenhados **juntos** — depende de [Q4]/[Q3-skills].
- **Flavor (par EN/PT):** Caminho **Mão Vazia / Empty Hand** → identidade revelada **Monge / Monk**.
  - hint (~50%, ~lvl 12 sem arma): *"Há um peso estranho na ausência da arma — e suas mãos não o sentem."*
  - unlock: *"Suas mãos bastam. Caminho: Mão Vazia. Você é um Monge."* (o momento screenshotável da 5ª classe.)

### Achados transversais
- **DUMMY ≠ as 12 reais.** `definitions.ts` tem stand-ins de teste (*Roedor de Ferro* vs `bestial`, *Chama Viva*, *Punho Bruto*) p/ exercitar a engine — **não** as fichas canônicas. Esta revisão alimenta as fichas reais ([Q5] + ⑨⑩⑪ + Monge).
- **Hint por-perfil** (⑨⑩⑪): o DUMMY compartilha um hint entre perfis — **viola** o design (§2: cada perfil telegrafa sua direção). Fichas reais usam os hints distintos acima.
## 7. Roteamento (triagem do criador, jun/2026)

> Regra: **precisa de engine nova?** Efeito/obtenção usa algo que **já existe** → **Chat C** (balanceamento). Exige algo que **não existe** → **Chat A** (engine), e só depois Chat C.
> Tipos: **1** = sem mudança · **2** = muda p/ algo que NÃO existe (engine) · **3** = muda p/ algo que EXISTE.

| Ficha | Tipo | Muda | Existe? | Destino |
|---|---|---|---|---|
| ① Quebra-Ossos | 1 | — | P1 ✓ | **Chat C** (nº ~15k, mult%) |
| ② Última Resposta | 1 | — | P1 ✓ | **Chat C** (nº ~10k, mult%) |
| ④ Inabalável | 1 | só threshold | P3 ✓ | **Chat C** (calibrar 50k) |
| ③ Transbordo | 2 | forma respingo (lateral/cruz)+type | ✗ onKill só `radius` | **Chat A** [B1] |
| ⑤ Sombra Sem Nome | 2 | efeito→mitigar 1º golpe recebido | ✗ só efeitos de saída | **Chat A** [B5] |
| ⑥ Intocado | 2 | efeito→mana on magic-kill; cond→combat_end mágico | ✗ `onKill restoreMana` nova | **Chat A** [B6] *(direção a confirmar)* |
| ⑦ Senhor dos Extremos | 2 | obtenção→mínimo por elemento | ✗ ratio é 1 numerador | **Chat A** [B7] (+burst→C) |
| ⑨ Eclosão Ígnea | 2 | knockback, sem AoE | ✗ P7+knockback | **Chat A** [Q1]/[B8] |
| ⑩ Meteoro Distante | 2 | dano-por-distância 2-lados | ✗ P7+escala-distância | **Chat A** [Q1]/[B3] |
| ⑪ Fogo Voraz | 2 | contágio burn simbólico cruz | ✗ P7+spreadStatus | **Chat A** [Q1]/[B4] |
| ⑫ Monge | 2 | derivedMod + quebra main-hand | ✗ P9+slot taxonomy | **Chat A** [Q4]/[B9] |
| ⑧ Naturalista | — | **CORTADO** | — | removido ([B2]; `distinct` fica) |

- **Chat C já liberado** (sem engine): **① ② ④**. (⑥ entra no C **depois** que o A construir o `restoreMana`.)
- **Chat A** (engine): **③ ⑤ ⑥ ⑦ ⑨ ⑩ ⑪ ⑫**.
- **Pendência aberta:** confirmar a direção-verbo do ⑥ ("a magia se alimenta" / mana on magic-kill) — se reprovada, ⑥ pode ser ADIADO.

### Veredito FINAL (jun/2026)
- **Aprovadas direto:** ② ⑦(+2 regras) ⑩.
- **Aprovadas c/ ajuste de efeito/forma:** ① · ③ (respingo lateral/cruz + damageType) · ④ (efeito ok, threshold→Balancista) · ⑨ (knockback, sem AoE) · ⑪ (contágio burn simbólico, cruz N-S-E-W) · ⑫ (lvl 20 + só arma primária quebra).
- **Repensadas:** ⑤ (crit → mitigação do 1º golpe recebido) · ⑥ (no-op+impraticável → mana-on-magic-kill + combat_end mágico, *a confirmar*).
- **Cortada:** ⑧ Naturalista (primitivo `distinct` fica).
- **Cânone a propagar:** DESIGN-EVOLUCAO — efeito Intocado, milestone Monge 25→20; comentários sim "Intocável"→"Intocado".
