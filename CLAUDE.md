# RPG — Tibia-like em TypeScript + PixiJS

RPG top-down em grid (estilo Tibia/Apogea), pixel art procedural 32px, dark medieval. Ver `DESIGN.md` para decisões de design e roadmap.

## Comandos

- `npm run dev` — dev server Vite em http://localhost:5173 (polling ativado: projeto fica em /mnt/c)
- `npm run build` — type-check (tsc) + build de produção
- `npx tsc --noEmit` — só type-check

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
