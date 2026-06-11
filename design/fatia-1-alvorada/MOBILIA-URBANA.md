# Mobília Urbana — kit de "vila viva" (Alvorada / reusável)

> Spec de direção de arte (diretor-de-arte, jun/2026). Resolve o diagnóstico do criador: a cidade
> parece **robótica** porque os vendedores são **casas-caixa fechadas** e o motor não tem **nenhum
> prop** (`MapDecor` só conhece `kind:"torch"`). Aterriza o item **P1 "Mundo habitado"** do
> `DESIGN-VISUAL.md` (linha 74: *caixa, barril, saco, poço, cerca/estacas, placa, boneco de treino,
> carrinho, braseiro*) e a **Feira (tendas)** prevista no `GRID.md §3.4` e nunca implementada.
>
> **Track:** o SPEC e o placement no mapa (`maps/alvorada.ts`) são da trilha Mundo. A IMPLEMENTAÇÃO
> (sprites em `sprites.ts`, `kind`s em `shared/types.ts`, casos no `WorldRenderer`) é da trilha
> **arte/client** — este doc é o handoff.

## 1. O diagnóstico em uma frase

Uma praça medieval **só com caixas de pedra e telhados, sem um único prop, lê como maquete** — por
melhor que seja o arranjo (que está fiel ao GRID/v4). "Cara de vila" não vem de mover casas: vem de
**três camadas de mobília** que dizem "gente trabalha e vive aqui".

## 2. As 3 camadas (é assim que se mata o robótico)

1. **Estruturas de comércio ABERTAS** — o que transforma "loja-caixa" em "lojinha/banca": tenda de
   feira, balcão de frente aberta, mesa de mercado. (resolve a queixa direta)
2. **Props de uso** — a bagunça que prova ocupação: barril, caixa/engradado, saco, cesto, lenha
   empilhada, feno, poço, varal. (enche o vazio uniforme = mata o "espaçamento robótico")
3. **Delimitadores** — quebram o grid e conectam organicamente: cerca/parapeito de madeira, sebe,
   floreira, estacas de obra. (definem pátios/becos irregulares entre as caixas alinhadas)

## 3. O kit — peça a peça

> Régua aplicada a cada uma: **silhueta** legível em preto · **3 valores** mín. · contraste com chão
> claro E escuro · **cluster** (forma chapada, sem ruído) · luz GLOBAL quente-de-cima / sombra fria ·
> paleta derivada de `palette.ts` (madeira `woodPost/woodPostLight`, pano novo, ferro do outline
> `#10141c`). Coerência com o trio canônico (knight/rato/árvore).

### S-tier — mais "vila" por peça (fazer primeiro)

| Peça | Silhueta / leitura | Tamanho · colisão | Como nasce |
|---|---|---|---|
| **Tenda/banca de feira** | toldo de pano (listras dessaturadas + 1 acento quente) sobre 2 postes de madeira + balcão; mercadoria à mostra (sacos/cestos) embaixo. Silhueta = **trapézio de toldo** inconfundível de longe. | 32–48px largura, ~40 alto; balcão **bloqueia**, vão por baixo do toldo é decor | **procedural** (silhueta geométrica + listras controladas) |
| **Barril** | cilindro com 2–3 aros de ferro escuro; topo elíptico pega luz; barriga em ramp de madeira. Silhueta arredondada que contrasta com tudo retangular. | 16–20px, **bloqueia** | **procedural** (cheap; valida o ramp de madeira) |
| **Caixa / engradado** | cubo de ripas com X frontal ou tábuas horizontais; canto superior-NO iluminado, base em sombra fria de contato. Empilhável (2–3 = pilha). | 18–24px, **bloqueia** | **procedural** |
| **Cerca / parapeito de madeira** | postes + 2 travessas; vence em **tira** (autotile horiz/vert/canto). Define quintal/beco sem ser muro. | tile 32, **bloqueia** (vão = portão) | **procedural autotile** (mesmo padrão que venceu no muro) |

### A-tier — alto valor, logo depois

| Peça | Silhueta / leitura | Tamanho · colisão | Como nasce |
|---|---|---|---|
| **Poço** (da Praça do Poço!) | anel de pedra (reusa ramp `stone*`) + cobertura de telhado em 2 águas sobre 2 postes + balde/corda. **A praça tem o nome dele e ele não existe.** Marco central da feira. | ~40×48, **bloqueia** | **procedural** (reusa ramp de pedra + telhado já feitos); PixelLab só se ficar plano no jogo |
| **Balcão / toldo de loja (frente aberta)** | aba de toldo + balcão na parede sul da Loja/Boticário/Ferreiro → a casa **lê como loja** sem deixar de ser casa. Acoplável à fachada de enxaimel existente. | tira de 32–64 na frente, balcão **bloqueia** | **procedural** (combina com enxaimel) |
| **Saco / cesto** | saco de pano amarrado (vértice no topo) ou cesto de vime; pequenos, em grupo, sobre mesas/chão. Mercadoria da feira. | 12–16px, **decor** (não bloqueia) | **procedural** |
| **Lenha empilhada / feno** | toras em pilha triangular ou fardo de feno (palha quente). Encosta em paredes, mata canto vazio. | 20–28px, **bloqueia** | **procedural** |

### B-tier — tempero (quando sobrar)

| Peça | Nota | Como nasce |
|---|---|---|
| **Carroça / carrinho** | carroça de feira (rodas + caçamba) parada num canto; o `carrinho de mina` (✏️ já no `alvorada.ts`) é primo pras Minas. Peça-herói candidata a PixelLab (detalhe orgânico). | **procedural-first**; é a 1ª candidata a PixelLab `/map-objects` SE o procedural ficar plano |
| **Placa de loja** | tabuleta pendurada num braço de ferro; ícone por ofício (martelo=ferreiro, almofariz=boticário). **Dá identidade** que o telhado igual não dá. | procedural |
| **Varal de roupa** | corda entre 2 casas próximas com panos; só em **beco estreito** → diz "moradia". | procedural |
| **Braseiro** | tigela de ferro com brasa (luz quente móvel, reusa o sistema de luz das tochas). Pontos de calor fora das tochas de parede. | procedural |
| **Boneco de treino** | poste + alvo de palha; pátio da Guilda (R1). | procedural |
| **Estacas de obra** | postes fincados + ripas soltas no trecho **O/S da muralha "em obras"** (gancho físico do v4). | procedural |

## 4. Como o kit MATA o robótico (placement na maps/ — trilha Mundo)

A mobília sozinha não basta; o **uso** é que desengessa. Quando os `kind`s existirem, o placement em
`alvorada.ts` faz:

- **Feira ao redor do poço** (`GRID §3.4`, `[33..40]×[37..42]`): poço no centro da Praça + **4–6
  tendas** em anel irregular + mesas com sacos/cestos + pilhas de caixa. A praça vazia de pedra vira
  **mercado**. (este é o maior salto de "vila")
- **Fachadas viram lojas**: toldo+balcão+placa na parede sul da Loja/Boticário/Ferreiro; barris e
  caixas agrupados na porta. As "casas-caixa" passam a **ler como comércio**.
- **Quebrar o grid**: cercas definindo **quintais/becos irregulares** entre as casas alinhadas;
  clutter (barril, lenha, feno) **enchendo os vãos uniformes**; uma carroça parada num canto; varal
  num beco estreito. Regra de placement: **assimetria** — nunca centralizar, sempre encostar/agrupar.
- **Ruas vivas**: props nas bordas das ruas de terra (a polilinha já tem jitter) — o clutter quebra a
  leitura de "corredor robótico".

**Densidade-alvo:** clutter **agrupado** (3–5 peças encostadas), não espalhado 1-a-1 (espalhar ralo é
tão robótico quanto o vazio). Regra do scatter que já vale pro chão: agrupa em cluster intencional.

## 5. Procedural vs PixelLab — a decisão (corrigida jun/2026, com o criador)

**O kit inteiro nasce PROCEDURAL.** PixelLab NÃO é o default pra props — só um upgrade pontual, por olho.

Por quê (e não é gosto — é o histórico do projeto + a arquitetura):
- **Coerência (régua nº7):** o mundo é procedural (telhado, muralha, enxaimel, pedra, scatter) com UMA
  direção de luz e paleta apertada. PixelLab assa outline/peso/detalhe próprios → risco de "outro jogo".
  Precedente: os **tilesets PixelLab da muralha foram REPROVADOS** (repetição denuncia, ruído);
  procedural ganhou. Props são a MESMA família do telhado/muro: forma construída, geométrica.
- **Iluminação em runtime (o ponto decisivo):** `Lighting.ts` aplica ambiente frio + tochas quentes
  POR CIMA dos sprites. PixelLab devolve o sprite com **sombra/luz JÁ assadas** (direção própria) →
  **briga** com a luz de runtime (dupla iluminação). Procedural, com ramp chapado + sombra de contato
  controlada, **integra** com a luz do jogo.
- **Custo/controle:** procedural = grátis, instantâneo, afinável pela régua.
- **PixelLab ganha em ORGÂNICO** (anatomia/personalidade/animação) — characters e mobs, onde o
  procedural fica genérico (caso knight). Prop rígido NÃO tem essa fraqueza, então não há ganho.

**Única escalada pra PixelLab:** uma peça-herói (carroça > poço) **se** a versão procedural ficar plana
demais **vista no jogo** — decisão no olho, depois, com sonda de orçamento. Nunca chute antecipado.

## 5b. Ordem de produção (à trilha de arte)

1. **Procedural cheap-wins** (1 sessão): barril, caixa, cerca-autotile, saco/cesto, lenha/feno, placa,
   braseiro, estacas. Silhuetas simples + ramp de madeira/pano → já enchem a cidade.
2. **Procedural peças-estrutura**: **tenda de feira** (trapézio de toldo listrado), **poço** (reusa
   ramp de pedra + telhado já prontos), **balcão+toldo de loja** (combina com enxaimel).
3. **`kind`s + render**: cada peça = um `MapDecor.kind` novo + caso no `WorldRenderer` (sprite no
   container y-sorted, base = colisão). Tira/autotile pra cerca e toldo.
4. **Placement na `maps/alvorada.ts`** (trilha Mundo, depois que os `kind`s existirem): a feira, as
   fachadas, o clutter — ver §4.
5. **Só então, no olho:** alguma peça-herói pediu mais textura? Aí sim PixelLab `/map-objects` naquela.

## 6. Pendências ✏️ (criador)

- Aprovar o estilo: proponho **protótipo procedural de tenda + barril** (preview tipo `sewer-preview`)
  antes de qualquer geração PixelLab — valida silhueta/ramp sem gastar crédito.
- Quais ofícios ganham **placa** com ícone (todos os vendedores? só os de quest?).
- Colisão das tendas: balcão bloqueia + vão andável por baixo, ou tenda inteira decor não-bloqueante?
