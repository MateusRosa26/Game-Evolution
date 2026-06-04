# RPG — Documento de Design

> Documento vivo. As seções marcadas com ✏️ serão preenchidas/alimentadas pelo criador do jogo ao longo do desenvolvimento.

## Visão

RPG top-down em grid, inspirado em **Tibia / Ragnarok / Apogea**. Pixel art moderna 32px com iluminação dinâmica. Ambientação entre **fantasia medieval e dark fantasy**.

- **Plataforma:** browser primeiro → Steam (Electron) → online (game server Node + Supabase para conta/persistência).
- **Visual:** "charmoso sem ser bobo" — o charme vem de luz, atmosfera e feedback, não de resolução de sprite.

## Sistema (decidido)

| Sistema | Decisão |
|---|---|
| Mundo | Grid de tiles 32px, movimento tile a tile com animação suave |
| Controles | WASD/setas (8 direções) + click-to-move com pathfinding A* |
| Simulação | Tick-based 20/s, autoritativa, determinística (RNG seedado) |
| Combate | Híbrido: alvo selecionado + auto-attack contínuo + skills de área/direção manuais (estilo runas/waves de Tibia) |
| Câmera | Top-down, zoom 2x, seguimento suave |

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

## ✏️ Inimigos e Bestiário

_(a definir pelo criador)_

## ✏️ História e Mundo

_(a definir pelo criador)_
