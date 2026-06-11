# Bateria — Economia da Cozinha (drops + sink + buffs)

**Data:** 2026-06-10
**Contexto:** o sistema de cozinha entrou (COZINHA.md, tasks 1–5). Esta bateria valida se a economia fecha: drops sub-sustentáveis (sink intacto), custo dos pratos premium vs renda, e magnitudes dos buffs. Caça T1 (Knight vs Rato), ~150 rats/h, renda ~60g/h nu.

## 1. Drops de comida — sub-sustentáveis? ✓ SIM

Drops: Queijo 8% + Carne Crua 10% ≈ **27 unidades/h**. Feed contínuo (ficar sempre saciado, comida de 60s) exige **60/h**. Simulação de 1h tentando manter saciado: déficit de ~2460s/h (player fica sem comida e compra/cozinha o resto).

**Veredito:** drops cobrem **~45% do feed contínuo** → respiro real **sem auto-sustentar**. O gold-sink de comida está intacto. (Para o jogo EFICIENTE — deixar o HP descer, comer em lote — os drops cobrem mais; o sink principal migra pro tier premium, ver §2.) Rates atuais **OK, sem mudança**.

## 2. Custo dos pratos premium (o sink de verdade)

| Prato | Tier | Custo (comprado) | Efeito | Receita |
|---|---|---|---|---|
| Carne Assada | cozido | **0g** | 2× / 120s | Carne Crua (drop) |
| Queijo Quente | premium | 10g | 3× / 150s + vel.ataque | Pão + Queijo + Sal-gema |
| Sopa | premium | 13g | 3× / 180s + dano | Pote(5g) + Carne Crua + Sal-gema |
| Favo Assado | premium | 22g | 3× / 150s (mana) | Pão + Mel Silvestre |
| Carne Curada | premium | 33g | 3× / 240s + dano+2 | Carne Crua + Sal-gema + Pimenta-longa |

- **Carne Assada a 0g** = o gancho da cozinha: cozinhar a carne de drop sobe 1×→2× **de graça** (ensina o loop, não é sink).
- **Premium 10–33g/prato** vs renda 60g/h: manter um buff contínuo (~15–24 pratos/h) custaria 150–800g/h → **inviável o tempo todo**. Logo o buff é **situacional** (luta dura/boss), não always-on — design saudável.
- **Pote 1-uso (5g/sopa)** = sink recorrente que escala com o consumo, como projetado.

## 3. Buffs — magnitudes (placeholder, plausíveis)

- +2 dano (Carne Curada) sobre auto de ~6–14 = +15–30%: forte mas não quebra.
- +0.1 vel. ataque (Queijo Quente) = ~10% DPS: modesto.
- +1 dano (Sopa): leve.

Todos **< teto seguro** (não tornam o auto absurdo no T1). ✏️ re-régua na bateria T2 (quando o buff competir com gear/skills de tier maior).

## Veredito geral

A economia da cozinha **fecha** nos números atuais — drops sub-sustentáveis, premium como sink situacional, buffs modestos. **Nenhuma mudança urgente.**

## Pendências ✏️
1. **Regen-rate core (#11):** o "feed contínuo = 60/h" deriva da taxa de regen saciado (placeholder); a régua fina da economia de comida depende dela.
2. **Conteúdo de tier alto:** matéria-prima rara de mobs fortes (tier lendário) + re-régua de buffs na bateria T2.
3. **Placement (alvorada):** validado — fogão da estalagem (118,120) e poço (137,119) andáveis com 8 vizinhos livres. Fogueiras de campo como heat = futuro.
