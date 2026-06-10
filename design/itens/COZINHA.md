# Itens — Cozinha & Buff Food

> Sub-documento de [DESIGN-ITENS.md](../../DESIGN-ITENS.md); detalha a seção comida-cozinha de [CONSUMIVEIS.md](CONSUMIVEIS.md). Aqui vive o **SISTEMA de cozinha** (receitas, ingredientes, vasilhames, verbo de cozinhar, buff de refeição). A filosofia do sustain, poções e ferramentas ficam em CONSUMIVEIS.
>
> **Status:** spec aprovada (criador, jun/2026), BASE Apogea / sistema PRÓPRIO. **Números** (mult/duração/buff/preço/drop) = ✏️ Balancista. **Nomes/flavor** = Loremaster (abaixo).

## 1. Princípio

O loop: **matéria-prima vem do mundo → cozinhar numa estação → comida melhor**. Casa com o **food-gating** já implementado (regen de HP/mana só enquanto saciado; sem comida = regen 0). Cozinhar sobe o tier da comida — mais regen E **buff de stat temporário** — e o prêmio é **proporcional ao esforço/opacidade** (pilar 3). Receita é **conhecimento descobrível** (livro/NPC/experimentação), **nunca skill com nível** (modelo Apogea).

## 2. Tiers de comida

| Tier | Regen | Buff de stat | Sourcing | Visibilidade |
|---|---|---|---|---|
| **Cru/básico** | 1× | — | dropa (sub-sustentável) / vendor | Claro |
| **Cozido** | 2× | leve (1 stat) | receita simples + calor | Claro |
| **Preparado/premium** | 3× | forte (1–2 stats) | receita + **ingrediente comprado** + **vasilhame** | Claro |
| **Lendário/secreto** | **3× (cap)** | **único/melhor + duração maior** | **ingredientes raros de mobs fortes + quest; receita DESCOBERTA** | **Oculto** |

**Invariante preservado:** o regen NUNCA passa de 3× (senão out-heala conteúdo do próprio nível — ver bateria 2026-06-10). O tier lendário se diferencia por **buff único + descoberta**, não por regen maior (Koster: prêmio = interação nova, não número maior).

## 3. Buff de refeição

- Status **"Saciado"** (meal-buff) **separado** do `wellFed` (regen-gate), com **timer próprio** — anti-exploit: comer pão barato não estende o buff de um prato premium.
- **Stats buffáveis** (✏️ Balancista, modestos p/ não quebrar combate): **+dano**, **+velocidade de ataque** (redução de cooldown); por prato, futuros +cap / +vel. movimento / +regen de mana.
- **Um buff de refeição ativo por vez** (comer outro substitui/refresca). **Visível no snapshot** (HUD).
- **Toca combate:** os buffs entram no cálculo de `attackDamage`/`attackCooldownMs` (recomputado ao aplicar/expirar o status).

## 4. Cozinhar (o verbo)

- Comando `cook { recipeId }` no protocolo. A sim valida e executa (consome inputs → produz output).
- **Gates da ação:**
  - **Fonte de calor** perto (fogueira/fogão) — receitas cozidas/premium.
  - **Água-doce** perto (poço/rio doce) quando a receita usa água — **água do mar NÃO serve** (gate espacial + de conhecimento, pilar 4).
  - **Receita destravada** — algumas só após quest do cozinheiro (modelo *Licensed Chef*); as lendárias são **descobertas** (não vendidas/contadas).
- Receita = **conhecimento** (não há "nível de cozinha").

## 5. Itens novos

- **Ingredientes premium** (`ItemCategory: "ingredient"`, comprados do Bento, **NÃO dropam** → o gold-sink):
  - **Sal-gema** / *Rock Salt* — *Cristais cinzentos das minas fundas; conserva a carne que vale menos que ele.*
  - **Pimenta-longa** / *Long Pepper* — *Veio de além-mar antes da Chegada — as rotas que a traziam não existem mais.*
  - **Mel Silvestre** / *Wild Honey* — *Colhido de colmeias que os aldeões aprenderam a não visitar.*
- **Vasilhames** (`ItemCategory: "vessel"`, **1-uso** — viram o prato e somem ao comer): **Pote** (sopas) → sink recorrente. (Panela/espeto ✏️ futuro.)
- **Matéria-prima crua que dropa** (sub-sustentável): **Carne Crua** (bestas), **Queijo** (rato — feito), + **ingredientes raros de mobs fortes** (tier lendário).
- **Água** — recurso de poço/água-doce (não comprável; do mundo). Mar = flag *salgada*, não serve.
- **Pratos** (output das receitas): Sopa · Queijo Quente · Carne Curada · Favo Assado · (lendários ✏️).

## 6. Gating — orgânico, sem número de nível

Três travas naturais (que coincidem com o poder do jogador, preservando o invariante out-heal **sem** checagem de nível):

1. **Dificuldade do ingrediente** — os bons dropam de **mobs fortes** (só farma quando já é forte).
2. **Custo recorrente** — ingredientes comprados + **vasilhame 1-uso** (dreno que escala com o consumo).
3. **Quest-unlock** — o cozinheiro libera a compra/receita.

O **tier lendário** soma a 4ª trava: **opacidade** — a receita é Oculta (descoberta por experimentação/pistas/quest), ingredientes raros (drop-rate de *evento*, matriz esparsa). Prêmio máximo (pilar 3).

## 7. Modelo de dados (sim)

```ts
Recipe {
  id, name,
  inputs: [{ templateId, qty }],   // ingredientes + vasilhame + água
  output: templateId,              // 1 unidade do prato
  unlockQuest?: questId,           // gate de compra/receita (algumas)
  needsHeat?: boolean,             // exige fonte de calor perto
  needsFreshWater?: boolean,       // exige água-doce perto
}
// ConsumeEffect.food estendido:
food { regenMult, durationMs, buffs?: [{ stat, amount, durationMs }] }
```
Categorias novas de item: `ingredient`, `vessel`. Sem `requires.level` (gating é orgânico).

## 8. Mapa (dados-sim)

Marcar no mapa: **fontes de calor** (fogão da estalagem / cozinha do Bento, fogueiras) e **água-doce** (o **poço da Alvorada já existe**; rios doces). Água do mar marcada como **salgada** (não serve pra cozinhar).

## 9. Economia & números — todos ✏️ Balancista

Drops de matéria-prima **sub-sustentáveis** (somados < 100% do consumo); ingredientes comprados + vasilhames = o **sink**; buffs **modestos** (não quebrar combate); preços/durações calibrados vs renda/hora.

## 10. Faseamento

- **MVP:** categorias `ingredient`/`vessel`; 3 ingredientes + carne crua + 3–4 receitas (1 quest-locked); comando `cook`; gates calor+água-doce; **buff de refeição (+dano / +vel. ataque)** + HUD; marcadores de calor/água-doce no mapa.
- **Fase 2:** pesca (vara = ferramenta), mais vasilhames/receitas, fogueira portátil, livros de receita descobríveis.
- **Fase 3 (lendário):** receitas Ocultas, ingredientes raros de mobs fortes, buffs únicos — o aspiracional do sistema.

## Mapa de decisões

| Item | Estado |
|---|---|
| Food-gating (regen só saciado) | ✅ implementado |
| Escala 1–3× regen, cap 3× | ✅ implementado |
| Regen em pulsos (5s) | ✅ implementado |
| Buff de stat em comida preparada | ✅ decidido — MVP desta spec |
| Cozinhar = conhecimento, não skill com nível | ✅ decidido (canon) |
| Gates: calor + água-doce (mar não) + quest | ✅ decidido |
| Vasilhame 1-uso (Pote) como sink | ✅ decidido |
| Gating orgânico (mob forte + custo + quest), sem level | ✅ decidido |
| Tier lendário (oculto, raro, quest) | ✅ decidido — fase 3 |
| Stats buffáveis exatos / números / preços / drop-rates | ✏️ Balancista |
| Quais mobs dropam quais matérias-primas | ✏️ World/Bestiário |
| Receitas lendárias específicas + como se descobrem | ✏️ Loremaster + Designer |
