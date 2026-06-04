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
| Loot tables | ✏️ a decidir (modelo por família/tier) |
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

**Famílias temáticas — SEM set bonus (decidido):** linhas de gear com tema onde **cada peça carrega o tema sozinha** (capuz, robe e calça do erudito dão mana/regen cada um — usar várias soma naturalmente; misturar linhas é livre e eficiente). Sem bônus por completar conjunto: a camada "conjunto com história" é das **Marcas**, e o mix-and-match é onde mora a expressão de build num jogo sem subclasses. Famílias-exemplo (nomes ✏️ Loremaster): sustain arcano (mana/regen) · potência mágica · dano elemental · caçador (distância) · bastião (Def/HP) · templário (holy/cura).

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
- **Divisão de papéis:** a matriz **elemental** do bestiário é quem carrega a demanda situacional de loadout — e mesmo ela segue a **"Regra 10–20"**: norma ±10–20%, poucos quebradores autorais identitários (~125% / ~70%) e imunidade (0%) raríssima e temática (golem de pedra × terra, undead × sombrio). Escala completa em `DESIGN-BESTIARIO.md` ("Escala de multiplicadores"). O subtipo físico (±10%) é a camada-sussurro abaixo dela.

### Regras transversais do roster (decidido)

- **1H × 2H (espada/machado/maça):** o 2H compra **dano por golpe** e paga com a **off-hand** (escudo/livro/luva). Velocidade é perfil da **família**, não das mãos — machado é lento sendo 1H ou 2H, espada é equilibrada nas duas. Quanto dano a mais ✏️ Balancista.
- **Arco × besta:** arco = cadência rápida, dano menor · besta = lenta, golpe pesado — o perfil espada×machado do ranged. Munições distintas (**flechas × virotes**), ambas no utilitário, consomem.
- **Adaga é tipo único** — sem subtipos; a variedade vem de itens autorais (adaga com veneno, +sombrio, lendárias…). Mantém a lente de Marca do Rogue coesa.
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
2. **Bloqueio** — chance % de bloquear; ao bloquear, absorve **% grande do golpe (✏️ ~60–80%, Balancista), nunca 100%** — sempre vaza dano. Cada bloqueio emite o evento `block` (contador do *Inabalável*).

**Bloqueio total é exclusivo do Caminho *Inabalável*** (50k bloqueios): a recompensa lendária é fazer o que nenhum escudo do jogo faz. Por isso o bloqueio comum *nunca* chega a 100% — é regra de identidade, não só de balance.

### Luvas/soqueiras (decidido)

**1 slot de mão cada.** Combinações: 1 luva + arma 1H · 1 luva + escudo/livro · **2 luvas = commit na mecânica do item** (dois pacotes de stats, mãos vazias de arma). Luva não impede segurar machado/espada na outra mão. Continua não-arma: nenhuma combinação com luva quebra *Mão Vazia* — só a arma quebra.

## Itens de nascimento & kit de classe (em desenho — jun/2026)

Com o início **sem classe** (decidido — `DESIGN-EVOLUCAO.md`), o "kit inicial" se divide em dois momentos:

| Momento | Conteúdo | Status |
|---|---|---|
| **Nascimento (classless)** | **coletado na casa inicial** (tutorial diegético — `DESIGN-MUNDO.md`): 1–2 armaduras simples + **arma genérica** (✏️ qual — porrete/faca?) + **sacola**, tirados de containers domésticos; a 1ª chave abre a porta de saída. Sem skills, sem capacete | estrutura decidida; itens ✏️ |
| **Rito de classe** | o NPC entrega a **arma do kit**: espada curta + escudo (Knight) · cajado simples (Mage ✏️ elemento/mãos) · adaga (Rogue ✏️ 1 ou 2) · cetro (Priest) | estrutura decidida; detalhes ✏️ |

Princípios (propostos nesta sessão, a confirmar com os detalhes ✏️):

- **Itens de kit têm base do slot e ZERO bônus de identidade** — são a régua do zero; o primeiro item com bônus (comprado/dropado) é o momento "entendi o que itens fazem".
- **Valor de venda ≈ 0** (anti-loop de gold) e sem requisitos.
- **Instâncias com ledger desde o nascimento** — a arma do rito tem 1 slot de Marca: quem nunca trocar pode transformá-la em relíquia (pilar 6 desde o minuto 1).
- Skills nunca vêm em kit nenhum — todas compradas (básicas quase grátis).

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

## Loot tables ✏️

_(modelo por família/tier — não as 48 tabelas à mão)_

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
- [ ] Tabela inicial de itens T1–T2 (tipos fechados ✅; nomes c/ Loremaster, números c/ Balancista)
- [ ] Modelo de loot table por família/tier
- [ ] Economia: drop de gold, preços, sinks
- [ ] Durabilidade? (proposta: não — itens nunca se perdem, ver filosofia de morte)
- [ ] Limites de aninhamento/capacidade da mochila (profundidade máx? peso via Força?)
- [ ] Visibilidade de raridade na UI (cor/label × invisível) — decidir junto com a conversa de **forja** (⚠️ forja renegocia o Modelo A: "sem upgrade de raridade, sem forja destrutiva")
- [ ] Nomes das famílias de equipamento (Loremaster) + refinamento da matriz slot × bônus
- [ ] Kit de nascimento/rito: arma genérica do classless; elemento e mãos do cajado do Mage; 1×2 adagas do Rogue; vestes variam por visual?; extras (tocha?)

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
