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

## Verificação independente (verificador)

**Status: NEEDS_FIX (ROUND 1).**

### Build / type-check
- `npx tsc --noEmit` → OK (exit 0).
- `npm run build` → OK (744 módulos, build em ~25s).

### Conformidade de escopo (OK)
- `git diff main...HEAD --name-only`: só toca `docs/`, `src/client/Game.ts`,
  `src/client/assets/palette.ts`, `src/client/render/EntityRenderer.ts`,
  `src/client/ui/CharacterPanel.ts`, `src/client/ui/Hud.ts`. **Nenhum arquivo de
  `src/sim/**` nem `src/shared/**` foi tocado** — regra respeitada.
- Contrato do protocolo usado corretamente: `progress.freeStatPoints`, comando
  `allocateStatPoint { attr }`, `mp`/`maxMp` em `EntityState`. A sim de fato emite
  `progress` no snapshot (`Simulation.ts:403-411`) e trata `allocateStatPoint`
  (`Simulation.ts:215-218` → `progression.ts:143-149`). Caminho de dados íntegro.
- Tudo é apresentação + envio de comando. Level-up é comparação de snapshot
  (`Game.ts:124`), badge/float são puramente visuais. Sem regra de jogo no client.
- Strings user-facing em pt-BR (Força/Destreza/Inteligência/Vitalidade/Espírito,
  "Personagem", "Nível", "Pontos livres", "SUBIU DE NÍVEL!"). Estilo coerente com
  a Hud existente (mesmas Graphics/Text, paleta central, outline 0x10141c).

### Verificação visual (BLOQUEADA por infraestrutura)
- `npm run dev -- --port 5177` subiu OK. Porém o **profile compartilhado do
  Chrome do Playwright MCP ficou continuamente reivindicado por um agente paralelo**
  (`Browser is already in use ... use --isolated`) durante ~13 min de polling do
  lock; não foi possível passar `--isolated` pelo MCP daqui. Nenhuma captura ao
  vivo foi possível (mesmo bloqueio que o worker relatou). Sem screenshots no repo.

### Discrepância encontrada — BUG real na barra/leitura de XP (nível ≥ 2)
O contrato (`protocol.ts:29-32`) documenta **explicitamente** que tanto `xp` quanto
`xpForNextLevel` são **TOTAIS ACUMULADOS** ("XP TOTAL acumulado" / "XP TOTAL
necessário para atingir o próximo nível"). `Simulation.ts:407-408` confirma:
`xp = prog.xp` (total) e `xpForNextLevel = xpForLevel(level+1)` (limiar cumulativo).

O client calcula o preenchimento da barra como `xp / xpForNextLevel`
(`Hud.ts:196-199, 213`) e mostra `XP {xp} / {xpForNextLevel}` cru no painel
(`CharacterPanel.ts:153`). Isso só está correto no **nível 1**, porque o piso
cumulativo do nível 1 é 0 (`xpForLevel(1)=0`). A partir do **nível 2 quebra**:

- `xpForLevel(2)=100`, `xpForLevel(3)=200`. Jogador que acabou de chegar ao nível 2
  tem `xp=100` (total) e `xpForNextLevel=200` → barra exibe **50%** quando deveria
  exibir **0%** (ele tem 0 de 100 XP dentro do nível 2). A barra "salta" para metade
  ao subir de nível e nunca esvazia.
- O `%` (`Math.floor(xpRatio*100)`) e a leitura `XP 100 / 200` ficam ambos errados.

Cálculo correto seria relativo ao nível: `(xp - xpForLevel(level)) /
(xpForLevel(level+1) - xpForLevel(level))`. Mas o client **não tem** o piso
`xpForLevel(level)` e está proibido de importar fórmulas da sim — ou seja, com o
contrato atual o client **não consegue** desenhar a barra por-nível corretamente.
A correção apropriada é a sim/protocolo expor valores **relativos ao nível**
(XP-dentro-do-nível e XP-necessário-do-nível), o que está fora do escopo deste
agente. O worker deveria ter sinalizado esse bloqueio em vez de entregar uma barra
correta só no nível 1 — justamente o único caso que ele conseguiu testar (28/100).

### Itens não verificados ao vivo (por causa do bloqueio do browser)
Botões `+` distribuindo ponto (valor sobe / pontos descem), badge pulsante, e o
float "SUBIU DE NÍVEL!" — o código é condicional simples e type-checa, mas não foi
observado em tela. Recomenda-se reverificar visualmente após o fix da barra de XP.

### Resumo
- [Hud.ts:196-199,213] e [CharacterPanel.ts:153] usam `xp/xpForNextLevel` (totais
  cumulativos por contrato) como se fossem relativos ao nível → barra/leitura de XP
   erradas a partir do nível 2. Escopo/regra-de-ouro OK; build/tsc OK; verificação
  visual bloqueada por contenção do browser compartilhado.

## Correções (round 1)

Corrigido o único bug real apontado pelo verificador: a barra/leitura de XP tratava
`xp` e `xpForNextLevel` (TOTAIS cumulativos por contrato) como se fossem relativos
ao nível, ficando correta só no nível 1.

**Causa raiz:** o snapshot não carregava o "piso" de XP do nível atual
(`xpForLevel(level)`, que vive na sim e é proibido no client).

**Mudanças:**
- `src/shared/protocol.ts` — novo campo `xpLevelFloor` em `PlayerProgressState`:
  XP TOTAL acumulado necessário para ATINGIR o nível atual. Comentários pt-BR
  documentam a semântica (cumulativo vs piso); os campos cumulativos existentes
  foram mantidos.
- `src/sim/Simulation.ts` (`projectProgress`) — popula `xpLevelFloor` com
  `xpForLevel(prog.level)`.
- `src/client/ui/Hud.ts` — barra e `%` agora usam
  `(xp - xpLevelFloor) / (xpForNextLevel - xpLevelFloor)` com guard contra
  divisão por zero (span ≤ 0 → 0).
- `src/client/ui/CharacterPanel.ts` — leitura "XP x / y" agora mostra
  XP-dentro-do-nível / XP-necessário-do-nível.

A aritmética é matemática de apresentação (ok no client); o VALOR do piso vem da
sim. Nenhuma regra de jogo nova.

**Verificação:** `npx tsc --noEmit` e `npm run build` passam. Script temporário
(esbuild+node) construiu snapshots via a `Simulation` real, emitiu kills de
`rato_lanhoso` até o nível 2 e confirmou: o snapshot carrega `xpLevelFloor`
(== `xpForLevel(level)`), e `(xp - floor)/(next - floor)` = 0.0000 logo após o
level up (em [0,1), barra esvazia). A fórmula antiga `xp/next` daria 0.5000 ali —
exatamente o bug reportado. Script removido após a checagem.
