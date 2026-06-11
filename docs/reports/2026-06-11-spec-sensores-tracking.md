# Spec — Matriz de Sensores do Tracking (Designer → código)

> Spec-de-dados completa para a expansão do motor emergente (Marcas/Mutações/Caminhos).
> Objetivo do criador: **recompensar o máximo de variações de gameplay** — toda
> conduta natural tem um destino nomeado esperando. Reconcilia com o escalador
> competitivo: **largura no catálogo, profundidade na escolha** (o jogador converge;
> o catálogo é largo).
>
> Pareada com o estado auditado em `src/sim/events.ts` + `src/sim/tracking/`.
> Padrão: mesmo de `2026-06-11-spec-targetings-novos.md` (spec → código).
> Números/nomes/thresholds = ✏️ (Balancista/Loremaster). Aqui só a ESTRUTURA.

## 0. Decisões de arquitetura (fechadas nesta sessão)

1. **Peso é não-fator.** Tracking roda só para eventos do jogador (esparsos); todo
   redutor é O(1)/evento; `Set` de distinct tem cardinalidade baixa (famílias ~12,
   regiões ~dezenas). Otimiza-se por **robustez/completude**, não perf.

2. **Núcleo ponto-evento + filtro permanece** (o que já existe em `filters.ts`).

3. **Redutor declarativo** generaliza o contador. `count` é um caso de "reduza
   eventos casados num número":
   ```ts
   accumulator?:
     | { kind: "count" }                    // default = comportamento atual
     | { kind: "distinct"; field: string }  // cardinalidade de conjunto (Naturalista)
     | { kind: "sum"; field: string }       // soma (cura total, dano absorvido)
     | { kind: "max"; field: string }       // recorde (maior overkill)
   ```
   `threshold` compara o VALOR REDUZIDO (count / set.size / soma / max).

4. **Eventos de sessão**: o emissor agrega fatos INTRÍNSECOS (um combate aconteceu)
   e publica num evento; a engine consome como qualquer evento. Resolve streak/
   no-damage/duração/comeback **sem** lógica de janela na engine.

5. **Gate de ratio**: `PathDef` com `flavorKind: "ratio"` (numerador/denominador +
   `minRatio` + milestone). Torna *Senhor dos Extremos* expressável (hoje NÃO é).

6. **Regra de partição** (quem agrega o quê): janela é fato do mundo → emissor
   (evento de sessão); janela/campo é escolha de conteúdo → redutor declarativo.

7. **Escopo do acumulador** — onde vive e quando reseta:
   `scope: "item" | "character" | "combat" | "sinceClass"`.
   Marca força `item` (ledger); Mutação força `character`; Caminho usa `character`
   ou `sinceClass`; agregados de combate chegam pré-reduzidos (sem scope).

### Filosofia (passou no veto)

- **MMO-safe / anti-datamine**: todo estado é por-personagem ou por-instância;
  o snapshot só leva hint/unlock, NUNCA contador/progresso (regra já vigente).
- **Anti-treadmill (Koster)**: sensores novos abrem IDENTIDADE, não número maior.
- **Concentração vs. amplitude convivem**: `distinct` é categoria SEPARADA — o
  Naturalista ganha casa **sem** furar "generalista não muta skill" (são eixos
  distintos: Mutação=concentração; Caminho-distinct=amplitude).

---

## 1. Achados da auditoria (o que motiva a expansão)

| # | Achado | Consequência |
|---|---|---|
| A | `KillEvent` carrega `finalBlow.amount`/posições que o adaptador `killFacts()` **descarta** | fato grátis parado; expor |
| B | **HP da vítima antes do golpe NÃO existe no payload** | overkill é incalculável hoje |
| C | Engine só faz "conta ocorrências"; **não conta distintos** | Naturalista impossível de declarar |
| D | Engine não faz **ratio sobre janela** | *Senhor dos Extremos* (já no design) **não roda** |
| E | ~~`block`/`level_up` não emitidos~~ **CORRIGIDO na auditoria: ambos JÁ emitem** (combat.ts:79, progression.ts:169); só os comentários de events.ts estavam velhos | (era falso achado — comentários atualizados) |
| F | **Não há evento `equip`** | *Pele de Ferro*, *Duas Mãos*, quebra-por-arma do *Mão Vazia* (já no design) **não têm como quebrar a conduta** |
| G | `night` existe no contexto mas é **sempre false** (clock dia/noite não ligado) | *Filho da Noite*/*Lâmina da Vigília* inertes |

---

## 2. Eventos — matriz completa

Legenda: ✅ existe · 🔌 tipado, ligar · 🆕 novo. Campos 🆕 marcam fato novo no payload.

### 2.1 `kill` ✅ (enriquecer)

| Campo (Facts) | Status | Abre |
|---|---|---|
| `victim.family` `victim.species` | ✅ | famílias / nêmesis |
| `victim.tier` | 🆕(expor) | dificuldade |
| `victim.isElite` `victim.isBoss` | 🆕 | caçador de chefes |
| `attackerHpPct` | ✅ | clutch (Última Resposta) |
| `finalBlow.amount` | 🆕(expor) | recordes de golpe |
| `victimHpBeforeBlow` | 🆕 | **overkill** = finalBlow − este |
| `victimMaxHp` | 🆕 | normalizar overkill |
| `overkill` `overkillRatio` | 🆕(derivado) | **Glass cannon / Exagero** |
| `victimHpPctBeforeBlow` | 🆕 | **Executor** (<10%) vs **Abertura** (100%) |
| `distance` | ✅ | melee/ranged |
| `weaponReachUsed` | 🆕(derivado) | **Atirador** (kill no alcance máx) |
| `enemiesAdjacent` | 🆕 | **Berserker/Cercado** |
| `enemiesEngaged` | 🆕 | outnumbered |
| `levelDelta` (nívelMob − nívelJogador) | 🆕 | **Matador de Gigantes** |
| `terrain` (tile sob a vítima) | 🆕 | **Lutador ambiental** (água/lava/pântano) |
| `statusesOnVictim` (nº) | 🆕 | **Combeiro** |
| `damageType` | ✅ | elemento |
| `avengesDeath` | 🆕(memória de algoz) | **Nêmesis/Vingança** |
| `timeOfDay` `night` | 🆕(ligar clock) | **Filho da Noite** |

### 2.2 `skill_use` ✅ (já rico; complementar)

Mantém todos os campos atuais. Adicionar:

| Campo | Status | Abre |
|---|---|---|
| `targetsKilled` | 🆕 | identidade de AoE-deleter |
| `damageDealt` | 🆕 | sum (dano mágico total) / overkill por skill |
| `castWhileMoving` | 🆕 | **caster móvel/kite** |
| `statusesOnTarget` (nº) | 🆕 | combo |

### 2.3 `damage` ✅

| Campo | Status | Abre |
|---|---|---|
| `amount` `damageType` `target.family` | ✅ | sum por elemento (ratio paths) |
| `wasFatal` | 🆕 | ponte p/ overkill |
| `crit` | 🆕(quando crítico existir) | builds de crítico |

### 2.4 `block` 🔌 (ligar)

Payload: `blocker`, `attacker.family`, `blockedAmount`, `damageType`,
**`shieldInstanceId`** (🆕 — a Marca *Inabalável* vive no ledger do ESCUDO; hoje a
engine cai no weapon equipado, ✏️ corrigir), `context`.
Acumulador típico: `count` (nº de bloqueios) e `sum:blockedAmount` (dano absorvido).

### 2.5 `level_up` 🔌 (ligar)

Payload já tipado. Emitir de fato. É o GATILHO de milestone de conduta E de ratio-gate.

### 2.6 `combat_end` 🆕 (agregador de sessão — o novo grande)

Define-se uma SESSÃO de combate: entra em combate (engajou/foi engajado por hostil)
→ N ms sem hostil engajado → `combat_end`. Emissor agrega:

| Campo | Abre |
|---|---|
| `durationMs` | **Velocista** (kills/duração) |
| `damageTaken` | **Intocável** (==0) |
| `lowestHpPct` | **Sobrevivente/Comeback** (caiu <X% e venceu) |
| `damageDealt` | DPS de sessão |
| `kills` | matança em série |
| `dmgByElement: Record<DamageType, number>` | share elemental (alimenta ratio) |
| `dodges` `blocks` | defensivo |
| `maxEnemiesFaced` | **Encurralado venceu** |
| `endedBy: "victory"\|"flee"\|"death"` | fuga vs vitória |

> Esta é a peça de maior implementação (rastreador de sessão na sim). Tudo o mais
> da Camada streak/no-dano/comeback cai de graça depois, **sem** tocar a engine.

### 2.7 `dodge` 🆕

Payload: `dodger`, `attacker.family`, `context`. (Esquiva já é stat derivado.)
Abre **Esquivo/Vento**.

### 2.8 `consume` 🆕

Payload: `entity`, `itemId`, `kind: "food"|"potion"|"scroll"|"tome"`, `context`.
Abre **Gourmet/Survivalista**. (Aprender tomo pode ser `consume{kind:"tome"}` OU
`learn_skill` — ver 2.9; decidir ✏️.)

### 2.9 `learn_skill` 🆕

Payload: `entity`, `skillId`. `distinct:skillId` → **Polímata** (aprendeu N skills
distintas). Combina com o teto-de-mana do corpo automático (sabe muito, usa pouco).

### 2.10 `equip` / `unequip` 🆕 (destrava condutas JÁ desenhadas)

Payload: `entity`, `slot`, `item.category` (`armor`|`shield`|`weapon`|`twohanded`),
`item.instanceId`, `context`. Sem isto, *Pele de Ferro* / *Duas Mãos* / quebra-por-
arma do *Mão Vazia* não têm `breakEvent`. Resolve achado F.

### 2.11 Exploração 🆕 (eixo inteiro novo)

| Evento | Campos | Abre |
|---|---|---|
| `region_enter` | `regionId`, `firstVisit`, `zLevel`, `dangerTier` | **Explorador** (distinct regionId) |
| `poi_discover` | `poiId`, `kind` (chest/shrine/vista/dungeon), `firstVisit` | **Cartógrafo** |
| `secret_found` | `secretId` | **Arqueólogo** (segredos) |
| `descend` (z) | `depth` | **Mergulhador** (max depth) |

Anti-datamine: `firstVisit`/secret é estado por-personagem; nunca viaja no snapshot
além do unlock. Casa com portões-de-conhecimento (keyword de diálogo = metroidbrainia).

### 2.12 `death` 🆕 (memória de algoz → vingança)

Payload: `entity`, `killer.species`, `killer.id`. Guarda "último algoz" no estado do
personagem → próximo `kill` daquela species marca `avengesDeath: true` (campo 2.1).

---

## 3. Redutor declarativo — exemplos de catálogo (ilustrativos, números ✏️)

```ts
// NATURALISTA — matou N famílias distintas (amplitude, não concentração)
{ category:"path", flavorKind:"style", event:"kill",
  accumulator:{ kind:"distinct", field:"victim.family" },
  threshold: 12 /*✏️*/, scope:"character", name:"O Naturalista" }

// EXAGERO — recorde de overkill (glass cannon que desperdiça com estilo)
{ category:"mark", event:"kill",
  filter:[{ field:"overkillRatio", op:">=", value:3 }],
  accumulator:{ kind:"count" }, threshold: 5000 /*✏️*/, name:"Exagero" }

// MARTÍRIO — dano absorvido acumulado (tanque)
{ category:"path", flavorKind:"style", event:"block",
  accumulator:{ kind:"sum", field:"blockedAmount" }, threshold: 200000 /*✏️*/ }

// SENHOR DOS EXTREMOS — ratio gate (resolve achado D)
{ category:"path", flavorKind:"ratio", event:"damage",
  numerator:[{ field:"damageType", op:"in", value:"fire|ice" }],
  denominator:[], field:"amount",
  minRatio: 0.95 /*✏️*/, milestoneLevel: 20 /*✏️*/, resetScope:"sinceClass" }

// INTOCÁVEL — combate vencido sem tomar dano (via combat_end)
{ category:"path", flavorKind:"style", event:"combat_end",
  filter:[{ field:"damageTaken", op:"==", value:0 },
          { field:"endedBy", op:"==", value:"victory" }],
  accumulator:{ kind:"count" }, threshold: 1000 /*✏️*/ }
```

---

## 4. Sequência de implementação recomendada

1. **Consertos do que existe** (destrava conteúdo já desenhado): ligar `block`+
   `level_up`+`equip`; expor `finalBlow.amount`; migrar mutação share→absoluto.
2. **Redutor declarativo** (`accumulator` em `TrackingDef` + estado) — destrava
   Naturalista/recordes/totais de uma vez.
3. **Ratio-gate** (`flavorKind:"ratio"`) — destrava Senhor dos Extremos.
4. **Camada 1 de fatos** no `kill`/`skill_use` (overkill, hpBeforeBlow, crowd,
   levelDelta, terrain, statuses).
5. **`combat_end`** (rastreador de sessão) — destrava streak/no-dano/velocidade.
6. **Eventos de exploração** + `consume`/`dodge`/`death` — eixos inteiros novos.
7. Ligar o **clock dia/noite** (`night`/`timeOfDay`).

Cada passo é independente e aditivo; o catálogo declarativo cresce sem retrofit.

## 6. STATUS DE IMPLEMENTAÇÃO (jun/2026) — IMPLEMENTADO

Tudo abaixo: `npx tsc` 0 erros + `npm run build` ok + smoke headless 7/7 (distinct,
mutação-absoluta close-vs-far, sum, ratio no milestone). Branch `balance/curva-xp-regen`.

**Engine (`src/sim/tracking/`):**
- ✅ **Redutor declarativo** `Accumulator = count|distinct|sum|max` (`types.ts`),
  estado generalizado (`state.ts` `PathStyleProgress.value/seen`; `ledger.ts`
  `MarkProgress.seen`), `reduceStep()` em `engine.ts`. Vale p/ Marca E Caminho.
- ✅ **Mutação migrada share→absoluto por perfil** (1º a cruzar a própria meta;
  removidos `minShare`/`totalServidUses`). Fecha o ⚠️ "código fora de sincronia".
- ✅ **Caminho `ratio`** (`flavorKind:"ratio"` + num/den/ratioField/minRatio +
  milestone no `level_up` + `resetScope:"sinceClass"` via `onClassAcquired`).
  **Resolve o achado D — *Senhor dos Extremos* agora é expressável e roda.**
- ✅ **Memória de algoz / Nêmesis** (`lastKillerSpecies` + fato `avengesDeath`).

**Fatos enriquecidos:**
- ✅ `kill`: `overkill`/`overkillRatio`/`victimHpBeforeBlow`/`victimMaxHp`/
  `victimHpPctBeforeBlow`/`statusesOnVictim`/`finalBlowAmount` (combat.ts) +
  derivados no adaptador `levelDelta`/`victim.tier`/`enemiesAdjacent`/`avengesDeath`.
- ✅ `skill_use`: `targetsKilled`/`statusesOnTarget`/`castWhileMoving` (executor.ts).
  (`damageDealt` deixado de fora — somatório de dano mágico fica melhor no `amount`
  do evento `damage` + acumulador `sum`, mais preciso por-golpe.)
- ✅ `damage`: `wasFatal`.

**Eventos novos EMITIDOS (sistemas existem):**
- ✅ `equip`/`unequip` (`Simulation.moveItem` → destrava Pele de Ferro / Mão Vazia).
- ✅ `consume` (`Simulation.useItem`, food+potion → Gourmet).
- ✅ `combat_end` (rastreador de sessão `CombatSession`: abre no 1º dano, fecha por
  inatividade `COMBAT_IDLE_MS=4000` ou morte; agrega damageTaken/Dealt/kills/
  lowestHpPct/maxEnemiesFaced/endedBy → Intocável/Sobrevivente/Velocista/Cercado).

**DEFERIDO (honesto — sistema-fonte não existe, NÃO falsifiquei sensor):**
- ⏸ `dodge` — esquiva (`formulas.dodgeChance`) **não é aplicada no combate ainda**;
  emitir premiaria um stat sem efeito. Liga junto com a aplicação da esquiva.
- ⏸ `terrain` no kill — exige `z` no payload de `kill` (hoje 2D). Dep `terrainAt`
  já cabe na engine; falta o z. (`enemiesAdjacent` ficou pronto.)
- ⏸ Exploração (`region_enter`/`poi_discover`/`secret_found`/`descend`) — **não há
  sistema de regiões/POI na sim** (só comentários no mapa). Tipos a adicionar junto
  com o sistema de zonas.
- ⏸ `learn_skill` (Polímata) — aprender tomo ainda não tem caminho de comando
  dedicado; entra com a wave de tomos.
- ⏸ Clock dia/noite — `context.night` segue `false` fixo (sistema de tempo do mundo).

## 5. Pendências ✏️ (criador / especialistas)

- Thresholds reais de TODO acumulador (Balancista).
- Nomes/flavor das identidades novas (Loremaster) — Naturalista, Exagero, Esquivo,
  Mergulhador, Gourmet, Matador de Gigantes, Nêmesis... (rascunhos acima).
- `tome` em `consume` vs. `learn_skill` próprio — decidir.
- Definição exata de "fim de combate" (N ms sem hostil) — Balancista.
- Fonte de `terrain`/`dangerTier`/POIs — world-design (specs de fatia).
- Lista de eventos canônicos que EVOLUEM Marcas (world bosses M3+) — separado disto.
