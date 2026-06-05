# Fatia ① Alvorada — GRID (spec implementável do mapa) · **PROPOSTA**

> Espacialização do layout aprovado `design/rascunhos/alvorada-v4.html` (fonte da verdade espacial) em coordenadas de tile. Consome: `QUESTS.md` (cada referência espacial precisa existir aqui) · `ITENS-LOOTS.md` (mobs por spot, compradores) · `DESIGN-MUNDO.md` (orçamentos: 800×800 macro, ~20–30 baús MVP piramidais, cluster de utilidade + NPCs espalhados, casa inicial, spawn sem classe). World-designer: esqueleto de Lynch, gradiente de perigo, telegrafia, custo de fuga crescente.
>
> **Esta é uma PROPOSTA.** Toda escolha posicional arbitrária está marcada ✏️ — a decisão final é do criador. Nada aqui está "decidido". Não inventei mecânica nova: só dei lugar e coordenada ao que já está desenhado.
>
> **Método de derivação das coordenadas:** as posições saem das proporções das três pranchas do v4 (Constelação 1000×840, Cidade 820×640, Esgotos corte 820×360), reprojetadas no recorte de tiles abaixo. São aproximações de layout para o engenheiro começar — todas ✏️, afináveis ao colocar no editor.

---

## 0. Sistema de coordenadas (declarado)

- **Macro do MVP:** 800×800 tiles (`DESIGN-MUNDO.md` §recorte). A fatia ① é um **recorte retangular** desse macro.
- **Recorte proposto da fatia ① ✏️:** retângulo **`[x 220..560] × [y 120..460]` = 340×340 tiles** do macro 800×800. Alvorada fica na curva do afluente, deslocada do centro do macro para o quadrante centro-oeste (deixa espaço a leste para o rio grande / Atalaia / Pontal, e ao sul para Charneca). ✏️ posição do recorte no macro — só Alvorada e Charneca são cidades de spawn do MVP, então as duas dividem a metade sul/oeste do macro.
- **Coordenadas LOCAIS da fatia (usadas no resto do doc):** origem **`(0,0)` no canto superior-esquerdo do recorte**, eixo **+X para leste**, eixo **+Y para sul** (convenção de tela / mesma do engine: zIndex = pixel Y da base). Então a fatia local vai de `(0,0)` a `(340,340)`.
  - Conversão p/ macro: `macro = local + (220,120)` ✏️.
- **Unidade:** 1 tile = 32 px (engine). Régua do v4: "30 tiles ≈ 7,5s" de caminhada ⇒ ~4 tiles/s a pé.
- **Notação de POI:** `(x,y)` é o tile-âncora (entrada/porta/centro do spawn). Retângulos de área: `[x0..x1]×[y0..y1]`.
- **Andares de dungeon:** mapas SEPARADOS (`DESIGN-MUNDO.md` — dungeon não consome overworld). Esgoto A1/A2/A3 têm seu próprio sistema de coordenadas local (§7), ligados ao overworld por bocas/escadas.

> Toda coordenada abaixo é ✏️ — proposta de layout, não medida final.

---

## 1. Visão macro da fatia (mini-mapa ASCII — escala grossa, 1 célula ≈ 20 tiles)

Local `(0,0)` = canto sup-esq. Norte ↑. O afluente (`~`) costura de NE → centro → S; a cidade (`███`) está na colina da curva.

```
        x→ 0        60       120      180      240      300      340
   y    +----------+--------+--------+--------+--------+--------+
   0  ↑ |  planíc. .  GRUTA  .       .   ~~~  . floresta NE     |  ↗ BRUMAL
        |  oeste   . MORCEGOS.       .  ~ VAU~. (gradiente T1→T2)
   40   | (T1)     .         .  TOCA . ~②~    .  ACAMP.GOBLIN    |
        |          .         . LOBOS . ~     .   ↘CAVERNA GOBLIN |
   80   | GRANJA·──·── estrada O ──███████ ──·─ estrada NE ─~────|· · MINAS
        | (T1)     .         .██ ALVORADA██ NINHO ARANHAS (T2)   |   PERDIDAS
  120   |          .         .██ colina  ██  .  ~       .        |   (NE remoto)
        | planíc.  . PONTE DE ·███████████─·─── estrada LESTE ──→|→ ATALAIA/
  160   | (T1)     . ALVORADA①.   ↓esgoto. ~JUNCAL~  .           |  PONTAL(balsa)
        |          .         .  ↓saída  .  ~FUNDEIROS~  PEDRAS④  |
  200   |          .         .  margem  . ~ (T1→T2)~   (segredo) |
        |          .         .   ~~~~   .~~  .        .          |
  240   |          .  MOINHO  .  ~      .~ MATAGAL    .          |
        |          .  VELHO   . ~PONTE  .  JAVALIS    .          |
  280   |          . (corvos) .  DOS    .   (T2)      .          |
        |          .         . BANDIDOS③.            .          |
  320   |          .  pântano .  ~~~~~  . pântano S   .          |
        | ↓ CHARNECA ─────────·─~~~~~~~~─·──────────────────────→|
  340   +----------+--------+--------+--------+--------+--------+
```

Legenda: `███` muralha/cidade · `~` afluente/água · `①②③④` travessias · `·` estrada/trilha. A ⑤ (galeria alagada do esgoto) é subterrânea — ver §7.

**Esqueleto de Lynch da fatia:**
- **Paths:** as 4 estradas que saem dos 4 portões (O, NE, Leste/Porta d'Água, S) + as trilhas dos spots.
- **Edges:** o **afluente** (costura/edge dominante, cruzável em 5 lugares graduados) · a **muralha** da cidade · o **pântano S** (borda mole de letalidade) · a **floresta NE** (gradiente de perigo).
- **Districts:** Cidade (Alto/Baixa/Cais) · campo manso O · floresta-perigo NE · pântano-bandido S · esgoto subterrâneo.
- **Nodes (interseções de decisão):** os 4 portões · a Ponte de Alvorada · o vau · a boca de cada spot.
- **Landmarks / weenies:** a **Árvore Sagrada** no horizonte oeste (já no v4) · a **muralha + Torre Arcana/Templo** da capital (silhueta visível de longe) · o **Moinho Velho** (silhueta sul) · a **balsa fechada + telhados de Pontal** na margem leste (promessa macro).

---

## 2. O afluente, travessias e estradas

### 2.1 Afluente (edge dominante)
Serpenteia NE → centro → S em diagonal (v4 Prancha A). Curso proposto em tiles locais (polilinha ✏️, ~6–8 tiles de largura no leito, raso nos vaus):

`(258,0) → (224,40) → (190,80) → (170,120) → (165,150) → (175,185) → (200,215) → (235,250) → (255,290) → (262,330) → (255,340)`

— mais o **rio grande** correndo pela borda **leste** do recorte (`x≈300..340`), com **Atalaia/balsa/Pontal** do outro lado (fora do recorte, visível). ✏️

### 2.2 As 5 travessias (graduadas — do trivial ao secreto)

| # | Travessia | Tipo | Âncora local ✏️ | Quem cruza | Refs |
|---|---|---|---|---|---|
| ① | **Ponte de Alvorada** | livre, vigiada | `(150,148)` (colada na muralha, Porta d'Água) | qualquer um | a razão da cidade existir; Q4 cruza p/ leste |
| ② | **Vau raso (NE)** | livre | `(212,50)` | qualquer um | estrada NE → Brumal; Q5/Q8 |
| ③ | **Ponte dos Bandidos (S)** | pedágio (T2) | `(165,272)` | quem vence o pedágio | Q9; spot Bandidos |
| ④ | **Pedras no junco** | escondida | `(190,160)`✏️ no Juncal | o curioso/atento | Q14 (segredo) → margem leste |
| ⑤ | **Galeria alagada do esgoto A2** | secreta (dungeon) | sai em `(255,170)` margem leste ✏️ | quem achou no A2 | desemboca fora da muralha; §7 |

### 2.3 Estradas (paths)
Linhas tracejadas do v4. Saem dos 4 portões:
- **Estrada Oeste:** portão O `(112,98)` → Granja `(40,90)` → planícies. ✏️
- **Estrada NE:** portão NE `(150,80)` → vau ② `(212,50)` → floresta/acampamento → Brumal (sai pelo canto NE). ✏️
- **Estrada Leste / Porta d'Água:** Ponte de Alvorada ① `(150,148)` → margem leste → Atalaia (sai pelo `x=340`). ✏️
- **Estrada Sul (do pântano):** portão Sul `(120,178)` → ponte dos bandidos ③ → Charneca (sai pelo `y=340`). ✏️

---

## 3. A cidade de Alvorada (intramuros) — ~60×60 tiles

> Prancha B do v4 reprojetada. **Âncora da cidade no recorte ✏️:** muralha ocupa `[100..170]×[80..150]` local (a colina da curva). A cidade é a **zona segura / hub** (depot + mercado + praça). Origem local da cidade para detalhe fino: o resto desta seção usa **coordenadas-cidade `(cx,cy)`** com origem no canto NW da muralha `(100,80)` local — então `local = cidade + (100,80)`. Cidade ~60×60.

### 3.1 Muralha e portões

| Elemento | Coord-cidade ✏️ | Notas |
|---|---|---|
| Muralha (anel) | perímetro `~[2..58]×[2..58]` | fechada N/L; **trecho O/S em obras (estacas)** — gancho físico do v4, gap atravessável visível mas "não-terminado" |
| **① Portão NE** | `(40,2)` | → vau → Brumal — "a estrada da fronteira" |
| **② Portão Sul** | `(20,58)` | → ponte dos bandidos → Charneca — "a estrada do arco (via perigo)" |
| **③ Portão Oeste** | `(2,30)` | → granja/planícies — "o campo manso, saída do novato" |
| **④ Porta d'Água** | `(56,52)` | → Ponte de Alvorada → leste (Atalaia) — "a razão da cidade" |

### 3.2 Distritos

- **ALTO** (`cy ~6..30`, norte da cidade) — fé e arcano; weenie da cidade (silhuetas do Templo + Torre).
- **BAIXA** (`cy ~28..52`, centro/sul) — praça, mercado, ofícios; o **cluster de utilidade** (Depot + lojas + poço) — o hub de rotina.
- **CAIS** (`cx ~44..58`, leste, junto à Porta d'Água/afluente) — taverna, becos, armazéns, balsa; onde "o valor se esconde nos cantos".

### 3.3 Edifícios-âncora (cada um com 1 porta = tile de entrada)

| Edifício | Distrito | Porta (coord-cidade) ✏️ | Papel / quest |
|---|---|---|---|
| **Estalagem do Vau** | Baixa | `(20,42)` | Bartolo (Q1) + Bento cozinheiro (Q6); **porão** dos ratos; fogueira fixa (cozinha) |
| **Loja Geral** | Baixa | `(24,38)` | Olinda (Q2); vendor geral (vendor floor); corda/pá/tochas |
| **Boticário** (loja de Poções) | Baixa | `(31,38)` | Anselmo (Q3); vende Vida Pequena; compra reagentes pós-quest |
| **Ferreiro** | Baixa | `(20,28)` | Duarte (Q4, Q9); compra sucata/armas pós-quest |
| **Depot** | Baixa | `(38,32)` | banco/armazém — cluster de utilidade; R2 (Mage) busca o tomo aqui |
| **Praça do Poço** (+ **bueiro**) | Baixa | centro `(36,34)`; **bueiro `(36,38)`** | hub; o **bueiro** = boca de esgoto principal (Q1 aponta) |
| **Câmara (prefeito)** | Baixa | `(46,46)` | civismo/flavor; ✏️ futura quest-hub |
| **Quartel da Guarda** | embutido na muralha O | `(8,36)` | Capitão Vidal (Q5, Q8, Q9-elo); bounty de orelhas |
| **Capela do Coveiro** (+ cemitério) | Alto, junto muralha N | `(15,12)` | Custódio (Q10); gancho do arco na capital; boca de esgoto "Capela" |
| **Templo** (+ **Santuário** de respawn) | Alto | Templo `(20,14)`; **Santuário `(16,22)`** | R4 (Priest): oferenda+chama no Santuário; respawn da fatia |
| **Torre Arcana** | Alto | `(30,18)` | R2 (Mage): braseiro × cristal (fogo/gelo) |
| **Guilda dos Guerreiros** (+ pátio) | Alto-Leste | `(44,18)` | R1 (Knight): instrutor + boneco de treino no pátio |
| **Taverna do Cais** | Cais | `(50,30)` | Tobias o bêbado (Q12); Taverneiro (elo Q9) |
| **Beco dos Ladinos** | Cais | entrada `(52,38)`; esconderijo `(54,40)`✏️ | R3 (Rogue): "terceira pedra contando da sarjeta" |
| **Armazéns** | Cais | `(50,46)` | flavor; ✏️ |
| **Balsa (FECHADA)** | Cais, à água | `(58,48)` | promessa macro: Pontal na outra margem; gancho Q4 |
| **Casa inicial (tutorial)** | Baixa ✏️ | `(28,46)` ✏️ | **nascimento** (`DESIGN-MUNDO.md` §casa inicial): NPC-guia + containers domésticos (Gibão Roto, Botas Surradas, Espada Cega, Sacola de Pano) + 1ª chave abre a porta de saída |

### 3.4 Hortas e feira (forrageio leve / flavor)
- **Hortas** junto ao portão Sul: `[16..24]×[50..56]` — forrageio (morangos/colheita, `ITENS-LOOTS.md` §comida).
- **Feira (tendas)** ao redor do poço: `[33..40]×[37..42]`.

### 3.5 Mini-mapa ASCII da cidade (1 célula ≈ 6 tiles-cidade)

```
   cx→ 0    8    16   24   32   40   48   56
cy  +----+----+----+----+----+----+----+----+
 2  | ###=====①PORTÃO NE=========### muralha |
 6  | #  CAPELA  TEMPLO   TORRE  GUILDA    # |
10  | #  +cemit  ⛪Δ      Δarcana ⚔pátio   # |
14  | #         SANTUÁRIO(respawn)          #|
18  | #  ── ALTO (fé/arcano · weenie) ──    #|
22  | #                                     #|
26  | #  FERREIRO                           #|
30  ③═O   QUARTEL    PRAÇA⊕bueiro   DEPOT  #|  →água
34  | #          [LOJA·BOTIC·feira]   TAVERNA#|→ CAIS
38  | #          casa-inicial      BECO LADIN#|
42  | #  ESTALAGEM do Vau           ARMAZÉNS #|
46  | #          CÂMARA             BALSA✗   #|→ Pontal
50  | #  hortas                          ④  #|→ Ponte
54  | #~~obras(estacas)~~                  d'Água
58  | ###=====②PORTÃO SUL===================##|
    +----+----+----+----+----+----+----+----+
       ↓ Charneca
```

---

## 4. NPCs da fatia (nome · papel · posição)

> Elenco de `QUESTS.md` + `ITENS-LOOTS.md`. Posições em **coord-cidade** salvo indicação. Distribuição: cluster de utilidade na Baixa, sussurradores/compradores espalhados (`DESIGN-MUNDO.md` §distribuição urbana). Nomes batizados pelo Loremaster (jun/2026).

| NPC | Papel | Distrito | Posição ✏️ | Quests / comércio |
|---|---|---|---|---|
| **Bartolo** | Estalajadeiro | Baixa (Estalagem) | `(20,42)` | Q1 Ratos no Porão |
| **Bento** | Cozinheiro da estalagem | Baixa (Estalagem, cozinha) | `(22,43)` | Q6; trade ingredientes/pratos; receita do Ensopado |
| **Olinda** | Lojista (Loja Geral) | Baixa | `(24,38)` | Q2 A Mochila; vendor geral |
| **Anselmo** | Boticário | Baixa | `(31,38)` | Q3 Reagentes; vende Vida Pequena; compra reagentes |
| **Duarte** | Ferreiro | Baixa | `(20,28)` | Q4 Entrega, Q9 Estrada Roubada; compra sucata/armas |
| **Capitão Vidal** | Guarda-capitão | Muralha O (Quartel) | `(8,36)` | Q5, Q8, elo de Q9; bounty de orelhas |
| **Custódio** | Coveiro | Alto (Capela) | `(15,12)` | Q10 Água do Poço; ✏️ trade de restos (fatia ②) |
| **Amaro** | Caçador-peleteiro (civil) | Cais | `(48,42)` ✏️ | Q7 A Caçada do Peleteiro; trade de peles/couro/presas |
| **Tobias** | Bêbado da Taverna | Cais (Taverna) | `(50,30)` | Q12 Os Corvos do Moinho (sussurrador) |
| **Taverneiro** | Taverna do Cais | Cais (Taverna) | `(51,29)` ✏️ | elo de Q9 (ouviu alguém gastando demais) |
| **Firmino** | Mineiro aposentado | Baixa (canto) | `(26,30)` ✏️ | Q13 As Minas Perdidas (sussurrador puro — "pó de pedra na voz") |
| **NPC-guia** (tutorial) | guia da casa inicial | Baixa (casa inicial) | `(28,46)` ✏️ | nascimento; ensina container→chave→porta |
| Instrutor de armas | rito Knight | Alto (Guilda) | `(44,18)` | R1 (pátio + boneco) |
| Arcanista | rito Mage | Alto (Torre) | `(30,18)` | R2 (tomo no Depot; braseiro × cristal) |
| Contato do beco | rito Rogue | Cais (Beco) | `(52,38)` | R3 (esconderijo) |
| Monge | rito Priest | Alto (Templo) | `(20,14)` | R4 (oferenda + chama; luva sem comentário) |
| Vigia de Atalaia | dá/recebe pacote | **fora do recorte**, estrada leste | `(340,150)`✏️ borda | destino de Q4 (Atalaia, outra margem) |

> Total: ~17 NPCs falantes na fatia. ✏️ posições finas — a regra é cluster de rotina + cantos escondendo valor.

---

## 5. Spots de caça (os 12) — retângulos, espécies, spawns propostos

> Coords em **local da fatia**. Mobs de `ITENS-LOOTS.md`. Densidade/respawn = ✏️ Balancista na sim; aqui proponho **nº de spawns** (slots simultâneos) como ponto de partida. Gradiente de perigo: T1 colado na cidade, T2 mais longe; **custo de fuga cresce** com a distância (modelo OSRS).

| # | Spot | Área `[x0..x1]×[y0..y1]` ✏️ | Tier | Espécie(s) | Spawns ✏️ | Conexões / refs |
|---|---|---|---|---|---|---|
| S1 | **Planícies** (O/SO) | `[10..70]×[60..200]` | T1 | Rato Lanhoso, Lobo Cinzento | 8–10 espalhados | estrada O; transição com Granja |
| S2 | **Granja** (celeiros) | `[20..55]×[80..100]` | T1 | Rato Lanhoso | 4–6 | Q2 (fardo); portão O |
| S3 | **Gruta dos Morcegos** | âncora `(135,58)`, gruta `[125..150]×[48..68]` | T1 | Morcego Sanguessuga | 6–8 | Q3; barranco N da colina |
| S4 | **Toca dos Lobos** | âncora `(160,90)`, `[145..180]×[78..105]` | T1 | Lobo Cinzento | 6–8 | Q5; orla da mata; Q6 (carne) |
| S5 | **Acampamento Goblin** | `[185..230]×[35..70]` | T1 | Goblin Batedor | 8–10 | Q8 ato 2; trilha do vau |
| S6 | **Caverna dos Goblins** | boca `(240,40)`✏️ (dungeon/mapa sep. ou bolsão) | T1→T2 | Goblin Batedor; **Orc Soldado** (fundo, named-ish) | 8–12 + 1 Orc | Q8 ato 3; **baú guardado** no fundo |
| S7 | **Ninho de Aranhas** | `[260..300]×[60..90]`, sem trilha | T2 | Aranha-das-Cavernas | 5–7 | fundo da mata NE; caminho curioso |
| S8 | **Minas Perdidas** | boca `(330,30)`✏️ NE remoto (dungeon/bolsão) | T1→T2 | ✏️ (T1→T2; sons que "respondem") | 6–8 | Q13; **baú guardado** no fundo; carrinhos enferrujados na boca |
| S9 | **Juncal dos Fundeiros** | `[175..205]×[150..185]` | T1→T2 | Goblin Fundeiro (ranged através da água) | 6–8 | Q14 (pedras ④); atiram do outro lado |
| S10 | **Matagal dos Javalis** | `[235..275]×[230..270]` | T2 | Javali de Presas (territoriais); **Javali Velho/Presa-Torta** (named, respawn lento ✏️20–30min) | 6–8 + 1 named | Q6 (carne), Q7 (peles + named) |
| S11 | **Bandidos da Ponte** | `[150..185]×[260..290]` | T2 | Bandido da Estrada | 5–7 | Q9 (recuperar carga); ponte ③; Q11 (carta-loot) |
| S12 | **Moinho Velho** (corvos) | âncora `(60,250)`, porão (interação ⬇) | — caça leve | corvos (ambiente, sobrevoam); **porão** = baú | — | Q12; silhueta-weenie sul; sinais de bandido → ponte |

> **Cobertura por faixa (`world-designer` regra 7 — 2–3 spots por faixa):**
> - **T1 cedo:** S1, S2, S3, S4, S5 (≥5 spots — sobra folga para o novato).
> - **T1→T2:** S6, S8, S9.
> - **T2:** S7, S10, S11.
> O lugar mais seguro (cidade/Planícies coladas) **não** é o mais lucrativo — os T2 longe pagam mais (regra de ouro 4).

> **Esgoto (spots subterrâneos)** ficam no §7 (A1 ratos T1, A2 escaravelhos/aranhas T2, A3 ghouls T3).

---

## 6. Telegrafia, ritmo e gradiente de perigo (notas de level design)

- **Soft gates de letalidade** (regra de ouro 6): o **pântano S** e o **Matagal dos Javalis** (T2 territoriais) cercam a estrada sul → placa de "ainda não" sem chave para quem sai cedo demais pela ponte. A **floresta NE** sobe T1→T2 com a profundidade (acampamento T1 → caverna/orc T2 → ninho de aranhas T2 sem trilha).
- **Promessas visíveis** (regra 5): **balsa fechada + Pontal** na margem leste (a promessa macro, plantada por Q4) · **baú LACRADO nv 10** à vista no esgoto A2 · a silhueta da **Caverna dos Goblins** ao fundo da trilha NE.
- **O caminho rápido × o caminho curioso** (regra 9): toda saída tem rota direta (estrada) E cantos que pagam — pedras no junco ④ (Q14), galeria alagada ⑤ (Q15), porão do moinho (Q12), boca da mina remota (Q13).
- **Custo de fuga crescente:** esgoto A1 raso/multi-saída → A2 dungeon de verdade → A3 só por mergulho (sem rota fácil de volta). Minas e Caverna no NE remoto = longe do Santuário.
- **Vista/trégua (beats Valve):** clareira segura depois do covil; a colina da cidade como overlook que re-orienta ao próximo weenie.

---

## 7. Esgotos de Alvorada — A1 / A2 / A3 (mapa separado, 3 andares)

> Prancha C do v4. Sistema de coordenadas **próprio** do esgoto (mapa separado), origem `(0,0)` no canto NW da planta de cada andar. Ligado ao overworld pelas **5 bocas** + descidas internas. **Custo de fuga cresce a cada andar** (OSRS).

### 7.1 Bocas de esgoto na cidade (entradas A1) — coord-cidade

| Boca | Coord-cidade ✏️ | Espelha (superfície) |
|---|---|---|
| Capela | `(15,13)` | Capela do Coveiro (Alto) — Q10 entra aqui ou pela Praça |
| **Praça (bueiro principal)** | `(36,38)` | Praça do Poço — **Q1 aponta este** |
| Depot | `(38,33)` | Depot |
| Cais | `(50,40)` | junto aos Armazéns |
| Guilda | `(44,20)` | pátio da Guilda |
| **Saída secreta na margem** | overworld `(255,165)`✏️ (FORA da muralha) | deságua do A1; travessia ⑤ via A2 |

### 7.2 ANDAR 1 — galerias rasas (T1)
- **Planta ✏️:** `~[0..150]×[0..40]` (corredor largo conectando as 5 bocas — **atalho urbano** por baixo).
- **Spawns:** Rato Lanhoso, ~6–8. **Morcego Sanguessuga** nas partes mais ao N (transição com a Gruta) ✏️.
- **Saídas:** as 5 bocas (subida) + **deságua na margem leste** (saída secreta `(255,165)`) + 2 descidas para A2.
- **Descidas A1→A2 ✏️:** `(40,38)` e `(110,38)` (escadas; o v4 mostra duas).

### 7.3 ANDAR 2 — galerias antigas (T2)
- **Planta ✏️:** `~[20..120]×[44..58]` (menor que A1; dungeon de verdade).
- **Spawns:** Aranha-das-Cavernas (T2), Escaravelho de Cripta (T1), ~5–7.
- **Q10 — alvenaria antiga manchada (`interact`):** `(70,50)` ✏️ — "mais velha que a cidade"; gancho do arco. Sussurrador: o Coveiro a aponta.
- **Baú LACRADO (nv 10):** `(112,48)` ✏️ — **visível antes, abrível depois** (promessa de early game à vista).
- **Galeria alagada → margem leste (travessia ⑤):** boca em `(118,49)` ✏️ → desemboca no overworld `(255,170)`. Travessia secreta do rio.
- **Passagem ALAGADA → A3 (Q15):** `(40,57)` ✏️ — mergulho curto que "quase ninguém nota".

### 7.4 ANDAR 3 — o Porão Afogado (T3) — bolsão
- **Planta ✏️:** `~[40..80]×[60..70]` (minúsculo — **não é spot de farm, é arrepio**).
- **Spawns:** 1–2 **Ghouls** (T3) — `ITENS-LOOTS.md` loot ✏️ (família-coração, fatia ②).
- **Baú:** ✏️ — decidir no orçamento de baús (M3); o segredo já paga em lore (1º sussurro da Contaminação por baixo).
- **Acesso:** só pela passagem alagada do A2. Fuga difícil — longe, estreito, fundo (custo de fuga máximo da fatia).

### 7.5 Corte ASCII (perfil)
```
 superfície:  CAPELA  PRAÇA⊕  DEPOT   CAIS   GUILDA
                 │       │bueiro  │       │      │
            ┌────┴───────┴────────┴───────┴──────┴────┐  deságua→margem(⑤saída)
   A1 (T1)  │  galerias rasas · ratos · ATALHO urbano │──────→ saída secreta
            └──┬──────────────────────────┬───────────┘
               │(escada)        (escada)  │
            ┌──┴──────────────────────────┴──┐
   A2 (T2)  │ aranhas·escaravelhos · alvenaria│ [baú LACRADO nv10] ─galeria→MARGEM LESTE(⑤)
            └──┬─────────────[manchada Q10]───┘
               │ALAGADA (mergulho — Q15)
            ┌──┴──────┐
   A3 (T3)  │ 1-2 GHOULS — Porão Afogado (arrepio) │  baú? ✏️
            └─────────┘
```

---

## 8. Baús da fatia — orçamento proposto ✏️

> `DESIGN-MUNDO.md`: MVP inteiro = **20–30 baús, piramidal** (base utilitária/chaves T1–T2 ~⅔; meio gear; topo enxuto 3–5 lacrados/secretos). A fatia ① leva **uma fração** — proponho **8 baús** (+ os 2 ganchos sem-baú-confirmado). Tipos: escondido / guardado / lacrado / secreto. Posições finas = M3.

| ID | Tipo | Posição ✏️ | Conteúdo (faixa) ✏️ | Quest / ref |
|---|---|---|---|---|
| B1 | **escondido** | Porão do Moinho `(60,250)` | gear incomum / utilitários | **Q12** (corvos) |
| B2 | **guardado** | fundo da Caverna dos Goblins `(240,40)` | peça T1 + gold (atrás do Orc) | **Q8** ato 3 |
| B3 | **guardado** | fundo das Minas Perdidas `(330,30)` | gear incomum + gold alto | **Q13** (margem leste/NE remoto — "fundo da mina") |
| B4 | **escondido** | margem leste, pós-pedras ④ `(220,170)`✏️ | gear incomum | **Q14** (segredo) |
| B5 | **lacrado (nv 10)** | esgoto A2 `(112,48)` | gear T2 (a promessa visível) | gancho do v4 (à vista) |
| B6 | **escondido** | Granja (celeiro) ✏️ | utilitário (corda/pá/tocha) ou armadura T1 regional | base piramidal; Q2 vizinho |
| B7 | **escondido** | Gruta dos Morcegos (fundo) ✏️ | utilitário / chave | base piramidal |
| B8 | **escondido** | Ninho de Aranhas (canto) ✏️ | utilitário / facilitação | recompensa do caminho curioso (S7) |
| (B9?) | **secreto** | A3 Porão Afogado | ✏️ — decidir M3 (o segredo já paga em lore) | **Q15** |
| — | — | — | **Containers domésticos** (casa inicial) `(28,46)` — NÃO contam como baú: Gibão Roto, Botas Surradas, Espada Cega, Sacola de Pano + 1ª chave | nascimento |

> **Armaduras T1 regionais** (`DESIGN-MUNDO.md`): a "armor" perto de Alvorada vive nos baús-base (B6/B7/B8 candidatos) — peças diferentes por região; ninguém acha tudo num lugar. ✏️ qual peça em qual baú.

---

## 9. Tabela-mestra de POIs (id · tipo · x,y local · refs de quest)

| id | POI | tipo | x,y (local) ✏️ | refs |
|---|---|---|---|---|
| P01 | Cidade de Alvorada | cidade/zona segura | `[100..170]×[80..150]` | hub, depot, santuário |
| P02 | Portão NE | portão | `(150,80)` | Q5, Q8 |
| P03 | Portão Sul | portão | `(120,178)` | Q7, Q9, Q11, Q14 |
| P04 | Portão Oeste | portão | `(112,98)` | Q2 |
| P05 | Porta d'Água | portão | `(150,148)` | Q4 |
| P06 | Ponte de Alvorada ① | travessia | `(150,148)` | Q4 |
| P07 | Vau raso ② | travessia | `(212,50)` | Q5, Q8 |
| P08 | Ponte dos Bandidos ③ | travessia | `(165,272)` | Q9 |
| P09 | Pedras no junco ④ | travessia secreta | `(190,160)` | Q14 |
| P10 | Galeria alagada ⑤ | travessia secreta | `(255,170)` (saída) | Q15-adjacente |
| P11 | Granja | spot T1 / quest | `(40,90)` | Q2 |
| P12 | Planícies | spot T1 | `[10..70]×[60..200]` | — |
| P13 | Gruta dos Morcegos | spot T1 | `(135,58)` | Q3 |
| P14 | Toca dos Lobos | spot T1 | `(160,90)` | Q5, Q6 |
| P15 | Acampamento Goblin | spot T1 | `(205,52)` | Q8 a2 |
| P16 | Caverna dos Goblins | spot T1→T2 + baú guardado | `(240,40)` | Q8 a3 |
| P17 | Ninho de Aranhas | spot T2 | `(280,75)` | — (canto curioso) |
| P18 | Minas Perdidas | spot T1→T2 + baú guardado | `(330,30)` | Q13 |
| P19 | Juncal dos Fundeiros | spot T1→T2 | `(190,167)` | Q14 |
| P20 | Matagal dos Javalis | spot T2 + named | `(255,250)` | Q6, Q7 |
| P21 | Bandidos da Ponte | spot T2 | `(167,275)` | Q9, Q11 |
| P22 | Moinho Velho (+ porão/baú) | landmark + baú escondido | `(60,250)` | Q12 |
| P23 | Carrinhos enferrujados (boca da mina) | cena/telegrafia | `(330,33)` | Q13 |
| P24 | Estrada Leste → Atalaia/Pontal/balsa | path + promessa | sai em `(340,150)` | Q4 |
| P25 | Árvore Sagrada (horizonte O) | weenie | fora do recorte, O | orientação |
| E01 | Bueiro da Praça | boca de esgoto | cidade `(36,38)` | Q1 |
| E02 | Esgoto A1 | dungeon T1 | mapa sep. | Q1 |
| E03 | Esgoto A2 (alvenaria Q10 + baú lacrado) | dungeon T2 | mapa sep. | Q10 |
| E04 | Passagem alagada A2→A3 | acesso secreto | A2 `(40,57)` | Q15 |
| E05 | Porão Afogado A3 | bolsão T3 | mapa sep. | Q15 |

---

## 10. Rastreabilidade quest → POIs (auto-verificação de cobertura)

> Checklist: **toda referência espacial de `QUESTS.md` tem entrada física aqui.**

| Quest | Lugares exigidos (QUESTS.md) | POI/coord no GRID | ✓ |
|---|---|---|---|
| R1 Knight | Guilda + pátio/boneco | Guilda `(44,18)` §3.3 | ✓ |
| R2 Mage | Torre Arcana + Depot + braseiro/cristal | Torre `(30,18)`, Depot `(38,32)` | ✓ |
| R3 Rogue | Beco dos Ladinos + esconderijo | Beco `(52,38)` / esconderijo `(54,40)` | ✓ |
| R4 Priest | Templo + Santuário | Templo `(20,14)` / Santuário `(16,22)` | ✓ |
| Q1 Ratos no Porão | porão da Estalagem + bueiro da praça | Estalagem `(20,42)`, bueiro E01 `(36,38)` | ✓ |
| Q2 A Mochila | portão O + Granja (fardo) | Portão O P04, Granja P11 | ✓ |
| Q3 Reagentes | Boticário + Gruta dos Morcegos | Boticário `(31,38)`, Gruta P13 | ✓ |
| Q4 A Entrega | Ferreiro + Ponte de Alvorada + estrada leste + Atalaia + balsa/Pontal | Ferreiro `(20,28)`, P06, P24, vigia `(340,150)`, balsa `(58,48)` | ✓ |
| Q5 Lobos Demais | Quartel + Toca dos Lobos + vau NE | Quartel `(8,36)`, Toca P14, vau P07 | ✓ |
| Q6 O Prato | Cozinheiro + fogueira (estalagem) + Toca/Matagal (carne) | Bento `(22,43)`, Toca P14, Matagal P20 | ✓ |
| Q7 Peleteiro | Caçador (Cais) + Matagal + Javali Velho | Amaro `(48,42)`, Matagal/named P20 | ✓ |
| Q8 Cadeia Goblin | Capitão + vau + Acampamento + Caverna + Orc (fundo) | Vidal `(8,36)`, vau P07, Acamp P15, Caverna+Orc P16 | ✓ |
| Q9 Estrada Roubada | Ferreiro→Capitão→Taverneiro→ponte dos bandidos (acampamento/carga) | Duarte, Vidal, Taverneiro `(51,29)`, Bandidos P21 / ponte P08 | ✓ |
| Q10 Água do Poço | Coveiro (Capela) + esgoto A2 + alvenaria antiga | Custódio `(15,12)`, A2 E03, alvenaria `(70,50)` | ✓ |
| Q11 Tesouro do Bando | Carta (loot Bandido) → Fortaleza (fatia ③, FORA) | Bandidos P21 (loot); baú fecha fatia ③ — fora do recorte | ✓ (origem física) |
| Q12 Corvos do Moinho | Bêbado (Taverna) + Moinho + porão/baú + corvos | Tobias `(50,30)`, Moinho P22 / baú B1 | ✓ |
| Q13 Minas Perdidas | Mineiro aposentado + trilha NE pós-vau + carrinhos + boca da mina + baú guardado | Firmino `(26,30)`, Minas P18, carrinhos P23, baú B3 | ✓ |
| Q14 Pedras de Passagem | pedras no junco + travessia + margem leste + baú | Pedras P09, Juncal P19, baú B4 | ✓ |
| Q15 Porão Afogado | passagem alagada (A2) + A3 + ghouls | Passagem E04 `(40,57)`, A3 E05 | ✓ |

**Cobertura das 4 saídas + esgotos** (cruza a tabela de `QUESTS.md` §Cobertura):
NE (P02/P07): Q5,Q8,Q13 ✓ · Sul (P03/P08): Q9,Q12,Q7,Q11,Q14 ✓ · Oeste (P04): Q2 ✓ · Porta d'Água (P05/P06): Q4,Q14(margem) ✓ · Esgotos: Q1(aponta),Q10(A2),Q15(A3) ✓ · Norte (Gruta): Q3 ✓.

---

## 11. Verificação de orçamentos (DESIGN-MUNDO)

| Orçamento | Regra (DESIGN-MUNDO) | Esta fatia | OK? |
|---|---|---|---|
| Spots de caça | ~20–25 no MVP inteiro | 12 overworld + 3 de esgoto = ~15 (a fatia é a maior fonte de spots T1 do MVP — coerente, é cidade de spawn) | ✓ ✏️ |
| Baús | 20–30 MVP, piramidal, topo enxuto | 8 (+1? A3) — base utilitária (B6/B7/B8), meio gear (B1–B4), 1 lacrado (B5); zero lendário | ✓ |
| NPCs | cluster utilidade + espalhados | Depot+lojas+praça na Baixa; sussurradores/compradores no Cais/Capela/Quartel/canto | ✓ |
| Zona segura / depot | hub a ~30s das saídas | cidade central, depot na Baixa, santuário no Alto | ✓ |
| Casa inicial | nascimento diegético | `(28,46)`, containers domésticos + 1ª chave | ✓ |
| Dungeon | Esgotos T1→T2, andares | A1/A2/A3 = 3 andares (~3 do orçamento de 16–18 do MVP) | ✓ |

---

## 12. Pendências ✏️ (decisão do criador / outras skills)

- [ ] **Posição do recorte da fatia** no macro 800×800 (proposto `[220..560]×[120..460]`) — criador.
- [ ] **Todas as coordenadas** são proposta de layout — afinar no editor de mapa (engenharia + criador).
- [ ] Densidade/respawn/nº de spawns por spot — **Balancista** (na sim).
- [ ] Caverna dos Goblins e Minas: **mapa separado** (dungeon) ou bolsão no overworld? — criador/engenharia (DESIGN-MUNDO trata dungeon como mapa separado; aqui ✏️).
- [ ] Posições finas de baús + qual armadura T1 regional em cada baú-base — **M3** / criador.
- [ ] Baú no A3 (sim/não) — **M3**.
- [ ] Posição do Vigia de Atalaia / quanto da estrada leste cabe no recorte vs. mapa vizinho — criador.
- [ ] Layout interno fino da cidade (ruas/colisão) — engenharia, a partir das âncoras aqui.
- [ ] Confirmar largura do leito do afluente e dos vaus (tiles cruzáveis) — diretor-de-arte + engenharia.

> **Nota de processo:** este GRID consome `QUESTS.md`, que ainda é arquivo **não-commitado** na árvore principal (produzido em paralelo). Se `QUESTS.md` mudar referências espaciais, revalidar a tabela §10.

---

## Verificação independente (verificador)

> Conferência fresca contra as fontes da verdade na árvore principal (`QUESTS.md`, `NPCS.md`, `ITENS-LOOTS.md`, `DESIGN-MUNDO.md`) — não confiei nas afirmações do autor. Diff limpo: só este arquivo novo, zero edição em docs canônicos.

**Cobertura quest→POI: 19/19 ✓** — todos os 4 ritos + Q1–Q15 + casa inicial têm coordenada/entrada física. Spot-check das referências espaciais do `QUESTS.md` (porão estalagem, bueiro praça, granja, gruta, vau NE, acampamento/caverna goblin + Orc, Atalaia/balsa/Pontal, Toca, Matagal/Presa-Torta, ponte dos bandidos, carta-loot, moinho/porão, boca da mina/carrinhos, pedras do junco→margem leste, alvenaria A2+baú lacrado, passagem alagada→A3) — **todas presentes**. As 5 travessias estão graduadas (livre→vau→pedágio→escondida→secreta). Named **Presa-Torta** bate com o cânone.

**Discrepâncias encontradas:**

1. **[média] NPCs batizados referenciados só por papel, sem o nome próprio** (§3.3, §4, §10). 7 NPCs do `NPCS.md` aparecem genéricos: **Telmo** (taverneiro Q9 → GRID diz só "Taverneiro", inclusive a posição `(51,29)` fica sem nome canônico); **Gualter** (R1 → "Instrutor de armas"); **Leonor** (R2 → "Arcanista"); **Vicente "Gralha"** (R3 → "Contato do beco"); **Eusébio** (R4 → "Monge"); **Rosa** (tutorial → "NPC-guia"); **Heitor** (vigia de Atalaia, Q4 → "Vigia de Atalaia"); **Honório** (prefeito → "Câmara (prefeito)"). Nenhum nome *conflitante/inventado* — é lacuna de rastreabilidade, não erro de cânone. Corrigir: anexar os nomes próprios nessas linhas.

2. **[média] Inconsistência entre os dois sistemas de coordenadas dos portões** (§3.1 coord-cidade vs §9 local). Aplicando a conversão declarada `local = cidade + (100,80)`, nenhum portão fecha: NE `(40,2)`→(140,82) vs P02 `(150,80)`; Sul `(20,58)`→(120,138) vs P03 `(120,178)` (**Y diverge 40 tiles**); Oeste `(2,30)`→(102,110) vs P04 `(112,98)`; Porta d'Água `(56,52)`→(156,132) vs P05 `(150,148)`. Tudo marcado ✏️, mas as duas tabelas precisam casar pela própria fórmula do doc.

3. **[média] Portão Sul P03 `(120,178)` cai FORA do retângulo da cidade** `[100..170]×[80..150]` (Y=178 > 150, ~28 tiles ao sul da muralha). Um portão tem de estar na muralha. A versão coord-cidade (local Y=138) está dentro — a tabela §9 herdou o erro do item 2.

4. **[média] Spot S4 Toca dos Lobos `[145..180]×[78..105]` SOBREPÕE a cidade** `[100..170]×[80..150]` (interseção x[145..170]×y[80..105]); a âncora `(160,90)` também está intramuros. Viola "spots não sobrepõem a cidade" — empurrar a Toca para fora da muralha NE/leste.

5. **[baixa] Tamanho da cidade auto-inconsistente:** §3 diz "~60×60" no texto mas declara o retângulo `[100..170]×[80..150]` = **70×70**. Alinhar prosa e número.

**Orçamentos:** baús **8 (+1?)** = ~32% de 20–30 ✓ (piramidal: base B6/B7/B8, meio B1–B4, 1 lacrado B5, zero lendário); dungeon **3 andares** de 16–18 ✓; segredos não-baú ✓ folgado; casa inicial + cluster de utilidade + zona segura ✓. **Tensão (não-estouro):** **15 spots** (12 over + 3 esgoto) ≈ **67% do envelope ~20–25 ponderado** do MVP — para 1 de ~3 fatias, e quase todos T1, é alto. Defensável (Alvorada é a maior fonte de T1 do MVP, declarado em DESIGN-MUNDO §98), mas vale o criador confirmar que Charneca/Brumal cabem no resto. O próprio doc já marca essa linha ✏️.

**Método:** ✏️ aplicado de forma consistente; nada escrito como "decidido" pelo autor (só cita decisões já tomadas nas fontes); pt-BR; não inventou mecânica. Bom.

**Veredito:** estrutura, rastreabilidade e orçamentos sólidos; as 4 discrepâncias de média (#1–#4) são correções de consistência/rastreabilidade antes de virar dados — nenhuma é redesenho.
