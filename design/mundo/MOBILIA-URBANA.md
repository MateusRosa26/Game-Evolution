# Mundo — Mobília urbana (props de cidade): contrato + placement

> **Sub-doc do hub [DESIGN-MUNDO.md](../../DESIGN-MUNDO.md).** Spec de **F3** (zero código) para **F1 transcrever** em `src/sim/maps/` e **F2 renderizar** em `WorldRenderer`. Cobre o contrato de props ancorados em tile (`MapDecor`) e o **placement concreto da feira ao redor do poço** (§4), o primeiro caso de uso. Coordenadas em **coord-cidade** (origem NW da muralha `(100,80)` local) e **local da fatia** (`local = cidade + (100,80)`), iguais a [`fatia-1-alvorada/GRID.md`](../fatia-1-alvorada/GRID.md) §3.
>
> **Fluxo da feature (AGENTES.md):** F3 (este spec) → F1 (estende `MapDecor.kind` em `src/shared/types.ts` + coloca os decais em `alvorada.ts` + regra de colisão na sim) → F2 (renderiza os novos kinds no container y-sorted + arte do poço). Toda coordenada é **✏️ proposta de layout** — vira código já e afina-se vendo no editor/jogo, sem nova rodada de aprovação por tile.

---

## 1. Vocabulário de props e contrato com o engine

A "mobília urbana" são objetos pequenos ancorados a **um tile**, no MESMO container y-sorted do mundo (zIndex = pixel Y da base — `CLAUDE.md`). Hoje `MapDecor` só carrega `kind: "torch"` (`src/shared/types.ts`). Esta é a **lista-alvo** de kinds:

| `kind` | Sprite (status) | Sólido? | Papel |
|---|---|---|---|
| `torch` | `sprites.torchFrames` ✅ existe | **não** | luz; já implementado (postes/cantos) |
| `stall` | `sprites.stall` ✅ existe | **sim** | tenda de feira — o volume visual do mercado |
| `barrel` | `sprites.barrel` ✅ existe | **sim** | barril — mercadoria/clutter ao lado das tendas |
| `crate` | `sprites.crate` ✅ existe | **sim** | caixa — idem barril |
| `well` | ❌ **NÃO existe** — pedir ao `diretor-de-arte` | **sim** | **poço** — o landmark que dá nome à praça |

**Único bloqueio de arte:** o **poço** (`well`) ainda não tem sprite. Os outros três (`stall`/`barrel`/`crate`) já existem em `sprites.ts` (vistos no `spriteLab`), então F2 só precisa **ligar os kinds no `WorldRenderer`**. Enquanto o poço não existir, F1 pode plantar o decor `well` e F2 cai num placeholder (ex.: reusar `manhole`/uma pedra) sem travar o resto da feira.

### 1.1 Solidez (decisão de F1)
`MapDecor` hoje não carrega colisão. Props de mercado **bloqueiam passo e pathfinding** (A* da sim); a `torch` não. Recomendação (✏️ implementação é de F1): um conjunto-constante na sim, p. ex. `const SOLID_DECOR = new Set(["stall","barrel","crate","well"])`, em vez de inchar `MapData` com um campo por decor. O dado de mapa fica enxuto; a regra mora na sim. O **poço** e cada tenda/barril/caixa ocupam **1 tile de colisão** cada (o sprite pode transbordar visualmente; a colisão é 1 tile, na convenção do grid).

---

## 2. Princípios de placement (valem para qualquer cidade)

1. **Diegese antes de enfeite** (`DESIGN-FILOSOFIA.md`): props contam o que o lugar é (mercado vivo, becos com valor escondido), não preenchem espaço vazio.
2. **Nunca bloquear o funcional.** Um prop sólido jamais cobre: tile de **porta** de edifício, **boca de esgoto/bueiro** (descida de quest), **tile de portão**, ou a **rota mínima** que liga cada entrada da praça ao seu destino. Lista de tiles reservados sempre explícita (§4.2).
3. **Deixe o hub fluir.** A praça é o nó de rotina (depot/lojas/feira); mantém um **eixo caminhável** atravessando-a — Tibia-style, praça com obstáculos mas nunca um labirinto.
4. **Agrupe com intenção.** Tendas = âncoras de volume; barris/caixas = mercadoria *encostada* nas tendas (não espalhada solta). Clutter lê como "comércio", não como "lixo de nível".
5. **A luz já posta fica.** As tochas existentes da praça definem o clima noturno do mercado — props novos não pisam em tile de tocha.

---

## 3. Tochas da praça (registro — já implementado)

Já em `alvorada.ts`: 4 tochas de canto da praça em coord-cidade **(34,35) (41,35) (34,43) (41,43)**. São a iluminação social da Baixa à noite. Permanecem; a feira se acomoda **entre** elas. (Aqui só para o placement da §4 não colidir.)

---

## 4. A feira ao redor do poço — Praça do Poço (Baixa) ⟵ *deliverable*

### 4.1 Contexto espacial (consome GRID §3.3/§3.4 + `alvorada.ts` atual)
- **Piso da praça** (pedra): coord-cidade `[33..42]×[34..44]` (10×11), já preenchido em `alvorada.ts`.
- **Bueiro da Praça** (E01, **Q1** aponta; futura escada p/ esgoto A1): coord-cidade **(36,38)** — já no mapa.
- **Entradas da praça** (fim das ruas, de `alvorada.ts`): **NE (38,34)**, **Oeste (33,38)**, **Sul (33,42)**, **Porta d'Água (42,44)**.
- **Poço (well):** o GRID dava âncora ✏️ `(36,34)`; **refino aqui** para o centro visual da praça → **(37,39)**, encostado no bueiro `(36,38)` (diagonal NW). Essa vizinhança **poço↔bueiro** é intencional (§4.5 — gancho da Q10).

### 4.2 Tiles RESERVADOS (nenhum prop sólido pode cair aqui)
Bueiro **(36,38)** · Poço **(37,39)** (ele mesmo é o prop, mas as 4 bordas cardeais ficam livres p/ aproximar) · Tochas **(34,35)(41,35)(34,43)(41,43)** · Entradas **(38,34)(33,38)(33,42)(42,44)** · **eixo vertical x=38, y 35→39** (espinha caminhável N→centro).

### 4.3 Mapa ASCII proposto (coord-cidade)
```
   cx→  33  34  35  36  37  38  39  40  41  42
cy 34    .   .   .   .   .   ▼   .   .   .   .     ▼ entrada NE (livre)
cy 35    .   T   ◣   .   .   |   .   .   T   .     T tocha · ◣ tenda · | espinha
cy 36    .   ▪   .   .   .   |   .   .   ▪   .     ◣ tenda (35,36)/(40,36)
cy 37    .   ▣   ▪   .   .   |   ▪   .   ▣   .     ▪ barril · ▣ caixa
cy 38    ►   .   .   ⊕   .   |   .   .   .   .     ► entrada O · ⊕ bueiro
cy 39    .   .   .   .   ◯   |   .   .   .   .     ◯ POÇO (37,39)
cy 40    .   .   .   .   .   .   .   .   .   .
cy 41    .   .   .   ▪   .   .   ▪   .   .   .
cy 42    ►   .   ◣   .   ▣   .   .   ◣   .   .     ► entrada S · tendas (35,42)/(40,42)
cy 43    .   T   .   .   .   .   .   .   T   .
cy 44    .   .   .   .   .   .   .   .   .   ◄     ◄ entrada Porta d'Água
```
Leitura: 4 tendas nos quadrantes (canto NW/NE/SW/SE), barris/caixas encostados nelas como mercadoria, o **poço** central com o **bueiro** colado a NW, e a **espinha x=38** aberta de cima ao centro. Há rota caminhável de cada uma das 4 entradas até o poço/bueiro (verificada à mão; afinável no editor).

### 4.4 Tabela de placement (F1 transcreve)
> `local = cidade + (100,80)`. Todos **✏️**. `solid` conforme §1.1.

| # | kind | coord-cidade | local | solid | Nota |
|---|---|---|---|---|---|
| W1 | `well` | **(37,39)** | **(137,119)** | sim | poço — landmark/nome da praça; arte pendente (§1) |
| S1 | `stall` | (35,36) | (135,116) | sim | tenda NW |
| S2 | `stall` | (40,36) | (140,116) | sim | tenda NE |
| S3 | `stall` | (35,42) | (135,122) | sim | tenda SW |
| S4 | `stall` | (40,42) | (140,122) | sim | tenda SE |
| B1 | `barrel` | (34,36) | (134,116) | sim | mercadoria — tenda NW |
| B2 | `barrel` | (41,36) | (141,116) | sim | mercadoria — tenda NE |
| B3 | `barrel` | (35,37) | (135,117) | sim | mercadoria — tenda NW |
| B4 | `barrel` | (39,37) | (139,117) | sim | mercadoria — tenda NE |
| B5 | `barrel` | (36,41) | (136,121) | sim | mercadoria — tenda SW |
| B6 | `barrel` | (39,41) | (139,121) | sim | mercadoria — tenda SE |
| C1 | `crate` | (34,37) | (134,117) | sim | caixa — tenda NW |
| C2 | `crate` | (41,37) | (141,117) | sim | caixa — tenda NE |
| C3 | `crate` | (37,42) | (137,122) | sim | caixa — entre tendas S |

Total: **1 poço + 4 tendas + 6 barris + 3 caixas = 14 props**. Densidade alvo: mercado legível, não labirinto. Reduzir/crescer é trivial no editor — esta é a base.

### 4.5 Lore / flavor (Loremaster)
A **Praça do Poço** é o coração de rotina da Baixa: é onde a cidade se cruza entre o depot, as lojas e a feira. O poço é o **weenie** doméstico — o ponto que orienta "voltei ao centro".

E é **diegese de gancho**: o bueiro encostado no poço não é acaso. A **Q10 — A Água do Poço** abre com *"A água do poço baixo anda turva. Os outros não sentem o gosto. Eu sinto. Vem de baixo — sempre vem de baixo."* (QUESTS.md). O jogador que repara na grade ao lado do poço **liga os pontos sozinho**: o que sobe pela água vem do esgoto logo abaixo — o **primeiro fio da Contaminação** (DESIGN-LORE §7), sem o jogo nunca pronunciar a palavra. Manter poço (W1) e bueiro (36,38) **adjacentes** é o que faz essa rima funcionar sem texto.

> **Pedido ao `diretor-de-arte`:** sprite do **poço** 32px, dark medieval, anchor-bottom (mesmo contrato de `stall`/`barrel`). Detalhe que paga a lore: a **água visivelmente turva/esverdeada** na boca do poço — pista ambiental da Q10 antes de qualquer diálogo. ✏️

### 4.6 Checklist de handoff
**F1** (`src/shared/types.ts` + `src/sim/maps/alvorada.ts`):
- [ ] Estender `MapDecor.kind` → `"torch" | "stall" | "barrel" | "crate" | "well"`.
- [ ] Definir solidez (`SOLID_DECOR`) e ligar na colisão/pathfinding da sim (§1.1).
- [ ] `push` dos 14 decais da §4.4 na praça (usar helper `city(cx,cy)` já existente).
- [ ] Garantir que nenhum prop sólido caia nos tiles reservados (§4.2) — vale um `assert`/log no editor.

**F2** (`WorldRenderer` + `assets/`):
- [ ] Renderizar os kinds `stall`/`barrel`/`crate` (sprites já existem) no container y-sorted (zIndex = pixel Y da base).
- [ ] Criar o sprite **`well`** (ou placeholder até o `diretor-de-arte` entregar) — água turva (§4.5).

---

## 5. Pendências ✏️
- [ ] **Arte do poço** — `diretor-de-arte` (único bloqueio; resto é fiação).
- [ ] **Coordenadas finas** — afinar vendo no editor/jogo (todas ✏️).
- [ ] **Decisão de solidez** — confirmar `SOLID_DECOR` vs. campo por decor (F1).
- [ ] **Reuso em outras cidades** — quando Charneca/Brumal entrarem, §1–§3 valem; cada uma ganha seu §4-equivalente (feira/praça própria). Por ora só Alvorada.
- [ ] **Hortas (GRID §3.4, `[16..24]×[50..56]`)** — forrageio; mobília própria (canteiros/cercas) fica para um §-irmão quando a colheita entrar.
