# Report: Engine genérica de tracking — Marcas / Mutações / Caminhos

**Branch:** `feature/tracking-engine`
**Data:** 2026-06-04
**Complexidade:** high

## O que foi feito

A peça central da camada emergente (DESIGN-EVOLUCAO.md): o jogo observa o
comportamento via eventos da sim e cristaliza padrões extremos em recompensas
nomeadas. Entrega = **engine genérica + definições dummy**. Conteúdo real
(thresholds e efeitos) é ✏️ do criador.

**Princípio inegociável respeitado:** condições são **DADOS, não código**.
Toda a engine opera sobre definições declarativas (`TrackingDef`). Adicionar
conteúdo = adicionar uma definição. Zero lógica por conteúdo.

### Sim (`src/sim/tracking/`) — novo módulo

- **`filters.ts`** — avaliador de filtros declarativos reutilizado pelas 3
  categorias. Filtro = lista de cláusulas `{ field, op, value }` com **AND
  implícito**. Operadores: `== != < <= > >= in exists`. Lê um objeto de
  **fatos achatados** (`Facts`) projetado do payload do evento por adaptadores.
- **`types.ts`** — modelo de definição declarativa (`MarkDef` / `MutationDef` /
  `PathDef` + base comum). Inclui textos de `hint`/`unlock` e `effect`
  (descrição + payload livre `Record<string, number|string>`).
- **`state.ts`** — estado serializável (Records, nunca Maps na borda) por
  personagem: mutações por skill, caminhos de estilo e condutas. Marca **não**
  vive aqui (vive no ledger do item — ver abaixo).
- **`engine.ts`** — `TrackingEngine`: assina o bus, projeta cada evento em
  `Facts`, avalia definições, mantém progresso e emite hint/unlock via um
  **sink** (apontado pela Simulation ao `pending` do tick).
- **`definitions.ts`** — `DUMMY_TRACKING_DEFS` (thresholds baixos, marcadas
  `// DUMMY ✏️`).
- **`index.ts`** — barrel.

### Integração

- **`items/ledger.ts`** — `ItemLedger` ganhou `markProgress: Record<string,
  MarkProgress>` (`{ count, hinted, unlocked }`). É **onde vive o progresso de
  Marca**, dentro da instância do item → viaja no trade (a história pertence ao
  objeto). Zerado em `createLedger`; exportado em `items/index.ts`.
- **`Simulation.ts`** — constrói `TrackingEngine` com os DUMMY defs + lookups
  (mesmo `attackerLevelOf` do ledger p/ anti-degeneração; `equippedWeaponInstanceId`;
  `isPlayer`), `attach`a ao bus, e a cada tick aponta o sink para o `pending`
  corrente (hints/unlocks viram `SnapshotEvent`).
- **`shared/protocol.ts`** — dois `SnapshotEvent` novos: `trackingHint { text }`
  e `trackingUnlock { category, name, flavorText }`. **Nunca** carregam
  progresso/contador/threshold/id.
- **`client/Game.ts`** — só `console.log` discreto ao receber os dois eventos
  (regra: client sem UI; a toast é da próxima wave).

## Contrato

### Shape da definição (`TrackingDef`)

```ts
// Comum às três categorias:
id: string                 // chave estável de dados/estado
name: string               // nome próprio (pt-BR) — É a recompensa social
event: SimEventName        // kill | skill_use | damage | block | level_up
filter: FilterClause[]     // [{ field, op, value }] com AND implícito (vazio = sempre)
threshold: number          // ocorrências válidas p/ desbloquear
flavor: { hint, unlock }   // textos do reveal (sem números)
effect: { description, payload: Record<string, number|string> }

// mark:     category: "mark"
// mutation: category: "mutation"; skillId; minShare   (≥ share dos usos válidos)
// path:     category: "path"; flavorKind: "style" | "conduct"
//           [conduct] breakEvent; breakFilter; milestoneLevel
```

### Eventos de protocolo (snapshot, one-shot)

- `{ kind: "trackingHint"; text }` — hint vago aos ~50% (uma vez só).
- `{ kind: "trackingUnlock"; category: "mark"|"mutation"|"path"; name; flavorText }`.
- **Garantia cheat-proof:** nenhum contador/threshold/id trafega.

### Onde vive cada progresso (decisões documentadas)

| Categoria | Vive em | Por quê |
|---|---|---|
| **Marca** | `ItemLedger.markProgress[defId]` na **instância** do item | A história pertence ao objeto — viaja no trade/drop. Escolhi **contador próprio no ledger** (não derivar dos contadores existentes do ledger) porque uma definição pode filtrar por dimensões que o ledger não pré-agrega (contexto composto); manter `{count,hinted,unlocked}` por definição é genérico e ainda viaja com o item. |
| **Mutação** | `TrackingState.byCharacter[id].mutations[skillId]` | Contador por (personagem, skillId) com **perfil de uso**: `totalValidUses` (denominador) + `profileCounts[defId]`. Ao cruzar o threshold, vence a mutação cujo perfil dominar (≥ `minShare`). |
| **Caminho (estilo)** | `...pathsStyle[defId]` | Acúmulo simples de eventos que casam o filtro. |
| **Caminho (conduta)** | `...pathsConduct[defId]` | `intact` desde a criação; quebra (evento+filtro) = `intact:false` **para sempre** naquele personagem; desbloqueia ao atingir `milestoneLevel` intacta. |

### Regra de atribuição da Marca (anti-degeneração)

A Marca avança na **instância que executou a ação** (não na "equipada agora"):
para `kill`/`damage` usa o `weaponInstanceId` do payload — exatamente a regra do
ledger ("conta o kill se ela deu o golpe final estando equipada"). Golpe final
por magia/DoT (`weaponInstanceId == null`) **não** avança Marca de arma. Kills
passam pelo **mesmo `isValidKill`** do ledger (mata farm de mob fraco).
`skill_use` não avança Marca de arma (skills geram Mutações; skills físicas de
arma já alimentam a Marca pelo `damage` que carregam a instância).

## Aplicação dos efeitos — FUTURO (documentado)

A engine **só registra o desbloqueio** e dispara o evento nomeado. `effect.payload`
é **metadado livre** que a engine **nunca interpreta** para alterar combate. A
aplicação mecânica (ex.: `+10% dano vs bestial`, explosão em área da mutação,
escala de dano desarmado) é **wave futura de conteúdo** — lerá `effect.payload`
das definições reais e plugará no pipeline de combate/skills.

## Como adicionar conteúdo (passo-a-passo, só DADOS)

Tudo é editar `src/sim/tracking/definitions.ts` (ou o array de defs real) — sem
tocar a engine.

**Nova Marca de item** (ex.: "Quebra-Ossos": 15k undead com a mesma espada):
```ts
{ category: "mark", id: "mark_quebra_ossos", name: "Quebra-Ossos",
  event: "kill",
  filter: [{ field: "victim.family", op: "==", value: "undead" }],
  threshold: 15000,
  flavor: { hint: "Sua espada vibra quando há mortos-vivos por perto.",
            unlock: "As ossadas se lembram do seu nome." },
  effect: { description: "+dano vs mortos-vivos (✏️ aplicar)",
            payload: { damageVsFamily: "undead", bonusPct: 15 } } }
```
Campos de filtro disponíveis no `kill`: `victim.family`, `victim.species`,
`attackerHpPct`, `distance`, `skillId`, `damageType`, `night`.

**Nova Mutação** (ex.: Lança de Gelo → "Estilhaço Profundo" em alvos já lentos):
defina 2–4 defs com o **mesmo `skillId` e mesmo `threshold`**, cada uma com seu
`filter` de perfil e `minShare` (ex.: 0.5). Vence quem dominar ao cruzar o
threshold. Campos do `skill_use`: `castDistance`, `casterHpPct`, `casterInCombat`,
`targetSelf`, `targetHpPct`, `target.family`, `targetWasBurning/Slowed/Poisoned`,
`hitFromBehind`, `targetsHit`.

**Novo Caminho de estilo** (ex.: 90% kills à noite): `flavorKind: "style"`,
`event`, `filter`, `threshold`.

**Novo Caminho de conduta** (ex.: Mão Vazia — lvl 25 sem equipar arma):
`flavorKind: "conduct"`, `breakEvent`/`breakFilter` (o que quebra), `milestoneLevel`.
> Obs.: "equipar arma" precisará de um evento `equip` no bus (não existe no M1) —
> hoje a conduta dummy quebra com `skill_use`. Quando o evento existir, basta
> apontar `breakEvent` para ele. Sem mudança na engine.

## Verificação

`npx tsc --noEmit` ✓ e `npm run build` ✓.

Harness temporário (esbuild + node, deletado após uso) provou:
- **(a)** Marca progride **só** com kills válidos da arma que deu o golpe final;
  hint dispara **1x** aos ~50%; unlock no threshold; progresso no **ledger da
  instância**.
- **(b)** As duas mutações da Bola de Fogo: run só **queima-roupa** → *Eclosão
  Ígnea*; run só **distância** → *Meteoro Distante* (**o perfil decide!**).
- **(c)** Caminho de estilo *Chama Viva* progride (hint + unlock).
- **(d)** Conduta *Punho Bruto* **quebra** ao usar skill e **nunca** desbloqueia
  depois; **intacta** desbloqueia no level 3 (com hint aos ~50% do milestone).
- **(e)** Snapshot/protocolo **nunca** contém contadores/threshold; eventos de
  tracking só têm texto/nome/flavor.
- **(f)** Determinismo (duas execuções idênticas → estado idêntico).

## Concerns / Aberto ✏️

- **Marca por slot/raridade e níveis I–III**: a engine para no 1º unlock por
  definição (`unlocked`). Os slots por raridade e os níveis II/III por repetição
  contínua (DESIGN §1) são wave futura — o `markProgress` já é por-definição e
  comporta a extensão.
- **Evento `equip`**: condutas tipo *Mão Vazia* / *Duas Mãos* pedem um evento de
  equipar no bus (inexistente no M1). A conduta dummy usa `skill_use` como
  proxy. Pronto para apontar `breakEvent` ao novo evento quando existir.
- **`block`/`level_up`/`night`**: a engine já os consome; `block` e o ciclo
  dia/noite ainda não são emitidos/implementados no M1.
- **Roteamento por jogador**: o sink recebe `playerId` mas, no M1 single-player,
  os eventos vão ao snapshot compartilhado. Pronto para rotear por conexão no
  online.

---

## Verificação independente (verificador)

**Status: VERIFIED** — `ROUND: 1`. Implementação fiel ao DESIGN-EVOLUCAO.md, sem
discrepâncias bloqueantes. Build e harness comportamental independentes passaram.

### Fidelidade ao design (claim a claim)

1. **Condições como DADOS** ✓ — `TrackingDef` é puramente declarativo (id,
   categoria, evento, `filter` de cláusulas `{field,op,value}` com AND implícito,
   threshold, flavor hint/unlock pt-BR, `effect` descritivo). A engine não tem
   nada hard-coded por conteúdo; adicionar Marca/Mutação/Caminho = adicionar
   entrada no array. Efeito NÃO é aplicado mecanicamente (engine nunca lê
   `effect.payload` para alterar combate) — confere.
2. **Onde vive cada progresso** ✓ — Marca em `ItemLedger.markProgress[defId]` na
   instância (viaja no trade); Mutação por (personagem, skillId) com perfil de uso
   (`totalValidUses` + `profileCounts`, vencedor por `minShare`); Caminho por
   personagem (estilo = acúmulo; conduta = `intact` desde a criação, quebra
   permanente).
3. **Regras universais** ✓ — hint UMA vez a ~50% (`HINT_FRACTION 0.5`,
   `Math.ceil`); unlock one-shot (guard `unlocked`/`resolved`); o protocolo
   (`trackingHint`/`trackingUnlock`) **nunca** carrega progresso/contador/
   threshold/id. Verifiquei o builder de snapshot (`Simulation.ts` 562-640) e
   `EntityState`: o ledger é explicitamente omitido; `weapon` só leva identidade.
4. **Anti-degeneração** ✓ — kills passam pelo MESMO `isValidKill` do ledger
   (`xpFromKill > 0`) e só avançam Marca via `weaponInstanceId` do golpe final
   (magia/DoT com `weaponInstanceId == null` não conta); `skill_use` guarda
   `validHit && targetsHit > 0`.
5. **Protocol/client** ✓ — dois `SnapshotEvent` novos com o shape pedido; o
   client (`Game.ts`) só faz `console.log`. Nenhuma regra de jogo no client.
6. **Definições dummy** ✓ — 1 mark (Roedor de Ferro), 2 mutations de perfis
   OPOSTOS da Bola de Fogo (Eclosão Ígnea queima-roupa / Meteoro Distante à
   distância), 1 path estilo (Chama Viva), 1 path conduta (Punho Bruto). Todas
   marcadas `// DUMMY ✏️` com thresholds baixos.
7. **Sim pura/determinística** ✓ — grep em `src/sim/tracking/` por
   pixi/Math.random/Date.now/window/document/performance: só aparece em
   COMENTÁRIOS. Estado 100% Records (JSON-safe). Determinismo confirmado no
   harness.

### Harness comportamental (esbuild+node temporário, deletado — não commitado)

Instanciei a `TrackingEngine` direto com registry/deps fakes e dirigi o bus com
eventos sintéticos. **24/24 checks PASS:**

- **(a) Mark:** 10 kills bestiais com a espada → hint EXATAMENTE no 5º kill (1x),
  unlock no 10º; `count` para em 10; progresso vive no `ledger.markProgress` da
  instância. Anti-farm: player lvl 50 vs rato T1 → `isValidKill` falso → 20 kills
  sem qualquer progresso (ledger fica sem a chave). Kill por magia
  (`weaponInstanceId=null`) → nenhum unlock de mark.
- **(b) Mutação por perfil:** run A (10× queima-roupa) → **Eclosão Ígnea**; run B
  (10× distância) → **Meteoro Distante** (o perfil decide!); run D 60/40 → maioria
  (Eclosão); run E mid-range (não casa nenhum perfil) → não muta e segue
  acumulando.
- **(c) Conduta:** usar 1 skill antes do lvl 3 → quebrada PARA SEMPRE (não
  desbloqueia nem voltando a não usar); intacta até lvl 3 → unlock, com hint aos
  ~50% (lvl 2 = ceil(3×0.5)).
- **(e) Determinismo:** 2 runs da mesma sequência → `JSON.stringify` idêntico.
- **(f) Idempotência:** 30 kills / 25 casts / 4 level-ups pós-unlock → cada unlock
  dispara EXATAMENTE 1x; hint não re-dispara (estado `hinted/unlocked/resolved`
  persiste e guarda — portanto re-load de estado NÃO re-emite hint).

### Edge cases avaliados

- **Empate exato 50/50 entre dois perfis** (ambos com share 0.5 = `minShare`):
  `pickMutationWinner` usa `share > bestShare` ESTRITO, então o empate resolve
  para o PRIMEIRO def na ordem do array (determinístico, mas dependente de ordem).
  Comportamento sensato e determinístico; vale documentar nas definições reais que
  perfis de mutação devem ter limiares que evitem empate exato, ou aceitar o
  desempate por ordem. **Não bloqueante** (dummy; thresholds reais ~10k tornam
  empate exato improvável).
- **Avaliador de filtros:** ops `== != < <= > >= in exists` corretos; campos
  ausentes falham (exceto `exists:false`); comparações numéricas checam tipo;
  campos aninhados (`victim.family`) projetados achatados pelos adaptadores. OK.
- **Conduta monitorada desde a criação:** `intact:true` default no
  `conductOf`/criação sob demanda; quebra antes de qualquer level-up já marca
  `intact:false`. OK.

### Build

- `npx tsc --noEmit` ✓
- `npm run build` ✓ (vite build ok)
- Mudanças são **puramente aditivas** (sem deleções em ledger/Simulation/events;
  a única "remoção" no protocol é o `;`→`|` da união). A engine é consumidora
  read-only do bus → Waves 1-4 (combate/XP/skills/ledger) não regridem.

### Discrepâncias

Nenhuma bloqueante. Observações menores (não-fix): (1) desempate de mutação por
ordem de array em empate exato — documentar nas defs reais; (2) `block`/
`level_up`/`night` já consumidos pela engine mas ainda não emitidos no M1
(esperado, declarado no report).
