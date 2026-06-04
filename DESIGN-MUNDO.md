# Mundo — Exploração, Quests, NPCs e Tesouros

> Documento vivo. Seções ✏️ são preenchidas pelo criador. Conteúdo concreto (quests reais, NPCs nomeados, posições de baú) nasce junto com o design de mapa (M3).

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
- A exceção que confirma a regra: **eventos canônicos** raros (world bosses, momentos históricos do servidor — ver evolução de Marcas em `DESIGN-EVOLUCAO.md`) são o único mecanismo que muda o mundo para todos.

## Estrutura do mundo — cidades + zonas, sem países (decidido)

- **Sem conceito de países.** A geografia política do continente é deliberadamente vaga (cidades livres ✏️ lore futura). País/reino só entra se um dia houver motivo mecânico (facções, PvP territorial) — não é MVP.
- A unidade mental do jogador é a **região**: **cidade-âncora + zonas de caça ao redor + estradas perigosas ligando cidades** (modelo Tibia: Thais/Carlin/Venore, sem nação definida e sem fazer falta).
- Expansão do mundo = adicionar regiões/cidades, nunca redesenhar fronteiras.

## Recorte do MVP (decidido)

**Uma região do continente central**, suportando evolução até **lvl ~20–25** — upar é difícil (ver Ritmo em `DESIGN-EVOLUCAO.md`), e é essa lentidão que torna Marcas/Mutações/Caminhos viáveis dentro do cap baixo.

| Faixa | Zonas de caça | Exemplos com o bestiário atual |
|---|---|---|
| T1 (lvl 1–8) | 2–3 | campos/trilhas (ratos, lobos), acampamento goblin, borda da floresta |
| T2 (8–15) | 3–4 | caverna de aranhas, **cemitério contaminado** (1º arco), pântano raso, estrada dos bandidos |
| T3 (15–25) | 3–4 | cripta profunda, floresta densa (plantas/urso), colinas (ogros), covil do culto |

Regras do recorte:

- **2–3 spots viáveis por faixa é o mínimo**: upar lento = muito tempo em cada faixa; spot único cansa e congestiona no MMO.
- Dimensão alvo: ✏️ depende do escopo escolhido (ver "Aberto sobre o layout"): subconjunto do layout em **~300×350 tiles** ou layout inteiro (4 núcleos) em **~500×500**. Em ambos: ~65% wilderness com cantos escondidos para baús + **dungeons pequenas como mapas separados** (cripta, cavernas — adia tecnologia de andares/z-level).
- **T4–T5 ficam fora do cap mas dentro do mapa** como "muros vivos": um Espectro (T4) no fundo da cripta é a promessa que o jogador um dia cumpre.
- **Saídas da região bloqueadas naturalmente** (cordilheira, rio largo, posto de guarda "estrada fechada") — cada bloqueio é uma porta de expansão pronta.
- Rascunhos de layout do criador em `design/rascunhos/`.

## Layout da área inicial (rascunho de trabalho)

> Fonte: `design/rascunhos/area-inicial-v2.png` (Figma Make do criador) — o rascunho é exclusivamente uma **sugestão de layout** para trabalhar em cima. **Cidades já batizadas** (abaixo); **POIs ainda são placeholders**. Mobs e lore definidos por nós.

**Duas regras de ouro do layout (decidido):**

1. **Tier por distância** — o perigo cresce conforme se afasta das cidades: T1 no perímetro urbano → T3 nas áreas remotas. Gradiente contínuo com zonas sobrepostas (áreas de transição), não zonas fechadas.
2. **Tier por profundidade** — caves/dungeons/ruínas têm múltiplos níveis: entrada T1–T2, profundezas T2–T3. Efeitos: o mundo serve várias faixas no mesmo lugar; o jogador **vê o próprio futuro** ("um dia eu desço"); e o último andar é o "muro" T4 natural.

**Estrutura:**

- **4 núcleos urbanos** ligados por estradas — **batizados (decidido)**, peso ✏️ proposta: 1 capital + 3 vilarejos temáticos:
  - **Alvorada** (oeste, planícies) — capital, hub completo. A primeira cidade fundada após a Chegada: "o amanhecer da humanidade no mundo novo".
  - **Brumal** (nordeste) — vilarejo madeireiro/caçador nas florestas fechadas, borda gelada ao norte.
  - **Charneca** (sul) — vilarejo na planície brava, à sombra das próprias catacumbas. Porta do arco da Contaminação.
  - **Pontal** (leste) — o último assentamento humano antes do território élfico; fronteira e comércio.
  - *(banco: **Atalaia** — reservado para o posto de vigia da saída de expansão da região ✏️)*
- **13 pontos de interesse** em 5 categorias:

| Categoria | POI (placeholder) | Tiers | Encaixe proposto (lore/bestiário) |
|---|---|---|---|
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

- [ ] Escopo MVP: implementar subconjunto (capital + 1 vilarejo e POIs próximos, resto bloqueado) ou mapa inteiro maior (~500×500)?
- [ ] Confirmar pesos: capital + 3 vilarejos
- [ ] Marcar saídas de expansão (norte gelado parece borda natural; demais a definir)
- [ ] Redistribuir os 2 POIs de dragão (1 boss T3 + 1 promessa T4–T5)

## Nomenclatura (processo a construir ✏️)

- **Status:** cidades **batizadas** (Alvorada, Brumal, Charneca, Pontal + Atalaia no banco — piloto da metodologia). Zonas, POIs e NPCs: ainda placeholders.
- **Bilíngue por design (decidido):** o jogo lança em **EN + PT-BR** selecionável. Regra de nomenclatura em dois regimes:
  - **Nomes próprios** (cidades, NPCs, vilões, povos) são **invariantes** — iguais nos dois idiomas, como Tibia faz (Thais é Thais em qualquer língua). Devem soar bem em ambos.
  - **Nomes descritivos** (zonas, POIs, mobs, itens, quests) são **traduzidos** — autorados **em par** desde o nascimento (ex: *Minas Perdidas* / *Forsaken Mines*). Se um nome só funciona num idioma, escolhe-se outro.
- **Sabor lusófono nos nomes próprios humanos (decidido):** a língua dos humanos do Mundo Antigo tem fonologia portuguesa — nomes próprios humanos (cidades, NPCs) soam lusófonos **até na versão EN** (como games usam francês/italiano de tempero). Na lore, é literalmente a língua dos colonos. Assinatura do jogo.

### As 5 fontes de referência (decidido)

| # | Fonte | O que ela dá | Usar para |
|---|---|---|---|
| 1 | **Tibia** | a regra de dois regimes: civilização = nome próprio inventado; wilderness = descritivo evocativo | estrutura geral |
| 2 | **Toponímia luso-brasileira** | como colonos batizam terra nova: geografia + fé + acontecimento (Ribeirão das Almas, Serra do Desterro, Ouro Preto) | nomes próprios humanos e topônimos — a assinatura |
| 3 | **FromSoftware** (Dark Souls/Elden Ring) | peso mítico: substantivo + genitivo carregado (*Túmulo dos Gigantes / Tomb of the Giants*) | lugares lendários, itens, Marcas, bosses, eventos canônicos — reservado pro que é raro |
| 4 | **Bestiários medievais / folclore ibérico** | criatura com sabor de crônica ("registrada por um estudioso") | mobs, famílias, variantes |
| 5 | **Fonologia própria por povo** | humanos = lusófona; planeta nativo, elfos, anões, demônios = fonologias distintas ✏️ a desenhar | qualquer nome próprio novo sai das regras do povo dono dele |

- Com o tempo: **skill "nomeador"** no repo (`.claude/skills/`) com a metodologia — entrada (tipo + contexto: tier, família, ganchos de lore), regras (5 fontes, fonologia por povo, **par EN/PT obrigatório**, anti-colisão com nomes existentes nos docs), saída (3–5 candidatos com justificativa).

### Registro aprovado pelo criador (calibrado no piloto das cidades)

- **Gosto confirmado:** palavra única, geográfico-atmosférica, sonoridade elegante — *Alvorada, Brumal, Charneca, Pontal, Atalaia*.
- **Evitar:** nomes religiosos/fúnebres diretos (Vésperas, Capela, Campossanto), função comercial (Feitoria), compostos inventados (Entreverde), rural-banal (Figueiral, Lameira).
- Exemplares canônicos para a skill nomeadora: as 4 cidades acima + Atalaia (banco).

## Mapa de decisões (fechado)

| Tema | Decisão |
|---|---|
| Quests | **3 camadas**: diretas (com marker no mapa) / abertas (rumor, sem marker) / segredos (nunca anunciadas) |
| Marcador de mapa | **Só quests diretas** marcam o mapa. Quest aberta nunca ganha marker depois — hint extra vem de NPCs, não de UI |
| Journal | **Diário escrito** com as palavras do NPC. Sem tracker de objetivos na tela, sem setas |
| Diálogo NPC | **Híbrido**: janela com opções clicáveis + campo de texto onde **palavras-chave secretas** desbloqueiam falas que nenhuma opção mostra |
| Papéis de NPC | 4 papéis misturáveis: **Treinador / Mercador / Quest giver / Sussurrador** |
| Baús | **Todos one-time por personagem** — abrir um baú é um evento na vida do char; estado por-jogador (pronto pro online) |
| Tesouros | **Sempre únicos** — não existe tesouro repetível de nenhuma natureza. O que foi achado, foi achado |
| Rumores | **Fixos por região** (não rotacionam), mas **evoluem com o progresso**: completar quests desbloqueia novas camadas de rumor — novos aspectos do mundo se revelam |
| Baús lacrados | Lacre por **nível mínimo** (estilo quest door de Tibia): visível antes, abrível depois — o jogador memoriza e volta |
| Raridades de item | Comum → Incomum → Raro → **Lendário** → **Único**, alinhadas aos slots de Marca (1 / 1 / 1 / 2 / 3) |
| Arquitetura | Quests, diálogos e baús são **dados** (definições), avaliados na sim — mesmo modelo das Marcas |

---

# Quests — três camadas

| Camada | Como o jogador descobre | Guia | Recompensa típica |
|---|---|---|---|
| **Direta** | NPC oferece e explica | 📍 marca o local no mapa | gold, XP, consumíveis, gear comum–incomum |
| **Aberta** | NPC dá rumor com direção vaga | só o texto no diário | gear raro, acesso a áreas, skills intermediárias |
| **Segredo** | nunca é anunciada — só explorando | nenhum | os melhores itens fora de boss (raro–lendário) |

## Quests diretas (guiadas)

A espinha de progressão. Ensinam as zonas, apresentam as famílias de mob, dão o ritmo do early game de cada região.

- Formato clássico: *mate X*, *leve item Y a Z*, *vá até o local e volte*.
- O NPC marca o ponto no mapa do jogador (📍). A marca é a **única** ajuda — sem seta na tela, sem distância.
- Recompensas previsíveis e modestas: são o "salário", não o tesouro.
- ✏️ Contagem de caça no diário ("3/10 lobos") ou só pela fala do NPC? — a decidir.

## Quests abertas (rumores)

O coração do estilo Apogea. O NPC dá **direção + contexto narrativo**, e o jogador interpreta:

> *"Dizem que onde os corvos circulam, a leste do moinho velho, ninguém volta inteiro. Mas o velho Tobias voltou — e voltou rico."*

- **Sem marker, nunca.** A entrada do diário guarda as palavras do NPC; o resto é com o jogador.
- **Regra de escrita:** toda quest aberta precisa de **2–3 referências localizáveis no mundo** (o moinho existe, os corvos sobrevoam o lugar de verdade). A pista é justa — difícil ≠ adivinhação.
- Hint adicional não vem de UI: vem de **outro NPC** (sussurrador) que comenta o mesmo assunto por outro ângulo.
- Recompensa sempre acima da camada direta: o jogo paga a exploração.

## Segredos (quests não anunciadas)

Estilo Tibia clássico: **o baú no fim do lugar perigoso É a quest.** Não existem no diário até serem encontrados.

- Alavanca atrás da cachoeira, parede rachada na cripta, anel dentro de árvore oca, ilhota alcançável por um único caminho.
- Alguns são totalmente mudos; outros têm rumor de sussurrador apontando vagamente ("luzes na cripta ao norte...").
- Ao completar, viram **registro no diário** ("Encontrei a câmara sob a cachoeira") — o diário se torna o troféu de exploração do personagem.
- É aqui que moram os melhores itens fora de boss.

## Template de quest

```
### <Nome>
- Camada: <direta / aberta / segredo>
- NPC / gatilho: <quem dá, ou o que dispara (alavanca, item, região)>
- Requisitos: <nível mínimo? quest anterior? item?>
- Texto-pista: <as palavras exatas do NPC / da placa — para abertas, listar as 2–3 referências localizáveis>
- Etapas: <o que a sim rastreia: kill / item / talk / region_enter>
- Recompensa: <gold, XP, item (raridade), acesso>
- Registro no diário: <texto da entrada>
```

## Diário (journal)

- Painel por hotkey (ver layout em `DESIGN-VISUAL.md`). Entradas escritas **com as palavras do NPC**, não objetivos secos.
- Quests diretas mostram 📍 que abre o mapa; abertas só o texto; segredos aparecem **depois** de descobertos, como memória.
- Sem porcentagem de completion global visível ✏️ (proposta: não ter — o jogador nunca sabe quantos segredos faltam).

---

# NPCs — quatro papéis

Papéis se **misturam no mesmo NPC** (o ferreiro vende, treina Knights e tem uma quest pessoal):

| Papel | Função | Já decidido em |
|---|---|---|
| **Treinador** | vende skills (classe + nível + gold) | `DESIGN-EVOLUCAO.md` |
| **Mercador** | compra/venda de itens — gold sink da economia | — |
| **Quest giver** | oferece quests diretas e abertas | — |
| **Sussurrador** | solta rumores: pistas de baús, segredos, áreas — e até **hints de Marcas** | — |

**Sussurradores são o papel-chave do estilo.** O bêbado da taverna, o eremita, a criança que viu algo: NPCs cuja única função é fazer o sistema de descoberta girar sem UI. Todo rumor de sussurrador é **verdadeiro** (talvez distorcido, nunca falso) — o jogador precisa confiar no sistema para o hábito de "falar com todo mundo" se formar.

**Rumores evoluem com o progresso (decidido):** os rumores de uma região são **fixos** (não rotacionam por visita), mas completar quests **desbloqueia novas camadas** — o mesmo NPC passa a falar de coisas novas, revelando aspectos do mundo que antes não mencionava. Voltar a falar com NPCs conhecidos depois de uma quest é sempre potencialmente recompensador. É também o veículo da **storyline**: o mundo se revela em camadas, no ritmo do progresso de cada jogador.

## Diálogo — híbrido (decidido)

Janela de diálogo moderna com **opções clicáveis** + **campo de texto livre**:

- Opções cobrem o essencial: comércio, treino, quests oferecidas, despedida. Zero fricção no dia-a-dia.
- O campo de texto aceita **palavras-chave**: digitar algo que o NPC reconhece abre falas que nenhuma opção lista. É a camada Tibia — segredos de diálogo existem.
- **Keywords se aprendem ouvindo:** termos "digitáveis" aparecem com **destaque sutil** nas falas dos NPCs (✏️ tratamento visual — algo discreto, não link azul). Ouviu "cripta" do taverneiro → pode digitar "cripta" para o coveiro.
- Keyword não reconhecida: resposta genérica do NPC ("Não sei nada disso."), igual Tibia.

## Template de NPC

```
### <Nome> — <ocupação>, <local>
- Papéis: <treinador? mercador? quest giver? sussurrador?>
- Personalidade: <uma frase — define a voz das falas>
- Vende / treina: <itens, skills>
- Quests: <que quests dá, de que camada>
- Keywords secretas: <palavra → fala desbloqueada>
- Rumores que solta: <pistas de quais segredos/áreas>
```

---

# Baús e tesouros

**Todo baú é one-time por personagem** (decidido): abrir um baú é um evento, não uma rotina de farm. Estado por-jogador vive na sim — no online, cada jogador tem seus próprios baús fechados.

> Consequência assumida: o mapa "esvazia" para o explorador completista. **Não existe tesouro repetível de nenhuma natureza** (decidido) — a mitigação é só por conteúdo novo: cada atualização (novas regiões, M3+) traz novas levas de baús e segredos, e os rumores que evoluem dão motivo de revisitar NPCs mesmo com os baús da região já abertos.

## Tipos de baú

| Tipo | Onde | Proteção | Conteúdo típico |
|---|---|---|---|
| **Escondido** | cantos não-óbvios: atrás de árvores, fim de cavernas opcionais, ilhotas | só achar | gold, potions, gear **comum–incomum** que facilita a progressão |
| **Guardado** | fundo de covis perigosos (mobs acima do tier da zona) | risco | gear **incomum–raro**, gold alto |
| **Lacrado** | visível em caminhos naturais — a "promessa" | **nível mínimo** (estilo quest door) | gear **raro**, às vezes **lendário** nos lacres altos |
| **Secreto** | atrás de interação: alavanca, parede rachada, puzzle simples | descoberta | o topo: **raro–lendário**, itens de acesso |

- **Escondidos** são a malha base: num jogo onde upar é difícil e mobs são fortes (ver Ritmo em `DESIGN-EVOLUCAO.md`), achar um anel de regen ou botas melhores **muda o dia do jogador**. É o vetor que torna exploração = progressão.
- **Lacrados** ficam à vista de propósito: o jogador nível 8 passa pelo lacre "nível 20", memoriza, e voltar lá vira objetivo pessoal. O mapa acumula promessas.
- Interagir com baú já aberto mostra que está vazio ("Você já levou o que havia aqui.") — o estado é claro.
- ✏️ Densidade por região e posições reais: M3 (design de mapa).

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

---

## Implicações técnicas (resumo p/ implementação)

- **Tudo na sim, tudo como dados** (mesmo modelo das Marcas): quests, nós de diálogo, keywords e baús são definições avaliadas por sistemas genéricos em `src/sim/` — conteúdo novo = definição nova, não código.
- **Diálogo via protocol:** client envia `talk` (NPC, opção escolhida ou texto digitado); a sim resolve e devolve o nó de diálogo. **Keywords são avaliadas na sim** — a lista de segredos nunca viaja para o client (anti-datamine no online futuro).
- **Estado de quest e de baú é por-personagem**, serializável no snapshot/save. Baú é entidade da sim com flag `opened` por char.
- **Eventos novos da sim:** `talk`, `chest_open`, `region_enter` — somam-se a `kill`/`skill_use`/etc. e já alimentam futuras **Marcas de exploração** (categoria "futuro" na taxonomia de `DESIGN-EVOLUCAO.md`).
- **Localização (EN/PT) desde o dia 1:** a sim e o protocol só trafegam **IDs e chaves** (`npc.blacksmith.greet1`, `item.iron_sword.name`); o client resolve as strings na língua do jogador (tabelas `en`/`pt`). Nenhum texto de jogo hardcoded em código ou snapshot.
- 📍 de quest direta: dado do estado da quest no snapshot; o client só desenha o pin no mapa.

## Aberto / a decidir ✏️

- [ ] Contagem de caça no diário ("3/10") ou só via fala do NPC?
- [ ] Tratamento visual das keywords destacadas nas falas (sutil, não link azul)
- [ ] Marcas de exploração (ex: abrir N baús secretos → Caminho *Olho de Corvo*?) — desenhar junto com a categoria futura
- [ ] Quest épica/chain por região (a "quest grande" de cada zona, estilo a quest de acesso de Tibia)
- [ ] Reputação/afinidade com NPCs? (provavelmente não no M3 — avaliar depois)
- [ ] Densidade de baús por região + posições (M3, junto com mapa)
- [ ] Loot tables por criatura e stats de item (M2)
