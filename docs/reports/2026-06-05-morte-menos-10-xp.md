# Morte = −10% do XP TOTAL (penalidade de morte do macro do MVP)

**Data:** 2026-06-05
**Branch:** `feature/morte-menos-10pct-xp`

## O que foi feito

Implementada a penalidade de morte do macro do MVP: ao morrer, o jogador perde
**10% do XP TOTAL acumulado** (modelo Tibia, "morte dói"). A penalidade é aplicada
no respawn, ANTES do refill de HP/mana, e **permite level-down**.

## Arquivos alterados

- **`src/sim/balance.ts`** — nova constante `DEATH_XP_PENALTY = 0.1` (com `✏️ calibrar`;
  é um knob visceral, define o quanto a morte machuca a progressão).
- **`src/sim/progression.ts`** — nova função `applyDeathPenalty(prog, entity)`:
  - `lost = Math.floor(prog.xp * DEATH_XP_PENALTY)`; `prog.xp -= lost`;
  - recomputa `prog.level = levelForXp(prog.xp)` (level-down permitido);
  - se houve level-down, chama `syncMaxResources(entity, prog, false)` (o teto de
    HP/mana desce ao do novo nível e o atual é clampado — o respawn enche depois);
  - retorna `{ lostXp, leveledDown }` para telemetria do chamador.
  - Importa `DEATH_XP_PENALTY` de `./balance`.
- **`src/sim/Simulation.ts`** — no ramo `kind === "player"` de `resolveDeaths`
  (antes do `e.hp = e.maxHp` / `e.mp = e.maxMp` do respawn): pega a `Progression`
  do jogador, chama `applyDeathPenalty`, e se `leveledDown` chama
  `recomputePlayerDerived(e, prog)` (dano/cooldown de auto-attack derivam do nível;
  o refill subsequente usa os novos máximos). Adicionado `applyDeathPenalty` ao
  import de `./progression`.

## Decisões de design documentadas

- **Level-down É PERMITIDO** (modelo Tibia). Perder XP pode derrubar o nível; é o
  que faz a morte doer de verdade — perde-se progresso, não só "a barra do nível".
  **Piso natural:** level 1 / xp 0 (pois `xpForLevel(1) = 0` e o `Math.floor`
  garante `lost ≥ 0`, então xp nunca fica negativo).
- **`freeStatPoints` NÃO são revogados.** Pontos de atributo já concedidos por level
  ups (e os já gastos em atributos) ficam após o level-down.
  - *Porquê:* revogar exigiria rastrear quais pontos vieram de quais níveis e
    "desfazer" alocações do jogador — complexo e punitivo demais para o MVP.
  - *Consequência aceita:* um jogador que dá level-down e re-sobe acumula pontos de
    "níveis repetidos".
  - *Alternativa registrada* (se virar exploit): limitar `freeStatPoints` ao teto
    `STAT_POINTS_PER_LEVEL * (level - 1)` após a penalidade.
- **HP/mana atuais não são tocados em `applyDeathPenalty`** — só o TETO (quando há
  level-down). O refill do respawn enche tudo logo em seguida. Em level-down, o
  refill usa o maxHp/maxMp JÁ rebaixado (a `recomputePlayerDerived` roda antes).
- **Client/snapshot:** nada a fazer. `projectProgress` deriva de `prog.xp`/`prog.level`,
  então a barra de XP e o nível na HUD refletem a perda automaticamente.

## Verificação

### `npx tsc --noEmit`
Limpo (exit 0).

### Harness headless (`/tmp/death_xp_harness.ts`, descartável)
Arena 64×64 grass, sem safeZones, instanciando `Simulation` real.

**Teste 1b — integração end-to-end (sim real):** player knight cercado por enxame
de 8 ratos; mata 1 (ganha XP), morre para o enxame, respawna.
- Pré-morte: `xp=20, level=1`.
- Pós-respawn: `xp=18` (= 20 − floor(10%)=2), `level=1`, `hp=114/114` (refill ao
  maxHp). Confirma que a penalidade roda dentro de `resolveDeaths` antes do refill.

**Teste 2 — unidade, level-down de verdade:** knight com `xp = xpForLevel(8)+5`
(`level=8`).
- `xpPre=4205 → lost=420 → xpPos=3785`; `level 8→7` (`leveledDown=true`).
- `maxHp 219→204`, `maxMp=46` (tetos descem ao nível 7); `hp` clampado ao novo teto.

**Teste 3 — unidade, SEM level-down:** xp no meio do nível 6.
- `xpPre=2050 → lost=205 → xpPos=1845`; `level=6` mantido; `leveledDown=false`;
  teto de HP inalterado (`syncMaxResources` não é chamado quando não há level-down).

**Teste 4 — unidade, lvl 1 / 0 XP (piso):**
- `lost=0, xp=0, level=1, leveledDown=false`; nenhum efeito colateral (o `floor`
  garante perda inteira e ≥ 0).

Resultado: **todos os asserts passaram** (exit 0).

## Como testar manualmente no jogo

1. `npm run dev` → abrir http://localhost:5173.
2. Matar alguns ratos perto do spawn para acumular XP (olhar a barra de XP subir).
3. Deixar o jogador morrer para os ratos (parar de atacar / ser cercado).
4. Após o respawn no spawn, conferir que a **barra de XP recuou ~10%** do total e,
   se o XP estava logo acima de um limiar de nível, que o **nível desceu** (o teto
   de HP/mana acompanha; o respawn enche ao novo máximo).

## Verificação independente (verificador)

- **Diff real × report:** bate. `git diff main...HEAD --stat` mostra só os 3
  arquivos de sim alegados (`balance.ts`, `progression.ts`, `Simulation.ts`) +
  este report. Nenhum arquivo extra, nenhum refactor não solicitado, sem scope
  creep. Working tree limpo; `node_modules` é git-ignored (não commitado).
- **tsc --noEmit:** OK (exit 0).
- **Harness próprio** (`/tmp/v.ts`, descartável — independente do worker; testa a
  função pura com números calculados pelo verificador A PARTIR de `xpForLevel`,
  + integração na `Simulation` real). Todos os asserts PASS:
  - T1 piso lvl1/xp0: `lostXp=0`, `xp=0` (não negativo), `level=1`, sem efeito.
  - T2 sem level-down (xp=900 no L5): `lostXp=floor(90)=90`, `level=5` mantido,
    teto de HP inalterado.
  - T3 level-down 5→4 (xp=810 → perde 81 → 729 < 800): `level=4`,
    `maxHp 174→159` (knight L4 = 114+15·3), `maxMp 42→40`, `hp` clampado a 159.
  - T4 xp=1305 no L6 → 1175 → `level=5` (1 nível), `leveledDown=true`.
  - T5 INTEGRAÇÃO `Simulation` real: player L5/810xp, `ent.dead=true`, `tick()`.
    Pós-tick: `xp=729`, `level=4`, `hp=159/159` — **prova que a penalidade roda
    em `resolveDeaths` ANTES do refill e que o refill usa o teto JÁ rebaixado**
    (159, não o 174 de L5). `attackDamage` recomputado (level-down).
  - T6 monstro morto + `tick()`: ramo player não o toca; monstro não tem
    `Progression` → penalidade nunca roda nele.
  - T7 determinismo: duas progressões idênticas → resultado idêntico.
- **Casos de borda checados:** xp=0 (floor ≥ 0, sem negativo); sem level-down
  (teto intacto); level-down recalcula maxHp E maxMp E attackDamage; ordem
  penalidade→refill correta (refill usa máximo novo); morte de monstro não
  afetada; determinismo (sem `Date.now`/`Math.random`/browser/pixi nos arquivos
  alterados — confirmado por grep).
- **Observações:** Implementação correta e enxuta. Confirmei os números do report
  do worker contra a fórmula real (`xpForLevel(8)=4200`, `maxHp` knight). `freeStatPoints`
  preservados em level-down conforme pedido. Nenhuma preocupação. **VERIFIED.**
