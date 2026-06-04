# Estudo de Referências — Fontes Renomadas de Game Design

> Pesquisa profunda (jun/2026): 5 ângulos de busca paralelos, ~30 fontes, 114 claims extraídas, 24 sobreviveram a verificação adversarial 3-votos + 3 passes direcionados de lacunas. Material destilado nas skills de `.claude/skills/` — este doc preserva o estudo completo com fontes. **Filtro aplicado:** tudo aqui passou pela constituição (`DESIGN-FILOSOFIA.md`); princípio que contradiz os pilares foi descartado.

## 1. Pixel Art & UI (→ skill `diretor-de-arte`)

**Fontes-autoridade:** Pedro Medeiros/Saint11 (Celeste, TowerFall — série Pixel Grimoire), Derek Yu (Spelunky), Raymond "Slynyrd" Schlitter (Pixel Logic), Pixel Joint master tutorial, Lospec, Game Accessibility Guidelines.

| Princípio | Regra concreta | Fonte |
|---|---|---|
| **Hue-shifting** | Sombra desloca para AZUL e PERDE saturação; luz desloca para AMARELO e GANHA saturação. Temperaturas opostas: luz quente + sombra fria | Saint11 |
| **Construção de ramp** | ~+20° de hue por degrau; saturação faz pico no MEIO do ramp; nunca 0%/100%; passos de brilho menores no topo; nunca alta saturação + alto brilho juntos; nunca alta saturação em brilho muito baixo ("pesado" — crítico no dark medieval) | Slynyrd Pixelblog 1 |
| **Roda coesa** | 1 ramp base rotacionado 45°×8 gera a paleta inteira coesa — materiais compartilham a lógica | Slynyrd |
| **Line quality** | Matar jaggies: comprimentos de segmento crescem/diminuem consistentemente (progressões 1-2-3); sem pixels dobrados | Derek Yu |
| **Anti-aliasing** | AA SÓ interno. NUNCA na borda externa de sprite de jogo (fundo desconhecido = halo) | Derek Yu |
| **Selout** | Substituir outline preto: mais claro onde a luz bate, sombra escura (não preto puro) para segmentação interna; pode sumir contra espaço negativo. Amarrar à direção da luz | Derek Yu |
| **Banding** | Evitar outline "abraçando" a forma interna (paralelo), linhas 45° alinhadas — reforçam o grid e baixam a resolução aparente | Pixel Joint |
| **Pillow-shading** | PROIBIDO sombrear em anéis seguindo o contorno. UMA direção de luz global para TODOS os sprites (consistência procedural) | Pixel Joint |
| **Clusters** | Cluster = forma chapada intencional com bordas propositais; pixel isolado = ruído (exceções: specular, olho) | Pixel Joint |
| **UI: esconder em combate** | Info não-combate some durante combate (Hades); agrupar recursos para minimizar eye-travel | Interface in Game |
| **UI: disclosure progressivo** | Mostrar só o necessário no momento; o resto atrás de contexto/tecla | Game Developer |
| **UI: legibilidade de texto** | Contraste ≥4.5:1; stroke escuro de 1px em texto claro + placa semi-opaca atrás (mais eficaz que drop shadow) sobre mundo vivo | Game Accessibility Guidelines |

## 2. Dificuldade & Descoberta (→ skill `designer-de-sistemas`)

**Fontes:** Thinky Games (metroidbrainia primer), GMTK, paper acadêmico Maleki et al. 2024-25, Noita (GDC + wiki), Tunic (Andrew Shouldice), Raph Koster.

- **Metroidbrainia / conhecimento como chave:** o portão não tem fechadura — pergunta se você ENTENDE uma regra. Conhecimento mora na cabeça do jogador, não em flags do jogo: o veterano em replay passa direto. **Nosso sistema de keywords de diálogo JÁ É isso** (digitar "cripta" = portão de conhecimento puro). [Thinky Games, GMTK]
- **Conhecimento sistêmico > trivia:** sistêmico = regra que generaliza e RECONTEXTUALIZA conteúdo anterior ("mind-blowing"); não-sistêmico = código aplicado verbatim. Desenhe descobertas que reescrevem o entendimento do que o jogador já viu. [Thinky Games + paper]
- **Dial Clear/Cryptic/Hidden:** portão Claro (sabe o que se pede) / Críptico (vê o portão, não sabe a demanda — portas do Tunic) / Oculto (nem sabe que existe — Outer Wilds). **Mapeia 1:1 nas nossas 3 camadas de quest** (direta/aberta/segredo). Quanto mais oculto, maior o prêmio. [Thinky Games]
- **Noita — opacidade em escala:** mecânicas profundas que só a experimentação revela (parry, ~0.01% das wands); segredos que exigem a comunidade INTEIRA (Eye Messages, sem solução até hoje); changelogs deliberadamente vagos para preservar descoberta. [Wikipedia, GDC, noita.wiki]
- **Arqueologia sancionada:** os devs de Noita transformaram dataminers em colaboradores creditados (mensagem escondida nos dados: "não vaze antes de 11/out e será creditado"). Tensão consciente para nós: no online os segredos avaliados na sim são in-datamináveis por design — a arqueologia acontece JOGANDO; recompensar/celebrar a comunidade que descobre é a versão sancionada. [2-1 na verificação]
- **Tunic:** segredos gated por habilidades que o jogador SEMPRE teve (o unlock é só conhecimento); manual em língua construída — aprende-se por diagramas e intuição, não tooltips. "Um mundo que não foi feito para você." [Shouldice]
- **Koster anti-treadmill:** "Fireball VI" (mesmo spell, número maior) = desengajamento; cada recompensa deve ser "uma vara nova para cutucar a colmeia" (interação NOVA). **Valida nossas Mutações qualitativas.** [raphkoster.com]
- **Problema do replay/wiki em MMO** (questão aberta da pesquisa): conhecimento espalha via wiki instantaneamente. Buffers: profundidade sistêmica em camadas, descoberta por-personagem (nossos baús/quests), conteúdo novo por atualização.

## 3. Nomenclatura & Escrita (→ skill `loremaster`)

**Fontes:** paper "Narration of Things" (Dark Souls), Daniel Vella "No Mastery Without Mystery" (Game Studies, peer-reviewed), Tolkien (A Secret Vice + análises linguísticas), Justin Keenan/ZA-UM GDC 2021 (Disco Elysium).

- **Narração das coisas:** em Dark Souls, ITENS são mais informativos que NPCs (deliberadamente esparsos/crípticos). "Aprende-se sobre o feiticeiro Logan lendo o chapéu dele." Regra: carregue worldbuilding nas descrições de item; mantenha NPCs lacônicos. O jogador lê o item como artefato arqueológico.
- **Perguntas sem resposta:** o flavor text PÕE perguntas que nunca responde — o entendimento "permanece para sempre uma hipótese" (Vella). Lacunas são isca para a comunidade teorizar. Miyazaki: raiz em ler livros incompletos na infância.
- **Fonossemântica (Tolkien):** som conecta a significado. Receita mensurável: línguas/nomes "malignos" têm densidade consonantal maior (~63% vs ~52-55% élfico) e mais plosivas sonoras /b,d,g/ — soam mais violentos. Eufonia para o belo/bom. Usar como heurística (corpus minúsculo), não fórmula. **Encaixa nas nossas fonologias por povo** (✏️ a desenhar).
- **Micro-reatividade (Disco Elysium):** milhares de switches booleanos baratos (escolhas triviais → callbacks em diálogos futuros); função ESTÉTICA, não instrumental; quebrar o "sexto sentido" do jogador para utilidade de quest do NPC — alguns NPCs profundos sem payoff mecânico nenhum. **Encaixa nos sussurradores e nos rumores que evoluem.**
- ❌ Refutado na verificação (0-3): "lore distribuída em peças de set espalhadas" como técnica canônica — não usar como referência.

## 4. Balance & Matemática (→ skill `balancista`)

**Fontes:** Pascal Luban (Game Developer), Tibia (fórmula verificada em 3+ fontes), Ragnarok Online wikis/rAthena, OSRS wiki oficial, Clockwork Labs (BitCraft), Raph Koster AGC 2006, Sirlin.

- **Curva de XP — método recomendado (Luban):** incremento entre thresholds cresce LINEARMENTE → total quadrático/polinomial. Evita explosão exponencial. **Desenhar pelo TEMPO por nível** (estimar taxa de ganho/hora e retro-resolver os thresholds).
- **Fórmula cúbica do Tibia (verificada):** `XP(x) = (50/3)·(x³ − 6x² + 17x − 12)`. Amostras: lvl 2=100, lvl 8=4.200, lvl 20=84.300, lvl 50≈1,95M, lvl 100≈16,2M. Canônica do gênero, delta quadrático.
- **Custo de stat do RO (regra exata):** `custo = floor((A−1)/10) + 2` — stats 1-9 custam 2, 10-19 custam 3, +1 por faixa de 10. **É a referência da nossa decisão "custo crescente por faixa".**
- **OSRS (contraste):** XP dobra a cada 7 níveis (exponencial); lvl 92 = metade do 99 (13.034.431).
- **Treadmill de hiperinflação de XP (EHT):** facilitar catch-up "imprime XP" e desvaloriza o grind alheio — contrato implícito de nunca desvalorizar substancialmente o grind. Mitigações: progressão suave sem hard cap, skills paralelas, conteúdo em todos os níveis (vender a jornada).
- **TTK:** zona "esponja" = pior dos mundos (dano parece não afetar). Dificuldade via LETALIDADE e decisão, não via HP inflado. TTK efetivo deve escalar com habilidade do jogador.
- **Milestone determinístico ∥ aspiracional RNG (OSRS 99+pet):** o que separa grind aspiracional de chore é progresso visível determinístico correndo EM PARALELO ao objetivo raro. **Aplicar ao desenho de thresholds de Marca** (a Marca é o aspiracional; level/skills são o determinístico paralelo).
- **Sistema "con" (EQ/WoW):** mob trivial = 0 XP (nosso `isValidKill`); EQ dava +25% (amarelo) / +50% (vermelho) por lutar PARA CIMA — incentivo positivo além do corte negativo.
- **Economia (Koster):** faucets (XP/gold entrando) vs drains (sinks); com drains fracos hiperinflação é questão de QUANDO. Sinks: preços de NPC ligados à oferta de moeda, leilões de preço flutuante, taxas. NUNCA dar gold a novato (inflacionário) — criar dependência intergeracional (veterano precisa de commodity que o novato farma).
- **Sirlin (critérios de revisão):** jogo balanceado = muitas opções VIÁVEIS no alto nível; estratégia dominante = "expert vence experts repetindo um movimento sem counter". Teste: alguma opção domina sem counterplay? → degenerado.

## 5. World/Level Design (→ skill `world-designer`)

**Fontes:** Kevin Lynch (*The Image of the City*, MIT 1960), Level Design Book (Robert Yang), Scott Rogers (GDC 2009 "Everything I Learned About Level Design I Learned from Disneyland"), GMTK Boss Keys (Dark Souls), OSRS wiki oficial, John Harris (@Play), taxonomia de beats da Valve.

- **Lynch — os 5 elementos da legibilidade:** Paths, Edges, Districts, Nodes, Landmarks. Mundo "imageable" = memorizável de olhos fechados. Regras: cada distrito com UMA identidade visual dominante (chão/paleta/vegetação dizem "onde estou" sem label); um landmark único em cada node (interseção lembrada, não passada).
- **O jogador olha para onde anda:** pistas de orientação no plano do CHÃO (trilha gasta, tábuas, entrada iluminada, contraste de cor na junção) — nunca ícone flutuante. Contraste puxa o olho.
- **Weenies (Disney/Rogers):** silhueta grande e única visível de longe como ímã por zona (torre, ruína, montanha); revelar landmarks progressivamente, não todos de uma vez.
- **Promessa visível (HL2 Citadel):** mostrar o objetivo não estraga — cria antecipação e auto-planejamento. Técnica: vista enquadrada na entrada da região (composição apontando o landmark + movimento atraindo o olho: pássaros, fumaça); o landmark fica visível como âncora direcional constante.
- **Interconexão > tamanho (Dark Souls/GMTK):** um único mundo-labirinto ramificado que dobra sobre si mesmo (atalhos, elevadores, passagens) substitui o minimapa — navega-se por memória espacial + atalhos destravados. A interconexão É a conquista do world design.
- **Gradiente OSRS Wilderness:** perigo cresce num EIXO legível de distância da segurança; recompensa no extremo. **E: fuga fica mais difícil com a profundidade** (teleporte bloqueado fundo) — o custo do FRACASSO escala, não só a força do mob. Profundidade = compromisso com rota de saída planejada.
- **Escalada roguelike (Harris):** ameaça sobe um pouco MAIS rápido que o poder esperado — profundidade exige tática/recurso, não só stats. Nunca deixar o lugar mais seguro ser o mais lucrativo.
- **Beats da Valve:** alternar Combate/Exploração/Puzzle/Choreo/Vista; nunca uma intensidade por tempo demais; o vale É recompensa. Vista = trégua de ritmo + re-orientação ao próximo weenie num só beat. Cadência exata: tunar no playtest/sim, não há fórmula.
- **Soft gate por letalidade (DS graveyard):** região "cedo demais" cercada de mobs que destroem o novato = placa de "ainda não" sem chave nem porta; idealmente com counter aprendível (arma divina vs esqueletos) para o portão também ENSINAR o pré-requisito.
- ⚠️ Tibia hunting grounds: só material de comunidade (sem teoria autoral) — padrões observados (circuitos de 6-8 criaturas, densidade compensa respawn) valem como folclore a validar na NOSSA sim.

## Lacunas honestas / vieses

- "Metroidbrainia" é padrão de design sólido, mas contestado como RÓTULO de gênero — usar o conceito, não o nome.
- Números de hue-shift e cadência de beats: guias flexíveis, não constantes.
- WoW gray-level: números exatos não verificados além de snippets.
- Fonossemântica: corpus minúsculo — heurística.

## 6. Estudo 2 (jun/2026): cidades iniciais de MMORPGs 2D clássicos (→ refino da Alvorada v4)

> Pesquisa dedicada: Tibia (Thais/Rookgaard), RO (Prontera/Izlude), MU (Lorencia). 73 claims → 25 verificadas (3 votos adversariais) → **21 confirmadas, 4 refutadas**. Fontes: TibiaWiki + biblioteca oficial Tibia.com, iRO Wiki/RateMyServer/rAthena, muonlinefanz, blogs de design MMO.

**Confirmado (alta confiança):**

| Padrão | Evidência canônica | Aplicação Alvorada |
|---|---|---|
| **Geografia define o perímetro; muralha NÃO cerca tudo** | Thais: 2 rios (N/S) + muralha LESTE + baía aberta a oeste | rio + colina cobrem lados; muralha só nos abertos ✓ (v4 já faz) |
| **Poucas saídas, cardinais; capital = gateway, nunca beco** | Prontera: exatas 3 saídas de campo (W/E/S, nenhuma N — norte reservado ao castelo); Lorencia: hub de ~5 conexões | 4 saídas ✓; **reservar uma direção pra conteúdo especial** (como Prontera reserva o norte) |
| **Spot iniciante COLADO num portão** | Thais: Ancient Temple "just outside the north gate" | ≥1 portão abre direto num bolsão T1 (segundos, não minutos) |
| **Dificuldade zoneada por DIREÇÃO + PROFUNDIDADE, não anéis radiais** | Thais (templo N iniciante, Mt. Sternum NE, Cyclops S, Mintwallin no fundo); Rookgaard (clusters cardinais + superfície fraca/fundo forte). **Anéis radiais REFUTADO 0-3** (campos de Prontera não graduam por raio) | cada direção com assinatura de tema/tier; esgoto -1 trivial → -3 perigoso ✓ |
| **Esgoto urbano multi-andar é O padrão de dungeon de capital** | Thais Sewers: 3 andares, rec. lvl 6, SÓ vermes low-tier, entrada de DENTRO (junto ao depot); Prontera Culvert: 4 andares, quest-gated, entrada em campo EXTERNO | nossos 3 andares ✓; modelos de acesso: livre-de-dentro (Thais) vs gated-de-fora (Prontera) — nosso híbrido (1–2 livres, 3º atrás de segredo/ferramenta) cobre os dois |
| **Concentração de utilidade cria o hub; dispersão mata** | Lorencia: TODOS os serviços num mapa; FFXIV Limsa (market+bell colados no Aetheryte); WoW Ironforge esvaziou quando a AH saiu | depot+mercado+praça num cluster apertado; respawn a passos do hub |
| **Cidade-satélite temática é precedente válido** | Izlude: porto/escola de Prontera, com zoneamento interno claro | futuro: porto fluvial; dentro da capital, lados com função (bairros ✓) |
| **~12 zonas de caça por capital é sustentável** | Prontera: 12 campos (prt_fild00–11; só ~2 adjacentes diretos — teia, não anel) | nossos ~12 spots ✓; encadeamento em teia |

**Refutado / não usar:** anéis radiais de dificuldade (0-3); "RO mal telegrafado" (1-2 — não sustentado).

**Lacunas:** APOGEA — zero claims verificáveis nas fontes públicas (wiki rasa); a referência mais próxima do nosso jogo precisa vir do conhecimento direto do criador. Distância portão→spot e densidade de bolsão: sem métricas nas fontes (decisão nossa + balancista).
