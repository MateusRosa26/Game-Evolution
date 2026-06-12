# Skills & Magias — Hub

> **Documento-mãe das skills.** Aqui vivem as decisões de estrutura: como uma skill é gateada, o que justifica caçá-la, a regra anti-treadmill e o espinho de progressão. O **catálogo** (roster + fichas das ~35 skills) vive em `design/skills/CATALOGO.md`. Em conflito, a constituição (`DESIGN-FILOSOFIA.md`) vence; a camada sólida/emergente é definida em `DESIGN-EVOLUCAO.md`.
>
> Spin-out de `DESIGN-EVOLUCAO.md` (jun/2026): o EVOLUCAO mantém **aquisição de skills** (camada sólida, sem árvore de pontos) e **Mutações** (camada emergente); este hub mantém **gating, progressão e o catálogo**.

## Mapa de decisões

| Tema | Estado |
|---|---|
| Gating por **atributo + nível** (nunca por classe) | ✅ decidido (jun/2026) |
| **Heal / Cura** universal, escala Espírito — todos conjuram | ✅ decidido |
| **Nomes**: pares EN/PT, descritivos, **sem palavra de encantamento inventada** (magia = mutação biológica, não fala — ver §7) | ✅ decidido (jun/2026) |
| Eixo **dano = gear + atributos**; eixo **novidade = skills** | ✅ decidido (jun/2026) |
| Anti-treadmill **puro Koster: skill nova = verbo novo**, nunca "versão maior" | ✅ decidido (jun/2026) |
| **Espinho de 5 bandas** (abertura → caixa de ferramentas → 2º eixo → AoE → maestria) | ✅ estrutura decidida; níveis exatos ✏️ Balancista |
| **AoE-de-dano gate ~lvl 20** para qualquer classe | ✅ decidido |
| Assimetria de contagem **Int > Esp > Des > For** (emerge do espaço de cada atributo) | ✅ decidido |
| Catálogo-alvo **~35 skills** (5 universais + ~30 por afinidade) | ✅ decidido (jun/2026) |
| Cada **elemento** carrega um status distinto (senão é reskin) | ✏️ atribuir status por elemento (designer + Balancista) |
| 2ª cura = **cura em grupo** (verbo distinto: área, gate Esp/lvl maior, mana maior) — NÃO "Heal maior" | ✅ decidido (jun/2026) · ver §3 |
| **Conjuração = hotkey/action-bar (Apogea)**, não digitação de encantamento (Tibia) | ✅ decidido (jun/2026) |
| Níveis exatos, custo, cooldown, dano de cada skill | ✏️ Balancista |
| Nomes finais | ✏️ Loremaster |
| Fonte concreta (NPC/drop/quest, onde no mapa) | ✏️ world-design, nas specs de fatia |

---

## 1. Modelo de gating — por requisito, não por classe (decidido jun/2026)

A lista de skills é **uma só, organizada por requisito** — não existe "skills do Mage" vs "skills do Knight". O que você pode aprender é gateado por **atributo + nível** (+ gold/fonte), **não pela classe** (modelo *gems* do Path of Exile).

**Racional:** anda de mãos dadas com o **custo-crescente de atributos** — um híbrido (Knight que bomba Int pra lançar fogo) é possível, mas **naturalmente caro** (medíocre nos dois), então o balance se resolve sozinho. Serve o **pilar 6**: a "subclasse" *spellblade* emerge da distribuição de pontos, não de um menu.

| O que a **classe** decide | O que o **atributo** decide |
|---|---|
| Ingresso (classless **não** treina nada) · lente de Marca · corpo automático + atributos iniciais + desconto no stat principal · arma do rito — **nenhuma magia** | **Quais** skills você pode aprender (atributo + nível mínimo) |

**Mapa de afinidade (qual atributo gateia o quê):**

| Atributo | Gateia |
|---|---|
| **Força** | marciais ofensivas (golpes, charge) |
| **Vitalidade** | defensivas / controle de tank |
| **Destreza** | adaga/precisão, veneno, mobilidade furtiva, conjurar munição, ranged |
| **Inteligência** | elemental (fogo/gelo/terra/raio/morte), arcano, controle mágico |
| **Espírito** | potência de cura, luz **e sagrado/anti-profano** |

**Sem exceções:** nenhuma magia é exclusiva de classe. O **sagrado** é gate por **Espírito + nível** como todo o resto; o Priest continua o melhor conjurador sagrado porque seu **corpo automático bomba Espírito**, não porque a magia seja dele. *(Capstones e Caminhos seguem sendo especialização **emergente** da classe — via Marca/conduta, não magia de tomo.)*

**Taxonomia:** **Universais** (gate baixo/nenhum) · **Por afinidade** (a maioria). A **fonte** (NPC/drop/quest) é um eixo ortogonal ao requisito (ver *Aquisição de Skills* em `DESIGN-EVOLUCAO.md`).

---

## 2. Os três eixos: dano × novidade × XP/hora (decidido jun/2026)

Uma skill se justifica quando **muda como você joga ou farma** — não quando dá um número maior. Por isso os três eixos têm **donos diferentes**:

| Eixo | Quem carrega | Por quê |
|---|---|---|
| **Dano (curva suave)** | **atributos + gear** (cajados pro caster, armas pro marcial) | É a camada sólida, previsível. "A progressão do tiro básico do mago vem de comprar wands melhores, como o guerreiro troca de arma" (Balancista, bateria T2). |
| **Novidade (degraus de verbo)** | **skills** | Cada skill nova é uma *interação nova* (DoT, slow, backstab, AoE, taunt, charge), nunca "+15% na mesma ação". |
| **XP/hora** | a combinação | A skill se paga quando **move a taxa de farm** OU **abre um tipo de conteúdo** (packs, ranged, undead). |

**Consequência prática:** você não sobe de dano *pegando skills*; sobe *subindo o atributo e comprando o gear do próximo tier*. A skill que você caça te dá um **verbo novo** — e é isso que justifica a caçada.

---

## 3. Regra anti-treadmill — puro Koster: só verbos novos (decidido jun/2026)

> Pilar 7 + Koster (`design/ESTUDO-REFERENCIAS.md` §2): recompensa boa = "vara nova pra cutucar a colmeia" (interação nova), nunca "Fireball VI" (mesma magia, número maior).

**Regra:** **nenhuma skill é a "versão maior" de outra.** Não existe escada Heal → Heal Grande → Heal Supremo (o vício do *exura gran* do Tibia). A escala numérica mora em stat+gear (§2); a lista de skills é uma coleção de **verbos distintos**.

Isto já é prática do projeto: *Passo das Sombras* e *Leque de Facas* foram **removidas** (jun/2026) por sobreporem verbos que o Rogue já tinha. Esta regra só formaliza o critério.

**Corolário A — elemento sem status próprio é reskin.** Um leque de elementos (fogo/gelo/terra/raio/morte) só passa no puro-Koster se **cada elemento carregar uma mecânica distinta**, senão é "Bola de Fogo pintada de roxo". Proposta de atribuição (✏️ designer + Balancista):

| Elemento | Verbo (status/mecânica) |
|---|---|
| Fogo | DoT (queimadura que tica) |
| Gelo | slow / freeze |
| Terra | root **ou** quebra-armadura (reduz defesa física) |
| Raio | hit instantâneo (sem viagem de projétil) **ou** salta entre alvos próximos |
| Morte | lifedrain **ou** maldição (reduz cura recebida) |

**Corolário B — a 2ª cura é a CURA EM GRUPO (decidido jun/2026).** O Priest não ganha "Heal maior" (seria treadmill). Ganha um **verbo distinto: cura em área/grupo** — alvo-em-área ≠ alvo-único, exatamente como AoE-dano ≠ dano single. Diferenciação por **mecanismo + gate**, não por número:
- **Gate maior:** exige **mais Espírito + nível** que o Heal individual.
- **Custo maior:** **mais mana** por cast.
- **Verbo:** cura todos os aliados numa área (brilha no online; solo cura só você no raio). O Heal individual continua o spam barato do dia a dia.

Passa no puro-Koster: não é um Heal inflado, é uma ferramenta com regra própria (posicionamento do grupo). Nome ✏️ Loremaster.

**Corolário C — a REGRA DE 3 PARTES para Mutações (decidido jun/2026).** "Verbo vs número" é fuzzy na prática (até mutações de caster escorregam pra "base + bônus"). O teste operacional: **uma Mutação é válida se tiver PELO MENOS UMA das três** —

1. **Condicional** — o ganho só vale às vezes (vs família, HP baixo, cercado, alvo já-em-status…). Não é always-on.
2. **Tradeoff** — abre mão de algo da base (alcance, single-target, pierce, burst→DoT).
3. **Decisão nova** — muda COMO se joga (posição, combo de setup, escolha de alvo).

**Veta SÓ:** "+X% sempre, sem condição, sem tradeoff, sem decisão nova" (flat incondicional = treadmill + escolha falsa + zero identidade/nome). **Consequência libertadora:** dano CONDICIONAL é verbo — um melee pode "bater mais forte" como *ignora-armadura* (brilha vs blindado), *executar* (alvo em HP baixo), *Vulnerável* (janela de combo) sem cair no treadmill. Vale igual p/ caster e melee. **Por que não aceitar o número flat:** por-feature ele é mais fácil de balancear, mas no sistema ele infla (rescala o jogo inteiro), é sempre-pego (sem gameplay) e não vira nome (mata o Pilar 5). Auditoria de todas as mutações contra esta regra: `docs/reports/2026-06-11-audit-mutacoes-regra-3-partes.md`.

- **Régua de magnitude (criador, jun/2026):** bônus condicional **pequeno** ancora em **~7-10%** (armor-pen, +cura, +dano de abertura). Vulnerável/debuffs de setup são **self-only** por padrão (evita virar imposto de party). Números finos = ✏️ Balancista.

**Corolário D — a Mutação respeita o TIER da skill base (decidido jun/2026).** Skill de **entrada** muta **modesto**; **mecânica high-level** (CC forte, zonas de chão, links entre alvos, deslocamento forçado) fica **reservada às skills de tier alto**. Gastar um verbo caro numa skill básica (a) **desperdiça o verbo** e (b) **incha o pool** de uma skill que devia ser simples — e há skills de tier alto esperando justamente esses verbos (ex.: o leque de gelo *Blizzard/Wall/Frost Lance* — o CC/zona pesado mora nas de cima, não na lança de entrada). **Corolário operacional:** pools inchados (>3 mutações possíveis numa skill básica) são sinal de revisão; alvo **2-3 por skill**.

---

## 4. O espinho de progressão — 5 bandas (estrutura decidida; níveis ✏️ Balancista)

O loop do MVP vai até ~lvl 25. Cada skill se ancora numa banda; a banda diz **o que ela muda na sua vida**:

| Banda | Nível ✏️ | O que destrava | Efeito no XP/h | Novidade |
|---|---|---|---|---|
| **① Abertura** | 1–6 | auto + **Cura** + 1ª skill de dano da afinidade | baseline | "tenho um botão" |
| **② Caixa de ferramentas** | 6–12 | controle / sustain / defesa (slow, taunt, veneno, Baluarte, Muralha, Barreira, Escudo, Purificar) | indireto (sobrevive a spot mais duro) | "administro a luta, não só troco hit" |
| **③ Segundo eixo de dano** | 12–18 | 2ª ferramenta ofensiva / 2º elemento / charge / ranged | + alvos viáveis | "tenho resposta pra cada situação" |
| **④ Power spike de AoE** | **~18–20** | **Redemoinho / Onda de Chamas / Chuva de Lâminas / Explosão de Luz** | **SALTO em degrau** | "deleto packs" |
| **⑤ Maestria / nicho (T3)** | 20–25 | Terra/Raio/Morte, Punhos da Fé, Exorcismo, combos elementais | eficiência fina + abre T3 | especialização |

A banda ④ é a **única** exceção legítima ao "skill não move a curva de dano" — o AoE é o power spike de eficiência de farm, deliberado e gateado em ~lvl 20 para **qualquer** classe (ver §6). Packs entre lvl 10–20 **se administram** (single-pull, kite, Muralha, defensivas); aos 20 você **merece** deletá-los.

---

## 5. Assimetria de contagem — emerge do espaço do atributo (decidido)

A ordem que o criador quer — **Mage > Priest > Rogue > Knight**, Knight com menos — **não precisa de regra**: cai sozinha do tamanho do espaço que cada atributo gateia.

- **Inteligência** abre um espaço **combinatório**: 5 elementos × (single / controle / AoE) → o maior catálogo.
- **Espírito** abre cura + sagrado + buffs → segundo.
- **Destreza** abre adaga/veneno/precisão/furtividade/ranged → médio.
- **Força/Vit** abre golpes + charge + tank → o menor leque, mas cada um de alto impacto.

**Alvo de contagem (≈35 total):** Universais **5** · Int **~11** · Esp **~8** · Des **~6** · For/Vit **~5**.

**O contrapeso do Knight (proteger no playtest):** "menos skills" tem o risco de virar a classe chata. A defesa está no design e **não se resolve dando mais skills** (isso mataria a assimetria):
- A profundidade do Knight é **vertical** — poucos verbos, mas **corpo automático altíssimo** (HP/cap) + os **Caminhos mais ricos** do jogo (*Inabalável*, *Fúria Encurralada*, *Duas Mãos*).
- A profundidade do Mage é **horizontal** — muitos verbos, corpo frágil (glass cannon).
- Se o Knight parecer pobre no playtest, a resposta é **número/Caminho**, não mais skill.

---

## 6. Gating de AoE + a virada de meio-jogo (decidido jun/2026)

O **power spike** de farm — deletar packs — é o prêmio de meio-jogo (~lvl 20), não ferramenta de early. Mas "AoE" não é uma coisa só. **Três vias:**

| Via | Quando | Quem | Exemplos |
|---|---|---|---|
| **Controle / utilidade** (gerencia, dano desprezível) | cedo (banda ②) | qualquer atributo | *Nevasca* (slow-field), *Grito de Guerra* (taunt), *Muralha* (funil), *Consagrar* (zona) |
| **Chip fraco** (lasca/tagueia o grupo, **não deleta**) | cedo (banda ②) | **só Int (Mage)** — é o diferenciador da classe-AoE | *Sparks / Fagulhas* — chain fraco entre 2–3 alvos |
| **Deleter** (limpa o pack) | **~lvl 20** | qualquer atributo | *Whirlwind*, *Flame Wave*, *Storm*, *Steelstorm*, *Burst of Light*, variantes em área |

**Por que o chip fraco do Mage não fura a regra:** ele **não deleta** — só amacia/marca, então packs continuam exigindo posicionamento (a regra do pilar 2 vale igual). É a *fantasia* da classe-AoE chegando cedo em **dose**, não em **poder**. ⚠️ **Guardrail do Balancista:** o chip-AoE tem teto de dano / escala **sublinear** com Int — não pode virar deleter num Mage de Int alto (senão fura o gate ~20).

**A virada do ~lvl 20 — caça em *pools*.** Aos 20 a classe-AoE ganha **vários** AoE-deleter que **combinam** (ex.: *Garras da Terra* prende o pool → *Flame Wave* + *Storm* deletam; os Caminhos elementais — *Senhor dos Extremos* — amplificam o combo). Isso destrava um **estilo de caça novo**: empilhar X mobs num *pool* e ceifar — eficiência de farm que o single-pull não dá.

**Consequência (pilar 2):** packs no intervalo lvl 10–20 **não se deletam, se administram** (single-pull, kite, funil, defensivas; o Mage *amacia* com o chip). O pack continua perigoso até você merecer o deleter @20.

### Topologia de spawn ↔ classe (pós-20 — princípio de world-design)

A partir do ~lvl 20, os **hunting grounds se diferenciam por classe via a FORMA do spawn** (não por "loot de classe" — pilar 8). O mesmo tier tem spots com assinaturas diferentes:

- **Pool denso / sala aberta** (muitos mobs juntos) → paraíso de **AoE** (Mage, Priest com *Burst of Light*): empilha e ceifa.
- **Corredor / single-file / spawn esparso** → **single-target / burst** (Rogue, Knight): mata um a um, rápido.
- **Spawn de alto dano / poucos mas perigosos** → **tank/sustain** (Knight out-last, Priest cura).

O jogador não é trancado — qualquer classe caça em qualquer lugar —, mas **o spot mais eficiente para VOCÊ depende da sua classe**, e descobrir isso é jogar bem (pilar 1/4). **Detalhado no world-design:** `design/mundo/EXPLORACAO.md` §"Topologia de spawn ↔ classe" (com as regras anti-lock e o lean de região). O mapeamento concreto por-spot fica ✏️ nas specs de fatia. Aqui no hub fica só o que o kit assume.

---

## 7. Nomes & idioma (decidido jun/2026)

**Nada de palavra de encantamento inventada (estilo *exura*/*utevo lux*).** No cânone (`DESIGN-LORE.md`), magia é **mutação biológica** dos humanos no planeta novo — manifestação do corpo, não fórmula recitada. Logo o nome descreve o **ato/efeito**, não um vocábulo arcano falso. (Bônus: foge do gimmick — e do plágio — do Tibia.)

**Conjuração = hotkey / action-bar (modelo Apogea), não digitação (modelo Tibia).** A skill mora num slot da barra (`SkillBar.ts`); o jogador **aperta a tecla** e ela dispara (no alvo/cursor), gate de uso = cooldown. Isso reforça o ponto acima: não existe "palavra mágica" a digitar — então o nome é só rótulo de UI, e tem que ser limpo e legível.

- **Par EN/PT obrigatório** (metodologia de `DESIGN-MUNDO.md` §Nomenclatura): toda skill nasce com os dois nomes; o jogador vê o do seu idioma. Ex.: *Heal / Cura*, *Fireball / Bola de Fogo*, *Blade Rain / Chuva de Lâminas*. Nome que só funciona numa língua → trocar.
- **Registro:** funcional-evocativo, **legível** (a skill é camada sólida, clara por contrato) — 1–3 palavras. O peso mítico/críptico (FromSoft) fica **reservado às Mutações** (*Fogo Voraz*, *Mão Vazia*) e Marcas, não aos nomes-base.
- **Invariantes** (a mesma palavra soa nas duas línguas) são bem-vindos quando elegantes: *Lume*.
- **Confirmados (criador, jun/2026):** Heal/Cura · Lume · Conjure Arrow/Conjurar Flechas · Blessing/Bênção · Rend/Retalho · Steelstorm/Vendaval de Aço · Earthen Grasp/Garras da Terra · Life Drain/Dreno Vital · Sacred Aura/Aura Sagrada. Demais pares EN = draft no catálogo (✏️ refinar com Loremaster). Fonossemântica e nomes das Mutações/Caminhos seguem em `design/skills/CATALOGO.md` + `DESIGN-EVOLUCAO.md`.

---

## Arquitetura

Toda skill nasce como **dado declarativo** (`src/sim/skills/` — `SkillDef` em `types.ts`, números em `numbers.ts`). Adicionar skill = adicionar uma entrada, não código. Determinístico/serializável; zero pixi/browser. O perfil de uso rastreado no evento `skill_use` alimenta as **Mutações** (ver `DESIGN-EVOLUCAO.md` §Mutações de Skill).

> **Primitivos novos a implementar** (o catálogo ~38 pede targetings/mecânicas que a engine ainda não tem — hoje só meleeTarget/meleePositional/projectileTarget/lineThrough/healTarget): **cast-time, skillshot de área (`groundTarget`), burst radial (`selfRadius`), chain, lifedrain, status declarativo** (+ root/bleed/poison). Spec-de-dados completa (campos, mapa skill→primitivo, mudanças de protocolo): `docs/reports/2026-06-11-spec-targetings-novos.md`. Números: `docs/reports/2026-06-11-briefing-balancista-skills.md`.

→ **Catálogo completo (roster + fichas):** `design/skills/CATALOGO.md`
→ **Aquisição (sem árvore de pontos) + Mutações:** `DESIGN-EVOLUCAO.md`
→ **Classes (corpo automático, atributos iniciais, Caminhos):** `DESIGN-EVOLUCAO.md` §Classes
