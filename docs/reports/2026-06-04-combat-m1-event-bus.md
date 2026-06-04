# Report: Combate M1 + Event Bus

**Branch:** `feature/combat-m1-event-bus`
**Data:** 2026-06-04
**Complexidade:** high

## O que foi feito

**Sim (`src/sim/`)**
- **Event bus** (`events.ts`): `EventBus` determinístico (subscribe síncrono na ordem de inscrição) com os 5 eventos do contrato — `damage`, `kill`, `skill_use`, `block`, `level_up`. Payloads ricos definidos AGORA; `damage` e `kill` já são emitidos no M1; `skill_use`/`block`/`level_up` têm o tipo completo mas ainda não são emitidos (chegam nas waves de skills/level).
- **Combate** (`combat.ts`): `applyDamage()` aplica dano, emite `damage`, e em golpe fatal emite `kill` + marca a entidade como morta. HP/maxHP já existiam nas entidades; agora há dano, morte e respawn.
- **Bestiário como dados** (`bestiary.ts`): `CreatureTemplate` declarativo (espécie, nome, família, tier, comportamento, HP, dano, cooldown, aggro, passo, respawn) + registro `CREATURES`. O Rato Lanhoso é o único template; a IA lê `behavior` — sem código por monstro.
- **IA de monstro** (`monsterAi.ts`): comportamento `chaser` (Perseguidor): idle → detecta jogador no raio de aggro → persegue via A* existente (`pathfinding.ts`, parando 1 tile antes do alvo) → ataca melee adjacente no cooldown. Demais comportamentos declarados mas não implementados.
- **Balance** (`balance.ts`): todos os números placeholder agrupados (dano, cooldowns, HP, alcance melee).
- **Simulation.ts**: integra tudo no `tick()` — ordem determinística: (1) IA dos monstros, (2) auto-attack do jogador estilo Tibia, (3) movimento, (4) resolução de mortes/respawn. Comando `selectTarget`. Jogador morre → respawna no spawn com HP cheio e limpa o aggro dos mobs. Monstro morre → vira respawn pendente (timer em ticks) e é removido.
- **entity.ts**: `SimEntity` extraído para tipo interno compartilhado (combate + IA), com campos de combate/IA/respawn.

**Protocolo (`src/shared/`)**
- `types.ts`: tipo canônico **`CreatureFamily`** (12 famílias, identificadores em inglês), `DamageType`, `MapMonster` (spawn no mapa), `species` em entidades.
- `protocol.ts`: comando `selectTarget` (entityId | null); `EntityState.species`; `Snapshot.targetId` e `Snapshot.events` (one-shot `damage`/`death` para o client).

**Client (`src/client/`)** — só feedback visual, zero regras
- Click em monstro → `selectTarget`; click no chão → limpa alvo + `walkTo`.
- Marcador de alvo vermelho estilo Tibia, reparentado sob o monstro (segue a interpolação).
- Floating damage text (número vermelho subindo e sumindo).
- Sprite procedural do **Rato Lanhoso** (`sprites.ts`, 4 direções × 3 frames, paleta nova em `palette.ts`) + seleção de sprite por espécie no `EntityRenderer`.
- Barra de HP sobre entidades já existia (`drawHpBar`, verde→amarelo→vermelho) — agora também aparece nos ratos.

## Arquivos alterados
- `src/sim/events.ts` (novo)
- `src/sim/combat.ts` (novo)
- `src/sim/bestiary.ts` (novo)
- `src/sim/monsterAi.ts` (novo)
- `src/sim/balance.ts` (novo)
- `src/sim/entity.ts` (novo)
- `src/sim/Simulation.ts`
- `src/sim/maps/testMap.ts`
- `src/shared/types.ts`
- `src/shared/protocol.ts`
- `src/client/Game.ts`
- `src/client/render/EntityRenderer.ts`
- `src/client/assets/sprites.ts`
- `src/client/assets/palette.ts`
- `docs/reports/2026-06-04-combat-m1-event-bus.md` (novo)

## Como testar no jogo
1. `npm run dev` → http://localhost:5173
2. Ande até o leste/sudoeste do spawn (caminho de terra) — há 6 Ratos Lanhosos em pequenos grupos.
3. **Clique num rato**: aparece o marcador de alvo vermelho. O jogador inicia auto-attack ao ficar adjacente (melee, incl. diagonal), batendo a cada ~2s; números de dano sobem sobre o rato e a barra de HP dele cai.
4. O rato persegue e revida (~8 de dano a cada 1,6s) — a HP do jogador no HUD cai. **Mobs são fortes**: enfrentar o grupo todo de uma vez mata o jogador.
5. Mate o rato → ele some. Espere ~10s → ele respawna no ponto original.
6. Deixe os ratos te matarem → você respawna no spawn com HP cheio.

## Eventos emitidos (contrato para waves futuras)
Bus interno em `src/sim/events.ts`. `CombatActorRef = { id, species|null, family|null }`. `CombatContext = { tick, night }` (night placeholder = false no M1).

- **`damage`** (emitido): `{ source, target, amount, damageType, at:Vec2, weaponId|null, skillId|null, context }`.
- **`kill`** (emitido) — carrega TUDO que o sistema de Marcas precisa (DESIGN-EVOLUCAO.md §1):
  `{ attacker, victim, weaponId|null, skillId|null, finalBlow:{amount,damageType}, attackerHpPct (0..1), attackerPos, victimPos, distance (Chebyshev), context }`.
  victim carrega espécie E família. weaponId do jogador = `"fists"` (placeholder).
- **`skill_use`** (tipo definido, NÃO emitido): `{ caster, skillId, targets:CombatActorRef[], context }` — targets vazio = não conta (spam no ar).
- **`block`** (tipo definido, NÃO emitido): `{ blocker, attacker, blocked, damageType, context }`.
- **`level_up`** (tipo definido, NÃO emitido): `{ entity, fromLevel, toLevel, context }`.

Projeção ao client (não é o bus — é o snapshot): `SnapshotEvent` = `{kind:"damage",targetId,amount,pos}` | `{kind:"death",entityId,pos}`.

## Notas
- **Números placeholder** (em `balance.ts` e `bestiary.ts`): jogador HP 100, dano 14, cooldown 2000ms; Rato HP 24, dano 8, cooldown 1600ms, aggro 6 tiles, passo 220ms (mais rápido que o jogador), respawn 200 ticks (~10s).
- **Determinismo**: o combate M1 não tem aleatoriedade (sem crit/variação), então nenhum RNG é consumido — quando houver, deve vir do `rng.ts` seedado. IA escolhe alvo por proximidade estável (Chebyshev). Verificado: run determinístico via harness esbuild reproduz kills/mortes/respawn idênticos.
- **`targetId` no snapshot**: hoje é o alvo do primeiro jogador (single-player local). No online, cada conexão recebe seu próprio snapshot — comentado no código.
- **Corpse visual**: `CORPSE_TICKS=0` (sem corpo no M1); morte só dispara o evento `death` e a remoção. Gancho pronto para futuro.
- **Famílias**: o DESIGN-BESTIARIO.md detalha 7 famílias na tabela, mas o tipo canônico foi criado com as **12 famílias** pedidas na tarefa (waves futuras importam este tipo).
- **Arquitetura verificada**: zero imports de pixi/browser em `src/sim` e `src/shared`; client só envia comandos e desenha snapshots; protocolo 100% serializável (só IDs/dados). `npx tsc --noEmit` e `npm run build` passam.
