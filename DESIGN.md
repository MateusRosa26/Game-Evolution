# RPG — Documento de Design

> Documento vivo. As seções marcadas com ✏️ serão preenchidas/alimentadas pelo criador do jogo ao longo do desenvolvimento.

## Visão

RPG top-down em grid, inspirado em **Tibia / Ragnarok / Apogea**. Pixel art moderna 32px com iluminação dinâmica. Ambientação entre **fantasia medieval e dark fantasy**.

- **Plataforma:** browser primeiro → Steam (Electron) → online (game server Node + Supabase para conta/persistência).
- **Visual:** "charmoso sem ser bobo" — o charme vem de luz, atmosfera e feedback, não de resolução de sprite.
- **Idiomas (decidido):** lançamento em **inglês + português**, selecionável pelo jogador (playerbase PT-BR é pequena; EN abre o mundo). Consequência técnica desde já: **nenhum texto hardcoded** — todo conteúdo (nomes, diálogos, quests, itens) referencia chaves de localização; a sim só conhece IDs.

## Sistema (decidido)

| Sistema | Decisão |
|---|---|
| Mundo | Grid de tiles 32px, movimento tile a tile com animação suave |
| Controles | WASD/setas (8 direções) + click-to-move com pathfinding A* |
| Simulação | Tick-based 20/s, autoritativa, determinística (RNG seedado) |
| Combate | Híbrido: alvo selecionado + auto-attack contínuo + skills de área/direção manuais (estilo runas/waves de Tibia) |
| Colisão | **Bloqueio de corpo** (estilo Tibia): entidades vivas ocupam o tile — sem atravessar/empilhar players ou mobs (cercar/segurar corredor é gameplay; crítico p/ PvP). Duas exceções: **zonas seguras** (depot e **áreas de respawn**: atravessar permitido — AFKs não trancam ninguém no spawn —, mobs não entram, IA cega, e **sem combate a partir de dentro**: nem auto-attack nem skill ofensiva; cura pode) e **zonas de passagem** (chegada de escada/alavanca/portal: sem bloqueio de corpo — ninguém é ejetado nem trava o mecanismo — mas tile normal no resto: mobs passam, combate vale) |
| Câmera | Top-down, zoom 2x, seguimento suave |
| Outfits | **Estilo Tibia, por peças**: cabeça/peito/pernas mixáveis entre sets + cor por peça da **grade curada** (~104 cores geradas por regra de ramp — protege o dark medieval). 5 sets grátis (1 por classe + cidadão); sets extras via quest/conteúdo pago ✏️ entram no mesmo guarda-roupa. Estado na sim (todos veem), posse validada na sim; espada/escudo são equipamento, não outfit. Janela na tecla `O`; `0` cicla sets |

## Visual & UI (decidido)

Mundo pixel art 32px + **UI moderna clean por cima** (referências: Apogea/Ragnarok Online). Layout overlay: mundo fullscreen, status embaixo-esquerda, hotbar centro-inferior, painéis por hotkey. Feedback de combate completo (números coloridos por tipo, flash, barra de HP em mobs). Tokens, layout e specs em **`DESIGN-VISUAL.md`**.

## Arquitetura (regra de ouro)

```
src/sim/     → simulação PURA (regras, mundo, combate). Zero imports de browser/Pixi.
src/shared/  → protocolo de comandos/snapshots + tipos. Nasce como se fosse rede.
src/client/  → renderização (PixiJS), input, UI. Zero regras de jogo.
src/net/     → transport. Hoje LocalServer (in-process); futuro: WebSocket.
```

**Toda feature nova respeita essa separação.** É ela que torna a migração para online um trabalho incremental em vez de uma reescrita.

## Roadmap

- [x] **M0 — Fundação**: mundo, movimento (WASD + click), câmera, iluminação dinâmica, HUD básico
- [ ] **M1 — Combate**: seleção de alvo, auto-attack, primeira skill, monstro com IA básica, dano/morte/respawn
- [ ] **M2 — Progressão**: XP/level, atributos, loot, inventário, equipamento
- [ ] **M3 — Conteúdo**: classes, magias, mais monstros, mapas maiores (✏️ alimentado pelo criador)
- [ ] **M4 — Polish**: sons, partículas, ciclo dia/noite, save
- [ ] **M5 — Steam**: empacotamento Electron + steamworks.js
- [ ] **M6 — Online**: game server Node + Supabase (auth + persistência)

## Progressão (decidido) — duas camadas

1. **Camada sólida**: level/XP → pontos de stats (Força/Dex/Int/Vit/Espírito), skills compradas em NPCs (classe + nível + gold), equipamento. Progressão completa e satisfatória por si só — sem skill-by-use estilo Tibia. **Ritmo difícil**: upar é lento, mobs são fortes; morte pune pesado em XP mas nunca tira itens.
2. **Camada emergente — Sistema de Marcas** (o tempero/assinatura): itens, skills e personagem ganham recompensas nomeadas, ocultas e raríssimas baseadas no que o jogador **fez** (ex: 15k mortos-vivos com a mesma espada → Marca *Quebra-Ossos*). Nunca é requisito de progressão, e **nunca se perde** depois de adquirida.

Ver **`DESIGN-EVOLUCAO.md`** para o sistema completo, regras e templates.

## Classes (decidido)

Quarteto base: **Knight / Mage / Rogue / Priest** — base fixa + especialização emergente (sem subclasses escolhíveis; elas emergem via Caminhos). **Monge não é classe**: é Caminho emergente do Priest (conduta *Mão Vazia* — nunca equipar arma). Fichas completas em `DESIGN-EVOLUCAO.md`.

## Magias e Skills (kit inicial decidido)

Skills compradas em NPCs (classe + nível + gold). Kit do M1: *Golpe Forte* (Knight), *Bola de Fogo* + *Lança de Gelo* (Mage), *Apunhalar* (Rogue), *Luz Sagrada* + *Curar Ferimentos* (Priest) — cada uma já desenhada com tags, perfis de uso rastreados e 2–3 mutações. Fichas em `DESIGN-EVOLUCAO.md`. ✏️ Tiers intermediário/avançado: M3.

## Inimigos e Bestiário (criaturas padrão decididas)

**12 famílias, ~46 criaturas padrão** em tiers T1–T5: Bestial, Humanoides, Vermes, Plantas, Aquáticos, Voadores, Mortos-Vivos (família-coração), Dracônicos, Gigantes, Elementais, Míticos, Demônios. Modelo Tibia: família é organização (tema, habitat, resist/fraquezas, unidade de Marcas) — ~90% dos mobs agem de forma semelhante; mecânicas especiais são exceções pontuais por criatura. Ver **`DESIGN-BESTIARIO.md`**. ✏️ Mini-bosses/bosses de área e números: docs futuros.

## Mundo, Quests e NPCs (estrutura decidida)

Estilo **Apogea/Tibia**: exploração e descoberta como recompensa central. Quests em **3 camadas** (diretas com marker no mapa / abertas por rumor, sem marker / segredos nunca anunciados), diário escrito sem tracker, diálogo híbrido (opções + keywords secretas digitáveis), NPCs em 4 papéis (treinador/mercador/quest giver/sussurrador), baús one-time por personagem — escondidos, guardados, **lacrados por nível** e secretos. Raridades de item alinhadas aos slots de Marca. Ver **`DESIGN-MUNDO.md`**. ✏️ Conteúdo concreto (quests/NPCs/posições): M3 com o mapa.

## PvP e perda de loot (esqueleto preliminar — ✏️ revisar antes do M6)

O jogo **terá PvP com perda de loot**, em contextos que o jogador escolhe. Arquitetura: **flag individual** (principal) + **zonas high-level de PvP aberto** (complemento). Evento periódico estilo Blood Moon: descartado (plágio direto do Apogea).

| Contexto da morte | Perda |
|---|---|
| PvE normal (sem flag, fora de zona PvP) | **só XP — nenhum item** (pilar intocado) |
| Morte em PvP (flagado ou em zona) | **mochila dropa sempre** + **% de chance por item equipado** ✏️ |
| Morte **PvE dentro de zona PvP** | mesma perda de PvP |
| Morte **PvE enquanto flagado** | mesma perda de PvP — anti-exploit: impede suicidar em mob para escapar de gank |

- **Itens com Marca: inclusos na mesma % dos equipados, aleatório — sem proteção especial.** Levar a relíquia pro risco é a escolha; o ledger viaja com o item (a espada tomada em sangue carrega a história).
- ✏️ a definir na revisão: % de drop por equipado, incentivo da flag (XP? drop?), skull/karma anti-gank de novato, quais zonas são PvP (design de mapa M3+), dimensionamento dos sinks de economia em função do churn (conversa de `DESIGN-ITENS.md`).

## História e Mundo (fundação decidida)

Humanos vêm de um planeta mundano **teleportado** (explosão de uma estrela) para um mundo maior cheio de magia, monstros e demônios; **mutações** deram aos humanos habilidades sobre-humanas. Três crises históricas: o **Primeiro Mago** (eugenista, selado na Árvore Sagrada; seus Seguidores vivem em enclaves remotos), a **Guerra do Submundo** (demônios selados nas profundezas; rituais de invocação espalhados pela terra) e a **Guerra dos Mortos** (Necromante derrotado, mas seus tenentes — liches, death knights — ainda erguem mortos-vivos). Mortos-vivos têm 3 origens: necromancia, apego (*lingering attachment*) e contaminação. 5 continentes; o jogo começa no **continente central**, humano e de natureza abundante. **Crise atual (primeiro arco): a Contaminação se espalha** — investigá-la leva ao autor dos experimentos, o primeiro grande boss da questline. A lore cresce junto com o jogo, e toda mecânica de mundo é pensada para **MMORPG** (mundo compartilhado, progresso por jogador). Ver **`DESIGN-LORE.md`**.
