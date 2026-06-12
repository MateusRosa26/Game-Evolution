# Pipeline de Personagem — REMASTER 128px (autoritativo)

> Escrito jun/2026 depois de uma sessão LONGA e frustrante queimando gerações no escuro. Este doc é a fonte da verdade pra gerar o CORPO BASE de um char no remaster. Se for gerar char, LEIA isto inteiro antes de tocar na API. A maioria das regras foi paga caro.

> ⚠️ **STATUS (jun/2026): a receita CAL abaixo — figura cropada→92px + margem de pé, `highly detailed`, strength baixo — NUNCA rodou ponta-a-ponta.** O melhor resultado real já obtido foi `OPEN128-4` (init greyscale quadro-cheio, strength 42, `highly detailed`): rosto aberto + mãos vazias + greyscale provados, **só faltou o pé** (init enchia o quadro). A receita CAL é a *hipótese* de conserto do pé. Um run noturno (`tools/gen-char-overnight.mjs` → `design/pixellab-candidatos/chars/knight-overnight/`) está testando a moldura CAL × varredura de strength no range real (1–999). **Validar pelo `_SHEET.png` antes de tratar a receita como verdade.**

## 0. O alvo, em uma frase

Um homem-de-armas **estilo Tibia/Apogea** (a referência validada é o `src/client/assets/img/chars/knight/walk/s0.png` do próprio repo, e a placa `design/pixellab-candidatos/chars/knight-placa/s0.png`): proporção **naturalista esguia**, elmo aberto com **rosto à mostra**, aço **greyscale** (pra tingir em runtime), **mãos vazias** (arma/escudo são overlay).

## 1. Canvas & proporção — O ERRO QUE MAIS CUSTOU

- **Canvas do char no remaster = 128×128.** NÃO 64×64. O 64 era a norma do mundo 32px ANTIGO; o remaster é 128px/tile, então o char nasce a 128. Confundir os dois foi a raiz de metade do retrabalho.
- **Resolução nativa máxima real = 128.** O `create-image-pixflux`/`bitforge` vai até 200, MAS `create-character-v3`/`rotate` (rotações+walk) só aceitam 16/32/64/128. Um char que ANDA tem teto de **128 nativo**. Gerar a 64 e exibir a 160 = **papa** (metade da resolução).
- **Exibição in-game = 160px** (1,25× de 128 — decisão do criador), ancorado no pé. Então 128 nativo → 160 tela = 1,25× (leve, aceitável).
- **Proporção = NATURALISTA, ~3,5 cabeças (cabeça ≈ 1/3,5 da altura da figura). NUNCA chibi/cabeçudo.** Tibia/Apogea são esguios, não bonecos cabeçudos. Referência de medida: o knight canônico tem figura **40×48 em canvas 64** (≈ esguio). A palavra "chibi" em prompt = cabeçudo garantido — PROIBIDA (ver §4).
- **Enquadramento (a regra que conserta pé E chibi):** a FIGURA ocupa **~92–100px de altura DENTRO do canvas 128**, centrada, com margem de **cabeça (~16–18px topo)** E **de pé (~16–18px embaixo)**. Encher o quadro 128 → **corta o pé**. Achatar a figura pra caber → **chibi**. A saída é **dimensionar a figura ~92px e deixar margem**, não preencher o canvas.

## 2. Pipeline (single-image, validado)

1. **Sonda obrigatória:** `GET /balance` antes e depois (ver SKILL.md §ORÇAMENTO).
2. **SÓ `/create-image-pixflux`** (1 imagem ≈ 1 geração). **NUNCA `/generate-with-style-v2`** (grid de 16 = ~20 gerações + char lavado = PROIBIDO pelo criador). `bitforge` deu RUÍDO duas vezes — evitar.
3. **Coerência de estilo via `init_image`** (NÃO existe style transfer barato e confiável fora disso):
   - Pega um char VALIDADO (placa s0 ou knight canônico).
   - **CROPA na figura** (bbox alfa) — tira a margem morta.
   - **GREYSCALE** a figura (mata o vazamento de cor — pele/couro/madeira da ref viram magenta/vermelho no output se não fizer isso).
   - **Escala a figura pra ~92px de altura** mantendo aspecto.
   - **Cola centrada num canvas 128×128** com topo em ~y=18 → pés em ~y=110 (margem dos dois lados).
   - Esse PNG é o `init_image`. **`init_image_strength` é escala INTEIRA 1–999 (default 300)** — confirmado no `openapi.json`, NÃO 0–100. O "40–45" antigo era ~4% (init quase desligado) e foi herdado de guideline errada.
   - ✅ **VALIDADO pelo run noturno (jun/2026, `knight-overnight/_SHEET.png`):** em strength **42 o init não pega** (sai colorido/elmo fechado/fora do alvo); o init **TRAVA a partir de ~100**, e em **~150–300** o corpo+pé+rosto-aberto+greyscale ficam certos com a moldura CAL (a moldura conserta o pé — confirmado). Em 300–500 a saída **≈ o init**.
   - 🔑 **A lição-mãe:** como em strength alto a saída reproduz o init, **o char NÃO depende de "achar o prompt mágico" — depende de ter UMA referência LIMPA.** O bloqueio que sobra é o GEAR no init (a placa tem espada+escudo → em strength ≥100 eles voltam). **Solução: limpar a referência (inpaint a arma/escudo = 0 gens) → init de mãos vazias → strength ~150–300 reproduz o corpo-base dyeável.** Re-pinar o strength final aqui quando a referência limpa rodar.
4. **Params padrão (calibrados):** `image_size: 128×128` · `view: "low top-down"` · `direction: "south"` · `outline: "single color black outline"` · `shading: "medium shading"` · `detail: "highly detailed"` · `no_background: true` · `text_guidance_scale: 10–11`.
   - ⚠️ `shading: "detailed shading"`/`"highly detailed shading"` a 128 → **fotorrealista** (reprovado). Usar **"medium shading"**.
5. **Base greyscale + mãos vazias** sempre (dye gradient-map em runtime; arma/escudo = overlay por slot).
6. **N opções = N chamadas single-image** (seeds diferentes). 4–6 por leva.

## 3. Prompt (modelo que funciona)

**description:** `full body medieval foot-soldier knight, REALISTIC SLENDER human proportions, small head about one third of body height, standing idle facing south, both armored boots fully visible at the bottom, bearded face visible under an open nasal helmet, steel plate armor over chainmail, both arms relaxed down at the sides, empty hands, greyscale monochrome iron and steel, clean pixel art, black outline`

**negative_description:** `chibi, big head, large head, super deformed, stubby, cropped, feet cut off, closed helmet, full-face helm, visor down, faceplate, sword, weapon, shield, cape, cloak, red, brown, gold, color, saturated, photorealistic, smooth gradient, blurry`

## 4. Modos de falha (PAGOS CARO — não repetir)

| Sintoma | Causa | Correção |
|---|---|---|
| Char vira **papa** a 160 | gerado a 64px (metade da res) | gerar a **128** nativo |
| **Pé cortado** | figura enche o canvas quadrado | figura ~92px + margem de pé |
| **Chibi cabeçudo** | achatar a figura pra caber / prompt "chibi" | dimensionar esguia ~3,5 cabeças; banir "chibi", usar "slender, small head, NOT chibi" |
| **Vazamento de cor** (magenta/vermelho) | init colorido (pele/couro da ref) | **greyscale o init** |
| **Fotorrealista** | "detailed/highly detailed shading" a 128 | `shading: "medium shading"` |
| **Elmo fecha** sozinho | pixflux puxa great-helm pra "knight" | init da placa (elmo aberto) + negative "closed helmet, visor down, faceplate" + "face visible" no início do prompt |
| Grid de 16, char lavado, 20 gerações | `/generate-with-style-v2` | **PROIBIDO** — só single-image |
| Ruído puro | `bitforge` com style_image transparente | evitar bitforge |

## 5. Onde salvar (o criador precisa VER)

As worktrees em `~/rpg-worktrees/<x>/` são do FS do **WSL** e **não aparecem no Windows Explorer/OneDrive**. Salvar candidatos **E** um contact sheet ampliado **@160 (tamanho real de tela)** em:
```
/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/<nome>/
```
No sheet, **incluir o knight canônico ao lado** (escalado pro mesmo 160) pra comparar PROPORÇÃO direto. 64px é minúsculo no Explorer → sempre ampliar.

## 6. Fluxo completo

`/balance` → montar init (crop+greyscale+escala 92px+canvas 128) → gerar 4–6 single-image (seeds) → **auto-curadoria** (proporção esguia? pé no quadro? rosto à mostra? greyscale? mãos vazias?) → sheet @160 com o canônico ao lado → **criador aprova 1** → `create-character-v3` (ref sul, downscale p/ 128) → walk `walking-4-frames` (S/E/N, W=flip) → integra como corpo base dyeável.

> Resto da metodologia de char (rotações, palette-snap, paper-doll, congelar corpo) na `SKILL.md` §METODOLOGIA DE PERSONAGEM.
