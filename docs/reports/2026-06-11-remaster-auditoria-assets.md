# Remaster 64px — Auditoria de Assets

Data: 2026-06-11 · Branch: `feat/remaster-64px`

Cruzamento das dimensões REAIS dos PNGs (`file`) com o registry `src/client/assets/pixellab.ts`.
Norma de densidade: 1px do sprite = 1px do mundo, exibição SEMPRE 1:1, escala fracionária PROIBIDA.
Canvas de criatura/char padrão pós-remaster = **64×64**; figura no tamanho natural dentro do canvas.

## Regra de veredito

- **SALVÁVEL 1:1** — canvas ≥64px com figura proporcional → renderiza 1:1 sem regen.
- **PRECISA REGEN** — figura nativa <64px → ficaria pequena/borrada ao remaster.
- **PADDING** — arte boa mas canvas precisa de recorte/expansão de moldura (não recriar a figura).

## Personagens (chars) — corpos de classe (`PIXELLAB.charBodies` / `PIXELLAB.knight`)

| asset | pasta | dimensão (WxH) | ≥64px nativo? | veredito |
|---|---|---|---|---|
| knight (walk, 12 frames: s/e/n × 4) | chars/knight/walk | 64×64 | sim | SALVÁVEL 1:1 |
| mage (walk, 12 frames: s/e/n × 4) | chars/mage/walk | 64×64 | sim | SALVÁVEL 1:1 |

Knight e mage já nasceram 64×64. O shim de 0.66 do knight era transição do tile-32; com o
tile a 64 some (ver mudanças no EntityRenderer). **Ambos salváveis, sem regen.**

## Mobs (`PIXELLAB.mobs` / `PIXELLAB.mobAttacks`)

| espécie | pasta | dimensão (WxH) | ≥64px nativo? | veredito |
|---|---|---|---|---|
| rato (walk 16 + atk 20) | mobs/rato | 64×64 | sim | SALVÁVEL 1:1 |
| goblin (walk 16 + atk 20) | mobs/goblin | 64×64 | sim | SALVÁVEL 1:1 |
| lobo (walk 16 + atk 20) | mobs/lobo | 64×64 | sim | SALVÁVEL 1:1 |
| javali (walk 16 + atk 32) | mobs/javali | 64×64 | sim | SALVÁVEL 1:1 |
| morcego (walk 16 + atk 20) | mobs/morcego | 64×64 | sim | SALVÁVEL 1:1 |

Todos os 5 mobs já são 64×64 (figura cheia, como a memória do projeto previu: "mobs de figura
cheia provavelmente sobrevivem"). **5 espécies salváveis, sem regen.**

## Cenário (`PIXELLAB.trees`)

| asset | pasta | dimensão (WxH) | ≥64px nativo? | veredito |
|---|---|---|---|---|
| tree1 | scenery | 64×96 | sim (1 tile × 1.5 alto) | SALVÁVEL 1:1 |
| tree2 (swamp) | scenery | 64×96 | sim | SALVÁVEL 1:1 |

Árvores 64px de largura (= 1 tile) com 96px de altura (overhang vertical). Casam com o tile de 64
sem escala. **2 props salváveis.**

## Itens (sprites de UI — `PIXELLAB.items`) — FORA do render de entidade

| categoria | qtde | dimensão | veredito |
|---|---|---|---|
| armor / weapon / consumable / tool / shield / container / material | 30 PNGs | 32×32 | N/A p/ render de mundo |

Os 30 ícones de item são **32×32** e vivem na UI (ContainerWindow/EquipPanel), NÃO no render de
entidade. Não estão sob a norma de tile (são ícones de inventário). Continuam 32px sem problema —
o remaster de tile não os toca. Caso a UI suba de densidade no futuro, viram regen, mas **fora do
escopo deste remaster**.

## Sprites procedurais (não-PNG) que ainda assumem 32px — flags p/ sprites.ts

Gerados em `src/client/assets/sprites.ts` (NÃO tocado por este worker — outro worker edita o arquivo):

- **`targetMarker`** — moldura de alvo 32×32 (`makeTargetMarker`, `Px(32,32)`). Renderizada 1:1 sem
  escala; a 64px ela emoldura só ~1/4 da figura. É pixel art, então um upscale **inteiro 32→64**
  (regerar `Px(64,64)`) é pixel-clean. **PRECISA REGEN/RESIZE em sprites.ts** (não force scale
  fracionário no renderer).
- **`shadow`** — elipse macia 96×48 (`makeShadow`); por ser blur, é dimensionada por `.width/.height`
  no EntityRenderer. **Já corrigida** para derivar de TILE_SIZE (ver mudanças). Sem regen.
- `spark`/`shard` (partículas) — sprites macios escalados por código; sem dependência de tile.

## Resumo

| categoria | salváveis 1:1 | precisa regen | total |
|---|---|---|---|
| chars (corpos de classe) | 2 (knight, mage) | 0 | 2 |
| mobs (espécies) | 5 (rato, goblin, lobo, javali, morcego) | 0 | 5 |
| cenário (props) | 2 (tree1, tree2) | 0 | 2 |
| **subtotal arte de mundo** | **9** | **0** | **9** |
| itens (UI 32px, fora de escopo) | — | — | 30 |
| procedural (sprites.ts) | shadow (corrigida) | **targetMarker** (1) | — |

**Conclusão:** toda a arte PixelLab de mundo (chars, mobs, cenário) já é ≥64px nativo e **SALVÁVEL
1:1 — zero regen via PixelLab**. O remaster 32→64 não exige regenerar nenhuma criatura/char/prop.

- **Criaturas distintas a regenerar via PixelLab: 0.**
- Único asset que precisa resize é o `targetMarker` (pixel art procedural, upscale inteiro 32→64
  dentro de `sprites.ts` — sem custo de API).
- Os 30 ícones de item (32px) ficam como estão; só viram regen se/quando a UI subir de densidade
  (decisão futura, fora deste remaster).

**Custo PixelLab estimado deste remaster: ZERO.** A arte já tinha sido gerada em 64px nativo; o que
faltava era a engine consumir 1:1 (tile=64, zoom=1, shim 0.66 removido) — feito em código.
