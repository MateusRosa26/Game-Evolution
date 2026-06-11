# Bestiário — Mecânicas de Mob (telegrafadas, desviáveis, versionadas)

> Sub-doc de [DESIGN-BESTIARIO.md](../../DESIGN-BESTIARIO.md). Desenha o SISTEMA pelo qual mobs ganham IDENTIDADE e DIFICULDADE — não por número subindo (sponge/aritmético), mas por **mecânica telegrafada que o jogador desvia com posicionamento**. Estende a "biblioteca de blocos de ataque" do hub. **Status: proposta de design (designer-de-sistemas, 2026-06-10) — números ✏️ Balancista, decisões ✏️ do criador marcadas.**

## 0. Ancoragem na constituição

| Pilar | Como este sistema serve |
|---|---|
| **2. Punitivo, nunca injusto** | o núcleo: toda punição é TELEGRAFADA antes (você VÊ o tile marcado) e DIDÁTICA depois ("saí tarde, a culpa é minha"). É a definição operacional de "justo". |
| **7. Sem treadmill** | dificuldade = ler um move novo / abrir mão de um tile, NUNCA "+HP/+dano". Anti-sponge por construção (HP só dá ritmo). |
| **1. Descoberta** | aprender o padrão de cada mob é conhecimento que mora na cabeça do jogador (o veterano lê o windup de cara — metroidbrainia). |
| **6. Identidade emerge do que fez** | o jogador domina mobs aprendendo a dançar com os moves deles, não decorando números. |

**Régua-mãe:** *se dá pra "subir a dificuldade" só multiplicando um número e o jogador não muda o que FAZ, é sponge. Se exige um comportamento novo (ler um 2º windup, ceder um tile), é mecânica.* HP define **ritmo/TTK**; o **dano mora no move telegrafado** (errar o desvio dói — é o que faz respeitar o aviso).

## 1. O modelo de Move telegrafado (a unidade)

Um **Move** é um bloco declarativo de ataque (estende a biblioteca de blocos do hub). Definição:

```
Move {
  id,                 // "slam", "beam", "leap"...
  shape,              // forma em TILES (ver §2)
  windupTicks,        // duração do aviso (janela de desvio)
  damage,             // dano ao resolver (✏️ Balancista) — AMARRADO ao move
  status?,            // slow/burn/etc no hit (opcional)
  cooldownTicks,      // entre usos
  range,              // alcance de início (tiles)
  group,              // grupo de incompatibilidade (§3)
  telegraph: { color, sfx } // apresentação (client)
}
```

**Resolução tile × tick (o contrato determinístico — modelo ITB + Tibia "Floor is Lava" + snapshot do FFXIV):**
1. Mob entra em windup → a sim **resolve os tiles-alvo AGORA** (tick inicial), congela-os, e os emite no snapshot.
2. Durante `windupTicks`, o client desenha os **tiles marcados** (não a entidade) o tempo todo. O mob fica travado no windup (não anda — recovery é janela de punição).
3. No **tick final**, a sim lê a **ocupação dos tiles-alvo NAQUELE tick** e aplica dano a quem está neles. **Sair 1 tick antes = imune.** Inequívoco, sem hitbox sub-tile.

**Janela justa (não-negociável — GDKeys):**
```
windupTicks ≥ ceil( (250ms reação + stepMs) / TICK_MS ) + buffer
```
Com `stepMs≈250` e `TICK_MS=50`: piso ≈ **10 ticks (500ms) + buffer** → move básico justo ~**14–16 ticks (700–800ms)**. **Elites cortam o BUFFER, nunca a reação.** Windup < piso = stat-check disfarçado = VETADO (fere pilar 2).

**Garantia de saída (ITB/Hoplite):** o move nunca pode marcar TODOS os tiles de fuga do jogador. Em `shape` de área, sempre há tile seguro adjacente alcançável em 1 passo. (World-designer garante no layout; o sistema garante na forma.)

## 2. Vocabulário de moves (estende a biblioteca de blocos)

Do simples (ensina) ao composto (exige). Cada um força uma decisão de posicionamento diferente:

| Move | Forma (tiles) | O que força | Tier de entrada ✏️ |
|---|---|---|---|
| **Básico** | melee adjacente (sem telegraph — o hit do `chaser`) | "não fique colado de graça" | T1 |
| **Slam / Estouro** | 1 ou 3×3 sob um ponto | "saia desses tiles" — *o tutorial do desvio* | **T1-topo** (proposta) |
| **Linha / Feixe** | linha reta no eixo do alvo | "saia da linha" (passo lateral) | T2 |
| **Cone / Onda** | leque frontal (Energy Wave) | "contorne, vá pras costas" | T2 |
| **Investida / Charge** | linha que o mob PERCORRE | "saia do corredor — ele atravessa" | T2 (javali) |
| **Salto / Leap** | marca tile distante, pula nele | "não fique no destino" (reposiciona o mob) | T2 |
| **Rosca / Donut** | anel marcado, centro seguro | "chegue PERTO" (inverte o kite) | T3 |
| **Estaca em cascata / Exaflare** | linha que avança 1 tile/tick | "corra perpendicular" | T3 |
| **Projétil lento** | tile a tile, COM trilha visível | "sidestepe o tiro" (slow no hit) | T2 (shooter) |
| **Spread / Stack** | marca em torno de alvo(s) | em grupo: espalhar/agrupar | T3+ (multiplayer) |

> **Projétil é sempre LENTO + com trilha.** Tiro rápido sem trilha = melee disfarçado, não-desviável → proibido.

## 3. Versionamento — base → avançado → elite (a progressão orgânica)

A progressão de um mob NÃO é +número — é **+move**, na MESMA criatura reconhecível (variante de cor/aura, reusa arte — pipeline PixelLab). Lição do Diablo 3 (affixes empilhados COM regras de grupo):

```
Goblin Batedor (base)   → Slam (salto no player + estouro 3×3)            ← ensina o desvio
Goblin <avançado> ✏️    → Slam + Linha (ou Slam mais forte/curto buffer)  ← lê QUAL windup
Goblin <elite> ✏️       → Slam + Linha + Projétil-slow                    ← juggle de 3
```

**Regras do empilhamento (legibilidade + justiça):**
1. **Anticipação única por move** — dois moves do mesmo mob NUNCA têm o mesmo windup/pose. É o que torna "ler qual está vindo" possível. (Sem isso, empilhar = ruído.)
2. **Grupos de incompatibilidade** — cada move tem um `group`; **nunca 2 moves que negam reposicionamento ativos na mesma janela** (ex: puxão + AOE no destino do puxão = tira a agência = injusto). Grupos propostos ✏️: `movimento-do-player` (pull/empurrão/raiz — máx. 1 por janela), `área-no-chão`, `projétil`, `melee`. Meio-termo D3: regras de compatibilidade, não combinação livre (livre = caótico; restrito demais = previsível).
3. **+1 move por degrau** — não despejar 3 moves de uma vez; cada versão adiciona UM. Surpresa vem do move novo, familiaridade vem da arte+windup base (recompensa por reconhecimento, não preguiça).
4. **Convenção de nome (criador, 2026-06-10): `nome base` = mob simples; `nome base + variante` = versão mais forte.** Ex: **goblin** (base) → **goblin batedor** (variante +move) → **goblin [elite]**. O descritor (batedor, lanhoso…) marca a VARIANTE, não o base. Auto-documenta: "goblin batedor" lê-se na hora como "goblin reforçado". Nomes das variantes ✏️ Loremaster. ⚠️ Aplicar isso aos mobs atuais (`rato_lanhoso`→`rato` etc.) é decisão do criador + refactor (ver §7): display-name é barato; trocar o **species ID** toca spawns/loot/quests + **nomes das pastas de sprite** (`img/mobs/<id>/`).

## 4. O que a engine precisa (arquitetura — sim resolve, client desenha)

Conteúdo = dados (padrão do projeto). Sem skills caso-a-caso.

1. **`moves: Move[]` no `CreatureTemplate`** (declarativo). `chaser` atual = mob com `moves: []` (só básico). Mob com mecânica = `moves: [SLAM]` etc.
2. **Estado de windup na entidade**: `activeMove?: { moveId, targetTiles, resolveAtTick }`. A IA escolhe um move off-cooldown no range → entra em windup (trava o passo).
3. **Telegraph no snapshot**: um novo evento/campo `telegraph: { tiles, moveId, resolveAtTick }` viaja no snapshot → o client desenha os tiles marcados (cor/forma por `moveId`) e anima o windup. **Anti-datamine:** isto é informação PÚBLICA por design (tem que ser visível), então pode viajar — ≠ condição secreta.
4. **Resolução**: no `resolveAtTick`, `applyDamage` a quem ocupa `targetTiles` (lê occupancy do tick). Reusa o `applyDamage`/event-bus existente.
5. **Behaviors**: estende o enum atual. `chaser` ganha a capacidade de disparar moves melee/salto; `shooter`/`caster` (já declarados) viram os donos de projétil/área à distância. `territorial` (javali) = `chaser` que só acorda provocado + Investida.
6. **Anti-poluição (client)**: tiles marcados por 2+ mobs = 1 overlay "perigo" (dedup), não 2; áudio distinto por tipo de move; a sim **escalona** quantos mobs entram em windup no mesmo tick (não todos de uma vez num pack).

## 5. Atribuição inicial (mobs da Alvorada) + a régua por tier

**A régua (proposta — reconcilia com o orçamento de ataques do hub):**

| Tier | Orçamento do hub (decidido) | + camada de telegraph (proposta ✏️) |
|---|---|---|
| **T1** | "só ataque básico" | rato/morcego/esqueleto = **só básico** (honra a canon, não sobrecarrega o minuto 1); **late-T1** (goblin/lobo) ganha **1 move-tutorial** — o on-ramp do desvio |
| **T2** | básico + 1 skill | **+1 move telegrafado** (a mecânica EXPLODE aqui, como o criador pediu) |
| **T3** | básico + 1 skill (+ signature) | move + versão avançada / 2º move |
| **T4–T5** | básico + 1–2 skills + signature | empilhamento elite + signature |

> **RESOLUÇÃO DA TENSÃO T1 (criador, 2026-06-10) — a régua de ecossistema:** o late-T1 ganha sim as primeiras mecânicas, mas com ESTRUTURA: **cada ecossistema / cidade-início tem 1 mob late-T1 com MOVESET + 1 com mecânica de COMPORTAMENTO.** Alvorada: goblin (moveset/salto) + lobo (matilha). Charneca: o par dela (das famílias undead/aquático ✏️). Rato/morcego/esqueleto = só básico (minuto 1 limpo). A mecânica EXPLODE no T2. Isso revisa o "T1 = só básico" do hub para → **"T1 = básico; no topo do T1 de cada ecossistema, 1 moveset + 1 comportamento"**. ✏️ atualizar o orçamento de ataques no DESIGN-BESTIARIO.

**Atribuição:**
| Mob | Tier | Mecânica | Nota |
|---|---|---|---|
| Rato Lanhoso | T1 | só básico | primeiro sangue, sem ruído |
| Morcego Sanguessuga | T1 | só básico (ameaça = enxame/voo) | minuto 1 limpo |
| Esqueleto | T1 | só básico | undead de entrada |
| **Goblin** (base) | T1 | **Salto gap-closer** — pula ~3 tiles até o player num cooldown; **pura movimentação (anti-kite)**, precisa de animação | salto no BASE (decidido criador); o moveset do ecossistema. Variantes (goblin + descritor) empilham AOE-de-aterrissagem desviável → projétil-slow |
| **Lobo Cinzento** | T1 | **Matilha** (já é a mecânica — pressão de posicionamento por número) | mecânica "passiva", não um move telegrafado; coesão de matilha = ✏️ pack-AI |
| **Javali de Presas** | T2 | **Investida/Charge** + territorial | o 1º move telegrafado "puro" do gradiente |

> **Matilha é uma mecânica de POSICIONAMENTO, não um move telegrafado** — o lobo não precisa de Slam; a ameaça dele é ser cercado. Isso mostra que "mecânica desde cedo" ≠ "todo mob tem um move de chão"; há mecânicas de comportamento (matilha, territorial, voo) e mecânicas de move (Slam, Linha…). As duas contam.

## 6. Teste da Mastigação (auto-veto)

- **Telegrafia legível antes / didática depois?** ✅ é a tese do sistema (tile marcado + janela justa + dano-no-move).
- **Treadmill?** ✅ não — dificuldade é +move, proibido +número-sem-interação.
- **Sirlin / degeneração?** risco: um move dominante sem counterplay. Mitigação: regra da garantia-de-saída + grupos de incompatibilidade. ✏️ validar por move na sim.
- **Camadas:** o telegraph é **camada sólida** (claro por contrato — TEM que ser visível); não misturar com segredo. ✅
- **Mastiga?** o marcador de tile é informação pelo MUNDO (não número de UI, não tooltip) — passa. O risco é poluição visual com muitos mobs → §4.6 (dedup/áudio/escalonar) é o cuidado.

## 7. Decisões abertas (✏️ criador / outras skills)

- [x] ~~A tensão do T1~~ → **RESOLVIDA** (régua de ecossistema, §5): late-T1 ganha as mecânicas, 1 moveset + 1 comportamento por ecossistema. ✏️ atualizar o orçamento do DESIGN-BESTIARIO.
- [x] ~~Salto do goblin: base ou variante?~~ → **BASE** (decidido criador): o "goblin que pula" é o base icônico; variantes empilham os moves de dano-desviável.
- [x] ~~Escopo do rename `nome base`~~ → **species ID refactor APLICADO (2026-06-10)**: `rato_lanhoso`→`rato`, `goblin_batedor`→`goblin`, `lobo_cinzento`→`lobo`, `morcego_sanguessuga`→`morcego`, `javali_de_presas`→`javali` em código + pastas de sprite + FAMILIAS + docs da fatia. `esqueleto` já era plano. Os descritores (lanhoso/batedor/…) ficam livres p/ as VARIANTES. ✏️ Loremaster revisa o flavor dos docs; 1 comentário em `templates.ts` (agente de comida) pendente.
- [ ] **Par late-T1 de Charneca** (1 moveset + 1 comportamento das famílias undead/aquático) — ✏️ world-designer + bestiário, fatia ②.
- [ ] **Janela justa**: confirmar o piso de windup (~700–800ms básico) ✏️ Balancista mede o "feel" na sim.
- [ ] **Grupos de incompatibilidade** — fechar a lista (`movimento-do-player`/`área`/`projétil`/`melee`).
- [ ] **Quantos degraus** de versionamento por mob (base→avançado→elite = 3? ou até "elite" só em famílias-chave?).
- [ ] **Nomes** das variantes (goblin avançado/elite) → Loremaster.
- [ ] **Marco de implementação**: é sistema de combate próprio (engine: moves declarativos + telegraph no snapshot + resolução tile-tick). Sequenciar com o re-layout da vila e a arte (Camadas B/C).
