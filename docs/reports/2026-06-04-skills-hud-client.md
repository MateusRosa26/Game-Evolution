# Skill bar + hotkeys + visuais de cast (client)

Data: 2026-06-04
Branch: `feature/skills-hud-client`

## O que foi feito

Estendido o lado do cliente (PixiJS) com a barra de skills, hotkeys e os
feedbacks visuais de cast/cura/status. Tudo lê APENAS o snapshot
(`EntityState.skills`, `EntityState.status`, eventos `cast`/`heal`/`damage`) e
envia comandos (`useSkill`, `debugGrantSkill`). **ZERO regra de jogo no client**:
não valida mana/cooldown/alcance — só mostra; a sim rejeita o que for inválido.

1. **Barra de skills** (`SkillBar.ts`, embaixo-centro, estilo Tibia/MMO): um slot
   por skill conhecida do player (snapshot `skills`). Cada slot tem glifo
   procedural (iniciais — GF/BF/LG/AP/LS/CF), faixa de cor da skill no topo,
   **hotkey** (1–6) no canto superior-esquerdo, **custo de mana** no inferior-
   direito (azul; oculto quando 0), e **overlay de cooldown**: fill vertical
   escurecido (de cima p/ baixo) + glifo esmaecido + **contagem em segundos**
   centralizada quando `cooldownMs > 1000`.
2. **Hotkeys 1–6** (`Game.ts`): a tecla usa a skill do slot correspondente. O
   `targetId` é decidido pela semântica de apresentação (`skillMeta.ts`):
   ofensivas mandam o alvo selecionado atual (`snapshot.targetId`, guardado no
   `Game`); cura sem alvo = self (omite `targetId`). A hotkey aparece no slot.
3. **Feedback de cast** (evento `cast`): runa colorida pela skill viajando de
   `from`→`to` em ~150ms (`EntityRenderer.spawnCast`) — apresentação pura; a sim
   já resolveu o efeito.
4. **Feedback de cura** (evento `heal`): floating text **VERDE** `+{amount}`
   sobre o alvo (`EntityRenderer.spawnHealText`), seguindo o padrão do dano
   vermelho (`spawnDamageText`) — mesmo pool de floats, mesma curva de subir/
   sumir.
5. **Indicador de status effects** (snapshot `status`): ícone minúsculo sobre a
   barra de HP de quem tem status ativo — chama (triângulo laranja) = burn, floco
   (losango ciano) = slow, gota (círculo verde) = poison. Desenhado via Graphics,
   ancorado ao container da entidade (segue a interpolação).
6. **DEV helper — tecla F9**: envia `debugGrantSkill` para as 6 skills do kit M1
   (`golpe_forte`, `bola_de_fogo`, `lanca_de_gelo`, `apunhalar`, `luz_sagrada`,
   `curar_ferimentos`), permitindo testar a barra cheia (o knight só nasce com
   Golpe Forte).
7. Strings user-facing em pt-BR.

## Arquivos alterados

- `src/client/ui/skillMeta.ts` — **NOVO**: tabela de APRESENTAÇÃO id → {nome
  pt-BR, glifo, cor, modo de alvo (enemy/self)} + fallback genérico + lista
  ordenada `ALL_SKILL_IDS` (usada pelo F9). O snapshot só traz id/cooldown/mana;
  nome/cor/glifo/semântica-de-alvo são metadados de cliente (sem regra).
- `src/client/ui/SkillBar.ts` — **NOVO**: a barra de slots (Graphics/Text,
  coerente com Hud/CharacterPanel). `setSkills(skills)` a cada snapshot,
  `skillIdForSlot(i)` para as hotkeys, overlay de cooldown.
- `src/client/render/EntityRenderer.ts` — `spawnCast` (runa from→to, ~150ms),
  `spawnHealText` (float verde), `drawStatusIcons` (chama/floco/gota sobre a HP
  bar) + campos `statusIcons`/`statusKey` em `EntityVisual` e despacho dos
  eventos `cast`/`heal` no `apply`.
- `src/client/Game.ts` — instancia a `SkillBar` (add à stage + resize), alimenta
  `skillBar.setSkills(playerState.skills)`, guarda `targetId` do snapshot, e
  trata as teclas 1–6 (`useSkillSlot`) e F9 (grant das 6 skills) no listener de
  `keydown` existente.

Nenhum arquivo de `src/sim/**` ou `src/shared/**` foi tocado.

## Como testar no jogo

1. `npm run dev` e abrir http://localhost:5173.
2. Barra embaixo-centro: começa com **1 slot** (Golpe Forte — só o que o knight
   conhece).
3. **F9**: popula a barra com as **6 skills** (GF, BF, LG, AP, LS, CF), cada uma
   com hotkey, glifo, faixa de cor e custo de mana.
4. Clicar num **Rato Lanhoso** para selecioná-lo (marcador de alvo aparece);
   apertar **1** (Golpe Forte): runa viaja até o rato, dano vermelho flutua, e o
   **slot 1 entra em cooldown** (escurece de cima p/ baixo + contagem `6…5…`,
   ~6s).
5. **6** (Curar Ferimentos, self): floating text **verde** `+N` sobre o herói; o
   slot 6 entra em cooldown.
6. **2** (Bola de Fogo) num alvo que sobreviva: aplica **queimadura** — ícone de
   chama laranja sobre a HP bar do alvo (ver nota abaixo sobre rats fracos).

## Notas

- **Contrato do protocolo (já existia, usado como está):** `EntityState.skills`
  (`{ id, cooldownMs, manaCost }`), `EntityState.status`
  (`{ kind: burn|slow|poison, remainingTicks }`), comando
  `useSkill { skillId, targetId? }`, comando DEV `debugGrantSkill { skillId }`,
  e eventos `cast { skillId, casterId, from, to }` / `heal { skillId, casterId,
  targetId, amount, pos }`. O `cooldownMs` é projetado pela sim
  (`Simulation.projectSkills`) e a barra só o desenha.
- **Cooldown overlay:** o snapshot traz só o cooldown RESTANTE (não o total).
  A ALTURA do fill é normalizada por uma janela de referência (4s) — aproximação
  visual; a CONTAGEM em segundos é o feedback exato. Sem regra de jogo.
- **Sobre ver a queimadura ao vivo:** os Ratos Lanhosos do mapa têm pouca vida e
  a Bola de Fogo (skill de mage, concedida via F9 a um knight) costuma matá-los
  no impacto — então o burn não persiste tempo suficiente para aparecer. O
  caminho de status do client foi verificado em tela injetando status temporário
  (removido depois): os 3 ícones (chama/floco/gota) renderizam corretamente sobre
  a HP bar. Com um alvo mais resistente (waves futuras), o burn de fato fica
  visível pela duração do DoT.

## Verificação

- `npx tsc --noEmit` → OK. `npm run build` → OK.
- **Visual (Chrome isolado via CDP, SwiftShader headless):** como o profile
  compartilhado do Playwright MCP estava em uso por outro agente, subi um
  chromium isolado (`--user-data-dir` próprio + `--remote-debugging-port`) e
  dirigi por CDP. `npm run dev -- --port 5180`. Confirmado em tela:
  - Barra inicial com 1 slot (Golpe Forte); **F9** populando os 6 slots com
    glifos/hotkeys/mana corretos (GF mana 0, BF 14, LG 18, AP 5, LS 12, CF 10).
  - Selecionar rato + **tecla 1** → dano aplicado e **slot 1 em cooldown**
    (escurecido + contagem `6`); console confirmou `golpe_forte:6000ms`
    decrescendo no snapshot.
  - **Tecla 6** (Curar Ferimentos, self) → **float verde `+24`** sobre o herói +
    slot 6 em cooldown.
  - **Tecla 2** (Bola de Fogo) → dano `18` no rato + slot 2 em cooldown.
  - Ícones de status (chama/floco/gota) renderizando sobre a HP bar (via injeção
    temporária, vide nota).
  - Console **sem erros** durante uso das skills.
- Hooks de debug temporários e screenshots foram removidos; nada de PNG no repo.
