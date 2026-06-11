# Fatia ① Alvorada — Quests

> Especificação das quests da fatia (consome: `design/mundo/SISTEMA-QUESTS.md` §Quests/§NPCs · `ITENS-LOOTS.md` (comércio destravável + régua de economia) · layout aprovado `design/rascunhos/alvorada-v4.html`). **Nomes batizados (Loremaster, jun/2026)** — quests em par PT/EN, NPCs com nome próprio invariante (elenco completo em `NPCS.md`); textos-pista = rascunhos (✏️ Loremaster finaliza); **XP e contagens calibrados (Balancista, bateria M1 — jun/2026)**; gold = ✏️ aguarda economia de loot na sim. Organizado **por área**, com **nível-alvo** por quest — navegação cresce junto com o portfólio.

## Princípios do portfólio (decididos jun/2026)

1. **Composição**: 6 simples (financiam o rito de classe — régua nº 1 de ITENS-LOOTS) + 3 compostas/encadeadas + 2 longa maturação + 2 abertas + 2 segredos = **15 quests** · os 4 ritos de classe ficam em **seção própria, fora da contagem**.
2. **Contador de caça SÓ nas diretas** (decidido — fecha pendência de DESIGN-MUNDO): a entrada do diário das quests diretas mostra contagem discreta ("4/8"); abertas e segredos, nunca — mesma lógica do 📍 (a direta é a camada-salário, exceção consciente).
3. **A cidade se aprofunda com a confiança (gating)**: as compostas abrem por quests anteriores (Orelha por Orelha pós-Lobos Demais; Estrada Roubada pós-Entrega) — revisitar NPCs depois de uma quest é sempre potencialmente recompensador (rumores que evoluem, DESIGN-MUNDO).
4. **Named mobs de quest = mundo compartilhado, nunca phasing** (decidido): o named vive no mundo desde sempre, com **respawn contínuo lento** (✏️ balancista: ~20–30 min — evento, não farm; fila curta no launch). O evento `kill` **credita todo personagem que contribuiu** no combate (dano/party), não só o golpe final — multidão no spawn vira mutirão, não frustração. Exemplo canônico: **Presa-Torta** (*Crooktusk*), o javali velho.
5. **Cobertura**: as 6 simples juntas apresentam **as 4 saídas da cidade** e os spots T1; as demais pagam os cantos que nenhuma direta cobre (NE remoto, canto sul, margem leste).
6. **Recompensas na régua de ITENS-LOOTS**: trade destravado é recompensa de quest (7 compradores); poção é luxo (1 única de cortesia no jogo inteiro — Reagentes do Boticário); gold das simples ≈ rito de classe + caça T1 até lvl 6–8.

## Orçamento de XP (calibrado — bateria M1, jun/2026)

Régua medida: rato = 15 XP · curva cúbica (lvl 5 = 800 · lvl 8 = 4.200 · lvl 12 = 17.600 acumulados). **Orçamento FORTE (decidido pelo criador):** as quests carregam o early — rito + 6 simples + atos iniciais somam ~850 XP, então o lvl 5 sai ~60% de quest, *jogando o conteúdo*, sem farm dedicado. Como quest não repete, a fração despenca sozinha: ~33% no lvl 8, ~13% no lvl 12 — daí em diante a subida exponencial é da caça (preserva "upar é difícil e lento").

| Quest | XP | Quest | XP |
|---|---|---|---|
| R1–R4 rito de classe | 50 cada | Q7 Peleteiro (ato 1 → 2) | 100 → 250 |
| Q1 Ratos no Porão | 50 | Q8 Orelha por Orelha (a1 → a2 → a3) | 100 → 150 → 350 |
| Q2 A Mochila | 50 | Q9 Estrada Roubada | 350 |
| Q3 Reagentes do Boticário | 75 | Q10 Água do Poço | 150 |
| Q4 A Entrega do Ferreiro | 75 | Q12 Corvos / Q13 Minas | 150 / 250 |
| Q5 Lobos Demais | 100 | Q11 / Q14 / Q15 | **0** — segredos/aberta-por-item pagam em baú, conhecimento e registro, nunca em XP |
| Q6 O Prato do Cozinheiro | 100 | | |

**Gold (1º passe — Balancista + criador, jun/2026** · report `docs/reports/2026-06-05-economia-gold-passe1.md`**):**
régua "tudo baixo" — gold/h T1 ≈ 40–80 nu, 120–220 informado. As 6 simples somam **150**
(✓ âncora: ≈ rito 10 + caça T1 até lvl 6–8): Q1 **20** · Q2 **20** · Q3 **25** · Q4 **25** ·
Q5 **30** · Q6 **30**. Compostas (por ato): Q7 **30→60** · Q8 **30→50→80** · Q9 **80** ·
Q10 **40**. Abertas/segredos (Q11–Q15): **0 gold direto** — pagam em baú/conhecimento/registro.
Ritos: **custam 150** (decidido jun/2026 pelo criador — era 10 simbólico; 150 ≈ soma das 6 simples: a classe é CONQUISTA do circuito early ou de ~2h de caça T1, e o classless vira fase real ~lvl 3-5). Não pagam. ✏️ validar na sim quando loot/gold entrarem (M2).

Níveis-alvo abaixo validados contra a régua T1 medida; validação fina quando lobo/javali/goblin entrarem na sim.

## Índice — todas as quests (área × nível)

| # | Quest (PT / EN) | Camada | Área | Nível-alvo ✏️ | NPC / gatilho | Destrava / recompensa-chave |
|---|---|---|---|---|---|---|
| R1–R4 | Os 4 ritos de classe | direta | Cidade | 1–2 | NPCs de classe | classe + arma do kit |
| Q1 | Ratos no Porão / *Rats in the Cellar* | direta | Cidade | 1–2 | **Bartolo**, estalajadeiro | gold pequeno · aponta esgotos |
| Q2 | A Mochila / *The Backpack* | direta | Oeste | 1–3 | **Nina**, lojista (Loja Geral) | **1ª mochila de verdade** |
| Q3 | Reagentes do Boticário / *The Apothecary's Reagents* | direta | Norte | 2–4 | **Silas**, boticário | **trade de reagentes** + 1 poção de cortesia |
| Q4 | A Entrega do Ferreiro / *The Smith's Delivery* | direta | Leste | 2–4 | **Duarte**, ferreiro | **trade de sucata/armas** · mostra Pontal |
| Q5 | Lobos Demais / *Too Many Wolves* | direta | Nordeste | 3–5 | **Capitão Vidal** | **bounty de orelhas** · abre Q8 |
| Q6 | O Prato do Cozinheiro / *The Cook's Dish* | direta | Cidade (caça: Toca/Matagal) | 3–6 | **Bartolo**, estalajadeiro-cozinheiro | **receita do Ensopado + trade de ingredientes** |
| Q7 | A Caçada do Peleteiro / *The Furrier's Hunt* | composta (2 atos) | Sul (Matagal) | 4 → 9 | **Amaro**, caçador-peleteiro (Cais) | **Faca de Esfolar + trade de peles** |
| Q8 | Orelha por Orelha / *Ear for Ear* | encadeada (3 atos) | Nordeste | 3 → 10 | **Capitão Vidal** (pós-Q5) | gold bom + peça T1 · fio → Fortaleza |
| Q9 | A Estrada Roubada / *The Stolen Road* | encadeada (NPC em NPC) | Sul (ponte) | 8–12 | **Duarte**, ferreiro (pós-Q4) | gold bom · ensina estrada de Charneca |
| Q10 | A Água do Poço / *The Well's Water* | direta → **longa maturação** | Esgotos (A2) | 5–8 → fatia ② | **Abel**, coveiro (Capela) | **camada nova de rumores** · 1º fio do arco |
| Q11 | O Tesouro do Bando / *The Brigands' Hoard* | aberta-por-item → **longa maturação** | Sul → Fortaleza (fatia ③) | 8 → 15+ | Carta Rabiscada (loot raro do Bandido) | baú do bando na Fortaleza |
| Q12 | Os Corvos do Moinho / *The Crows of the Mill* | aberta | Sul (moinho) | 4–7 | **Tobias**, o bêbado da Taverna do Cais | **baú escondido** · cross-link Q9 |
| Q13 | Minas Perdidas / *Forsaken Mines* (nome do POI) | aberta | Nordeste (remoto) | 8–12 | **Hugo**, mineiro aposentado | **baú guardado** · paga o canto NE |
| Q14 | As Pedras de Passagem / *The Stepping Stones* | segredo | Sul (juncal) → margem leste | 5+ | as pedras escondidas no junco | **baú escondido** + registro |
| Q15 | O Porão Afogado / *The Drowned Cellar* | segredo | Esgotos (A3) | 12+ | passagem alagada no A2 | registro — **1º sussurro da Contaminação** |

---

## Os 4 ritos de classe (seção própria — fora das ~15)

> Modelo decidido em `DESIGN-EVOLUCAO.md`: quest boba + gold simbólico, com a cara da classe; entrega a **arma do kit**; nenhuma skill vem de graça. **Sem restrição de nível NENHUMA (decidido jun/2026)**: o rito pode ser feito a qualquer momento — a única barreira é o **gold (150, decidido jun/2026**; era simbólico — agora a classe é conquista do early, e o período classless é fase real do personagem**)**. **Cada rito tutoriza um SISTEMA diferente do jogo** (decidido jun/2026). Âncoras físicas do layout v4. Falas ✏️ Loremaster.

### R1. A Prova do Pátio / *The Courtyard Trial* — rito do Knight
- **Local:** Pátio da Milícia · **NPC: Ricardo**, o instrutor
- **Quest:** aguentar os golpes de Ricardo com o escudo de treino + derrubar o boneco do pátio.
- **Tutoriza:** combate melee + **bloqueio com escudo** — a lente de Marca do Knight (golpes bloqueados) nasce no primeiro minuto.
- **Entrega:** escolha espada × machado × maça + escudo de madeira (kit decidido).

### R2. O Tomo Esquecido / *The Forgotten Tome* — rito do Mage
- **Local:** Casa do Mago · **NPC: Leonor**, a arcanista
- **Quest:** Leonor deixou um tomo guardado no **Armazém** (o Depot da vila) — buscar e trazer. Ao voltar, escolher o elemento **tocando o braseiro OU o cristal** (fogo × gelo).
- **Tutoriza:** o **Depot** (o sistema que todo jogador precisa conhecer) + a primeira declaração elemental.
- **Entrega:** cajado 2H (kit decidido).

### R3. O Esconderijo / *The Stash* — rito do Rogue
- **Local:** Beco dos Ladinos (Cais) · **NPC: Vincente "Gralha"** (*Vincente "the Jackdaw"*)
- **Quest:** achar o esconderijo no beco seguindo instrução vaga (*"terceira pedra, contando da sarjeta…"* ✏️).
- **Tutoriza:** **olhar o cenário** / objetos escondidos — a mecânica-assinatura do jogo, no rito da classe que vive dela.
- **Entrega:** escolha adaga × arco (kit decidido).

### R4. A Vigília / *The Vigil* — rito do Priest
- **Local:** Capela (Alto) · **NPC: Gabriel**, o sacerdote
- **Quest:** levar a oferenda e acender a chama no **Santuário**.
- **Tutoriza:** o **santuário de respawn** — saber onde se renasce, antes da primeira morte.
- **Entrega:** escolha cetro × luva — a luva oferecida **sem comentário algum** (hint silencioso do Monge, decidido).

---

## Cidade de Alvorada (intramuros)

### Q1. Ratos no Porão / *Rats in the Cellar*
- **Camada:** direta
- **Nível-alvo:** 1–2 ✏️
- **NPC / gatilho:** **Bartolo**, estalajadeiro (Estalagem do Vau) — oferece de cara.
- **Requisitos:** nenhum.
- **Texto-pista ✏️:** *"Os malditos roem até as vigas. Desce lá e me livra deles — e olha que eles não param de aparecer, devem subir de algum lugar…"*
- **Etapas:** `talk` → `kill` **8** Ratos na região do porão da estalagem → `talk` (report).
- **Recompensa:** gold pequeno + **50 XP**. Fala final **aponta o bueiro da praça** (planta os Esgotos).
- **Ensina:** combate básico, loop oferta→report, contador discreto no diário.
- **Registro no diário ✏️:** *"O estalajadeiro jura que os ratos sobem de algum lugar. O bueiro da praça?"*

### Q6. O Prato do Cozinheiro / *The Cook's Dish*
- **Camada:** direta
- **Nível-alvo:** 3–6 ✏️ (carne de lobo T1 às vezes / javali T2 sempre — o jogador escolhe o risco)
- **NPC / gatilho:** **Bartolo**, o estalajadeiro (também cozinha — Bento fundido nele, jun/2026).
- **Requisitos:** nenhum.
- **Texto-pista ✏️:** *"Pão eu tenho. O que falta é carne de verdade — caça, não essa miséria de celeiro."*
- **Etapas:** `talk` → entregar **4** Carnes de Caça (loot: Lobo às vezes, Javali sempre) → **cozinhar juntos** na estalagem (interação na fogueira fixa).
- **Recompensa:** **100 XP** + **receita do Ensopado** (conhecimento permanente — modelo Licensed Chef do Apogea, 1ª buff food) + **destrava trade de ingredientes e pratos prontos** (renda não-combate).
- **Ensina:** o sistema de comida inteiro: cru → cozido → receita; fogueiras fixas.
- **Registro no diário ✏️:** *"O cozinheiro me ensinou o ensopado da casa. Disse que compra o que eu caçar."*

---

## Esgotos de Alvorada

### Q10. A Água do Poço / *The Well's Water* — o fio do arco
- **Camada:** direta → **longa maturação** (o ato seguinte só existe na fatia ②)
- **Nível-alvo:** 5–8 ✏️ na fatia ① (A2 é T2); maturação: fatia ② (Charneca)
- **NPC / gatilho:** **Abel**, o coveiro (Capela, junto da muralha N).
- **Requisitos:** nenhum (pode COMEÇAR no lvl 1 — descer ao A2 é que exige corpo).
- **Texto-pista ✏️:** *"A água do poço baixo anda turva. Os outros não sentem o gosto. Eu sinto. Vem de baixo — sempre vem de baixo."*
- **Etapas:** `talk` → descer ao **esgoto A2** → `region_enter` + `interact` na **alvenaria antiga manchada** (mais velha que a cidade…) → `talk` (report).
- **Recompensa:** **150 XP** + **desbloqueia camada nova de rumores na cidade** (o veículo da storyline — DESIGN-MUNDO). **Nunca diz "Contaminação".**
- **Maturação:** Abel aponta vagamente o sul (*"dizem que em Charneca os mortos não descansam…"* ✏️) — a pendência amadurece no diário até a fatia ②.
- **Registro no diário ✏️:** *"Há uma mancha escura numa alvenaria mais velha que a cidade. Abel empalideceu quando contei."*

### Q15. O Porão Afogado / *The Drowned Cellar*
- **Camada:** **segredo** (nunca anunciado)
- **Nível-alvo:** 12+ ✏️ (sobreviver à espiada; ghouls são T3)
- **Gatilho:** a **passagem alagada** no A2 (mergulho curto que quase ninguém nota).
- **Lá embaixo:** o Andar 3 — bolsão minúsculo, 1–2 Ghouls. Não é spot de farm: é **arrepio**.
- **Recompensa:** o conhecimento — **registro no diário** + loot dos ghouls ✏️ (família-coração, ver arco). Baú: decidir no orçamento de baús (M3) — o segredo já paga em lore.
- **Papel:** 1º sussurro da Contaminação **por baixo** — rima com a Água do Poço sem se tocarem (quem fez as duas liga os pontos sozinho).
- **Registro no diário ✏️:** *"Mergulhei onde ninguém mergulha. Algo apodrece sob o povoado — e anda."*

---

## Oeste — Granja & Planícies

### Q2. A Mochila / *The Backpack*
- **Camada:** direta
- **Nível-alvo:** 1–3 ✏️
- **NPC / gatilho:** **Nina**, lojista da Loja Geral (Baixa).
- **Requisitos:** nenhum.
- **Texto-pista ✏️:** *"O carroceiro largou meu fardo na granja quando viu os ratos. Traz ele inteiro e a mochila de amostra é tua."*
- **Etapas:** `talk` → ir à **Granja** (portão oeste) → recuperar o fardo (interação; ratos nos celeiros no caminho) → `talk` (entrega).
- **Recompensa:** **50 XP** + a **primeira mochila de verdade** (decidido em DESIGN-MUNDO: vem de quest, não compra — upgrade da Sacola de Pano).
- **Ensina:** o portão oeste / a saída do novato; dá a função de quest que justifica a granja.
- **Registro no diário ✏️:** *"Fardo entregue, mochila no ombro. Nina disse que eu 'tenho futuro de carregador'."*

---

## Norte — Gruta dos Morcegos

### Q3. Reagentes do Boticário / *The Apothecary's Reagents*
- **Camada:** direta
- **Nível-alvo:** 2–4 ✏️
- **NPC / gatilho:** **Silas**, boticário (loja de Poções, Baixa).
- **Requisitos:** nenhum.
- **Texto-pista ✏️:** *"Cauda de rato e asa de morcego — fresco, não ressecado. A gruta no barranco norte está cheia deles, se tiver estômago."*
- **Etapas:** `talk` → coletar **4** Caudas de Rato + **4** Asas de Morcego (loot) → `talk` (entrega).
- **Recompensa:** gold + **75 XP** + **destrava trade de reagentes** (a quest ensina o sortimento dele — Glândula, Seda, Asa, Cauda) + **1 Poção de Vida Pequena de cortesia** (decidido): apresenta o luxo — e o que custa repor.
- **Ensina:** a Gruta dos Morcegos (o único spot T1 que nenhuma outra direta cobre).
- **Registro no diário ✏️:** *"Silas pagou e me deu um vidrinho vermelho. 'Pra emergência. A próxima eu cobro.'"*

---

## Nordeste — orla da mata, vau, Caverna dos Goblins, Minas

### Q5. Lobos Demais / *Too Many Wolves*
- **Camada:** direta
- **Nível-alvo:** 3–5 ✏️
- **NPC / gatilho:** **Capitão Vidal** (Quartel da Guarda).
- **Requisitos:** nenhum.
- **Texto-pista ✏️:** *"A alcateia da orla atacou dois viajantes esta semana. Não tenho homens — a muralha consome tudo. Reduza a matilha."*
- **Etapas:** `talk` → `kill` **8** Lobos na **Toca dos Lobos** (orla da mata) → `talk` (report).
- **Recompensa:** gold + **100 XP** + **destrava o bounty de orelhas de goblin** (o capitão passa a comprar — contrato permanente) + **abre Orelha por Orelha (Q8)**.
- **Ensina:** a orla da mata, o caminho do vau NE.
- **Registro no diário ✏️:** *"Alcateia reduzida. O Capitão Vidal agora paga por orelha de goblin — 'praga pior que lobo'."*

### Q8. Orelha por Orelha / *Ear for Ear* — encadeada, 3 atos
- **Camada:** encadeada (direta em 3 atos — cada ato manda mais longe)
- **Nível-alvo:** 3 → 10 ✏️
- **NPC / gatilho:** **Capitão Vidal**, **após Lobos Demais** (gating de confiança).
- **Ato 1 (lvl ~3–5):** batedores goblins rondam o vau NE — `kill` Goblins + trazer **10** orelhas.
- **Ato 2 (lvl ~5–8):** seguir a trilha → **descobrir o Acampamento Goblin** (`region_enter`) → report → reduzir o acampamento (`kill` **12** goblins).
- **Ato 3 (lvl ~8–10):** a **Caverna dos Goblins**: chegar ao fundo e descobrir **quem os arma** → `kill` **Orc Soldado** (decidido jun/2026 — fecha a pendência do bestiário) + trazer a **Sucata de Arma marcada** ✏️ como prova.
- **Recompensa final:** gold bom + **XP por ato: 100 / 150 / 350** + **peça T1 de gear** (loot raro do Orc, ITENS-LOOTS).
- **O fio solto (deliberado):** de onde vêm essas armas? Orcs ao norte de quê? → **Fortaleza Abandonada** (fatia futura). Vidal guarda a prova e franze a testa.
- **Registro no diário ✏️ (ato 3):** *"Não era goblin no fundo da caverna. Era um orc — armado, armadurado, esperando. Quem mandou?"*

### Q13. Minas Perdidas / *Forsaken Mines* (mesmo nome do POI — decidido)
- **Camada:** **aberta** (rumor, sem marker)
- **Nível-alvo:** 8–12 ✏️
- **NPC / gatilho:** **Hugo**, mineiro aposentado (sussurrador puro, um velho com pó de pedra na voz, num canto da Baixa).
- **Requisitos:** nenhum (rumor disponível a quem conversa).
- **Texto-pista ✏️:** *"Fechamos a mina quando as picaretas começaram a responder. Mas o veio ainda está lá em cima, depois do vau, onde os carrinhos enferrujam. Ninguém volta pra contar por quê."* — referências localizáveis: ① a trilha NE além do vau · ② os **carrinhos enferrujados** na boca da mina · ③ os túneis que "respondem" (sons na profundidade ✏️).
- **Etapas:** achar a boca da mina (canto NE remoto — a viagem É a quest) → descer (T1→T2) → **baú guardado** no fundo.
- **Recompensa:** **250 XP** + baú guardado — gear incomum + gold alto ✏️ (paga como aberta: acima da camada direta).
- **Papel:** a única quest que paga o canto NE — atravessa a constelação inteira.
- **Registro no diário ✏️:** *"Achei a mina do velho Hugo. Os carrinhos ainda estão lá. O que 'responde' lá embaixo também."*

---

## Leste — estrada de Atalaia

### Q4. A Entrega do Ferreiro / *The Smith's Delivery*
- **Camada:** direta
- **Nível-alvo:** 2–4 ✏️ (estrada vigiada — perigo baixo; a viagem é a lição)
- **NPC / gatilho:** **Duarte**, ferreiro (Baixa).
- **Requisitos:** nenhum.
- **Texto-pista ✏️:** *"Leva este pacote ao Marco, o vigia de Atalaia, na estrada leste. Cruza a ponte e segue o rio — e não abre."*
- **Etapas:** `talk` → receber pacote (item de quest) → **Ponte de Alvorada** → estrada leste → `talk` **Marco**, vigia de **Atalaia** → voltar → `talk` (report).
- **Recompensa:** gold médio + **75 XP** + **destrava trade de sucata/armas no ferreiro** (a porta do trade, ITENS-LOOTS) + **abre A Estrada Roubada (Q9)**.
- **Ensina:** a estrada leste inteira — e **MOSTRA a balsa fechada e Pontal na outra margem** (a promessa macro plantada na primeira semana de jogo).
- **Registro no diário ✏️:** *"Atalaia vigia uma balsa que não cruza. Do outro lado do rio, telhados: Pontal. Um dia."*

---

## Sul — ponte, moinho, matagal, juncal

### Q7. A Caçada do Peleteiro / *The Furrier's Hunt* — composta, 2 atos
- **Camada:** composta (2 atos)
- **Nível-alvo:** 4 → 9 ✏️
- **NPC / gatilho:** **Amaro**, caçador-peleteiro (civil, Cais) — disponível desde o início.
- **Ato 1 (lvl ~4–6):** *prova de caçador* — trazer **3** Peles de Lobo.
- **Ato 2 (lvl ~8–9):** ele conta de **Presa-Torta** (*Crooktusk*) — o javali velho do fundo do Matagal, grande demais pra ele. **Modelo decidido**: mob único do mundo, **respawn contínuo lento** (✏️ ~20–30 min), visível pra todos sempre — **zero phasing**; o `kill` credita **todos que contribuíram** no combate. Matar e reportar (a sim rastreia o evento — sem item de quest).
- **Recompensa:** **100 XP (ato 1) + 250 XP (ato 2)** + **Faca de Esfolar** (a ferramenta E o símbolo — fecha pendência de ITENS-LOOTS: a "caçada conjunta" virou caçada do named, sem tech de follower) + **destrava trade de peles/couro/presas**.
- **Ficha de Presa-Torta:** ✏️ bestiário (variante named do Javali, T2+ — alcunha de crônica dos caçadores, fonte 4 da nomenclatura).
- **Registro no diário ✏️ (ato 2):** *"Presa-Torta caiu. Amaro não acreditou até ver a cicatriz da presa. Agora compra o que eu esfolar."*

### Q9. A Estrada Roubada / *The Stolen Road* — encadeada, NPC em NPC
- **Camada:** encadeada (a forma "fale com fulano → agora com beltrano")
- **Nível-alvo:** 8–12 ✏️ (bandidos T2)
- **NPC / gatilho:** **Duarte**, ferreiro, **após A Entrega** (a carga seguinte sumiu na estrada sul).
- **Cadeia:** Duarte (*"a segunda carga sumiu — na estrada do pântano"* ✏️) → **Capitão Vidal** (*"sem homens, a muralha consome tudo — investiga por mim"* ✏️) → **Telmo**, taverneiro do Cais (ouviu alguém gastando demais; keyword ✏️) → **ponte dos bandidos** (T2): `kill` + recuperar a carga (interação no acampamento da ponte) → report.
- **Recompensa:** gold bom + **350 XP**.
- **Ensina:** a estrada sul / o caminho de **Charneca** (fatia ②) ANTES de Charneca existir — e dá motivo de quest ao spot dos bandidos.
- **Cross-link:** os sinais de bandidos no porão do Moinho (Q12) apontam pra cá — as duas quests se iluminam sem depender uma da outra.
- **Registro no diário ✏️:** *"A carga estava na ponte, com os bolsos de três bandidos. A estrada do sul continua deles — por enquanto."*

### Q11. O Tesouro do Bando / *The Brigands' Hoard* — aberta-por-item, longa maturação
- **Camada:** **aberta-por-item** (sem NPC, sem marker) → **longa maturação** (fecha na fatia ③)
- **Nível-alvo:** começa ~8 (caçando bandidos) → fecha 15+ ✏️ (Fortaleza Abandonada, T2–T3)
- **Gatilho:** **Carta Rabiscada** (*Scrawled Letter*) — loot **raro** do Bandido da Estrada (fecha a pendência "mapa/pista" de ITENS-LOOTS). O item não anuncia o que é: o jogador LÊ e descobre (narração das coisas).
- **Texto da carta ✏️:** referências localizáveis apontando a **Fortaleza Abandonada** (*"o grosso fica na fortaleza velha — o pagamento está atrás de ⟨referência ✏️⟩"*) — 2–3 referências que só fazem sentido DENTRO da fortaleza (decidido: a carta aponta a fatia ③, não um baú local).
- **Etapas:** obter a carta (drop raro) → ler (registro no diário) → *(fatia ③)* chegar à Fortaleza → achar o esconderijo (`interact`/cavar ✏️) → **baú do bando**.
- **Recompensa:** baú do bando — gold alto + gear raro ✏️ (paga como aberta + maturação).
- **Papel:** segunda promessa longa da fatia (a Água do Poço aponta ②; a carta aponta ③) — o diário acumula pendências que amadurecem com o personagem. Consequência assumida: **duas quests da fatia ① fecham fora dela**.
- **Registro no diário ✏️:** *"Um bandido carregava uma carta: o bando guarda o pagamento na 'fortaleza velha'. Que fortaleza?"*

### Q12. Os Corvos do Moinho / *The Crows of the Mill*
- **Camada:** **aberta** (da v3, mantida)
- **Nível-alvo:** 4–7 ✏️
- **NPC / gatilho:** **Tobias**, o bêbado da Taverna do Cais (sussurrador). **Amarração canônica (decidida):** é "o velho Tobias" do rumor-exemplo de DESIGN-MUNDO — voltou rico de onde ninguém volta, bebeu a fortuna; seus rumores são verdade vivida.
- **Texto-pista ✏️:** *"O Jonas sumiu faz duas luas. E os corvos… os corvos não desgrudam do moinho. Corvo não fica onde não tem o que comer."* — referências localizáveis: ① o **moinho velho** visível da estrada sul · ② os **corvos sobrevoam de verdade** (render no mundo) · ③ **Jonas**, o moleiro que ninguém mais viu.
- **Etapas:** achar o moinho (sem marker) → descer ao **porão** → **baú escondido** + **sinais de bandidos** (cena: restos de acampamento, a trilha aponta pra ponte).
- **Recompensa:** **150 XP** + baú escondido (1 dos da base piramidal — gear incomum/utilitários ✏️) — paga acima da camada direta.
- **Cross-link:** os sinais apontam a ponte dos bandidos (Q9) — quem fez as duas entende o que houve com Jonas ✏️ (corpo? Loremaster decide o quão escuro).
- **Registro no diário ✏️:** *"O porão do moinho: um baú que os corvos guardavam e marcas de bota de bando. Jonas não sumiu — foi tirado."*

### Q14. As Pedras de Passagem / *The Stepping Stones*
- **Camada:** **segredo** (nunca anunciado)
- **Nível-alvo:** 5+ ✏️ (os fundeiros do Juncal atiram através da água)
- **Gatilho:** as **pedras de passagem escondidas no junco** (travessia ④ do layout — o caminho curioso).
- **Etapas:** notar as pedras (telegrafia sutil no cenário) → atravessar → **baú escondido na margem leste** ✏️ posição (M3).
- **Recompensa:** baú escondido + **registro no diário** — e o conhecimento da travessia (atalho permanente do jogador).
- **Papel:** ensina que **o mapa tem travessias que ninguém anuncia** — prepara a descoberta da ⑤ (galeria alagada do esgoto, a travessia secreta).
- **Registro no diário ✏️:** *"O junco esconde pedras firmes. A margem leste guarda mais do que parece."*

---

## Grafo de dependências (gating)

```
Ratos no Porão (Q1)          → aponta Esgotos
A Entrega (Q4)               → trade sucata    → A Estrada Roubada (Q9)
Lobos Demais (Q5)            → bounty orelhas  → Orelha por Orelha (Q8) → fio: Fortaleza (fatia ③)
Reagentes do Boticário (Q3)  → trade reagentes
O Prato do Cozinheiro (Q6)   → receita + trade ingredientes
Caçada do Peleteiro (Q7)     → ato 1 → ato 2 → faca + trade peles
A Água do Poço (Q10)         → camada nova de rumores → arco (fatia ②)
Carta Rabiscada (Q11)        → Fortaleza (fatia ③)
demais                       → sem pré-requisito
```

## Cobertura (o portfólio apresenta o mapa inteiro)

| Saída / canto | Coberto por |
|---|---|
| Portão NE (vau → Brumal) | Q5, Q8 (atos 1–2), Q13 (canto NE remoto) |
| Portão Sul (ponte → Charneca) | Q9, Q12, Q7 (matagal), Q11, Q14 (juncal) |
| Portão Oeste (granja/planícies) | Q2 |
| Porta d'Água (ponte → Atalaia/leste) | Q4, Q14 (margem leste) |
| Esgotos (3 andares) | Q1 (aponta), Q10 (A2), Q15 (A3) |
| Norte (gruta) | Q3 |

## Aberto ✏️

- [x] ~~Nomes definitivos PT/EN de quests, named e carta~~ — **batizados (Loremaster, jun/2026)**: quests em par PT/EN, **Presa-Torta/Crooktusk**, **Carta Rabiscada/Scrawled Letter**; elenco de NPCs em `NPCS.md`
- [ ] Textos-pista finais (os daqui são rascunhos de intenção) — **Loremaster**
- [x] ~~Níveis-alvo, contagens de kill/coleta, valores de XP~~ — calibrados (Balancista, bateria M1 — ver §Orçamento de XP)
- [x] ~~Valores de gold~~ — 1º passe calibrado (Balancista + criador, jun/2026 — ver §Orçamento, gold por quest); ✏️ validação na sim quando loot/gold entrarem (M2)
- [ ] Ficha de Presa-Torta (variante named do Javali) — **bestiário**
- [ ] O destino de Jonas, o moleiro (Q12) — quão escuro? — **Loremaster**
- [ ] Loot dos Ghouls do Porão Afogado (família-coração) — junto do arco (fatia ②)
- [ ] Baú no A3? — decidir no orçamento de baús (M3)
- [ ] Esconderijo exato do Tesouro do Bando — nasce com o design da Fortaleza (fatia ③)
