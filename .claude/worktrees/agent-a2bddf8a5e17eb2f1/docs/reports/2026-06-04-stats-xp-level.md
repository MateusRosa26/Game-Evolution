# Report: Stats + XP/Level — Camada Sólida (SIM only)

**Branch:** `feature/stats-xp-level`
**Data:** 2026-06-04
**Complexidade:** high

## O que foi feito

Implementada a estrutura sólida de progressão na sim (DESIGN-EVOLUCAO.md §"Camada
Sólida"). **SIM only** — sem HUD/UI (outra wave). Todos os números derivados vivem
num único arquivo (`formulas.ts`), todos marcados `// ✏️ placeholder — calibrar no M2`.

**5 atributos + classes** (`src/shared/types.ts`)
- `Attributes` (strength, dexterity, intelligence, vitality, spirit) + `AttributeKey` + `ATTRIBUTE_KEYS`.
- `PlayerClass = knight | mage | rogue | priest`.

**Fórmulas — funções puras** (`src/sim/formulas.ts`, ÚNICO lugar de números derivados)
- Recursos: `maxHp(attrs, cls, level)` (Vitalidade + crescimento de classe), `maxMana(attrs, cls, level)` (Inteligência + classe).
- Dano: `physicalDamage(attrs, weaponBase, usesDexterity?)` (Força, ou Destreza p/ adagas), `magicDamage(attrs, spellBase)` (Inteligência), `healPower(attrs, healBase)` (Espírito).
- Combate: `attackCooldownMs(attrs, weaponBaseCooldown?)` (Destreza reduz, com piso), `dodgeChance(attrs)` (Destreza, com teto).
- Regen **por tick**: `hpRegenPerTick(attrs)` (Vitalidade), `manaRegenPerTick(attrs)` (Espírito).
- Curva de XP (polinomial estilo Tibia): `xpForLevel(level)`, `xpToNextLevel(level)`, `levelForXp(totalXp)`.
- XP por kill + anti-farm: `xpFromKill(baseXp, playerLevel, creatureLevel)`, `isValidKill(...)`.
- DADOS: `CLASS_GROWTH` (HP/Mana por nível por classe), `CLASS_BASE_ATTRIBUTES`, `STAT_POINTS_PER_LEVEL`.

**Progressão — orquestração** (`src/sim/progression.ts`)
- `Progression` (cls, level, xp, attributes, freeStatPoints, acumuladores de regen).
- `createProgression`, `grantKillXp` (aplica anti-farm, processa N level ups, emite `level_up`), `allocateStatPoint`, `regenTick`, `syncMaxResources`, `creatureLevelForTier` (tier→nível placeholder p/ anti-farm).

**XP por kill** (`src/sim/bestiary.ts` + `Simulation.ts`)
- Campo `xp` no `CreatureTemplate` (Rato Lanhoso: `xp: 20` ✏️).
- `Simulation` se inscreve no evento `kill` do bus → `onKill` concede XP ao jogador atacante a partir do template da vítima, com redução anti-farm por diferença de nível.

**Level up**
- Concede `STAT_POINTS_PER_LEVEL` (3 ✏️) pontos livres por nível + crescimento automático por classe (embutido em `maxHp`/`maxMana` via `CLASS_GROWTH`, função do nível).
- Emite o evento `level_up` no bus (um por nível subido, mesmo pulando vários).
- **Decisão documentada:** HP/Mana atuais **enchem** ao novo máximo no level up.

**Retrofit do combate da Wave 1**
- `maxHp`, dano físico do auto-attack (`attackDamage`) e cooldown do jogador agora DERIVAM de `formulas.ts` (não mais de constantes em `balance.ts`). Monstros continuam com números do bestiário.
- `balance.ts`: removidos `PLAYER_MAX_HP/MP`, `PLAYER_ATTACK_DAMAGE`, `PLAYER_ATTACK_COOLDOWN_MS`; adicionados `DEFAULT_PLAYER_CLASS` e `STARTER_WEAPON_DAMAGE` (base da arma inicial).

**Comando + snapshot** (`src/shared/protocol.ts`)
- Comando `allocateStatPoint { attr }` (a sim valida pontos disponíveis).
- `PlayerProgressState` (cls, level, xp, xpForNextLevel, attributes, freeStatPoints) anexado como `EntityState.progress` **só na entidade do jogador**. HP/Mana já existiam em `EntityState`.

**Mana**
- Campo já existente (`mp`/`maxMp`); agora `maxMp` deriva da fórmula e regenera por tick. Sem consumo (skills na próxima wave).

**Respec:** não implementado (decisão de design pendente). Nada irreversível foi derivado — atributos vivem em `Progression` e podem ser rebuildados no futuro.

## Arquivos alterados
- `src/sim/formulas.ts` (novo)
- `src/sim/progression.ts` (novo)
- `src/sim/Simulation.ts`
- `src/sim/balance.ts`
- `src/sim/bestiary.ts`
- `src/shared/types.ts`
- `src/shared/protocol.ts`
- `docs/reports/2026-06-04-stats-xp-level.md` (novo)

Client: NADA (os campos novos do snapshot são opcionais — `EntityState.progress?`; o client existente ignora). `Hud` segue lendo hp/maxHp/mp/maxMp.

## Como testar no jogo
1. `npm run dev` → http://localhost:5173.
2. Mate Ratos Lanhosos (auto-attack como na Wave 1). Cada kill dá 20 XP.
3. A progressão chega no snapshot em `player.progress` (level/xp/xpForNextLevel/attributes/freeStatPoints) — sem HUD ainda, inspecione via DevTools ou aguarde a wave de HUD.
4. ~5 ratos sobem do nível 1 → 2 (curva: 100 XP p/ lvl 2). No level up: +3 pontos livres, HP/Mana enchem ao novo máximo, evento `level_up` no bus.
5. Comando `allocateStatPoint` (ex: via transport) gasta 1 ponto e reflete em maxHp/maxMp/dano.

Verificado por harness esbuild+node (apagado): 40 kills de rato (800 XP) → nível 5, 4 `level_up` emitidos, 12 pontos livres, maxHp 114→174 (preenchido). Allocate aplica e bloqueia sem pontos. Anti-farm: lvl100 vs criatura lvl1 = 0 XP (inválido); lvl3 vs lvl1 = 20 XP (válido). End-to-end na `Simulation` real: snapshot carrega `progress`, kill via bus concede XP, allocate pós-levelup sobe vitalidade e maxHp.

## Contrato para waves futuras

**Assinaturas de `formulas.ts`** (todas puras, determinísticas):
```ts
maxHp(attrs, cls, level): number
maxMana(attrs, cls, level): number
physicalDamage(attrs, weaponBase, usesDexterity=false): number
magicDamage(attrs, spellBase): number          // skills chamam isto
healPower(attrs, healBase): number             // skills de cura chamam isto
attackCooldownMs(attrs, weaponBaseCooldown?): number
dodgeChance(attrs): number                     // 0..1, rolar contra RNG seedado no consumidor
hpRegenPerTick(attrs): number                  // por TICK (20/s)
manaRegenPerTick(attrs): number                // por TICK
xpForLevel(level): number                      // XP TOTAL p/ atingir o nível
xpToNextLevel(level): number
levelForXp(totalXp): number
xpFromKill(baseXp, playerLevel, creatureLevel): number  // já com anti-farm
isValidKill(baseXp, playerLevel, creatureLevel): boolean
```
Dados exportados: `CLASS_GROWTH`, `CLASS_BASE_ATTRIBUTES`, `STAT_POINTS_PER_LEVEL`.

**Payload do `level_up`** (já no bus, agora EMITIDO):
```ts
{ entity: CombatActorRef, fromLevel: number, toLevel: number, context: CombatContext }
```
Um evento por nível ganho (pular vários níveis = vários eventos sequenciais).

**Regra de kill válido (anti-farm):** um kill é válido para progressão/tracking
(pré-requisito das Marcas futuras) se `isValidKill(template.xp, playerLevel, creatureLevel)`
— i.e. `xpFromKill(...) > 0`. Hoje: XP cheia até 5 níveis de diferença (`XP_FALLOFF_START_DIFF`),
depois cai 20%/nível até zerar. `creatureLevel` vem de `creatureLevelForTier(tier)` (placeholder).
A wave de Marcas deve chamar `isValidKill` no listener de `kill` antes de incrementar contadores.

**Snapshot do jogador:** `EntityState.progress?: PlayerProgressState` =
`{ cls, level, xp, xpForNextLevel, attributes, freeStatPoints }`. Comando novo:
`{ type: "allocateStatPoint", attr: AttributeKey }`.

## Notas
- **Onde ficam os números derivados:** 100% em `formulas.ts`. `progression.ts` só orquestra; `Simulation.ts`/`bestiary.ts` só fornecem inputs (atributos, base de arma, XP de template). Nenhum número derivado espalhado.
- **Determinismo:** nenhuma fórmula usa RNG. `dodgeChance` retorna probabilidade; quem rolar deve usar o `rng.ts` seedado na sim. Sem `Math.random`/`Date.now`.
- **Crescimento de classe** é função do nível dentro de `maxHp`/`maxMana` (não somado manualmente no level up) — recalcular o derivado já reflete o crescimento; evita drift de estado.
- **Classe default** = `knight` (`DEFAULT_PLAYER_CLASS`) enquanto não há seleção de classe; `addPlayer(name, cls?)` aceita classe.
- **Respec:** intencionalmente não implementado (DESIGN: modelo pendente). Atributos são reconstruíveis a partir da classe + histórico no futuro; nada irreversível.
- **Placeholders calibráveis:** curva de XP (`xpForLevel`), XP do rato (20), pontos/nível (3), crescimento por classe, coeficientes de dano/regen/esquiva, faixa anti-farm — todos `// ✏️ placeholder — calibrar no M2`.
- `npx tsc --noEmit` e `npm run build` passam.

## Verificação independente (verificador)

Verificação feita por agente independente (sem contexto do implementador). Diff
lido linha a linha contra a tarefa; harness esbuild+node dirigindo a `Simulation`
real e as funções de `progression`/`formulas` (arquivos temporários apagados, nada
commitado além desta seção).

**Build/tipos:** `npx tsc --noEmit` → 0 erros. `npm run build` (tsc + vite) → OK
(743 módulos, sem erros).

**Conformidade arquitetural (regra de ouro):**
- `formulas.ts` importa SÓ tipos (`PlayerClass`, `Attributes`) — funções puras, sem estado.
- Grep em `src/sim/` (formulas, progression, Simulation, balance, bestiary):
  zero `Math.random` / `Date.now` / `performance` / `window` / `document` /
  `requestAnimationFrame` / imports de pixi ou `../client`. As únicas ocorrências de
  "browser" são comentários. `dodgeChance` retorna probabilidade pura (não rola RNG).
- `src/shared/` (protocol/types) importa só tipos; `progress?` é opcional e serializável.
- Zero mudanças em `src/client/` — snapshot novo é retrocompatível.
- Placeholders marcados `// ✏️ placeholder — calibrar no M2` em todos os números derivados.

**Harness comportamental — todos os asserts PASS:**
- Curva de XP: `xpForLevel` 1=0, 2=100, monotônica crescente até lvl 30; `levelForXp`
  consistente (0→1, 99→1, 100→2, `xpForLevel(5)`→5). Totais: 0/100/200/400/800/1500.
- Kills concedem XP e disparam `level_up`: 40 kills de rato (800 XP) → nível 5,
  4 eventos `level_up` com `from/to` sequenciais (1→2 … 4→5), HP enche ao máximo derivado.
- Pontos livres acumulam `STAT_POINTS_PER_LEVEL` (3) por nível.
- `allocateStatPoint`: incrementa o atributo, decrementa pontos, sobe `maxHp` (Vitalidade);
  rejeitado (retorna false) com 0 pontos.
- Anti-farm: lvl100 vs criatura lvl1 = 0 XP e `isValidKill=false`; lvl3 vs lvl1 = 20 XP
  e `isValidKill=true`. `grantKillXp` com anti-farm não altera o XP acumulado.
  `creatureLevelForTier(T1)=1`.
- Regen por tick: mana e HP sobem ao longo de 200 ticks; não regenera entidade morta;
  não ultrapassa o máximo. `hpRegenPerTick`/`manaRegenPerTick` > 0.
- **Determinismo:** duas execuções idênticas (mesmos inputs) → mesma trajetória
  (xp/level/pontos/maxHp/sequência de `level_up`).

**End-to-end na `Simulation` real (combate de verdade, não só o bus):**
- Snapshot do jogador carrega `progress` (level 1, classe knight); `maxHp` derivado =
  `maxHp(attrs,knight,1)` = 114; HP preenchido no spawn.
- Player anda até os ratos e auto-ataca: 55 kills, 111 hits, 1100 XP, nível 5 — pipeline
  completo `applyDamage`→evento `kill`→`onKill`→`grantKillXp` funciona.
- Comando `allocateStatPoint` via `handleCommand` reflete no snapshot (pontos e `maxHp`).
- Morte + respawn: rato derruba o player a 1 HP; respawn usa `e.hp = e.maxHp` com `maxHp`
  derivado (114), sem overflow. **Sem regressão de combate** — confirmado comparando com
  `main` (59 kills lá, 55 aqui; mesma lógica). Monstros seguem usando números do bestiário.

**Discrepâncias / observações:**
- Nenhuma discrepância funcional vs a tarefa. Todos os 8 itens entregues.
- Curva de XP é rasa no início (lvl1→2 e lvl2→3 = 100 cada); é placeholder e monotônica,
  então OK — apenas anotar para calibração no M2 (design pede curva íngreme).
- Relatório do worker confere com o comportamento observado (números batem).

**Resultado:** VERIFIED.
