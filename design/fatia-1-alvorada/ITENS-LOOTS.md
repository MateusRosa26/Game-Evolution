# Fatia ① Alvorada — Itens, Loots & Comércio

> Especificação de conteúdo da fatia (consome: `DESIGN-ITENS.md` §Loot & gold, §Poções, §Ferramentas · `DESIGN-MUNDO.md` §Comércio especializado · `DESIGN-BESTIARIO.md`). Números de drop rate/preço = ✏️ Balancista (na sim). **NPCs batizados** (jun/2026 — elenco em `NPCS.md`); nomes de item = working titles PT (✏️ pares EN com o catálogo).

## Princípios aplicados (decididos pelo criador)

1. **Gold dropa de mob, mas POUCO** — o miúdo do dia-a-dia.
2. **A renda de verdade é vender loot — e é pouco óbvia**: compradores específicos, muitos **destravados por quest**.
3. **Poção é luxo no early** (pequena/média/grande; média+ atrás de quest/NPC específico).
4. **Ferramentas bem pensadas**: kit do aventureiro é decisão de mochila.

## Os mobs da fatia e suas loot tables

| Mob (bestiário) | Tier | Onde (spots v4) | Gold ✏️ | Loot vendável | Loot raro ✏️ |
|---|---|---|---|---|---|
| Rato Lanhoso | T1 | cidade, granja, esgoto A1, planícies | minúsculo | **Cauda de Rato** | — |
| Lobo Cinzento | T1–T2 | toca, trilha, planícies | minúsculo | **Pele de Lobo**, Carne (às vezes) | Presa Perfeita (rara) |
| Morcego Sanguessuga | T1 | gruta dos morcegos, esgoto A2 | minúsculo | **Asa de Morcego** | — |
| Goblin Batedor | T1 | acampamento, caverna | pequeno | **Orelha de Goblin** | Amuleto Tosco |
| Goblin Fundeiro | T1–T2 | juncal, caverna | pequeno | Orelha de Goblin + **Funda Gasta** | — |
| Escaravelho de Cripta | T1 | esgoto A2 | minúsculo | **Carapaça de Escaravelho** | — |
| Aranha-das-Cavernas | T2 | ninho, esgoto A2 | pequeno | **Glândula de Veneno**, Seda | — |
| Javali de Presas | T2 | matagal | pequeno | **Presa de Javali**, Couro Grosso, **Carne de Caça** | — |
| Orc Soldado *(decidido jun/2026 — orcs armam os goblins; fio → Fortaleza)* | T2 | fundo da Caverna dos Goblins | pequeno–médio | **Sucata de Arma**, Escudo Lascado | peça T1 de gear |
| Bandido da Estrada | T2 | ponte | **médio** (humanos carregam gold) | **Adaga Enferrujada**, Anel de Latão | **Carta Rabiscada** (*Scrawled Letter* — inicia *O Tesouro do Bando*, `QUESTS.md` Q11) |
| Ghoul | T3 | Porão Afogado (1–2) | médio | ✏️ (família-coração — ver arco) | — |

- Regra de família mantida: humanoides dropam mais gold e gear (carregam coisas); bestas dropam troféu de caça; vermes dropam reagente.
- Drop rates, valores e stack: ✏️ Balancista, com a régua de economia abaixo.

## O mapa de comércio (quem compra o quê)

| Comprador (NPC v4) | Compra | Destravado por |
|---|---|---|
| **Nina — Loja Geral** (vendor geral, Baixa) | quase nada, preço ruim (vendor floor) | sempre aberto — a opção preguiçosa |
| **Amaro, o caçador-peleteiro** (civil, CAIS) | Pele de Lobo, Couro Grosso, Presa de Javali | **A Caçada do Peleteiro** (`QUESTS.md` Q7 — 2 atos, clímax no named **Presa-Torta**/*Crooktusk*) |
| **Silas, o boticário** (loja de Poções, Baixa) | Glândula, Seda, Asa de Morcego, Cauda de Rato | **quest dele** (coleta de reagentes — a própria quest ensina o que ele compra) |
| **Duarte, o ferreiro** (Baixa) | Sucata de Arma, Adaga Enferrujada, Escudo Lascado | **quest da Entrega** (já existente — vira a porta do trade) |
| **Capitão Vidal** (Quartel) | Orelha de Goblin (*bounty*) | **quest Lobos Demais** → abre o contrato de bounty |
| **Abel, o coveiro** (Capela) | ✏️ itens do arco (restos profanos — fatia ②) | quest A Água do Poço |
| **Bento, o cozinheiro** (estalagem) | ingredientes (carnes, colheita) **e pratos prontos** — renda não-combate | **quest do cozinheiro** (a mesma que destrava a 1ª receita) |

- **Nenhum comprador especializado é anunciado**: descobre-se conversando (keywords/diálogo) ou pela quest. O vendor geral existe pra venda preguiçosa render pouco — a diferença paga o conhecimento.
- No online: o "mapa de comércio" vira conhecimento que circula entre jogadores — exatamente como rotas de hunt.

## Comida na fatia (modelo Apogea — ver DESIGN-ITENS §Comida & Cozinha)

A fome é o portão do regen; a fatia ① introduz o sistema inteiro em pequena escala:

| Item | Fonte | Papel |
|---|---|---|
| **Pão** | vendor geral / estalagem | o saciador barato — mantém o regen ligado |
| **Carne crua** | loot: Javali (sempre), Lobo (às vezes) — **esfolar com faca rende mais** ✏️ | ingrediente |
| Peixe cru ✏️ | pesca no afluente (vara) — SÓ se a mecânica de pesca for aprovada | ingrediente |
| **Carne assada** (e peixe ✏️) | cozinhar na fogueira/estalagem | comida melhor: regen maior por duração |
| **Ensopado** ✏️ (1ª receita "buff food") | receita da **quest do cozinheiro da estalagem** (modelo Licensed Chef do Apogea) | regen forte + ✏️ 1 stat por ~5min — o luxo acessível |
| Morangos/colheita ✏️ | **hortas da cidade ganham função**: forrageio leve | snack rápido |

- A **quest do cozinheiro** entra no portfólio de quests da fatia (simples-direcional que destrava conhecimento permanente).
- Receitas além do ensopado: fatias ②/③ (descobríveis — livros, NPCs, experimentação ✏️).

## Poções na fatia (barreira ALTA — revisado)

| Poção | Fonte | Acesso |
|---|---|---|
| **Vida Pequena** | loja de Poções (Baixa) | sempre — mas CARA pro early (luxo ✏️ régua abaixo); papel: EMERGÊNCIA |
| **Vida Média** | **fora da fatia ①** | **quest T2+** — desvinculada das quests iniciais; conquista do mid-game (Charneca/Torre dos Magos, fatias ②+) |
| **Vida Grande** | longe | barreira T3+/NPC remoto — fatia ③+ |
| Mana (P/M/G) | ✏️ mesma lógica? | a decidir com o Balancista (sustain de Mage/Priest) |

> O boticário da fatia ① compra reagentes (pós-quest) e vende a pequena — ele NÃO é a porta da média. Sustain de rotina = comida + kit de classe.

## Ferramentas na fatia

| Ferramenta | Modelo ✏️ | Fonte na fatia | Preço-alvo |
|---|---|---|---|
| **Corda** | permanente | vendor geral + baús iniciais | não-trivial: dói no lvl 3, banal no 10 |
| **Pá** | permanente | vendor geral + baús iniciais | idem |
| **Tocha** | consumível (stack) | vendor geral, barata | recorrente pequeno |
| **Faca de esfolar** | permanente | **quest do caçador-peleteiro** (a mesma que destrava o trade de peles — a faca é a ferramenta E o símbolo) | — |
| Vara de pesca | ✏️ EM AVALIAÇÃO | (só se a mecânica de pesca for aprovada) | — |
| Facão | — | **fatia ③** (mato fechado rumo a Brumal) | apresentado como portão visível |

- O cenário (6 ferramentas; picareta cortada) vive em `DESIGN-MUNDO.md` §Ferramentas. **Efeitos são temporários**: mato rebrota, buraco se fecha (✏️ timers — balancista/sistemas).
- Kit antes da primeira dungeon = decisão de mochila (peso/slots ✏️ DESIGN-ITENS).

## Régua de economia do early (alvos p/ Balancista)

1. **Rito de classe** ≈ as 5–6 quests simples + caça T1 até ~lvl 6–8. É a primeira meta financeira do jogo — apertada o bastante pra ser conquista.
2. **Poção pequena = luxo**: custo ≈ a renda de uma sessão razoável de caça T1 (✏️ ordem de 30+ min) — compra-se pra emergência, não pra rotina. Sustain de rotina = kit de classe + regen.
3. **Kit do aventureiro** (corda+pá+3 tochas) ≈ metade do rito? — o jogador escolhe entre adiantar o rito ou explorar fundo.
4. **Vender certo > vender rápido**: o mesmo saco de loot rende ✏️ ~2–3× no comprador especializado vs vendor geral.
5. Gold drop por mob T1: minúsculo o bastante pra que **nenhuma régua acima feche sem loot/quests** — gold de mob é tempero, não salário.

## Aberto ✏️

- [x] ~~Hobgoblin ou Orc Soldado no fundo da caverna?~~ → **Orc Soldado** (decidido jun/2026 — clímax de *Orelha por Orelha*, `QUESTS.md` Q8)
- [x] ~~Loot raro de Bandido (pista/mapa)~~ → **Carta Rabiscada** (`QUESTS.md` Q11 — aponta a Fortaleza Abandonada, fecha na fatia ③)
- [x] ~~Nomes de NPCs~~ → batizados (Loremaster, jun/2026 — `NPCS.md`)
- [x] ~~Esfolar com faca: rende loot EXTRA ou é requisito?~~ → **decidido (criador, jun/2026): esfolar é VERBO gated pela faca, em cima do drop normal.** A loot table normal do mob cai sempre, com ou sem faca (a Q7-Ato1 segue sem deadlock). Com a Faca de Esfolar, mobs **esfoláveis** (lista específica — uns rendem pele+comida, outros só pele) podem ser esfolados: chance de pele e chance de comida, **cada uma <50% e nunca garantida**, com **condicional negativa** (saiu pele → chance de comida cai; saiu comida → chance de pele cai — anti-jackpot). Quais mobs são esfoláveis e os % exatos ✏️ Balancista (bateria M2).
- [x] ~~Mecânica da fome~~ → **decidido (criador, jun/2026): modelo de DURAÇÃO (Tibia)** — comida ativa saciedade por tempo específico do alimento; sem comida ativa, a única penalidade é regen natural de HP/MP desligado. Registrado em `DESIGN-ITENS.md` §Comida. Durações ✏️ Balancista.
- [ ] Pares EN dos nomes de item (Loremaster, com o catálogo) e números (Balancista)
