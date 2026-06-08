# Itens — Equipamento (roster de mãos, modelos de peça, catálogos T1/T2)

> Sub-documento de [DESIGN-ITENS.md](DESIGN-ITENS.md) (o hub: decisões-mãe, slots, raridades, instância+ledger). Aqui vivem o **roster de tipos de item de mão**, os **modelos de peça/famílias temáticas**, o **kit de nascimento/rito** e os **catálogos por tier** (T1/T2 decididos; T3+ futuros). Consumíveis em [CONSUMIVEIS.md](CONSUMIVEIS.md); economia em [ECONOMIA.md](ECONOMIA.md).

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

- **1H × 2H (espada/machado/maça):** o 2H compra **dano por golpe** e paga com a **off-hand** (escudo/livro/luva). Velocidade é perfil da **família**, não das mãos — machado é lento sendo 1H ou 2H, espada é equilibrada nas duas. Quanto dano a mais ✏️ Balancista (proposta derivada: +2 a +3 de base, mesmo CD — report do catálogo).
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

1. **Def passiva** — stat constante, entra na fórmula de mitigação física normal (como peça de armadura). Sempre ativa, visível no tooltip. **No T1, o Escudo de Madeira tem Def 0 (decidido jun/2026)** — o escudo de entrada paga só em bloqueio.
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

**Números decididos (criador, jun/2026)** — proposta validada em sim (report
`docs/reports/2026-06-05-catalogo-t1-t2-proposta.md`), escala BAIXA por design (ver
`DESIGN-EVOLUCAO.md` §"Escala de números"). No T1 a diferenciação sentida é a **cadência**
(contagem de golpes vs HP baixo), não a base. Aplicados em `src/sim/items/templates.ts`.

| Tipo | Item | Par EN | Fonte | Números |
|---|---|---|---|---|
| Espada | Espada Cega → **Espada Curta** | Blunt Sword → Short Sword | casa → rito/vendor | **4 @2,0s** → **6 @2,0s** (a régua: TTK 1,95s) |
| Machado | **Machado de Mão** | Hand Axe | rito/vendor | **8 @2,4s** (golpe pesado, único que separa TTK) |
| Maça | **Clava** | Club | rito/vendor | **6 @2,1s** (identidade no subtipo impacto) |
| Adaga | **Adaga** | Dagger | rito/vendor (a 2ª no vendor = dual wield) | **5 @1,6s, Des** (a mais rápida: TTK 1,45s) |
| Arco | **Arco Curto** | Short Bow | rito/vendor | ✏️ perfil rápido — numerar com projétil na sim |
| Cajado | **Cajado de Fogo** / **Cajado de Gelo** | Fire Staff / Ice Staff | rito (escolha); o outro no vendor | faixa fixa **7–9 @2,1s** ✏️ validar com auto mágico fixo |
| Cetro | **Cetro** | Scepter | rito/vendor | faixa fixa **6–8 @2,1s** ✏️ idem |
| Luva | **Luvas de Couro** | Leather Gloves | rito (a opção-hint) / vendor | sem dano (luva não é arma — decidido) |
| Escudo | **Escudo de Madeira** | Wooden Shield | rito Knight / vendor (sem trava) | **Def 0** — escudo T1 paga em BLOQUEIO (ver Vestir abaixo) |

### Vestir T1 — vendor genérico (sem bônus)

| Item | Par EN | Slot |
|---|---|---|
| **Coifa de Couro** | Leather Coif | capacete |
| **Túnica de Couro** | Leather Tunic | armadura |
| **Calças de Couro** | Leather Trousers | calça |
| **Botas de Couro** | Leather Boots | botas |

**Def do set (decidido — criador, jun/2026): Σ alvo 2–3 no couro completo.** A flag da
proposta numerada, confirmada: com a fórmula `max(1, bruto − ΣDef)` e o rato batendo 7,
um set Σ5–6 derrubaria o dano do T1 inteiro ao piso 1 — armadura T1 apagaria o perigo T1
(anti-pilar-2). Com Σ2–3, TTL contra 2 ratos continua matando o descuidado (~20–25s). O
**escudo T1 não tem Def flat** — paga em **bloqueio** (chance ~20%, chunk 70%, provisórios
✏️). Distribuição exata por peça ✏️ fina quando a mitigação entrar na sim (M2), preservando o Σ.

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

> Números de vestir/bônus/requisitos ✏️ **Balancista** — bateria M2 (armas T1 ✅ decididas). Preços: ver [ECONOMIA.md](ECONOMIA.md). Drops de mobs T1 referenciam este catálogo (loot tables ✏️).

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

> **Aquisição É a raridade**: as duas estreias elementais nunca aparecem em NPC. Próxima arma de fogo: só tiers depois (matriz esparsa). Números T2 = **proposta ✏️** no report do catálogo (numerar contra o 1º mob T2 real, nunca contra o rato); posições/quests ✏️ world-designer M3.
