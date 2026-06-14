# Brief de Props Procedurais — Alvorada (pedido pro chat de arte)

> **Para:** o agente que gera props procedurais (`sprites.ts`).
> **De:** direção de arte / mundo.
> **Objetivo:** matar os dois defeitos que fazem a Alvorada ler como maquete —
> **(1) casas todas iguais** (mesmo telhado/material) e **(2) casas vazias** (zero
> mobília de interior) — e subir a régua dos props que já existem.
>
> Os protótipos `design/pixellab-candidatos/_prop-barril.png`, `_prop-bau.png` e
> `_prop-parede-porta.png` foram **aprovados** como alvo de qualidade. Decisão
> firmada: **props de mundo = procedural** (PixelLab fica só pra char/mob orgânico).
> Este doc é a lista de trabalho derivada deles.

---

## 0. Regras globais (valem pra TUDO abaixo)

- **Outline universal `#10141c`** em toda silhueta externa (`DESIGN-VISUAL.md`). Paleta da fonte: `src/client/palette.ts` — ambiente frio/dessaturado, **luz quente como contraste**. Não inventar matiz novo: puxar dos tons já usados (telha quente base ≈ `122/86/66`; aço azul-acinzentado; latão da fechadura).
- **Grid 128px, exibido 1:1.** Os previews estão ampliados — **todo detalhe fino precisa ser testado no Chrome real em zoom 1** (`npm run dev`). Em especial **ferrugem/speckle**: a 1:1 vira 1–2px e pode ler como ruído/sujeira. Se ficar nervoso, baixa a densidade.
- **`scaleMode = "nearest"`** (já global). Nada de antialias.
- **Silhueta legível primeiro.** A peça tem que ler contra qualquer chão (grama, pedra, terra) antes de qualquer textura.
- **Seed por instância** em tudo que se repete (barril, caixa, tenda, telhado, parede). 5 barris lado a lado na feira **não podem** ser idênticos — variar desgaste, rotação do topo, manchas. Padrão a seguir: o sistema de `makeScatterDecals` (determinístico por tile, sem repetição visível).
- **Sombra de contato é automática** (container `shadows` do `WorldRenderer`) — **não pintar sombra no sprite**, só desenhar a peça ancorada na base `(0.5, 1)`.
- **Toda peça nova = 3 toques** (anotar no PR): `kind` no union de `MapDecor` (`src/shared/types.ts`), função em `sprites.ts`, e `case` no `WorldRenderer.ts`. Peça que **ocupa o tile** seta `blocks: true` (a sim trata como impassável — ver `MOBILIA-URBANA.md §3`). O placement (coords no `maps/alvorada.ts`) é da trilha Mundo, **não** deste chat.
- **Definition of done:** passa em `tools/_smoke-mobilia-collision.ts` (sem overlap, sem tocha/braseiro dividindo tile, blocks honrado) e foi olhado a 1:1.

---

## LANE 0 — Finalizar os 3 protótipos aprovados (rápido, alto impacto)

Já estão desenhados; falta **integrar** com as ressalvas.

| Prop | Função (upgrade) | O que fazer | Estados |
|---|---|---|---|
| **Barril** | `makeBarrel()` | Trocar o cilindro-lata atual pelo alvo **PERFEITO**: bojo (incha no meio), 3 aros, aduelas com costura, ferrugem nos aros. **Adicionar `seed`** → variação por instância. | 1 (estático) |
| **Baú** | `makeChest(open)` | Subir pro alvo do `_prop-bau`: tampa abaulada, bandas de aço com rebite/ferrugem, fechadura de latão. **Manter os 2 estados** (fechado / aberto-saqueado) que a sim usa. Variante visual **lacrado** (fechadura de latão destacada) vs **comum**. | 2 (fechado, aberto) + flag lacrado |
| **Parede/Porta/Janela** | `makeHouseWallTile(mask, seed, feature)` | Subir os 3 `feature` pro alvo `_prop-parede-porta`: **porta** com ferragens+maçaneta de ferro; **parede** com reboco rachado sobre enxaimel; **janela** com moldura de madeira + vidro azul-noite com estrelinhas. **Preservar o autotile** (16 máscaras) e a costura entre tiles. | feature: `null` / `window` / `door` |

---

## LANE 1 — Variedade arquitetônica (mata "casas todas iguais")

**Causa-raiz:** hoje todo prédio usa `makeRoof()` (um só estilo) + `makeHouseWallTile()` (um só material). Precisamos de um **kit de estilos de edifício** pra trilha Mundo poder marcar cada casa com um arquétipo. **Este é o pedido mais importante do doc.**

### 1.1 Telhados — variar `makeRoof(wTiles, hTiles, seed, style)`
Adicionar um parâmetro `style`. Variantes:

| Estilo | Aparência | Onde usa (sugestão) |
|---|---|---|
| `telha` (atual) | Telha quente de barro, 2 águas | casas comuns, lojas |
| `colmo` | Palha/sapê, textura fibrosa, beiral irregular | casas pobres, granja, choupana do mago |
| `ardosia` | Lousa cinza-azulada, fileiras regulares, "importante/frio" | Templo, Câmara, Guilda |
| `tabua` | Telha de madeira (shingle), gasta | Estalagem, Taverna do Cais, barracões |

Cada estilo com **seed** (variação de desgaste/musgo). Beiral/overhang ao norte mantido (porta ao sul fica visível, como hoje).

### 1.2 Materiais de parede — variar `makeHouseWallTile(..., material)`
Mesmo sistema de autotile (16 máscaras + `feature`), trocando o material:

| Material | Aparência | Onde usa |
|---|---|---|
| `enxaimel` (atual) | Taipa creme + vigas de madeira | casas/lojas comuns |
| `pedra` | Cantaria cinza, juntas escuras | Templo, Ferreiro, Quartel, muralha-prédio |
| `taipa_pobre` | Reboco sujo, rachado, vigas tortas | casas pobres, beco, granja |
| `meia_pedra` | Base de pedra + topo de enxaimel | Estalagem, Armazéns |

### 1.3 Adereços de fachada (kinds novos — quebram a igualdade na hora)
| Kind novo | Bloqueia? | Variações | Função | Nota |
|---|---|---|---|---|
| `chamine` | não (no topo da parede) | com fumaça / sem | `makeChimney(smoking)` | Ferreiro e Estalagem **com fumaça** (fonte de vida + telegrafa "forja/cozinha"). Fumaça = animação leve. |
| `estandarte` | não | 3–4 brasões/cores | `makeBanner(seed)` | Guilda, Templo, Câmara. Pendura na fachada. |
| `beiral_lampiao` | não, **emite luz** | — | `makeEaveLamp()` | Lampião pendurado na fachada (luz quente, como tocha). Taverna, Estalagem. **Sozinho no tile** (regra de luz). |

> A `placa` (tabuleta de ofício) **já existe** — pedir pro Mundo usar mais nas fachadas. Se faltar variante de ofício, adicionar em `makeSign(craft)` (hoje: ferreiro/boticário/padaria/genérico).

---

## LANE 2 — Mobília de interior (mata "casas vazias")

**Kinds 100% novos.** Hoje o interior é piso de pedra liso com 1 NPC. Cada prédio precisa ler sua função **por dentro**. Render: mesmo container y-sorted; o telhado já some na aproximação (Tibia-style), então a mobília aparece quando o jogador entra — confirmar y-sort correto sob o telhado que desbota.

### 2.1 Kit base de móveis
| Kind | Bloqueia? | Variações | Função | Usado em |
|---|---|---|---|---|
| `cama` | sim | colchão de palha (pobre) / com cobertor (comum) | `makeBed(style, seed)` | casa inicial, quartos da Estalagem, casas |
| `mesa` | sim | redonda / comprida (taverna) | `makeTable(style, seed)` | Estalagem, Taverna, casas, Câmara |
| `banco` | sim (baixo) | banquinho / banco comprido | `makeBench(seed)` | junto das mesas |
| `lareira` | sim, **emite luz** | acesa / apagada | `makeHearth(lit)` | cozinha da Estalagem (Q6), casas. **Sozinha no tile.** |
| `tapete` | **não** (chão) | 2–3 padrões/cores | `makeRug(seed)` | Templo, Torre, Câmara, casas ricas |
| `estante` | sim | livros / poções / mantimentos | `makeShelf(content, seed)` | Boticário (poções), Torre Arcana (livros), Loja (mantimentos) |
| `vela` / `candelabro` | não, **emite luz** | vela única / candelabro | `makeCandle(kind)` | mesas, Templo. Luz fraca. **Sozinho no tile.** |

### 2.2 Móveis-assinatura (1 por prédio-âncora — dão identidade)
| Kind | Bloqueia? | Função | Prédio |
|---|---|---|---|
| `bigorna` | sim | `makeAnvil()` | **Ferreiro** (par com forja) |
| `forja` | sim, **emite luz quente** | `makeForge(lit)` | **Ferreiro**. (Distinta do braseiro: é a fornalha de pedra.) |
| `caldeirao` | sim | `makeCauldron(seed)` | **Boticário** (poções borbulhando, leve animação opcional) |
| `altar` | não (ou baixo) | `makeAltar()` | **Templo / Santuário (R4)** — foco do respawn |
| `barril_chopp` | sim | reusar `makeBarrel` deitado, ou `makeBarrelTap()` | **Estalagem/Taverna** (barril com torneira no balcão) |

> Reusar o que já existe dentro de casa quando couber: `caixa`, `barril`, `saco`, `lenha`, `balcao` (balcão de loja). O pedido novo é o que dá **função legível** ao cômodo.

---

## LANE 3 — Feira & rua viva (variedade + "quebra-grid")

### 3.1 Tendas da feira — variar `makeStall(seed, awning, goods)`
Hoje `makeStall()` é um modelo só → 5 tendas idênticas na praça. Pedir:
- **Toldo** em 3–4 cores listradas (vermelho/branco, azul/creme, verde, ocre).
- **Mercadoria no balcão** (overlay): legumes / peixe / panos / cerâmica. 1 por tenda.
- Seed varia poste e desgaste do toldo.

### 3.2 Props de rua novos (quebram o grid — `MOBILIA-URBANA.md §72`)
| Kind novo | Bloqueia? | Função | Onde |
|---|---|---|---|
| `varal` | não (alto, pendura) | `makeClothesline(seed)` | becos estreitos entre casas |
| `cocho` | sim | `makeTrough()` | junto a estábulo/granja/poço |
| `carrinho_mao` | sim | `makeWheelbarrow()` | obra, granja, horta |
| `canteiro` | sim (baixo) | `makeGardenBed(crop, seed)` | hortas do portão Sul (GRID §3.4) — fileiras de couve/cenoura |
| `jardineira` | não/baixo | `makePlanter(seed)` | janelas, fachadas |

> `carroça` (`makeCart`), `feno` (`makeHay`), `lenha`, `estacas` **já existem** — pedir reuso, não recriar.

---

## LANE 4 — Polimento (opcional, baixa prioridade)

- **Scatter urbano** em `makeScatterDecals`: adicionar set "praça/rua" (paralelepípedo rachado, poça d'água, palha caída, rastro de lama) — baked no chunk, custo zero. Mata o piso de pedra pelado da praça.
- **Estados de dano** em `barril`/`caixa` (intacto / quebrado) pra dungeon e cenas de saque — só se sobrar tempo.
- **Variante "boca de esgoto"**: `makeManhole` já existe; conferir se lê como grade de ferro a 1:1 (a Q1 aponta o boeiro da praça — precisa ser óbvio).

---

## Resumo de prioridade

| Lane | Entrega | Mata |
|---|---|---|
| **0** | barril/baú/parede no alvo aprovado + integrados | qualidade base |
| **1** | kit de telhado (4) + parede (4) + chaminé/estandarte/lampião | **"casas todas iguais"** |
| **2** | kit de mobília de interior + 5 móveis-assinatura | **"casas vazias"** |
| **3** | tendas variadas + 5 props de rua | "feira/cidade robótica" |
| **4** | scatter urbano, estados de dano | polimento |

**Ordem sugerida:** 0 → 1 → 2 → 3. Lane 1 e 2 são o salto de percepção; Lane 0 destrava elas com a régua de qualidade certa.
