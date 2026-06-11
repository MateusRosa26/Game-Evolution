# Progressão — Camada Sólida + Sistema de Marcas

> Documento vivo. Seções ✏️ são preenchidas pelo criador.

## Filosofia — duas camadas de progressão

| Camada | O que é | Caráter |
|---|---|---|
| **Sólida** (o jogo) | Level/XP, stats, skills adquiridas pelo mundo (NPCs/drops/quests), equipamento/loot | Previsível, clara, satisfatória por si só. **100% da progressão necessária vive aqui.** |
| **Emergente** (o tempero) | Marcas, Mutações, Caminhos — evolução por atitude | Oculta, brutal, opcional. Prestígio + poder bônus. |

**Regra de ouro do balance:** nenhum conteúdo é balanceado assumindo que o jogador tem Marcas. A camada emergente é a assinatura do jogo, mas quem nunca desbloquear nada dela ainda joga um RPG completo e gostoso. Sem grind obrigatório de sistema (nada de treinar shielding AFK estilo Tibia — isso não é jogo, é espera).

## Mapa de decisões (fechado)

| Tema | Decisão |
|---|---|
| Filosofia | Duas camadas: **sólida** (progressão completa) + **emergente** (tempero oculto, nunca requisito) |
| Stats | 5 atributos (For/Des/Int/Vit/Esp), **pontos no level up** + crescimento automático por classe (**+ atributos iniciais por classe + desconto de afinidade no stat principal, jun/2026**). Sem skill-by-use |
| Custo de pontos | **Crescente por faixa** (estilo Ragnarok Online): o efeito do ponto nunca muda, o custo sobe. **Faixas calibradas (bateria M1.2, jun/2026): valores 1–10 custam 2 pontos, 11–20 custam 3, 21–30 custam 4...** Extremo é possível, só caro |
| Mitigação | **Simétrica e 100% de itens**: defesa física e resist. mágica são stats de equipamento — atributos dão potência/recursos (ver `DESIGN-ITENS.md`) |
| Crítico | **Sem roll passivo** — crítico só existe como efeito explícito de skills/Mutações/Caminhos, multiplicador padrão ×2 ✏️ |
| Respec | 1 reset de stats grátis por char; extras restritos (futuro: feature paga). Marcas nunca resetam |
| Skills | **Adquiridas pelo mundo, nunca dadas** — **sem kit inicial** (ninguém nasce com skill; rito dá só a arma). Fontes espalhadas: **NPC / drop de mob / NPC+drop / quest** (raríssimas). Classless sem acesso (classe = ingresso). **Gate de aprendizado = atributo + nível, não a classe** (modelo *gems* do PoE — anda com o custo-crescente), **sem exceção: nenhuma magia é exclusiva de classe (jun/2026); sagrado = Espírito+nível como o resto**. **Gate de uso = cooldown** (Apogea); mana secundária. Sem árvore de pontos; único upgrade = Mutação |
| Classes | **Knight / Mage / Rogue / Priest**, base fixa + especialização emergente. Sem subclasses escolhíveis. **Classe é adquirida no mundo, não na criação (jun/2026)**: nasce **sem classe**, spawn aleatório em cidade inicial; rito no NPC da classe = **quest boba + gold simbólico**, entrega a arma do kit. Condutas de Caminho contam **da aquisição da classe**. **Diferenciação mecânica (jun/2026): corpo automático forte (HP/mana/regen/cap por nível) + atributos iniciais próprios + desconto de afinidade no stat principal — magia não diferencia (de-classada). Ao classar, o corpo automático recalcula retroativo ao padrão da classe** |
| Monge | Não é classe — é **Caminho emergente do Priest** (conduta *Mão Vazia*) |
| Visibilidade | Condições ocultas; hint vaga aos **~50%**; nunca contador exato; unlock é um momento screenshotável |
| Slots de Marca | Itens comuns→raros **1**, lendários **2**, únicos **3**; Caminhos sem cap, dificuldade escalante por Caminho obtido. **Slots ocultos no tooltip** (decidido jun/2026, `DESIGN-ITENS.md`): descobertos quando Marcas despontam — nº de slots visível vazaria a raridade |
| Permanência | **Marcas, Mutações e Caminhos nunca se perdem** — nem por morte, respec ou quebra de conduta pós-aquisição. Monge que equipa arma continua Monge |
| Níveis de Marca | Marca tem **1–3 níveis** (depende da marca): subir nível = repetição contínua; **evoluir/alterar** = só evento canônico raro (boss mundial, PvP extremo). A Marca é o **ego** do item |
| Ritmo / Morte | Progressão **difícil**, curva **exponencial** (ref. Apogea: cada nível ≈ 2× o anterior; rápido até ~8, depois cada level é projeto). Morte perde **% da XP total** (ref. 10% ✏️) — **pode deslevelar**; punição cresce com o personagem. Itens **nunca perdidos em PvE**. Exceção única: contexto PvP escolhido (flag/zona) tem perda de loot — esqueleto em `DESIGN.md` ✏️ |
| Escala de números | **Tudo baixo (decidido — criador, jun/2026)**: dano/Def/gold/drops em números pequenos estilo Tibia old-school (dano de um dígito no T1, gold contado em moedas, up lento). Razão técnica (bateria M1.2): dano estável + mobs de HP baixo = o jogo é **contagem de golpes** — em escala baixa, ±1 é sentido e legível; inflação numérica destrói isso. Régua para TODO número novo do Balancista |
| Velocidade de movimento | **Base plana p/ todos — NÃO sobe com nível (decidido jun/2026)**. Variação só de **itens** (botas), **magia** (haste/*Disparada*) e **comida** (✏️ buff simples vs sistema de stamina — sessão de consumíveis). Razão: o movimento na sim é quantizado em degraus de tick (estilo Tibia, breakpoints de 50ms), e MS-por-nível é o treadmill que o Pilar 7 veta; nas referências, **OSRS deixa o teto plano de propósito** (PvP justo, profundidade vem de energia/freeze/posição) e o **Tibia** mantém o per-level minúsculo com gear/haste como swing real. Mobilidade vira **loot/escolha** (Pilar 5/6), não barra de XP; anti-Sirlin (ninguém inalcançável só por ser high-level). Relatório: `docs/reports/2026-06-10-velocidade-movimento.md` |
| Unidade de tempo | **Tudo em ms (decidido + refatorado jun/2026)**: cooldowns, durações de status, respawn, regen (agora por-segundo) são números de DESIGN em ms; a sim converte p/ ticks via `msToTicks` (`shared/constants.ts`). O **tick (50ms) é só a resolução interna** — mudá-lo reescala tudo sem tocar no balance. Tick fino (25/10ms) fica **reservado** (só vale a pena se algum dia o movimento exigir curva fina) |
| Mutações | Nomeadas e qualitativas (não ranks); o **perfil de uso** decide qual mutação nasce; 2–4 por skill, autorais. **Ganho pequeno + condicionador de estilo, nunca power spike.** **100% comportamental** (por uso) — tomo/drop/quest gateiam só a skill *base* (modelo R1, jun/2026). **1ª = onramp grátis** (fora do escalador); **da 2ª em diante já começa bem difícil.** Substitui a original (decidido) |
| Thresholds | **Entrada descobrível, aprofundamento brutal** (decidido jun/2026): a 1ª mutação é barata (onramp que ensina o sistema); Marca de arma, Caminhos e mutações profundas são brutais (ordem de 10–20k repetições / condutas por dezenas de níveis). Números ✏️ calibrar com combate real |
| Eixos do emergente | **Dois eixos ortogonais** (jun/2026): **GEAR** (Marca de arma — independente, auto-gateada pela troca de tier) × **COMPORTAMENTAL** (Mutação + Caminho/título — **escalador único e competitivo**: magia dificulta título e vice-versa → traço único; **soft, não pool gasto**; 1ª mutação fica fora) |
| Escada de camadas | 4 camadas por raridade: ① 1ª Mutação (onramp/descoberta) · ② mutações profundas + Marca de arma · ③ Caminhos/classes escondidas · ④ **Criação de Skill** (pós-lançamento) |
| Marca de arma | 15k+ kills na **mesma instância**, **auto-gateada por tier** (aparece no T3, raro no T2); **nunca compensa pular tier** — bônus de quem já está no topo. Independente do escalador comportamental |
| Proveniência | Contadores de item vivem na **instância** (ledger). **Marca já destravada viaja inteira** com o item (relíquia); **progresso pré-unlock credita o novo dono em só 20–35%** no trade/loot (decidido jun/2026) — preserva o item-relíquia sem virar atalho de mercado pra Marca (% ✏️ Balancista) |
| Arquitetura | Tudo na sim; condições como **dados** (definições), não código; eventos `kill`/`skill_use`/`damage`/`block`/`level_up` desde o M1 |

Pendências em **Aberto / a decidir** no fim do documento.

---

# Camada Sólida

## Sistema de Stats

Level up concede **pontos de atributo** para distribuir (**4/nível — calibrado e confirmado, bateria M1.3 jun/2026**: com o custo por faixa, 4 pts garante ≥1 subida de stat em todo level até atributo 41+ — nenhum "level vazio" na escala do MVP; 3 pts deixava levels sem progresso visível e 5 pts reabria a degeneração do all-in) + ganhos automáticos da classe (HP/Mana base). Melhorar o char é decisão ativa e imediata — sem grind de proficiência por uso.

**Custo crescente (decidido — estilo Ragnarok Online):** subir um atributo já alto custa mais pontos, por faixa. **Faixas calibradas e confirmadas (bateria M1.2, jun/2026):** custo = `floor((valor−1)/10) + 2` — valores 1–10 custam 2 pontos, 11–20 custam 3, e assim por diante (`formulas.statPointCost`). Na sim, fechou a degeneração do all-in STR medida na bateria M1 (one-shot de auto nunca chega em 1h de farm). O **efeito de cada ponto nunca muda** (+X HP é sempre +X HP) — a camada sólida continua previsível e clara; build extrema é possível, só cara. (Rejeitados: linear puro — degenera como Diablo 2; retorno decrescente — ilegível como Dark Souls.)

**Divisão de papéis (decidido):** atributos dão **potência e recursos**; itens dão **mitigação**:

```
ATRIBUTOS → HP, mana, dano, cura, vel. de ataque, esquiva, regen, carga
ITENS     → defesa física, resistência mágica, resists elementais (DESIGN-ITENS.md)
```

**Atributos (5):**

| Atributo | Governa | Classe afim |
|---|---|---|
| **Força** | dano corpo-a-corpo (armas de força), capacidade de carga | Knight |
| **Destreza** | dano de adagas/distância, velocidade de ataque, esquiva | Rogue |
| **Inteligência** | dano mágico, mana máxima | Mage |
| **Vitalidade** | HP máximo, regeneração de HP | Knight (todos) |
| **Espírito** | poder de cura, regen de mana | Priest |

**Derivados** (calculados, nunca distribuídos) — formas já implementadas em `src/sim/formulas.ts`; números ✏️ calibrar:

| Derivado | Forma | Escala com |
|---|---|---|
| HP máx | base + Vit×k + crescimento de classe por nível | Vitalidade |
| Mana máx | base + Int×k + crescimento de classe por nível | Inteligência |
| Dano físico | base da arma + atributo×fator | Força (Des p/ adagas/distância) |
| Dano mágico | base da skill + Int×fator | Inteligência |
| Poder de cura | base da skill + Esp×fator | Espírito |
| Vel. de ataque | cooldown da arma − Des×k (com piso) | Destreza |
| Esquiva | Des×k % (com teto) | Destreza |
| Regen HP / mana | base + atributo×k por tick | Vitalidade / Espírito |
| Capacidade de carga (cap) | **implementado jun/2026, escala-Tibia, HÍBRIDO** — `base + Força×k + capPerLevel[classe]×(nível−1)` (mesmo padrão do HP: atributo + crescimento de classe). **Cresce automático por classe/nível** (Tibia: Knight 25 > Rogue 18 > Priest 12 > Mage 10), Força dá **bônus** (perk, não imposto). Pesos escala-Tibia (espada 35, placa ~120); enforcement modelo Tibia (só bloqueia trazer peso novo); cap no painel C. ✏️ números Balancista. Estudo: `docs/reports/2026-06-08-peso-cap-estudo.md` | Força (+ classe/nível) |

- **Crítico (decidido): não existe roll passivo de atributo.** Crítico é efeito explícito concedido por skills, Mutações e Caminhos (*Riposte*, *Sombra Sem Nome*…), com multiplicador padrão do sistema (×2 ✏️). Sem variância invisível no combate core — crítico é evento desenhado, não moeda aleatória.
- **Esquiva é assimétrica (decidido): mobs não esquivam.** Esquiva é derivado exclusivo de jogador — o dano do jogador é sempre legível (sem "errou" frustrante no grind). Sem stat de acerto no jogo (modelo Tibia).
- Classes têm **crescimento base** próprio por nível além dos pontos livres (implementado em `CLASS_GROWTH`; números ✏️).

**Diferenciação entre classes (decidido jun/2026 — agora que a magia não é mais exclusiva de classe).** Com magia de-classada (gate só por atributo+nível), o peso de separar Knight/Mage/Rogue/Priest recai sobre a **camada automática/grátis**, não sobre a economia de pontos — assim "build emerge dos *seus* pontos" (pilar 6) fica intacto. Três alavancas:

1. **Corpo automático forte (`CLASS_GROWTH`).** O diferenciador primário: cada classe ganha HP/mana/regen/cap por nível em proporções bem distintas (Mage = canhão de vidro: mana alta, HP/regen baixos; Knight = muralha: HP/cap altos, mana mínima). É o que faz o **híbrido se auto-balancear** — um Knight aprende Bola de Fogo, mas com `manaPerLevel` baixo não tem pool pra spammar (vira ferramenta, não rotação): o corpo automático é o **freio dos híbridos** que substitui o antigo lock-de-classe na magia. *Só recursos derivados — nunca auto-sobe atributo* (isso seria o jogo construindo a build por você; vetado pelo pilar 6). Números ✏️ Balancista.
2. **Atributos iniciais por classe.** O rito entrega um bloco inicial com a cara da classe (Knight começa For/Vit mais altos, Mage Int etc.) — dianteira grátis na fantasia, sem trancar build. Valores ✏️ Balancista.
3. **Desconto de afinidade no stat principal** (Knight=Força, Mage=Inteligência, Rogue=Destreza, Priest=Espírito). Subir o stat principal da classe custa menos pontos — **recompensa construir na fantasia da classe, sem taxar o off-stat** (híbrido continua viável, só não é o caminho barato; reforça o auto-balanceamento do custo-crescente). Não fere "o efeito de um ponto nunca muda" (mexe no **custo**, não no efeito). **Cobre só o stat principal (1 atributo).** **Forma DECIDIDA (Balancista, bateria 08/jun/2026): faixa de custo −1 no principal** (1–10 custa 1, 11–20 custa 2…). A forma "rebate 1-a-cada-5" foi medida e **descartada** (invisível — economiza só 1–2 níveis numa vida inteira, porque o rebate volta e cai numa faixa mais cara); a faixa −1 dá identidade *felt* (~−25% pro extremo, −5 a −8 níveis), sem bookkeeping, e **preserva a curva crescente da anti-degeneração** (só desloca uma faixa, não achata). Report: `docs/reports/2026-06-08-bateria-diferenciacao-classe.md`. ⚠️ re-checar na bateria T2 se acelera o one-shot do Knight (principal=Força) cedo demais.

**Retroativo ao classar (fecha o ✏️ de "recalcula retroativo?").** Os **ganhos automáticos** que o classless recebeu por nível (corpo genérico-fraco) são **recalculados para o padrão da classe** no momento do rito — um classless nível 10 que vira Knight ganha o corpo de Knight do nível 10 de cara. É só recomputar a fórmula derivada de `(classe, nível, atributos)`, sem estado oculto. **Os pontos que o jogador distribuiu continuam dele** (sem respec automático, sem auto-realocação — a autoria da build é do jogador). Não cria incentivo a adiar o rito: classless é lento/sem-skill/perigoso, o retroativo só **remove a armadilha** de ter desperdiçado níveis.
- **Bloqueio de escudo (decidido em `DESIGN-ITENS.md`, jun/2026):** escudo = **Def passiva** + chance de **bloqueio** que absorve % grande do golpe (~60–80% ✏️ Balancista), **nunca 100%** — bloqueio total é exclusivo do Caminho *Inabalável*. Cada bloqueio emite `block` (o contador do Caminho).

**Respec (reroll de stats):**
- **1 reset gratuito por personagem**, permanentemente disponível.
- Resets adicionais: **restritos** — futuramente feature paga (Steam/online) ✏️ decidir modelo.
- Marcas, Mutações e Caminhos **nunca** resetam — são história, não build.

## Aquisição de Skills (sem árvore de pontos)

Skills são **adquiridas pelo mundo, nunca dadas** — não existe skill point, árvore clicável, **nem kit inicial**. **Nenhum personagem começa com skill alguma** (o rito de classe entrega só a *arma*; combate de level 1 é auto-attack). A primeira skill já é uma pequena jornada: achar a fonte. (decidido jun/2026)

- **Requisito de aprendizado:** atributo + nível mínimo (ver *Modelo de gating*) — define quem PODE aprender. A **fonte** define ONDE se aprende. Não há "skill básica grátis": toda skill custou exploração, gold, um drop ou uma quest.
- **Fontes de aquisição (espalhadas pelo mundo — nunca um balcão central):**
  - **NPC** — treinador vende a skill; treinadores **espalhados** por cidades/POIs. Achar o NPC certo é jogar bem (pilar 4).
  - **Drop de mob** — tomo/pergaminho que ensina a skill ao usar. Raridade ∝ opacidade (pilar 3): skill drop-only rara é troféu.
  - **NPC + drop** — vende **e** dropa (as mais comuns, redundância de propósito).
  - **Quest** — **pouquíssimas**; recompensa de quest — a camada de prêmio mais alto.
- A fonte concreta de cada skill (qual NPC/mob/quest, onde no mapa) é **decisão de world-design**, registrada nas specs de fatia (`design/fatia-1-alvorada/` — NPCS/ITENS-LOOTS) ✏️.
- Gold (compradas) e raridade de drop são **sinks/incentivos** da economia; uma skill que você não acha vira meta de exploração ou item de mercado (online).
- **A "árvore" de uma skill é a vida dela:** adquiriu → usou → (perfil de uso extremo) → **Mutação** — a coroa oculta, única forma de upgrade.
- **Nada é automático:** nem no nascimento, nem no rito de classe, nem por level up. Level é **requisito**, nunca entregador.
- **Mecânica do tomo (decidido jun/2026):** o tomo/pergaminho é um **item tradeable e guardável** — possuir e negociar **não** têm gate. **Aprender** (consome o tomo, skill é permanente) exige o requisito de atributo+nível; sem requisito, **guarda no inventário/depósito** até poder. Aprendeu → consumido; tomo de skill que você já sabe vale só pra **vender/trocar**. Validação do aprendizado roda na sim (anti-cheat). Consequência: existe **mercado de tomos** (a skill que você não acha, você compra de outro jogador — a raridade vira preço, não muro).
- **Traits/árvore de passivas (estilo Apogea): avaliados e REJEITADOS (jun/2026)** — competiriam com Marcas/Caminhos pela especialização e violam "sem árvore de pontos". A escolha contínua mora nos pontos de atributo (custo crescente); se parecer rasa no playtest, calibra-se números, não se adiciona sistema.

## Outras formas de melhorar o char

Vetores de poder da camada sólida (todos previsíveis e claros):

1. **Level** → pontos de stats + HP/Mana
2. **Skills novas** → compradas/conquistadas (amplitude de kit)
3. **Equipamento** → loot/tiers de item (e onde as Marcas de item brilham como bônus)
4. ✏️ futuro: crafting/profissões? consumíveis? — _a pensar_

## Ritmo de progressão e morte (decidido — modelo Apogea)

**Upar é difícil. Mobs são fortes.** Nível é símbolo de competência, não de tempo jogado:

- **Forma da curva (decidida, ref. Apogea):** começa rápido e fica **exponencialmente** mais lento — cada nível custa **aproximadamente o dobro** do anterior. Os primeiros níveis (~1–8) vêm rápido (o jogador entra no jogo); depois cada level vira projeto. Números exatos ✏️ balancista calibra na sim.
- **Alvo de ritmo do MVP (decidido):** 1→25 em **~30–45h de caça eficiente** (casual: 2–3× isso). Split-alvo: 1→8 ~2–3h · 8→15 ~8–12h · 15→20 ~9–13h · 20→25 ~11–17h — **mais de um terço das horas nos últimos 5 níveis**. Lvl 25 é prestígio na escala da região (ref. criador: nos primeiros anos de Tibia não existia 200+ — o cap caro vem primeiro, áreas que facilitam vêm em expansões). Consequência de população: a maioria vive entre 8–18 → T2 é o centro de gravidade do conteúdo.
  - ⚠️ Implementação: `formulas.ts` hoje usa a curva **cúbica do Tibia** — precisa migrar para a forma exponencial (delta ~2×/nível) na calibração.
- Mobs exigem atenção e respeito — combate não é farm trivial nem de passagem. Um mob comum mal jogado pode matar.
- Consequência: os thresholds das Marcas (10–20k kills) ficam ainda mais lendários, porque cada kill custa.

**Morte: punição concentrada na experiência, leve no resto:**

| Aspecto | Punição |
|---|---|
| XP | **Perde % da XP TOTAL acumulada** (ref. Apogea: 10% ✏️ calibrar) — **pode deslevelar, sim**. Com a curva exponencial, a punição cresce com o personagem: no early são minutos; no late, 1 morte ≈ retroceder 1+ níveis (10% do total ≈ 20% do custo do nível atual — quem acabou de upar deslevela) |
| Itens / equipamento | **Nunca perdidos** — Marcas são o ego dos itens, e ego não se perde na morte |
| Outros (gold, debuff temporário…) | Leve ou nenhuma ✏️ |

Racional: a dor da morte precisa ser real (XP caro num jogo de upar difícil = morte dói muito) e **escalar junto com o que está em jogo** — o lvl 20 numa dungeon T3 arrisca horas, não minutos; é isso que torna profundidade um compromisso (custo de fracasso cresce, regra do world design). Mas sem destruir a camada de Marcas/relíquias — perder uma espada com 14k kills seria punição desproporcional e mataria o investimento emocional que o jogo inteiro cultiva. (Morte ainda não desconta XP no M1 — entra junto com a calibração ✏️.)

---

# Camada Emergente — Sistema de Marcas

## Conceito core

O jogo observa o comportamento do jogador (contadores na simulação) e cristaliza padrões extremos em recompensas **nomeadas, raras e permanentes**. Ninguém escolhe uma Marca — ela acontece com você.

**Pilares:**

1. **Entrada descobrível, aprofundamento brutal** — a 1ª Mutação de skill é o **onramp**: barata e completa (um pequeno giro de estilo, não power spike), ela existe pra o jogador *descobrir que o sistema existe* só jogando. O resto é brutal: Marca de arma, Caminhos e mutações profundas custam ordem de 10–20 mil repetições ou condutas mantidas por dezenas de níveis — esses são eventos na vida do personagem, não checkboxes.
2. **Nomeada e narrativa** — toda recompensa tem nome próprio e flavor. "Quebra-Ossos" > "+15% dano vs mortos-vivos". O nome É a recompensa social.
3. **História pertence ao objeto** — contadores de item vivem na **instância** do item. A Marca já **destravada** viaja inteira (a espada *Quebra-Ossos* continua Quebra-Ossos com o novo dono); o **progresso pré-unlock** transfere só **20–35%** no trade/loot (anti-atalho de mercado — ver Anti-degeneração). Itens viram relíquias com proveniência (crucial pro online/economia futura).
4. **Identidade emergente** — a build vem da camada sólida (stats + skills), mas a **identidade** vem daqui: as Marcas contam quem o personagem é, não o que ele distribui de pontos.
5. **Tempero, não pilar de progressão** — nada da camada emergente é requisito para nada. É bônus, prestígio e lenda.

## Taxonomia

| Categoria | Nome | Vive em | Exemplo |
|---|---|---|---|
| Item | **Marca** | instância do item | Espada matou 15k mortos-vivos → marca *Quebra-Ossos* (+dano vs mortos-vivos) |
| Skill/Magia | **Mutação** | skill do personagem | Bola de Fogo usada 10k vezes → muta para *Fogo Voraz* (queima em área) |
| Personagem | **Caminho** | personagem | Chegou ao lvl 20 usando só uma magia; só usa fogo+gelo; nunca usou armadura… |
| (futuro) | — | — | exploração, profissões, bestiário ✏️ |

## Regras universais

### Visibilidade — "oculto que se revela"

- Condições **nunca** são listadas no jogo. Sem contador, sem barra de progresso, nunca.
- Ao atingir **~50% do progresso**, surge uma dica vaga e atmosférica: *"sua espada vibra quando há mortos-vivos por perto"*, *"as chamas parecem responder à sua vontade"*.
- O desbloqueio é um **momento**: efeito visual/sonoro forte + reveal do nome. Deve ser screenshotável.
- Consequência desejada: a comunidade vira arqueóloga do sistema (wiki, teorias, lendas).

### Acúmulo (slots de Marca por raridade)

| Portador | Slots de Marca |
|---|---|
| Itens comuns → raros (~90% dos tiers) | **1** |
| Itens lendários | **2** |
| Itens únicos | **3** |
| Personagem — eixo comportamental (Caminhos/títulos **+ Mutações**) | **sem cap fixo**, mas **escalador único e competitivo**: cada saída conquistada (Caminho/título **ou** mutação) **encarece as próximas dos dois lados** (multiplicador ✏️ ex: ×1.5) — magia dificulta título e vice-versa → o personagem converge num **traço único**. **Soft (dificuldade sobe), não pool gasto** — nada fica inalcançável. **A 1ª mutação (onramp) fica fora do escalador** |

- Item com slots cheios continua acumulando contadores, mas não ganha novas Marcas (a não ser que ✏️ exista rito para substituir/fundir — decidir depois).

### Anti-degeneração (regras da sim)

- Kill só conta se o mob for **válido** (dá XP para o nível do jogador — mata farm de rato no lvl 100).
- Para a **arma**: conta o kill se ela deu o **golpe final** estando equipada. Trocar de arma **atrasa, não zera** — o ledger é da instância; usar outra só não incrementa esta (cumulativo-sem-reset).
- **Transferência (trade/loot):** a Marca já **destravada** viaja inteira com o item (relíquia); o **progresso pré-unlock credita o novo dono em só 20–35%** (% ✏️ Balancista). Impede comprar/lootar uma arma 14.999/15.000 e fechar a Marca de graça (anti-banalização pelo mercado), preservando a história parcial do item. Com vários tipos de mob, a diluição mantém caro "ser o primeiro a fechar mil de um tipo".
- Para a **skill**: uso só conta se **atingiu alvo válido** (spam no ar não conta).
- Contadores e verificação de condições rodam **100% na sim** (`src/sim/`), nunca no client — à prova de cheat no online futuro.
- ✏️ Detectar AFK-farm / macro: decidir política (provavelmente irrelevante no single player, crítico no online).

### Permanência (decidido)

**Marcas, Mutações e Caminhos nunca se perdem.** Por nenhum mecanismo: morte, respec, ou quebra da conduta após a aquisição. São **evoluções permanentes** do personagem/item, não estados condicionais.

- O **Monge** que equipar uma espada **continua Monge**. A conduta é o rito de passagem, não um voto eterno.
- É exatamente por isso que cada Caminho adquirido **encarece os próximos** (regra de acúmulo): o poder acumula sem volta, então o controle de balance fica todo no gate de aquisição.
- Marcas de item viajam com o item para sempre (trade, drop, herança).

### Condutas — aquisição

- Caminhos de restrição (ex: "só uma magia até lvl 20") são monitorados continuamente **da criação do personagem até o desbloqueio**. Depois disso, liberdade total.
- ✏️ Quebrar a conduta **antes** de adquirir: perde a chance para sempre naquele char (estilo NetHack) ou apenas zera o progresso? — a decidir.

---

## 1. Marcas de Item — o ego do item

> **A Marca é o ego do item.** Ego não é algo que se perde ou muda de forma drástica sem eventos canônicos.

A instância do item guarda um **ledger**: contadores de quem/o quê/como ele matou ou foi usado.

**Dimensões rastreadas (por instância):**
- Kills por **tipo de criatura** (esqueleto, morto-vivo como família, demônio…)
- Kills por **contexto** (à noite, abaixo de X% de HP, sem tomar dano no combate…)
- Tempo/uso total, dano causado, donos anteriores (proveniência)

### Níveis × Evolução (decidido)

Cada Marca tem **1 a 3 níveis** (depende da marca — definido no design dela). Dois mecanismos distintos:

| Mecanismo | Como acontece | Natureza |
|---|---|---|
| **Subir de nível** (I → II → III) | Repetição contínua — o ledger continua contando após o desbloqueio, com thresholds crescentes ✏️ | Quantitativo: a marca fica **mais forte** (ex: Quebra-Ossos I +10% → II +15% → III +20%) |
| **Evolução / alteração** | Apenas em **eventos canônicos** extremamente raros e especiais: boss mundial, situações de PvP extremo (online), momentos únicos do mundo ✏️ | Qualitativo: a marca **muda** — novo nome, novo efeito, nova lenda (ex: *Quebra-Ossos* que deu o golpe final num boss mundial lich → *Heresia*, dano sagrado em área vs mortos-vivos) |

- Evolução canônica **não é farmável** — é estar no lugar certo, no momento histórico certo, com o item certo. No online, isso cria itens literalmente únicos no servidor.
- ✏️ Lista de eventos canônicos válidos: definir junto com world bosses (M3+) e PvP (M6+).

**Exemplos de Marca** (números ✏️ placeholder):

| Condição | Marca | Níveis | Efeito |
|---|---|---|---|
| 15.000 mortos-vivos mortos com a mesma espada | **Quebra-Ossos** | I–III | +10/15/20% dano vs mortos-vivos |
| 10.000 kills com golpe final abaixo de 10% do próprio HP | **Última Resposta** | I–II | +dano quando HP < 25% |
| 8.000 kills noturnos | **Lâmina da Vigília** | I | brilho fraco + dano extra à noite |
| Escudo bloqueou 50.000 golpes | **Inabalável** | I–III | chance de bloqueio total crescente |

✏️ _tabela alimentada pelo criador conforme o bestiário/itens nascem_

## 2. Mutações de Skill

Skill usada em volume extremo **muta**: muda qualitativamente e ganha nome. Não é rank (+5% dano) — é a skill virando outra coisa. **O ganho de poder é pequeno; o valor é o condicionador de estilo** (Koster: vara nova, não número maior) — por isso a camada emergente é tempero/identidade, nunca pilar de progressão.

**A 1ª mutação é o onramp do sistema inteiro:** barata e completa (não trailer de algo maior), ela existe pra o jogador **descobrir que esse sistema existe só jogando**, e fica **fora do escalador comportamental**. **Da 2ª em diante já começa bem difícil** e entra no escalador único e competitivo que divide com os Caminhos (ver *Acúmulo*). Aquisição da mutação é **100% por uso** — tomo/drop/quest gateiam só a skill *base*, nunca a mutação (decidido jun/2026, modelo R1).

**O "como" importa tanto quanto o "quanto":** a sim rastreia o **perfil de uso**, e ele decide **qual** mutação nasce. A mesma Bola de Fogo pode virar coisas diferentes:

| Perfil de uso (10k usos) | Mutação | Efeito |
|---|---|---|
| Maioria dos usos à distância máxima | **Meteoro Distante** | alcance maior, dano cresce com a distância |
| Maioria à queima-roupa | **Eclosão Ígnea** | explosão centrada no caster, empurra inimigos |
| Maioria em alvos já queimando | **Fogo Voraz** | reacende e espalha queimadura em área |

- Cada skill tem **2–4 mutações possíveis** desenhadas à mão (✏️ por skill). Procedural não — nome e efeito são autorais.
- **Mutação substitui** a skill original (decidido jun/2026): o gatilho é um **perfil de uso sustentado** (não um evento avulso), então você **nunca muta por acidente** — substituir é seguro, permanente e identitário.

## 3. Caminhos do Personagem

Padrões de comportamento do **personagem inteiro**. Dois sabores:

**a) Condutas (restrição mantida):**

| Condição | Caminho | Efeito |
|---|---|---|
| Lvl 20 usando uma única magia ofensiva | **Devoto do Único Verbo** | a magia ganha mutação exclusiva impossível de obter por uso |
| Lvl 30 sem nunca equipar armadura | **Pele de Ferro** | defesa base escala com nível |
| Lvl 25 sem nunca usar arma (só punhos/magia) | **Mão Vazia** | dano desarmado real + skills desarmadas |

**b) Estilo (padrão dominante):**

| Condição | Caminho | Efeito |
|---|---|---|
| ≥95% do dano causado via fogo+gelo por 20 níveis | **Senhor dos Extremos** | combinar fogo e gelo gera efeito novo (choque térmico) |
| ≥90% dos kills em grupo/perto de aliados (online) | ✏️ | ✏️ |

- Caminhos são a **especialização emergente da classe** (ver Classes): o mago que vira *Senhor dos Extremos* é, na prática, uma subclasse que ninguém escolheu.
- Lembrete: cada Caminho obtido encarece os próximos (regra de acúmulo).

✏️ _lista alimentada pelo criador_

---

## 4. Criação de Skill (Camada 4 — pós-lançamento)

O **ápice** do eixo comportamental: o jogo não muta uma skill que você já tem — ele **gera uma skill nova** a partir de um perfil de comportamento raríssimo (combinações de uso entre skills, condutas extremas cruzadas). É a saída mais rara da escada: uma assinatura que pouquíssimos personagens no mundo terão.

- **Mesma engine, mesma taxonomia:** é o tracking observando um perfil e emitindo uma recompensa — só que a recompensa é uma skill autoral inédita. Entra no **escalador comportamental** como a saída mais cara de todas.
- **Por que pós-lançamento:** o motor é barato (dado declarativo); a **autoria** de cada skill criável (efeito, gatilho, legibilidade, número do Balancista) é o custo real — não o sprite (PixelLab é barato). No MVP a engine fica pronta e exercitada; o catálogo de skills criáveis é conteúdo de expansão.
- ✏️ Catálogo de skills criáveis + perfis-gatilho — criador / Loremaster / Balancista, pós-MVP.

---

## Classes (decidido — base fixa + especialização emergente)

**A classe é adquirida no mundo, não escolhida na criação (decidido jun/2026 — modelo Rookgaard/Oráculo):**

- O personagem nasce **sem classe**: roupas simples + arma genérica + mochila, **sem skills** (kit detalhado ✏️ em `DESIGN-ITENS.md`), e **spawna aleatoriamente** numa cidade inicial (regra de cidade de spawn em `DESIGN-MUNDO.md`: constelação T1 ao redor + os **4 NPCs de classe**).
- Virar uma classe = procurar o NPC dela e cumprir o **rito: quest boba + gold simbólico**. A quest tem a cara da classe e dobra como tutorial de uma mecânica; o rito **entrega a arma do kit**. Até a classe é algo que você FEZ (pilar 6). **Sem restrição de nível NENHUMA (decidido jun/2026)**: o rito está aberto a qualquer momento — a única barreira é o gold simbólico.
- Classless tem crescimento por level **genérico e fraco** e nenhum acesso a skills — a pressão para se classar é natural, sem gate artificial. **Ao classar, o crescimento automático (HP/mana/cap) recalcula retroativo ao padrão da classe (decidido jun/2026):** os ganhos automáticos viram os da classe para o nível atual; os **pontos distribuídos pelo jogador ficam intactos** (sem auto-realocação). Detalhe das 3 alavancas de diferenciação na seção *Sistema de Stats*. (Números ✏️ Balancista.)
- **Condutas de Caminho contam a partir da aquisição da classe (decidido):** o período sem classe não conta nem quebra conduta (*Mão Vazia* etc.) — o voto começa na ordenação; o rito é o marco zero dos contadores.

**Não existem subclasses escolhíveis** — especialização emerge via Caminhos e Mutações.

A classe base define **o que a sim rastreia com mais peso** para aquele personagem (as "lentes" dos contadores).

Quarteto base: **Knight / Mage / Rogue / Priest** (decidido). Sem 5ª classe "Monk" — **Monge é um Caminho emergente do Priest** (conduta *Mão Vazia*, decidido): o sistema gerando a primeira subclasse lendária por atitude.

> Estrutura decidida; fantasia/kits/números ✏️ refinam conforme M1/M2 avançam.

### Knight
- **Fantasia:** a muralha — aguenta o que ninguém aguenta e devolve em aço.
- **Kit do rito de classe:** escolha de arma — **espada × machado × maça** — **+ escudo de madeira**. A escolha semeia a lente de Marca (kills por tipo de arma) no primeiro minuto. (Rito dá só a arma — **nenhuma skill**; *Golpe Forte* é a primeira a buscar pelo mundo.)
- **Atributos-chave:** Força, Vitalidade
- **Lentes de rastreamento:** kills **por tipo de arma** (espada/machado/maça), kills por família de criatura **com a arma equipada**, golpes **bloqueados com escudo**, dano **absorvido**, kills em HP baixo.
- **Caminhos típicos:**
  1. *Inabalável* — 50k bloqueios com escudo → chance de bloqueio total
  2. *Fúria Encurralada* — milhares de kills com HP < 15% → dano cresce quando quase morto
  3. *Duas Mãos, Nenhuma Dúvida* — lvl 25 sem nunca equipar escudo → arma de 2 mãos ataca mais rápido
  4. *Carrasco de <família>* — volume extremo de kills de uma família (vs mortos-vivos, vs demônios…) → bônus contra ela (espelha as Marcas de item, mas no char)

### Mage
- **Fantasia:** o canal bruto dos elementos — frágil, devastador, obcecado.
- **Kit do rito de classe:** cajado 2H, escolha **fogo × gelo** — a primeira declaração elemental (alimenta *Senhor dos Extremos*/*Coração de Cinzas*). (Rito dá só o cajado; *Bola de Fogo*/*Lança de Gelo* = primeiras a buscar.)
- **Atributos-chave:** Inteligência (dano/mana), Vitalidade (sobreviver)
- **Lentes de rastreamento:** dano **por elemento**, perfil de **distância** dos casts, **combos** elementais (alvo congelado recebendo fogo etc.), % do dano total vindo de magia.
- **Caminhos típicos:**
  1. *Senhor dos Extremos* — ≥95% do dano via fogo+gelo por 20 níveis → choque térmico (combo novo)
  2. *Coração de Cinzas* — mono-elemento fogo por 25 níveis → queimaduras não expiram, fogo upado / (variantes para cada elemento)
  3. *Devoto do Único Verbo* — lvl 20 com uma única magia ofensiva → mutação exclusiva dela
  4. *Intocado* — lvl 20 sem nunca causar dano físico (nem auto-attack) → mana regenera em combate

### Rogue
- **Fantasia:** a lâmina que você não viu — posição, timing e veneno.
- **Kit do rito de classe:** escolha **adaga × arco** (uma arma — a segunda adaga do dual wield é uma meta de loot/compra). (Rito dá só a arma; *Apunhalar* = primeira skill a buscar.)
- **Atributos-chave:** Destreza (dano/esquiva/vel. ataque), Vitalidade
- **Lentes de rastreamento:** kills **pelas costas**, kills **à noite**, combates vencidos **sem tomar dano**, kills com alvo **envenenado**, kills com golpe final em alvo com HP cheio (one-shot de abertura).
- **Caminhos típicos:**
  1. *Sombra Sem Nome* — milhares de combates sem tomar nenhum dano → primeiro ataque de cada combate é crítico garantido
  2. *Filho da Noite* — volume extremo de kills noturnos → buff permanente à noite
  3. *Língua de Víbora* — 10k kills com veneno ativo → venenos empilham
  4. *Açougueiro Cirúrgico* — 10k apunhaladas conectadas → Apunhalar ganha mutação exclusiva

### Priest
- **Fantasia:** o canal do sagrado — sustenta os vivos, apaga os profanos.
- **Kit do rito de classe:** escolha **cetro × luva** — a luva é oferecida **sem comentário algum do NPC**: o hint silencioso do Monge (quem a escolhe começa *Mão Vazia* limpa desde a ordenação). (Rito dá só a arma; *Luz Sagrada* + *Curar Ferimentos* = primeiras a buscar.)
- **Atributos-chave:** **Espírito** (cura, regen de mana **e dano sagrado** — decidido 09/jun/2026: a ofensiva sagrada escala Esp, não Int; é por isso que o Priest é o melhor conjurador sagrado, alinhado ao de-classing). Inteligência só se quiser hibridizar com elemental.
- **Lentes de rastreamento:** **cura total realizada**, kills vs mortos-vivos/demônios **com dano sagrado**, dano tomado **no lugar de aliados** (online), conduta de **nunca equipar arma**, conduta de pacifismo.
- **Caminhos típicos:**
  1. **Monge** (*Mão Vazia*) — lvl 25 sem nunca equipar arma, matando desarmado → dano desarmado real escala com nível + destrava skills marciais. **A "5ª classe" do jogo, que ninguém escolhe.**
  2. *Exorcista* — 15k mortos-vivos/demônios mortos com dano sagrado → holy ignora resistências profanas
  3. *Mártir* — volume extremo de dano absorvido protegendo aliados → cura a si ao curar outros (online)
  4. *Voto de Silêncio* ✏️ — lvl 20 só com cura e Luz Sagrada (nenhuma outra magia) → ✏️

> **Atenção de balance:** Priest precisa ser viável solo (Luz Sagrada como nuke vs undead resolve farm); caminhos de cura/proteção só brilham no online — ok, são apostas de longo prazo.

**Template para novas classes (se houver):**

```
### <Nome da classe>
- Fantasia: <uma frase>
- Arma do rito: <arma; SEM skills — nada é dado>
- Atributos-chave: <>
- Lentes de rastreamento: <quais contadores ela destrava — ex: guerreiro rastreia por arma, mago por elemento>
- Caminhos típicos (3–5 que esperamos que emerjam): <>
```

## Magias e Skills

Toda skill nasce **já preparada para o sistema**: com tags e contadores definidos no design, não adicionados depois. **Aquisição espalhada pelo mundo** — NPCs, drops de mob, quests; **sem kit inicial, nada dado** (ver *Aquisição de Skills* na Camada Sólida; placement concreto de cada uma é world-design, ✏️ na fatia). Números de dano/custo/cooldown são ✏️ até o M1 dar a régua. **Gate de uso = cooldown** (modelo Apogea); mana é custo secundário (decidido jun/2026) — combate é rotação de ferramentas, não spam.

**Auto-attack** não é skill: é o ataque básico contínuo da arma equipada (estilo Tibia). Não muta — mas alimenta as **Marcas de item** (todo kill por auto-attack conta no ledger da arma).

### Modelo de gating — por requisito, não por classe (decidido jun/2026)

A lista de skills é **uma só, organizada por requisito** — não existe "skills do Mage" vs "skills do Knight". O que você pode comprar é gateado por **atributo + nível** (+ gold), **não pela classe** (modelo *gems* do Path of Exile).

**Racional:** anda de mãos dadas com o **custo-crescente de atributos** — um híbrido (Knight que bomba Int pra lançar fogo) é possível, mas **naturalmente caro** (medíocre nos dois, porque cada atributo encarece por faixa), então o balance se resolve sozinho. E serve o **pilar 6**: a "subclasse" *spellblade*/*battlemage* **emerge da distribuição de pontos**, não de um menu — coerente com "sem subclasses escolhíveis".

| O que a **classe** ainda decide | O que o **atributo** decide |
|---|---|
| Ingresso (classless **não** treina nada) · lente de Marca · corpo automático + atributos iniciais + desconto no stat principal · arma do rito — **nenhuma magia** | **Quais** skills você pode comprar (atributo + nível mínimo) |

**Mapa de afinidade (qual atributo gateia o quê):**

| Atributo | Gateia |
|---|---|
| **Força** | marciais ofensivas (golpes, charge) |
| **Vitalidade** | defensivas / controle de tank (Knight escolhe a perna: For ou Vit) |
| **Destreza** | adaga/precisão, veneno, mobilidade furtiva, conjurar munição |
| **Inteligência** | elemental (fogo/gelo/terra/raio/morte), arcano, controle mágico |
| **Espírito** | potência de cura, luz **e sagrado/anti-profano** (todos conjuram; Esp manda na força) |

**Sem exceções (decidido jun/2026):** nenhuma magia é exclusiva de classe. O **sagrado** (antes trancado no Priest) também é gate por atributo — **Espírito + nível** — como todo o resto; o Priest continua o melhor conjurador sagrado porque seu **corpo automático bomba Espírito**, não porque a magia seja dele. *(Capstones T3 e Caminhos seguem sendo especialização **emergente** da classe — via Marca/conduta, não magia de tomo; ver Camada Emergente. A regra "nada exclusivo" vale para magias aprendidas por tomo, não para Caminhos.)*

**Taxonomia (substitui "Comuns vs Únicas"):** **Universais** (gate baixo/nenhum) · **Por afinidade** (a maioria, gate por atributo). Toda skill cabe numa das duas — não há mais categoria "de classe". *(Eixo ortogonal: a **fonte** — NPC/drop/quest — é independente do requisito; ver Camada Sólida.)*

**Regra de gating do AoE — unlock de meio-jogo (decidido jun/2026):** **toda magia de DANO em área tem gate de nível ALTO (~lvl 20)**, para QUALQUER classe. AoE-de-dano é o *power spike* de eficiência de farm ("vara nova pra cutucar a colmeia", Koster — interação nova, não número maior), não uma ferramenta de early. Distinção que opera a regra:
- **AoE de DANO (deleta o pack)** → gate ~lvl 20. Ex.: *Redemoinho*, *Onda de Chamas*, variantes em área de *Terra/Raio/Morte*. É o botão que limpa grupos — prêmio do meio-jogo.
- **AoE de CONTROLE/utilidade (gerencia, não deleta)** → liberada cedo (T1). Ex.: *Nevasca* (campo de lentidão), *Grito de Guerra* (taunt), *Muralha* (funil), *Consagrar* (zona). Dano nulo/desprezível por design — quem dá dano de área entra na categoria acima.

**Consequência (pilar 2 — punitivo, nunca injusto):** packs no intervalo **lvl 10–20 não se DELETAM, se ADMINISTRAM** — a resposta é *skill*: posicionamento, **single-pull**, kite, funil (Muralha), e defensivas. Pack continua perigoso até você merecer o AoE; o counterplay é justo e legível. **Knight 10–20:** sobrevive ao pack com **defensiva ativa (*Baluarte*, ~lvl 10–15) + single-pull + *Grito*** e mói single-target (auto + *Golpe Forte*) — a fantasia **Muralha** (out-last); *Redemoinho* @~20 é quando ele finalmente CEIFA. ⚠️ *Baluarte* dimensionado pelo **Balancista** para tornar um 3-pack T2 sobrevivível-com-cooldown (hoje o Knight quase morre, bateria T2). **Mage 10–20:** single-target forte (burst) + controle (lentidão/Muralha) + kite (wand ranged); AoE-de-dano (*Onda de Chamas*) também @~20. **Níveis exatos de cada skill = ✏️ Balancista** (thresholds calibrados em dificuldade/TTK); a categoria AoE-dano fica ancorada em ~20.

### Lista de skills por requisito

> Índice mestre (M1 + T2). Slots ✏️ ainda em aberto (criador decide). Fichas detalhadas logo abaixo. (Tier M1 = primeira leva desenhada, **não** "kit inicial" — nada é dado; ver fontes na Camada Sólida.)

| Requisito | Skill | Arquétipo | Uma linha | Tier |
|---|---|---|---|---|
| Universal (escala Esp) | **Cura** (*exura*) | cura/sustain | cura mágica instantânea, spammável | M1 |
| Universal | **Luz** | utilidade/exploração | ilumina ao redor por Xs | M1 |
| Universal | *Disparada* | mobilidade | burst de velocidade | M1 |
| Universal | *Primeiros Socorros* | sustain (sem mana) | cura canalizada não-mágica | M1 |
| Universal | *Arremesso* | dano/distância | projétil físico fraco (pull/finisher) | M1 |
| For + lvl | *Golpe Forte* | dano melee | burst com a arma equipada | M1 |
| For + lvl | *Investida* | mobilidade+controle | charge até o alvo + atordoamento | T1 |
| For + lvl (**~lvl 20**) | *Redemoinho* | dano AoE | golpe ao redor de si — **AoE-dano: gate ~lvl 20** (power spike anti-pack do Knight) | T2 |
| Vit + lvl | *Grito de Guerra* | controle/taunt | força agro em área (tank) | T1 |
| Vit + lvl (~lvl 10–15) | **Baluarte** ✏️ | defesa ativa | janela de redução de dano / bloqueio — **a resposta do Knight a packs no 10–20** (out-last + single-pull); Balancista dimensiona p/ 3-pack T2 sobrevivível-com-cooldown | T1 ✏️ |
| For/Vit | (Knight 5º ✏️) | sustain ou cone | ✏️ a decidir | ✏️ |
| Des + lvl | *Apunhalar* | dano melee posicional | backstab (~2× pelas costas) | M1 |
| Des + lvl | *Lâmina Envenenada* | buff/DoT | ataques aplicam veneno por Xs | T1 |
| Des + lvl | **Conjurar Flechas** | utilidade/recurso | mana alta → flechas temporárias (alivia o sink de gold do arqueiro) | T1 |
| Des + lvl | **Furtividade** ✏️ | utilidade/mobilidade | esgueirar breve, garante uma abertura de backstab | T1 ✏️ |
| Des + lvl | (Rogue 5º ✏️) | controle/utilidade | armadilha no chão **ou** farejar/marcar alvo | ✏️ |
| Int + lvl | *Bola de Fogo* | dano (fogo + DoT) | projétil que queima | M1 |
| Int + lvl | *Lança de Gelo* | dano + controle (gelo) | linha perfurante + lentidão | M1 |
| Int + lvl | *Muralha* | controle/utilidade | bloqueia um corredor (jogada-de-veterano) | T1 |
| Int + lvl | *Barreira Arcana* | defesa | mana absorve dano no lugar do HP | T1 |
| Int + lvl | (Mage 5º ✏️) | utilidade ou 3º elemento | blink curto **ou** raio (beam) | ✏️ |
| Int + lvl (**~lvl 20**) | *Onda de Chamas* | dano (fogo, wave) | cone estilo Tibia — **AoE-dano: gate ~lvl 20** | T2 |
| Int + lvl | *Nevasca* | controle (gelo, campo) | área contínua de gelo no chão — **controle puro (slow, dano desprezível) → liberada cedo**; se aplicar dano de área, migra p/ AoE-dano ~lvl 20 | T2 |
| Int + lvl | *Terra / Raio / Morte* | dano/controle | demais elementos do leque — variantes em ÁREA = AoE-dano (**~lvl 20**); single-target seguem o elemento | T2 |
| Esp + lvl | **Purificar** ✏️ | sustain/cleanse | cura veneno e debuffs | T1 ✏️ |
| Esp + lvl (sagrado) | *Luz Sagrada* | dano sagrado | smite anti-profano (nuke solo vs undead) | M1 |
| Esp + lvl (sagrado) | *Curar Ferimentos* | cura grande | cura forte self/aliado | M1 |
| Esp + lvl (sagrado) | *Escudo Sagrado* | defesa | barreira em si/aliado | T1 |
| Esp + lvl (sagrado) | *Consagrar* | zona/controle | área sagrada no chão — ✏️ **classificar pela regra de AoE**: se o dano de área a profanos é o ponto → AoE-dano (~lvl 20); se recast como zona de controle (enfraquece/atrapalha, dano desprezível) → fica cedo | T1 ✏️ |
| Esp + lvl (sagrado) | *Punhos da Fé* | melee desarmado sagrado | porta de entrada do Caminho Monge | T2 |

### Universais (qualquer classe — gate baixo/nenhum)

#### Cura (estilo *exura*) — ✏️ nome (Loremaster)
- **Tipo:** cura instantânea (self / aliado)
- **Arquétipo:** sustain
- **Requisito:** universal (gate baixo) · **escala com Espírito** — todos conjuram, o Priest cura muito mais
- **Custo / cooldown:** mana baixa / curto — a cura *spammável* do dia a dia
- **Distinção das vizinhas:** *Primeiros Socorros* = canalizada, **sem mana**, cancela ao tomar hit; **esta** = mágica, **instantânea**, custa mana; *Curar Ferimentos* = a cura grande (sagrado, Esp). O eixo é **mecanismo**, não degrau de número.
- **Perfis rastreados:** self vs aliado · HP no momento do uso · em combate vs fora
- **Mutações:**
  1. maioria em HP crítico → **Reflexo Vital** — cura muito maior quando quase morto
  2. maioria fora de combate → **Recuperação** — deixa um regen leve após o cast
  3. maioria em aliados → **Mãos Generosas** — pinga um pouco no caster / salta para aliado próximo

#### Luz (estilo *utevo lux*) — ✏️ nome
- **Tipo:** utilidade
- **Arquétipo:** exploração
- **Requisito:** universal (gate nenhum)
- **Custo / cooldown:** baixos
- **Efeito base:** emite luz ao redor do caster por Xs ✏️
- **Por que importa:** escuridão vira recurso de verdade (pilar 1/4) — caverna escura é perigo legível e a luz é a ferramenta. Cria tensão com os Caminhos noturnos do Rogue (*Filho da Noite* **abre mão** da luz).
- **Perfis rastreados:** tempo em escuridão · exploração vs combate
- **Mutações:**
  1. muito uso em escuridão prolongada → **Luz Duradoura** — raio e duração maiores
  2. maioria em combate → **Lampejo** — ao conjurar, breve cegueira em inimigos adjacentes


#### Disparada
- **Tipo:** utilidade (burst de velocidade por ~2s ✏️)
- **Tags:** mobilidade
- **Custo / cooldown:** ✏️ / longo
- **Perfis rastreados:** direção relativa ao inimigo (fugindo vs engajando), HP ao usar
- **Mutações:**
  1. maioria fugindo com HP baixo → **Pés Alados** — ativar quebra slows/roots
  2. maioria engajando → **Ímpeto** — primeiro golpe após a disparada ganha bônus de dano

#### Primeiros Socorros
- **Tipo:** cura não-mágica (canalizada, cancela se tomar hit)
- **Tags:** cura, físico
- **Custo / cooldown:** ✏️ / longo — é o sustain solo de Knight/Rogue, não compete com Curar Ferimentos
- **Perfis rastreados:** em combate vs fora, HP no momento do uso
- **Mutações:**
  1. maioria com HP < 15% → **Sangue Frio** — não cancela mais ao tomar hit
  2. maioria fora de combate → **Descanso de Veterano** — cura também regenera ✏️ (stamina/debuffs)

#### Arremesso
- **Tipo:** projétil físico fraco (faca/pedra)
- **Tags:** físico, distância
- **Efeito base:** dano baixo — serve de pull e de finisher contra fugitivos
- **Perfis rastreados:** alvo fugindo, primeiro hit do combate (pull), golpe final
- **Mutações:**
  1. maioria em alvos fugindo → **Caçador** — aplica slow
  2. maioria como golpe final → **Pontaria Cruel** — dano enorme vs alvos < 15% HP

✏️ _mais universais a definir — candidato: **Foco/Meditação** (regen de mana canalizado fora de combate). "Provocar" saiu daqui: virou **Grito de Guerra** (Vit, taunt em área)._

### Fichas detalhadas — primeiras skills (M1)

> **Não é "kit inicial"** — ninguém começa com elas; são só as primeiras desenhadas. Requisito no modelo de gating acima — **tudo por atributo + nível, sem exceção**: sagrado (*Luz Sagrada*, *Curar Ferimentos*) = Espírito + nível; o resto = Golpe Forte→For, Bola/Lança→Int, Apunhalar→Des. Fonte (NPC/drop/quest) ✏️ na fatia.

#### Golpe Forte (For)
- **Tipo:** melee ativo (alvo selecionado)
- **Elemento/tags:** físico, arma
- **Custo / cooldown:** ✏️ mana baixa / ~6s
- **Efeito base:** golpe com a arma equipada por ~1.8× dano ✏️
- **Perfis rastreados:** HP do caster ao usar, uso logo após bloqueio (≤1s), golpe final (executou o alvo)
- **Mutações:**
  1. maioria dos usos com HP < 25% → **Golpe Desesperado** — dano escala com HP perdido
  2. maioria logo após bloquear → **Riposte** — após bloqueio, próximo Golpe Forte é instantâneo e crítico
  3. maioria como golpe final → **Lâmina do Fim** — dano massivo vs alvos abaixo de 20% HP

#### Bola de Fogo (Int)
- **Tipo:** projétil
- **Elemento/tags:** fogo, queimadura (DoT)
- **Custo / cooldown:** ✏️
- **Efeito base:** dano de fogo + queimadura por Xs ✏️
- **Perfis rastreados:** distância do cast, alvo já queimando, alvos atingidos
- **Mutações:**
  1. maioria à distância máxima → **Meteoro Distante** — alcance maior, dano cresce com a distância
  2. maioria à queima-roupa → **Eclosão Ígnea** — explosão centrada no caster, empurra inimigos
  3. maioria em alvos já queimando → **Fogo Voraz** — reacende e espalha a queimadura em área

#### Lança de Gelo (Int)
- **Tipo:** projétil perfurante (linha)
- **Elemento/tags:** gelo, lentidão
- **Custo / cooldown:** ✏️
- **Efeito base:** dano de gelo + slow por Xs ✏️
- **Perfis rastreados:** alvo já sob slow/congelado, alvos atingidos por cast (linha), distância do inimigo ao caster
- **Mutações:**
  1. maioria em alvos já lentos/congelados → **Estilhaço Profundo** — dano extra brutal em alvos sob gelo (shatter)
  2. maioria atravessando 2+ alvos → **Geada Perfurante** — perfura tudo na linha, slow maior por alvo atravessado
  3. maioria com inimigo adjacente (defensivo) → **Muralha de Inverno** — congela brevemente inimigos ao redor do caster

#### Apunhalar (Des)
- **Tipo:** melee posicional
- **Elemento/tags:** físico, posicional
- **Custo / cooldown:** ✏️
- **Efeito base:** golpe rápido; dano ~2× se atingir pelas costas ✏️
- **Perfis rastreados:** ângulo (costas/frente), HP do alvo no momento (abertura), alvo envenenado
- **Mutações:**
  1. maioria pelas costas → **Hemorragia** — abre ferida que sangra (DoT físico forte)
  2. maioria como abertura (alvo com HP cheio) → **Golpe Súbito** — dano enorme no primeiro golpe do combate
  3. maioria em alvos envenenados → **Lâmina Suja** — espalha e potencializa o veneno no alvo

#### Conjurar Flechas (estilo *exevo con*)
- **Tipo:** conjuração
- **Arquétipo:** utilidade / recurso
- **Requisito:** Des + lvl ✏️ (afinidade arqueiro)
- **Custo / cooldown:** **mana alta** / médio — o custo de mana é o "preço" da munição
- **Efeito base:** cria uma pilha de **flechas temporárias** (expiram em Xs ou ao deslogar ✏️). Função econômica: **alivia o sink de gold do arqueiro** sem zerá-lo (mana ≠ infinito; comprar flecha ainda vale quando se quer poupar mana). Não é dano — é logística.
- **Perfis rastreados:** flechas conjuradas vs compradas · % da munição gasta que veio de conjuração
- **Mutações:**
  1. uso quase total via conjuração (raramente compra) → **Aljava Infinita** — rende mais flechas por cast / custo de mana menor
  2. ✏️ maioria conjurada sob pressão (em combate, mana baixa) → **Flecha de Emergência** — conjura instantâneo um punhado, cooldown próprio

#### Luz Sagrada (Esp)
- **Tipo:** projétil/smite
- **Elemento/tags:** sagrado, anti-profano
- **Custo / cooldown:** ✏️
- **Efeito base:** dano holy; bônus forte vs mortos-vivos/demônios ✏️ (é o nuke solo do Priest)
- **Perfis rastreados:** família do alvo (profano ou não), distância, HP do caster
- **Mutações:**
  1. maioria vs mortos-vivos/demônios → **Chama Purificadora** — profanos mortos explodem em luz (dano em área)
  2. maioria à queima-roupa → **Nova Sagrada** — vira explosão de luz centrada no caster
  3. maioria com HP cheio → **Fervor** ✏️ — dano aumenta enquanto não tomar dano
- **Nota de conduta:** Luz Sagrada não conta como "arma" — compatível com o Caminho **Monge** (*Mão Vazia*).

#### Curar Ferimentos (Esp)
- **Tipo:** cura (self/alvo aliado)
- **Elemento/tags:** sagrado, cura
- **Custo / cooldown:** ✏️
- **Efeito base:** restaura HP ✏️
- **Perfis rastreados:** alvo (self vs aliado), HP do alvo no momento, em combate vs fora
- **Mutações:**
  1. maioria em aliados (online) → **Graça Compartilhada** — a cura salta para um segundo aliado próximo
  2. maioria em self com HP < 20% → **Último Suspiro** — cura muito mais forte quando quase morto
  3. maioria em combate → **Prece de Guerra** — curar emite pulso de dano sagrado em profanos adjacentes

### Roster T1/T2 — fichas completas no M3

> O índice completo (M1 + T1 + T2, com requisito de cada uma) vive na **Lista de skills por requisito** acima. As T1/T2 já listadas lá ganham ficha detalhada no M3.
>
> **Removidas (jun/2026):** *Passo das Sombras* (sobrepunha o Apunhalar — blink-pras-costas vs backstab eram a mesma jogada) e *Leque de Facas* (kit do Rogue já tinha dano demais; deu lugar a recurso/furtividade).

**Template para novas skills:**

```
### <Nome>
- Tipo: <projétil / área / wave (estilo Tibia) / buff / cura / melee / utilidade>
- Arquétipo: <dano / controle / defesa / sustain / mobilidade / utilidade-recurso>
- Elemento/tags: <fogo, gelo, sagrado… — alimentam Caminhos de estilo>
- Requisito: <universal | atributo + nível (For/Vit/Des/Int/Esp)> — nunca "de classe"
- Fonte: <NPC (espalhado) | drop de mob (tomo) | NPC+drop | quest> — placement concreto ✏️ na fatia
- Custo / cooldown: <>
- Efeito base: <>
- Perfis de uso rastreados: <distância, alvo queimando, HP do caster…>
- Mutações possíveis (2–4):
  1. <condição de perfil> → **<Nome>** — <efeito>
  2. ...
```

✏️ _tiers avançados (quests/bosses) preenchidos conforme M3_

---

## Implicações técnicas (resumo p/ implementação)

- **Tudo na sim.** Contadores, condições e desbloqueios em `src/sim/` (determinístico, serializável). Client só recebe eventos de hint/unlock via snapshot/evento no `protocol.ts`.
- **Itens são instâncias com ID + ledger**, não stacks de template. Definir cedo (M2 — inventário/equipamento) para não retrofitar.
- Contadores são **dados, não código**: condições de Marca/Mutação/Caminho descritas como definições (tipo de evento + filtro + threshold), avaliadas por um sistema genérico de tracking. Adicionar conteúdo novo = adicionar definição, não lógica.
- Eventos da sim que alimentam tudo: `kill` (quem, com quê, vítima, contexto), `skill_use` (skill, alvo, distância, estado), `damage`, `block`, `level_up`. Desenhar o combate (M1) já emitindo esses eventos.

## Aberto / a decidir ✏️

- [ ] **Slots de skill abertos** (decidir antes das fichas T1): **Knight 5º** (sustain ou cone frontal — Baluarte já proposto p/ defesa); **Mage 5º** (utilidade tipo blink/teleporte **ou** já abrir um 3º elemento como beam de raio); **Rogue 4º/5º** (Furtividade proposta; 5º = armadilha **ou** farejar/marcar alvo)
- [ ] **Fonte de cada skill** (qual é NPC / drop-only / NPC+drop / quest, e ONDE no mapa) — world-design, nas specs de fatia (`design/fatia-1-alvorada/` NPCS/ITENS-LOOTS)
- [ ] **Limite de uso do kit híbrido**: nº de slots na skill bar + custo de mana/cooldown como freio (Balancista) — garantir que "todo mundo aprende tudo se tiver atributo" não vire bag-of-everything. *(Freio conceitual já decidido: o **corpo automático** da classe — pool/regen de mana, HP — torna o híbrido naturalmente caro; resta calibrar a dose.)*
- [ ] Números reais de thresholds (calibrar com tempo médio de kill/uso quando o combate existir) — inclui thresholds dos níveis II/III de Marca
- [ ] **% de transferência do progresso pré-unlock** no trade/loot (faixa decidida 20–35%; valor fino = Balancista)
- [ ] **Alvo de calibração do Balancista = "horas entre uma coisa nova e a próxima"** (densidade de descoberta), não "horas brutas até lvl 25" — é o que separa difícil de maçante; conecta com a migração da curva cúbica→exponencial
- [ ] Quebrar conduta **antes** de adquirir: perde a chance para sempre (NetHack) ou só zera o progresso? (pós-aquisição já decidido: permanente)
- [x] **Mutação substitui** a skill original (decidido jun/2026): o gatilho é **perfil de uso sustentado** (não evento avulso), então não há mutação acidental — substituir é seguro e identitário.
- [ ] Rito de substituição/fusão de Marca em item com slots cheios?
- [ ] Multiplicador do **escalador comportamental** (ex: ×1.5) — conta **Caminhos E Mutações** juntos (eixo compartilhado/competitivo); a 1ª mutação fica fora. Calibrar com o Balancista
- [ ] Calibrar na sim: % exata da XP total perdida na morte (ref. 10%) e fator da curva (ref. ~2×/nível) — alvo 1→25 em ~30–45h eficientes; ⚠️ vigiar que morte no cap (~3–4h perdidas) fique em "dói muito" sem cruzar pra rage-quit; punições secundárias leves (gold? debuff?)
- [ ] Lista de eventos canônicos que evoluem Marcas (world bosses no M3+, PvP no M6+)
- [ ] Curva de XP / força dos mobs — números no M2
- [ ] Classless: números do crescimento genérico (Balancista); custo em gold do rito e conteúdo das 4 quests de rito (world-designer/Loremaster). *(Recalcula retroativo ao classar: **decidido** — corpo automático vira o da classe; só os números são ✏️.)*
- [ ] Calibrar `LUZ_SAGRADA.unholyMultiplier` na sim (placeholder ×2.5) — **decidido (jun/2026)**: multiplicador de skill vs família é **camada separada da matriz 10-20** (identidade de skill, estilo card do RO), mas calibrado: dano-base viável contra QUALQUER mob (é o nuke geral do Priest) + bônus vs profanos forte **sem trivializar** a família-coração (report `2026-06-04-balance-consolidacao-kit-itens.md`)

### Decididos recentemente (histórico)

- ✅ **Sem kit inicial — nenhuma skill é dada** (jun/2026): rito dá só a arma; aquisição **espalhada pelo mundo** (NPC / drop de mob / NPC+drop / quest raríssima). Skill vira loot/descoberta (pilares 1/3/4).
- ✅ **Tomo de skill = tradeable + guardável** (jun/2026): possuir/negociar sem gate; aprender (consome, permanente) exige atributo+nível; sem requisito, guarda até poder. Cria mercado de tomos.
- ✅ **Skills gateadas por requisito (atributo + nível), não por classe** (jun/2026, modelo PoE-gems) — anda com o custo-crescente. Gate de uso = cooldown (Apogea), mana secundária.
- ✅ **Nenhuma magia é exclusiva de classe (jun/2026):** caiu a "assinatura de classe" e o lock do sagrado — sagrado virou **Espírito + nível**. A classe é só afinidade; o Priest é melhor no sagrado porque seu corpo automático bomba Espírito.
- ✅ **Diferenciação de classe = camada automática/grátis (jun/2026):** corpo automático forte (`CLASS_GROWTH`) + atributos iniciais por classe + desconto de afinidade no stat principal (**Forma B = faixa de custo −1; Balancista 08/jun/2026**). O corpo automático é o **freio dos híbridos** (substitui o antigo lock-de-classe na magia). Ao classar, o corpo recalcula retroativo ao padrão da classe; pontos distribuídos ficam do jogador.
- ✅ Universais novas: **Cura** (*exura*, escala Esp) e **Luz** (exploração) — qualquer classe. Rogue ganhou **Conjurar Flechas** (mitiga gold do arqueiro); saíram *Passo das Sombras* e *Leque de Facas*.
- ✅ Custo de pontos crescente por faixa (RO-style); efeito do ponto constante
- ✅ Mitigação 100% de itens (defesa física + resist. mágica) — Espírito perdeu resist. mágica
- ✅ Crítico sem roll passivo — só efeito explícito (skills/Mutações/Caminhos), ×2 padrão ✏️
- ✅ Morte: pune pesado em XP, **nunca** perde itens/Marcas
- ✅ Permanência total: Marcas/Mutações/Caminhos não se perdem por nada (conduta pós-aquisição inclusa)
- ✅ Marcas de item: 1–3 níveis por repetição; evolução qualitativa só por evento canônico
- ✅ **Motor de progressão emergente — estrutura unificada (jun/2026):** UM motor (tracking) com 2 eixos ortogonais — **gear** (Marca de arma, auto-gateada por tier, independente, nunca compensa pular tier) × **comportamental** (Mutação + Caminho/título num escalador único e competitivo: magia dificulta título e vice-versa → traço único; soft, não pool gasto). Escada de 4 camadas: onramp → compromisso → prestígio → **Criação de Skill** (pós-lançamento). 1ª mutação = onramp grátis (fora do escalador), 2ª já começa difícil. Mutação = ganho pequeno + estilo, **100% comportamental** (tomo só na skill base — modelo R1). Transferência: Marca destravada viaja inteira, progresso pré-unlock só **20–35%**.
