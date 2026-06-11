# Skills — Catálogo (roster + fichas)

> Sub-doc de `DESIGN-SKILLS.md` (hub). Aqui vivem o **índice mestre** (todas as skills por requisito) e as **fichas detalhadas**. As decisões de estrutura — gating, os três eixos, anti-treadmill, espinho de bandas, assimetria, **convenção de nomes** — estão no hub. Números (✏️ Balancista) e fonte/placement (✏️ world-design, nas specs de fatia) ficam abertos.
>
> **Nomes = par EN / PT** (sem palavra de encantamento inventada — hub §7). **Confirmados (criador):** Heal/Cura · Lume · Conjure Arrow/Conjurar Flechas · Blessing/Bênção · Rend/Retalho · Steelstorm/Vendaval de Aço · Earthen Grasp/Garras da Terra · Life Drain/Dreno Vital · Sacred Aura/Aura Sagrada. Os demais pares EN são **draft** (✏️ refinar com Loremaster); o PT é o nome de trabalho.
>
> **Coluna Banda** = posição no espinho de progressão (hub §4): ① abertura · ② caixa de ferramentas · ③ 2º eixo de dano · ④ power spike de AoE (~lvl 20) · ⑤ maestria/nicho.
>
> **Adicionadas no spin-out (jun/2026; sem ficha ainda):** Arcane Dart, Sparks, Bolt, Storm, Blink, Earthen Grasp, Life Drain (Int) · Piercing Shot, Rend, Steelstorm (Des) · Blessing, Burst of Light, Sacred Aura (Esp).

## Catálogo

### Lista de skills por requisito

> Índice mestre. Requisito = atributo + nível (ver hub §1). Tier = leva de design (M1 desenhada / T1-T3 planejadas). **AoE-de-dano = gate ~lvl 20 para qualquer classe** (hub §6).

| Requisito | Skill (EN / PT) | Arquétipo | Uma linha | Tier | Banda |
|---|---|---|---|---|---|
| Universal (escala Esp) | **Heal / Cura** | cura/sustain | cura mágica instantânea, spammável | M1 | ① |
| Universal | **Lume** | utilidade/exploração | ilumina ao redor por Xs | M1 | ① |
| Universal | *Throw / Arremesso* | dano/distância | projétil físico fraco (pull/finisher) | M1 | ① |
| Universal | *Dash / Disparada* | mobilidade | burst de velocidade | M1 | ② |
| Universal | *First Aid / Primeiros Socorros* | sustain (sem mana) | cura canalizada não-mágica | M1 | ② |
| For + lvl | *Heavy Strike / Golpe Forte* | dano melee | burst com a arma equipada | M1 | ① |
| For + lvl | *Charge / Investida* | mobilidade+controle | charge até o alvo + atordoamento | T1 | ③ |
| Vit + lvl | *War Cry / Grito de Guerra* | controle/taunt | força agro em área (tank) | T1 | ② |
| Vit + lvl (~10–15) | **Bulwark / Baluarte** ✏️ | defesa ativa | janela de redução de dano/bloqueio (resposta do Knight a packs) | T1 | ② |
| For + lvl (**~lvl 20**) | *Whirlwind / Redemoinho* | dano AoE | golpe ao redor de si — AoE-dano | T2 | ④ |
| Des + lvl | *Backstab / Apunhalar* | dano melee posicional | backstab (~2× pelas costas) | M1 | ① |
| Des + lvl | *Poison Blade / Lâmina Envenenada* | buff/DoT | ataques aplicam veneno por Xs | T1 | ② |
| Des + lvl | **Conjure Arrow / Conjurar Flechas** | utilidade/recurso | mana alta → flechas temporárias | T1 | ② |
| Des + lvl | **Stealth / Furtividade** ✏️ | utilidade/mobilidade | esgueirar breve, garante uma abertura de backstab | T1 | ③ |
| Des + lvl | **Piercing Shot / Disparo Perfurante** | dano ranged | tiro single-target à distância (caminho do arco) | T1 | ③ |
| Des + lvl | **Rend / Retalho** | dano + DoT (sangramento) | corte que abre sangramento no alvo (single-target) | T1 | ③ |
| Des + lvl (**~lvl 20**) | **Steelstorm / Vendaval de Aço** | dano AoE | giro de lâminas ao redor — AoE-dano (pack-answer) | T2 | ④ |
| Int + lvl | **Arcane Dart / Dardo Arcano** | dano single barato | pão-com-manteiga sem elemento (pré-Fireball) | T1 | ① |
| Int + lvl | **Sparks / Fagulhas** | dano AoE FRACO (chip) | fagulhas que saltam entre 2–3 alvos próximos — **lasca, não deleta** (chip-AoE do Mage, hub §6) | T1 | ② |
| Int + lvl | *Fireball / Bola de Fogo* | dano (fogo + DoT) | projétil que queima | M1 | ② |
| Int + lvl | *Frost Lance / Lança de Gelo* | dano + controle (gelo) | linha perfurante + lentidão | M1 | ② |
| Int + lvl | *Wall / Muralha* | controle/utilidade | bloqueia um corredor (jogada-de-veterano) | T1 | ② |
| Int + lvl | *Arcane Barrier / Barreira Arcana* | defesa | mana absorve dano no lugar do HP | T1 | ② |
| Int + lvl | **Blink / Piscar** | mobilidade | blink curto — reposiciona/escapa | T1 | ③ |
| Int + lvl | **Bolt / Raio** | dano (raio, linha) | feixe instantâneo, sem viagem de projétil | T2 | ③ |
| Int + lvl | *Blizzard / Nevasca* | controle (gelo, campo) | campo de lentidão no chão (dano desprezível) | T2 | ② |
| Int + lvl (**~lvl 20**) | *Flame Wave / Onda de Chamas* | dano (fogo, wave) | leque de chamas à frente — AoE-dano | T2 | ④ |
| Int + lvl (**~lvl 20**) | **Storm / Tempestade** | dano (raio, AoE) | descarga em área — AoE-dano | T2 | ④ |
| Int + lvl | **Earthen Grasp / Garras da Terra** | controle + dano (terra) | **skillshot** 2–3 casas + cast-time → ROOT na área (não-target — ver nota) | T3 | ⑤ |
| Int + lvl | *Life Drain / Dreno Vital* | dano + lifedrain (morte) | suga HP do alvo pro caster (single-target) | T3 | ⑤ |
| Esp + lvl | **Purify / Purificar** ✏️ | sustain/cleanse | cura veneno e debuffs | T1 | ② |
| Esp + lvl (sagrado) (maior) | *Sacred Aura / Aura Sagrada* | cura em grupo | cura aliados numa área; gate Esp/lvl + mana **maiores** que o Heal (hub §3) | M1 | ③ |
| Esp + lvl (sagrado) | *Holy Shield / Escudo Sagrado* | defesa | barreira em si/aliado | T1 | ② |
| Esp + lvl (sagrado) | *Consecrate / Consagrar* | zona/controle | área sagrada no chão (controle, dano desprezível) | T1 | ② |
| Esp + lvl (sagrado) | **Blessing / Bênção** | buff | regen/resistência em si/aliado por Xs | T1 | ② |
| Esp + lvl (sagrado) | *Holy Light / Luz Sagrada* | dano sagrado | smite anti-profano (nuke solo vs undead) | M1 | ③ |
| Esp + lvl (sagrado) (**~lvl 20**) | **Burst of Light / Explosão de Luz** | dano AoE | nova sagrada anti-pack vs undead — AoE-dano | T2 | ④ |
| Esp + lvl (sagrado) | *Fists of Faith / Punhos da Fé* | melee desarmado sagrado | porta de entrada do Caminho Monge | T2 | ⑤ |

**Contagem (~38):** Universais 5 · Força/Vit 5 · Destreza 7 · Inteligência 13 · Espírito 8. Ordem **Int > Esp > Des > For** (hub §5).

> **Mecânicas novas a especificar na sim (spec pronta):** *Garras da Terra* = **skillshot de área + cast-time** (`groundTarget`); *Aura Sagrada* = **burst radial** (`selfRadius`); *Dreno Vital* = **lifedrain**; *Sparks* = **chain**; *Rend* = status **bleed**. Hoje os targetings são só meleeTarget/meleePositional/projectileTarget/lineThrough/healTarget. **Spec-de-dados completa** (campos, mapa skill→primitivo, mudanças de protocolo, ordem de implementação): `docs/reports/2026-06-11-spec-targetings-novos.md`. **Números:** `docs/reports/2026-06-11-briefing-balancista-skills.md`.

### Universais (qualquer classe — gate baixo/nenhum)

#### Heal / Cura
- **Tipo:** cura instantânea (self / aliado)
- **Arquétipo:** sustain
- **Requisito:** universal (gate baixo) · **escala com Espírito** — todos conjuram, o Priest cura muito mais
- **Custo / cooldown:** mana baixa / curto — a cura *spammável* do dia a dia
- **Distinção das vizinhas:** *Primeiros Socorros* = canalizada, **sem mana**, cancela ao tomar hit; **esta** = mágica, **instantânea**, custa mana. O eixo é **mecanismo**, não degrau de número (a "cura grande" como número maior está vetada — hub §3).
- **Perfis rastreados:** self vs aliado · HP no momento do uso · em combate vs fora
- **Mutações:**
  1. maioria em HP crítico → **Reflexo Vital** — cura muito maior quando quase morto
  2. maioria fora de combate → **Recuperação** — deixa um regen leve após o cast
  3. maioria em aliados → **Mãos Generosas** — pinga um pouco no caster / salta para aliado próximo

#### Lume
- **Tipo:** utilidade
- **Arquétipo:** exploração
- **Requisito:** universal (gate nenhum)
- **Custo / cooldown:** baixos
- **Efeito base:** emite luz ao redor do caster por Xs ✏️
- **Por que importa:** escuridão vira recurso de verdade (pilar 1/4) — caverna escura é perigo legível e a luz é a ferramenta. Cria tensão com os Caminhos noturnos do Rogue (*Filho da Noite* **abre mão** da luz).
- **Perfis rastreados:** tempo em escuridão · exploração vs combate
- **Mutações:**
  1. muito uso em escuridão prolongada → **Luz Duradoura** — raio e duração maiores
  2. maioria em combate → **Lampejo** — ao conjurar, breve cegueira em inimigos adjacentes

#### Dash / Disparada
- **Tipo:** utilidade (burst de velocidade por ~2s ✏️)
- **Tags:** mobilidade
- **Custo / cooldown:** ✏️ / longo
- **Perfis rastreados:** direção relativa ao inimigo (fugindo vs engajando), HP ao usar
- **Mutações:**
  1. maioria fugindo com HP baixo → **Pés Alados** — ativar quebra slows/roots
  2. maioria engajando → **Ímpeto** — primeiro golpe após a disparada ganha bônus de dano

#### First Aid / Primeiros Socorros
- **Tipo:** cura não-mágica (canalizada, cancela se tomar hit)
- **Tags:** cura, físico
- **Custo / cooldown:** ✏️ / longo — é o sustain solo de Knight/Rogue, não compete com a Cura mágica
- **Perfis rastreados:** em combate vs fora, HP no momento do uso
- **Mutações:**
  1. maioria com HP < 15% → **Sangue Frio** — não cancela mais ao tomar hit
  2. maioria fora de combate → **Descanso de Veterano** — cura também regenera ✏️ (stamina/debuffs)

#### Throw / Arremesso
- **Tipo:** projétil físico fraco (faca/pedra)
- **Tags:** físico, distância
- **Efeito base:** dano baixo — serve de pull e de finisher contra fugitivos
- **Perfis rastreados:** alvo fugindo, primeiro hit do combate (pull), golpe final
- **Mutações:**
  1. maioria em alvos fugindo → **Caçador** — aplica slow
  2. maioria como golpe final → **Pontaria Cruel** — dano enorme vs alvos < 15% HP

✏️ _mais universais a definir — candidato: **Foco/Meditação** (regen de mana canalizado fora de combate)._

### Fichas detalhadas — primeiras skills (M1)

> **Não é "kit inicial"** — ninguém começa com elas; são só as primeiras desenhadas. Requisito no modelo de gating (hub §1) — tudo por atributo + nível: sagrado (*Luz Sagrada*, *Curar Ferimentos*) = Espírito + nível; Golpe Forte→For, Bola/Lança→Int, Apunhalar→Des. Fonte (NPC/drop/quest) ✏️ na fatia.

#### Heavy Strike / Golpe Forte (For)
- **Tipo:** melee ativo (alvo selecionado)
- **Elemento/tags:** físico, arma
- **Custo / cooldown:** ✏️ mana baixa / ~6s
- **Efeito base:** golpe com a arma equipada por ~1.8× dano ✏️
- **Perfis rastreados:** HP do caster ao usar, uso logo após bloqueio (≤1s), golpe final (executou o alvo)
- **Mutações:**
  1. maioria dos usos com HP < 25% → **Golpe Desesperado** — dano escala com HP perdido
  2. maioria logo após bloquear → **Riposte** — após bloqueio, próximo Golpe Forte é instantâneo e crítico
  3. maioria como golpe final → **Lâmina do Fim** — dano massivo vs alvos abaixo de 20% HP

#### Fireball / Bola de Fogo (Int)
- **Tipo:** projétil
- **Elemento/tags:** fogo, queimadura (DoT)
- **Custo / cooldown:** ✏️
- **Efeito base:** dano de fogo + queimadura por Xs ✏️
- **Perfis rastreados:** distância do cast, alvo já queimando, alvos atingidos
- **Mutações:**
  1. maioria à distância máxima → **Meteoro Distante** — alcance maior, dano cresce com a distância
  2. maioria à queima-roupa → **Eclosão Ígnea** — explosão centrada no caster, empurra inimigos
  3. maioria em alvos já queimando → **Fogo Voraz** — reacende e espalha a queimadura em área

#### Frost Lance / Lança de Gelo (Int)
- **Tipo:** projétil perfurante (linha)
- **Elemento/tags:** gelo, lentidão
- **Custo / cooldown:** ✏️
- **Efeito base:** dano de gelo + slow por Xs ✏️
- **Perfis rastreados:** alvo já sob slow/congelado, alvos atingidos por cast (linha), distância do inimigo ao caster
- **Mutações:**
  1. maioria em alvos já lentos/congelados → **Estilhaço Profundo** — dano extra brutal em alvos sob gelo (shatter)
  2. maioria atravessando 2+ alvos → **Geada Perfurante** — perfura tudo na linha, slow maior por alvo atravessado
  3. maioria com inimigo adjacente (defensivo) → **Muralha de Inverno** — congela brevemente inimigos ao redor do caster

#### Backstab / Apunhalar (Des)
- **Tipo:** melee posicional
- **Elemento/tags:** físico, posicional
- **Custo / cooldown:** ✏️
- **Efeito base:** golpe rápido; dano ~2× se atingir pelas costas ✏️
- **Perfis rastreados:** ângulo (costas/frente), HP do alvo no momento (abertura), alvo envenenado
- **Mutações:**
  1. maioria pelas costas → **Hemorragia** — abre ferida que sangra (DoT físico forte)
  2. maioria como abertura (alvo com HP cheio) → **Golpe Súbito** — dano enorme no primeiro golpe do combate
  3. maioria em alvos envenenados → **Lâmina Suja** — espalha e potencializa o veneno no alvo

#### Conjure Arrow / Conjurar Flechas
- **Tipo:** conjuração
- **Arquétipo:** utilidade / recurso
- **Requisito:** Des + lvl ✏️ (afinidade arqueiro)
- **Custo / cooldown:** **mana alta** / médio — o custo de mana é o "preço" da munição
- **Efeito base:** cria uma pilha de **flechas temporárias** (expiram em Xs ou ao deslogar ✏️). Função econômica: **alivia o sink de gold do arqueiro** sem zerá-lo. Não é dano — é logística.
- **Perfis rastreados:** flechas conjuradas vs compradas · % da munição gasta que veio de conjuração
- **Mutações:**
  1. uso quase total via conjuração (raramente compra) → **Aljava Infinita** — rende mais flechas por cast / custo de mana menor
  2. ✏️ maioria conjurada sob pressão (em combate, mana baixa) → **Flecha de Emergência** — conjura instantâneo um punhado, cooldown próprio

#### Holy Light / Luz Sagrada (Esp)
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

#### Sacred Aura / Aura Sagrada (Esp)
- **Tipo:** cura em **área/grupo** (pulso radial centrado no caster) — verbo distinto da *Heal* individual (hub §3), não "Heal maior"
- **Elemento/tags:** sagrado, cura, área
- **Requisito:** Espírito + nível **maiores** que o Heal individual (gate de meio-jogo)
- **Custo / cooldown:** **mana alta** / ✏️ — é a cura cara, não o spam do dia a dia
- **Efeito base:** cura todos os aliados num raio ao redor do caster (solo = cura só você dentro do raio; brilha no online)
- **Perfis rastreados:** nº de aliados curados por cast, HP médio dos alvos, em combate vs fora
- **Mutações:**
  1. maioria curando 3+ aliados → **Graça Compartilhada** — raio maior / cura extra por aliado atingido
  2. maioria em combate sob pressão → **Refúgio** — deixa uma zona de regen no chão por alguns segundos
  3. maioria vs profanos por perto → **Prece de Guerra** — o pulso também causa dano sagrado em profanos adjacentes

## Roster T1/T3 — fichas completas no M3

> As skills sem ficha acima (T1/T2/T3 e as **[novas]**) ganham ficha detalhada quando o Balancista dá a régua e o Loremaster os nomes. O verbo de cada uma está na coluna "Uma linha" do índice; o requisito e a banda no índice.
>
> **Removidas (jun/2026):** *Passo das Sombras* (sobrepunha o Apunhalar — blink-pras-costas vs backstab eram a mesma jogada) e *Leque de Facas* (kit do Rogue já tinha dano demais; deu lugar a recurso/furtividade). Critério: skill que não traz **verbo novo** não entra (hub §3).

**Template para novas skills:**

```
#### <Nome> (<atributo>)
- Tipo: <projétil / área / wave / buff / cura / melee / utilidade>
- Arquétipo: <dano / controle / defesa / sustain / mobilidade / utilidade-recurso>
- Elemento/tags: <fogo, gelo, sagrado…>
- Requisito: <universal | atributo + nível> — nunca "de classe"
- Fonte: <NPC | drop (tomo) | NPC+drop | quest> — placement ✏️ na fatia
- Custo / cooldown: <>
- Efeito base: <verbo distinto — não pode ser "versão maior" de outra skill>
- Perfis rastreados: <distância, alvo queimando, HP do caster…>
- Mutações possíveis (2–4):
  1. <condição de perfil> → **<Nome>** — <efeito>
```
