# Endurecimento da suíte de testes + verificação do engine (15/jun/2026)

Sessão autônoma (usuário ausente). Objetivo: review do projeto + trabalho seguro,
100% verificável por mim (testes headless determinísticos), sem decisões de design.

Branch: `chore/test-harness-hardening` (NÃO pushada — revisar/mergear quando voltar).

## TL;DR

- **17/17 smokes verde**, `tsc --noEmit` limpo.
- Engine de sim **muito mais completo do que as notas sugeriam**: drop/pickup, baús+chaves,
  compra/venda, loot de mob, z-levels, quests (5 tipos de stage) e economia de mana estão
  **completos e ligados ao protocolo**. Isso foi VERIFICADO, não só revisado.
- **5 smokes novos** (antes não cobertos) + **runner único** (`npm test`).
- **0 bugs de sim encontrados** — todas as falhas durante o desenvolvimento dos testes foram
  bugs DO TESTE (premissas erradas), corrigidas. Nenhuma edição em `src/`.

## Review (3 varreduras paralelas)

1. **Saúde de código**: `tsc` verde; `strict` + `noUnusedLocals/Parameters`. Zero violação
   da regra sim/client (nenhum import de pixi em `src/sim/`). Só 2 TODOs (ambos do ciclo
   dia/noite, acoplados, não-bloqueantes) em `src/sim/items/ledger.ts`.
2. **Features de gameplay**: todas as 7 áreas auditadas estão COMPLETAS no lado sim. Nada
   pela metade. Tudo testável headless.
3. **Docs**: 4 docs de fatia não estavam registrados na wiki (mecânico, resolvido).

## O que foi feito

### Infra de teste
- `tools/run-all-smokes.mjs` — descobre todos os `tools/_smoke-*.ts`, builda com esbuild,
  roda, imprime sumário, sai 1 se algum falhar. Aceita filtros (`npm test commerce mana`).
- `package.json`: script `"test": "node tools/run-all-smokes.mjs"`.

### Cobertura nova (5 smokes)
| Smoke | Prova |
|---|---|
| `_smoke-commerce.ts` | abrir loja exige NPC ≤3 tiles; comprar debita ouro + entrega item; ouro insuficiente bloqueia; vender funde ouro + remove item; item não-comprado é recusado |
| `_smoke-mana.ts` | cast-time cobra mana no início; mana insuficiente bloqueia; cast cancelado por mover NÃO reembolsa; regen é gated por comida (0 sem; >0 com; clampa no max) |
| `_smoke-consumiveis.ts` | poção clampa no maxHp + arma exausto; exausto bloqueia 2º uso; vida cheia = no-op; comida aplica "Bem Alimentado" + consome 1 do stack; saciedade tem teto |
| `_smoke-loot.ts` | matar mob cria cadáver-container abrível; loot seedado é byte-idêntico entre execuções frescas (determinismo) |
| `_smoke-zlevel.ts` | loja, pickup de chão e seleção de alvo de combate são todos gated por z (com caso-controle no mesmo andar) |

### Wiki
- 4 docs registrados no array `DOCS` de `wiki/wiki.js`: GRID, ITENS-LOOTS e MOBILIA-URBANA
  da Fatia ①, e VISAO-CHARNECA da Fatia ②. (NB: `design/mundo/MOBILIA-URBANA.md` já estava
  registrado — o não-registrado era o homônimo da `fatia-1-alvorada/`.)

## Gotchas descobertos (úteis pra próximos testes de sim)
- **IDs de skill são em inglês** (`earthen_grasp`, não `garras_da_terra`).
- **O spawn do testMap (28,26) é ZONA SEGURA** 3×3: skill ofensiva é bloqueada lá, mobs não
  entram. Tirar o caster de lá pra testar cast ofensivo.
- `useSkill` é **bufferizado** (resolve no tick seguinte); `useItem` é síncrono no `handleCommand`.
- `containers.countOf(reg, container, templateId)` — registry é o **1º** argumento.
- Player **nasce com itens** no bolso (ex.: 5 queijos) — testes de contagem devem ser relativos.
- Internals de teste: `(sim as any).entities|progressions|containers|items|corpses`.
- Mob: `kind === "monster"`, `species` singular (ex.: `"rato"`); comando de atacar = `selectTarget`.

## Pendências (decisão sua — NÃO toquei)
- `main` está ~28 commits à frente de `origin/main` (não pushada).
- WIP sujo na worktree `~/rpg-worktrees/remaster` (32 arquivos).
- Faxina das ~11 branches já mergeadas + worktrees.
- Esta branch `chore/test-harness-hardening` aguardando review/merge.
