# Bestiário — As 12 famílias (catálogo de criaturas)

> Sub-documento de [DESIGN-BESTIARIO.md](DESIGN-BESTIARIO.md) — o hub guarda os princípios, os tiers/orçamento de ataques, a biblioteca de blocos e a matriz de fraquezas/Regra 10–20. Aqui fica o catálogo-base das 12 famílias. **Os headings numerados das famílias** (`## N. Nome (T1–T4) — tagline`) **e as colunas das tabelas** (`Criatura | Tier | Comportamento | Ataques | Notas`) **são PARSEADOS pela wiki** (`wiki/db.js`) — preservar o formato ao caractere ao editar. **Quando uma família crescer** (fichas detalhadas, named mobs, signatures), ela pode ser promovida a arquivo próprio em `design/bestiario/`; este arquivo é o catálogo-base.

## 1. Bestial (T1–T3) — feras naturais

Florestas, campos e trilhas. Sem resist/fraqueza — a família "neutra" do combate cru.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Rato Lanhoso** | T1 | Perseguidor, Matilha | básico | o primeiro sangue do jogador |
| **Lobo Cinzento** | T1–T2 | Perseguidor, Matilha | básico | a alcateia é a skill |
| **Javali de Presas** | T2 | Territorial | básico + Investida | neutro até provocado |
| **Urso Pardo** | T3 | Territorial | básico | **bruto**: HP e dano enormes, zero skill |

## 2. Humanoides (T1–T3) — goblins, orcs e fora-da-lei

Acampamentos, estradas, ruínas. Sem resist/fraqueza; dropam gear T1–T2. Cultistas são a ponte narrativa para os Demônios.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Goblin Batedor** | T1 | Perseguidor, Covarde | básico | foge sangrando |
| **Goblin Fundeiro** | T1–T2 | Atirador, Covarde | básico (funda) | primeiro ranged do jogo |
| **Orc Soldado** | T2 | Perseguidor | básico + Autobuff (fúria) | defesa alta (escudo) |
| **Bandido da Estrada** | T2–T3 | Perseguidor | básico + Autocura | se cura ao recuar — mate antes |
| **Cultista do Abismo** | T3 | Atirador | básico + Projétil abissal + *Marca Sombria* (signature: alvo toma +dano ✏️) | |

## 3. Vermes (T1–T4) — o que rasteja no escuro

Insetos, aracnídeos e vermes. Cavernas, minas, podridão. **Imunes a veneno; fracos a fogo.**

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Escaravelho de Cripta** | T1 | Perseguidor | básico | lento, defesa alta |
| **Aranha-das-Cavernas** | T2 | Perseguidor | básico + veneno no hit | |
| **Viúva Sibilante** | T3 | Atirador | básico + Projétil venenoso + *Teia* (signature: root à distância) | |
| **Verme Colosso** | T4 | Perseguidor | básico | **bruto**: massa absurda de HP, lento |

## 4. Plantas (T2–T4) — o verde que devora

Florestas profundas, pântanos, ruínas. **Imunes a sangramento; resistentes a veneno; muito fracas a fogo.** Maioria anda devagar; duas são estacionárias.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Vinha Estranguladora** | T2 | Estacionário | básico + root no hit | a "armadilha viva" |
| **Cogumelo Esporoso** | T2–T3 | Perseguidor (lento) | básico + Área ao redor (esporos venenosos) | |
| **Carnívora Rubra** | T3 | Estacionário, Territorial | básico + *Bote* (signature: burst à queima-roupa) | finge ser cenário |
| **Salgueiro Sombrio** | T4 | Perseguidor (lento) | básico + Área ao redor (raízes, root) | o "urso" das plantas |

## 5. Aquáticos (T2–T4) — o que sai da água

Rios, costas, pântanos. **Resistentes a fogo; fracos a gelo.** Lutam normalmente em terra — só as Piranhas são presas à água.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Cardume de Piranhas** | T2 | Matilha | básico | só na água ✏️ (tiles de água, M3) |
| **Caranguejo Couraçado** | T2–T3 | Perseguidor | básico | **bruto defensivo**: lento, defesa altíssima |
| **Tritão Lanceiro** | T3 | Atirador | básico (lança) + Projétil | recua para a margem |
| **Serpente do Lodo** | T4 | Territorial | básico + veneno no hit + *Constrição* (signature: root + dano contínuo) | emboscadora |

## 6. Voadores (T1–T3) — asas e garras

Céus, penhascos, tetos de caverna. Sem resist/fraqueza — rápidos, HP baixo. Voo é visual (sprite/sombra); não atravessam paredes ✏️.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Morcego Sanguessuga** | T1 | Perseguidor, Matilha | básico | enxames no escuro |
| **Abutre Carniceiro** | T2 | Perseguidor | básico + Investida (mergulho) | |
| **Harpia** | T3 | Atirador | básico + *Grito Estridente* (signature: debuff curto ✏️) | |

## 7. Mortos-Vivos (T2–T4) — a família-coração do jogo

Criptas, cemitérios, catacumbas. **Imunes a veneno/sangramento; resistentes a gelo; fracos a sagrado e fogo.** A família do exemplo canônico (*Quebra-Ossos*) e o farm natural do Priest. Ameaça por quantidade: hordas.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Esqueleto** | T2 | Perseguidor | básico | a unidade do grind lendário — 15k = *Quebra-Ossos* |
| **Zumbi Pútrido** | T2–T3 | Perseguidor (lento) | básico | **bruto** lento; vem em números |
| **Ghoul** | T3 | Perseguidor, Matilha | básico + Autobuff (frenesi) | rápido, faminto |
| **Espectro** | T4 | Perseguidor | básico + slow no hit (toque gélido) | **resiste a físico** — exige magia/sagrado |

## 8. Dracônicos (T3–T5) — sangue de dragão

Montanhas, cavernas vulcânicas, ruínas antigas. **Resistentes a fogo; fracos a gelo.** Dragões adultos = bosses (doc futuro).

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Lagarto das Rochas** | T3 | Perseguidor | básico + sangramento no hit | defesa alta (escamas) |
| **Salamandra Ardente** | T3–T4 | Perseguidor | básico + Projétil de fogo | |
| **Dragonete Selvagem** | T4 | Perseguidor | básico + Projétil de fogo + *Breath* (signature: cone de fogo) | |
| **Wyvern** | T5 | Perseguidor | básico + veneno no hit (ferrão) + Projétil + *Breath* (signature) | o teto da família |

## 9. Gigantes (T3–T5) — montanhas que andam

Colinas, passos de montanha, cavernas enormes. Sem resist/fraqueza — o desafio é a escala.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Ogro Bruto** | T3 | Perseguidor | básico | **bruto**: bate MUITO forte |
| **Troll das Colinas** | T3–T4 | Perseguidor | básico + Regen passiva (signature) | burst ou fogo, senão não acaba ✏️ |
| **Ciclope** | T4 | Perseguidor | básico + Projétil (rocha) | |
| **Gigante da Montanha** | T5 | Perseguidor | básico + Área ao redor (*Pisão*, signature) + Projétil (rocha) | redefine "respeito por mob comum" |

## 10. Elementais (T3–T5) — magia bruta sem dono

Ruínas arcanas, fendas elementais. **Imunes ao próprio elemento, veneno e sangramento; fracos ao elemento oposto.** A família-escola do Mage.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Elemental de Terra** | T3 | Perseguidor (lento) | básico | **bruto**: defesa física altíssima — magia resolve |
| **Elemental de Gelo** | T4 | Atirador | básico + Projétil de gelo (slow no hit) | fraco a fogo |
| **Elemental de Fogo** | T4 | Atirador | básico + Projétil de fogo (queimadura) | fraco a gelo |
| **Golem Arcano** | T5 | Perseguidor | básico + Área ao redor (*Pulso Arcano*, signature ✏️) | tanque mágico do endgame |

## 11. Míticos (T3–T5) — as criaturas das lendas

Raros no mundo, encontros memoráveis. Resist/fraqueza variam por criatura. XP alto, densidade baixa — a Marca mais lenta e prestigiosa do jogo ✏️.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Cocatriz** | T3–T4 | Perseguidor | básico | rápida e errática |
| **Basilisco** | T4 | Territorial | básico + *Olhar Petrificante* (signature: stun curto telegrafado ✏️) | |
| **Mantícora** | T4–T5 | Perseguidor + Atirador | básico + Projétil (espinhos) | sem distância segura |
| **Quimera** | T5 | Perseguidor | básico + Projétil de fogo + *Três Cabeças* (signature ✏️: atinge até 3 alvos adjacentes) | o "exame final" |

## 12. Demônios (T4–T5) — o endgame padrão

Fendas do Abismo, profundezas dos cultos. **Imunes a fogo; fracos a sagrado** — o farm supremo do Priest/*Exorcista*.

| Criatura | Tier | Comportamento | Ataques | Notas |
|---|---|---|---|---|
| **Diabrete** | T4 | Atirador, Covarde | básico + Projétil de fogo | irritante |
| **Cão das Brasas** | T4 | Perseguidor, Matilha | básico + queimadura no hit | caça em pares |
| **Tormentador** | T4–T5 | Atirador | básico + Projétil abissal + *Maldição* (signature: reduz cura recebida ✏️) | anti-sustain |
| **Carrasco do Abismo** | T5 | Perseguidor | básico + Área ao redor | **bruto com alcance**: o teto das criaturas padrão |
