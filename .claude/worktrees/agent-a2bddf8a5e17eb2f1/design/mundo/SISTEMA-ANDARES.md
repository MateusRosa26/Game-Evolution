# Mundo — Sistema de Andares (z-levels)

> Sub-documento de [DESIGN-MUNDO.md](DESIGN-MUNDO.md) (hub). Especifica a **verticalidade real estilo Tibia**: andares empilhados num único espaço de coordenadas, buracos vazados (vê o andar de baixo), escada/corda/pá, cavernas escuras. Consome [EXPLORACAO.md](EXPLORACAO.md) §Ferramentas (pá/corda/tocha — já desenhadas) e a iluminação do client.
>
> **Status: DESENHO (criador escolheu z-level real + sistema completo, 08/jun/2026).** Isto **sobrescreve** a decisão anterior de DESIGN-MUNDO §recorte ("dungeons como mapas separados, adia z-level"). Implementação faseada (§Faseamento). ✏️ = decisão do criador ainda aberta.

## 1. Ancoragem (filosofia)

- **Pilar 3 (recompensa ∝ opacidade):** descer afasta da segurança e arrisca por loot melhor; o fundo é o prêmio.
- **Tier por profundidade** (EXPLORACAO §gradiente): entrada T1 → profundezas T3; o jogador **vê o próprio futuro** pelo buraco ("um dia eu desço"); último andar = muro T4.
- **Descoberta (dial Hidden):** buraco cavado com pá e caverna escondida = segredo puro (pilar 3).
- **Custo de fuga (pilar "jogo difícil"):** "descer é fácil, voltar exige corda" (EXPLORACAO) ganha mecânica literal — alguns buracos prendem (válvula = morte/respawn).

## 2. Modelo de coordenadas

- Posição ganha **`z` inteiro**. **Convenção:** `z = 0` é o overworld (entardecer frio); **`z < 0` = subsolo** (esgotos, cavernas, dungeons — descer = `z−1`); **`z > 0` = acima** (telhado/andar de casa, montanha — Fase 2).
- O mundo é um **espaço 3D `(x,y,z)`**: o mesmo `(x,y)` existe em vários andares (esgoto fica LITERALMENTE sob a cidade).
- **Armazenamento esparso (decidido):** cada andar é uma **camada localizada** — um retângulo em coords de mundo, não um grid 800×800 inteiro por z. Overworld `z=0` = full 800×800; `z=−1` sob Alvorada = só o rect dos Esgotos. Camada = `{ z, ox, oy, w, h, tiles, lights, decor, monsters, portals, ambient }`. Andares sem conteúdo não existem.

## 3. Vocabulário de transição (consome EXPLORACAO §Ferramentas)

Toda transição é **dado no andar** (`portals[]`), fiel a "conteúdo = dados".

| Tipo | Verbo | Direção | Dial | Regra |
|---|---|---|---|---|
| **Escada** (`stairs`) | pisar | bi (par cima/baixo) | Clear | pisa no tile → vai pro `to:{x,y,z}` pareado |
| **Boca de caverna** (`cave`) | pisar | bi | Clear/Cryptic | entrada na encosta → `to` no andar da caverna |
| **Buraco** (`hole`) | pisar/cair | **só desce** | Cryptic/Hidden | cai pra `(x,y,z−1)` **às cegas** (não vê o de baixo — o risco É não saber) |
| **Ponto de corda** (`rope_spot`) | usar **corda** | sobe | Clear | sobe pra `(x,y,z+1)` (volta do fundo do buraco) |
| **Terra solta** (`dig_spot`) | usar **pá** | abre buraco | **Hidden** | cava → vira `hole` temporário (segredo; tile visivelmente diferente = telegrafia honesta) |

- **Caverna escura:** camadas `z<0` têm `ambient` baixo/breu → **tocha** vira necessidade (usa a iluminação existente). É a tríade da EXPLORACAO fechando: descer (escada/buraco) + voltar (corda) + ver (tocha).
- **Efeitos de ferramenta são TEMPORÁRIOS + compartilhados** (já decidido em EXPLORACAO): buraco cavado **se fecha** após `X` ✏️; rebrota etc. Nenhuma ferramenta muda o mapa pra sempre (compatível com Princípio MMO + Permanência).
- **Buraco-armadilha (autoral):** alguns `hole` não têm `rope_spot`/escada de volta no fundo → preso de verdade, válvula = morrer (EXPLORACAO §corda). Pontual, telegrafado pelo medo, não regra geral.

## 4. Regras (sim autoritativa — REGRA DE OURO)

- **Transição é resolvida na sim** ao pisar no portal (ou ao usar a ferramenta): valida, move a entidade pro `(x,y,z)` destino, emite evento.
- **Pathfinding é POR ANDAR** (A* dentro da camada z). Movimento entre andares só pelos portais (o grafo de portais liga as camadas; auto-walk cross-floor = roteia até o portal, transiciona, continua ✏️ Fase 2).
- **Colisão/ocupação por `(x,y,z)`** — entidades só colidem/interagem no mesmo andar.
- **Monstros não trocam de andar** (MVP) — IA opera na própria camada (aggro/leash por andar). ✏️ perseguição cross-floor depois.

## 5. Renderização — visibilidade entre andares é por ABERTURA (decidido — realismo)

> **Regra-mãe (decidido 08/jun/2026):** você só enxerga outro andar onde existe uma **abertura real** entre eles. Estrutura sólida (rocha de caverna, teto fechado) **bloqueia** — vê-se só o andar atual. NÃO é a transparência-blanket do Tibia (que mostra o andar de baixo por toda borda — gamey/irrealista). Isso é mais realista E mais simples de implementar.

- Seja `pz` o andar do jogador.
- **Andar atual `pz`:** desenhado inteiro (chão em chunks + objetos y-sorted, como hoje). É o caso comum.
- **Caverna/dungeon (subsolo sólido):** **SEM vista entre andares** — cada andar é uma cena autocontida. Descer escada = **corte de cena** pro andar de baixo (rebuild da cena), não transparência. (Render ≈ o de hoje, só que por andar — barato.)
- **Aberturas revelam o andar adjacente** (a abertura é **dado no andar**: flag no tile). Só ali se desenha um pedaço do andar vizinho, atenuado por profundidade:
  - **Vão de escada aberto** → vê o andar de **baixo** pela caixa da escada.
  - **Varanda / sacada / mezanino** → vê o andar de **baixo** na borda aberta.
  - **Janela / clarabóia / teto aberto** → vê o andar de **cima** conforme o ângulo.
  - **Buraco** → **NÃO** revela (cair é às cegas, §3). É portal, não abertura visual.
- **Teto/telhado sólido acima do jogador:** oculto enquanto você está embaixo (você o atravessou pra entrar) — regra de Fase 2 (telhados de casa).
- **Entidades** renderizam no seu andar; só aparecem de outro andar pela janela de uma abertura (atenuadas). y-sort por pixel-Y **dentro do andar**.
- **Transição visual:** trocar de andar = rebuild da cena do novo `pz` (+ as poucas aberturas visíveis). Cair num buraco = pequena animação de queda ✏️ (client).

## 6. Iluminação por andar

- Cada camada tem `ambient` próprio: `z=0` = entardecer frio atual; `z<0` = **breu** (ambiente quase preto) → só tochas/luzes do andar iluminam. Reusa `Lighting.ts` (RenderTexture aditiva), trocando a cor ambiente por andar.
- Tocha (item consumível) = luz móvel no jogador enquanto ativa (EXPLORACAO: "tocha que não apaga" é item raro de facilitação).

## 7. Protocolo & dados

- **`Vec2`/posição ganham `z`** (ou `EntityState.z` + tiles endereçados por `(x,y,z)`). Snapshot inclui `z` das entidades.
- **Novo comando:** `useTool { tool: "rope" | "shovel" | "torch"; x: number; y: number }` (pá/corda agem no tile alvo; tocha no próprio jogador). ✏️ nome (`useItem` genérico?).
- **Envio de andares ao client:**
  - MVP single-player: **manda todas as camadas no `welcome`** (simples).
  - ✏️ Online/800×800: **streaming por região** (manda a camada/região ao aproximar) — `welcome` traz só o entorno; mensagem `loadFloor`/`changeFloor` ao transicionar. Decisão adiável (não bloqueia MVP).
- Pá/corda/tocha como **itens** (templates) — hoje só há armas em `items/templates.ts`; criar a categoria "ferramenta" (✏️ Balancista: preço; Loremaster: nomes já existem).

## 8. Princípio MMO / por-personagem

- **`z` é estado por-personagem** (cada jogador num andar). Snapshot é **por andar** (você só recebe entidades do seu andar + as visíveis pelos buracos) — anti-datamine e escalável.
- Estado do mundo (camadas, portais) é compartilhado. Efeitos de ferramenta (buraco cavado) são **temporários + compartilhados** (já decidido) — viajam no estado do andar, não em flag secreta.

## 9. ✏️ Decisões abertas (criador)

1. **Profundidade através de aberturas empilhadas**: por uma abertura, mostra 1 andar adjacente ou encadeia (buraco sob buraco → 2)? (proposta: **1 andar por abertura**; encadear é raro). Nota: **portal** (transporta, §3) e **abertura visual** (revela, §5) são eixos separados — só o **vão de escada aberto** é os dois. Buraco = portal sem revelar (cai às cegas). Varanda/janela = revela sem transportar.
2. **Convenção de `z`**: `z<0` = subsolo (proposta) — confirmar sinal.
3. **Envio de andares**: tudo no welcome (MVP) vs streaming por região (online) — quando virar.
4. **Timers** de fechamento de buraco cavado / rebrota (EXPLORACAO já decidiu que fecham; falta o número — Balancista).
5. **Animação de queda** no buraco (client) — sim/não.
6. **Telhados/subir (Fase 2)**: casa = `z=0` interior + `z=1` telhado? como o telhado some ao entrar?

## 10. Faseamento de implementação

- **Fase 0 — fundação:** `z` no modelo (sim/shared), camadas esparsas no `World`, `portals[]`, pathfinding por andar, snapshot/protocolo com `z`. Sem render novo ainda (testa por log/teleporte).
- **Fase 1 — DESCER (o pedido):** escada + boca de caverna (transições) → **Esgotos de Alvorada** como primeira dungeon z-level. Render: andar atual + andar de baixo pelos buracos (vazado, atenuado). Caverna escura + tocha. Corda (subir) + buraco (cair) + pá (cavar segredo).
- **Fase 2 — SUBIR:** telhados de prédio (z>player, regra de ocultar teto), andar de cima de casas, montanha. Destrava o telhado/interior enterável das casas (frente do enxaimel).
- **Fase 3 — polimento:** auto-walk cross-floor, perseguição de mob cross-floor, streaming de andares (online), animação de queda.

> Mapa de decisões: §9. Tudo ✏️ ali é do criador; o resto é proposta implementável.
