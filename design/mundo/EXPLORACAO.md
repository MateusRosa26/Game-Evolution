# Mundo — Exploração (spawns, baús, portas, ferramentas)

> Sub-documento de [DESIGN-MUNDO.md](DESIGN-MUNDO.md) (hub). As specs CONCRETAS por fatia (spots, baús, posições) vivem em `design/fatia-1-alvorada/` (e equivalentes das fatias futuras) — este doc é o SISTEMA (gramática de spawns, tipos de baú, portas & chaves, ferramentas).

## Gramática de spawns — spots, não cinturões (decidido)

A caça **não** vive em "zonas/cinturões" demarcados: o mundo é uma **paisagem contínua salpicada de bolsões de spawn** pequenos, cada um com cara própria. A "área de caça" é o jogador quem monta, encadeando spots numa rota. Tipos de spot:

| Tipo | O que é | Exemplos |
|---|---|---|
| **Covil** | o átomo do farm: 3–8 mobs de uma espécie num lugar com identidade | mini-caverna que spawna 3–5 esqueletos, ninho de aranhas |
| **Rota habitada** | mobs que vivem AO LONGO de um caminho — viajar é encontrar | bandidos na estrada, lobos na trilha |
| **Infestação urbana** | mobs avulsos na cidade/periferia + a dungeon urbana | ratos espalhados pela cidade + **esgotos** (clássico Tibia) |
| **Campo temático** | assentamento com narrativa espacial — o spot é legível como LUGAR | bandit camp (tendas, fogueira), cemitério de esqueletos (lápides) |
| **Bioma misto** | 2–4 espécies coerentes dividindo a mesma área, tiers vizinhos misturados | perto de terra gelada: elementais de gelo + ursos + lobos; pântano: serpente + tritões (+ piranhas na água) |

**Regras de coerência (o universo pensa junto):**

1. **Mob mora onde faz sentido** — família × habitat do bestiário, sempre. E o spot conta uma micro-história: *por que* esses esqueletos estão AQUI? (a resposta vem da lore: contaminação, tenente, apego).
2. **Transições fluidas**: nas bordas entre áreas os spawns se misturam (borda da floresta: lobos + goblins) — descobrir a mistura É sentir a transição, sem placa.
3. **Mesmo tier, lugares diferentes**: espécies da mesma faixa espalhadas em spots distintos — variedade de rota de farm e de paisagem, nunca "o corredor único do seu level".
4. **Rotas emergem de encadear**: spots próximos formam circuitos (covil → campo → covil → cidade) que o jogador desenha sozinho; o mapa só posiciona as contas do colar.
5. **Exploração paga em spots**: descobrir um covil escondido É recompensa (e os melhores têm baú guardado no fundo). Spot óbvio = salário; spot escondido = prêmio.
6. **Densidade/respawn por spot**: dimensionados pra sustentar caçada contínua de 1–2 jogadores por spot (números ✏️ balancista, na sim).

## Layout da área inicial (rascunho de trabalho)

> Fonte: `design/rascunhos/area-inicial-v2.png` (Figma Make do criador) — o rascunho é exclusivamente uma **sugestão de layout** para trabalhar em cima. **Cidades já batizadas** (abaixo); **POIs ainda são placeholders**. Mobs e lore definidos por nós.

**Duas regras de ouro do layout (decidido):**

1. **Tier por distância** — o perigo cresce conforme se afasta das cidades: T1 no perímetro urbano → T3 nas áreas remotas. Gradiente contínuo com zonas sobrepostas (áreas de transição), não zonas fechadas.
2. **Tier por profundidade** — caves/dungeons/ruínas têm múltiplos níveis: entrada T1–T2, profundezas T2–T3. Efeitos: o mundo serve várias faixas no mesmo lugar; o jogador **vê o próprio futuro** ("um dia eu desço"); e o último andar é o "muro" T4 natural.

**Geografia-mestre (a espinha permanente, decidida em texto):**

- **Serra gelada** atravessa a borda NORTE (porta de expansão); no trecho NE, o **Pico do Dragão** isolado e visível.
- Do degelo nasce o **rio largo** que desce pela borda LESTE inteira — **Pontal na outra margem** (visível, balsa fechada em Atalaia).
- Um **afluente** nasce nos contrafortes NE e corta o mapa em diagonal ao sudoeste — **Alvorada fica na colina da curva dele** (a razão da cidade: estrada encontra água). Deságua no rio principal no SE, formando o **pântano** do sul.
- **Penhascos ao mar** na borda SUL (porta de expansão). **Floresta** que engrossa do centro ao NE rumo à serra (gradiente T1→T3 visível no terreno). **Planícies** a oeste. **Árvore Sagrada** no horizonte oeste, muito além do mapa.
- Estradas seguem o terreno: Alvorada→Charneca cruza o afluente numa **ponte** (chokepoint); Charneca→Brumal margeia pântano e rio passando pelas **Ruínas Antigas** (node central do triângulo).

**Estrutura — 3 cidades no MVP + 1 porta de expansão (decidido):**

- **Alvorada** (oeste, planícies) — **capital**, hub completo. A primeira cidade fundada após a Chegada: "o amanhecer da humanidade no mundo novo". District: planície dourada, civilização, muralha; weenie: a torre da muralha (+ a **Árvore Sagrada** no horizonte distante — promessa macro da lore). Constelação T1: ratos na cidade + **Esgotos** (dungeon urbana), planícies, trilha dos lobos, acampamento goblin, estrada dos bandidos ao sul.
- **Charneca** (sul) — vilarejo do **arco da Contaminação**. District: planície brava, névoa, musgo cinza; weenie: a colina do cemitério com a capela em ruína. Constelação T1→T2: pântano raso (Aquáticos), cemitério (Mortos-Vivos), **Catacumbas**.
- **Brumal** (nordeste) — vilarejo madeireiro, a **fronteira selvagem**. District: floresta fechada, bruma azulada; weenie: o **Pico do Dragão** ao norte (muro T4–T5 do MVP). Constelação T2→T3: Floresta Sombria, Dungeon da Floresta, Cavernas de Gelo, colinas de ogros — bioma misto na borda da serra (elementais de gelo + ursos + lobos).
- **Pontal** (leste) — **fechada no MVP**: visível do outro lado do rio (a balsa não atravessa), guardada por **Atalaia**, o posto de vigia na estrada leste. É a porta de expansão élfica — o Santuário Élfico (T1–T2) fica acessível como POI deste lado.
- **Esqueleto Lynch**: triângulo de estradas Alvorada↔Charneca↔Brumal com as **Ruínas Antigas no node central** (T1→T3 por profundidade, boss do arco no fundo); edges = serra ao norte, rio a leste, penhascos ao sul (3 portas de expansão); canto NE (gelo+Pico) = extremo do gradiente, o mais longe da segurança.
- **Orçamento de conteúdo do MVP**: ~20–25 spots de caça (ponderados: T2 maior fatia) · ~25–35 quests · **20–30 baús** (piramidal: base utilitária/chaves no early, topo enxuto — ver Baús) · ~12+ segredos não-baú (atalhos, áreas, keywords, NPCs escondidos) · ~16–18 andares de dungeon somados.
- **Construção em fatias verticais**: ① constelação de Alvorada (cidade + esgotos + spots T1) → ② Charneca + atos 1–2 do arco → ③ Brumal + fronteira T3 + boss. Cada fatia jogável de ponta a ponta.
- **Spawn de personagens novos (decidido jun/2026):** o char nasce **sem classe** (modelo Rookgaard — `DESIGN-EVOLUCAO.md`) e spawna **aleatoriamente** entre as cidades de spawn. **Regra: cidade de spawn = constelação T1 ao redor + os 4 NPCs de classe.** No MVP: **Alvorada + Charneca**; Brumal entra ✏️ **se** ganhar bolsão T1 próprio. Os 4 **ritos de classe** (quest boba + gold simbólico, com a cara de cada classe — ver `DESIGN-EVOLUCAO.md`) entram no orçamento de quests e dobram como tutoriais de mecânica.
- **14 pontos de interesse** em 5 categorias (Esgotos de Alvorada adicionado):

| Categoria | POI (placeholder) | Tiers | Encaixe proposto (lore/bestiário) |
|---|---|---|---|
| 🏰 Dungeon | **Esgotos de Alvorada** | T1→T2 | dungeon urbana a 30s do depot — onde todo novato aprende o que é dungeon (ratos → ⁇ na profundidade) |
| ⛰️ Caverna | Caverna dos Goblins | T1–T2 | goblins → hobgoblins (Humanoides) |
| ⛰️ Caverna | Minas Perdidas | T1–T2 | Vermes/Humanoides; túneis rasos → poços profundos |
| ⛰️ Caverna | Covil do Dragão do Pântano | T3 | boss Dracônico alcançável do MVP |
| ⛰️ Caverna | Cavernas de Gelo | T3 | borda norte gelada; gancho "amazonas de gelo" |
| 🏰 Dungeon | Catacumbas de Charneca | T1–T2 | **arco da Contaminação — ato 1 (sintomas)**; Mortos-Vivos |
| 🏰 Dungeon | Dungeon da Floresta | T2–T3 | Plantas/Bestial |
| 🏰 Dungeon | Pirâmide Esquecida | T2–T3 | ✏️ tema a redefinir (muito "deserto MU") — proposta na mesa: **Túmulo dos Primeiros** / *Barrow of the First Ones*, tumba da civilização pré-humana do planeta (mistério de lore novo; fundo = muro T4) |
| 🏰 Dungeon | Pico do Dragão | T3 → **promessa T4–T5** | "dragões anciões" — visível, mortal, pós-MVP |
| 🏛️ Ruína | Ruínas Antigas | T1–T3 | superfície → subsolo → cripta: **arco da Contaminação — atos 2–3, boss autor no fundo** |
| 🏛️ Ruína | Fortaleza Abandonada | T2–T3 | Humanoides (bandidos/orcs); pátio → masmorras |
| 🗼 Torre | Torre dos Magos | T2–T3 | lar de um **Seguidor do Primeiro Mago** (treinador de skills intermediárias?) |
| ⛩️ Templo | Templo Submerso | T2–T3 | Aquáticos |
| ⛩️ Templo | Santuário Élfico | T1–T2 | primeira presença élfica (eco da aliança da Guerra do Submundo) |

**Aberto sobre o layout ✏️:**

- [ ] Posições exatas de cidades/POIs/spots no grid 800×800 (fatia por fatia, com rascunhos do criador)
- [ ] POIs de dragão: Covil do Pântano = boss T3 alcançável; Pico do Dragão = promessa T4–T5 (proposta — confirmar)
- [ ] Pirâmide Esquecida → *Túmulo dos Primeiros* (proposta de re-tema na mesa)

# Baús e tesouros

**Todo baú é one-time por personagem** (decidido): abrir um baú é um evento, não uma rotina de farm. Estado por-jogador vive na sim — no online, cada jogador tem seus próprios baús fechados.

> Consequência assumida: o mapa "esvazia" para o explorador completista. **Não existe tesouro repetível de nenhuma natureza** (decidido) — a mitigação é só por conteúdo novo: cada atualização (novas regiões, M3+) traz novas levas de baús e segredos, e os rumores que evoluem dão motivo de revisitar NPCs mesmo com os baús da região já abertos.

## Tipos de baú

| Tipo | Onde | Proteção | Conteúdo típico |
|---|---|---|---|
| **Escondido** | cantos não-óbvios: atrás de árvores, fim de cavernas opcionais, ilhotas | só achar | **utilitários (pá/corda/tocha)**, gold, potions, **chaves**, gear comum–incomum |
| **Guardado** | fundo de covis perigosos (mobs acima do tier da zona) | risco | gear **incomum–raro**, gold alto, chaves |
| **Lacrado** | visível em caminhos naturais — a "promessa" | **nível mínimo** (estilo quest door) | gear **raro**, às vezes **lendário** nos lacres altos |
| **Secreto** | atrás de interação: alavanca, parede rachada, puzzle simples | descoberta | o topo: **raro–lendário**, itens de acesso |

- **Orçamento piramidal (revisado jun/2026, com o sistema de chaves):** **~20–30 baús no MVP** — a base (~⅔) é de baús **iniciais/baixos** em áreas T1–T2: utilitários (pá/corda/tocha), gold pequeno, consumíveis e **chaves** — exploração recompensada desde níveis baixíssimos. O meio é gear (guardados/escondidos). O topo é **enxuto**: poucos baús avançados (3–5 lacrados altos/secretos com raro–lendário). A decisão das chaves é o que torna o volume maior válido: baú com chave = uma **porta em algum lugar** acaba de virar promessa.
- **Lacrados** ficam à vista de propósito: lacres BAIXOS perto da civilização (ex.: nível 10 nos esgotos — promessa de early game, volta-se em dias, não semanas), lacres altos nas profundezas. O jogador memoriza e volta. (2–4 lacrados no MVP.)
- **Escondidos**: num jogo onde upar é difícil, achar uma corda, uma chave ou umas botas melhores **muda o dia do jogador**. A recompensa-base da exploração continua sendo *descobrir* (spots, atalhos, conhecimento) — o baú é a cereja material por cima.
- Interagir com baú já aberto mostra que está vazio ("Você já levou o que havia aqui.") — o estado é claro.
- ✏️ Posições reais: M3 (design de mapa), distribuindo o orçamento entre os 4 tipos.

## Portas & Chaves (decidido — jun/2026, modelo Apogea)

Portas trancadas que só abrem com a chave certa — e **a chave não diz qual porta abre**:

- **Chave = flag permanente por personagem**: não-física, não ocupa espaço, **introcável** (fora da economia), impossível perder. É "informação é loot" mecanizado — acesso como conhecimento, não como item.
- **Fontes**: containers, quests, cantos do mundo (mesmo espírito dos baús: achar uma é evento, ~✏️ orçamento MVP).
- **O mistério é dos dois lados**: a chave achada é uma promessa ("o que ela abre?"); a porta trancada vista é uma pergunta ("onde está a chave?"). O mapa acumula promessas — mesma lógica dos lacres por nível.
- **Chaveiro no diário (decidido)**: lista as chaves com **nomes/descrições evocativas** — o nome É a pista; **nunca** a porta associada, **nem onde foi achada** (minimalista no MVP — revisitável se a escala pedir). Portas trancadas **não são rastreadas** — o mapa mental é do jogador. **Exemplos canônicos (batizados jun/2026):** *chave de bronze com cabeça de corvo* / *bronze key with a raven's head* · *chave fina de osso polido* / *slender key of polished bone* (sussurra cripta) · *chave pesada com um elo de corrente partido* / *heavy key with a broken chain link* (sussurra celas).
- **Aviso só no primeiro uso (decidido)**: a primeira porta aberta por uma chave anuncia qual serviu ("a chave de bronze serviu") — o payoff do mistério. Usos subsequentes: silêncio, a porta só abre. (Chave multi-porta: aviso no 1º uso da *chave*, não por porta.)
- **Dois tipos de porta (decidido)**:
  - **Comum (padrão, social)** — abre com a chave do portador e **segura aberta ~X segundos** para o grupo passar junto. "O portador da chave" vira papel social: ele lidera a expedição.
  - **Selada (exceção autoral)** — só passa quem tem a chave, individualmente. Reservada a conteúdo de conquista pessoal (NPC secreto, sala de quest, prêmio de linha individual) — fecha o furo do loot per-character atrás de porta social.
- **A chave é exigida dos DOIS lados (decidido — sem "abre por dentro")**: quem entrou pela janela social está **comprometido** — sai com o portador, ou morrendo (custo de XP). O risco é legível ANTES (pilar 2: você atravessou sabendo que não tem a chave). Efeitos desejados: caçar em party atrás de porta = compromisso real; co-dependência do portador; **venda de acesso vira serviço de sessão** (o dono controla entrada e saída — pagar uma vez ≠ caçar lá pra sempre).
- **Telegrafia honesta**: porta-de-chave tem visual distinto de porta-lacre-de-nível (fechadura × selo ✏️ Diretor de Arte) — o jogador sabe *que tipo* de barreira vê, nunca *como* resolvê-la.
- **Taxonomia limpa**: chave abre **portas/portões/alçapões** (prova de descoberta); lacre de baú segue por **nível** (prova de poder). Sem sobreposição.
- **Anti-datamine**: o mapeamento chave→porta nunca viaja no snapshot — porta só informa "trancada"; a sim valida ao interagir.
- **Arquitetura**: porta = dado declarativo (`requiredKey` + tipo comum/selada); eventos `key_found`/`door_open` entram na leva do M3 (com `chest_open`/`region_enter`).

**Blindagens propostas ✏️** (a confirmar no design de mapa/M3):

- **Distância narrativa**: a maioria das chaves encontra sua porta **na mesma região/capítulo**; só 1–2 "mistérios longos" por região.
- **Anti-softlock**: porta de chave tranca conteúdo **opcional/secreto/atalho** — caminho obrigatório de quest usa lacre de nível, ou garante a chave na própria linha.
- **Rumores como válvula**: toda porta/chave importante tem um rumor de Sussurrador associado — chaves alimentam o hábito de falar com todo mundo.
- **1 chave : 1 porta como padrão**; chaves temáticas multi-porta ("a do carcereiro" abre as 4 celas) são exceção autoral.

## Ferramentas de exploração (decidido — jun/2026, modelo Tibia)

**Pá, corda e tocha** existem como mecânica de mundo — profundidade num modelo que os jogadores do gênero já conhecem de cor. Completam a tríade de portões de acesso:

| Portão | Prova de | Mecânica |
|---|---|---|
| Lacre de nível | **poder** | baú/porta exige nível |
| Chave | **descoberta** | flag permanente, mistério dos dois lados |
| **Ferramenta** | **preparo** | ter o item certo na hora certa |

**O cenário completo (decidido — corda/pá são só as básicas):** cada ferramenta é um **verbo de interação com o mundo**:

| Ferramenta | Verbo | O que destrava | Notas |
|---|---|---|---|
| **Corda** | subir | buracos/aberturas verticais (rope spots) | a básica nº 1 |
| **Pá** | cavar | terra solta → buracos tapados, desenterrar | a básica nº 2 |
| **Tocha** | iluminar | áreas de breu (usa o sistema de iluminação) | consumível |
| **Faca de esfolar** | esfolar | carcaças → peles/carnes EXTRA (alimenta o comércio de loot e a cozinha) | aprofunda a caçada ✏️ |
| **Vara de pesca** | pescar | peixes em água → ingredientes de comida | ✏️ **em avaliação** — só entra se a mecânica for interessante de verdade |
| **Facão** | abrir caminho | mato fechado → trilhas/atalhos vegetais | telegrafia: vegetação visivelmente diferente |

**Efeitos de ferramenta são TEMPORÁRIOS e compartilhados (decidido):** mato cortado **rebrota** e buraco cavado **se fecha** depois de X tempo (✏️ timers) — modelo Tibia. É o que faz ferramenta conviver com o Princípio MMO e a Permanência do mapa: o mundo reage à ferramenta, mas **se cura sozinho** — nenhuma ferramenta muda o mapa para sempre. (Picareta: cortada do cenário — decisão do criador.)

- **Corda**: a regra de ouro: **descer é fácil, voltar exige corda** — o custo de fuga das dungeons ganha mecânica. E **alguns buracos prendem DE VERDADE** (decidido): desceu sem corda e não há outra saída — a válvula é morrer (respawn, perdendo XP). A lição mais cara do early game, e a que ninguém esquece: *leve corda*. Não é regra geral — é pontual e autoral, mas existe.
- **Pá**: telegrafia honesta (terra solta é tile visivelmente diferente). E **alguns caminhos/áreas SÓ existem para quem carrega pá** (decidido) — conteúdo exclusivo de quem anda preparado.
- **Aquisição barata e abundante** (as básicas): mercador vende, baús iniciais contêm — ferramenta é chave de acesso, **nunca tesouro**. As especializadas (faca, vara, picareta, facão) podem ter fontes próprias ✏️ (quest, NPC específico). O "kit do aventureiro" é decisão de mochila: ninguém carrega as 7 — escolher o kit da expedição É gameplay.
- **Punição calibrada por lugar**: na maioria dos pontos, esquecer ferramenta custa tempo (volta longa); nos pontos-armadilha, custa a morte. "Preso permanente" não existe — respawn existe — mas o preço é real e a culpa é sua (anti-padrão respeitado: a punição ensina). O medo de descer despreparado é exatamente o clima que o jogo quer.
- ✏️ Especificação: comando `useItemOnTile` na sim + tiles especiais (buraco, terra solta, breu) — designer-de-sistemas; templates dos itens — `DESIGN-ITENS.md`; visual dos tiles — diretor-de-arte. Entra com as dungeons do M3.

## Casa inicial — o nascimento (decidido — jun/2026)

Tutorial 100% diegético, modelo Tibia/Apogea: o personagem (sem classe — `DESIGN-EVOLUCAO.md`) acorda numa **casa inicial** da cidade de spawn:

1. **NPC-guia** conversa e orienta (primeiro contato com diálogo).
2. **Containers domésticos** (caixas/armários/barris — **nunca o asset de baú**, que é sagrado/raro) guardam: **Gibão Roto** + **Botas Surradas**, a **Espada Cega** e a **Sacola de Pano** (batizados jun/2026 — pares EN em `DESIGN-ITENS.md`).
3. O jogador **equipa** (aprende slots na prática), acha a **primeira chave** num armário e abre a **porta de saída** — o loop assinatura container→chave→porta ensinado no minuto 2.
4. Sai da casa direto na cidade de spawn, classless, com a régua do zero vestida.

- Uma casa por cidade de spawn (Alvorada + Charneca no MVP); conteúdo per-character (princípio MMO padrão).
- Itens da casa: **zero bônus de identidade, venda ≈ 0** (regras do kit em `DESIGN-ITENS.md`).
- **A primeira mochila de verdade vem de quest básica** em NPCs iniciais (decidido jun/2026) — cada cidade de spawn tem a sua; upgrade da sacola como recompensa de quest, não compra.
- **Armaduras T1 com distribuição geográfica (decidido jun/2026):** as peças T1 variantes vivem nos **baús iniciais** (base da pirâmide) das primeiras áreas, **peças diferentes por região** — a armor perto de Alvorada, o robe perto de Charneca; ninguém acha tudo num lugar. Mercadores vendem só o básico genérico — o gear inicial *bom* é prêmio de exploração.
- ✏️ roteiro/falas do NPC-guia (Loremaster); layout da casa (world-designer).

## Itens — papel no sistema (detalhamento no M2)

Raridades alinhadas aos slots de Marca (`DESIGN-EVOLUCAO.md`):

| Raridade | Slots de Marca | Fonte principal |
|---|---|---|
| Comum | 1 | loot de mob, mercadores |
| Incomum | 1 | loot de mob, baús escondidos/guardados, quests diretas |
| Raro | 1 | baús lacrados/secretos, quests abertas, mobs T4–T5 |
| **Lendário** | 2 | segredos profundos, lacres altos, bosses (doc futuro) |
| **Único** | 3 | eventos canônicos, world bosses — nunca de baú comum |

- **Itens de facilitação** (o tempero dos baús escondidos): anel de regeneração menor, botas do viajante (+velocidade leve), bolsa maior, tocha que não apaga. Pequenos, sentidos no dia-a-dia, nunca quebram o balance.
- Itens são **instâncias com ledger** desde o M2 (já decidido) — um item de baú já nasce rastreando suas Marcas.
- ✏️ Slots de equipamento, stats de item, loot tables: doc/M2.
