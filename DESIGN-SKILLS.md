# Skills & Magias — Hub

> **Documento-mãe das skills.** Aqui vivem as decisões de estrutura: como uma skill é gateada, o que justifica caçá-la, a regra anti-treadmill e o espinho de progressão. O **catálogo** (roster + fichas das ~35 skills) vive em `design/skills/CATALOGO.md`. Em conflito, a constituição (`DESIGN-FILOSOFIA.md`) vence; a camada sólida/emergente é definida em `DESIGN-EVOLUCAO.md`.
>
> Spin-out de `DESIGN-EVOLUCAO.md` (jun/2026): o EVOLUCAO mantém **aquisição de skills** (camada sólida, sem árvore de pontos) e **Mutações** (camada emergente); este hub mantém **gating, progressão e o catálogo**.

## Mapa de decisões

| Tema | Estado |
|---|---|
| Gating por **atributo + nível** (nunca por classe) | ✅ decidido (jun/2026) |
| **Cura tipo *exura*** universal, escala Espírito — todos conjuram | ✅ decidido |
| Eixo **dano = gear + atributos**; eixo **novidade = skills** | ✅ decidido (jun/2026) |
| Anti-treadmill **puro Koster: skill nova = verbo novo**, nunca "versão maior" | ✅ decidido (jun/2026) |
| **Espinho de 5 bandas** (abertura → caixa de ferramentas → 2º eixo → AoE → maestria) | ✅ estrutura decidida; níveis exatos ✏️ Balancista |
| **AoE-de-dano gate ~lvl 20** para qualquer classe | ✅ decidido |
| Assimetria de contagem **Int > Esp > Des > For** (emerge do espaço de cada atributo) | ✅ decidido |
| Catálogo-alvo **~35 skills** (5 universais + ~30 por afinidade) | ✅ decidido (jun/2026) |
| Cada **elemento** carrega um status distinto (senão é reskin) | ✏️ atribuir status por elemento (designer + Balancista) |
| **Curar Ferimentos** sob a regra "puro Koster" — reframe pra verbo distinto ou corte | ✏️ ver §3 (criador) |
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

**Regra:** **nenhuma skill é a "versão maior" de outra.** Não existe par exura→exura gran→exura vita. A escala numérica mora em stat+gear (§2); a lista de skills é uma coleção de **verbos distintos**.

Isto já é prática do projeto: *Passo das Sombras* e *Leque de Facas* foram **removidas** (jun/2026) por sobreporem verbos que o Rogue já tinha. Esta regra só formaliza o critério.

**Corolário A — elemento sem status próprio é reskin.** Um leque de elementos (fogo/gelo/terra/raio/morte) só passa no puro-Koster se **cada elemento carregar uma mecânica distinta**, senão é "Bola de Fogo pintada de roxo". Proposta de atribuição (✏️ designer + Balancista):

| Elemento | Verbo (status/mecânica) |
|---|---|
| Fogo | DoT (queimadura que tica) |
| Gelo | slow / freeze |
| Terra | root **ou** quebra-armadura (reduz defesa física) |
| Raio | hit instantâneo (sem viagem de projétil) **ou** salta entre alvos próximos |
| Morte | lifedrain **ou** maldição (reduz cura recebida) |

**Corolário B — consequência sobre *Curar Ferimentos* (✏️ criador).** Com a *Cura* (exura) universal escalando Espírito, "cura grande do Priest" vira *exura gran* = treadmill puro. Duas saídas, escolha do criador:
- **(a) Cortar** *Curar Ferimentos* — o Priest cura mais porque a *Cura* escala com o Espírito altíssimo dele. Mais limpo, mais Koster-puro.
- **(b) Reframe pra verbo distinto** — vira **cura em área/grupo** (estilo *mass healing*, brilha no online) **ou** cura-ao-longo-do-tempo (HoT). Mantém a fantasia sem ser "exura maior".
> Recomendação do designer: **(b) cura em grupo** — verbo genuinamente novo, encosta no pilar do online, e diferencia o Priest do "spam de exura forte".

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

## 6. Regra de gating do AoE — unlock de meio-jogo (decidido jun/2026)

**Toda magia de DANO em área tem gate de nível ALTO (~lvl 20)**, para QUALQUER classe. AoE-de-dano é o *power spike* de eficiência de farm, não ferramenta de early.

- **AoE de DANO (deleta o pack)** → gate ~lvl 20. Ex.: *Redemoinho*, *Onda de Chamas*, *Chuva de Lâminas*, *Explosão de Luz*, variantes em área de Terra/Raio/Morte.
- **AoE de CONTROLE/utilidade (gerencia, não deleta)** → liberada cedo (banda ②). Ex.: *Nevasca* (campo de lentidão), *Grito de Guerra* (taunt), *Muralha* (funil), *Consagrar* (zona). Dano nulo/desprezível por design — quem dá dano de área entra na categoria acima.

**Consequência (pilar 2):** packs no intervalo lvl 10–20 **não se deletam, se administram** — a resposta é *skill* (posicionamento, single-pull, kite, funil, defensivas). O counterplay é justo e legível; o pack continua perigoso até você merecer o AoE.

---

## Arquitetura

Toda skill nasce como **dado declarativo** (`src/sim/skills/` — `SkillDef` em `types.ts`, números em `numbers.ts`). Adicionar skill = adicionar uma entrada, não código. Determinístico/serializável; zero pixi/browser. O perfil de uso rastreado no evento `skill_use` alimenta as **Mutações** (ver `DESIGN-EVOLUCAO.md` §Mutações de Skill).

→ **Catálogo completo (roster + fichas):** `design/skills/CATALOGO.md`
→ **Aquisição (sem árvore de pontos) + Mutações:** `DESIGN-EVOLUCAO.md`
→ **Classes (corpo automático, atributos iniciais, Caminhos):** `DESIGN-EVOLUCAO.md` §Classes
