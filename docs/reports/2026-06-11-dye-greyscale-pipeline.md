# Dye de personagem — método validado + pipeline de geração (greyscale, sem arma)

**Data:** 2026-06-11 · **Origem:** sessão do remaster 128px (o char precisa ser regerado; decidir como, pra o dye funcionar). Validado por testes Python livres (0 crédito PixelLab) sobre o knight atual — ver `dye-final.png` / `dye-tibia.png` na raiz.

## O problema (por que o dye "ficava horrível")

As tentativas anteriores de dye no char PixelLab eram ruins por **dois** motivos compostos:
1. **Tingiam o personagem INTEIRO de uma cor** → colapsava os materiais (armadura + escudo + tabardo viravam todos azul). Vira boneco monocromático.
2. **A LUT (`shadeLutFromColor`) SUBSTITUÍA a cor** por um ramp saturado em cima de toda a luminância → **perdia o contorno preto** (pixel escuro do outline virava cor escura, não preto) e ficava **extremo, sem nuance**.

## O método que funciona (estilo Tibia/Apogea — validado)

Tibia: **4 regiões por template** (cabelo/corpo/pernas/pés), **133 cores** (7 brilhos × 19 matizes); a cor **modula a luz que já existe** numa base neutra — preto×cor = preto (outline preservado). Nosso método validado replica isso:

1. **Por PEÇA**, não por personagem. Cada peça de armadura/pano é uma camada isolada, tingida independente → armadura azul + tabardo vermelho, cada um com sua cor.
2. **Preservar o contorno**: pixels de luminância baixa (< ~40/255, o outline `#10141c` e sombra funda) **não são tingidos** — ficam como estão. (Preto fica preto.)
3. **Preservar a LUMINÂNCIA original** (o sombreado intacto) e **só trocar o MATIZ**. Saída = `hsl(matizAlvo, satModerada·bell(L), L_original)`. Nada de impor um novo ramp de luz.
4. **Saturação moderada com pico no meio** (`bell(L)`, teto ~0.6) — evita o "extremo/chapado".

Resultado: lê como **o mesmo personagem recolorido**, contorno e brilho metálico intactos. (Comparativo antigo×novo em `dye-tibia.png`; final em `dye-final.png`.)

⚠️ **Implicação de código:** o `shadeLutFromColor` (LUT contínua) em `outfit/sentinels.ts` É o método antigo (substitui a luz, extremo). Trocar/criar a função de tint pelo método acima (preserva-luz + troca-matiz + preserva-outline) quando montar o pipeline. O `stampTinted`/`composeSet` em `paperdoll.ts` (composição por peça) já é a arquitetura certa.

## Pipeline de GERAÇÃO do char (regra da regen)

> **Corpo-base (pele/rosto/olhos em cor REAL, mãos vazias em pose de grip) + peças de armadura/pano em GREYSCALE (tingidas em runtime) + arma/escudo como overlay de EQUIPAMENTO por slot.**

- **Peças tingíveis → greyscale neutro** (luz/sombra, faixa tonal cheia = melhor base pro tint). Obter por prompt greyscale OU, plano B garantido, **gerar colorido e dessaturar a peça pós-geração** (o tint usa só a luminância).
- **Dye em RUNTIME, não bakeado.** O "look padrão" por classe = só um conjunto de **cores-default** aplicado por cima do greyscale (não existe "sem dye"). Cacheado por combinação. NÃO bakear cópias coloridas.
- **Pele, rosto, olhos âmbar = cor real, NUNCA tingidos** (camada fixa do corpo).
- **Gerar SEM arma e SEM escudo**, mãos em **pose de empunhadura neutra**. Arma/escudo entram como **overlay separado** (slot), ancorado na mão, por direção — corpo agnóstico de arma; qualquer item equipa limpo e o dye da armadura não toca a arma. Casa com "arma = overlay por arquétipo" já previsto no DESIGN-VISUAL.

## Decisão de char (fecha o fork procedural × PixelLab)

Char **procedural** a 128 foi testado (v1/v2 em `remaster-procknight-v2.jpg`): viável e com vantagens (overflow 1.5-tile, dye limpo nativo), mas **qualidade muito abaixo do PixelLab** mesmo com craft. O dilema "qualidade (PixelLab) × dye (procedural)" se **dissolve** com este método: **PixelLab dá os dois** (qualidade + dye por peça via greyscale). → **Char = PixelLab.** Procedural fica como fallback (`PROC_CHAR_TEST=false`, código de registro).

## Pendências

- [ ] Trocar a função de tint pelo método validado (preserva-luz + matiz + outline) e testar **1 peça REAL isolada** (inpaint greyscale) ponta-a-ponta antes do roster todo.
- [ ] Definir as zonas de inpaint por peça no corpo 128 (cabeça/torso/pernas) + cores-default por classe.
- [ ] Regen do roster (knight, mage + classes) em 128 nativo, greyscale nas peças, sem arma — sonda de custo antes do lote.
