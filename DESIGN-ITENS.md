# Itens & Equipamento

> Documento vivo. Seções ✏️ são preenchidas pelo criador. Este é o doc do M2 — itens são **instâncias com ledger** desde o dia 1 (decisão anti-retrofit de `DESIGN-EVOLUCAO.md`), e as raridades já nasceram alinhadas aos slots de Marca em `DESIGN-MUNDO.md`.

## Mapa de decisões

| Tema | Decisão |
|---|---|
| Slots de equipamento | **11 slots, modelo Tibia**: capacete, armadura, calça, botas, 2 mãos, colar, 2 anéis, mochila, utilitário |
| Mãos | Arma de **2 mãos ocupa os dois slots** (estilo Tibia). **Dual wield existe, restrito ao Rogue** |
| Luvas/soqueiras | Item de mão **não-arma**, com stats, usável por **qualquer classe** — equipar/lutar com luvas **não quebra** a conduta *Mão Vazia* (kills com luvas contam como desarmado p/ o Monge). **1 slot cada**: 1 luva + arma/escudo/livro, ou 2 luvas (commit na mecânica) |
| Condutas × slots | *Pele de Ferro* = nunca equipar **as 4 peças de vestir** (capacete/armadura/calça/botas) · *Mão Vazia* = nunca equipar **arma** (luvas ok) |
| Mochila | **Containers aninhados** estilo Tibia (mochila dentro de mochila, cada uma abre sua janela) |
| Slot utilitário | Regras por tipo: **flechas/virotes consomem** (munição), **tocha ilumina** (raio de luz pessoal), **charm é passivo** |
| Raridades | Comum → Incomum → Raro → **Lendário** → **Único** (decidido em `DESIGN-MUNDO.md`), slots de Marca 1/1/1/2/3. **Raridade é taxonomia interna** (peso dos stats, slots de Marca, fonte/escassez) — **nunca** quantidade de linhas de stat; lendário/único = end-game **pelas Marcas**, poder base contido. Slots de Marca **ocultos no tooltip**. Visibilidade da raridade na UI ✏️ (acoplada à conversa futura de forja) |
| Modelo de raridade | **Fixa por item (Modelo A, decidido)**: *Espada de Ossos* é sempre rara, sempre os mesmos stats. Sem upgrade de raridade, sem forja destrutiva, sem rolls por instância — instâncias diferem pelo **ledger/Marcas** (história), nunca por stats rolados |
| Economia de itens | ✏️ **em discussão** — acoplada à decisão de PvP/perda de loot (o churn de itens define quanto sink artificial a economia precisa). Já descartado: encantamento temporário/renovável (treadmill). Em avaliação: desmantelar/salvage, têmpera permanente, preparos consumíveis. Direções aceitas: quests/oferendas que consomem itens; ledger = apreciação com uso |
| Instâncias | Todo item equipável é **instância com ID + ledger** — contadores de Marca viajam com o item (decidido em `DESIGN-EVOLUCAO.md`) |
| Requisitos de uso | Itens têm requisito de **nível** (o gate mais comum) e de **stats** (comum, não universal). Restrição por **classe é virtualmente zero em armas** e raríssima no geral — a segregação é **por essência** (stats que não servem àquela classe), não por trava |
| Mitigação | **Exclusiva de itens** (decidido com `DESIGN-EVOLUCAO.md`): defesa física, resistência mágica e resists elementais são stats de equipamento — atributos nunca mitigam, só dão potência/recursos. **Def física é FLAT** (cada hit físico chega −X, modelo Tibia Arm); resists mágica/elementais são % |
| Cap de resistência | Resistências (mágica/elementais) têm **teto declarado** ✏️ valor (lição UO: cap 70%) |
| Armas mágicas (cajado/wand) | Auto-attack mágico tem **dano fixo em faixa** (ex: 8–10) por tier de arma — **não escala com Int** (anti-OP de Mage). Magias/skills continuam escalando com Int. **Wand 1H × cajado 2H = escolha de loadout do caster**; cetro = a wand holy do Priest; wands/cajados vêm por elemento |
| Acerto/esquiva | **Sem stat de acerto** (modelo Tibia). Esquiva é exclusiva de jogador — **mobs não esquivam**: o dano do jogador é sempre legível |
| Tipos de item de mão | **Decidido (jun/2026)** — roster completo na seção. Trio For diferenciado por **subtipos físicos sutis** (corte/impacto/perfuração, teto **±10%**, camada-sussurro) + perfil numérico; **arco × besta** (rápido × pesado, flechas × virotes); **2H compra dano, paga a off-hand** (velocidade é da família); adaga tipo único; casters wand 1H × cajado 2H; cetro **sem trava**; livro de magia com stats autorais; escudo = Def passiva + bloqueio em chunks (nunca 100%); luva = 1 slot cada |
| Stats de item | **Decidido (jun/2026)**: Def física **flat**; atributos em item **raríssimos** (só lendário/único, sempre com tradeoff; **requisito de equip checa atributo base**, nunca bônus de item); recursos (+HP/mana, +regen) ok; tradeoffs autorais; +poder de cura ok; **+poder mágico raro e pequeno**, muitas vezes com tradeoff. **Modelo de peça**: base do slot + **1 bônus de identidade** (2º só quando o design pede, ex. tradeoff — nunca função da raridade); **joias sem Def física** |
| Famílias de equipamento | **Famílias temáticas SEM set bonus (decidido)**: cada peça carrega o tema sozinha, mix-and-match livre; a camada "conjunto com história" é das Marcas. Cadência de conteúdo: básicos → diversificados → tradeoffs → lendários/únicos de evento, **limitadíssimos** |
| Tabelas T1/T2 | **Decididas (jun/2026)** — catálogos completos nas seções. **Matriz esparsa** (modelo Tibia): nunca preencher tipo×elemento×tier; armas T1 sem bônus; T2 = tier das estreias (besta, wand 1H, livro, +poder mágico, colar, tradeoff) com vendor só de ponte; 1ªs armas elementais (Espada de Fogo = drop raro, Maça Consagrada = quest difícil) **nunca compráveis** |
| Loot tables | ✏️ a decidir (modelo por família/tier — os catálogos T1/T2 são o conteúdo a distribuir) |
| Economia / gold | ✏️ a decidir (drop, preços, sinks) |

---

## Slots de equipamento (decidido — modelo Tibia)

**11 slots:**

| Slot | Qtd | O que entra | Notas |
|---|---|---|---|
| **Capacete** | 1 | capacetes, elmos, tiaras | |
| **Armadura** | 1 | peças de **peito**: peitorais, túnicas, robes | a peça central de defesa |
| **Calça** | 1 | calças, shorts, saias | |
| **Botas** | 1 | botas, sapatos | lar natural dos itens de facilitação (*botas do viajante*) |
| **Mão** | 2 | armas, escudos, cajados, livros de magia, luvas/soqueiras… | 2 mãos ocupa os dois slots; dual wield só Rogue; tipos ✏️ aprofundar |
| **Colar** | 1 | colares, amuletos | |
| **Anel** | 2 | anéis | desvio deliberado do Tibia (1 anel): mais espaço para facilitação e Marcas |
| **Mochila** | 1 | containers **aninhados** (estilo Tibia) | abre o painel de inventário; mochila dentro de mochila |
| **Utilitário** | 1 | charms (passivos), flechas/munição (consomem), tocha (ilumina), ferramentas… | o slot "canivete" — munição do arqueiro, luz do explorador |

Layout do painel de equipamento (espelho do Tibia; spec visual final em `DESIGN-VISUAL.md` ✏️):

```
[Colar]      [Capacete]    [Mochila]
[Mão 1]      [Armadura]    [Mão 2]
[Anel 1]     [Calça]       [Anel 2]
[Utilitário] [Botas]
```

### Interações com sistemas existentes (decidido)

- **Tocha no utilitário ⇄ iluminação**: a luz dinâmica já existe (`Lighting.ts`); equipar tocha = raio de luz pessoal. Exploração de caverna vira decisão de slot (tocha ou flechas?).
- **Arma de 2 mãos ocupa os dois slots de mão** — e é o gate do Caminho *Duas Mãos, Nenhuma Dúvida* (lvl 25 sem nunca equipar escudo).
- **Dual wield**: existe, **exclusivo do Rogue** (uma adaga em cada mão é a fantasia da classe).
- **Luvas/soqueiras não são arma**: têm stats e servem a qualquer classe, mas **não quebram a conduta *Mão Vazia*** — kills com luvas contam como desarmado para liberar o Monge. (Não são "gear do Monge": são uma categoria normal de item de mão; o Monge é só quem mais agradece.)
- **Caminho *Pele de Ferro*** = nunca equipar **as 4 peças de vestir** (capacete, armadura, calça, botas). A fantasia é defesa de pele nua; o efeito compensa o set inteiro, então a conduta custa o set inteiro.
- **Marcas por slot**: o ledger é por instância, mas a *lente* natural varia por slot — arma conta kills (golpe final), escudo conta bloqueios (*Inabalável*), armadura conta dano absorvido ✏️ formalizar quais dimensões cada slot rastreia.

---

## Requisitos de uso (decidido)

Três eixos de gate, do mais comum ao mais raro:

| Eixo | Frequência | Exemplo |
|---|---|---|
| **Nível mínimo** | **o gate mais comum** — quase todo item (poucos não têm) | espada longa: nível 12 |
| **Stats mínimos** | comum, mas não universal | machado pesado: Força 25 |
| **Classe** | **virtualmente zero em armas**; raríssima no geral | (exceção estrutural: dual wield só Rogue) |

**Princípio:** a segregação natural vem dos **stats**, não de travas. Um robe com +mana é *legal* pro Mage e *inútil* pro Knight por essência; um Knight **pode** equipar cajado — só não tem motivo. Hierarquia de gates: **nível > stats > classe (~0)**. Restrição de classe real é reservada a raríssimos itens identitários (✏️ critério ao definir os tipos de mão).

- Item com requisito não atendido: **não equipa** (estilo Tibia ✏️ confirmar — alternativa seria equipar com penalidade; proposta: não equipa, simples e legível).

## Anatomia de um item (decidido — jun/2026)

O **vocabulário de stats de item**:

| Grupo | Stats | Status |
|---|---|---|
| **Mitigação** (exclusiva de itens) | **Def física FLAT** — soma das peças, cada hit físico chega −X (modelo Tibia Arm) · resist mágica **%** · resists elementais **%** (cap ✏️ valor) | decidido |
| **Ofensa** | dano base da arma + cooldown próprio · subtipo físico · dano elemental adicional ("+X de fogo", modelo Fire Sword) | decidido |
| **Recursos** | +HP/+mana flat · +regen de HP/mana (já existem como facilitação: *anel de regen menor*) | decidido |
| **Atributos** | **Raríssimo: só lendários/únicos, sempre com tradeoff autoral** (arquétipo Thanatos: +Int −Vit). **Regra anti-loop: requisitos de equip checam o atributo BASE** (distribuído no level up), nunca bônus de item | decidido |
| **Tradeoffs** | autorais, por item, nunca rolados (−HP +dano · resist X / vulnerável Y, modelo Glacier) | decidido |
| **Únicos/contextuais** | velocidade de movimento (botas) · raio de luz (tocha) · capacidade (mochila) | decidido |
| **Potência de skill** | **+poder de cura**: existe (já canônico em livros/cetros) · **+poder mágico** (ofensivo): existe, **raro e pequeno** (✏️ valores Balancista), frequentemente pago com tradeoff autoral (−HP +poder) — modelo +magic level do Tibia | decidido |

- **Por que flat na Def física:** hordas fracas viram arranhão pra quem investiu em armadura, mas o golpe do T5 **atravessa** — armadura nunca te salva do que é maior que você (pilar 2: o perigo continua perigo). Contraste legível com as duas camadas %: bloqueio de escudo e resists.
- Ordem das camadas de mitigação no cálculo (bloqueio % → Def flat → resist %?) ✏️ Balancista/implementação.

## Famílias de equipamento & modelo de peça (decidido — jun/2026)

**Modelo de peça** — toda peça = **stat-base do slot** (pago pelo tier) + **bônus de identidade** (a personalidade):

```
Peça de vestir:    Def flat (base do slot/tier)  +  bônus de identidade
Arma:              dano (base do tier)           +  bônus (+X elemental…)
Joia (colar/anel): SEM base — o slot é só bônus (joia NUNCA tem Def física)
```

- **1 bônus por peça na regra; o 2º só quando o design pede** (tradeoff exige duas linhas: −HP +poder). **Nunca função da raridade** — um Único pode ter uma linha só e ser o melhor item do jogo naquela linha.
- O exemplo-modelo: todo capuz T2 tem a mesma Def base; a variante do caçador dá **+dano de distância**, a do erudito **+mana**, a do templário **+poder de cura**. Mesmo orçamento, essências diferentes — segregação por essência, peça a peça.
- **+dano físico/distância em peças de vestir** entra no vocabulário (o espelho marcial do +poder mágico): mesmo regime — raro e pequeno.
- **Guardrail anti-stack:** stats de potência (+poder mágico/cura, +dano) existem em **poucos slots por design** (ex: capacete, colar, livro) — a escassez de slots portadores é o cap natural, sem regra extra.

**Matriz slot × bônus de identidade** (✏️ refinável; potência marcada com ⚡ = regime raro/pequeno):

| Slot | Base | Bônus possíveis |
|---|---|---|
| Capacete | Def | +mana · +regen · ⚡+poder mágico/cura · ⚡+dano dist./melee |
| Armadura (peito) | Def maior | +HP · resists · tradeoffs autorais |
| Calça | Def | +HP/+mana · resists |
| Botas | Def | **velocidade** (o lar dela) · +regen |
| Colar | — | resists · +regen · ⚡+poder · tradeoffs (modelo Glacier) |
| Anel ×2 | — | +regen · facilitação · resists · atributo (só lendário/único + tradeoff) |
| Mãos | dano / Def | já especificado no roster de tipos |

**Famílias temáticas — SEM set bonus (decidido):** linhas de gear com tema onde **cada peça carrega o tema sozinha** (capuz, robe e calça do Erudito dão mana/regen cada um — usar várias soma naturalmente; misturar linhas é livre e eficiente). Sem bônus por completar conjunto: a camada "conjunto com história" é das **Marcas**, e o mix-and-match é onde mora a expressão de build num jogo sem subclasses. **As 6 famílias (batizadas jun/2026, registro "do/da \<arquétipo\>"):** **do Erudito** / *Scholar's* (mana/regen) · **do Arcanista** / *Arcanist's* (potência mágica) · **do Elementalista** / *Elementalist's* (dano elemental) · **do Caçador** / *Hunter's* (distância) · **da Muralha** / *Bulwark* (Def/HP — eco da fantasia do Knight) · **da Vigília** / *Vigil's* (holy/cura).

**Cadência de conteúdo** (régua de releases): itens básicos → diversificados → com tradeoffs → lendários/únicos de quests difíceis e **eventos icônicos do mundo**, em quantidades **limitadíssimas** — nunca quebram a balança; abrem espaço de upgrade e build.

### Raridade re-fundamentada (decidido)

Raridade é **taxonomia interna de design**, não rótulo de poder na tela:

| Raridade define | Raridade NÃO define |
|---|---|
| **peso/orçamento** dos stats (qualidade que o jogador sente) | quantidade de linhas de stat |
| **slots de Marca** (1/1/1/2/3) | salto de poder que quebra a balança |
| **fonte e escassez** (mob → baú → quest/evento icônico) | |

- **Lendário/único = end-game pelas Marcas, não pelo número:** poder base contido; os 2–3 slots de Marca fazem o item **crescer com a história** — o único "upgrade infinito" do jogo, e é conquistado, não dropado.
- **O dilema-relíquia é design desejado:** lendário lvl 20 com 2 Marcas desenvolvidas × raro lvl 45 com mais atk base e zero história. A dor dessa escolha é o sistema funcionando ("ledger = apreciação", economia).
- **Slots de Marca ocultos no tooltip (decidido):** o jogador descobre os slots quando Marcas despontam (hint ~50%, modelo de `DESIGN-EVOLUCAO.md`) — número de slots visível vazaria a raridade por outra porta.
- **Visibilidade da raridade na UI ✏️ ABERTO** — acoplada à conversa futura de **forja** (interesse declarado: modelo Apogea, combinar idênticos + ingots). ⚠️ **Alerta de constituição:** o Modelo A registra *"sem upgrade de raridade, sem forja destrutiva"* — qualquer sistema de forja **renegocia o Modelo A explicitamente**, não entra como acréscimo.

## Tipos de item de mão (decidido — sessão jun/2026)

### Roster

| Tipo | Mãos | Escala | Subtipo físico | Essência |
|---|---|---|---|---|
| **Espada** | 1H e 2H | For | corte | a arma equilibrada |
| **Machado** | 1H e 2H | For | corte | dano máximo, lenta |
| **Maça** | 1H e 2H | For | impacto | intermediária — o diferencial é o impacto |
| **Adaga** | 1H (única dual-wieldável; Rogue) | Des | perfuração | rápida, fraca por golpe |
| **Arco** | 2H | Des | perfuração | distância, cadência rápida; flechas no utilitário (consomem) |
| **Besta** | 2H | Des | perfuração | distância, lenta e pesada; virotes no utilitário (consomem) |
| **Wand** | 1H | dano fixo/tier | elemental | caster com off-hand livre |
| **Cajado** | 2H | dano fixo/tier | elemental | dano fixo maior; conta p/ *Duas Mãos* |
| **Cetro** | 1H | dano fixo/tier | holy | a wand do elemento sagrado — arquétipo do Priest, **sem trava** |
| **Escudo** | 1H (off-hand) | — | — | Def passiva + bloqueio em chunks (nunca 100%) |
| **Livro de magia** | 1H (off-hand) | — | — | stats autorais por livro |
| **Luva/soqueira** | 1H (**1 slot cada**) | — | — | não-arma; 1 luva + arma/off-hand, ou 2 luvas (commit) |

### Subtipos físicos (decidido — a camada-sussurro)

Dano físico tem 3 subtipos: **corte** (espada/machado), **impacto** (maça), **perfuração** (adaga/arco). O medo a evitar: o jogador se sentir **cobrado** a otimizar loadout. Regras que travam o dial:

- **Default global: neutro.** A maioria das famílias ignora subtipo físico — na caçada comum, arma é identidade + lente de Marca, não otimização.
- **Exceções raríssimas e autorais**, onde a física narra sozinha (esqueleto racha com maça e ri de flecha; gosma não se corta) — telegrafia pelo corpo da criatura (pilar 2).
- **Modificadores sutis: teto ±10%** (✏️ valores exatos com Balancista). Perceptível — o dano do jogo é estável (sem crit passivo, sem accuracy, mob não esquiva), então ±10% é legível nos números — mas **nunca decisivo**: ±25% já seria "caçar 25% mais rápido", otimização real, pressão de loadout.
- **Imunidade NUNCA por subtipo de arma.** Imunidade/resistência forte só existe na **classe de dano inteira** (ex: Espectro resiste a *físico* — já no bestiário) e segue raríssima.
- **Anti-datamine:** resists do mob não viajam no snapshot nem aparecem em tooltip — descobre-se sentindo o dano e por NPCs ("flecha em osso é reza pro vento", diz o caçador).
- **Divisão de papéis:** a matriz **elemental** do bestiário é quem carrega a demanda situacional de loadout — e mesmo ela segue a **"Regra 10–20"**: norma ±10–20%, poucos quebradores autorais identitários (~125% / ~70%) e imunidade (0%) raríssima e temática (golem de pedra × terra, undead × abissal). Escala completa em `DESIGN-BESTIARIO.md` ("Escala de multiplicadores"). O subtipo físico (±10%) é a camada-sussurro abaixo dela.

### Regras transversais do roster (decidido)

- **1H × 2H (espada/machado/maça):** o 2H compra **dano por golpe** e paga com a **off-hand** (escudo/livro/luva). Velocidade é perfil da **família**, não das mãos — machado é lento sendo 1H ou 2H, espada é equilibrada nas duas. Quanto dano a mais ✏️ Balancista.
- **Arco × besta:** arco = cadência rápida, dano menor · besta = lenta, golpe pesado — o perfil espada×machado do ranged. Munições distintas (**flechas × virotes**), ambas no utilitário, consomem.
- **Adaga é tipo único** — sem subtipos; a variedade vem de itens autorais (adaga com veneno, +abissal, lendárias…). Mantém a lente de Marca do Rogue coesa.
- **Off-hand fechada:** a segunda mão recebe **arma 1H** (dual wield só Rogue), **escudo**, **livro** ou **luva**. Tocha mora no utilitário. Categoria nova de off-hand só como item raro dentro de tipo existente (ex: "foco arcano" = livro).
- **Nenhum tipo tem trava de classe** — confirmado inclusive pro cetro. A única trava do jogo segue sendo dual wield (Rogue).

### Decidido nesta sessão (casters e livro)

- **Wand 1H × Cajado 2H — escolha de loadout do caster.** Wand 1H: dano fixo menor, libera a off-hand (livro/escudo). Cajado 2H: dano fixo maior, ocupa as duas mãos — e **conta para o caminho *Duas Mãos, Nenhuma Dúvida***. O caster participa do mesmo tradeoff de mãos do marcial.
- **Cetro = a wand do elemento sagrado** (1H, dano fixo holy) — arquétipo e kit inicial do Priest, **sem trava de classe**: como o auto-attack mágico é fixo por tier (não escala com Int/Esp), um Mage com cetro caçando undead é loadout situacional legítimo; a essência de Priest mora nos stats secundários do cetro (+poder de cura). Wands/cajados vêm **por elemento** (cajado de fogo, wand de gelo…) — o auto-attack mágico carrega tipo elemental.
- **Livro de magia (off-hand): stats variados por livro.** É o "escudo do caster" com personalidade: cada livro dá um pacote autoral (+mana e regen de mana · +resist mágica · +poder de cura…). Escolha de livro = expressão de build; espaço para livros raros memoráveis. Sem fórmula fixa por tier.

### Amarras já decididas (referência)

- Restrição de classe em armas ≈ **zero** (segregação por stats/essência); dual wield é a única trava (Rogue, adagas)
- Arma de 2 mãos ocupa os dois slots; adagas escalam Des, demais melee For (`formulas.ts`); arco/distância = Des
- Luvas/soqueiras: item de mão não-arma (compatível com Monge)

### Escudo (decidido)

Duas camadas:

1. **Def passiva** — stat constante, entra na fórmula de mitigação física normal (como peça de armadura). Sempre ativa, visível no tooltip.
2. **Bloqueio** — chance % de bloquear; ao bloquear, absorve **% grande do golpe (✏️ ~60–80%, Balancista), nunca 100%** — sempre vaza dano. Cada bloqueio emite o evento `block` (contador do *Inabalável*). **Provisórios de paper (jun/2026):** chance ~20% no T1, chunk **70%**; ordem das camadas: bloqueio % → Def flat → piso 1 (resists % só na parcela elemental) — report em `docs/reports/2026-06-04-balance-consolidacao-kit-itens.md`.

**Bloqueio total é exclusivo do Caminho *Inabalável*** (50k bloqueios): a recompensa lendária é fazer o que nenhum escudo do jogo faz. Por isso o bloqueio comum *nunca* chega a 100% — é regra de identidade, não só de balance.

### Luvas/soqueiras (decidido)

**1 slot de mão cada.** Combinações: 1 luva + arma 1H · 1 luva + escudo/livro · **2 luvas = commit na mecânica do item** (dois pacotes de stats, mãos vazias de arma). Luva não impede segurar machado/espada na outra mão. Continua não-arma: nenhuma combinação com luva quebra *Mão Vazia* — só a arma quebra.

## Itens de nascimento & kit de classe (decidido — jun/2026)

Com o início **sem classe** (`DESIGN-EVOLUCAO.md`), o equipamento inicial é uma trilha de quatro degraus:

| Degrau | Conteúdo |
|---|---|
| **Nascimento (casa inicial)** | **Espada Cega** (*Blunt Sword*) + **Gibão Roto** (*Tattered Jerkin*) + **Botas Surradas** (*Worn Boots*) + **Sacola de Pano** (*Cloth Bag*) — coletados nos containers domésticos (batizados jun/2026). Sem skills, sem capacete |
| **Rito de classe** | o NPC oferece uma **ESCOLHA**: **Knight** = espada × machado × maça, **+ escudo de madeira** · **Mage** = cajado 2H, **fogo × gelo** · **Rogue** = **adaga × arco** (uma arma) · **Priest** = **cetro (holy) × luva** |
| **Primeira mochila** | recompensa de **quest básica** em NPC inicial (cada cidade de spawn tem a sua) — upgrade da sacola por quest, não compra |
| **Armaduras T1** | nos **baús iniciais** das primeiras áreas, **peças diferentes por região** (a armor perto de Alvorada, o robe perto de Charneca) — mercador vende só o básico genérico; o gear inicial bom é prêmio de exploração |

Leituras de design:

- **A escolha do rito é a primeira declaração de identidade**: o Knight escolhe o tipo que a lente de Marca dele contará (espada/machado/maça); o Mage declara o primeiro elemento (alimenta *Senhor dos Extremos*/*Coração de Cinzas*); o Rogue escolhe arquétipo (lâmina × distância).
- **A luva do Priest é o hint silencioso do Monge (decidido)**: o NPC oferece cetro ou luva **sem nenhum comentário** — a pulga atrás da orelha é a existência da opção. Quem escolhe a luva começa a conduta *Mão Vazia* limpa desde a ordenação (condutas contam da aquisição da classe). Viabilidade do early com luva + *Luz Sagrada* ✏️ Balancista.
- **Rogue ganha UMA arma** — a segunda adaga (dual wield) é a primeira meta de compra: a didática da mecânica exclusiva da classe. Quem escolhe o **arco** recebe junto um **lote inicial de flechas** (provisório: **50** ✏️ — alvo: cobrir ~15–20 min de caça T1 até a primeira volta ao vendor; repor flechas vira a primeira rotina de compra dele).
- **Itens de kit têm base do slot e ZERO bônus de identidade** — a régua do zero; o primeiro item com bônus (comprado/achado) é o momento "entendi o que itens fazem".
- **Valor de venda ≈ 0** (anti-loop de gold) e sem requisitos.
- **Instâncias com ledger desde o nascimento** — a arma do rito tem 1 slot de Marca: quem nunca trocar pode transformá-la em relíquia (pilar 6 desde o minuto 1).
- Skills nunca vêm em kit nenhum — todas compradas (básicas quase grátis).

## Tabela de itens — T1 (decidido — jun/2026)

### Princípio da matriz esparsa (decidido — modelo Tibia)

**NUNCA preencher a grade tipo × elemento × tier.** Cada tier estreia **poucas combinações autorais**; um elemento pode pular tiers — a arma de fogo do T2 pode só ter sucessora no T5, e no caminho aparecem gelo, raio, terra… Efeitos: cada item é **evento**; nasce a cultura "qual a melhor X pro meu nível" (conhecimento = loot); o catálogo cresce por release sem inflar. Aplicações já decididas:

- **Armas T1 não têm bônus** — a diferença entre elas é tipo/perfil. O primeiro "+X elemental" numa arma estreia no **T2** (e é evento).
- **T2 terá no máximo 1–2 elementos em armas**; as demais combinações vêm escalonadas pelos tiers.
- **Estreias guardadas pro T2**: besta, wand 1H, livro de magia — descobertas de loadout na faixa onde a população vive.
- ✏️ roster formal de elementos (fogo, gelo, terra, **raio?**, sagrado, abissal) — fechar quando o 3º elemento de jogador entrar.

### Escada de fontes do T1

```
1. CASA (kit)      → zero bônus, venda ≈ 0      a régua do zero
2. RITO (classe)   → arma escolhida, sem bônus   a identidade
3. VENDOR (cidade) → catálogo genérico completo  o chão confiável
4. BAÚS (mundo)    → as variantes COM bônus      o prêmio de explorar
5. DROPS (mobs T1) → itens do catálogo comum     o pingado da caça
```

- **Vendor: catálogo T1 idêntico nas cidades de spawn** (spawn aleatório não pode gerar desvantagem). NPCs de **quest e variáveis são únicos por cidade** (decidido).
- Bônus de identidade em T1 **só existe em baú** — o vendor te deixa funcional, o mundo te deixa especial.

### Armas T1 (sem bônus)

| Tipo | Item | Par EN | Fonte |
|---|---|---|---|
| Espada | Espada Cega → **Espada Curta** | Blunt Sword → Short Sword | casa → rito/vendor |
| Machado | **Machado de Mão** | Hand Axe | rito/vendor |
| Maça | **Clava** | Club | rito/vendor |
| Adaga | **Adaga** | Dagger | rito/vendor (a 2ª no vendor = dual wield) |
| Arco | **Arco Curto** | Short Bow | rito/vendor |
| Cajado | **Cajado de Fogo** / **Cajado de Gelo** | Fire Staff / Ice Staff | rito (escolha); o outro no vendor |
| Cetro | **Cetro** | Scepter | rito/vendor |
| Luva | **Luvas de Couro** | Leather Gloves | rito (a opção-hint) / vendor |
| Escudo | **Escudo de Madeira** | Wooden Shield | rito Knight / vendor (sem trava) |

### Vestir T1 — vendor genérico (sem bônus)

| Item | Par EN | Slot |
|---|---|---|
| **Coifa de Couro** | Leather Coif | capacete |
| **Túnica de Couro** | Leather Tunic | armadura |
| **Calças de Couro** | Leather Trousers | calça |
| **Botas de Couro** | Leather Boots | botas |

### Vestir/joias T1 — baús (COM bônus de identidade; posições ✏️ world-designer M3)

| Item | Par EN | Bônus (família) | Constelação sugerida |
|---|---|---|---|
| **Capuz do Caçador** | Hunter's Hood | +dano de distância (pequeno) | trilha dos lobos / borda da floresta |
| **Robe do Erudito** | Scholar's Robe | +mana | Esgotos de Alvorada |
| **Peitoral da Muralha** | Bulwark Breastplate | +HP | acampamento goblin |
| **Botas do Viajante** | Traveler's Boots | +velocidade leve (canon facilitação) | estrada dos bandidos |
| **Anel de Regeneração Menor** | Lesser Ring of Regeneration | +regen HP (canon facilitação) | pântano raso / Charneca |

### Utilitário e containers T1 (vendor)

| Item | Par EN | Papel |
|---|---|---|
| **Tocha** | Torch | ilumina — slot utilitário |
| **Flechas** | Arrows | munição (stack) — utilitário |
| **Mochila** | Backpack | container — **a 1ª vem de quest** (`DESIGN-MUNDO.md`) |

> Números (dano/Def/bônus/preços/requisitos) ✏️ **Balancista** — bateria M2. Drops de mobs T1 referenciam este catálogo (loot tables ✏️).

## Tabela de itens — T2 (decidido — jun/2026)

O **centro de gravidade** (lvl 8–15, a faixa onde a população vive) — maior variedade e as **estreias**. A escada muda: **vendor vende só a ponte** (o chão do tier); o T2 bom vem do **mundo** (drops, baús guardados, quests). Loja te deixa funcional; conquista te deixa forte.

### Vendor-ponte (catálogo idêntico nas cidades de spawn)

| Item | Par EN | Nota |
|---|---|---|
| **Espada Longa** | Long Sword | "nível 12" — o exemplo canônico de requisito |
| **Punhal** | Stiletto | a dupla do Rogue evolui |
| **Wand de Fogo** / **Wand de Gelo** | Fire Wand / Ice Wand | ⭐ estreia da wand 1H — o tradeoff de loadout do caster nasce |
| **Escudo de Ferro** | Iron Shield | |
| **Cota de Malha** | Chain Mail | peito |
| **Elmo de Ferro** | Iron Helmet | capacete |
| **Virotes** | Bolts | munição da besta |

### Mundo (drops, baús guardados, quests)

| Item | Par EN | Fonte | Nota |
|---|---|---|---|
| **Machado de Batalha** | Battle Axe | drop (orcs) | |
| **Martelo de Ferro** | Iron Hammer | drop/baú | |
| **Arco Longo** | Longbow | baú/quest | |
| **Besta de Caça** | Hunting Crossbow | quest/baú | ⭐ estreia da besta — o ranged pesado se revela |
| **Tomo do Erudito** | Scholar's Tome | baú | ⭐ estreia do livro: +mana e regen de mana |
| **Breviário da Vigília** | Vigil's Breviary | quest | livro: +poder de cura |
| **Cetro de Prata** | Silver Scepter | quest | prata vs profanos — folclore como flavor |
| **Robe do Arcanista** | Arcanist's Robe | baú guardado | ⭐ estreia do **+poder mágico** (o stat raro ⚡) |
| **Grevas da Muralha** | Bulwark Greaves | drop/baú | calça: +HP |
| **Amuleto de Gelo** | Ice Amulet | baú | ⭐ estreia do colar: +resist gelo (fronteira de Brumal) |
| **Peça-tradeoff** ✏️ | — | baú guardado, fim do T2 | ⭐ estreia do tradeoff autoral (modelo Glacier: bônus com preço embutido) — desenhar com Loremaster |

### As primeiras armas elementais (decidido — nenhuma comprável)

| Item | Par EN | Aquisição | Leitura |
|---|---|---|---|
| **Espada de Fogo** | Fire Sword | **drop raro de mob** (✏️ Salamandra Ardente? — loot tables) | a sorte da caça; o ícone do gênero |
| **Maça Consagrada** | Consecrated Mace | **recompensa de quest difícil** (arco da Contaminação/Charneca ✏️) | o mérito da quest; impacto 110 + sagrado vs esqueletos = a arma do arco, conhecimento de matriz virando loot |

> **Aquisição É a raridade**: as duas estreias elementais nunca aparecem em NPC. Próxima arma de fogo: só tiers depois (matriz esparsa). Números ✏️ Balancista; posições/quests ✏️ world-designer M3.

## Raridades e slots de Marca (já decidido — referência)

| Raridade | Slots de Marca | Fonte principal |
|---|---|---|
| Comum | 1 | loot de mob, mercadores |
| Incomum | 1 | loot de mob, baús escondidos/guardados, quests diretas |
| Raro | 1 | baús lacrados/secretos, quests abertas, mobs T4–T5 |
| **Lendário** | 2 | segredos profundos, lacres altos, bosses (doc futuro) |
| **Único** | 3 | eventos canônicos, world bosses — nunca de baú comum |

Cores de raridade em `DESIGN-VISUAL.md` (⚠️ ✏️ em revisão — raridade pode ficar **invisível na UI**; decidir junto com a conversa de forja). Itens de **facilitação** (anel de regen menor, botas do viajante…) em `DESIGN-MUNDO.md`.

## Instância & ledger ✏️

_(o que a instância guarda além do ledger: durabilidade? dono original? — e o modelo de stack para consumíveis/munição)_

## Loot & gold (decidido — jun/2026, direção do criador)

- **Mobs dropam gold direto** (estilo Tibia/Apogea) — mas **bem pouco**. Gold é difícil de conseguir por design.
- **Loot de caça é a segunda camada da renda** — e a venda é **pouco óbvia**: compradores **específicos** espalhados pela cidade (não vendor universal — ver `DESIGN-MUNDO.md` §Comércio especializado), e **muitos loots só se tornam vendáveis após a quest do NPC comprador** (o trade destravado é recompensa de quest). Saber quem compra o quê é conhecimento-loot.
- Consequência de design: o caçador novato vive do gold miúdo dos mobs; quem fez as quests e conhece a cidade **monetiza a caçada inteira**. A diferença de renda é conhecimento, não grind.
- ✏️ Modelo de loot table por família/tier (estrutura genérica); as tabelas CONCRETAS da fatia ① vivem em `design/fatia-1-alvorada/`.

## Consumíveis — Comida & Cozinha (decidido — jun/2026, BASE Apogea, sistema PRÓPRIO)

O sistema de comida é a **fundação do sustain**. Referência explícita do criador: o modelo do Apogea é melhor e mais completo que o do Tibia — **usamos como base de pensamento, mas o sistema é NOSSO** (✏️ Designer de Sistemas desenha a identidade própria em cima dos fundamentos abaixo; não copiar receitas/números):

- **Fome como portão do regen**: o regen natural de HP/mana **só funciona saciado**. Comida comum e barata (pão, carne assada) mantém o regen ligado — é o arroz-com-feijão do caçador, sempre na mochila.
- **Comida cozida = buff food**: receitas preparadas dão **regen melhor + stats temporários por duração** (ex. Apogea: dano+1 + vel. ataque + regen por ~5min; regen forte + habilidade por ~8min). É o "luxo acessível" do dia-a-dia — e cria a decisão de custo-por-minuto antes da caçada.
- **Cozinhar NÃO é skill com level** (modelo Apogea): é atividade de utilidade — fogueira/cozinha como estação, **receitas como conhecimento descobrível** (livros, NPCs, experimentação ✏️) — encaixa direto no pilar "informação é loot".
- **Ingredientes vêm do mundo**: carnes da caça (loot tables), **pesca** (vara = ferramenta), forrageio/hortas, compra e intermediários (massa, queijo ✏️).
- **Divisão de papéis do sustain** (a hierarquia que evita degenerar): regen base (saciado) → kit de classe (*Primeiros Socorros*/*Curar Ferimentos*) → buff food (planejamento) → **poção (emergência cara)**.
- ✏️ Fome: decai com tempo? com ação? penalidade de faminto (sem regen apenas, ou debuff?) — Designer de Sistemas + Balancista.
- ✏️ Quest do cozinheiro (modelo *Licensed Chef* do Apogea) — destrava estação/receitas; fatia ①.

### Esqueleto do sistema próprio (direção do criador — peças do Apogea a TRADUZIR, não copiar)

| Peça | O que é | Nota de tradução ✏️ |
|---|---|---|
| **Cru × cozido** | todo ingrediente animal existe em 2 estados; cozinhar transforma | cru sacia pouco (ou risco de efeito ruim? ✏️) — cozinhar sempre vale o gesto |
| **Fogueiras** | estação de cozinha do MUNDO: pontos fixos (acampamentos, clareiras) + cozinha urbana (estalagem) | ✏️ fogueira montável pelo jogador? (lenha como recurso?) — decidir; se sim, efeito temporário como as ferramentas |
| **Utensílios** | itens que destravam CATEGORIAS de receita: **pote** (caldos/sopas), espeto/grelha ✏️ | utensílio é como ferramenta: compra única, decisão de mochila |
| **Pote + água** | encher o pote em poço/rio/fonte → base de **caldos e sopas** | água como recurso de mundo (mais uma função pro rio/poço da praça!) |
| **Sanduíches/montados** | comida FRIA montada (pão + recheios), sem fogo | a comida de viagem: prepara na cidade, come na dungeon — categoria própria |
| **NPC que compra comida** | cozinheiro/estalajadeiro compram ingredientes E pratos prontos | **renda não-combate**: caçar→cozinhar→vender vira loop legítimo (entra no mapa de comércio) |

- A régua das categorias: **assado** (fogueira, simples) < **sopa/caldo** (pote+água, melhor regen) < **prato completo** (receita descoberta, buff food) — esforço/conhecimento crescente, recompensa crescente.
- ✏️ Identidade própria a desenhar (Designer de Sistemas + Loremaster): pratos regionais por cidade? qualidade por ingrediente? — o que nos torna NÓS e não um clone do Apogea.

## Consumíveis — Poções (decidido — jun/2026)

- **Poção de vida em 3 tamanhos: pequena / média / grande.**
- **Poção é LUXO até certo nível** (✏️ Balancista calibra o "certo"): cara em relação ao gold/hora do early. Anti-degeneração dupla: poção não pode (a) **cobrir falha de gameplay com dinheiro**, nem (b) permitir **caçar acima do tier expamando poção** porque o gold sobrou. Papel: **emergência** — o sustain de rotina é comida + kit (ver Comida & Cozinha).
- **Acesso escalonado com barreira ALTA (revisado)**: a *pequena* no vendor padrão da cidade (cara pro novato); a **média atrás de quest T2+** — **não vinculada às quests iniciais**, é conquista do mid-game; a **grande atrás de barreira T3+/NPCs específicos remotos**. Nunca nos vendors padrão.
- ⚠️ Interação com o sustain de classe e comida: poção complementa, **nunca substitui** — se virar o sustain principal, os números estão errados (Balancista).
- ✏️ Poção de mana: mesma lógica de tamanhos/barreiras? — a decidir.
- ✏️ Stack/peso de poções: limite natural de inventário é parte do anti-spam.

## Ferramentas (corda/pá/tocha) — economia

Mecânica decidida em `DESIGN-MUNDO.md` §Ferramentas de exploração. Lado item (✏️ detalhar na fatia ①): proposta — **corda e pá permanentes** (ferramenta de verdade, compra única não-trivial), **tocha consumível** (queima); "bem pensadas" é requisito do criador — cada uma com peso/slot/preço que torne o kit do aventureiro uma DECISÃO de mochila, não um checkbox.

## Economia ✏️ (em discussão — acoplada ao PvP/perda de loot)

**A decisão-mãe pendente:** o jogo terá **PvP com perda de loot** (✏️ modelo a decidir — ver Aberto). Perda de loot é o churn natural de itens; o quanto de sink *artificial* a economia precisa depende dela. Discutir os dois juntos para não drenar demais a balança.

Estado da discussão:

- **Descartado:** encantamento temporário/renovável (treadmill estilo imbuement do Tibia — vira imposto).
- **Em avaliação (não decidido):** desmantelar/salvage (risco: sink demais se somado à perda de loot), *Têmpera* (encanto permanente 1/item), *Preparos* (consumíveis táticos de caçada).
- **Direções aceitas:** quests/oferendas que **consomem** itens; vendor floor; **ledger = apreciação** (itens valorizam com uso, projetos de Marca paralelos multiplicam demanda); demanda situacional por loadouts (matriz de fraquezas).
- ✏️ ainda: gold drop por tier, preços.

---

## Implicações técnicas (resumo p/ implementação)

- **Item equipável = instância com ID + ledger** desde o primeiro item do M2. Consumíveis/munição podem ser stacks ✏️ confirmar.
- Equipamento vive na sim (`src/sim/`); o client só desenha o painel (tokens de `DESIGN-VISUAL.md`).
- Eventos `equip`/`unequip` na sim — necessários para as condutas (*Pele de Ferro*, *Mão Vazia*, *Duas Mãos*) monitoradas da criação do char.
- O slot utilitário com tocha conversa com o snapshot de iluminação (raio de luz da entidade).

## Aberto / a decidir ✏️

- [ ] Lentes de Marca por slot: quais dimensões cada slot rastreia (arma=kills, escudo=bloqueios, armadura=dano absorvido, anel/colar=?)
- [ ] Fórmula de defesa em `formulas.ts` (modelo flat decidido; números e ordem das camadas ✏️ Balancista)
- [ ] Desenhar a peça-tradeoff do fim do T2 (modelo Glacier — Loremaster + Designer)
- [ ] Tabela T3 (T1 ✅ e T2 ✅ jun/2026; T3 = 15–25, o tier dos lacres e do covil do culto)
- [ ] Modelo de loot table por família/tier
- [ ] Economia: drop de gold, preços, sinks
- [ ] Durabilidade? (proposta: não — itens nunca se perdem, ver filosofia de morte)
- [ ] Limites de aninhamento/capacidade da mochila (profundidade máx? peso via Força?)
- [ ] Visibilidade de raridade na UI (cor/label × invisível) — decidir junto com a conversa de **forja** (⚠️ forja renegocia o Modelo A: "sem upgrade de raridade, sem forja destrutiva")
- [ ] Refinamento da matriz slot × bônus (famílias batizadas ✅ jun/2026)
- [ ] Kit: números (Balancista — incl. viabilidade do Priest-luva no early)

### Decididos recentemente (histórico)

- ✅ 11 slots modelo Tibia; semântica de cada slot (peito/calça-short-saia/capacete-elmo-tiara)
- ✅ 2 mãos ocupa os dois slots; dual wield exclusivo do Rogue
- ✅ Luvas não são arma (compatíveis com *Mão Vazia*/Monge, stats para todas as classes)
- ✅ *Pele de Ferro* = as 4 peças de vestir
- ✅ Mochila com containers aninhados estilo Tibia
- ✅ Utilitário: flechas consomem, tocha ilumina, charm é passivo
- ✅ Requisitos: nível (quase universal) + stats (comum) + classe (minoria); segregação por essência
- ✅ Tipos de item de mão: roster completo; subtipos físicos como camada-sussurro (teto ±10%, exceções raríssimas, imunidade só por classe de dano); wand 1H × cajado 2H; cetro = wand holy; livro com stats autorais
- ✅ Escudo: Def passiva + bloqueio em chunks (~60–80%, nunca 100%) — bloqueio total exclusivo do *Inabalável*
- ✅ Luvas: 1 slot cada (1 luva + arma/off-hand, ou 2 luvas)
- ✅ Besta no roster (arco rápido × besta pesada; virotes); regra 1H×2H (2H = +dano, paga off-hand; velocidade é da família); adaga tipo único; cetro sem trava de classe; off-hands fechadas (arma 1H/escudo/livro/luva)
- ✅ Anatomia de stats: Def física flat (Tibia Arm); atributos em item raríssimos (lendário/único + tradeoff; requisito checa base); recursos e tradeoffs autorais confirmados; +poder de cura ok; +poder mágico raro/pequeno (modelo +magic level)
- ✅ Modelo de peça (base do slot + 1 bônus de identidade; 2º só por design, nunca por raridade); joias sem Def; famílias temáticas SEM set bonus; raridade = taxonomia interna (peso/slots/fonte, não nº de stats); lendário/único = end-game via Marcas (dilema-relíquia desejado); slots de Marca ocultos no tooltip

---

## Apêndice — Estudo de referência (Tibia · Apogea · RO · OSRS · UO)

> Pesquisa de jun/2026 para embasar o vocabulário de stats. Resumo das lições; relatórios completos na conversa de design.

### Vocabulários de stats comparados

| Jogo | Stats de item | Profundidade vem de | Raridade |
|---|---|---|---|
| **Tibia** | Atk, Def, Def-mod, Arm, Range, +skill, +magic level, +speed, protection elemental %, +HP/mana, raio de luz, peso | gate de level + tier de item; imbuements (temporário) e forge (permanente) | **não tem** — Fire Sword é sempre igual |
| **Apogea** | Attack, Defense, Armor, HP/MP regen, range, peso, size | forja (combinar idênticos + ingots) + runas anexáveis + trait tree | **5 tiers** (Normal→Legendary) sobre base Tibia |
| **Ragnarok** | ATK/MATK, DEF/MDEF, slots de card, ±stats primários | **cards** em sockets (+20% vs raça X) + refino com risco | não (item base fixo + cards escolhidos) |
| **OSRS** | accuracy por estilo (stab/slash/crush/magic/ranged), Strength bonus, Magic dmg %, Prayer, attack speed | special attacks; BIS calculável | não — todo Abyssal Whip é idêntico |
| **UO (AOS)** | ~40 propriedades com **caps duros** (resists cap 70, DCI 45, LRC 100…) | alocação de orçamento até bater caps | tags nomeadas (Antique/Cursed) |

### Exemplos canônicos úteis

- **Fire Sword (Tibia)**: `Atk 24 físico + 11 fogo, Def 20+1, lvl 30` — o modelo de **dano híbrido** ("+X de fogo adicional")
- **Glacier Amulet (Tibia)**: protection ice **+20%**, mas **+10% dano recebido de energy** — tradeoff por vulnerabilidade cruzada
- **Thanatos Dagger (RO)**: MATK+130, INT/VIT+6, **LUK−6, drena 100 HP/10s** — o arquétipo "−vida +poder"
- **Wands (Tibia)**: dano **fixo** por tier, consomem mana por tiro, **não escalam** com magic level — contraste com nosso modelo (Int escala dano)
- **Armadura de metal (OSRS)**: **Magic attack negativo** — segregação por essência via stats, sem trava de classe

### As 8 lições transversais → aplicadas ao nosso jogo

1. **Item base determinístico, profundidade numa camada explícita.** RO=cards, OSRS=specs, UO=caps. **Nosso jogo já tem a camada: as Marcas** — cumprem o papel dos cards do RO, mas conquistadas por história em vez de socketadas. Não precisamos de affixes aleatórios; seria redundante e sujaria a legibilidade.
2. **"Dano vs X" é o modificador clássico** (Hydra Card +20% vs Demi-Human) — é exatamente o que Marcas dão (*Quebra-Ossos*). Validado.
3. **Tradeoffs são design intencional, nunca roll aleatório** — Glacier (resist X / vulnerável a Y), Thanatos (−HP +poder), metal (anti-mago). Nossos tradeoffs "−vida +mana" devem ser **autorais, por item**.
4. **Caps em resistências** (UO: 70%) — resist mágica/elemental de item precisa de **teto** declarado ✏️ definir o nosso.
5. **Requisito é gate, não qualidade** — nível define *quem usa*, nunca *quão bom é*. Mantém comparação entre itens limpa. Nosso modelo (nível quase universal, classe minoria) = o do Tibia.
6. **Sem rolls por instância**: todo item de mesmo nome tem os mesmos stats base. A **instância** difere pelo *ledger/Marcas* (história), não por stats rolados. Decisão de identidade do projeto.
7. **Raridade ≠ aleatoriedade**: nossa escada (comum→único) define teto de poder e slots de Marca, não rolls — mais perto do Apogea que do Diablo.
8. **Acerto vs dano**: OSRS separa accuracy de damage; Tibia nem tem accuracy (melee acerta, salvo dodge/block). **Decidido: seguir Tibia** — sem stat de acerto; esquiva só de jogador (mobs não esquivam); cajados/wands com dano fixo em faixa (não escalam com Int).
