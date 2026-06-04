# Design Visual — Direção de Arte & UI

> Documento vivo. Referências: **Apogea** (pixel art atmosférica + UI clean) e **Ragnarok Online** (janelas leves, intuitivas). Meta: bonito sem ser caro de produzir.

## Pilares

1. **"Charmoso sem ser bobo"** — o charme vem de luz, atmosfera e feedback, não de resolução de sprite (já em `DESIGN.md`).
2. **Mundo pixel, UI limpa** — o mundo é pixel art 32px; a UI é moderna, escura e discreta **por cima**, nunca competindo com o jogo. Contraste proposital (estilo Apogea/Hades).
3. **Clean e intuitivo** — toda informação a no máximo 1 tecla de distância; nada de UI ocupando tela à toa.
4. **Barato de produzir** — tudo procedural (canvas/Graphics), zero assets externos; componentes reutilizáveis com tokens centrais. Bonito por consistência, não por ornamento.

## Mundo (pixel art) — regras já estabelecidas

- Tiles e sprites **32px**, gerados proceduralmente (`sprites.ts`); zoom 2x da câmera.
- **Paleta central** em `palette.ts` (fonte canônica de cor do mundo): tons frios e dessaturados no ambiente, **luz quente como contraste** (tochas, fogo).
- **Outline universal** `#10141c` em toda pixel art — unifica o estilo.
- `scaleMode = "nearest"` sempre (pixel nítido, sem blur).
- Iluminação: cor ambiente fria ("entardecer sombrio") + luzes aditivas quentes (`Lighting.ts`). A atmosfera É a identidade.
- Y-sort de objetos/entidades no mesmo container; chão pré-renderizado em chunks.
- Regra de ouro de cena: **silhueta legível** — jogador, mobs e itens precisam ler contra qualquer chão. Outline + contraste de valor resolvem.

## Layout de tela (decidido — overlay minimalista)

Mundo em tela cheia. UI nas bordas, painéis por hotkey:

```
┌──────────────────────────────────────────────┐
│ (buffs/debuffs)                    (relógio/ │
│                                     minimapa │
│                                       futuro)│
│                                              │
│                 MUNDO (100%)                 │
│                                              │
│                            ┌─────────┐      │
│                            │ PAINEL  │      │
│                            │ (hotkey)│      │
│ ┌HP━━━━━━━━┐               └─────────┘      │
│ └MP━━━━━━━━┘   [1][2][3][4][5]   (xp bar)   │
└──────────────────────────────────────────────┘
```

- **Canto inferior esquerdo:** painel de status (HP/MP — já existe; XP entra no M2).
- **Centro inferior:** hotbar de skills (5–8 slots ✏️, teclas 1–8).
- **Painéis** (inventário `Tab`/`I`, equipamento, skills, character): janelas que abrem ancoradas à direita e **fecham com a mesma tecla / Esc**. Uma por vez no início (simples); empilhamento ✏️ futuro.
- **Topo esquerdo:** buffs/debuffs ativos (ícones pequenos).
- **Topo direito:** reservado (debug hoje; minimapa/relógio dia-noite futuro ✏️).
- Hints de Marca (a "dica vaga" dos 50%) aparecem como **texto atmosférico** temporário sobre o mundo, não como popup de sistema.

## UI — estilo e tokens (decidido — clean moderna sobre pixel)

Estilo do HUD atual estendido para todo o jogo. **Tokens centrais** (futuro `src/client/ui/theme.ts` — toda UI consome daqui, nada hardcoded):

| Token | Valor | Uso |
|---|---|---|
| `panel.bg` | `#12151d` α 0.88 | fundo de painéis/janelas |
| `panel.border` | `#3a4254`, 1.5px | borda única e fina |
| `panel.radius` | 6px | cantos arredondados |
| `text.primary` | `#e8e4d8` | texto principal (off-white quente) |
| `text.dim` | `#8890a0` | secundário/labels |
| `text.accent` | `#c8a84b` | dourado — destaques, raridade, títulos (mesmo do `buckle` da paleta) |
| `bar.hp` | `#a62f3b` (fundo `#241015`) | vida |
| `bar.mp` | `#2e5598` (fundo `#101a2c`) | mana |
| `bar.xp` | `#7a8f3d` ✏️ | experiência (fina, discreta) |
| `slot.bg` | `#1a1e28` | slots de hotbar/inventário |
| `slot.border` | `#2a3140` / `#c8a84b` se ativo | |

- **Tipografia:** fonte do sistema monospace/sans nítida (como hoje, `resolution` 2–3 para nitidez). Sem fonte pixel na UI — legibilidade primeiro. Tamanhos: 9–11px (HUD), 13px (painéis), nunca menor que 9.
- **Janelas (estilo RO):** título na barra superior + corpo + fechar no `Esc`. Sem decoração além de borda/título. Arrastáveis ✏️ (não no MVP).
- **Tooltips:** padrão único para item/skill — nome (cor de raridade), linha de tipo, stats, flavor em itálico `text.dim`. Tooltip é onde a história da Marca do item aparece (ledger resumido ✏️).
- **Cores de raridade de item** ✏️ (M2): comum `#e8e4d8` · incomum `#58c878` · raro `#4a73b8` · lendário `#c8a84b` · único `#b04ad8`.

## Feedback de combate (decidido — completo, estilo Tibia+)

Jogo de farm longo precisa de combate **legível e satisfatório**:

| Feedback | Spec |
|---|---|
| **Números de dano** | flutuantes, sobem e somem (~0.8s ✏️); cor por tipo (tabela abaixo); crítico = maior + leve shake do número |
| **Flash de hit** | sprite atingido pisca branco 1–2 frames |
| **Barra de HP do mob** | aparece sobre o mob ao entrar em combate, some ~3s após |
| **Partículas** | mínimas e por elemento (faíscas, floco, gota verde…) — charme barato |
| **Morte** | mob esvanece + partículas; **kill que conta pra Marca não tem feedback especial** (sistema é oculto!) |
| **Desbloqueio de Marca/Mutação/Caminho** | o ÚNICO feedback grandioso: flash dourado, nome em destaque na tela, som forte. Momento screenshotável (regra do `DESIGN-EVOLUCAO.md`) |

**Cores por tipo de dano** (mesma tabela para números, partículas e ícones — consistência total):

| Tipo | Cor |
|---|---|
| Físico | `#e8e4d8` branco |
| Fogo | `#ff8c3a` |
| Gelo | `#6ec4e8` |
| Veneno | `#7ec850` |
| Sagrado | `#ffd86a` |
| Sombrio | `#9a6ad8` |
| Cura | `+` verde `#58c878` |
| XP ganho | texto discreto `text.dim` ✏️ |

## Princípios de produção

1. **Tudo procedural** — painéis com `Graphics`, sprites com canvas. Se um dia entrar asset desenhado, entra no mesmo pipeline (Texture) sem mudar arquitetura.
2. **Tokens antes de telas** — criar `theme.ts` na primeira tarefa de UI do M1; HUD atual migra pra ele.
3. **Componentes, não telas:** `Panel`, `Bar`, `Slot`, `Tooltip`, `Window` reutilizáveis — inventário/skills/character são composições.
4. **UI fora do mundo:** containers de UI nunca entram no container y-sorted do mundo; HUD em screen-space puro (como hoje).
5. Animações de UI: curtas (≤150ms), easing simples, sem bounce — clean.

## Aberto / a decidir ✏️

- [ ] Minimapa: existe? quando? (topo direito reservado)
- [ ] Slots de hotbar: 5 ou 8? duas fileiras no late game?
- [ ] Janelas arrastáveis (pós-MVP)
- [ ] Barra de cast para skills canalizadas (M1 dirá se precisa)
- [ ] Tela de morte (pune XP — merece peso visual? vinheta vermelha + fade?)
- [ ] Padrão de cor pro PvP futuro (nomes, guildas)
