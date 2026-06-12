# Fundação de primitivos de skill (substrate para executores T2+)

Data: 2026-06-11 · Branch: `feat/skills-engine-foundation`

Trabalho de FUNDAÇÃO: prepara o terreno (dados + infra de tempo + protocolo +
superfície de tipos) para os executores de skill que tasks paralelas
posteriores vão construir. Sem mudar nenhum NÚMERO/comportamento existente.

## O que mudou

### 1. Params de status declarativos (refactor)
- `skills/types.ts`: `SkillStatusApply` virou **union discriminada** que carrega
  os próprios params: `burn | bleed | poison | slow | root`. Antes o executor
  lia `BOLA_DE_FOGO.burn` / `LANCA_DE_GELO.slow` hardcoded.
- `skills/executor.ts`: `applySkillStatus` agora é **genérico** — `switch (kind)`
  chamando o helper certo com os params vindos do dado. Removidos os imports
  `BOLA_DE_FOGO`/`LANCA_DE_GELO` (não são mais lidos lá).
- `skills/definitions.ts`: Bola de Fogo e Lança de Gelo passaram a carregar os
  params no `applyStatus` (puxados de `numbers.ts` — **mesmos valores**:
  burn dmg=3/dur=3000/int=500/fire, slow ×1.5/3000ms).
- `skills/status.ts`: novo status `root` (`applyRoot` + `isRooted`) seguindo o
  padrão de slow/dot. `bleed`/`poison` reusam o mecanismo de DoT (bleed =
  damageType físico; poison = tipo próprio). `StatusKind` estendido.

### 2. Infra de cast-time
- `types.ts`: `SkillDef.castTimeMs?` (ms; ausente/0 = instantâneo como hoje).
- `entity.ts`: `SimEntity.casting?` = `{ skillId, startTick, endTick, targetId, aim? }`.
- `skills/index.ts`: `beginOrCastSkill` (decide instantâneo vs. armar `casting`) e
  `resolveCast` (resolve a conjuração no `endTick`). **Mana cobrada no INÍCIO**
  do cast; cooldown armado no início também.
- `Simulation.ts`: `resolveSkillCasts` agora chama `beginOrCastSkill`; novo
  `tickCasts` resolve conjurações vencidas (roda em **3.5**, após movimento/dano
  do tick — assim cancelar no tick do fim ainda funciona). `cancelCast` limpa o
  estado. **Cancelamento**: mover (hook em `tryStep`) OU tomar dano (hook
  `onDamaged` em `CombatCtx`, disparado por `applyDamage`). Morte também limpa.
- Tempo: tudo via `msToTicks` (zero math de tick hardcoded).
- ✏️ **REEMBOLSO**: cast cancelado NÃO reembolsa mana por ora (decisão do
  Balancista). TODO marcado em `index.ts` e `Simulation.cancelCast`.

### 3. Protocolo + snapshot
- `protocol.ts`: `useSkill` ganhou `aim?: Vec2` (alvo de chão; forma por
  targetId segue funcionando). `EntityState.casting?` = `{ skillId, pct }`
  (pct 0..1, computado de start/endTick). `StatusEffectState.kind` estendido
  com `bleed`/`root`.
- `Simulation.emitSnapshot`: popula `state.casting` (info pública, como o
  telegraph de mob — o client desenha a barra de cast depois).

### 4. Superfície de tipos para os executores que vêm depois
- `TargetingKind` += `"groundTarget" | "selfRadius" | "chain"`.
- `SkillDef` += `areaRadius?`, `chainMax?`, `chainRange?`, `chainFalloff?`,
  `lifedrainPct?`.

### 5. Stubs de executor
- `executor.ts` `executeSkill`: cases `groundTarget`/`selfRadius`/`chain`
  retornam `miss()` com TODO(T2/T3/T4). Mantém a exaustividade do tsc feliz.

## Arquivo de client tocado (forçado pela mudança de tipo)
`src/client/render/EntityRenderer.ts` tinha um `Record<StatusEffectState["kind"],
number>` (cores de status) que ficou não-exaustivo ao adicionar `bleed`/`root`.
Adicionei as duas cores — edição MÍNIMA e obrigatória para o `npm run build`
passar (a task pedia build verde). Nenhuma regra de jogo tocada.

## Como os executores futuros plugam
- **T2 groundTarget (Storm, Garras da Terra)**: preencher `execGroundTarget` no
  switch; ler `def.areaRadius` e o `casting.aim` (Vec2). Garras da Terra aplica
  `root` (status já existe). Storm provavelmente usa `castTimeMs` (infra pronta).
- **T3 selfRadius**: `def.areaRadius` ao redor do caster.
- **T4 chain**: `def.chainMax/chainRange/chainFalloff`.
- **morte = lifedrain**: campo `def.lifedrainPct` já existe; a task de elemento
  aplica a cura no caster a partir do dano causado.

## Saída do harness (throwaway /tmp, já removido)
```
[A] cast-time resolves at endTick (not before)
  PASS mana charged at START (34 -> 29)
  PASS casting is set after begin
  PASS monster undamaged before endTick
  PASS still casting before endTick
  PASS monster DAMAGED at/after endTick (resolved)
  PASS casting cleared after resolution
[B] moving mid-cast cancels
  PASS casting set
  PASS casting CANCELLED by movement (the step that moved cleared it)
[C] taking damage mid-cast cancels
  PASS casting set
  PASS casting CANCELLED after taking damage
[D] regression: Bola de Fogo applies burn (instant, data-carried)
  PASS monster has burn status after Bola de Fogo
  PASS Bola de Fogo def carries burn params
  PASS burn params identical (dmg=3 dur=3000 int=500)

RESULT: 13 passed, 0 failed
```
`npx tsc --noEmit` limpo; `npm run build` exit 0.

## Concerns / TODO
- Política de reembolso de mana ao cancelar = Balancista (default: não reembolsa).
- Sem fila de cast: pedir outra skill enquanto conjura é ignorado (M1 ok).
- `root` bloqueia o passo via porta em `Simulation` (step 3); não mexe no stepMs
  (≠ slow), então slow+root coexistem corretamente.
