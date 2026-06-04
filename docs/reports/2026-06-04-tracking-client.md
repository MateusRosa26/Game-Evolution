# Tracking client — hint/unlock do Sistema de Marcas

**Branch:** `feature/tracking-client`
**Status:** DONE

## Objetivo

Substituir os `console.log` do `Game.ts` por uma apresentação de verdade dos
eventos one-shot `trackingHint` e `trackingUnlock` (camada emergente,
DESIGN-EVOLUCAO.md §"Visibilidade — oculto que se revela"): o **sussurro** do
hint e o **momento screenshotável** do unlock.

## O que foi feito

- **Novo componente `src/client/ui/TrackingToast.ts`** — overlay de tela
  (adicionado ao `app.stage`, como Hud/SkillBar), `eventMode = "none"` (não
  intercepta input). Apresentação pura: só recebe texto/nome/flavor já decididos
  pela sim e os encena. ZERO regra de jogo.
  - **HINT (sussurro):** texto pequeno em serifa itálica (Georgia/serif),
    parte inferior central, cor suave da paleta (`PAL.attrLabel`), fade-in lento
    (~1.1s) com leve subida, hold ~3.6s, fade-out ~1.4s. Sem caixa.
  - **UNLOCK (o momento):** faixa horizontal escura translúcida atravessando a
    tela (com 2 linhas douradas de moldura e vinheta interna sutil), nome da
    Marca/Mutação/Caminho em **dourado grande** (`PAL.levelGold`, serif 38px,
    dropShadow dourado), flavor em itálico abaixo, categoria discreta acima em
    caps espaçadas (`M A R C A` / `M U T A Ç Ã O` / `C A M I N H O`).
    Entrada com fade + leve scale (0.9→1.0) + glow radial dourado pulsante;
    faíscas douradas via `Graphics` (leve); saída após ~5s.
  - **Fila:** hints e unlocks nunca se sobrepõem — um por vez, em ordem de
    chegada, com um pequeno respiro (`GAP_MS`) entre itens.
- **Integração mínima em `src/client/Game.ts`:**
  - instancia `TrackingToast`, adiciona ao stage (por cima de tudo), `resize` no
    build e no `onResize`, `tick(deltaMS)` no frame loop.
  - os dois `console.log` viraram `enqueueHint` / `enqueueUnlock`.

Paleta/fontes coerentes com a HUD existente (Graphics procedural, `palette.ts`,
stroke escuro `PAL.outline`). pt-BR. Sem novas deps, sem mudanças de config,
sim/shared intocados.

## Verificação

- `npx tsc --noEmit` — limpo.
- `npm run build` — OK.
- **Visual (rota real, headless):** `npm run dev -- --port 5182` + chromium
  isolado (user-data-dir próprio) dirigindo comandos reais (`selectTarget` +
  `walkTo` no rato mais próximo = auto-attack). A sim emitiu, de fato:
  - hints: *"Há força em recusar a magia fácil."*, *"Sua arma parece sedenta
    quando feras rondam por perto."*
  - unlocks: **CAMINHO — Punho Bruto** (level 3 sem usar skill) e
    **MARCA — Roedor de Ferro** (10 kills bestiais com a arma equipada).
  - Confirmado na tela: hint sutil embaixo-centro (fade-in); banner dourado
    central screenshotável; **fila** funcionando (Punho Bruto apareceu primeiro,
    Roedor de Ferro em seguida, sem sobreposição).

## Como testar manualmente

1. `npm run dev` e abrir http://localhost:5173 no Chrome.
2. Selecionar um Rato Lanhoso (clicar nele) para auto-attack e repetir nos
   respawns. No ~5º kill aparece o **hint** ("Sua arma parece sedenta…");
   no 10º, o **banner de unlock** "MARCA — Roedor de Ferro".
3. Subir ao level 3 sem nunca usar skill (só auto-attack) desbloqueia o
   **CAMINHO — Punho Bruto** — bom para ver a **fila** (dois unlocks em sequência).
4. Rota alternativa de mutação: conceder Bola de Fogo e acertar alvo válido 10×
   (`debugGrantSkill` existe no protocolo; F9 concede as 6 skills) — perto
   (Eclosão Ígnea) ou longe (Meteoro Distante).

## Notas

- O harness usou um hook DEV temporário em `main.ts` (`window.__rpg.transport`)
  só para dirigir comandos reais no teste headless; **revertido** — `main.ts`
  está idêntico ao original (`git diff src/main.ts` vazio).
- As durações de fade/hold e a geometria do banner são constantes no topo do
  componente, fáceis de calibrar quando houver áudio/SFX (wave futura).
