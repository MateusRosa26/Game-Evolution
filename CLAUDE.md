# RPG — Tibia-like em TypeScript + PixiJS

RPG top-down em grid (estilo Tibia/Apogea), pixel art **128px/tile** (remaster jun/2026, era 32px — ver `docs/reports/2026-06-11-remaster-128px.md`), dark medieval. Ver `DESIGN.md` para decisões de design e roadmap.

## Comandos

- `npm run dev` — dev server Vite em http://localhost:5173 (polling ativado: projeto fica em /mnt/c)
- Dependências instaladas **pelo WSL** (binários Linux). No PowerShell do Windows usar `.\dev.cmd` (encaminha pro WSL); nunca rodar `npm install` pelo Windows.
- `npm run build` — type-check (tsc) + build de produção
- `npx tsc --noEmit` — só type-check

## Documentação de design

- `DESIGN-FILOSOFIA.md` (**constituição** — pilares + Teste da Mastigação; em conflito, ela vence), `DESIGN.md` (visão), `DESIGN-EVOLUCAO.md` (progressão + sistema de Marcas), `DESIGN-VISUAL.md` (direção de arte + UI/layout), `DESIGN-LORE.md` (história do mundo, linha do tempo, raças) — fonte da verdade do design.
- **Docs grandes seguem o padrão hub + sub-docs** (raiz = decisões-mãe/fundamentos; corpos em `design/<tema>/`): `DESIGN-ITENS.md` → `design/itens/` (`EQUIPAMENTO.md` roster+catálogos T1/T2, `CONSUMIVEIS.md`, `ECONOMIA.md`) · `DESIGN-BESTIARIO.md` → `design/bestiario/` (`FAMILIAS.md` com as 12 famílias/criaturas) · `DESIGN-MUNDO.md` → `design/mundo/` (`SISTEMA-QUESTS.md`, `SISTEMA-NPCS.md`, `EXPLORACAO.md`). Specs concretas por fatia em `design/fatia-1-alvorada/`. Doc novo na wiki = entrada no array `DOCS` de `wiki/wiki.js`.
- **Skills de game design** em `.claude/skills/` (todas carregam a constituição como critério de veto): `diretor-de-arte` (pixel art/UI), `designer-de-sistemas` (mecânicas + guardião da filosofia), `loremaster` (nomes/flavor/cânone), `balancista` (números via simulação headless), `world-designer` (mapas/zonas/POIs).
- **Wiki de leitura**: http://localhost:5173/wiki/ (com dev server rodando) renderiza esses .md. Autocontida em `wiki/` (zero deps, extraível p/ projeto separado); doc novo = entrada no array `DOCS` de `wiki/wiki.js`.
- A wiki também tem **views interativas** (`#/db/bestiario`, `#/db/skills`, `#/db/classes`) com filtros/ordenação, parseadas dos .md por `wiki/db.js`. Os parsers dependem da estrutura dos docs (headings de família, colunas das tabelas, bullets `- **Campo:**` das skills/classes) — manter o formato ao editar os .md, ou ajustar `db.js` (detalhes em `wiki/README.md`).

## Arquitetura — REGRA DE OURO

A simulação é desenhada como um servidor desde o dia 1 (migração futura para online):

- `src/sim/` — simulação pura e autoritativa. Tick-based (20/s), tempo lógico próprio, RNG seedado (`rng.ts`), **PROIBIDO importar pixi.js ou usar APIs de browser**. Pathfinding (A*) roda aqui, não no cliente.
- `src/shared/` — `protocol.ts` (comandos do cliente / snapshots do servidor) e tipos. Formato já é serializável como se fosse rede.
- `src/client/` — PixiJS: render, input, HUD. **PROIBIDO conter regras de jogo** — só envia comandos e desenha snapshots. Interpola movimento entre snapshots (`EntityRenderer`).
- `src/net/LocalServer.ts` — transport local in-process com fixed-timestep accumulator. No online, vira processo Node + WebSocket sem mudar sim nem client.

## Detalhes que importam

- Pixel art: gerada proceduralmente em `src/client/assets/sprites.ts` (canvas → Texture). Paleta central em `palette.ts`. `TextureStyle.defaultOptions.scaleMode = "nearest"` é setado no `main.ts` ANTES de criar texturas.
- Chão do mapa é pré-renderizado em chunks de 16×16 tiles (RenderTextures) — nunca criar um sprite por tile de chão.
- Objetos (árvores/muros/tochas) e entidades vivem no MESMO container y-sorted (`WorldRenderer.objects`), zIndex = pixel Y da base.
- Iluminação: RenderTexture com cor ambiente + luzes em blend "add", aplicada sobre o mundo com blend "multiply" (`Lighting.ts`). Cores/ambiente em `palette.ts`.
- Movimento estilo Tibia: a sim move a entidade tile a tile com cooldown (`stepMs`); o cliente anima a transição. Diagonais custam 1.45×.

## Testar visualmente

Dev server + Playwright MCP (browser headless usa SwiftShader — FPS baixo é normal ali; no Chrome real roda 60fps). Screenshots salvam na raiz do projeto — apagar depois de usar. Timers de aba headless são lentos; o accumulator do LocalServer compensa.
