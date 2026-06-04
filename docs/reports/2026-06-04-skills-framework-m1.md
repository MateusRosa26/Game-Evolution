# Report: Framework de Skills + as 6 skills do kit M1 (SIM only)

**Branch:** `feature/skills-framework-m1`
**Data:** 2026-06-04
**Complexidade:** high

## O que foi feito

Infraestrutura de skills na sim + as 6 skills únicas do kit M1, exatamente como
as fichas de `DESIGN-EVOLUCAO.md` §"Magias e Skills". **SIM only** — zero client
(client é de outra wave). Skills são DADOS; a lógica vive em executores genéricos
por tipo de targeting. Todos os números são `// ✏️ placeholder`, num arquivo só.

### Framework (`src/sim/skills/`)
- **`numbers.ts`** — TODOS os números das 6 skills (custo, cooldown em ticks,
  power, alcance, durações de status) num arquivo só, marcados `// ✏️ placeholder`.
- **`types.ts`** — `SkillDef` declarativa: id, nome, classe, `targeting`
  (`meleeTarget` | `meleePositional` | `projectileTarget` | `lineThrough` |
  `healTarget`), `effect` (physical/magic/heal), `damageType`, tags de elemento,
  manaCost, cooldownTicks, range, power, `applyStatus`.
- **`definitions.ts`** — as 6 skills como entradas de dados + registro `SKILLS`.
- **`kits.ts`** — `STARTER_KITS` por classe (kit inicial das fichas) + `isKnownSkillId`.
- **`status.ts`** — sistema de status effects tick-based: `burn` (DoT fogo),
  `slow` (aumenta stepMs), `poison` (tipado p/ Rogue T2). `tickStatus` aplica
  DoTs e expira; `applyDot`/`applySlow`/`hasStatus`/`projectStatus`/`recomputeStepMs`.
- **`executor.ts`** — executores genéricos por targeting (resolução INSTANTÂNEA
  estilo runa de Tibia), `computeDamage` (multiplicadores das fichas), montagem
  do perfil de `skill_use`, snapshot-events de `cast`/`heal`.
- **`index.ts`** — `castSkill` (orquestra: conhecida → cooldown → mana → executa
  → cobra/arma cooldown/emite `skill_use`) + barrel.

### As 6 skills (fichas implementadas fielmente)
| Skill | Classe | Targeting | Efeito da ficha |
|---|---|---|---|
| Golpe Forte | Knight | meleeTarget | dano físico ~1.8× da arma equipada |
| Bola de Fogo | Mage | projectileTarget | dano fogo + queimadura (DoT) que tica |
| Lança de Gelo | Mage | lineThrough | perfura todos na linha + slow por alvo |
| Apunhalar | Rogue | meleePositional | ~2× pelas costas (usa o facing do alvo) |
| Luz Sagrada | Priest | projectileTarget | dano holy, ~2.5× vs undead/demon (família) |
| Curar Ferimentos | Priest | healTarget | restaura HP (self/aliado; sem alvo = self) |

### Pipeline e eventos
- Dano de skill flui SEMPRE por `applyDamage` (`combat.ts`) → `damage`/`kill`
  saem com `skillId`. DoT idem (inclusive kills por queimadura). Cura por novo
  `applyHeal` (clampa a maxHp, emite snapshot-event `heal`).
- `formulas.ts`: físico→`physicalDamage`, mágico→`magicDamage`, cura→`healPower`.
  Golpe Forte e Apunhalar usam a arma equipada (`weaponBase`) como base.
- Evento **`skill_use`** enriquecido (`events.ts`) e emitido a partir desta wave.

### Custo de mana + cooldown
- Validados na sim em `castSkill`. Cooldown POR SKILL POR ENTIDADE em ticks
  (`SimEntity.skillCooldowns: { skillId → readyAtTick }`). Mana já existia (Wave 2).

### Skills conhecidas + comando DEV
- Jogador nasce com o kit da classe (`STARTER_KITS`). Player default = knight →
  só Golpe Forte. **Decisão documentada:** para DEV/teste adicionei o comando de
  protocolo **`debugGrantSkill { skillId }`** (concede qualquer skill) em vez de
  dar as 6 de cara — mantém o "conhecimento legítimo" limpo. O harness usou-o
  para exercitar as 6.

## Decisões documentadas
- **Spam no ar:** cast sem alvo válido NÃO gasta mana/cooldown e NÃO emite
  `skill_use` (a sim devolve `no_hit`). Não emitimos evento com `validHit:false`
  — assim o ledger de progressão fica limpo (só uso que conectou conta p/ Mutação,
  como a ficha pede). O campo `validHit` existe no payload por contrato (sempre
  true por ora); o client recebe o motivo da rejeição por outra via futura.
- **Casts bufferizados:** `useSkill` é enfileirado e resolvido NO PRÓXIMO tick
  (padrão de servidor: commands aplicados no tick) → eventos saem no snapshot do
  tick certo, ordem determinística.
- **stepMs vs slow:** `SimEntity.naturalStepMs` é a fonte de verdade; `baseStepMs`
  passa a ser o EFETIVO (natural × slow). `recomputeStepMs` recalcula ao aplicar/
  expirar slow. (Retrocompatível: sem slow, `baseStepMs === naturalStepMs`.)
- **Stacking de status:** não empilha — refresca duração e fica com o maior
  dano/multiplicador (reaplicar não pune).
- **Perfil capturado ANTES do cast:** `targetWasBurning/Slowed/Poisoned` e
  `targetHpPct` refletem o estado do alvo NO MOMENTO do cast (antes do golpe/
  status) — é o que as fichas pedem (ex.: "alvo já queimando", "abertura HP cheio").

## Self-verify
- `npx tsc --noEmit` ✅ · `npm run build` (tsc + vite) ✅
- Harness temporário (esbuild+node, depois apagado) — TODOS os checks passaram:
  Golpe Forte (dano+mana+cooldown bloqueia), Bola de Fogo (impacto + queimadura
  que tica via eventos `damage` fire com skillId, status visível no snapshot),
  Lança de Gelo (2 alvos em linha + slow eleva stepMs, `targetsHit=2`), Apunhalar
  (costas 40 > frente 20, `hitFromBehind`), Luz Sagrada (undead 42 > bestial 17,
  `targetFamily=undead`), Curar (HP↑, mana, evento `heal`, `targetSelf`), mana 0
  bloqueia, spam no ar não emite, cooldownMs decai no snapshot.

---

## Contrato para waves futuras

### Payload do `skill_use` (`src/sim/events.ts` — `SkillUseEvent`)
Emitido só com `validHit: true`. Campos (cobrem o que as fichas/Mutações pedem):
```
caster: CombatActorRef          // quem castou
skillId: string
validHit: boolean               // sempre true por ora
targets: CombatActorRef[]       // alvos atingidos
targetsHit: number              // nº de alvos (Bola/Lança rastreiam)
castDistance: number            // Chebyshev caster→alvo (à distância vs queima-roupa)
casterHpPct: number             // 0..1 (Golpe Forte HP<25%, Fervor HP cheio)
casterInCombat: boolean         // tinha alvo de auto-attack (Curar/Socorros)
targetSelf: boolean             // self vs aliado (Curar Ferimentos)
targetHpPct: number | null      // HP% do alvo NO MOMENTO do cast (Apunhalar abertura/execução)
targetFamily: CreatureFamily|null // Luz Sagrada (profano?)
targetWasBurning / WasSlowed / WasPoisoned: boolean  // "alvo já X" (Fogo Voraz, Estilhaço, Lâmina Suja)
hitFromBehind: boolean          // ângulo (Apunhalar)
context: { tick, night }
```
Mapeamento direto p/ as Mutações das fichas: HP% caster → Golpe Desesperado/
Fervor; castDistance → Meteoro Distante/Eclosão/Nova; targetWasBurning → Fogo
Voraz; targetsHit/linha → Geada Perfurante; hitFromBehind → Hemorragia;
targetHpPct cheio → Golpe Súbito; targetWasPoisoned → Lâmina Suja; targetFamily
undead → Chama Purificadora; targetSelf+HP baixo → Último Suspiro;
casterInCombat → Prece de Guerra. **Nenhuma Mutação implementada (wave futura)**,
mas o perfil já cobre todas.

### Snapshot (`src/shared/protocol.ts`)
- **`EntityState.status: StatusEffectState[]`** — `{ kind: "burn"|"slow"|"poison",
  remainingTicks }` por entidade (ícone/contador no HUD; ×TICK_MS = ms).
- **`EntityState.skills?: KnownSkillState[]`** (só player) — `{ id, cooldownMs
  (restante), manaCost }`. Mana vem em `mp`/`maxMp`.
- **`EntityState.progress`** inalterado.

### Snapshot-events (one-shot, para o client ANIMAR depois)
- **`cast`** — `{ skillId, casterId, from: Vec2, to: Vec2 }`. `from`→`to` é
  origem→destino (alvo; para Lança de Gelo, `to` é a PONTA da linha). A sim já
  resolveu o efeito; o client usa isto p/ animar projétil/golpe/feixe.
- **`heal`** — `{ skillId, casterId, targetId, amount, pos }` → floating text verde.
- `damage`/`death` já existiam (agora carregam `skillId` quando vier de skill/DoT).

### Como o client deve animar casts (futuro)
1. Receber o snapshot-event `cast`, desenhar o projétil/feixe interpolando de
   `from` até `to` no tempo de viagem que o client quiser (a sim NÃO espera —
   dano já aconteceu). Para `lineThrough`, varrer a linha `from`→`to`.
2. `heal` → floating text verde em `pos` com `amount`.
3. Ícones de status: ler `EntityState.status` (`remainingTicks × TICK_MS`).
4. Hotbar/cooldown: ler `EntityState.skills` (`cooldownMs`, `manaCost` vs `mp`).

### Comandos novos (`protocol.ts`)
- **`useSkill { skillId, targetId? }`** — `targetId` omitido usa o alvo
  selecionado do jogador; cura sem alvo = self. Bufferizado, resolve no tick.
- **`debugGrantSkill { skillId }`** — DEV/teste (compra em NPC é M2+). ✏️ gatear/
  remover no M2.

## Arquivos alterados
- `src/sim/skills/numbers.ts` (novo)
- `src/sim/skills/types.ts` (novo)
- `src/sim/skills/definitions.ts` (novo)
- `src/sim/skills/kits.ts` (novo)
- `src/sim/skills/status.ts` (novo)
- `src/sim/skills/executor.ts` (novo)
- `src/sim/skills/index.ts` (novo)
- `src/sim/entity.ts` (campos `naturalStepMs`, `knownSkills`, `skillCooldowns`, `status`)
- `src/sim/combat.ts` (`CombatCtx.lookup`, `applyHeal`)
- `src/sim/events.ts` (`SkillUseEvent` enriquecido)
- `src/sim/Simulation.ts` (wire: status tick, casts bufferizados, comandos, projeção)
- `src/shared/protocol.ts` (comandos, `StatusEffectState`, `KnownSkillState`, events `cast`/`heal`)
- `docs/reports/2026-06-04-skills-framework-m1.md` (novo)

---

## Verificação independente (verificador)

**Status: VERIFIED** · ROUND: 1

Revisão feita do zero (sem confiar no relatório): diff completo `main...HEAD`,
leitura arquivo a arquivo, cross-check ficha por ficha (`DESIGN-EVOLUCAO.md`
§"Magias e Skills") e harness comportamental temporário (esbuild+node, apagado).

### Build / type-check
- `npx tsc --noEmit` ✅ (exit 0)
- `npm run build` (tsc + vite) ✅ (750 módulos, build ok)

### Arquitetura / regra de ouro
- **Client intocado** ✅ — `git diff main...HEAD --name-only` não lista nenhum
  `src/client/**`. Só `src/sim/**`, `src/shared/protocol.ts` e o report.
- **Sim pura** ✅ — grep por `Math.random`/`Date.now`/`performance.now`/`pixi`/
  `window.`/`document.` em `src/sim` e `src/shared`: zero ocorrências (só o
  comentário em `rng.ts`). Skills usam apenas `Math.sign/abs/floor/max/round`
  (determinístico). Bus síncrono, casts bufferizados resolvidos no tick.

### Harness comportamental — 34/34 checks PASS
- **Golpe Forte**: dano ≈ `floor(autoAttack × 1.8)` (24 vs auto 14) ✅; gasta mana
  ✅; recast imediato bloqueado por cooldown (sem mana/dano/evento) ✅; `damage`
  carrega `skillId` ✅; `skill_use` com payload completo (16 campos) ✅.
- **Bola de Fogo**: aplica `burn`; DoT tica ao longo da duração (4 eventos `fire`
  com `skillId`) e a **morte por DoT emite `kill` com `skillId=bola_de_fogo`** ✅;
  burn expira sozinho quando o alvo sobrevive ✅.
- **Lança de Gelo**: atinge 2 alvos em linha (`targetsHit=2`) ✅; aplica `slow`
  nos dois e o `baseStepMs` efetivo sobe (220→330 = ×1.5) ✅.
- **Apunhalar**: pelas costas ≈2× pela frente (46 vs 23), `hitFromBehind`
  true/false corretos pelo facing do alvo ✅.
- **Luz Sagrada**: undead/demon ≈2.5× bestial (47 vs 19) via família ✅.
- **Curar Ferimentos**: sobe HP, clampa em maxHp (overheal preciso), emite
  snapshot-event `heal`, `targetSelf=true` sem alvo ✅.
- **Mana 0 bloqueia** (sem dano/evento) ✅; **spam sem alvo** não gasta mana nem
  emite `skill_use` ✅.
- **Determinismo**: mesma sequência → log de eventos idêntico (damage/kill/
  skill_use) ✅.
- **Regressão Wave 1-2**: auto-attack ainda mata o rato (kill com `weaponId`,
  sem `skillId`) e **XP sobe** (0→20) ✅.

### Fidelidade às fichas (cross-check de "Perfis rastreados")
Confirmado campo a campo — o payload de `skill_use` cobre os perfis das 6 fichas:
- Golpe Forte → `casterHpPct` (HP<25%); golpe final = `kill.skillId` + morte.
- Bola de Fogo → `castDistance`, `targetWasBurning`, `targetsHit`.
- Lança de Gelo → `targetWasSlowed`, `targetsHit`, `castDistance`.
- Apunhalar → `hitFromBehind`, `targetHpPct` (abertura), `targetWasPoisoned`.
- Luz Sagrada → `targetFamily`, `castDistance`, `casterHpPct`.
- Curar Ferimentos → `targetSelf`, `targetHpPct`, `casterInCombat`.

### Observações (não bloqueiam)
- **Riposte (Golpe Forte, "logo após bloqueio ≤1s")**: é o ÚNICO gatilho de
  mutação das 6 fichas SEM campo dedicado no `skill_use`. Justificável: depende
  da mecânica de **bloqueio**, que não existe no M1 (`BlockEvent` tipado mas
  nunca emitido — "ainda NÃO emitido no M1"). Sem blocks acontecendo não há
  estado a rastrear; fica para a wave que introduzir parry/escudo. Todas as
  demais mutações das fichas têm seu gatilho coberto.
- `poison` já tipado em status/protocol mas nenhuma skill M1 o aplica (correto —
  é p/ Rogue T2). `targetWasPoisoned` capturado, então a hook já está pronta.
- `damageType: "holy"` em Curar Ferimentos é inócuo (cura ignora tipo) — tipado
  por completude, sem efeito colateral.

**Conclusão:** implementação fiel às 6 fichas, determinística, sim-pura, sem
tocar no client, com pipeline de dano/cura/DoT correto e cooldown/mana
validados na sim. Aprovado.
