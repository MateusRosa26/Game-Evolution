# Executores de skill T2–T5 (groundTarget · selfRadius · chain · lifedrain)

Data: 2026-06-11 · Branch: `feat/skills-engine`

Preenche os 4 cases STUB que a fundação (`2026-06-11-skills-foundation.md`)
deixou prontos no `executor.ts`, reusando toda a infra dela (cast-time, `aim`,
`applyDamage/applyHeal/computeDamage/applySkillStatus`, eventos `cast`,
`chebyshev`, `isRooted`). Sem calibrar números — placeholders marcados
`✏️ Balancista` em `numbers.ts`.

## Primitivos implementados (`src/sim/skills/executor.ts`)

- **T2 `groundTarget`** (`execGroundTarget`): skillshot de área que resolve no
  tile FIXO `aim` mirado no início (true skillshot — NÃO rastreia). Todos os
  monstros vivos dentro de `areaRadius` (Chebyshev) do `aim` levam
  `computeDamage` + `applySkillStatus`. Emite `cast` com `to: aim`. O `aim`
  vem do `casting.aim` da fundação, agora threaded por `executeSkill(…, aim?)` ←
  `resolveCast`.
- **T3 `selfRadius`** (`execSelfRadius`): burst instantâneo ao redor do caster.
  Ofensiva (physical/magic) → todos os monstros vivos no raio. Heal → caster +
  aliados vivos não-monstro no raio (solo = só o caster). Skill com tag `arma`
  passa o `weaponSource` (alimenta o ledger, como o melee). Emite `cast`
  centrado no caster.
- **T4 `chain`** (`execChain`): atinge o primário e salta para o monstro vivo
  não-atingido MAIS PRÓXIMO dentro de `chainRange` do último, até `chainMax`
  alvos; dano ×`chainFalloff` por salto. Desempate determinístico = distância
  menor, depois menor `id`. Emite `cast` origem→último alvo.
- **T5 `lifedrainPct`** (`applyLifedrain` + `applyDamage` agora retorna o dano
  pós-mitigação): após uma skill com `lifedrainPct` causar dano, cura o caster
  por `floor(totalDealt * lifedrainPct)` via `applyHeal` (clampa em maxHp). Vale
  para QUALQUER targeting (somado pelo helper `hitTarget` em todos os execs).

### Mudança em `combat.ts`
`applyDamage` agora **retorna o dano efetivamente aplicado** (pós-mitigação) em
vez de `boolean`. Único caller que usava o bool era o DoT em `status.ts`, agora
deriva fatal de `target.dead`. É o que o lifedrain precisa (soma o dano real).

### Tipos novos (`src/shared/types.ts`)
`DamageType` += `earth` (Garras), `lightning` (Tempestade/Fagulhas), `death`
(Dreno Vital). Os dois `Record<DamageType,…>` exaustivos do client
(`EntityRenderer.ts`: cor + partícula de impacto) ganharam as 3 entradas — edição
MÍNIMA e obrigatória p/ o `npm run build` passar (mesmo precedente da fundação;
nenhuma regra de jogo no client). `SkillTag` += `terra/root/raio/chip/morte`.

## Skills registradas (placeholders ✏️ Balancista)

| id | nome | classe | targeting | dano | nota |
|---|---|---|---|---|---|
| `earthen_grasp` | Garras da Terra | mage | groundTarget | earth | cast 800ms, raio 1, root 1500ms |
| `storm` | Tempestade | mage | groundTarget | lightning | cast 1000ms, raio 1, sem status (nuke AoE) |
| `whirlwind` | Redemoinho | knight | selfRadius | physical | raio 1, escala a ARMA (tag arma → ledger) |
| `sacred_aura` | Aura Sagrada | priest | selfRadius (heal) | — | raio 2, cura caster+aliados; mana > cura individual |
| `sparks` | Fagulhas | mage | chain | lightning | chainMax 3 / range 2 / falloff 0.6 — chip FRACO |
| `life_drain` | Dreno Vital | mage | projectileTarget | death | lifedrainPct 0.5 |

> **Fagulhas é chip de propósito**: power baixo + falloff agressivo. NÃO deve
> deletar um pack — o teto da cadeia é sublinear (Balancista calibra).

## Verificação (harness throwaway /tmp, já removido)

Cada primitivo testado contra monstros montados à mão (executor direto), reusando
`EventBus`/`createProgression`/`SKILLS` reais. `npx tsc --noEmit` limpo e
`npm run build` exit 0.

```
[T2] groundTarget — Garras da Terra (root) + área no aim FIXO
  PASS Garras conectou (área não vazia)
  PASS ambos dentro do raio levaram dano
  PASS alvo FORA do raio intacto
  PASS alvos pegos estão ROOTED (não andam)
  PASS alvo fora NÃO está rooted
  PASS evento cast aponta para o aim fixo
[T2] groundTarget resolve só no fim do cast (cast-time, via begin/resolve)
  PASS Garras tem castTimeMs > 0 (resolve no fim)
  PASS Storm tem castTimeMs > 0 (resolve no fim)
[T3] selfRadius — Redemoinho (físico) bate todos os adjacentes
  PASS Redemoinho pegou os 2 adjacentes
  PASS ambos adjacentes levaram dano
  PASS alvo fora do raio intacto
  PASS dano de Redemoinho carrega weaponInstanceId (ledger da arma)
[T3] selfRadius — Aura Sagrada cura o caster (solo)
  PASS Aura inclui o caster
  PASS caster curado (40 -> 61)
  PASS inimigo no raio NÃO é curado (heal só aliados)
[T4] chain — Fagulhas: primário + saltos com decaimento
  PASS Fagulhas conectou
  PASS cadeia parou em chainMax=3 (atingiu 3)
  PASS alvo fora do alcance de salto intacto
  PASS dano decai por salto (8 > 4 > 2)
  PASS último salto ainda causa algum dano (chip)
[T4] chain — determinístico entre 2 runs mesmo seed
  PASS cadeia idêntica entre runs ([1001,1002,1003])
[T5] lifedrainPct — Dreno Vital cura o caster ~50% do dano
  PASS Dreno conectou
  PASS causou dano (15)
  PASS curou floor(15*0.5)=7 (got 7)
[T5] lifedrain respeita o teto de maxHp
  PASS cura clampada a maxHp (1000 <= 1000)

RESULT: 25 passed, 0 failed
```

### Notas de integração (cast-time + root, motor da fundação)
- O **resolve só no fim do cast** e o **cancelar ao mover/tomar dano** já foram
  provados na fundação (`tickCasts` em `Simulation.ts` roda no passo 3.5, após
  movimento/dano). Garras/Storm carregam `castTimeMs > 0` (verificado no harness)
  → entram nesse motor sem código novo.
- **Rooted não anda**: o harness prova que Garras aplica `root` (`isRooted`
  true); o gate de movimento é a porta `if (isRooted(e)) continue;`
  (`Simulation.ts` L946, fundação), então o passo fica retido enquanto o root
  durar.

## Concerns
- Números 100% placeholder (`✏️ Balancista`) — Fagulhas precisa do teto
  sublinear; Aura Sagrada/Redemoinho re-checar na bateria de kit completo (AoE).
- Política de reembolso de mana em cast cancelado segue NÃO-reembolsa (decisão
  herdada da fundação, Balancista).
- `chain` emite um único `cast` origem→último alvo (caminho simples/serializável);
  se o client futuro quiser desenhar cada segmento do raio, dá pra expandir o
  payload depois (não muda a sim).
