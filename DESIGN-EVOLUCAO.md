# Progressão — Camada Sólida + Sistema de Marcas

> Documento vivo. Seções ✏️ são preenchidas pelo criador.

## Filosofia — duas camadas de progressão

| Camada | O que é | Caráter |
|---|---|---|
| **Sólida** (o jogo) | Level/XP, stats, skills compradas em NPCs, equipamento/loot | Previsível, clara, satisfatória por si só. **100% da progressão necessária vive aqui.** |
| **Emergente** (o tempero) | Marcas, Mutações, Caminhos — evolução por atitude | Oculta, brutal, opcional. Prestígio + poder bônus. |

**Regra de ouro do balance:** nenhum conteúdo é balanceado assumindo que o jogador tem Marcas. A camada emergente é a assinatura do jogo, mas quem nunca desbloquear nada dela ainda joga um RPG completo e gostoso. Sem grind obrigatório de sistema (nada de treinar shielding AFK estilo Tibia — isso não é jogo, é espera).

## Mapa de decisões (fechado)

| Tema | Decisão |
|---|---|
| Filosofia | Duas camadas: **sólida** (progressão completa) + **emergente** (tempero oculto, nunca requisito) |
| Stats | 5 atributos (For/Des/Int/Vit/Esp), **pontos no level up** + crescimento automático por classe. Sem skill-by-use |
| Respec | 1 reset de stats grátis por char; extras restritos (futuro: feature paga). Marcas nunca resetam |
| Skills | **Compradas em NPCs** (classe + nível + gold), tiers de acesso. Sem árvore de pontos; único upgrade = Mutação |
| Classes | **Knight / Mage / Rogue / Priest**, base fixa + especialização emergente. Sem subclasses escolhíveis |
| Monge | Não é classe — é **Caminho emergente do Priest** (conduta *Mão Vazia*) |
| Visibilidade | Condições ocultas; hint vaga aos **~50%**; nunca contador exato; unlock é um momento screenshotável |
| Slots de Marca | Itens comuns→raros **1**, lendários **2**, únicos **3**; Caminhos sem cap, dificuldade escalante por Caminho obtido |
| Permanência | **Marcas, Mutações e Caminhos nunca se perdem** — nem por morte, respec ou quebra de conduta pós-aquisição. Monge que equipa arma continua Monge |
| Níveis de Marca | Marca tem **1–3 níveis** (depende da marca): subir nível = repetição contínua; **evoluir/alterar** = só evento canônico raro (boss mundial, PvP extremo). A Marca é o **ego** do item |
| Ritmo / Morte | Progressão **difícil**: upar é lento, mobs são fortes. Morte pune **pesado em XP**, leve no resto — **itens nunca são perdidos** |
| Mutações | Nomeadas e qualitativas (não ranks); o **perfil de uso** decide qual mutação nasce; 2–4 por skill, autorais |
| Thresholds | Brutais: ordem de 10–20k repetições / condutas por dezenas de níveis (números ✏️ calibrar com combate real) |
| Proveniência | Contadores de item vivem na **instância** (ledger); progresso viaja com o item em trade/drop |
| Arquitetura | Tudo na sim; condições como **dados** (definições), não código; eventos `kill`/`skill_use`/`damage`/`block`/`level_up` desde o M1 |

Pendências em **Aberto / a decidir** no fim do documento.

---

# Camada Sólida

## Sistema de Stats

Level up concede **pontos de atributo** para distribuir (✏️ ex: 3/nível) + ganhos automáticos da classe (HP/Mana base). Melhorar o char é decisão ativa e imediata — sem grind de proficiência por uso.

**Atributos (5):**

| Atributo | Governa | Classe afim |
|---|---|---|
| **Força** | dano corpo-a-corpo, capacidade de carga | Knight |
| **Destreza** | dano de adagas/distância, velocidade de ataque, esquiva | Rogue |
| **Inteligência** | dano mágico, mana máxima | Mage |
| **Vitalidade** | HP máximo, regeneração de HP | Knight (todos) |
| **Espírito** | poder de cura, regen de mana, resistência mágica | Priest |

- **Derivados** (calculados, nunca distribuídos): HP, Mana, dano físico/mágico, poder de cura, velocidade de ataque, esquiva, capacidade. Fórmulas ✏️ (definir no M2 com números reais de combate).
- Classes têm **crescimento base** próprio por nível além dos pontos livres (Knight ganha mais HP automático etc.) ✏️.
- ✏️ Soft cap / custo crescente por ponto no mesmo atributo? (evita hiper-especialização degenerada)

**Respec (reroll de stats):**
- **1 reset gratuito por personagem**, permanentemente disponível.
- Resets adicionais: **restritos** — futuramente feature paga (Steam/online) ✏️ decidir modelo.
- Marcas, Mutações e Caminhos **nunca** resetam — são história, não build.

## Aquisição de Skills (sem árvore de pontos)

Skills são **compradas em NPCs treinadores**, com restrições — não existe skill point nem árvore de talentos clicável:

- **Requisitos por skill:** classe + nível mínimo + ✏️ stats mínimos + custo em gold.
- **Tiers de acesso:** Básicas (NPC de toda cidade) → Intermediárias (NPCs específicos/cidades distantes) → Avançadas (quests, drops de boss, NPCs secretos) ✏️.
- Gold vira sink relevante da economia (importante pro online).
- **A "árvore" de uma skill é a vida dela:** comprou → usou → (perfil de uso extremo) → **Mutação**. A mutação é a coroa oculta — única forma de upgrade da skill, e por isso especial.

## Outras formas de melhorar o char

Vetores de poder da camada sólida (todos previsíveis e claros):

1. **Level** → pontos de stats + HP/Mana
2. **Skills novas** → compradas/conquistadas (amplitude de kit)
3. **Equipamento** → loot/tiers de item (e onde as Marcas de item brilham como bônus)
4. ✏️ futuro: crafting/profissões? consumíveis? — _a pensar_

## Ritmo de progressão e morte (decidido)

**Upar é difícil. Mobs são fortes.** Nível é símbolo de competência, não de tempo jogado:

- Curva de XP íngreme (números ✏️ — calibrar no M2); cada level é conquista.
- Mobs exigem atenção e respeito — combate não é farm trivial nem de passagem. Um mob comum mal jogado pode matar.
- Consequência: os thresholds das Marcas (10–20k kills) ficam ainda mais lendários, porque cada kill custa.

**Morte: punição concentrada na experiência, leve no resto:**

| Aspecto | Punição |
|---|---|
| XP | **Pesada** — perde % significativa ✏️ (pode deslevelar? ✏️) |
| Itens / equipamento | **Nunca perdidos** — Marcas são o ego dos itens, e ego não se perde na morte |
| Outros (gold, debuff temporário…) | Leve ou nenhuma ✏️ |

Racional: a dor da morte precisa ser real (XP caro num jogo de upar difícil = morte dói muito), mas sem destruir a camada de Marcas/relíquias — perder uma espada com 14k kills seria punição desproporcional e mataria o investimento emocional que o jogo inteiro cultiva.

---

# Camada Emergente — Sistema de Marcas

## Conceito core

O jogo observa o comportamento do jogador (contadores na simulação) e cristaliza padrões extremos em recompensas **nomeadas, raras e permanentes**. Ninguém escolhe uma Marca — ela acontece com você.

**Pilares:**

1. **Brutal de conseguir** — ordem de 10–20 mil repetições, ou condutas mantidas por dezenas de níveis. Uma Marca é um evento na vida do personagem, não um checkbox.
2. **Nomeada e narrativa** — toda recompensa tem nome próprio e flavor. "Quebra-Ossos" > "+15% dano vs mortos-vivos". O nome É a recompensa social.
3. **História pertence ao objeto** — contadores de item vivem na **instância** do item. A espada que matou 14 mil esqueletos carrega esse progresso se for vendida/dropada. Itens viram relíquias com proveniência (crucial pro online/economia futura).
4. **Identidade emergente** — a build vem da camada sólida (stats + skills), mas a **identidade** vem daqui: as Marcas contam quem o personagem é, não o que ele distribui de pontos.
5. **Tempero, não pilar de progressão** — nada da camada emergente é requisito para nada. É bônus, prestígio e lenda.

## Taxonomia

| Categoria | Nome | Vive em | Exemplo |
|---|---|---|---|
| Item | **Marca** | instância do item | Espada matou 15k mortos-vivos → marca *Quebra-Ossos* (+dano vs mortos-vivos) |
| Skill/Magia | **Mutação** | skill do personagem | Bola de Fogo usada 10k vezes → muta para *Fogo Voraz* (queima em área) |
| Personagem | **Caminho** | personagem | Chegou ao lvl 20 usando só uma magia; só usa fogo+gelo; nunca usou armadura… |
| (futuro) | — | — | exploração, profissões, bestiário ✏️ |

## Regras universais

### Visibilidade — "oculto que se revela"

- Condições **nunca** são listadas no jogo. Sem contador, sem barra de progresso, nunca.
- Ao atingir **~50% do progresso**, surge uma dica vaga e atmosférica: *"sua espada vibra quando há mortos-vivos por perto"*, *"as chamas parecem responder à sua vontade"*.
- O desbloqueio é um **momento**: efeito visual/sonoro forte + reveal do nome. Deve ser screenshotável.
- Consequência desejada: a comunidade vira arqueóloga do sistema (wiki, teorias, lendas).

### Acúmulo (slots de Marca por raridade)

| Portador | Slots de Marca |
|---|---|
| Itens comuns → raros (~90% dos tiers) | **1** |
| Itens lendários | **2** |
| Itens únicos | **3** |
| Personagem (Caminhos) | **sem cap fixo** — mas cada Caminho conquistado **aumenta a dificuldade dos próximos** (multiplicador de requisito ✏️ ex: ×1.5 por Caminho já obtido) |

- Item com slots cheios continua acumulando contadores, mas não ganha novas Marcas (a não ser que ✏️ exista rito para substituir/fundir — decidir depois).

### Anti-degeneração (regras da sim)

- Kill só conta se o mob for **válido** (dá XP para o nível do jogador — mata farm de rato no lvl 100).
- Para a **arma**: conta o kill se ela deu o **golpe final** estando equipada.
- Para a **skill**: uso só conta se **atingiu alvo válido** (spam no ar não conta).
- Contadores e verificação de condições rodam **100% na sim** (`src/sim/`), nunca no client — à prova de cheat no online futuro.
- ✏️ Detectar AFK-farm / macro: decidir política (provavelmente irrelevante no single player, crítico no online).

### Permanência (decidido)

**Marcas, Mutações e Caminhos nunca se perdem.** Por nenhum mecanismo: morte, respec, ou quebra da conduta após a aquisição. São **evoluções permanentes** do personagem/item, não estados condicionais.

- O **Monge** que equipar uma espada **continua Monge**. A conduta é o rito de passagem, não um voto eterno.
- É exatamente por isso que cada Caminho adquirido **encarece os próximos** (regra de acúmulo): o poder acumula sem volta, então o controle de balance fica todo no gate de aquisição.
- Marcas de item viajam com o item para sempre (trade, drop, herança).

### Condutas — aquisição

- Caminhos de restrição (ex: "só uma magia até lvl 20") são monitorados continuamente **da criação do personagem até o desbloqueio**. Depois disso, liberdade total.
- ✏️ Quebrar a conduta **antes** de adquirir: perde a chance para sempre naquele char (estilo NetHack) ou apenas zera o progresso? — a decidir.

---

## 1. Marcas de Item — o ego do item

> **A Marca é o ego do item.** Ego não é algo que se perde ou muda de forma drástica sem eventos canônicos.

A instância do item guarda um **ledger**: contadores de quem/o quê/como ele matou ou foi usado.

**Dimensões rastreadas (por instância):**
- Kills por **tipo de criatura** (esqueleto, morto-vivo como família, demônio…)
- Kills por **contexto** (à noite, abaixo de X% de HP, sem tomar dano no combate…)
- Tempo/uso total, dano causado, donos anteriores (proveniência)

### Níveis × Evolução (decidido)

Cada Marca tem **1 a 3 níveis** (depende da marca — definido no design dela). Dois mecanismos distintos:

| Mecanismo | Como acontece | Natureza |
|---|---|---|
| **Subir de nível** (I → II → III) | Repetição contínua — o ledger continua contando após o desbloqueio, com thresholds crescentes ✏️ | Quantitativo: a marca fica **mais forte** (ex: Quebra-Ossos I +10% → II +15% → III +20%) |
| **Evolução / alteração** | Apenas em **eventos canônicos** extremamente raros e especiais: boss mundial, situações de PvP extremo (online), momentos únicos do mundo ✏️ | Qualitativo: a marca **muda** — novo nome, novo efeito, nova lenda (ex: *Quebra-Ossos* que deu o golpe final num boss mundial lich → *Heresia*, dano sagrado em área vs mortos-vivos) |

- Evolução canônica **não é farmável** — é estar no lugar certo, no momento histórico certo, com o item certo. No online, isso cria itens literalmente únicos no servidor.
- ✏️ Lista de eventos canônicos válidos: definir junto com world bosses (M3+) e PvP (M6+).

**Exemplos de Marca** (números ✏️ placeholder):

| Condição | Marca | Níveis | Efeito |
|---|---|---|---|
| 15.000 mortos-vivos mortos com a mesma espada | **Quebra-Ossos** | I–III | +10/15/20% dano vs mortos-vivos |
| 10.000 kills com golpe final abaixo de 10% do próprio HP | **Última Resposta** | I–II | +dano quando HP < 25% |
| 8.000 kills noturnos | **Lâmina da Vigília** | I | brilho fraco + dano extra à noite |
| Escudo bloqueou 50.000 golpes | **Inabalável** | I–III | chance de bloqueio total crescente |

✏️ _tabela alimentada pelo criador conforme o bestiário/itens nascem_

## 2. Mutações de Skill

Skill usada em volume extremo **muta**: muda qualitativamente e ganha nome. Não é rank (+5% dano) — é a skill virando outra coisa.

**O "como" importa tanto quanto o "quanto":** a sim rastreia o **perfil de uso**, e ele decide **qual** mutação nasce. A mesma Bola de Fogo pode virar coisas diferentes:

| Perfil de uso (10k usos) | Mutação | Efeito |
|---|---|---|
| Maioria dos usos à distância máxima | **Meteoro Distante** | alcance maior, dano cresce com a distância |
| Maioria à queima-roupa | **Eclosão Ígnea** | explosão centrada no caster, empurra inimigos |
| Maioria em alvos já queimando | **Fogo Voraz** | reacende e espalha queimadura em área |

- Cada skill tem **2–4 mutações possíveis** desenhadas à mão (✏️ por skill). Procedural não — nome e efeito são autorais.
- Mutação substitui a skill original (✏️ ou convive? proposta: substitui — escolha permanente e identitária).

## 3. Caminhos do Personagem

Padrões de comportamento do **personagem inteiro**. Dois sabores:

**a) Condutas (restrição mantida):**

| Condição | Caminho | Efeito |
|---|---|---|
| Lvl 20 usando uma única magia ofensiva | **Devoto do Único Verbo** | a magia ganha mutação exclusiva impossível de obter por uso |
| Lvl 30 sem nunca equipar armadura | **Pele de Ferro** | defesa base escala com nível |
| Lvl 25 sem nunca usar arma (só punhos/magia) | **Mão Vazia** | dano desarmado real + skills desarmadas |

**b) Estilo (padrão dominante):**

| Condição | Caminho | Efeito |
|---|---|---|
| ≥95% do dano causado via fogo+gelo por 20 níveis | **Senhor dos Extremos** | combinar fogo e gelo gera efeito novo (choque térmico) |
| ≥90% dos kills em grupo/perto de aliados (online) | ✏️ | ✏️ |

- Caminhos são a **especialização emergente da classe** (ver Classes): o mago que vira *Senhor dos Extremos* é, na prática, uma subclasse que ninguém escolheu.
- Lembrete: cada Caminho obtido encarece os próximos (regra de acúmulo).

✏️ _lista alimentada pelo criador_

---

## Classes (decidido — base fixa + especialização emergente)

O jogador escolhe uma **classe base simples** (kit inicial + afinidades). **Não existem subclasses escolhíveis** — especialização emerge via Caminhos e Mutações.

A classe base define **o que a sim rastreia com mais peso** para aquele personagem (as "lentes" dos contadores).

Quarteto base: **Knight / Mage / Rogue / Priest** (decidido). Sem 5ª classe "Monk" — **Monge é um Caminho emergente do Priest** (conduta *Mão Vazia*, decidido): o sistema gerando a primeira subclasse lendária por atitude.

> Estrutura decidida; fantasia/kits/números ✏️ refinam conforme M1/M2 avançam.

### Knight
- **Fantasia:** a muralha — aguenta o que ninguém aguenta e devolve em aço.
- **Kit inicial:** espada curta + escudo de madeira; skill *Golpe Forte* (ataque carregado).
- **Atributos-chave:** Força, Vitalidade
- **Lentes de rastreamento:** kills **por tipo de arma** (espada/machado/maça), kills por família de criatura **com a arma equipada**, golpes **bloqueados com escudo**, dano **absorvido**, kills em HP baixo.
- **Caminhos típicos:**
  1. *Inabalável* — 50k bloqueios com escudo → chance de bloqueio total
  2. *Fúria Encurralada* — milhares de kills com HP < 15% → dano cresce quando quase morto
  3. *Duas Mãos, Nenhuma Dúvida* — lvl 25 sem nunca equipar escudo → arma de 2 mãos ataca mais rápido
  4. *Carrasco de <família>* — volume extremo de kills de uma família (vs mortos-vivos, vs demônios…) → bônus contra ela (espelha as Marcas de item, mas no char)

### Mage
- **Fantasia:** o canal bruto dos elementos — frágil, devastador, obcecado.
- **Kit inicial:** cajado simples; magia *Bola de Fogo* + *Lança de Gelo*.
- **Atributos-chave:** Inteligência (dano/mana), Vitalidade (sobreviver)
- **Lentes de rastreamento:** dano **por elemento**, perfil de **distância** dos casts, **combos** elementais (alvo congelado recebendo fogo etc.), % do dano total vindo de magia.
- **Caminhos típicos:**
  1. *Senhor dos Extremos* — ≥95% do dano via fogo+gelo por 20 níveis → choque térmico (combo novo)
  2. *Coração de Cinzas* — mono-elemento fogo por 25 níveis → queimaduras não expiram, fogo upado / (variantes para cada elemento)
  3. *Devoto do Único Verbo* — lvl 20 com uma única magia ofensiva → mutação exclusiva dela
  4. *Intocado* — lvl 20 sem nunca causar dano físico (nem auto-attack) → mana regenera em combate

### Rogue
- **Fantasia:** a lâmina que você não viu — posição, timing e veneno.
- **Kit inicial:** adaga; skill *Apunhalar* (bônus por trás).
- **Atributos-chave:** Destreza (dano/esquiva/vel. ataque), Vitalidade
- **Lentes de rastreamento:** kills **pelas costas**, kills **à noite**, combates vencidos **sem tomar dano**, kills com alvo **envenenado**, kills com golpe final em alvo com HP cheio (one-shot de abertura).
- **Caminhos típicos:**
  1. *Sombra Sem Nome* — milhares de combates sem tomar nenhum dano → primeiro ataque de cada combate é crítico garantido
  2. *Filho da Noite* — volume extremo de kills noturnos → buff permanente à noite
  3. *Língua de Víbora* — 10k kills com veneno ativo → venenos empilham
  4. *Açougueiro Cirúrgico* — 10k apunhaladas conectadas → Apunhalar ganha mutação exclusiva

### Priest
- **Fantasia:** o canal do sagrado — sustenta os vivos, apaga os profanos.
- **Kit inicial:** cetro; magia *Luz Sagrada* (dano holy, forte vs mortos-vivos) + *Curar Ferimentos*.
- **Atributos-chave:** Espírito (cura/regen mana/resist. mágica), Inteligência (dano sagrado)
- **Lentes de rastreamento:** **cura total realizada**, kills vs mortos-vivos/demônios **com dano sagrado**, dano tomado **no lugar de aliados** (online), conduta de **nunca equipar arma**, conduta de pacifismo.
- **Caminhos típicos:**
  1. **Monge** (*Mão Vazia*) — lvl 25 sem nunca equipar arma, matando desarmado → dano desarmado real escala com nível + destrava skills marciais. **A "5ª classe" do jogo, que ninguém escolhe.**
  2. *Exorcista* — 15k mortos-vivos/demônios mortos com dano sagrado → holy ignora resistências profanas
  3. *Mártir* — volume extremo de dano absorvido protegendo aliados → cura a si ao curar outros (online)
  4. *Voto de Silêncio* ✏️ — lvl 20 só com cura e Luz Sagrada (nenhuma outra magia) → ✏️

> **Atenção de balance:** Priest precisa ser viável solo (Luz Sagrada como nuke vs undead resolve farm); caminhos de cura/proteção só brilham no online — ok, são apostas de longo prazo.

**Template para novas classes (se houver):**

```
### <Nome da classe>
- Fantasia: <uma frase>
- Kit inicial: <arma/skills lvl 1>
- Atributos-chave: <>
- Lentes de rastreamento: <quais contadores ela destrava — ex: guerreiro rastreia por arma, mago por elemento>
- Caminhos típicos (3–5 que esperamos que emerjam): <>
```

## Magias e Skills

Toda skill nasce **já preparada para o sistema**: com tags e contadores definidos no design, não adicionados depois. Aquisição: NPCs treinadores (ver Camada Sólida). Números de dano/custo/cooldown são ✏️ até o M1 dar a régua.

**Auto-attack** não é skill: é o ataque básico contínuo da arma equipada (estilo Tibia). Não muta — mas alimenta as **Marcas de item** (todo kill por auto-attack conta no ledger da arma).

**Duas categorias de skill:**
- **Comuns** — compráveis por **qualquer classe** em NPCs básicos. Garantem que toda classe tenha mobilidade, sustain mínimo e opção à distância. Também mutam.
- **Únicas** — restritas à classe. São a identidade do kit.

### Skills comuns (todas as classes)

#### Disparada
- **Tipo:** utilidade (burst de velocidade por ~2s ✏️)
- **Tags:** mobilidade
- **Custo / cooldown:** ✏️ / longo
- **Perfis rastreados:** direção relativa ao inimigo (fugindo vs engajando), HP ao usar
- **Mutações:**
  1. maioria fugindo com HP baixo → **Pés Alados** — ativar quebra slows/roots
  2. maioria engajando → **Ímpeto** — primeiro golpe após a disparada ganha bônus de dano

#### Primeiros Socorros
- **Tipo:** cura não-mágica (canalizada, cancela se tomar hit)
- **Tags:** cura, físico
- **Custo / cooldown:** ✏️ / longo — é o sustain solo de Knight/Rogue, não compete com Curar Ferimentos
- **Perfis rastreados:** em combate vs fora, HP no momento do uso
- **Mutações:**
  1. maioria com HP < 15% → **Sangue Frio** — não cancela mais ao tomar hit
  2. maioria fora de combate → **Descanso de Veterano** — cura também regenera ✏️ (stamina/debuffs)

#### Arremesso
- **Tipo:** projétil físico fraco (faca/pedra)
- **Tags:** físico, distância
- **Efeito base:** dano baixo — serve de pull e de finisher contra fugitivos
- **Perfis rastreados:** alvo fugindo, primeiro hit do combate (pull), golpe final
- **Mutações:**
  1. maioria em alvos fugindo → **Caçador** — aplica slow
  2. maioria como golpe final → **Pontaria Cruel** — dano enorme vs alvos < 15% HP

✏️ _mais comuns a definir (provocar? foco/meditação?)_

### Kit inicial — as 6 skills únicas do M1

#### Golpe Forte (Knight)
- **Tipo:** melee ativo (alvo selecionado)
- **Elemento/tags:** físico, arma
- **Custo / cooldown:** ✏️ mana baixa / ~6s
- **Efeito base:** golpe com a arma equipada por ~1.8× dano ✏️
- **Perfis rastreados:** HP do caster ao usar, uso logo após bloqueio (≤1s), golpe final (executou o alvo)
- **Mutações:**
  1. maioria dos usos com HP < 25% → **Golpe Desesperado** — dano escala com HP perdido
  2. maioria logo após bloquear → **Riposte** — após bloqueio, próximo Golpe Forte é instantâneo e crítico
  3. maioria como golpe final → **Lâmina do Fim** — dano massivo vs alvos abaixo de 20% HP

#### Bola de Fogo (Mage)
- **Tipo:** projétil
- **Elemento/tags:** fogo, queimadura (DoT)
- **Custo / cooldown:** ✏️
- **Efeito base:** dano de fogo + queimadura por Xs ✏️
- **Perfis rastreados:** distância do cast, alvo já queimando, alvos atingidos
- **Mutações:**
  1. maioria à distância máxima → **Meteoro Distante** — alcance maior, dano cresce com a distância
  2. maioria à queima-roupa → **Eclosão Ígnea** — explosão centrada no caster, empurra inimigos
  3. maioria em alvos já queimando → **Fogo Voraz** — reacende e espalha a queimadura em área

#### Lança de Gelo (Mage)
- **Tipo:** projétil perfurante (linha)
- **Elemento/tags:** gelo, lentidão
- **Custo / cooldown:** ✏️
- **Efeito base:** dano de gelo + slow por Xs ✏️
- **Perfis rastreados:** alvo já sob slow/congelado, alvos atingidos por cast (linha), distância do inimigo ao caster
- **Mutações:**
  1. maioria em alvos já lentos/congelados → **Estilhaço Profundo** — dano extra brutal em alvos sob gelo (shatter)
  2. maioria atravessando 2+ alvos → **Geada Perfurante** — perfura tudo na linha, slow maior por alvo atravessado
  3. maioria com inimigo adjacente (defensivo) → **Muralha de Inverno** — congela brevemente inimigos ao redor do caster

#### Apunhalar (Rogue)
- **Tipo:** melee posicional
- **Elemento/tags:** físico, posicional
- **Custo / cooldown:** ✏️
- **Efeito base:** golpe rápido; dano ~2× se atingir pelas costas ✏️
- **Perfis rastreados:** ângulo (costas/frente), HP do alvo no momento (abertura), alvo envenenado
- **Mutações:**
  1. maioria pelas costas → **Hemorragia** — abre ferida que sangra (DoT físico forte)
  2. maioria como abertura (alvo com HP cheio) → **Golpe Súbito** — dano enorme no primeiro golpe do combate
  3. maioria em alvos envenenados → **Lâmina Suja** — espalha e potencializa o veneno no alvo

#### Luz Sagrada (Priest)
- **Tipo:** projétil/smite
- **Elemento/tags:** sagrado, anti-profano
- **Custo / cooldown:** ✏️
- **Efeito base:** dano holy; bônus forte vs mortos-vivos/demônios ✏️ (é o nuke solo do Priest)
- **Perfis rastreados:** família do alvo (profano ou não), distância, HP do caster
- **Mutações:**
  1. maioria vs mortos-vivos/demônios → **Chama Purificadora** — profanos mortos explodem em luz (dano em área)
  2. maioria à queima-roupa → **Nova Sagrada** — vira explosão de luz centrada no caster
  3. maioria com HP cheio → **Fervor** ✏️ — dano aumenta enquanto não tomar dano
- **Nota de conduta:** Luz Sagrada não conta como "arma" — compatível com o Caminho **Monge** (*Mão Vazia*).

#### Curar Ferimentos (Priest)
- **Tipo:** cura (self/alvo aliado)
- **Elemento/tags:** sagrado, cura
- **Custo / cooldown:** ✏️
- **Efeito base:** restaura HP ✏️
- **Perfis rastreados:** alvo (self vs aliado), HP do alvo no momento, em combate vs fora
- **Mutações:**
  1. maioria em aliados (online) → **Graça Compartilhada** — a cura salta para um segundo aliado próximo
  2. maioria em self com HP < 20% → **Último Suspiro** — cura muito mais forte quando quase morto
  3. maioria em combate → **Prece de Guerra** — curar emite pulso de dano sagrado em profanos adjacentes

### Roster planejado — tier intermediário (✏️ fichas completas no M3)

| Classe | Skill | Uma linha |
|---|---|---|
| Knight | *Investida* | charge até o alvo, breve atordoamento |
| Knight | *Grito de Guerra* | provoca/força agro em área (tank de grupo no online) |
| Knight | *Redemoinho* | golpe em área ao redor de si |
| Mage | *Onda de Chamas* | wave cônica estilo Tibia |
| Mage | *Nevasca* | área contínua de gelo no chão |
| Mage | *Barreira Arcana* | escudo que consome mana no lugar de HP |
| Rogue | *Passo das Sombras* | reposiciona instantaneamente atrás do alvo |
| Rogue | *Lâmina Envenenada* | buff: ataques aplicam veneno por Xs |
| Rogue | *Leque de Facas* | cone de projéteis curto |
| Priest | *Escudo Sagrado* | barreira em si/aliado |
| Priest | *Consagrar* | área sagrada no chão (dano a profanos, ✏️ cura aliados?) |
| Priest | *Punhos da Fé* | melee **desarmado** sagrado — a porta de entrada do Caminho Monge |

**Template para novas skills:**

```
### <Nome>
- Classe(s): <ou "comum">
- Tipo: <projétil / área / wave (estilo Tibia) / buff / cura / melee / utilidade>
- Elemento/tags: <fogo, gelo, sagrado… — alimentam Caminhos de estilo>
- Requisitos de compra: <classe, nível, gold, NPC/tier de acesso>
- Custo / cooldown: <>
- Efeito base: <>
- Perfis de uso rastreados: <distância, alvo queimando, HP do caster…>
- Mutações possíveis (2–4):
  1. <condição de perfil> → **<Nome>** — <efeito>
  2. ...
```

✏️ _tiers avançados (quests/bosses) preenchidos conforme M3_

---

## Implicações técnicas (resumo p/ implementação)

- **Tudo na sim.** Contadores, condições e desbloqueios em `src/sim/` (determinístico, serializável). Client só recebe eventos de hint/unlock via snapshot/evento no `protocol.ts`.
- **Itens são instâncias com ID + ledger**, não stacks de template. Definir cedo (M2 — inventário/equipamento) para não retrofitar.
- Contadores são **dados, não código**: condições de Marca/Mutação/Caminho descritas como definições (tipo de evento + filtro + threshold), avaliadas por um sistema genérico de tracking. Adicionar conteúdo novo = adicionar definição, não lógica.
- Eventos da sim que alimentam tudo: `kill` (quem, com quê, vítima, contexto), `skill_use` (skill, alvo, distância, estado), `damage`, `block`, `level_up`. Desenhar o combate (M1) já emitindo esses eventos.

## Aberto / a decidir ✏️

- [ ] Números reais de thresholds (calibrar com tempo médio de kill/uso quando o combate existir) — inclui thresholds dos níveis II/III de Marca
- [ ] Quebrar conduta **antes** de adquirir: perde a chance para sempre (NetHack) ou só zera o progresso? (pós-aquisição já decidido: permanente)
- [ ] Mutação substitui ou convive com a skill original? (proposta: substitui)
- [ ] Rito de substituição/fusão de Marca em item com slots cheios?
- [ ] Multiplicador de dificuldade por Caminho acumulado (ex: ×1.5)
- [ ] % de XP perdida na morte; pode deslevelar? Punições secundárias leves (gold? debuff?)
- [ ] Lista de eventos canônicos que evoluem Marcas (world bosses no M3+, PvP no M6+)
- [ ] Curva de XP / força dos mobs — números no M2

### Decididos recentemente (histórico)

- ✅ Morte: pune pesado em XP, **nunca** perde itens/Marcas
- ✅ Permanência total: Marcas/Mutações/Caminhos não se perdem por nada (conduta pós-aquisição inclusa)
- ✅ Marcas de item: 1–3 níveis por repetição; evolução qualitativa só por evento canônico
