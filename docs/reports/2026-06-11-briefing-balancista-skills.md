# Briefing pro Balancista — pós sessão de skills (jun/2026)

**Data:** 2026-06-11 · **Origem:** sessão de design de skills (Designer de Sistemas + Loremaster + World Designer). **Não é uma bateria rodada** — é o handoff do que a sessão deixou pra calibrar, com cenários, régua e **dependências de código** (a maioria das skills/mecânicas novas ainda NÃO existe na sim; sem implementar, não há o que medir).

## O que mudou no design (contexto)

- Skills viraram hub+sub-doc: `DESIGN-SKILLS.md` (framework) + `design/skills/CATALOGO.md` (~38 skills).
- **Três eixos:** dano = gear+atributos (curva suave) · novidade = skills (verbos) · XP/h = combinação. **Anti-treadmill puro-Koster:** skill nova = verbo novo, nunca "versão maior".
- **Espinho de 5 bandas** (níveis ✏️ = SEU trabalho): ① abertura (1–6) · ② caixa de ferramentas (6–12) · ③ 2º eixo de dano (12–18) · ④ power spike de AoE (~18–20) · ⑤ maestria/T3 (20–25).
- **AoE em 3 vias:** controle (cedo) · **chip fraco** (cedo, só Int) · **deleter** (~20). Ver `DESIGN-SKILLS.md` §6.
- **Topologia de spawn ↔ classe** (pós-20): forma do spot favorece classe — `design/mundo/EXPLORACAO.md`.
- Skills novas/renomeadas relevantes: **Sparks/Fagulhas** (chip-AoE Int), **Earthen Grasp/Garras da Terra** (skillshot+cast-time→root), **Life Drain/Dreno Vital** (lifedrain), **Sacred Aura/Aura Sagrada** (cura em grupo), **Rend/Retalho** (single-target bleed), **Steelstorm/Vendaval de Aço** (AoE Rogue @20).

## Régua herdada (continuidade — não re-derivar)

- Single-target on-level (lvl 10 vs Esqueleto T2): knight 3,9s · mage 2,3s · rogue 2,4s · priest 1,6s (vs undead). Fonte: re-check pós-wand 09/jun. **Não mexer reativo.**
- Wand: dano próprio fixo, não escala atributo; mana por tier (T1=2). Ofensiva sagrada escala **Espírito** (`holyDamage`).
- Custo de stat por faixa RO; 4 pts/nível; curva de XP família-potência (`125·(n−1)^2.5`).
- Esqueleto T2: HP 95 / xp 80 (✏️ re-régua na bateria de farm).

---

## As 5 perguntas de calibração (ordenadas por dependência)

### 1. Níveis exatos das 5 bandas — o espinho
**Pergunta:** em que nível cada skill se torna aprendível (gate atributo+nível), de modo que a curva de dificuldade/TTK justifique a caçada?
**Cenários:** por classe, medir TTK/TTL/XP-h em cada faixa de nível COM o kit disponível naquela banda (não o kit completo). O caso crítico é o **vale 10–20** (packs que se administram, sem deleter).
**Régua:** cada banda deve mudar TTK **ou** abrir conteúdo (não as duas levemente); banda ④ (~20) é a única que pode dar **salto de XP/h em degrau** (o deleter). Antes disso, packs = perigo real (pilar 2).
**Onde:** gate por nível ainda **não existe na sim** (hoje `kits.ts`/`STARTER_KITS` só concede). → **dep. de código:** gate atributo+nível + aprendizado.
**Saída esperada:** tabela skill → (atributo mín, nível mín), com TTK/TTL por banda.

### 2. Teto sublinear do chip-AoE (Sparks / Fagulhas)
**Pergunta:** qual dano/escala faz o Sparks **amaciar mas NUNCA deletar** um pack — inclusive num Mage de Int alto no fim do early?
**Cenários:** Mage Int-baixo e Int-MÁXIMO (do range pré-20) × pack de 3–5 mobs on-level. Medir % do pack que o Sparks sozinho mata por rotação completa de mana.
**Régua:** Sparks **não pode** zerar um pack sozinho em nenhum nível pré-20 (senão fura o gate ~20 do deleter). Escala **sublinear** em Int (teto de dano, ou dano por salto decrescente). Teste de Sirlin: "spammar Sparks deleta pool?" → se sim, degenerado.
**Onde:** `skills/numbers.ts` (a criar a entrada) + a curva de escala em `formulas.ts`. → **dep.:** skill chain-AoE não existe na sim.

### 3. Cast-time + raio do Garras da Terra (skillshot root)
**Pergunta:** quanto de cast-time e qual raio (2–3 casas) tornam o root **forte mas justo** (telegrafado, evitável andando)?
**Cenários:** acerto vs alvo parado, vs alvo andando (deve dar pra sair na janela do cast), vs pack (quantos prende). Medir o ganho real: root permite o combo (Garras → Flame Wave/Storm) sem trivializar.
**Régua:** cast-time longo o bastante pra ser **dodgeable** (pilar 2: punição legível ANTES) e curto o bastante pra valer a jogada. Root não pode ser permanente nem stun-lock.
**Onde:** `skills/numbers.ts` + **dep. de código pesada:** targeting de **skillshot + cast-time** é um TIPO NOVO (hoje só meleeTarget/meleePositional/projectileTarget/lineThrough/healTarget em `skills/types.ts`). → precisa do Designer de Sistemas + engine antes de medir.

### 4. Cura em grupo (Aura Sagrada) vs Heal individual
**Pergunta:** quão maiores são o gate (Esp+nível), a mana e a cura-por-cast da Aura Sagrada pra ela ser a "cura cara de área", não um Heal individual inflado?
**Cenários:** Priest curando 1 / 3 / 5 aliados (ou só self no raio, solo). Comparar HP-curado-por-mana e por-segundo vs Heal individual spammado. Medir sustain solo (Aura só te cura a você no raio = pior que Heal solo, por design).
**Régua:** solo, Aura **deve ser pior** que Heal (ela é ferramenta de grupo); em 3+ alvos, ganha. Mana alta o bastante pra não ser spam. NÃO pode dominar o Heal no uso single (senão vira "Heal maior" = treadmill, fura o puro-Koster).
**Onde:** `skills/numbers.ts` + **dep.:** cura radial em área (targeting novo) não existe.

### 5. XP/h por classe × forma de spot (topologia ↔ classe)
**Pergunta:** as 3 formas de spot (Pool denso / corredor-esparso / poucos-perigosos) realmente fazem a classe-certa render mais — sem nenhuma virar dominante universal (Sirlin)?
**Cenários:** cada classe (lvl 20+, kit com deleter) × cada forma de spot. Medir **XP/h sustentado vs teto de respawn** e **mortes/h**. Matriz 4 classes × 3 formas.
**Régua:** em cada forma, a classe-alvo lidera em XP/h, mas **nenhuma classe é a melhor em TODAS as formas** (senão o mapa não diferencia). O teto de respawn (`nº spawns × 3600/respawn × xp`) segura o AoE no Pool — medir se o Mage **bate no teto** (bom) ou se o Pool vira refil-infinito (degenera).
**Onde:** `bestiary.ts` (disposição/densidade dos spots de teste) + os deleters implementados. → **dep.:** todos os deleters @20 + formas de spot montadas na sim.

---

## Sequência sugerida (dependências)

As perguntas 1–5 **dependem de código que não existe**. Ordem que destrava:

1. **Pré-requisito de engine** (Designer + código): gate skill por atributo+nível; targeting de skillshot+cast-time; cura radial; lifedrain; chain-AoE. Sem isso, nada de 1–5 roda.
2. **Entradas em `numbers.ts`** das skills novas (placeholders) — pra sim instanciar.
3. Então: **#2 (Sparks)** e **#4 (Aura)** primeiro (mais isoladas) → **#1 (bandas)** com o kit ganhando forma → **#3 (Garras)** quando o skillshot existir → **#5 (topologia)** por último (precisa dos deleters + spots).

## Itens já abertos que isto re-abre

- **Status por elemento** (terra=root/quebra-armadura · raio=instant/chain · morte=lifedrain) — Designer + você fecham o número de cada status.
- **Knight em pack 10–20:** Baluarte dimensionado pra 3-pack T2 sobrevivível-com-cooldown (flag da bateria T2, segue aberto).
- **Salto de XP/h da banda ④:** medir o tamanho do degrau do deleter — deve ser sentido, sem virar "só AoE importa".
- **Apunhalar/Backstab quente** (vigiar quando o kit do Rogue completo — agora com Rend + Steelstorm — existir).

## Régua transversal (todos os cenários)

Sempre incluir o **caso de descuido** (não reagir, puxar 2 grupos) e rodar o **teste de Sirlin** (alguma skill/rota/spot domina sem counterplay?). Simular **sem nenhuma Marca/Mutação** (regra de ouro). Registrar cada bateria em `docs/reports/`.
