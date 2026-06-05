# Esfolar & Mecânica da Fome — PROPOSTA

**Data:** 2026-06-05 · **Designer de Sistemas** (guardião da filosofia) · fatia ① Alvorada.

> Fecha as duas pendências ✏️ abertas em `design/fatia-1-alvorada/ITENS-LOOTS.md` §Aberto:
> - *"Esfolar com faca: rende loot EXTRA ou é requisito pra pele dropar?"*
> - *"Mecânica da fome: decai com tempo/ação? penalidade = só sem-regen ou debuff?"*
>
> **REGRA DO MÉTODO:** decisões viscerais são do criador. Este report **propõe 2–3 opções por decisão**, com recomendação argumentada e leitura explícita da constituição — **não crava nada**. Cada bloco termina em ✏️.
>
> **Não proponho números finais** (são do Balancista, na sim). Aqui vão estruturas, ordens de grandeza e o que precisa de simulação antes de cravar.

---

## O que JÁ está decidido (não rediscutir — construir por cima)

Levantado de `DESIGN-ITENS.md` §Comida & Cozinha, `DESIGN-MUNDO.md` §Ferramentas, `ITENS-LOOTS.md`, `QUESTS.md` Q6/Q7 e do report `2026-06-04-bateria-m1-knight-rato.md`:

| Decidido | Fonte | Consequência pra este report |
|---|---|---|
| **Fome é o portão do regen**: regen natural de HP/mana **só funciona saciado** | DESIGN-ITENS §Comida (decidido) | A *espinha* da mecânica de fome JÁ é canon: regen-gate. A pendência não é "qual modelo", é **como a barra decai e o que a penalidade de faminto adiciona além do regen desligado**. |
| Comida comum barata (pão, assado) **mantém o regen ligado**; cozida = **buff food** (regen melhor + stat temporário por duração) | DESIGN-ITENS §Comida | Dois andares: saciador (liga o regen) × buff food (acelera/melhora). |
| Cru × cozido: cru **sacia menos, sem risco** (zero efeito ruim) | DESIGN-ITENS (decidido) | A pressão da fome **não** pode vir de "comida estragada/intoxicação". |
| Fogueiras **fixas**, nunca montáveis; cozinhar exige planejamento | DESIGN-ITENS (decidido) | A fome pressiona *porque o jogador está longe da cozinha* — é tensão de logística, não de inventário. |
| Hierarquia do sustain: **regen base (saciado) → kit de classe → buff food → poção (emergência cara)** | DESIGN-ITENS §Comida | Fome e esfolar não podem inverter essa ordem (ex.: comida virar a emergência, ou poção virar rotina). |
| Sem treadmill / imposto de manutenção (pilar 7) | DESIGN-FILOSOFIA | Fome **não** pode ser um relógio que pune AFK ou cobra "imposto" — o teste mais perigoso deste report. |
| Faca de Esfolar = recompensa da **Q7** (ato 2, pós Presa-Torta) + **destrava o trade de peles** com o Amaro | QUESTS.md Q7 / ITENS-LOOTS | A faca **já** tem um trade atrelado. A pergunta de esfolar é: a faca *gera* a pele ou só a *aumenta*? |
| Ferramenta é **chave de acesso, nunca tesouro**; kit é decisão de mochila | DESIGN-MUNDO §Ferramentas | A faca não pode virar "tesouro" obrigatório; mas *pode* ser chave de acesso a um trade — esse é o precedente da Corda/Pá. |
| Esfolar (verbo): "carcaças → peles/carnes **EXTRA**" | DESIGN-MUNDO §Ferramentas (tabela) | ⚠️ O texto-tabela de MUNDO já sussurra "EXTRA" (= Opção A). Mas é o `✏️` mais frágil — a tabela diz "aprofunda a caçada ✏️", logo **está aberto**. Levo isso em conta na recomendação. |
| Bateria M1: **sem comida o jogador descansa 85–91% do tempo** | report M1, leitura 1 | A comida é **o knob que compra uptime**. Toda a economia de fome existe pra transformar "tempo parado" em "gold gasto" — comida é o **dreno** que faz a caça valer a pena ter renda. |
| Regen em `formulas.ts`: `base/tick + atributo×fator` (Vit → HP, Espírito → mana); tudo `✏️ placeholder M2` | src/sim/formulas.ts | Não há gate de fome implementado ainda. A fome é uma **multiplicação/desligamento** por cima dessas funções — fácil de plugar sem reescrever fórmula. |

**Conclusão de ancoragem:** a mecânica de fome serve aos pilares **2 (punitivo, nunca injusto — descer sem comida custa uptime, e isso é culpa sua)** e **7 (sem treadmill — e é exatamente o pilar que ela mais ameaça violar; metade deste report é defendê-lo)**. Esfolar serve aos pilares **3/4 (recompensa por preparo; o trade de peles é renda de quem sabe)** e **2 (kit é decisão de mochila)**.

---

# (a) ESFOLAR — a Faca de Esfolar dá o quê?

### O problema em uma frase
O Lobo e o Javali já dropam **Pele de Lobo / Couro Grosso / Presa de Javali** na loot table (`ITENS-LOOTS.md`). A faca é recompensa tardia (Q7 fecha ~lvl 9). Se a pele **só** vem com faca, todo o trade de peles fica **gated atrás de uma quest de lvl 9** — incluindo a própria prova "traga 3 Peles de Lobo" do **Ato 1 da Q7** (lvl ~4–6), que pede peles *antes* de o jogador ter a faca. Isso é um nó de design que a escolha precisa desatar.

> **Restrição dura detectada (não é opção, é fato):** o Ato 1 da Q7 exige 3 Peles de Lobo no lvl 4–6, e a faca só vem no Ato 2 (lvl ~9). Logo **a pele de lobo TEM de cair sem faca** — senão a quest que dá a faca exige a faca pra ser feita (deadlock). Qualquer opção precisa respeitar isso. Isso já **inclina** contra a Opção B pura.

## Opção A — Loot EXTRA (a faca adiciona, nunca gateia)

A carcaça dropa a loot table normal (pele/couro/presa/carne nas taxas de sempre). **Esfolar com a faca adiciona um drop a mais** — uma pele de qualidade melhor, uma porção extra de carne, ou um material que só sai esfolando (ex.: *Couro Curtido* vs *Pele Crua*).

- **Economia:** o trade do Amaro continua acessível desde cedo (peles caem sem faca); a faca **engrossa a margem** de quem caça pra vender. Casa com a régua "vender certo > vender rápido" (ITENS-LOOTS) — a faca é *outro* multiplicador de renda, no mesmo eixo do comprador especializado.
- **Kit de mochila:** a faca compete por slot como verbo opcional ("levo a faca pra esta caçada de peles?"). É decisão, não obrigação. ✓ DESIGN-MUNDO.
- **Cozinha:** carne extra → mais ingrediente → mais comida → mais uptime. Liga esfolar↔fome num loop saudável.
- **Mastigação:** passa limpo — não esconde caminho, não perdoa descuido, não cria espera.
- **Risco de degeneração:** baixo. O pior caso é "esfolar é sempre ótimo, então sempre carrego a faca" — mas como a faca ocupa slot e a carcaça precisa de tempo de interação (parar pra esfolar = vulnerável no mundo), há custo de oportunidade real.

## Opção B — REQUISITO (sem faca, pele não cai)

A carcaça **não** dropa pele/couro/presa por conta própria; **só esfolando** com a faca. Sem faca, o jogador deixa material valioso na carcaça. A faca vira a **chave de acesso ao trade inteiro de peles**.

- **Economia:** o trade de peles fica **gated pela Q7** — renda potente que só o caçador dedicado destrava. Recompensa proporcional à opacidade (pilar 3): combina com "compradores destravados por quest".
- **Kit de mochila:** vira "se vou caçar besta pra vender, **tenho** de levar a faca" — gate mais duro, menos decisão.
- **Mastigação:** passa, MAS toca o anti-padrão "perda por obscuridade de controle" se o jogador não entender *por que* a carcaça não dropou nada. Precisa de **telegrafia**: a carcaça mostra um estado "não-esfolada" (✏️ Diretor de Arte) e/ou um NPC/livro ensina "besta morta sem faca não rende couro".
- **Risco de degeneração:** baixo, mas **cria o deadlock da Q7-Ato1** acima. Para salvar B, seria preciso ou (i) a Q7-Ato1 *não* pedir pele (reescrever a quest — fora do escopo, e a quest já está batizada), ou (ii) abrir uma exceção "lobo dropa pele, javali não" (vira regra inconsistente, fere a clareza de contrato).
- **Veredito parcial:** B **pura colide com conteúdo já decidido**. Não recomendada como está.

## Opção C — Híbrido (a faca melhora qualidade/taxa; material premium é gated)

A carcaça dropa um **material comum** sem faca, em taxa baixa (ex.: *Pele Rasgada* / *Couro Furado* — vendável, preço pior, "estragou na pressa"). **Esfolar com a faca** rende o material **íntegro** (*Pele de Lobo* / *Couro Grosso*), em taxa maior e qualidade que o Amaro paga cheio. Materiais **premium** (Presa Perfeita, Couro Grosso de primeira) **só** vêm esfolando.

- **Economia:** três faixas naturais de renda — (1) quem não tem faca vende refugo barato; (2) quem tem faca vende íntegro; (3) o premium é exclusivo da faca. Mapeia direto na régua "~2–3× no comprador certo" (ITENS-LOOTS) e ainda dá ao Amaro **dois preços** (refugo × íntegro) — textura de comércio rica.
- **Q7-Ato1 resolvido:** o lobo dropa **Pele Rasgada** sem faca; a quest pede **Pele de Lobo** (íntegra). Aqui há uma sub-decisão (ver ✏️ abaixo): ou a quest aceita a rasgada (caça mais), ou o jogador *encontra/compra* a íntegra. **Recomendo que o Ato 1 aceite a Pele Rasgada** — o ato é "prova de caçador", e o caçador novato *entrega o que conseguiu*; o Amaro então dá a faca pra ele "parar de estragar as peles". É um beat narrativo limpo: a faca é a **resposta** à prova, não um pré-requisito dela. (✏️ Loremaster afina a fala.)
- **Kit de mochila:** decisão preservada (levo a faca → vendo íntegro/premium; não levo → vendo refugo) — o melhor dos dois mundos do pilar de mochila.
- **Cozinha:** mesma carne; esfolar pode render **porção extra** de carne além do material — incentivo cruzado a esfolar mesmo quando se caça pra comer.
- **Mastigação:** passa. A telegrafia é honesta (o refugo *existe* e tem nome próprio — o jogador entende que há um jeito melhor). Não esconde caminho; o "jeito melhor" é descoberta legítima (pilar 1/4).
- **Risco de degeneração:** baixo. Único cuidado: o premium-only-com-faca não pode ser *requisito* de progressão (ex.: gear T2 que só existe de Couro Grosso). Como couro é trade/comida, não gear-gate, está coberto.

### Comparação

| Critério | A — Extra | B — Requisito | C — Híbrido |
|---|---|---|---|
| Trade de peles acessível cedo | ✓ (sempre) | ✗ (gated lvl 9) | ✓ (refugo cedo, íntegro c/ faca) |
| Resolve deadlock Q7-Ato1 | ✓ (trivial) | ✗ (colide) | ✓ (Ato1 aceita refugo) |
| Faca = chave de acesso (DESIGN-MUNDO) | parcial (só engrossa) | total | **forte** (acesso ao íntegro/premium) |
| Kit = decisão de mochila | ✓ | gate, menos decisão | ✓✓ |
| Recompensa ∝ opacidade (pilar 3) | fraca | forte | **forte e graduada** |
| Telegrafia necessária | nenhuma | alta (estado da carcaça) | média (o refugo se explica sozinho) |
| Risco de degeneração | baixo | baixo + deadlock | baixo |
| Coincide com texto já escrito | "EXTRA" em DESIGN-MUNDO | contraria DESIGN-MUNDO | estende "EXTRA" com gradação |

### Recomendação (a)
**Opção C — Híbrido.** Entrega o melhor de A (acesso cedo, sem deadlock, casa com o "EXTRA" já escrito) e de B (a faca é **chave de acesso real** ao material que vale, honrando "ferramenta = chave de acesso, recompensa ∝ opacidade"). Cria duas faixas de preço no Amaro — comércio com textura, sem mastigar. A telegrafia mora no próprio item ("Pele Rasgada" se explica). Se o criador quiser o caminho mais simples de implementar, **A** é o fallback seguro e já está alinhado ao texto de DESIGN-MUNDO; **B pura está descartada** por colidir com a Q7 já batizada.

**Sub-decisão dentro de C** (o Ato 1 da Q7 aceita Pele Rasgada, ou exige a íntegra forçando outra fonte?): recomendo **aceitar a rasgada** — beat narrativo da faca como recompensa, não pré-requisito.

> **✏️ decisão do criador:** A (extra puro) · B (requisito — *desaconselhada, colide com Q7*) · **C (híbrido — recomendada)**. E, se C: o Ato 1 da Q7 aceita o material refugo?

---

# (b) MECÂNICA DA FOME — como a comida pressiona sem virar chore

### O espaço de design (mapa)

A espinha **já é canon**: *regen só funciona saciado* (DESIGN-ITENS). Logo as três famílias clássicas se reduzem assim:

| Família | O que é | Status vs canon |
|---|---|---|
| **Fome-recurso punitiva** | barra que esvazia e, vazia, **causa dano / debuffa stats** ativamente | ❌ Parcialmente proibida: punição ativa por fome = relógio de manutenção = **risco de violar pilar 7**. Avaliada com lupa abaixo. |
| **Comida-como-regen (Tibia)** | comer **liga/acelera** o regen; vazio = regen desligado, sem outra punição | ✓ **É exatamente o canon decidido.** A pergunta é só *como a barra decai*. |
| **Buff-food puro (Apogea)** | comida = só buffs temporários, zero punição, regen sempre ligado | ❌ Contraria o canon ("regen só saciado") — a comida deixaria de ser *fundação do sustain* e viraria luxo opcional. Descartada como **modelo base**; sobrevive como a **camada de cima** (buff food já decidida). |

Ou seja: o jogo **já escolheu** comida-como-regen com um andar de buff-food por cima. As opções abaixo **não** são "qual família" — são **como a saciedade decai e o que, se algo, a fome adiciona além de desligar o regen.** É aí que mora o `✏️`.

### Eixo 1 — Como a saciedade decai

| Modelo | Descrição | Leitura |
|---|---|---|
| **Por tempo (relógio real)** | a barra cai X/min jogado, esteja você lutando ou parado | ⚠️ é o que mais cheira a treadmill: pune *existir*, inclusive AFK. Pilar 7 acende o alerta. |
| **Por ação/esforço** | drena ao **gastar recurso** — ao regenerar HP/mana e ao usar skills (o esforço dá fome) | ✓ casa com a intuição ("lutei muito, deu fome"), **não pune AFK** (parado sem regenerar ≈ não dá fome), e amarra o dreno ao *uptime* — que é exatamente o que a comida compra (report M1). |
| **Híbrido (base lenta + esforço)** | um decay-base lentíssimo (anti-AFK-eterno) + o grosso vindo do esforço | ✓ compromisso; o base só existe pra você não viver de um pão por dia, mas é pequeno demais pra ser imposto. |

### Eixo 2 — A penalidade de "faminto" (o coração da pendência)

| Penalidade | O que faz vazio | Mastigação / pilar 7 |
|---|---|---|
| **Só desliga o regen** | sem saciedade, regen de HP/mana = 0. Nada mais. | ✓ **Limpíssimo.** A punição é "você não cura" — orgânica, legível, e *já é a régua do report M1* (sem regen você não tem uptime). Não pune AFK (parado e ferido você só… não cura, o que já basta). |
| **Desliga regen + debuff suave** | + um debuff pequeno (ex.: −velocidade, ou −1 num stat) enquanto faminto | ⚠️ começa a virar "estado ruim ativo". Defensável SE legível e SE a comida pra sair dele for trivial de obter — mas adiciona um relógio. |
| **Dano por inanição** | faminto perde HP ao longo do tempo | ❌ **Vetado por mim.** É o relógio de manutenção clássico (pilar 7) + pune AFK + a morte por fome "não ensina nada na segunda vez" (anti-padrão FILOSOFIA). Descartado. |

## As 3 opções coerentes

### Opção 1 — "Regen-gate puro" (esforço-drena + só-desliga-regen)
A saciedade **só drena ao gastar recurso** (regenerar/usar skill). Vazio = **regen desligado e nada mais**. Comida comum religa; buff food acelera (camada já decidida).

- **Loop minuto-a-minuto:** caço → tomo dano/gasto mana → barra de saciedade cai → quando esvazia, paro de curar → como pão/assado → volto a curar. Longe da fogueira e sem comida na mochila? **A caçada acabou** — volto. É a tensão de logística que o jogo quer.
- **Dreno econômico:** comida = sink de gold/caça que **compra uptime**. Quem caça pão é eficiente; quem esquece comida desperdiça a sessão. Faucet (gold/loot da caça) ↔ drain (comida). O report M1 mostra 85–91% parado *sem* comida — comida é o que torna o tempo-parado *produtivo* (curar saciado é muito mais rápido). ✓ exatamente o knob desenhado.
- **Interação com `formulas.ts`:** trivial — `hpRegenPerTick/manaRegenPerTick` multiplicados por `0` quando faminto, `1` quando saciado, `>1` sob buff food. Um único gate booleano. Nada na fórmula muda.
- **Risco de chore:** **mínimo.** Não pune AFK, não cobra imposto, a punição é "você não cura" (orgânica). Passa o Teste da Mastigação inteiro.
- **Bateria M2:** a comida vira **parâmetro de primeira classe** — quanto cada alimento sacia, taxa de dreno por ponto de regen/skill, regen-saciado vs regen-faminto (=0). É o eixo que recalibra XP/h (leitura 1 do M1).

### Opção 2 — "Regen-gate + buff como cenoura" (esforço-drena + desliga-regen + buff food forte)
Igual à 1 na punição (só desliga regen), mas **inclina o peso pro lado positivo**: a comida comum é barata e onipresente (quase nunca falta), e a **decisão real** é "vale o custo-por-minuto do buff food antes da caçada?". A pressão da fome é leve; a profundidade está em *otimizar buffs*, não em *evitar inanição*.

- **Loop:** raramente fico faminto (pão é barato); a tensão é "trago Ensopado pra esta caçada de javali?" — custo-por-minuto. Mais Apogea, menos Tibia.
- **Dreno econômico:** o sink principal é o **buff food** (cozido, gold + ingredientes + conhecimento), não o pão. Renda não-combate (caçar→cozinhar→vender) ganha mais peso.
- **Risco de chore:** o **menor de todos** — a fome quase não morde. Risco oposto: a fome vira *decorativa* e o "regen só saciado" perde dente (se pão nunca falta, o gate nunca fecha). Precisa do Balancista pra que pão custe/pese o bastante pra a logística importar na dungeon longa.
- **Bateria M2:** foco em calibrar o **custo-por-minuto do buff food** vs ganho de uptime/poder; a saciedade-base fica folgada.

### Opção 3 — "Regen-gate + debuff de faminto" (esforço-drena + desliga-regen + debuff suave)
Como a 1, mas faminto **também** aplica um debuff legível e pequeno (proposta: **−movimento** — "fraco de fome", telegrafável e justo; *não* −dano, que puniria silenciosamente o combate). Endurece a punição sem matar ninguém por fome.

- **Loop:** ficar faminto não é só "não curo" — é "ando mais devagar e fujo pior". Sobe o custo de descer despreparado (pilar 2).
- **Dreno econômico:** igual à 1, com pressão um pouco maior pra repor.
- **Risco de chore:** **moderado.** O debuff é um relógio leve. Defensável *só* se: (a) sair do faminto é trivial (um pão resolve na hora), (b) o debuff é legível ANTES (ícone/estado claro) e didático DEPOIS ("foi fome, minha culpa"), (c) nunca dano. Fica na linha do pilar 7 — não a cruza, mas chega perto.
- **Bateria M2:** + calibrar a magnitude do debuff (quanto de −movimento ainda é "justo, não roubo").

### Comparação

| Critério | 1 — Gate puro | 2 — Buff cenoura | 3 — Gate + debuff |
|---|---|---|---|
| Fidelidade ao canon ("regen só saciado") | ✓✓ | ✓ (gate frouxo) | ✓✓ |
| Pune AFK / treadmill (pilar 7) | não | não | leve (debuff) |
| Pressão da logística de dungeon | média | baixa | **alta** |
| Profundidade de decisão | logística + buff | **otimizar buff** | logística + buff + estado |
| Risco de chore/mastigação | mínimo | mínimo (mas pode ficar decorativa) | moderado |
| Telegrafia exigida | baixa | baixa | **média** (estado faminto legível) |
| Complexidade de implementação | menor | menor | +1 debuff |

### Recomendação (b)
**Opção 1 — Regen-gate puro (esforço-drena + só-desliga-regen)**, com a porta aberta pra evoluir à **2** se nos playtests a fome morder *de menos*. Razões:

1. **É o canon literal**, sem adicionar relógio. "Regen só saciado" + "drena com esforço" + "vazio = não cura" é a tradução mais limpa e mais fiel do que já foi decidido.
2. **Passa o Teste da Mastigação inteiro** sem exceção consciente: nenhuma seta, nenhum contador-de-oculto, nenhuma espera disfarçada, nenhum AFK punido. A punição ("você não cura") é orgânica e já é a régua do report M1.
3. **É o knob que o M1 pediu**: transforma os 85–91% de tempo parado em *gold gasto comprando uptime* — comida como dreno econômico, exatamente o desenho.
4. **Drena com esforço, não com tempo**, evitando o anti-padrão nº 6 ("espera disfarçada de dificuldade"). Parado e ferido sem comida você simplesmente não cura — o que já é punição suficiente, sem cronômetro.

A **Opção 3** é o plano-B se o criador quiser que "descer faminto" doa mais que perder uptime — mas só com as três salvaguardas (trivial sair, sempre legível, nunca dano). A **Opção 2** é o plano-B se a fome ficar irrelevante — é só afrouxar a 1, não troca de modelo.

> **✏️ decisão do criador:** **1 (gate puro — recomendada)** · 2 (buff-cenoura) · 3 (gate + debuff de faminto). E os eixos: **decay por esforço** (recomendado) vs tempo vs híbrido; penalidade **só-desliga-regen** (recomendada) vs +debuff. **Dano por inanição: vetado** (pilar 7).

---

## O que precisa de SIMULAÇÃO antes de cravar números (Balancista, bateria M2)

Nenhum número final aqui. Pendências de calibração:

1. **Tamanho da barra de saciedade** e **taxa de dreno por ponto de regen/skill gasto** — alvo: uma sessão de caça T1 realista (report M1: ~30+ min) consome *N* pães; o pão precisa custar/pesar o bastante pra a logística importar na dungeon longa, sem virar imposto. Ordem de grandeza: "comida é arroz-com-feijão sempre na mochila" (barata, mas o esquecimento dói).
2. **Regen saciado vs faminto** — saciado = `formulas.ts` atual; faminto = 0. Medir o novo XP/h *com* comida ligada (leitura 1 do M1: os números atuais são piso).
3. **Custo-por-minuto do buff food** (Ensopado da Q6) — ganho de uptime/poder vs gold+ingredientes+conhecimento, garantindo a hierarquia *base → kit → buff food → poção* (nunca inverter).
4. **Esfolar (se C):** taxa do refugo sem faca vs íntegro com faca; preço do Amaro pra cada faixa (régua "~2–3× no comprador certo"); porção de carne extra por esfola.
5. **(Se Opção 3)** magnitude do debuff de faminto que ainda é "justo, não roubo".
6. **Anti-degeneração a vigiar (Sirlin):** o all-in-STR do M1 (leitura 2) some com o gate de comida? Cuidar pra que comida abundante + buff food não recriem o "descanso 36%" que o report flagou — o custo da comida tem de *segurar* o uptime, não liberá-lo de graça.

---

## Auto-verificação contra a constituição

- **Pilar 1 (descoberta):** nada aqui ganha contador/seta de algo oculto. A barra de saciedade é da **camada sólida** (recurso claro por contrato, como HP/mana) — barra visível é permitida (mesma exceção da barra de XP). ✓
- **Pilar 2 (punitivo, nunca injusto):** descer sem comida/faca custa uptime/renda — legível, telegrafável, "culpa minha". ✓
- **Pilar 3 (recompensa ∝ opacidade):** esfolar C grada a renda pela faca (preparo); buff food paga o conhecimento descoberto. ✓
- **Pilar 4 (informação é loot):** receitas/compradores/o "jeito melhor de esfolar" vêm do mundo (NPC, item nomeado), não da UI. ✓
- **Pilar 7 (sem treadmill):** **o pilar em risco.** Recomendações escolhidas (esfolar C; fome decay-por-esforço + só-desliga-regen) **não** criam imposto, **não** punem AFK, **não** dão dano por inanição. As opções que violariam (dano por inanição; decay puro por tempo) estão **explicitamente vetadas/desaconselhadas** acima, com o motivo. ✓
- **Nenhuma opção recomendada viola pilar.** As descartadas e por quê: **B-pura** (esfolar — colide com deadlock da Q7-Ato1, não fere pilar mas fere conteúdo decidido); **fome-recurso com dano por inanição** (fere pilar 7 + anti-padrão "punição que não ensina"); **buff-food puro como modelo base** (contraria o canon "regen só saciado").

---

*Próximo passo após o ✏️ do criador: registrar as decisões fechadas em `ITENS-LOOTS.md` §Aberto e `DESIGN-ITENS.md` §Comida (linha "✏️ Fome"), e abrir a bateria M2 com o Balancista (parâmetros §acima).*
