# Fatia ① Alvorada — Esgotos A1/A2/A3 (spec implementável de placement)

> **Spec de F3 (zero código) para F1 transcrever** em `src/sim/maps/alvorada.ts`. Substitui o **GRID §7** como fonte da verdade do layout dos esgotos: o GRID §7 foi escrito com "mapa separado / coords próprias do andar", **anterior à decisão de z-level real** ([SISTEMA-ANDARES.md](../mundo/SISTEMA-ANDARES.md), 08/jun/2026). Aqui tudo é **z-level real**: cada andar é uma `FloorLayer` com offset `ox/oy` no MESMO espaço `(x,y,z)`; portais `hole`/`stairs` descem na MESMA coluna `(x,y)`.
>
> **Coordenadas:** `local da fatia` (a mesma do GRID/`alvorada.ts`, `local = cidade+(100,80)`) e, por andar, a `A-local` (`A1local = world − (ox,oy)` etc.) que é o índice do array `tiles[]`. Tudo **✏️** — vira código já, afina-se no editor.
>
> **Fluxo (AGENTES.md):** F3 (este spec) → F1 (sim: `FloorLayer`s + `MapPortal`s + colisão) → F2 (render do andar ativo + aberturas; já existe a Fase 1). Prompt de handoff para F1 no rodapé.

---

## 0. PRÉ-REQUISITO que bloqueia o conteúdo: o bestiário

O `alvorada.ts` **filtra spawns pelo bestiário implementado**, e hoje `Bestiary.ts` só tem **2 espécies**: `rato_lanhoso` e `esqueleto` (linhas 168-169). Por isso o A1 atual povoa com `esqueleto` — **placeholder por falta de dado, não escolha de design**. Pior: morto-vivo é da família-Contaminação, cujo **1º sussurro deve estrear no A3** (Q15) — pôr esqueleto no A1 fura o tier E queima o reveal.

**Para os esgotos ficarem on-spec, F1/Balancista precisa adicionar ao bestiário (em ordem de necessidade):**

| Espécie | Tier | Andar | Papel |
|---|---|---|---|
| `morcego_sanguessuga` | T1 | A1 (norte) | já tem arte; transição com a Gruta — tira o A1 da muleta do esqueleto |
| `aranha_das_cavernas` | T2 | A2 | dungeon de verdade |
| `escaravelho_de_cripta` | T1 | A2 | enche o A2 |
| `ghoul` | T3 | A3 | o arrepio do Porão Afogado — 1º sussurro da Contaminação (Q15) |

Enquanto não existirem: F1 transcreve a **geometria** já (vale por si) e povoa com `rato_lanhoso` + um marcador `// TODO species` onde entra morcego/aranha/ghoul. **Não** espalhar `esqueleto` pelo A1.

---

## 1. O que muda em relação ao que está no código hoje

O A1 atual (`buildSewerA1`, `ox=112,oy=94,46×40`) é um **bom quarto** (rede de câmaras + trincheira de água servida + poça funda + telegrafia do A2), mas como **sistema** tem 3 desvios de identidade que esta spec corrige:

1. **1 boca → 5 bocas.** O A1 é o **atalho urbano sob a cidade** (path de Lynch): entra na Capela, sai no Cais. Hoje só o boeiro da praça desce. → §3.1 liga as **5 bocas**.
2. **Footprint sobe pro norte.** Pra hospedar Capela `(115,93)` e Guilda `(144,100)`, o rect precisa começar em `oy≤93`. → A1 vira `ox=110,oy=90,46×34`.
3. **Coluna de descida alinhada.** O boeiro/escada hoje está em `(138,118)`; o bueiro do GRID/feira é **`(136,118)`** (cidade `36,38`). Alinhar os três (tile do boeiro, portal, poço da feira) em **`(136,118)`**.
4. **A2 e A3 não existem.** → §4 e §5.

O craft de câmaras do A1 atual pode ser **reaproveitado** — esta spec dá a planta-alvo; F1 reusa o que servir.

---

## 2. Visão dos 3 andares (corte, perfil)

```
 z=0  superfície:  CAPELA   GUILDA    DEPOT   PRAÇA⊕   CAIS        ……  margem leste (rio)
        (cidade)      │        │        │      bueiro    │                    │ boca-caverna ⑤
        ┌─────────────┴────────┴────────┴────────┴───────┴──────┐             │
 z=-1   │ A1 — galerias rasas (T1) · ATALHO URBANO · ratos+morcego │            │
        │   trincheira de água servida · poça funda (hazard)       │            │
        └──────────┬──────────────────────────┬───────────────────┘            │
                   │ escada D1        escada D2│                                │
              ┌────┴──────────────────────────┴────┐                           │
 z=-2         │ A2 — galerias antigas (T2)          │── boca alagada (cave) ────┘ (travessia ⑤)
              │ aranha·escaravelho · alvenaria Q10  │   [baú LACRADO nv10 à vista]
              └──────────┬──────────────────────────┘
                         │ passagem ALAGADA (mergulho — Q15)
                    ┌────┴─────┐
 z=-3               │ A3 — Porão Afogado (T3) · 1-2 GHOULS · arrepio │  (custo de fuga máx.)
                    └──────────┘
```

**Gradiente de custo de fuga (OSRS / pilar "jogo difícil"):** A1 raso e **multi-saída** (foge por qualquer das 5 bocas) → A2 com 2 escadas só → A3 só por mergulho, sem volta fácil (válvula = morrer no Santuário).

---

## 3. ANDAR A1 (z=−1) — galerias rasas, o atalho urbano (T1)

**Footprint ✏️:** `ox=110, oy=90, width=46, height=34` → mundo `[110..155]×[90..123]`. `ambient` breu (`0x0a0e14`, como hoje).

### 3.1 As 5 bocas (z=0 ↔ A1) + tipo de transição

> **Decisão ✏️:** bocas de esgoto = **escada bi-direcional** (`stairs`, pareada, mesma coluna) — você desce E sobe por qualquer uma; é o que faz o A1 ser atalho. (Hoje a praça é `hole` 1-via + escada de volta separada; recomendo unificar em par `stairs`. O criador pode preferir manter o boeiro como "queda" — ✏️.) A boca da praça mantém o **sprite de boeiro/grade** (Q1 aponta esta).

| Boca | cidade | world (z=0) | A1-local | Espelha (superfície) |
|---|---|---|---|---|
| **Praça (boeiro)** | (36,38) | **(136,118)** | (26,28) | Praça do Poço — **Q1**; sprite manhole |
| Capela | (15,13) | (115,93) | (5,3) | Capela do Coveiro (Alto) — **Q10** pode entrar aqui |
| Guilda | (44,20) | (144,100) | (34,10) | pátio da Guilda |
| Depot | (38,33) | (138,113) | (28,23) | Depot |
| Cais | (50,40) | (150,120) | (40,30) | junto aos Armazéns |

Cada boca: tile de **landing seco** (`SewerFloor`) embaixo + `MapPortal{kind:"stairs", to:{x,y,z:0/-1}}` nos dois lados, mesma coluna.

### 3.2 Descidas A1 → A2 (2 escadas)

| # | A1-local | world | leva a (A2) |
|---|---|---|---|
| D1 | (16,24) | (126,114) | A2 (6,14) |
| D2 | (30,26) | (140,116) | A2 (20,16) |

### 3.3 Geometria (ASCII, A1-local — 46×34, breu)
```
   x→ 0    5    10   15   20   25   30   35   40   45
 0  ███████████████████████████████████████████████
 3  ██░Cª░██████████████████████░░░░░░░░░░░██████████   Cª=boca Capela landing (5,3)
 6  ██░░░░██  ruínas/pilares ░░██░░Gu░░░░░░██████████   Gu=boca Guilda (34,10)
10  ████░░████░◘░░◘░██████████░░░░░░░░░░░██████████████   ◘=alvenaria (telegrafa A2)
13  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░██████████████   galeria-espinha (E-W)
16  ████░~~~~~~░░░░D1░░░░░░░░░░░░░░░░░░░░░██████████████   ~=trincheira água servida
20  ███░≈≈≈≈≈≈░░░░░░░░░░ HALL central ░░░░░░░░░░░░██████   ≈=POÇA FUNDA (DeepWater, hazard)
23  ███░≈≈≈≈≈≈░░░░░░░░░░░░░░░░░░░Dp░░░░░░░░░░░░░░██████   Dp=boca Depot (28,23)
26  █████░░░░░░░░░░░░░░░░░░░░░░░░░D2░░░░░░░░░░░░░██████   D1/D2=descidas p/ A2
28  ████████████░░░░░░░Pç⊕░░░░░░░░░░░░░░░░░░░░░░██████   Pç=boeiro praça (26,28)
30  ██████████████████████████░░░░░░░░░░░░Ca░░░██████   Ca=boca Cais (40,30)
33  ███████████████████████████████████████████████
```
Leitura: galeria-espinha E-W na linha y13-16 liga as 5 bocas; trincheira de `Sewage` (vadeável) corre na espinha e despeja na **poça funda** oeste (`DeepWater`, impassável — hazard); câmara de **ruínas com alvenaria antiga** ao norte (telegrafa o A2 — pilar "vê o futuro"); HALL central é o nó. `█`=`SewerWall`, `░`=`SewerFloor`, `◘`=`OldMasonryWall`.

### 3.4 Spawns A1 ✏️
| Espécie | world (≈) | Nota |
|---|---|---|
| `morcego_sanguessuga` ×2 | (114,93),(118,96) | norte, perto da boca Capela (transição c/ a Gruta) |
| `rato_lanhoso` ×4 | espalhados na espinha/HALL | T1 base |

> **Tier sobe pro fundo:** zero morto-vivo no A1. O "fundo perigoso" do A1 é a poça funda (hazard ambiental), não um T2.

---

## 4. ANDAR A2 (z=−2) — galerias antigas (T2)

**Footprint ✏️:** `ox=120, oy=100, width=30, height=24` → mundo `[120..149]×[100..123]`. Breu. Menor que o A1 — **dungeon de verdade**, não atalho.

### 4.1 Conteúdo-âncora (as promessas da fatia)

| Elemento | A2-local | world | O que é |
|---|---|---|---|
| Chegada D1 (de A1) | (6,14) | (126,114) | escada — para A1 |
| Chegada D2 (de A1) | (20,16) | (140,116) | escada — para A1 |
| **Baú LACRADO nv10** | (24,4) | (144,104) | **visível antes, abrível depois** — a promessa de early game à vista (gancho do v4) |
| **Alvenaria antiga manchada (Q10)** | (12,8) | (132,108) | `interact` — "mais velha que a cidade"; o Coveiro (Abel) aponta; gancho do arco |
| **Boca alagada → margem (travessia ⑤)** | (26,2) | (146,102) | `MapPortal{kind:"cave"}` ↔ overworld **(255,170)** z=0 — o atravessar-o-rio secreto, SEM tunelar 140 tiles |
| **Passagem ALAGADA → A3 (Q15)** | (8,20) | (128,120) | `MapPortal{kind:"cave"}` (mergulho) → A3 (4,8) — "quase ninguém nota" |

### 4.2 Spawns A2 ✏️
`aranha_das_cavernas` (T2) ×3-4 + `escaravelho_de_cripta` (T1) ×2, perto das alvenarias e do baú lacrado (guardam a promessa).

> **Travessia ⑤ resolvida sem corredor gigante:** o GRID §7 falava em "deságua na margem leste" — em z-level real isso vira um **par de portais `cave`** (A2 `(146,102)` ↔ overworld `(255,170)`). F1 cria um **bocal de caverna na margem do rio** em `(255,170)` z=0 (perto do Juncal P19) e pareia. Nada de tunelar.

---

## 5. ANDAR A3 (z=−3) — o Porão Afogado (T3, bolsão)

**Footprint ✏️:** `ox=128, oy=108, width=14, height=12` → mundo `[128..141]×[108..119]`. **Minúsculo de propósito — não é spot de farm, é arrepio.** Breu total.

| Elemento | A3-local | world | O que é |
|---|---|---|---|
| Chegada (da passagem alagada A2) | (4,8) | (132,116) | único acesso; saída = subir o mergulho (custo de fuga máx.) |
| `ghoul` ×1-2 (T3) | (6,5) | (134,113) | **1º sussurro da Contaminação por baixo** — rima com a Água do Poço (Q10) sem se tocarem |
| Baú secreto? | ✏️ M3 | — | decidir no orçamento de baús; o segredo já paga em lore |

ASCII (A3-local, 14×12):
```
   x→0    4    8   12
 0 ██████████████
 3 ██░░░░≈≈░░░░██   ≈ poça (DeepWater)
 5 ██░░Gh░░░░░░██   Gh = ghoul
 8 ██░░◙░░░░░░░██   ◙ = chegada (mergulho de A2)
11 ██████████████
```

---

## 6. Tabela-mestra de portais (o grafo entre andares — F1 transcreve)

> Todos `MapPortal`. `stairs`/`cave` = bi-direcional com `to` explícito; pareados.

| De (andar, world) | kind | Para (andar, world) | Ref |
|---|---|---|---|
| z=0 (136,118) Praça | stairs | z=−1 (136,118) | Q1; boeiro |
| z=0 (115,93) Capela | stairs | z=−1 (115,93) | Q10 |
| z=0 (144,100) Guilda | stairs | z=−1 (144,100) | — |
| z=0 (138,113) Depot | stairs | z=−1 (138,113) | — |
| z=0 (150,120) Cais | stairs | z=−1 (150,120) | — |
| z=−1 (126,114) D1 | stairs | z=−2 (126,114) | — |
| z=−1 (140,116) D2 | stairs | z=−2 (140,116) | — |
| z=−2 (146,102) boca alagada | cave | z=0 (255,170) margem | **travessia ⑤** |
| z=−2 (128,120) passagem | cave | z=−3 (132,116) | **Q15** mergulho |

---

## 7. Rastreabilidade quest → esgoto (cruza QUESTS.md / GRID §10)

| Quest | Exige | Aqui | ✓ |
|---|---|---|---|
| Q1 Ratos no Porão | bueiro da praça aponta o esgoto | boca Praça (136,118) §3.1 | ✓ |
| Q10 A Água do Poço | esgoto A2 + alvenaria antiga manchada | A2 alvenaria (132,108) §4.1 | ✓ |
| Q15 O Porão Afogado | passagem alagada (A2) + A3 + ghouls | passagem (128,120) → A3 ghoul (134,113) | ✓ |
| (travessia ⑤) | galeria alagada → margem leste | boca cave A2 (146,102) ↔ (255,170) | ✓ |

---

## 8. Checklist de handoff

**F1 — bestiário (`Bestiary.ts`):** adicionar `morcego_sanguessuga` (desbloqueia A1) → `aranha_das_cavernas`+`escaravelho_de_cripta` (A2) → `ghoul` (A3). Números = Balancista.

**F1 — mapa (`alvorada.ts`):**
- [ ] Realinhar boeiro/portal da praça p/ **(136,118)** (corrige (138,118) atual + casa com a feira).
- [ ] A1: novo footprint `ox=110,oy=90,46×34`; 5 bocas como pares `stairs`; 2 descidas D1/D2; spawns morcego+rato (sem esqueleto).
- [ ] `buildSewerA2()`: footprint §4; baú lacrado nv10, alvenaria Q10 (`interact`), boca cave→margem, passagem cave→A3; spawns T2.
- [ ] `buildSewerA3()`: footprint §5; ghouls; acesso só pela passagem alagada.
- [ ] Bocal de caverna na **margem do rio (255,170) z=0** pareado com a boca alagada do A2.
- [ ] Registrar os 3 `FloorLayer`s em `floors:[...]` e os portais no grafo.

**F2 (`WorldRenderer`):** a Fase 1 (render do andar ativo + descer) já existe; conferir que A2/A3 entram no mesmo caminho (cada andar = cena autocontida, breu + tochas). Aberturas de vão de escada (SISTEMA-ANDARES §5) ✏️ Fase posterior.

---

## 9. Pendências ✏️
- [ ] Bocas = `stairs` bi (proposto) vs. boeiro como `hole`-queda — **criador**.
- [ ] Baú no A3 (sim/não) + conteúdo do lacrado nv10 — **M3 / criador**.
- [ ] Bestiário: morcego→aranha/escaravelho→ghoul — **F1/Balancista** (gargalo real).
- [ ] Coords finas de todos os andares — afinar no editor.
- [ ] Marca/loot dos ghouls (família-coração) — fatia ②, mas o spawn já estreia aqui.
