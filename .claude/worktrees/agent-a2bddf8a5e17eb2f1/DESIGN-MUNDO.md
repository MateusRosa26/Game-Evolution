# Mundo — Exploração, Quests, NPCs e Tesouros

> Documento vivo. Seções ✏️ são preenchidas pelo criador. Conteúdo concreto (quests reais, NPCs nomeados, posições de baú) nasce junto com o design de mapa (M3).

> **Hub.** Os corpos detalhados vivem em `design/mundo/`: [SISTEMA-QUESTS.md](SISTEMA-QUESTS.md) (as 3 camadas, templates, diário), [SISTEMA-NPCS.md](SISTEMA-NPCS.md) (comércio, diálogo, templates), [EXPLORACAO.md](EXPLORACAO.md) (gramática de spawns, layout, baús, portas & chaves, ferramentas, casa inicial, itens), [MOBILIA-URBANA.md](design/mundo/MOBILIA-URBANA.md) (contrato de props de cidade + placement da feira ao redor do poço). Este doc reúne a filosofia, os princípios de mundo e o mapa de decisões.

## Filosofia — o mundo recompensa quem olha

Estilo **Apogea/Tibia clássico**: exploração e descoberta são recompensa central, não decoração.

1. **O mapa esconde mais do que mostra.** Nada de "!" amarelo flutuando sobre NPC, nada de seta guiando até o objetivo. O jogador que sai da estrada encontra coisas que o jogador apressado nunca verá.
2. **Informação é loot.** Rumores de NPC, livros, placas e cartas valem tanto quanto itens — eles apontam para os segredos. Falar com todo mundo é jogar bem.
3. **Recompensa proporcional à opacidade.** Quanto menos o jogo te guia até algo, melhor o prêmio. Quest com marker paga menos que rumor vago, que paga menos que segredo nunca anunciado.
4. **Sinergia com as Marcas:** o jogo já cultiva uma comunidade arqueóloga (condições ocultas, hints vagas — ver `DESIGN-EVOLUCAO.md`). Quests abertas e segredos alimentam a mesma cultura: wiki, teorias, lendas.

## Princípio MMO (decidido)

O jogo é desenhado como **MMORPG** — toda mecânica de mundo nasce pensada para servidor compartilhado:

- **O mundo é de todos; o progresso é do jogador.** Quests, camadas de rumor, baús abertos, acesso a áreas: tudo é estado **por personagem**. O mundo em si (spawns, zonas, NPCs) é compartilhado e estável — a ação de um jogador nunca remove/muda conteúdo permanentemente para os outros.
- Consequências práticas: "matar a fonte" de uma região infestada é clímax de quest **do jogador** (a fonte respawna/persiste para os demais); "purificar" uma área nunca apaga um spot de caça do servidor; NPCs respondem ao **seu** progresso, não ao de quem passou antes.
- **Named mobs de quest = mundo compartilhado, nunca phasing (decidido jun/2026):** o named vive no mundo desde sempre, visível pra todos, com **respawn contínuo lento** (✏️ balancista — evento, não farm); explorador sem quest pode topar com ele e morrer (descoberta pura). O evento `kill` **credita todo personagem que contribuiu** no combate (dano/party), não só o golpe final — multidão no spawn (launch day) vira mutirão social, não fila frustrada. Exemplo canônico: **Presa-Torta** (*Crooktusk*), o javali velho (fatia ①, `design/fatia-1-alvorada/QUESTS.md`).
- A exceção que confirma a regra: **eventos canônicos** raros (world bosses, momentos históricos do servidor — ver evolução de Marcas em `DESIGN-EVOLUCAO.md`) são o único mecanismo que muda o mundo para todos.

## Permanência do mapa (decidido)

**O mapa é (quase) eterno.** Num MMORPG, mudanças de mapa são extremamente raras — o layout vira memória espacial coletiva dos jogadores (rotas, "meus" spots, pontos de encontro), e isso é patrimônio do jogo, não dívida técnica:

- **Desenhar já na direção do acabado.** Toda região nova nasce com qualidade de final — a iteração acontece nos RASCUNHOS (baratos, descartáveis), nunca no mapa vivo. É por isso que geografia (rios, colinas, forma das cidades) se decide com cuidado extra: é a camada mais permanente de todas.
- **Expansão é aditiva, nunca revisionista**: regiões novas se conectam pelas portas preparadas (rio de Pontal, serra, penhascos); o terreno existente não se redesenha.
- **Única exceção: eventos muito grandes do mundo** — e ainda assim alterações PEQUENAS e pontuais (uma ponte destruída, uma fissura aberta, um edifício queimado). São o mesmo mecanismo dos eventos canônicos das Marcas: raros, históricos, compartilhados — o servidor *lembra* ("isso aconteceu aqui").

## Estrutura do mundo — cidades + zonas, sem países (decidido)

- **Sem conceito de países.** A geografia política do continente é deliberadamente vaga (cidades livres ✏️ lore futura). País/reino só entra se um dia houver motivo mecânico (facções, PvP territorial) — não é MVP.
- A unidade mental do jogador é a **região**: **cidade-âncora + zonas de caça ao redor + estradas perigosas ligando cidades** (modelo Tibia: Thais/Carlin/Venore, sem nação definida e sem fazer falta).
- Expansão do mundo = adicionar regiões/cidades, nunca redesenhar fronteiras.

## Recorte do MVP (decidido)

**Uma região do continente central**, suportando evolução até **lvl ~20–25** — upar é difícil (ver Ritmo em `DESIGN-EVOLUCAO.md`), e é essa lentidão que torna Marcas/Mutações/Caminhos viáveis dentro do cap baixo.

| Faixa | Spots viáveis (alvo) | Exemplos com o bestiário atual |
|---|---|---|
| T1 (lvl 1–8) | 4–5 | ratos na cidade + esgotos, trilha dos lobos, acampamento goblin, borda da floresta |
| T2 (8–15) | **7–9** | mini-caverna de aranhas, **cemitério contaminado** (1º arco), pântano raso, estrada dos bandidos |
| T3 (15–25) | 5–6 | cripta profunda, floresta densa (plantas/urso), colinas (ogros), covil do culto |

> Ponderação pelo ritmo (ver alvo de horas em `DESIGN-EVOLUCAO.md`): **T2 é o centro de gravidade** — a maioria da população vive entre os níveis 8–18, então é a faixa que mais precisa de variedade.

Regras do recorte:

- **Spots suficientes por faixa**: upar lento = muito tempo em cada faixa; spot único cansa e congestiona no MMO. Spots são **bolsões pequenos** (ver Gramática de spawns em `EXPLORACAO.md`).
- Dimensão: **800×800 tiles (decidido)** — travessia real ~6–8 min; cidade↔cidade ~2–2,5 min (morrer longe de casa custa de verdade); wilderness genuína entre os spots. **Andares/z-level: REVISADO (08/jun/2026 — criador escolheu z-level real estilo Tibia)** — dungeons/cavernas/esgotos são andares empilhados no mesmo espaço `(x,y,z)`, buracos vazados (vê o andar de baixo), escada/corda/pá. Spec completa em [`design/mundo/SISTEMA-ANDARES.md`](design/mundo/SISTEMA-ANDARES.md). (Substitui a decisão anterior de "mapas separados".)
- A exploração é **liberada por poder, não por pernas**: lvl 1–8 anda seguro por ~25% do mapa; 8–15 por ~55%; 15–25 por ~85% — conhecer o mapa inteiro é projeto das ~30–45h, não da primeira hora (soft gates de letalidade fazem o trabalho).
- **T4–T5 ficam fora do cap mas dentro do mapa** como "muros vivos": um Espectro (T4) no fundo da cripta é a promessa que o jogador um dia cumpre.
- **Saídas da região bloqueadas naturalmente** (cordilheira, rio largo, posto de guarda "estrada fechada") — cada bloqueio é uma porta de expansão pronta.
- Rascunhos de layout do criador em `design/rascunhos/`.

## Nomenclatura (processo a construir ✏️)

- **Status:** cidades **batizadas** (Alvorada, Brumal, Charneca, Pontal + Atalaia no banco — piloto da metodologia). Zonas, POIs e NPCs: ainda placeholders.
- **Bilíngue por design (decidido):** o jogo lança em **EN + PT-BR** selecionável. Regra de nomenclatura em dois regimes:
  - **Nomes próprios** (cidades, NPCs, vilões, povos) são **invariantes** — iguais nos dois idiomas, como Tibia faz (Thais é Thais em qualquer língua). Devem soar bem em ambos.
  - **Nomes descritivos** (zonas, POIs, mobs, itens, quests) são **traduzidos** — autorados **em par** desde o nascimento (ex: *Minas Perdidas* / *Forsaken Mines*). Se um nome só funciona num idioma, escolhe-se outro.
- **Nomes humanos: base universal + tempero lusófono seletivo (revisado jun/2026):** com dezenas de NPCs vindo, nome lusófono para TODOS vira caricatura e trava a pronúncia dos gringos. Regra: a **base do elenco usa nomes universais** da fantasia medieval (pan-europeus, fáceis em qualquer língua — Abel, Marco, Gabriel, Silas, Nina); o **sabor lusófono vira assinatura seletiva** — uma minoria marcante (velha guarda, fundadores, gente "da terra": um Bartolo, um Amaro, um Duarte no meio do elenco). **Topônimos seguem a toponímia lusa** (Alvorada, Charneca… — a assinatura geográfica não muda). Critério prático para todo nome novo: **um americano lê em voz alta sem travar**. Na lore segue valendo: a língua dos colonos tem fonologia portuguesa — ela aparece nos topônimos e nos nomes da velha guarda. Elenco-piloto: fatia ① (`design/fatia-1-alvorada/NPCS.md`, ~⅓ luso / ⅔ universal).

### As 5 fontes de referência (decidido)

| # | Fonte | O que ela dá | Usar para |
|---|---|---|---|
| 1 | **Tibia** | a regra de dois regimes: civilização = nome próprio inventado; wilderness = descritivo evocativo | estrutura geral |
| 2 | **Toponímia luso-brasileira** | como colonos batizam terra nova: geografia + fé + acontecimento (Ribeirão das Almas, Serra do Desterro, Ouro Preto) | topônimos (sempre) + a minoria lusófona do elenco humano (revisado jun/2026 — ver regra acima) |
| 3 | **FromSoftware** (Dark Souls/Elden Ring) | peso mítico: substantivo + genitivo carregado (*Túmulo dos Gigantes / Tomb of the Giants*) | lugares lendários, itens, Marcas, bosses, eventos canônicos — reservado pro que é raro |
| 4 | **Bestiários medievais / folclore ibérico** | criatura com sabor de crônica ("registrada por um estudioso") | mobs, famílias, variantes |
| 5 | **Fonologia própria por povo** | humanos = lusófona; planeta nativo, elfos, anões, demônios = fonologias distintas ✏️ a desenhar | qualquer nome próprio novo sai das regras do povo dono dele |

- Com o tempo: **skill "nomeador"** no repo (`.claude/skills/`) com a metodologia — entrada (tipo + contexto: tier, família, ganchos de lore), regras (5 fontes, fonologia por povo, **par EN/PT obrigatório**, anti-colisão com nomes existentes nos docs), saída (3–5 candidatos com justificativa).

### Registro aprovado pelo criador (calibrado no piloto das cidades)

- **Gosto confirmado:** palavra única, geográfico-atmosférica, sonoridade elegante — *Alvorada, Brumal, Charneca, Pontal, Atalaia*.
- **Evitar:** nomes religiosos/fúnebres diretos (Vésperas, Capela, Campossanto), função comercial (Feitoria), compostos inventados (Entreverde), rural-banal (Figueiral, Lameira).
- Exemplares canônicos para a skill nomeadora: as 4 cidades acima + Atalaia (banco).
- **Reclassificação (jun/2026):** **Alvorada** deixou de ser "capital" e passou a ser **a primeira povoação** (vila de fronteira, casas pequenas, muralha baixa de pedra) — ver Geografia em `DESIGN-LORE.md`. O nome continua válido: "Alvorada/amanhecer" cabe ainda melhor num começo humilde.
- **Fila de batismo — a grande cidade-capital (✏️ fora do MVP):** o coração estabelecido e monumental da humanidade, destino de expansão. Conceito-âncora: **par com Alvorada** (amanhecer → auge). Candidatos calibrados no gosto registrado: **Meridiano** *(meio-dia/zênite — o oposto solar de "amanhecer"; geográfico-astronômico, lê em EN/PT — recomendado pelo par temático)* · **Lumiar** *(toponímia lusa real, raiz de luz/lume — cidade-luz)* · **Solânea** *(toponímia BR real, raiz solar)* · **Coroada** *(evoca a sede-mãe sem dizer "capital"; risco de on-the-nose)*. Criador escolhe quando o jogo precisar — segurar até lá.

## Mapa de decisões (fechado)

| Tema | Decisão |
|---|---|
| Quests | **3 camadas**: diretas (com marker no mapa) / abertas (rumor, sem marker) / segredos (nunca anunciadas) |
| Marcador de mapa | **Só quests diretas** marcam o mapa. Quest aberta nunca ganha marker depois — hint extra vem de NPCs, não de UI |
| Contador de caça | **Só nas diretas** (contador discreto no diário, "4/8") — abertas e segredos nunca (jun/2026) |
| Named mobs | Mundo compartilhado, **nunca phasing**: respawn contínuo lento; `kill` credita **todos que contribuíram** (jun/2026) |
| Journal | **Diário escrito** com as palavras do NPC. Sem tracker de objetivos na tela, sem setas |
| Diálogo NPC | **Híbrido**: janela com opções clicáveis + campo de texto onde **palavras-chave secretas** desbloqueiam falas que nenhuma opção mostra |
| Papéis de NPC | 4 papéis misturáveis: **Treinador / Mercador / Quest giver / Sussurrador** |
| Baús | **Todos one-time por personagem** — abrir um baú é um evento na vida do char; estado por-jogador (pronto pro online) |
| Tesouros | **Sempre únicos** — não existe tesouro repetível de nenhuma natureza. O que foi achado, foi achado |
| Rumores | **Fixos por região** (não rotacionam), mas **evoluem com o progresso**: completar quests desbloqueia novas camadas de rumor — novos aspectos do mundo se revelam |
| Baús lacrados | Lacre por **nível mínimo** (estilo quest door de Tibia): visível antes, abrível depois — o jogador memoriza e volta |
| Portas & chaves | **Chaves estilo Apogea (decidido jun/2026)**: permanentes, **não-físicas, introcáveis** (flag por personagem); **nunca se sabe qual porta abrem**. Chaveiro minimalista (só nomes evocativos); aviso só no **1º uso**. **Dois tipos de porta**: comum (segura aberta pro grupo) × selada (só o portador). **Chave exigida dos dois lados** — entrar sem chave é compromisso (sai com o portador ou morrendo); venda de acesso = serviço de sessão. Chave abre **portas**; lacre de baú segue por **nível** |
| Nascimento | **Casa inicial** (tutorial diegético, modelo Tibia/Apogea): NPC-guia + containers **domésticos** (≠ baús raros) com 1–2 armaduras, arma genérica e sacola; a **1ª chave** abre a porta de saída — o loop container→chave→porta ensinado no minuto 2 |
| Santuário & respawn (jun/2026) | **Bind point estilo Tibia/Apogea.** Toda povoação (vila ou cidade) tem um **Santuário**; o jogador **marca o santuário em que está fisicamente** (não dá pra marcar à distância) e **renasce sempre no último marcado**. Marcar é **grátis** — a fricção é a caminhada, não gold. **Sem rede de teleporte**: o mundo se atravessa **a pé** (constituição: anti-conveniência, a distância importa). Única conveniência de travessia = **barcos pagos entre cidades grandes** (gold sink; usa os rios/balsa já canônicos — Pontal, a Porta d'Água), *ganha/paga*, não livre. É como o **eixo "pra dentro" joga sem forçar**: o jogador migra de casa marcando o santuário da próxima cidade; marcar o da **Capital** é o seu próprio "cheguei à civilização". **Sinergia com a morte:** respawn-no-bind + caminhada-de-volta = punição que escala com o quão fundo/longe você foi (princípio OSRS). **Penalidade de morte = −10% da XP TOTAL acumulada** (pode rebaixar de nível; piso protege XP baixo — já implementado, ver `DESIGN-EVOLUCAO.md`) |
| Raridades de item | Comum → Incomum → Raro → **Lendário** → **Único**, alinhadas aos slots de Marca (1 / 1 / 1 / 2 / 3) |
| Arquitetura | Quests, diálogos e baús são **dados** (definições), avaliados na sim — mesmo modelo das Marcas |

> **Onde cada tema mora em detalhe:** quests (as 3 camadas, templates, diário) → [SISTEMA-QUESTS.md](SISTEMA-QUESTS.md); NPCs (4 papéis, comércio especializado, diálogo híbrido, templates) → [SISTEMA-NPCS.md](SISTEMA-NPCS.md); spawns, layout da área inicial, baús, portas & chaves, ferramentas, casa inicial e itens → [EXPLORACAO.md](EXPLORACAO.md).

---

## Progressão do mundo — o espinho (pós-MVP, jun/2026)

> Como o mundo se expande do MVP rumo a um jogo lançável. **A lore É o motor de progressão** — não precisa inventar curva, precisa *sequenciar a escavação da história*. Cânone-mãe em `DESIGN-LORE.md` (linha do tempo + §Geografia/"Escala da civilização").

**Os 3 eixos de progressão** (cada um é uma fantasia diferente; o MVP só usa os dois primeiros):

1. **Pra fora** (distância) — fronteira → bordas selvagens. Perigo por afastamento da segurança (OSRS Wilderness). Fantasia: "enfrentar o mato". Eixo principal do MVP.
2. **Pra baixo** (profundidade) — superfície → esgoto → cavernas → **o Submundo selado**. Perigo + custo de fuga por profundidade. Fantasia: "descer no escuro". Endpoint canônico: os demônios da 2ª Crise.
3. **Pra dentro** (escala da civilização — *novo, jun/2026*) — vila humilde → cidades → **a Capital monumental**. **Não é eixo de perigo, é eixo de história/sistemas**: as versões grandes do Templo/Torre/Guilda (cujos ecos humildes estão em Alvorada) guardam o conhecimento dos arcos profundos. Joga via **bind de santuário** (ver tabela de decisões). Fantasia: "chegar à civilização".

**As 4 Crises = a escada de dificuldade** (o jogador anda **pra trás no tempo** — a ferida mais recente é a mais rasa; a mais antiga, o endgame mais fundo; é a fantasia do "jogador-arqueólogo" que a lore pede):

| Arco | Crise (lore) | Tier | Camada geográfica |
|---|---|---|---|
| ① **Contaminação** | 3ª Crise (rescaldo) | T1–3 | **RIM** — a fronteira (MVP) |
| ② **O Necromante inacabado** | 3ª Crise (núcleo) | T3–4 | **MIDLANDS** — a estrada pra dentro; tenentes (lich/death knight) = *fontes* regionais |
| ③ **O Submundo** | 2ª Crise | T4–5 | **BELOW** — Fendas, Cultistas, Reis Demônios (endgame ↓) |
| ④ **O Primeiro Mago** | 1ª Crise | endgame | **DEEP/IN** — Árvore Sagrada, Seguidores (o mistério mais antigo) |

**Camadas geográficas:** RIM (fronteira) → MIDLANDS (estrada inward) → HEART (Capital, hub T4–5) → BEYOND/BELOW (endgames: Submundo pra baixo, Árvore/1º Mago pra dentro, expansões de povo pra fora — elfos via Pontal, gelo via serra, mar via penhascos). Cada **expansão** escava uma camada mais funda **ou** abre um continente/povo novo (motor de live-service pronto na lore: 5 continentes, um por expansão).

**Escopo do "lançável" (decidido — criador, jun/2026): o primeiro ato até a Capital.** Região 1 (fronteira/Contaminação, ①, lvl 1–25) polida → **estrada pra dentro** (1–2 regiões MIDLANDS T3–4 carregando o arco ②) → **a Capital alcançável** como clímax (o primeiro "cheguei à civilização"). Cap ~lvl 35–40. É o menor escopo que **sente um jogo** (os 3 eixos aparecem juntos), não uma demo da fronteira. Endgames ③/④ ficam **visíveis como promessa** (a Árvore no horizonte, o Pico do Dragão, a boca do Submundo).

> **Reformula a Fase 3 do `ROADMAP-MVP.md`:** "cidades 2–4" deixa de ser 3 vilas-irmãs da fronteira e vira **a estrada inward + a Capital** (mesmo orçamento, direção diferente).

**✏️ Aberto:** qual promessa é a **bandeira do endgame** no lançamento (o gancho de trailer/retenção) — **pra baixo** (Submundo/demônios, dragões no Pico) · o **mistério** (Árvore Sagrada/1º Mago/Seguidores) · **pra fora** (1ª expansão de povo, elfos via Pontal). · Nome da Capital (candidatos no registro de Nomenclatura; recomendado *Meridiano*). · Direção da Capital no macro (hipótese: oeste, rumo à Árvore Sagrada = coração antigo/sagrado humano).

---

## Implicações técnicas (resumo p/ implementação)

- **Tudo na sim, tudo como dados** (mesmo modelo das Marcas): quests, nós de diálogo, keywords e baús são definições avaliadas por sistemas genéricos em `src/sim/` — conteúdo novo = definição nova, não código.
- **Diálogo via protocol:** client envia `talk` (NPC, opção escolhida ou texto digitado); a sim resolve e devolve o nó de diálogo. **Keywords são avaliadas na sim** — a lista de segredos nunca viaja para o client (anti-datamine no online futuro).
- **Estado de quest e de baú é por-personagem**, serializável no snapshot/save. Baú é entidade da sim com flag `opened` por char.
- **Eventos novos da sim:** `talk`, `chest_open`, `region_enter` — somam-se a `kill`/`skill_use`/etc. e já alimentam futuras **Marcas de exploração** (categoria "futuro" na taxonomia de `DESIGN-EVOLUCAO.md`).
- **Localização (EN/PT) desde o dia 1:** a sim e o protocol só trafegam **IDs e chaves** (`npc.blacksmith.greet1`, `item.iron_sword.name`); o client resolve as strings na língua do jogador (tabelas `en`/`pt`). Nenhum texto de jogo hardcoded em código ou snapshot.
- 📍 de quest direta: dado do estado da quest no snapshot; o client só desenha o pin no mapa.

## Aberto / a decidir ✏️

- [x] ~~Contagem de caça no diário?~~ → **contador discreto só nas diretas** (decidido jun/2026 — ver Quests diretas)
- [ ] Tratamento visual das keywords destacadas nas falas (sutil, não link azul)
- [ ] Marcas de exploração (ex: abrir N baús secretos → Caminho *Olho de Corvo*?) — desenhar junto com a categoria futura
- [ ] Quest épica/chain por região (a "quest grande" de cada zona, estilo a quest de acesso de Tibia)
- [ ] Reputação/afinidade com NPCs? (provavelmente não no M3 — avaliar depois)
- [ ] Densidade de baús por região + posições (M3, junto com mapa)
- [ ] Loot tables por criatura e stats de item (M2)
