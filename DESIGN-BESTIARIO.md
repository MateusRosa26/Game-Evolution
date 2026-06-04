# Bestiário — Criaturas Padrão

> Documento vivo. Somente criaturas padrão — mini-bosses e bosses de área ficam para documento futuro ✏️. Números (HP/dano/XP) são ✏️ até o M1/M2 darem a régua.

## Princípios

1. **Mobs são fortes** (ver Ritmo em `DESIGN-EVOLUCAO.md`): até a criatura de tier 1 pune descuido. Nenhum mob é "de passagem".
2. **Família é organização, não mecânica** (modelo Tibia): define tema, habitat, resist/fraquezas e a unidade dos contadores de Marca. ~90% dos mobs agem de forma semelhante — perseguem e batem; alguns atiram, alguns fogem.
3. **A diferenciação vem dos ataques/skills** dos mobs, com orçamento por tier (abaixo) — não de mecânicas exóticas por família.
4. **Dificuldade crescente dentro da família**: o jogador revisita o tema mais forte, e a família inteira alimenta a mesma Marca.

## As 12 famílias (decidido)

**Bestial · Humanoides · Vermes · Plantas · Aquáticos · Voadores · Mortos-Vivos · Dracônicos · Gigantes · Elementais · Míticos · Demônios**

## Tiers e orçamento de ataques (decidido)

| Tier | Nível-alvo ✏️ | Orçamento típico de ataques |
|---|---|---|
| **T1** | 1–8 | só ataque básico |
| **T2** | 8–15 | básico + 1 skill simples |
| **T3** | 15–25 | básico + 1 skill (+ signature às vezes) |
| **T4** | 25–40 | básico + 1–2 skills (+ signature comum) |
| **T5** | 40+ | básico + 2 skills + signature |

**Não é regra absoluta** — a exceção cria nuance: o **bruto** (só stats: muita vida, muito dano, zero skill) existe em todo tier e é tão memorável quanto o mob de signature. Ex: Urso Pardo (T3), Verme Colosso (T4), Ogro Bruto (T3).

- **Skill** = bloco reutilizável da biblioteca abaixo, com elemento/status da criatura.
- **Signature** = ataque/efeito exclusivo da espécie, a "cara" do mob (breath do Dragonete, petrificar do Basilisco). Raras por definição.

## Biblioteca de blocos de ataque (a sim implementa isso, não skills caso-a-caso)

| Bloco | Descrição |
|---|---|
| **Básico** | melee adjacente (ou projétil simples, para mobs "ranged de natureza") |
| **Projétil** | ataque à distância com elemento/status |
| **Cone (breath/onda)** | dano em cone na direção do alvo, telegrafado |
| **Área ao redor** | pisão/nova centrada no mob |
| **Status no hit** | veneno, queimadura, slow, sangramento, root, stun — anexado a qualquer bloco |
| **Autocura / regen** | cura ativa ou regeneração passiva |
| **Investida** | gap-closer em linha |
| **Autobuff** | fúria: +velocidade/+dano por Xs ✏️ |

Comportamentos (IA): base universal **Perseguidor** (A* + melee); modificadores **Atirador**, **Covarde**, **Matilha**, **Territorial**, **Estacionário** (raro).

---

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
| **Cultista do Abismo** | T3 | Atirador | básico + Projétil sombrio + *Marca Sombria* (signature: alvo toma +dano ✏️) | |

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
| **Tormentador** | T4–T5 | Atirador | básico + Projétil sombrio + *Maldição* (signature: reduz cura recebida ✏️) | anti-sustain |
| **Carrasco do Abismo** | T5 | Perseguidor | básico + Área ao redor | **bruto com alcance**: o teto das criaturas padrão |

---

## Matriz de fraquezas (resumo)

| Família | Imune | Resistente | Fraco |
|---|---|---|---|
| Bestial | — | — | — |
| Humanoides | — | — | — |
| Vermes | veneno | — | **fogo** |
| Plantas | sangramento | veneno | **fogo** (muito) |
| Aquáticos | — | fogo | **gelo** |
| Voadores | — | — | — |
| Mortos-Vivos | veneno, sangramento | gelo; físico (só Espectro) | **sagrado**, fogo |
| Dracônicos | — | fogo | **gelo** |
| Gigantes | — | — | — |
| Elementais | próprio elemento, veneno, sangramento | físico (Terra) | **elemento oposto** |
| Míticos | varia | varia | varia |
| Demônios | fogo | — | **sagrado** |

Leitura de design: **fogo** é a fraqueza mais comum no early-mid (Vermes/Plantas/Mortos-Vivos) mas perde valor no endgame (Demônios imunes, Dracônicos resistem) — o mago de fogo brilha cedo e sofre tarde. **Gelo** inverte (forte vs Aquáticos/Dracônicos no late). **Sagrado** é nicho absoluto: devastador vs profanos, neutro no resto. Nenhum elemento é resposta universal.

## Ganchos com o sistema de Marcas

- **Famílias = alvo das Marcas de item** (*Quebra-Ossos* vs mortos-vivos) e dos Caminhos *Carrasco de <família>* / *Exorcista*.
- **Espécies = grind lendário específico** (✏️ proposta: Marcas de espécie e de família existem; espécie é mais rara e mais forte).
- **Famílias-lar por classe:** Priest → Mortos-Vivos/Demônios · Mage → Elementais/Dracônicos · Rogue → Humanoides/Bestial (sangramento e veneno funcionam) · Knight → Gigantes (*Inabalável* bloqueando golpes pesados).
- Covardes que fogem alimentam *Arremesso → Caçador*.
- T4–T5 são as famílias onde thresholds de 10–20k fazem sentido de tempo de jogo — T1–T2 saem de rotação no mid-game (regra anti-degeneração: kill precisa dar XP válido).

## Aberto / a decidir ✏️

- [ ] Números: HP/dano/XP/velocidade por criatura (M2)
- [ ] Marcas distinguem espécie vs família? (proposta: ambas, espécie mais rara e mais forte)
- [ ] Respawn/densidade por região (M3 — design de mapa)
- [ ] Tiles de água + regra das Piranhas (M3 — mapa)
- [ ] Mini-bosses e bosses de área (doc futuro — inclui dragões adultos)
- [ ] Loot table por criatura (M2 — itens)
- [ ] Efeitos exatos das signatures marcadas ✏️ (Marca Sombria, Grito, Pulso Arcano, Três Cabeças, Maldição)
