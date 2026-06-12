# Render no CLIENT das skills novas (PixiJS) — cast bar · telegraph · burst · input

Data: 2026-06-11 · Branch: `feat/skills-engine`

Wiring de APRESENTAÇÃO para o kit de skills T2+ que a sim já produz (cast-time,
`casting`, eventos `cast`, targetings `groundTarget`/`selfRadius`/`chain`,
`lifedrainPct`). O client só DESENHA snapshots/eventos — ZERO regra de jogo
(regra de ouro do CLAUDE.md). Tudo segue os precedentes existentes (containers
y-sorted, `Graphics`, paleta, partículas de impacto por `DamageType`).

## O que foi wired

### 1. Barra de conjuração (cast-time) — `EntityRenderer.ts`
- Cada `EntityVisual` ganhou um `castBar: Graphics` (acima de nome/HP, `y=-50`).
- `updateCastBar(v, e)` (chamado por entidade em `apply`): aparece enquanto
  `e.casting` existe, preenche por `casting.pct` (0→1), cor pela skill
  (`skillMeta`). Some/limpa quando o cast termina ou cancela. Redesenha só quando
  muda skill/pct (em passos de 1px) — barato.
- Vale p/ QUALQUER entidade que conjure (player e, no futuro, mobs casters).

### 2. Telegraph de skillshot (groundTarget) — `EntityRenderer.ts`
- Nova camada `castTelegraphTiles: Graphics` (`zIndex -999`, sob entidades, logo
  acima do perigo de mob). Pulsa suave no `tick` (previsão, não perigo iminente).
- Em `apply`, toda entidade com `e.casting.aim` empilha `{aim, areaRadius, color}`;
  `drawCastAreas` pinta o tile mirado + o raio (Chebyshev) translúcido na cor da
  skill, com borda no tile-foco. O `areaRadius` vem do `skillMeta` (espelha
  `src/sim/skills/numbers.ts`).
- **Mudança aditiva mínima no protocolo**: `EntityState.casting` ganhou `aim?: Vec2`
  (`src/shared/protocol.ts`), populado em `Simulation.emitSnapshot` a partir de
  `e.casting.aim` (a fundação já guardava o aim na entidade). Nada de lógica nova.

### 3. Animações dos eventos `cast` — `EntityRenderer.ts`
- Dispatch por modo de alvo (`skillMeta(id).target`):
  - `ground`/`selfBurst`/`self` → `spawnAreaBurst`: anel que expande até o raio da
    skill (`areaRadius`) e esvanece (ease-out), cor da skill, + chuva de partículas
    de impacto do `DamageType` por todo o raio (reusa `spawnImpact`/`IMPACT`).
    `ground` estoura no tile do evento (`to`); `selfRadius`/`self` no caster.
  - demais (alvo único + **chain/Fagulhas**) → `spawnCast` existente (runa viaja
    `from`→`to`; o executor de chain emite um único `from`→`último alvo`, então o
    arco simples já cobre — ver "TODO" abaixo p/ desenhar cada segmento).
- `AreaBurst` segue o mesmo padrão dos outros fx (array + spawn + tick + filter).

### 4. Input do skillshot — WIRED (`Game.ts`, `skillMeta.ts`, `SkillBar.ts`)
- `SkillTargetMode` += `"ground"` (skillshot) e `"selfBurst"` (burst no caster).
- `SKILL_META` ganhou as 6 skills novas (nome pt-BR, glifo, cor, damageType,
  `areaRadius`): `earthen_grasp`/`storm` = `ground`; `whirlwind` = `selfBurst`;
  `sacred_aura` = `self`; `sparks`/`life_drain` = `enemy`.
- Fluxo de mira (estilo Tibia): hotkey de skill `ground` ARMA `aimingSkillId`
  (cursor de tile fica tingido na cor da skill); o PRÓXIMO clique no mundo manda
  `useSkill` com `aim = tile clicado` e desarma. Apertar a mesma hotkey de novo, ou
  `Esc`, cancela a mira. `self`/`selfBurst` castam na hora (sem alvo); `enemy` manda
  `targetId` como antes. A sim valida alcance/mana/cooldown (o `useSkill.aim` já
  estava no protocolo e plumbado até `beginOrCastSkill`).
- `SkillBar` MAX_SLOTS 6→12 (cabe o kit T2); hotkeys estendidas p/ `7/8/9`
  (`Digit0` segue cicla-outfit). Slots 10–12 ficam visíveis mas sem hotkey.

## Como VER no navegador real (Chrome, dev server `npm run dev` em :5173)

1. **F9** concede o kit M1 (slots 1–6); **F10** concede o kit T2 (cai nos slots
   7–12; hotkeys 7/8/9 alcançam os 3 primeiros: Garras da Terra, Tempestade,
   Redemoinho).
2. **Cast bar + telegraph (skillshot)**: aperte **7** (Garras da Terra) ou **8**
   (Tempestade) — o cursor de tile fica colorido (mira armada). Clique num tile:
   - aparece a ÁREA-alvo translúcida no chão (tile + raio) pulsando;
   - uma BARRA de cast enche sobre a cabeça do herói (essas skills têm cast-time);
   - ao encher, um ESTOURO de anel + partículas elétricas/terrosas na área.
   - Mover ou tomar dano no meio CANCELA (a barra some — comportamento da sim).
3. **Burst no caster**: aperte **9** (Redemoinho) — estoura um anel ao redor do
   herói na hora (selfRadius, sem cast-time).
4. **Cura em área**: conceda `sacred_aura` (slot 10, sem hotkey por ora) — burst
   dourado no caster (ver TODO de slots).
5. **Cadeia / dreno**: `sparks` e `life_drain` (slots 11–12) usam o projétil
   existente (alvo selecionado); a sim resolve o salto/dreno.

## TODO / concerns

- **Slots 10–12 sem hotkey**: `Digit0` é o cicla-outfit (existente). Os 3 últimos
  do kit T2 (`sacred_aura`/`sparks`/`life_drain`) ficam visíveis mas só castáveis
  reordenando o kit conhecido na sim (DEV) ou quando a hotbar configurável chegar
  (M2). Os 3 que importam p/ provar o render novo (skillshot+burst) estão em 7/8/9.
- **Chain (Fagulhas)** desenha como um projétil simples `origem→último alvo` (o
  executor emite um único `cast` from→to — confirmado no report dos executores).
  Se no futuro a sim expandir o payload com o caminho da cadeia, dá p/ trocar por
  segmentos saltando sem mexer no resto.
- **QA visual**: validado headless apenas que NÃO há erro de console e o canvas
  renderiza (frames WebGL são pretos em headless, por nota do projeto). O
  sign-off visual (cores/leitura das áreas, timing dos bursts) é do usuário /
  diretor-de-arte no Chrome real.

## Verificação

- `npx tsc --noEmit` limpo; `npm run build` exit 0 (só o aviso pré-existente de
  tamanho de chunk).
- Reachability: chain completa client→sim→client confirmada por leitura —
  `useSkill{aim}` → `pendingSkillCasts` → `beginOrCastSkill` grava `casting.aim`
  → `emitSnapshot` serializa → `EntityRenderer.apply` lê `e.casting.aim` e desenha
  o telegraph; o evento `cast` (no resolve) dispara o burst.
- Dev server :5173 com o código novo: 0 erros de console após boot + ticks
  (snapshots fluindo pelo `apply`/`tick` modificados sem crash).

## Arquivos tocados

- `src/shared/protocol.ts` — `EntityState.casting` += `aim?: Vec2` (aditivo mínimo).
- `src/sim/Simulation.ts` — popula `state.casting.aim` no `emitSnapshot` (1 linha).
- `src/client/render/EntityRenderer.ts` — cast bar, telegraph de área, area burst,
  dispatch dos eventos `cast`.
- `src/client/ui/skillMeta.ts` — modos `ground`/`selfBurst`, `areaRadius`, 6 metas
  novas, `T2_SKILL_IDS`.
- `src/client/ui/SkillBar.ts` — MAX_SLOTS 6→12.
- `src/client/Game.ts` — hotkeys 7/8/9, F10 (grant T2), estado `aimingSkillId`,
  fluxo de mira no clique, cancelamento por Esc, cursor tingido na mira.
