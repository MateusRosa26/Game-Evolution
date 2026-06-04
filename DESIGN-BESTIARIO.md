# Bestiário — Criaturas Padrão

> Documento vivo. Somente criaturas padrão — mini-bosses e bosses de área ficam para documento futuro ✏️. Números (HP/dano/XP) são ✏️ até o M1/M2 darem a régua; aqui definimos identidade, comportamento e papel sistêmico.

## Princípios

1. **Mobs são fortes** (ver Ritmo em `DESIGN-EVOLUCAO.md`): até a criatura de tier 1 pune descuido. Nenhum mob é "de passagem".
2. **Família é a unidade do sistema de Marcas**: contadores de kill rastreiam **espécie** (esqueleto) e **família** (morto-vivo). Toda criatura pertence a exatamente uma família.
3. **Cada família ensina uma mecânica**: resist/fraqueza e comportamento de IA formam a curva de aprendizado do jogo.
4. **Dificuldade crescente dentro da família**: as 3–4 criaturas de uma família cobrem uma faixa de tiers — o jogador revisita o tema mais forte, e a família inteira alimenta a mesma Marca.

## Tiers de dificuldade

| Tier | Nível-alvo do jogador ✏️ | Caráter |
|---|---|---|
| **T1** | 1–8 | Aprendizado — já exige atenção |
| **T2** | 8–15 | Primeiro teste real de build |
| **T3** | 15–25 | Exige uso correto de skills/elementos |
| **T4** | 25–40 | Pune erro com morte; farm de Marcas sério |
| **T5** | 40+ | Endgame de criatura padrão |

## Arquétipos de IA (implementáveis na sim, tile-based)

| Arquétipo | Comportamento |
|---|---|
| **Perseguidor** | persegue via A* e bate em melee |
| **Atirador** | mantém ~4–6 tiles de distância, kita ao ser aproximado |
| **Matilha** | agride junto dos irmãos; mais agressivo com aliados vivos por perto |
| **Covarde** | foge com HP < ~20% ✏️ (cria a mecânica de finisher/perseguição) |
| **Territorial** | neutro até o jogador se aproximar demais ou atacar |
| **Caster** | projéteis/efeitos à distância com canalização (janela de punição) |

---

## 1. Bestas (T1–T3) — feras naturais

**Identidade:** a natureza não é sua amiga. Florestas, campos e trilhas.
**Resist/fraqueza:** nenhuma — a família "neutra" que ensina o combate cru.
**Mecânica que ensina:** agro, matilha, criaturas neutras (Territorial).

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Rato Lanhoso** | T1 | Perseguidor | o primeiro sangue do jogador; rápido, fraco, vem em grupos |
| **Lobo Cinzento** | T1–T2 | Matilha | sozinho é fácil, a alcateia cerca e mata; uiva e chama reforço próximo ✏️ |
| **Javali de Presas** | T2 | Territorial + Perseguidor | neutro até provocado; investida dolorosa em linha reta |
| **Urso Pardo** | T3 | Territorial | "muro" de T3: HP alto, dano alto, lento — ensina kiting |

## 2. Peles-Verdes (T1–T3) — goblins, orcs e ogros

**Identidade:** tribos saqueadoras — covardes em desvantagem, cruéis em bando. Acampamentos, paliçadas e minas rasas.
**Resist/fraqueza:** nenhuma; equipamento rudimentar (dropam gear T1–T2).
**Mecânica que ensina:** inimigos com armas/ranged, moral (fuga) — sinergia direta com *Arremesso → Caçador*.

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Goblin Batedor** | T1 | Perseguidor + Covarde | foge sangrando e volta com amigos ✏️ |
| **Goblin Fundeiro** | T1–T2 | Atirador + Covarde | funda (pedras); primeiro ranged do jogo |
| **Orc Soldado** | T2–T3 | Perseguidor | disciplinado, não foge; escudo — bloqueia parte dos hits frontais |
| **Ogro Bruto** | T3 | Perseguidor | golpe lento e telegráfado que ESMAGA; ensina a não tankar de graça |

## 3. Renegados (T2–T3) — humanos fora da lei

**Identidade:** bandidos, desertores e cultistas — o mal banal com rosto humano. Estradas, ruínas, esconderijos.
**Resist/fraqueza:** nenhuma; usam skills de jogador (curam-se, recuam) — espelho desconfortável.
**Mecânica que ensina:** inimigos "inteligentes" com kit, interrupção de cast.
**Gancho:** Cultistas são a ponte narrativa para a família Demônios.

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Bandido da Estrada** | T2 | Perseguidor | usa Primeiros Socorros ao recuar ✏️ — mate-o antes |
| **Arqueiro Renegado** | T2–T3 | Atirador | dano alto à distância, frágil — premia gap-close |
| **Cultista do Abismo** | T3 | Caster | projétil sombrio canalizado; interromper o cast é a lição |

## 4. Mortos-Vivos (T2–T4) — a família-coração do jogo

**Identidade:** criptas, cemitérios, catacumbas — a escuridão devolvendo os enterrados. A família do exemplo canônico (*Quebra-Ossos*) e o farm natural do Priest.
**Resist/fraqueza:** **imunes** a veneno/sangramento; **resistentes** a gelo; **fracos** a sagrado e fogo.
**Mecânica que ensina:** dano elemental certo importa; quantidade como ameaça (hordas lentas).

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Esqueleto** | T2 | Perseguidor | a unidade do grind lendário — 15k destes = *Quebra-Ossos* |
| **Zumbi Pútrido** | T2–T3 | Perseguidor (lento) | nuvem pútrida ao morrer (dano em área pequena) ✏️ — não lutar em cima do corpo |
| **Ghoul** | T3 | Matilha | rápido, faminto; caça em bandos nas catacumbas |
| **Espectro** | T4 | Perseguidor (atravessa? ✏️) | **resistente a físico** — o gate da família: sem magia/sagrado, sofrimento |

## 5. Rastejantes (T2–T4) — o que vive no escuro das cavernas

**Identidade:** cavernas, minas profundas, ninhos. Quitina, patas demais e veneno.
**Resist/fraqueza:** **imunes** a veneno; **fracos** a fogo (carapaça estala).
**Mecânica que ensina:** DoT inimigo (veneno) e gestão de antídoto/cura — sinergia com Rogue (*Língua de Víbora* não funciona aqui: anti-sinergia proposital ✏️ confirmar).

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Aranha-das-Cavernas** | T2 | Perseguidor | veneno fraco; aviso do que vem abaixo |
| **Escorpião Negro** | T3 | Territorial | veneno forte; ferrão telegráfado |
| **Viúva Sibilante** | T3–T4 | Atirador | cospe teia (slow/root) e recua — inverte o kiting contra o jogador |
| **Verme Colosso** | T4 | Territorial | massa de HP nas profundezas; engole projéteis ✏️ (resist a distância?) |

## 6. Elementais (T3–T5) — magia bruta sem dono

**Identidade:** ruínas arcanas, fendas elementais, profundezas geladas/vulcânicas. Não têm carne, não têm medo.
**Resist/fraqueza:** **imunes** ao próprio elemento e a veneno/sangramento; **fracos** ao elemento oposto. A família-escola do Mage.
**Mecânica que ensina:** rotação elemental obrigatória — o mago mono-elemento (*Coração de Cinzas*) escolheu um inimigo eterno.

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Elemental de Terra** | T3 | Perseguidor (lento) | físico puro, HP enorme; quase imune a físico ✏️ — magia resolve |
| **Elemental de Gelo** | T4 | Caster | aura de slow; fraco a fogo |
| **Elemental de Fogo** | T4 | Atirador | queimadura em tudo que toca; fraco a gelo |
| **Golem Arcano** | T5 | Perseguidor | construto antigo; alterna resistência elemental ✏️ (ciclo) — o teste final de versatilidade |

## 7. Demônios (T4–T5) — o endgame padrão

**Identidade:** fendas do Abismo, profundezas dos cultos. Inteligentes, sádicos, organizados.
**Resist/fraqueza:** **imunes** a fogo; **fracos** a sagrado — o farm supremo do Priest/*Exorcista*.
**Mecânica que ensina:** IA agressiva e coordenada; o jogo inteiro testado de uma vez.

| Criatura | Tier | IA | Notas |
|---|---|---|---|
| **Diabrete** | T4 | Atirador + Covarde | bolas de fogo, irritante, foge rindo ✏️ (blink curto?) |
| **Cão das Brasas** | T4 | Matilha | rápido, mordida queima; caça em pares |
| **Tormentador** | T4–T5 | Caster | maldições (reduz cura recebida ✏️) — anti-sustain |
| **Carrasco do Abismo** | T5 | Perseguidor | o teto das criaturas padrão; golpes em área, pune melee e ranged igualmente |

---

## Matriz de fraquezas (resumo)

| Família | Imune | Resistente | Fraco |
|---|---|---|---|
| Bestas | — | — | — |
| Peles-Verdes | — | — | — |
| Renegados | — | — | — |
| Mortos-Vivos | veneno, sangramento | gelo, físico (só Espectro) | **sagrado**, fogo |
| Rastejantes | veneno | — | **fogo** |
| Elementais | próprio elemento, veneno, sangramento | físico (Terra/Golem) | **elemento oposto** |
| Demônios | fogo | — | **sagrado** |

## Ganchos com o sistema de Marcas

- **Famílias = alvo das Marcas de item** (*Quebra-Ossos* vs mortos-vivos) e dos Caminhos *Carrasco de <família>* / *Exorcista*.
- **Espécies = grind lendário específico** (15k *esqueletos* ≠ 15k mortos-vivos variados ✏️ decidir se Marcas distinguem).
- Fraquezas elementais alimentam os Caminhos de estilo do Mage (mono-elemento tem inimigos impossíveis — escolha com consequência).
- Covardes que fogem alimentam perfis de uso (*Arremesso → Caçador*); casters que canalizam alimentam interrupção ✏️ (skill futura?).
- T4–T5 são as famílias onde os thresholds de 10–20k fazem sentido de tempo de jogo — T1–T2 saem de rotação no mid-game (regra anti-degeneração: kill precisa dar XP válido).

## Aberto / a decidir ✏️

- [ ] Números: HP/dano/XP/velocidade por criatura (M2)
- [ ] Marcas distinguem espécie vs família? (proposta: ambas existem, espécie é mais rara e mais forte)
- [ ] Respawn/densidade por região (M3 — design de mapa)
- [ ] Mini-bosses e bosses de área (doc futuro)
- [ ] Loot table por criatura (M2 — itens)
- [ ] Sistema de interrupção de cast (afeta Renegados/Elementais/Demônios)
