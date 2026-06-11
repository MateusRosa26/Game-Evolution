# Design Visual — Direção de Arte & UI

> Documento vivo. Referências: **Apogea** (pixel art atmosférica + UI clean) e **Ragnarok Online** (janelas leves, intuitivas). Meta: bonito sem ser caro de produzir.

## Pilares

1. **"Charmoso sem ser bobo"** — o charme vem de luz, atmosfera e feedback, não de resolução de sprite (já em `DESIGN.md`).
2. **Mundo pixel, UI limpa** — o mundo é pixel art 32px; a UI é moderna, escura e discreta **por cima**, nunca competindo com o jogo. Contraste proposital (estilo Apogea/Hades).
3. **Clean e intuitivo** — toda informação a no máximo 1 tecla de distância; nada de UI ocupando tela à toa.
4. **Barato de produzir** — assets do mundo via **PixelLab + curadoria** (decidido jun/2026; style-references amarram a coerência), com procedural (canvas/Graphics) como fallback permanente; UI segue 100% procedural com tokens centrais. Bonito por consistência, não por ornamento.

## Mundo (pixel art) — regras já estabelecidas

- Tiles **32px**; criaturas em canvas **64×64 exibido 1:1** (norma de densidade, jun/2026): 1 px do sprite = 1 px do mundo, escala fracionária proibida (*mixels*). O tamanho relativo vem da **figura desenhada dentro do canvas** (modelo Tibia). Exceção transitória: knight 64@0.66 até regen 1:1. Origem: **PixelLab + curadoria** (jun/2026), fallback procedural em `sprites.ts`; zoom 2x da câmera.
- **Guia de proporções** (decidido jun/2026 após pesquisa Tibia/Apogea — Tibia: char = 1 tile, grandes 2, gigantes 3; Apogea: char transborda ~1.3–1.5 tile, nosso estilo): **char = ~48px de figura (1.5 tile) = 1.0**. Critter 0.5–0.6 (rato 26) · voador pequeno 0.7–0.8 (morcego 36) · humanoide pequeno 0.9–1.0 (goblin 48) · besta média 0.9–1.1 (lobo 46, javali 50) · elite/named 1.2–1.5 · boss 2.0+ (multi-tile 96–128) ✏️. Toda criatura nova declara a categoria ANTES de gerar.
- **Animações por criatura** (decidido jun/2026, flavor Apogea): walk 4f + **attack** (template do esqueleto ou v3 custom) nas 4 direções (W = flip de E). Ataque tocado pelo client no evento `damage` (~380ms). Skills de mob ✏️ por criatura.

## Identidade visual do personagem (decidido jun/2026 — modelo paper-doll)

- **Contexto**: o jogador começa **classless** e se transforma numa classe (momento épico = troca de sprite inteiro). Cada classe tem visual próprio gerado (knight1 = guerreiro; trio mage/priest/rogue aprovado em candidatos; classless ✏️ a gerar).
- **Tint por máscara no sprite inteiro: DESLIGADO e descartado** — o sprite de IA não tem zonas separáveis (1.172 cores, limites mudam por frame) → vazava e piscava. Não reativar.
- **Individualidade = paper-doll de PEÇAS geradas** (motor validado jun/2026): peça de equipamento = camada separada extraída por `/inpaint` (zona fixa por corpo; corpo congelado fora da zona; peça = conteúdo da zona no resultado, frame a frame — alinhamento herdado). Client empilha corpo → pernas → torso → elmo → arma. **Tintura por peça** (LUT de luminância na camada isolada) é limpa por construção — vira sistema de dye/corante (economia!).
- **Custo**: `/inpaint` não debita gerações do plano — guarda-roupa cresce de graça (curadoria é o único custo). 30–50 peças × grade de cores = milhares de combinações.
- Zonas reutilizáveis por corpo em `design/pixellab-candidatos/chars/zones/`; peças staging em `chars/pieces/`. Salpicos de fronteira da zona = polimento manual único por corpo ✏️.
- **Alpha (curto prazo)** ✏️: guarda-roupa de 3–5 looks gerados por classe + equipamento visível (arma/escudo já funciona) + nome.
- **Paleta central** em `palette.ts` (fonte canônica de cor do mundo): tons frios e dessaturados no ambiente, **luz quente como contraste** (tochas, fogo).
- **Outline universal** `#10141c` em toda pixel art — unifica o estilo.
- `scaleMode = "nearest"` sempre (pixel nítido, sem blur).
- Iluminação: cor ambiente fria ("entardecer sombrio") + luzes aditivas quentes (`Lighting.ts`). A atmosfera É a identidade.
- Y-sort de objetos/entidades no mesmo container; chão pré-renderizado em chunks.
- Regra de ouro de cena: **silhueta legível** — jogador, mobs e itens precisam ler contra qualquer chão. Outline + contraste de valor resolvem.

## Mundo — Tiles & Cenário (catálogo + receita · jun/2026)

> O "alinhar 1×" do visual de mundo: o que existe, o que falta, e a receita pra produzir em série. Régua de qualidade = **tileset `grass-dirt` v4** (aprovado jun/2026).

**Tratamento do domínio** (estende as regras de ofício):
1. **Chão é fundo, nunca protagonista** — contraste interno baixo e dessaturado; nenhuma cor de chão compete com criatura/item (silhueta legível). Highlights sutis.
2. **Luz global única** (topo, leve NO); sombra → azul + perde saturação, luz → amarelo + ganha. Pillow-shading proibido.
3. **Estrutura lê como vertical**: topo claro + face frontal escura; outline `#10141c` forte; junta de pedra em sombra fria (`wallJoint`).
4. **Acento quente raro e pontual** (tocha, flor, cogumelo, fogueira) contra o frio dominante — é a identidade.
5. **Densidade 1:1**: tiles 32×32; objetos 64×64 (altos 64×96); só escala inteira. Contact shadow (`makeShadow`) + âncora no pé em todo scatter (y-sort).

**Catálogo (3 camadas, ordem de percepção do olho):**

*Camada 1 — Chão & transições*
| Asset | Uso | Fonte | Status |
|---|---|---|---|
| grama / grama-flores | base do overworld | procedural | mantido |
| terra + Wang grama↔terra | trilhas/estradas | `/create-tileset` | ✅ **v4 aprovado** |
| stoneFloor + Wang terra↔pedra | cidade/dungeon | `/create-tileset` | ✏️ P1 |
| água + Wang grama↔água (margem+espuma) | rio/afluente | `/create-tileset` | ✏️ P1 |
| pântano + Wang grama↔pântano | Charneca | `/create-tileset` | ✏️ P2 |
| ponte (tábuas) | travessias ①③ | procedural | mantido p/ já |

*Camada 2 — Estrutura* (maior ganho — programmer art hoje)
| Asset | Uso | Fonte | Status |
|---|---|---|---|
| muro de pedra (topo+face+cantos int/ext) — **estilo Tibia clássico** | muralha de Alvorada | **procedural autotile** (`makeWallTiles`) | ✅ feito + nuance |
| portão da muralha (madeira+ferro, lintel+postes) | entrada na colina | **procedural** (`makeGate`) | ✅ arte feita · ⏳ placement no sim |
| parede de casa (enxaimel: taipa + vigas) + porta + janela | edifícios de Alvorada | **procedural** (`makeHouseWalls`/`makeHouseWallTile`) | ✅ arte feita · ⏳ `TileId.HouseWall` no sim |
| telhado / interior enterável | edifícios | depende do sistema de andares | ✏️ engine |
| boca de esgoto / escada (visual) | descida à dungeon | `/map-objects` | ✏️ P1 (casa c/ a lógica de escada/buraco — engine) |

> **Decisão casas (jun/2026):** estilo **enxaimel** (taipa clara + vigas de madeira escura), **procedural** (mesmo padrão que venceu no muro). Diferente da muralha, **toda parede mostra a face de taipa virada pro interior** (casa é cômodo, não rampart). Variantes por posição + porta/janela. **Bloqueio de integração:** hoje os edifícios usam `TileId.Wall` (= muralha cinza) no perímetro — o sim precisa de **`TileId.HouseWall`** distinto pros perímetros de edifício pra aplicar o enxaimel. Telhado/interior enterável = sistema de andares (engine).

> **Decisão muro (jun/2026):** o *run* da muralha é **procedural autotile**, não PixelLab. Testados 2 tilesets PixelLab (`muro-topo` granito, `muro-topo-v2` ashlar) — ambos reprovaram: tile 32px detalhado **repetido denuncia a repetição** e fica ruidoso. Procedural ganhou na leitura limpa. A **nuance** (que faltava) entra por: **variantes por posição** (3/máscara) + **musgo/rachaduras procedurais** + **tochas** (decor) + **portão** desenhado casando. Escala (comprimento/altura/andares) e tinta por cidade (LUT) preservadas. Blocos-herói PixelLab (cand-03 etc.) **reprovados p/ muro** (chunky/iso não casa com a leitura plana). **PixelLab fica pras casas** (objeto com textura própria), onde brilha.

*Camada 3 — Enfeites / scatter* (dá vida; hoje só tocha). Integrar exige estender `MapDecor.kind` (shared) + gerador no sim.
| Grupo | Itens | Status |
|---|---|---|
| Vegetação | mato, arbusto, flores, cogumelos, samambaia, juncos (Juncal), vitória-régia | ✏️ P1 |
| Terreno | cascalho, pedra média (✅ rock), toco, tronco caído, raízes | ✏️ P1 |
| Mundo habitado | caixa, barril, saco, poço, cerca/estacas (obras), placa, boneco de treino, carrinho de mina, braseiro | ✏️ P1 |
| Mórbido (gradiente T2) | ossos, caveira, carcaça | ✏️ P2 |

**Receita de tileset (`/create-tileset`, validada jun/2026 — tool `tools/gen-tileset.mjs`):**
- **Async**: POST devolve `202 + tileset_id`; fazer poll em `GET /tilesets/{id}` (~60–100s) até `tiles[]` (16, com `corners` NW/NE/SW/SE). Mapear `lower→0, upper→1` → `wang-<NW><NE><SW><SE>.png` (o glob do `EntityRenderer` carrega automático).
- **Custo real ~1–3 gerações/tileset** a 32px (medido). Sonda `/balance` antes/depois sempre.
- **Armadilha**: o terreno "upper" tende a **regularizar em padrão** (tábua/tijolo) e a paleta **deriva quente/saturada**. **Solução que funcionou**: passar `upper_reference_image` (material granular âncora) + `lower_reference_image` (a grama já aprovada) — trava material e cor; descrição com `no bricks, no planks, no stripes, no repeating pattern`. Params-ouro: `detail: highly detailed`, `shading: detailed shading`, `outline: selective outline` (evita linha de grade), `view: high top-down`.

**Ordem de produção**: P0 muros+portão → P1 scatter da cidade → P1 transições de chão (pedra/água) → P2.

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
- **Painéis** (bolso `Tab`/`I`, equipamento `E`, character `C`, outfit `O`, diário `J`): janelas que abrem e **fecham com a mesma tecla / Esc**. *(impl. jun/2026 — superou o "uma por vez": várias coexistem e são **arrastáveis** pelo header.)*
- **Inventário/equip (impl. jun/2026):** janela de **container** (grade 4-col; uma por mochila/cadáver aberto) + painel de **equipamento** (11 slots, modelo Tibia) + **drag & drop** de itens entre slots. Tudo apresentação pura — a sim valida posse/distância/tipo de slot. Detalhes em `docs/reports/2026-06-07-ui-inventario-equip.md`.
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
- **Janelas (estilo RO):** título na barra superior + corpo + fechar no `Esc`. Sem decoração além de borda/título. **Arrastáveis** pelo header *(impl. jun/2026 — `makeDraggable`)*.
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
- [x] Janelas arrastáveis — **feito** (jun/2026, `makeDraggable`)
- [ ] Barra de cast para skills canalizadas (M1 dirá se precisa)
- [ ] Tela de morte (pune XP — merece peso visual? vinheta vermelha + fade?)
- [ ] Padrão de cor pro PvP futuro (nomes, guildas)
