# UI de inventário, equipamento e janelas — sessão 07/jun/2026

> Documenta o trabalho feito em 06–07/jun (não commitado no momento da escrita —
> último commit do repo é `b4d7518`, de 05/jun). O type-check passa limpo
> (`npx tsc --noEmit` → exit 0). Reconstrução pós-crash do terminal.

## Resumo

Construído o **sistema completo de itens na UI** (estilo Tibia), respeitando a
regra de ouro: toda a lógica é **autoritativa na sim**; o client é apresentação
pura que envia comandos e desenha o snapshot. Junto vieram três janelas de
suporte que faltavam (chat, diálogo de NPC, diário de quests) e o motor de
**paper-doll** que compõe o personagem por camadas.

Cinco frentes:

1. **Protocolo** — comandos e projeções de inventário/equip/container/diálogo/quest.
2. **Sim** — registry de containers, drag & drop autoritativo, cadáver-container, diálogo e quest engine.
3. **Client UI** — paper-doll de 11 slots, janelas de container, drag & drop visual, chat, diálogo, diário.
4. **Paper-doll** — composição do char por peças (camadas tintadas por LUT).
5. **Integração** — tudo fiado no `Game.ts` (hotkeys, anti-click-through, sync de janelas).

---

## 1. Protocolo (`src/shared/protocol.ts`)

### Comandos novos (client → sim)
- `talk { npcId }` · `dialogueChoice { optionId }` · `closeDialogue` — diálogo de NPC.
- `openContainer { containerId }` · `closeContainer { containerId }` — abrir/fechar janela de container.
- `moveItem { from: ItemRef, to: ItemRef }` — **drag & drop** (a sim valida tudo).
- `lootGold { containerId, slot }` — saquear pilha de gold de cadáver.
- `say { text }` — fala no canal Local (balão + linha de chat).

### Tipos novos
- `EquipSlot` — os **11 slots** modelo Tibia: `helmet, armor, legs, boots, hand1, hand2, necklace, ring1, ring2, backpack, utility`.
- `ItemRef` — referência de um lugar de item: `{ kind: "container", containerId, slot }` ou `{ kind: "equip", slot }`. É a moeda do drag & drop.
- `ContainerView` / `ContainedItemView` / `GoldPileView` — projeção de um container aberto.
- `EquippedItemView` — item num slot de equip (instanceId/templateId/name).
- `DialogueViewState` / `DialogueOptionView` — diálogo ativo (texto + opções clicáveis).
- `QuestJournalEntry` — entrada do diário; **contador `{cur,max}` só em quests `direta` com etapa de caça** (decisão jun/2026; abertas/segredos nunca).

### Campos novos em `EntityState` (SÓ na entidade do jogador dono)
`equipment`, `containers`, `backpackContainerId`, `dialogue`, `quests`. Mantém o
princípio: dados privados (mochila, diário) só vão para o dono; o que é público
(outfit) vai para todos.

---

## 2. Simulação (autoritativa)

### `src/sim/items/containers.ts` (novo)
`ContainerRegistry` — containers com id próprio determinístico (contador da sim).
Cada container é uma lista de slots; cada slot guarda `{kind:"item", instanceId}`,
`{kind:"gold", amount}` ou `null`. Containers **sobrevivem ao dono** (cadáver não
tem dono; mochila trocada mantém conteúdo). API: `create / get / remove /
freeSlot / add`.

### `src/sim/dialogue.ts` (novo)
Diálogo autoritativo. Cada NPC é um `NpcDialogue` com `root(quests)` e
`choose(optionId, quests)` — **os nós são FUNÇÕES do estado de quests do jogador**,
então oferta → andamento → report → pós-quest saem do mesmo lugar (sem máquina de
estados paralela). `choose` retorna a próxima view + `effects` (`acceptQuest` /
`completeQuest`) que a `Simulation` aplica. Implementado: **Bartolo** (estalajadeiro,
giver da Q1). Keywords digitáveis = v2 ✏️. Falas = rascunho (Loremaster finaliza ✏️).

### `src/sim/quests.ts` (novo)
Quest engine declarativa. `QuestDef` (id, name, `layer: direta|aberta|segredo`,
`giverNpcId`, `kill?`, `rewards{xp,gold}`, textos de diário). `QuestState
{stage, kills}` com `stage: active | report | completed`. `creditQuestKill()`
avança quests ativas no kill que casa espécie/mapa. Implementada **Q1 — Ratos no
Porão** (`rato_lanhoso` ×8, 50 XP + 20 gold). Etapas novas (`region_enter`,
`item`) entram como variantes do def sem tocar o protocolo.

### `src/sim/Simulation.ts` (alterado)
- **Handlers** dos comandos novos (`talk`, `dialogueChoice`, `closeDialogue`,
  `say`, `openContainer`, `closeContainer`, `lootGold`, `moveItem`).
- Jogador nasce com **bolso "Bolso" de 8 slots** (`backpackContainerId`) e arma em `hand1`.
- `containerAccessible(e, id)` — guard de **posse/distância**: bolso próprio sempre;
  cadáver a ≤2 tiles (chebyshev). Toda mutação passa por aqui.
- `moveItem()` — **drag & drop autoritativo, wave 1**: container⇄container (slot
  vazio), container⇄equip e equip⇄equip. Valida `slotAccepts` (arma/escudo→hand1/2,
  armadura→armor). **Slot ocupado = no-op** (swap fica para a wave 2 ✏️). Gold
  arrastado para qualquer lugar = saque. `afterEquipChange()` re-sincroniza
  `equippedWeaponId` e os derivados de combate.
- `lootGold()` — pilha de gold vira `entity.gold` (moeda é número no char).
- `creditQuestKill()` plugado no evento de kill.
- `pruneCorpsesAndContainers()` — cadáver vencido decai (remove o container);
  jogador que se afastou tem a janela fechada (tira do `openContainers`).
- **Projeção no snapshot**: monta `equipment` (11 slots preenchidos), `containers`
  (só os abertos, com items + goldPiles), `dialogue`, `quests` (com contador só
  nas diretas).

### `src/sim/entity.ts` (alterado)
Campos novos em `SimEntity`: `quests: Map`, `equipment: Partial<Record<EquipSlot,
number>>`, `backpackContainerId`, `openContainers: Set`, `npcKey` (id estável do
NPC, ex.: `"bartolo"`), `activeDialogue`.

---

## 3. Client — UI (apresentação pura)

### `src/client/ui/dnd.ts` (novo) — `ItemDnD`
Motor de **drag & drop de itens**. Janelas registram seus slots
(`setSlots(owner, slots)`) com `bounds()` em coordenadas de tela + `ItemRef`.
`start()` cria um fantasma que segue o mouse; `drop()` acha o slot sob o cursor e
dispara `onMove(from, to)` → comando `moveItem`. **Zero regra de item aqui** — a
sim valida tudo. `clearOwner` ao fechar a janela.

### `src/client/ui/EquipPanel.ts` (novo) — tecla **E**
Paper-doll de **11 slots** no layout do Tibia (colar/capacete/mochila, mão1/
armadura/mão2, anel1/calça/anel2, utilitário/botas). Cada slot é origem (grab) e
alvo de drop. Arrastável pelo header. Re-render só quando `equipment` muda.

### `src/client/ui/ContainerWindow.ts` (novo) — uma por container aberto
Grade 4 colunas. Item = quadradinho (iniciais + nome truncado); pilha de gold =
moeda com a quantia (clique = `lootGold`). Slots são alvo/origem de drag & drop.
Header arrastável + botão ✕ (envia `closeContainer`). `update(view)` re-renderiza
só se a view mudou.

### `src/client/ui/ChatWindow.ts` (novo)
Chat com canais (`local` / `system` / `npc`), input de texto que **suspende WASD/
hotkeys enquanto focado** (gate no `Keyboard`), envia `say`. Linhas privadas
(loot/level/quest) só o destinatário vê.

### `src/client/ui/DialogueWindow.ts` (novo)
Renderiza `DialogueViewState` (texto do NPC + opções clicáveis), devolve
`dialogueChoice`. Fecha no Esc → `closeDialogue`.

### `src/client/ui/JournalPanel.ts` (novo) — tecla **J**
Diário de quests a partir de `QuestJournalEntry[]`. Mostra nome, entrada e o
contador discreto (`4/8`) só nas diretas.

### `src/client/assets/outfit/paperdoll.ts` (novo)
**Compositor do personagem por camadas** — substitui o tint-por-máscara (descartado:
o sprite de IA não tem zonas separáveis, vazava e piscava). Cada peça de outfit é
uma camada extraída por `/inpaint`; compõe **corpo base → pernas → torso → cabeça**,
tintando cada peça pela cor do slot via **LUT de luminância** (shading preservado,
limpo por construção). Cacheado em LRU por visual. Mapa sim→arte em `PIECE_BY_PART`.
Online-ready: servidor só trafega ids+cores; peças são assets de CDN; composição
client-side 1× por visual. Tem variante de **frames de ataque** (`paperdollAttackTextures`).

---

## 4. Integração (`src/client/Game.ts`)

- **Hotkeys**: `C` character · `O` outfit · `J` diário · `E` equip · `Tab`/`I`
  bolso (toggle via open/closeContainer) · `Esc` fecha diálogo, senão limpa alvo ·
  `0` cicla sets de outfit · `F8`/`F9` dev (grant outfit/skills).
- **Clique no mundo**: monstro = alvo (toggle) · NPC perto = `talk`, longe = anda
  até e conversa ao chegar (`pendingTalkNpcId`) · cadáver = `openContainer`.
- **Anti-click-through** (`uiBlocksClick`): clique sobre qualquer janela visível
  (ou durante um drag) não vaza pro mundo — o boneco não anda ao mexer na UI.
- **`syncContainerWindows()`**: cria/atualiza/destrói janelas de container a partir
  das views do snapshot (uma janela por `containerId`).
- Listeners `pointermove`/`pointerup` no canvas dirigem o fantasma do drag.

---

## Estado e pendências (✏️)

- **Compila limpo** (`tsc --noEmit` exit 0). **Falta validação visual no browser** (Playwright/Chrome) — não foi rodada nesta sessão.
- **Não commitado** — convém separar do monte de mudanças de arte/balance que também estão soltas no working tree.
- **theme.ts** ainda não existe — cores vêm de `palette.ts` (`PAL`), não dos tokens centralizados previstos em DESIGN-VISUAL. Migração pendente.
- **moveItem wave 2** ✏️: swap em slot ocupado, stacking, containers aninhados (mochila dentro de mochila — hoje `backpackContainerId` é direto na entidade).
- **Diálogo v2** ✏️: keywords digitáveis. Falas finais ✏️ Loremaster.
- **Tooltips de item** (nome/raridade/stats/flavor) ainda não implementados.
- **Janela "uma por vez"** do design antigo foi superada: agora várias janelas coexistem e são arrastáveis.
