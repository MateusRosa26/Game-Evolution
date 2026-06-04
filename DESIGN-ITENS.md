# Itens & Equipamento

> Documento vivo. Seções ✏️ são preenchidas pelo criador. Este é o doc do M2 — itens são **instâncias com ledger** desde o dia 1 (decisão anti-retrofit de `DESIGN-EVOLUCAO.md`), e as raridades já nasceram alinhadas aos slots de Marca em `DESIGN-MUNDO.md`.

## Mapa de decisões

| Tema | Decisão |
|---|---|
| Slots de equipamento | **11 slots, modelo Tibia**: capacete, armadura, calça, botas, 2 mãos, colar, 2 anéis, mochila, utilitário |
| Mãos | Arma de **2 mãos ocupa os dois slots** (estilo Tibia). **Dual wield existe, restrito ao Rogue** |
| Luvas/soqueiras | Item de mão **não-arma**, com stats, usável por **qualquer classe** — equipar/lutar com luvas **não quebra** a conduta *Mão Vazia* (kills com luvas contam como desarmado p/ o Monge) |
| Condutas × slots | *Pele de Ferro* = nunca equipar **as 4 peças de vestir** (capacete/armadura/calça/botas) · *Mão Vazia* = nunca equipar **arma** (luvas ok) |
| Mochila | **Containers aninhados** estilo Tibia (mochila dentro de mochila, cada uma abre sua janela) |
| Slot utilitário | Regras por tipo: **flechas consomem** (munição), **tocha ilumina** (raio de luz pessoal), **charm é passivo** |
| Raridades | Comum → Incomum → Raro → **Lendário** → **Único** (decidido em `DESIGN-MUNDO.md`), slots de Marca 1/1/1/2/3 |
| Modelo de raridade | **Fixa por item (Modelo A, decidido)**: *Espada de Ossos* é sempre rara, sempre os mesmos stats. Sem upgrade de raridade, sem forja destrutiva, sem rolls por instância — instâncias diferem pelo **ledger/Marcas** (história), nunca por stats rolados |
| Economia de itens | ✏️ **em discussão** — acoplada à decisão de PvP/perda de loot (o churn de itens define quanto sink artificial a economia precisa). Já descartado: encantamento temporário/renovável (treadmill). Em avaliação: desmantelar/salvage, têmpera permanente, preparos consumíveis. Direções aceitas: quests/oferendas que consomem itens; ledger = apreciação com uso |
| Instâncias | Todo item equipável é **instância com ID + ledger** — contadores de Marca viajam com o item (decidido em `DESIGN-EVOLUCAO.md`) |
| Requisitos de uso | Itens têm requisito de **nível** e de **stats**: nem todos têm requisito de stats; **poucos** itens não têm requisito de nível. Restrição por **classe é minoria** — a maioria dos itens é *desinteressante* para certas classes **por essência** (stats que não servem), não por trava |
| Mitigação | **Exclusiva de itens** (decidido com `DESIGN-EVOLUCAO.md`): defesa física, resistência mágica e resists elementais são stats de equipamento — atributos nunca mitigam, só dão potência/recursos |
| Cap de resistência | Resistências (mágica/elementais) têm **teto declarado** ✏️ valor (lição UO: cap 70%) |
| Armas mágicas (cajado/wand) | Auto-attack mágico tem **dano fixo em faixa** (ex: 8–10) por tier de arma — **não escala com Int** (anti-OP de Mage). Magias/skills continuam escalando com Int |
| Acerto/esquiva | **Sem stat de acerto** (modelo Tibia). Esquiva é exclusiva de jogador — **mobs não esquivam**: o dano do jogador é sempre legível |
| Tipos de item de mão | ✏️ a aprofundar (armas por classe, escudos, cajados, livros de magia, luvas…) |
| Stats de item | ✏️ a decidir (depois de aprofundar stats de personagem) |
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
| **Nível mínimo** | quase todo item (poucos não têm) | espada longa: nível 12 |
| **Stats mínimos** | comum, mas não universal | machado pesado: Força 25 |
| **Classe** | **minoria deliberada** | cetro consagrado: só Priest |

**Princípio:** a segregação natural vem dos **stats**, não de travas. Um robe com +mana é *legal* pro Mage e *inútil* pro Knight por essência — ninguém precisa proibir nada. Restrição de classe é reservada para itens identitários (✏️ critério exato ao definir os tipos de mão).

- Item com requisito não atendido: **não equipa** (estilo Tibia ✏️ confirmar — alternativa seria equipar com penalidade; proposta: não equipa, simples e legível).

## Anatomia de um item ✏️ (próxima decisão)

Pré-requisito fechado: stats de personagem definidos em `DESIGN-EVOLUCAO.md` (atributos = potência/recursos; itens = mitigação). O que falta decidir aqui — o **vocabulário de stats de item**:

- **Mitigação** (exclusiva de itens): defesa física, resistência mágica, resists elementais (%)
- **Ofensa**: dano da arma (base + cooldown próprio), dano elemental adicional ("+X de fogo"), dano mágico ✏️
- **Recursos**: +HP/+mana flat, +regen (mana regen, HP regen) ✏️
- **Atributos**: itens podem dar +For/+Des/etc.? ✏️
- **Tradeoffs** (a personalidade dos itens): −vida +mana, +dano −defesa e nuances assim ✏️
- **Stats únicos/especiais**: velocidade de movimento (botas), raio de luz (tocha), capacidade (mochila) ✏️

## Tipos de item de mão ✏️

_(armas por classe, escudos, cajados, livros de magia, luvas — aprofundar)_

## Raridades e slots de Marca (já decidido — referência)

| Raridade | Slots de Marca | Fonte principal |
|---|---|---|
| Comum | 1 | loot de mob, mercadores |
| Incomum | 1 | loot de mob, baús escondidos/guardados, quests diretas |
| Raro | 1 | baús lacrados/secretos, quests abertas, mobs T4–T5 |
| **Lendário** | 2 | segredos profundos, lacres altos, bosses (doc futuro) |
| **Único** | 3 | eventos canônicos, world bosses — nunca de baú comum |

Cores de raridade em `DESIGN-VISUAL.md`. Itens de **facilitação** (anel de regen menor, botas do viajante…) em `DESIGN-MUNDO.md`.

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
- [ ] Stats de item e fórmula de defesa (com `formulas.ts`)
- [ ] Tipos de arma por classe + tabela inicial de itens T1–T2
- [ ] Modelo de loot table por família/tier
- [ ] Economia: drop de gold, preços, sinks
- [ ] Durabilidade? (proposta: não — itens nunca se perdem, ver filosofia de morte)
- [ ] Limites de aninhamento/capacidade da mochila (profundidade máx? peso via Força?)

### Decididos recentemente (histórico)

- ✅ 11 slots modelo Tibia; semântica de cada slot (peito/calça-short-saia/capacete-elmo-tiara)
- ✅ 2 mãos ocupa os dois slots; dual wield exclusivo do Rogue
- ✅ Luvas não são arma (compatíveis com *Mão Vazia*/Monge, stats para todas as classes)
- ✅ *Pele de Ferro* = as 4 peças de vestir
- ✅ Mochila com containers aninhados estilo Tibia
- ✅ Utilitário: flechas consomem, tocha ilumina, charm é passivo
- ✅ Requisitos: nível (quase universal) + stats (comum) + classe (minoria); segregação por essência

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
