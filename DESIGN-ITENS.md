# Itens & Equipamento

> Documento vivo. Seções ✏️ são preenchidas pelo criador. Este é o doc do M2 — itens são **instâncias com ledger** desde o dia 1 (decisão anti-retrofit de `DESIGN-EVOLUCAO.md`), e as raridades já nasceram alinhadas aos slots de Marca em `DESIGN-MUNDO.md`.
>
> **Este arquivo é o HUB** (decisões-mãe + fundamentos). Os corpos detalhados vivem em `design/itens/`:
> **[EQUIPAMENTO.md](EQUIPAMENTO.md)** (roster de mãos, modelos de peça, famílias temáticas, kit de nascimento/rito, **catálogos T1/T2**) ·
> **[CONSUMIVEIS.md](CONSUMIVEIS.md)** (comida & cozinha, poções, ferramentas) ·
> **[ECONOMIA.md](ECONOMIA.md)** (loot & gold, preços, sinks, discussão PvP/perda de loot).

## Mapa de decisões

| Tema | Decisão |
|---|---|
| Slots de equipamento | **11 slots, modelo Tibia**: capacete, armadura, calça, botas, 2 mãos, colar, 2 anéis, mochila, utilitário |
| Mãos | Arma de **2 mãos ocupa os dois slots** (estilo Tibia). **Dual wield existe, restrito ao Rogue** |
| Luvas/soqueiras | Item de mão **não-arma**, com stats, usável por **qualquer classe** — equipar/lutar com luvas **não quebra** a conduta *Mão Vazia* (kills com luvas contam como desarmado p/ o Monge). **1 slot cada**: 1 luva + arma/escudo/livro, ou 2 luvas (commit na mecânica) |
| Condutas × slots | *Pele de Ferro* = nunca equipar **as 4 peças de vestir** (capacete/armadura/calça/botas) · *Mão Vazia* = nunca equipar **arma** (luvas ok) |
| Mochila | **Containers aninhados** estilo Tibia (mochila dentro de mochila, cada uma abre sua janela). **Inicial: BOLSO de 8 slots (decidido jun/2026)** — o classless nasce apertado; a mochila da Q2 (20) é upgrade que se sente |
| Slot utilitário | Regras por tipo: **flechas/virotes consomem** (munição), **tocha ilumina** (raio de luz pessoal), **charm é passivo** |
| Raridades | Comum → Incomum → Raro → **Lendário** → **Único** (decidido em `DESIGN-MUNDO.md`), slots de Marca 1/1/1/2/3. **Raridade é taxonomia interna** (peso dos stats, slots de Marca, fonte/escassez) — **nunca** quantidade de linhas de stat; lendário/único = end-game **pelas Marcas**, poder base contido. Slots de Marca **ocultos no tooltip**. Visibilidade da raridade na UI ✏️ (acoplada à conversa futura de forja) |
| Modelo de raridade | **Fixa por item (Modelo A, decidido)**: *Espada de Ossos* é sempre rara, sempre os mesmos stats. Sem upgrade de raridade, sem forja destrutiva, sem rolls por instância — instâncias diferem pelo **ledger/Marcas** (história), nunca por stats rolados |
| Economia de itens | ✏️ **em discussão** — acoplada à decisão de PvP/perda de loot (o churn de itens define quanto sink artificial a economia precisa). Já descartado: encantamento temporário/renovável (treadmill). Em avaliação: desmantelar/salvage, têmpera permanente, preparos consumíveis. Direções aceitas: quests/oferendas que consomem itens; ledger = apreciação com uso. Detalhe em [ECONOMIA.md](ECONOMIA.md) |
| Instâncias | Todo item equipável é **instância com ID + ledger** — contadores de Marca viajam com o item (decidido em `DESIGN-EVOLUCAO.md`) |
| Requisitos de uso | Itens têm requisito de **nível** (o gate mais comum) e de **stats** (comum, não universal). Restrição por **classe é virtualmente zero em armas** e raríssima no geral — a segregação é **por essência** (stats que não servem àquela classe), não por trava |
| Mitigação | **Exclusiva de itens** (decidido com `DESIGN-EVOLUCAO.md`): defesa física, resistência mágica e resists elementais são stats de equipamento — atributos nunca mitigam, só dão potência/recursos. **Def física é FLAT** (cada hit físico chega −X, modelo Tibia Arm); resists mágica/elementais são % |
| Cap de resistência | Resistências (mágica/elementais) têm **teto declarado** ✏️ valor (lição UO: cap 70%) |
| Armas mágicas (cajado/wand) | Auto-attack mágico tem **dano fixo em faixa** (ex: 8–10) por tier de arma — **não escala com Int** (anti-OP de Mage). Magias/skills continuam escalando com Int. **Wand 1H × cajado 2H = escolha de loadout do caster**; cetro = a wand holy do Priest; wands/cajados vêm por elemento |
| Variância de dano | **Físico (AD) é *swingy*; mágico (AP) é constante** (decidido criador jun/2026, estilo Tibia/Apogea — a diferença é identitária, não cosmética). Todo golpe **físico** rola em **±40%** em torno da média (`PHYSICAL_DAMAGE_SPREAD`, **mean-preserving**: a média vem da fórmula, o balance/DPS calibrado não muda — muda só o *feel*, AD imprevisível × AP confiável). **Magias/skills (AP) NÃO rolam** — dano exato. *Exceção:* a wand auto-attack tem faixa fixa pequena por tier (linha acima), não o spread largo do AD. **Mobs seguem a mesma física (jun/2026, commit `8e98d14`):** ataque básico **±40%** (o mesmo knob do player); **move telegrafado/slam ±20%** (`MONSTER_MOVE_DAMAGE_SPREAD`, faixa apertada **de propósito** — o telegraph promete um número, o desvio é a mecânica, não a sorte). Spread é **global, não por-mob** (uma língua só); detalhe do mob em `design/bestiario/MECANICAS-DE-MOB.md` §7 |
| Acerto/esquiva | **Sem stat de acerto** (modelo Tibia). Esquiva é exclusiva de jogador — **mobs não esquivam**: o dano do jogador é sempre legível |
| Tipos de item de mão | **Decidido (jun/2026)** — roster completo em [EQUIPAMENTO.md](EQUIPAMENTO.md). Trio For diferenciado por **subtipos físicos sutis** (corte/impacto/perfuração, teto **±10%**, camada-sussurro) + perfil numérico; **arco × besta** (rápido × pesado, flechas × virotes); **2H compra dano, paga a off-hand** (velocidade é da família); adaga tipo único; casters wand 1H × cajado 2H; cetro **sem trava**; livro de magia com stats autorais; escudo = Def passiva + bloqueio em chunks (nunca 100%); luva = 1 slot cada |
| Stats de item | **Decidido (jun/2026)**: Def física **flat**; atributos em item **raríssimos** (só lendário/único, sempre com tradeoff; **requisito de equip checa atributo base**, nunca bônus de item); recursos (+HP/mana, +regen) ok; tradeoffs autorais; +poder de cura ok; **+poder mágico raro e pequeno**, muitas vezes com tradeoff. **Modelo de peça**: base do slot + **1 bônus de identidade** (2º só quando o design pede, ex. tradeoff — nunca função da raridade); **joias sem Def física** |
| Famílias de equipamento | **Famílias temáticas SEM set bonus (decidido)**: cada peça carrega o tema sozinha, mix-and-match livre; a camada "conjunto com história" é das Marcas. Cadência de conteúdo: básicos → diversificados → tradeoffs → lendários/únicos de evento, **limitadíssimos**. As 6 famílias batizadas em [EQUIPAMENTO.md](EQUIPAMENTO.md) |
| Tabelas T1/T2 | **Decididas (jun/2026)** — catálogos completos em [EQUIPAMENTO.md](EQUIPAMENTO.md). **Matriz esparsa** (modelo Tibia): nunca preencher tipo×elemento×tier; armas T1 sem bônus (**números T1 decididos** — espada 6@2,0s etc., Def couro Σ2–3); T2 = tier das estreias com vendor só de ponte; 1ªs armas elementais **nunca compráveis** |
| Loot tables | ✏️ a decidir (modelo por família/tier — os catálogos T1/T2 são o conteúdo a distribuir). Ver [ECONOMIA.md](ECONOMIA.md) |
| Entrega de loot | **Cadáver-container (decidido jun/2026, modelo Tibia)**: mob morre → corpo clicável no chão abre janela com gold+itens; decai ~3min ✏️. UI de itens: **drag & drop** desde o MVP |
| Economia / gold | **1º passe calibrado (criador + Balancista, jun/2026)** — régua "tudo baixo": rato 0–1 (média ~0,4); gold/h T1 40–80 nu / 120–220 informado; **Poção Pequena 65 = luxo**; skill do tier seguinte 150–300 = sink âncora; arco do early fecha justo. Tabela completa em [ECONOMIA.md](ECONOMIA.md); report `docs/reports/2026-06-05-economia-gold-passe1.md`. ✏️ validar na sim (M2) |
| Comida / poções / ferramentas | Fome = portão do regen (modelo de duração); cozinha sem skill-level, receitas como conhecimento; poção = emergência cara em 3 tamanhos; corda/pá permanentes, tocha consumível. Detalhe em [CONSUMIVEIS.md](CONSUMIVEIS.md) |

---

## Slots de equipamento (decidido — modelo Tibia)

**11 slots:**

| Slot | Qtd | O que entra | Notas |
|---|---|---|---|
| **Capacete** | 1 | capacetes, elmos, tiaras | |
| **Armadura** | 1 | peças de **peito**: peitorais, túnicas, robes | a peça central de defesa |
| **Calça** | 1 | calças, shorts, saias | |
| **Botas** | 1 | botas, sapatos | lar natural dos itens de facilitação (*botas do viajante*) |
| **Mão** | 2 | armas, escudos, cajados, livros de magia, luvas/soqueiras… | 2 mãos ocupa os dois slots; dual wield só Rogue; tipos em [EQUIPAMENTO.md](EQUIPAMENTO.md) |
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
- Ordem das camadas de mitigação no cálculo: **provisório de paper (jun/2026)** — bloqueio % → Def flat → piso 1 (resists % só na parcela elemental); fórmula `final = max(1, bruto − ΣDef)` ✏️ validar na implementação (report `2026-06-04-balance-consolidacao-kit-itens.md`).

## Raridade re-fundamentada (decidido)

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

---

## Implicações técnicas (resumo p/ implementação)

- **Item equipável = instância com ID + ledger** desde o primeiro item do M2. Consumíveis/munição podem ser stacks ✏️ confirmar.
- Equipamento vive na sim (`src/sim/`); o client só desenha o painel (tokens de `DESIGN-VISUAL.md`).
- Eventos `equip`/`unequip` na sim — necessários para as condutas (*Pele de Ferro*, *Mão Vazia*, *Duas Mãos*) monitoradas da criação do char.
- O slot utilitário com tocha conversa com o snapshot de iluminação (raio de luz da entidade).

## Aberto / a decidir ✏️

- [ ] Lentes de Marca por slot: quais dimensões cada slot rastreia (arma=kills, escudo=bloqueios, armadura=dano absorvido, anel/colar=?)
- [ ] Fórmula de defesa em `formulas.ts` (modelo flat decidido; Σ couro T1 = 2–3 decidido; distribuição por peça e ordem das camadas ✏️ na implementação)
- [ ] Desenhar a peça-tradeoff do fim do T2 (modelo Glacier — Loremaster + Designer)
- [ ] Tabela T3 (T1 ✅ e T2 ✅ jun/2026; T3 = 15–25, o tier dos lacres e do covil do culto)
- [ ] Modelo de loot table por família/tier
- [ ] Economia: ~~drop de gold T1, preços~~ ✅ 1º passe (jun/2026); sinks estruturais seguem acoplados ao PvP/perda de loot ([ECONOMIA.md](ECONOMIA.md))
- [ ] Durabilidade? (proposta: não — itens nunca se perdem, ver filosofia de morte)
- [x] **Peso/cap via Força — implementado jun/2026**: todo item tem `weight`; **ouro pesa com TETO** (`0.1`/moeda só nas primeiras **150 moedas** → máx 15 de peso; 200 ouro = 15; stack ilimitado — decisão do criador); **pesos escala-Tibia** (espada 35, machado 25, adaga 10, placa ~120…); **cap híbrido** `base + Força×k + capPerLevel[classe]×(nível−1)` (cresce auto por classe/nível — Knight>Rogue>Priest>Mage — Força dá bônus). Estudo: `docs/reports/2026-06-08-peso-cap-estudo.md` (✏️ números Balancista). Enforcement modelo Tibia: só bloqueia ao trazer peso novo (pegar/equipar de cadáver); mover entre as próprias coisas é livre; shift-loot de ouro pega só o que cabe no peso. **Cria a "decisão de mochila"** (pilar). Cap no painel C. ✏️ ainda: aninhamento de mochila (profundidade máx) — soma de peso já está pronta pra incluir aninhados.
- [ ] Visibilidade de raridade na UI (cor/label × invisível) — decidir junto com a conversa de **forja** (⚠️ forja renegocia o Modelo A: "sem upgrade de raridade, sem forja destrutiva")
- [ ] Refinamento da matriz slot × bônus (famílias batizadas ✅ jun/2026)
- [ ] Kit: números (Balancista — armas T1 ✅; resta viabilidade do Priest-luva no early, vestir/bônus)

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
- ✅ **Armas T1 numeradas e aplicadas na sim** (jun/2026): Cega 4@2,0s · Curta 6@2,0s · Machado 8@2,4s · Clava 6@2,1s · Adaga 5@1,6s Des; **Def couro Σ2–3**, escudo T1 Def 0 (bloqueio); régua "tudo baixo"
- ✅ **Gold T1 — 1º passe** (jun/2026): drops/preços/sinks calibrados; Poção Pequena 65; gold por quest distribuído ([ECONOMIA.md](ECONOMIA.md))
- ✅ **Doc dividido em hub + sub-docs** (jun/2026): `design/itens/` — EQUIPAMENTO · CONSUMIVEIS · ECONOMIA

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
