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
| Mutações | Nomeadas e qualitativas (não ranks); o **perfil de uso** decide qual mutação nasce — **atribuição = contador absoluto por perfil (decidido jun/2026)**: cada perfil tem meta própria, só casts que casam o perfil contam pra ela, casts fora de perfil não contam nada, **1º perfil a cruzar resolve** (a substituição da skill fecha a corrida — não é timing-trap); generalista que não concentra **nunca muta**. 2–4 por skill, autorais. **Ganho pequeno + condicionador de estilo, nunca power spike.** **100% comportamental** (por uso) — tomo/drop/quest gateiam só a skill *base* (modelo R1, jun/2026). **1ª = onramp grátis** (fora do escalador); **da 2ª em diante já começa bem difícil.** Substitui a original (decidido) |
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

- **Requisito de aprendizado:** atributo + nível mínimo (ver `DESIGN-SKILLS.md` §1 *Modelo de gating*) — define quem PODE aprender. A **fonte** define ONDE se aprende. Não há "skill básica grátis": toda skill custou exploração, gold, um drop ou uma quest.
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
  - ✅ Implementação (2026-06-11): migrada da cúbica para **lei de potência** `total(n)=175·(n−1)^2.5` (`formulas.ts`). Achado: "exponencial pura" (geométrica ~2×) **explode num cap-25** (r=1,2 já joga 17% do jogo no último nível) — o split-alvo pede expoente ~2,5, mais suave que a cúbica. **SCALE re-pinado pela bateria de farm-loop** (XP/h MEDIDO na sim, rotação saciada: ~8,9k early / ~12,3k mid): **1→25 em ~35h eficientes** (split 2,5/8,6/10,1/13,7h; últimos 5 = 39%). Reports: `2026-06-11-curva-xp-exponencial.md` + `2026-06-11-bateria-farm-loop.md`. ⚠️ late (15→25) ainda extrapolado (re-ancorar com T2/T3). ⚠️ "exponencial ~2×" abaixo é a forma errada — ✏️ criador reescrever p/ "lei de potência".
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

| Perfil de uso (meta própria por perfil) | Mutação | Efeito |
|---|---|---|
| N casts à distância máxima (≥4 tiles) | **Meteoro Distante** | alcance maior, dano cresce com a distância |
| N casts à queima-roupa (≤2 tiles) | **Eclosão Ígnea** | explosão centrada no caster, empurra inimigos |
| N casts em alvos já queimando | **Fogo Voraz** | reacende e espalha queimadura em área |

- **Atribuição = contador absoluto por perfil (decidido jun/2026).** Cada perfil tem **meta própria** (N casts que casam o filtro dele); só casts do perfil contam pra ela; **casts fora de qualquer perfil não contam nada**. O **1º perfil a cruzar a meta resolve** a skill. Como a mutação **substitui** a skill base, completar um perfil **encerra** a Bola de Fogo base — você não consegue mais acumular os outros perfis, então só um vence: aquele em que você se especializou primeiro. **Não é timing-trap** (o estado-final reflete seu histórico real, sem custo arbitrário — distinto do classless). Generalista que espalha o uso e nunca concentra N em perfil algum **nunca muta** (mutação é prêmio de commitment, não de volume).
- **Perfis mutuamente exclusivos (regra de autoria).** Filtros não devem se sobrepor; o espaço entre eles (ex.: distância 3) é **zona morta** (casts ali não contam) — ou se cobre o espaço todo (`≥3` vs `≤3`), ou a zona morta é intencional. Se dois perfis casarem o mesmo cast, **desempate = ordem de definição** (determinístico).
- **Hint por perfil (não genérico).** Cada perfil tem seu próprio hint atmosférico aos ~50% da meta dele — e ele **telegrafa pra onde você está indo** (max-dist: *"o fogo anseia pelo horizonte"*; queima-roupa: *"as chamas latejam perto da pele"*). ✏️ Loremaster.
- **Threshold por-perfil ≫ threshold total.** N casts *de um perfil específico* é muito mais jogo que N casts no total — Balancista recalibra os números reais por perfil (provavelmente menores que seriam num modelo de share). ✏️
- Cada skill tem **2–4 mutações possíveis** desenhadas à mão (✏️ por skill). Procedural não — nome e efeito são autorais.
- **Mutação substitui** a skill original (decidido jun/2026): o gatilho é um **perfil de uso sustentado** (não um evento avulso), então você **nunca muta por acidente** — substituir é seguro, permanente e identitário.
- ✅ **Migração feita (jun/2026):** `src/sim/tracking/engine.ts` (`advanceMutations`) agora usa **contador absoluto por perfil** (sem `minShare`/denominador): cada perfil tem `threshold` próprio, o 1º a cruzar resolve (ordem de definição desempata). Verificado em smoke headless. Spec da expansão de sensores: `docs/reports/2026-06-11-spec-sensores-tracking.md`.

## 3. Caminhos do Personagem

Padrões de comportamento do **personagem inteiro**. Dois sabores:

**a) Condutas (restrição mantida):**

| Condição | Caminho | Efeito |
|---|---|---|
| Lvl 20 usando uma única magia ofensiva | **Devoto do Único Verbo** | a magia ganha mutação exclusiva impossível de obter por uso |
| Lvl 30 sem nunca equipar armadura | **Pele de Ferro** | defesa base escala com nível |
| Lvl ~20 sem nunca equipar **arma primária** (luva/off-hand liberados; só punhos/magia) | **Mão Vazia** | dano desarmado real + skills desarmadas |

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
  4. *Intocado* — ✏️ **EM REVISÃO (Lote 1, jun/2026):** o efeito antigo "mana regen em combate" é **base hoje** (não é prêmio); a condição "sem nunca causar dano físico" é impraticável (auto-attack inicial). Nova direção em estudo: efeito = **mana ao matar com magia** ("a magia se alimenta"); condição = **vencer N combates 100% mágicos**. Ver `docs/reports/2026-06-11-catalogo-emergente-lote1-engine.md` §6 ⑥.

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
  1. **Monge** (*Mão Vazia*) — lvl ~20 sem nunca equipar **arma primária** (main-hand; **luva e off-hands liberados** — luta de punho/luva), matando desarmado → dano desarmado real escala com nível + destrava skills marciais. **A "5ª classe" do jogo, que ninguém escolhe.** *(Ajustado de lvl 25/“qualquer arma” para lvl ~20/“só arma primária” — criador, jun/2026, revisão Lote 1.)*
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

## Magias e Skills → ver `DESIGN-SKILLS.md`

O sistema de skills foi extraído para um hub próprio (spin-out jun/2026, padrão hub+sub-docs):

- **`DESIGN-SKILLS.md`** (hub) — gating por atributo+nível, os três eixos (dano=gear+stats / novidade=skills / XP-hora), a regra anti-treadmill (puro Koster: só verbos novos), o espinho de 5 bandas, a assimetria de contagem e a regra de AoE.
- **`design/skills/CATALOGO.md`** (sub-doc) — índice mestre das ~35 skills + fichas detalhadas.

**Recap das decisões-mãe que ficam aqui** (camada sólida/emergente): a **aquisição** de skills (sem árvore de pontos, nada dado — ver §"Aquisição de Skills" acima) e as **Mutações** (único upgrade, 100% por uso — ver §"Mutações de Skill"). Toda skill nasce como dado declarativo em `src/sim/skills/`.

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
- [~] **Curva de XP migrada + SCALE pinado** (2026-06-11, lei de potência `175·(n−1)^2.5`, re-pinada pela bateria de farm-loop: ~35h eficientes) — fecha o "fator da curva". FALTA: (a) re-ancorar o XP/h **late (15→25)** com mobs T2/T3 (hoje extrapolado). **`DEATH_XP_PENALTY` = 10% DECIDIDO** (criador, 2026-06-11): fica em 10% até segunda ordem; com a nova curva custa 39%→99% do nível (no cap ≈ 3,1h). **Se virar rage-quit, fallback = TETO de horas** (cap absoluto da perda no late), não baixar o %. Punições secundárias leves (gold? debuff?) ✏️
- [x] **Kite/mana — NÃO nerfar a wand (criador, 2026-06-11):** ranged-kite mede ~1,9× o farm do melee no L8, mas é artefato de mob fraco — auto-corrige no high-tier (wand dano FIXO + custo de wand sobe com tier + AD auto escala → caster vira mana-bound naturalmente; melee segura). Resíduo (kite = 0 HP-downtime) fecha com **cast-time** nas skills de poder. Re-verificar farm-loop/kite quando T3+ existir. Report: `docs/reports/2026-06-11-bateria-farm-loop.md`
- [ ] Lista de eventos canônicos que evoluem Marcas (world bosses no M3+, PvP no M6+)
- [ ] Curva de XP / força dos mobs — números no M2
- [ ] Classless: números do crescimento genérico (Balancista); custo em gold do rito e conteúdo das 4 quests de rito (world-designer/Loremaster). *(Recalcula retroativo ao classar: **decidido** — corpo automático vira o da classe; só os números são ✏️.)*
- [ ] Calibrar `LUZ_SAGRADA.unholyMultiplier` na sim (placeholder ×2.5) — **decidido (jun/2026)**: multiplicador de skill vs família é **camada separada da matriz 10-20** (identidade de skill, estilo card do RO), mas calibrado: dano-base viável contra QUALQUER mob (é o nuke geral do Priest) + bônus vs profanos forte **sem trivializar** a família-coração (report `2026-06-04-balance-consolidacao-kit-itens.md`)

### Decididos recentemente (histórico)

- ✅ **Atribuição de mutação = contador absoluto por perfil** (jun/2026): cada perfil tem meta própria (N casts que casam o filtro); casts fora de perfil não contam; 1º perfil a cruzar resolve (a substituição da skill fecha a corrida — não é timing-trap); generalista nunca muta. Substitui o modelo *share* que o `engine.ts` implementa hoje (handoff de código ✏️). Sessão de design jun/2026.
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
