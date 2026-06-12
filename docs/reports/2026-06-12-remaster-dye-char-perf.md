# Remaster 128px — dye final, pipeline de char greyscale e o gargalo de performance

**Data:** 2026-06-11/12 · **Branch:** `feat/remaster-128px` · worktree `~/rpg-worktrees/remaster`

Sessão longa cobrindo três frentes do remaster. Resumo do que ficou decidido/feito e o que está pendente.

## 1. Dye de char — método FINAL: gradient-map (multiply estilo Tibia)

Commitado em `88e84be` (`shadeLutFromColor` em `src/client/assets/outfit/sentinels.ts`).

- **Erro do método anterior (HSL rebuild):** reconstruir a cor em HSL (matiz alvo + curva de sat/valor) → ou preservava luminância e o brilho virava branco ("aço com reflexo colorido"), ou comprimia o valor e ficava escuro/agressivo. Os dois extremos foram reprovados pelo criador.
- **Método certo (confirmado na fonte do OTClient):** Tibia colore por **multiply** de um template greyscale. A LUT virou um **gradient map** por luminância: `preto → COR (no valor próprio da cor) → branco(×DYE_SHINE)`. A saturação vem da **própria cor** do dye (paleta moderada), não de boost artificial → cor neutra (aço) = greyscale intacto; preto×cor=preto (outline grátis); nunca vira neon (multiply só escurece).
- **DYE_SHINE = 0.2** (calibrado no olho): 0 = pintado/fosco, 1 = metálico/reflexo. 0.2 lê como "a armadura É daquela cor".
- Aplicado **por peça**: a máscara da peça define onde tinge (couro/escudo/arma são peças/overlays próprios).

## 2. Pipeline de char greyscale — VALIDADO, com lições caras

A ideia (gerar peças/corpo em greyscale neutro → tingir em runtime pelo gradient map) **funciona**. Provado: dyear um knight greyscale em azul/verde/vermelho/dourado lê limpo como armadura colorida.

**Regras de geração (aprendidas apanhando):**
- **Inpaint (`/inpaint`) custa 0 gerações** no plano — iterar à vontade. MAS re-encoda o sprite e **adiciona uma franja cinza de anti-aliasing em volta da silhueta inteira** ("aura/sombra" que vaza). Cirurgia de pixel pra limpar **degrada a arte**. Clipar à silhueta original ajuda, mas o certo é **não remendar**.
- **`generate-with-style-v2` devolve um GRID de ~16 variações** (custa ~20 gerações), mesmo a 128/196px. Para **1 imagem** usar `/create-image-bitforge` (aceita `style_image`, que precisa ter o MESMO tamanho do output) ou `/create-image-pixflux`. NÃO usar o grid quando se quer 1.
- **Matar o poll de um job de grid NÃO cancela o custo** — o servidor processa e cobra mesmo assim. Não submeter grid à toa.
- **Gerar no tamanho de uso e SEM arma/escudo** (mãos vazias = base limpa; arma/escudo são overlays por slot). 128px nativo saiu **mais barato E melhor** que 64px (menos frames/chamada, mais detalhe). Os 64px ficaram ruins.
- **Char canônico do repo (`img/chars/knight/walk/s0.png`) é limpo** (sem franja) mas tem arma/escudo/armadura-antiga embutidos → não serve direto como base dyeável.

**Material pronto:** 16 knights **128px nativos, greyscale, placa cheia, sem arma/escudo, mãos vazias** em `design/pixellab-candidatos/chars/knight-128/` (gitignored staging). O criador gostou do visual "placa gótica detalhada" (ref em `knight-placa/`).

**Pendente:** (a) decidir o tamanho do char — **128px vs 196px** (saldo PixelLab ~600); (b) escolher 1 candidato; (c) `create-character-v3` (8 rotações, teto 128px) → walk (s/e/n) → integrar como corpo base dyeável + cores-default por classe.

## 3. ⚠️ GARGALO DE PERFORMANCE — o "muito travado" pós-128px

**Causa raiz (arquitetural):** `WorldRenderer.buildGround` pré-renderiza **TODOS** os chunks do mapa no load. Mapa Alvorada = **340×340 tiles**; `CHUNK_TILES=16` → ceil(340/16)² = **484 chunks**. Cada chunk é uma `RenderTexture` de `16×TILE_SIZE`:

| | RT por chunk | VRAM total (484) |
|---|---|---|
| 32px (antes) | 512² = 1 MiB | ~484 MiB (cabia no limite) |
| **128px (agora)** | 2048² = 16 MiB | **~7,7 GB** ❌ |

Nenhuma GPU segura 7,7 GB → thrashing de textura → trava tudo + load não abre direito. É 16× a VRAM de chão do 32px, alocada de uma vez. **Não é estado do dev server** (reiniciar não resolve).

**Fix certo — streaming de chunks:** construir só os chunks que a câmera vê (+1-2 de margem, ~9-16 chunks = ~150 MiB) e reciclar/destruir os distantes conforme o player anda. VRAM ~constante, load instantâneo. É o padrão pra mapa grande. (Arquivo: `src/client/render/WorldRenderer.ts`, `buildGround` linha ~154; o tamanho do RT está na linha ~252.)

## Estado do git

`feat/remaster-128px`: `88e84be` (dye gradient-map) · `cb620cd` (load: lookup espacial + warp pré-computado nos campos Voronoi) · `bb94c70` (checkpoint motor 128). Nada pushado ainda. Worktree limpo (bloco de teste de tamanho de char foi revertido do `Game.ts`).
