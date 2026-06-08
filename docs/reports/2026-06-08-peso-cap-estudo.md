# Estudo de referência — peso de itens & capacidade de carga (cap)

> Designer de sistemas, jun/2026. Base para os pesos dos itens e a fórmula de
> cap. Decisão de escala: **escala-Tibia** (criador). Números finos = Balancista.
> Pilar servido: **"decisão de mochila, não checkbox"** (decisões significativas).

## Como funciona a referência

### Tibia (peso em *oz*; cap por **vocação + nível**)
- **Cap**: ~**400** base no nível 1; ganho por nível: **Knight +25/nível** (o maior),
  Paladino +20, Mage/Druid/sem-vocação +10. Knight é o "carregador".
- **Pesos confirmados** (TibiaWiki, via busca):
  moeda de ouro **0.10** · adaga **9.5** · espada **35** · maça **38** ·
  machado de batalha **50** · espada 2-mãos **70** · escudo de aço **69** ·
  armadura de couro **60** · **armadura de placa 120**.
  (De memória, a confirmar: elmo 7–43 · calça 22–58 · botas 9 · mochila vazia 18 ·
  hand axe ~25 · club ~19 · anel/colar 1–3.)
- **Ouro 0.10/moeda bate exatamente com o nosso `0.1`** ✅ (nosso teto de 150 moedas
  é twist nosso — Tibia não tem teto).

### Apogea (Tibia-like)
- Inventário limitado por **slots + peso total**; **cap melhora por alocação de
  stat**; **bolsas dentro de bolsas** (aninhamento); **banco na cidade** pra
  descarregar e liberar peso. (Apogea Wiki.) É literalmente a "decisão de
  mochila" que ancoramos.

## Achado 1: cap × peso se calibram JUNTOS
Com pesos escala-Tibia, **armadura é o que pesa** (placa 120, escudo 69). Um
Knight todo equipado ≈ **350 de peso**. Logo o cap precisa ser proporcional
(comportar set + haul de loot) ou nada anda — peso e cap são uma decisão só.

## Achado 2: cap NÃO pode ser só Força (é stat de escolha) → HÍBRIDO
No Tibia o cap **cresce sozinho por nível/vocação** (Knight +25, Mage +10), grátis.
Amarrar o nosso cap só à Força tem dois furos: (1) Força é stat de **escolha** —
um Mage que não a investe teria o MESMO cap no lvl 1 e no lvl 25 (sem
crescimento-por-nível); (2) vira **imposto** — carregar loot forçaria gastar
pontos em Força em vez de Int/dano. **Solução (jun/2026): híbrido, igual ao
HP/mana** (que já são `atributo + CLASS_GROWTH/nível`):
```
cap = BASE + Força×k_pequeno + capPerLevel[classe]×(nível−1)
```
- **capPerLevel** = motor automático por classe (Tibia): **Knight 25 · Rogue 18 ·
  Priest 12 · Mage 10**. Cresce sozinho com o nível, diferencia por classe.
- **Força×k pequeno** = bônus (perk, não imposto) — mantém o "forte carrega mais".

## Tabela de pesos — base escala-Tibia
**Implementado (armas T1):**
| Item | weight |
|---|---|
| Adaga | 10 |
| Clava | 20 |
| Machado de Mão | 25 |
| Cajado Simples | 28 |
| Cetro | 30 |
| Espada Curta / Espada Cega | 35 |
| Punhos | 0 |

**Proposto (quando entrarem — Balancista crava):**
| Categoria | weight |
|---|---|
| Armas 2-mãos | 60–90 |
| Armadura: couro 60 · malha 110 · **placa 120** | — |
| Elmo | couro 7 · aço 43 |
| Calça | couro 22 · placa 58 |
| Botas | 9 |
| Escudo | madeira 28 · aço 69 |
| Joia (anel/colar) | 1–3 |
| Mochila (o item) | 18 |
| Poção | ~3 · Tocha ~10 |
| Ouro | 0.1/moeda, teto 150 (máx 15 de peso) — **decidido** |

## Implementação (jun/2026)
- `formulas.maxCarry(attrs,cls,level) = BASE + Força×k + CLASS_GROWTH[cls].capPerLevel×(nível−1)`
  (placeholders: BASE 200 · k 5 · capPerLevel Knight 25/Rogue 18/Priest 12/Mage 10
  → Knight lvl1 = 240, +25/nível). `capPerLevel` mora no `CLASS_GROWTH` junto de
  `hpPerLevel`/`manaPerLevel` (mesmo padrão).
- `ItemTemplate.weight` por item; `items.goldWeight` com teto de 150.
- `Simulation.carriedWeight` = equip + bolso (itens + ouro); enforcement modelo
  Tibia (só bloqueia **trazer peso novo de fora**; mover entre as próprias coisas
  é livre; shift-loot de ouro pega só o que cabe). `progress.cap` no snapshot;
  exibido no painel C.

## ✏️ Aberto (Balancista / futuro)
- Fina-calibrar pesos + as constantes do cap (BASE, k de Força, capPerLevel por
  classe) com combate/loot real (que a "decisão de mochila" seja escolha, não
  tédio — cap generoso, não micromanagement).
- **Aninhamento de mochila** (bolsa dentro de bolsa) — `carriedWeight` já está
  pronto pra somar aninhados quando o nesting existir.

**Fontes:** [TibiaWiki — Capacity](https://tibia.fandom.com/wiki/Capacity) · [TibiaWiki — Plate Armor / Sword / Dagger / Battle Axe / Steel Shield](https://tibia.fandom.com/wiki/Armors) · [Apogea Wiki — Items](https://apogea.fandom.com/wiki/Items) · [Apogea — 7 beginner tips (Sportskeeda)](https://www.sportskeeda.com/mmo/apogea-7-beginner-tips-know-start)
