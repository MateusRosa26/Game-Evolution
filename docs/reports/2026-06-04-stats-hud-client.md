# HUD de progressão (client) — XP/level/mana/atributos/distribuição de pontos

Data: 2026-06-04
Branch: `feature/stats-hud-client`

## O que foi feito

Estendida a HUD PixiJS com a camada de progressão, lendo APENAS o snapshot
(`progress` do player + HP/MP da entidade). Zero regras de jogo no client: só
renderiza o que vem no snapshot e envia o comando `allocateStatPoint`.

1. **Barra de XP** (fina, estilo MMO) acoplada ao painel da HUD existente, abaixo
   das barras de HP/MP. Mostra o **level** (dourado) à esquerda e o **% até o
   próximo nível** centralizado (`Math.floor(xp / xpForNextLevel * 100)` — só
   apresentação do que já vem no snapshot, não recalcula nada).
2. **Barra de mana** — já existia na HUD (azul, mesmo estilo do HP); mantida.
3. **Painel de atributos** togglável com a tecla **C** (`CharacterPanel.ts`):
   mostra os 5 atributos em pt-BR (Força/Destreza/Inteligência/Vitalidade/
   Espírito), level, XP e pontos livres. Quando `freeStatPoints > 0`, botões `+`
   (Graphics interativo, com hover) ao lado de cada atributo enviam
   `{ type: "allocateStatPoint", attr }` pela connection do `Game`.
4. **Indicador de pontos disponíveis**: badge dourado pulsante com a contagem de
   pontos livres no canto do painel da HUD (visível só quando `freeStatPoints > 0`),
   convidando a abrir o painel.
5. **Feedback de level up**: texto flutuante dourado "SUBIU DE NÍVEL!" sobre o
   player quando o level do snapshot aumenta (o `Game` compara o level do
   snapshot anterior — apresentação, não regra).
6. Strings user-facing em pt-BR.

## Arquivos alterados

- `src/client/assets/palette.ts` — cores de UI da progressão (xp/level/painel/
  botão `+`) + helper `hex()` (string "#rrggbb" → número 0xRRGGBB).
- `src/client/ui/Hud.ts` — barra de XP, level, % e badge pulsante; novo
  `setProgress(progress)` e `tick(deltaMS)` (pulso do badge). Painel cresceu de
  64→80px para acomodar a barra de XP.
- `src/client/ui/CharacterPanel.ts` — **NOVO**: painel togglável de personagem
  com atributos + botões `+`.
- `src/client/render/EntityRenderer.ts` — novo `spawnLevelUpText()` (reusa o pool
  de floating text, ancorado ao container do player).
- `src/client/Game.ts` — instancia o painel, wire da tecla `C`, alimenta
  `hud.setProgress` / `charPanel.setProgress`, detecta level up entre snapshots,
  `hud.tick` no frame e resize do painel.

## Como testar no jogo

1. `npm run dev` e abrir http://localhost:5173.
2. HUD inferior-esquerda: HP (vermelho), MP (azul), barra de XP fina (dourada)
   com `Lv` à esquerda e `%` no centro.
3. Clicar num Rato Lanhoso para auto-atacar; ao matar, a barra de XP sobe.
4. Apertar **C**: abre/fecha o painel de personagem (level, XP, pontos livres,
   5 atributos).
5. Ao subir de nível: texto dourado "SUBIU DE NÍVEL!" sobre o herói e, com pontos
   livres, badge pulsante na HUD + botões `+` no painel. Clicar `+` distribui o
   ponto (o valor do atributo sobe e os pontos livres caem no próximo snapshot).

## Notas

- **Protocolo**: o contrato real difere da descrição da task — usei os campos
  corretos do `src/shared/protocol.ts`: `progress.freeStatPoints` (não
  `freePoints`), `mp`/`maxMp` ficam em `EntityState` (não em `progress.mana`), e
  o comando é `allocateStatPoint { attr }` (não `{ attribute }`). MP já tinha
  barra na HUD; mantida.
- **Verificação visual** (Playwright headless, SwiftShader): confirmados em tela
  a barra de XP com `%`/level, a barra de MP, o painel abrindo com `C` com os 5
  atributos em pt-BR + level/XP/pontos, e o auto-attack subindo a XP (Nível 1,
  XP 28/100 → barra 28%). Os botões `+` (exigem `freeStatPoints > 0`) e o float
  de level up não foram capturados ao vivo porque o profile compartilhado do
  browser foi reivindicado pelo agente paralelo antes de eu chegar ao level 2;
  a lógica é condicional simples, type-checada e segue os mesmos padrões de
  render já verificados. Console sem erros (só warnings benignos de ReadPixels do
  SwiftShader).
- `npx tsc --noEmit` e `npm run build` passam.
- Nenhum arquivo de `src/sim/**` ou `src/shared/**` foi tocado.
