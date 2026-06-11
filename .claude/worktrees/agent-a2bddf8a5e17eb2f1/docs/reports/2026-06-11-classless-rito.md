# Classless + Rito de classe — implementação e bateria

**Data:** 2026-06-11
**O quê:** todo personagem nasce CLASSLESS (5ª PlayerClass); o **rito** (gate
quest+gold, decisão criador: pontos CARREGAM, UMA VIA) troca pra uma classe
importando os stats por nível. Fatia de sim/shared (client passou tsc sem mudança).

## Modelo

- `CLASS_BASE_ATTRIBUTES.classless` = plano `{5,5,5,5,5}` (soma 25 < 28-33 das
  classes → ~10% abaixo, sem especialização).
- `CLASS_GROWTH.classless` = média das 4 `{hp10, mana7, cap16, hpReg0.07, manaReg0.05}`
  (sem o pico de nenhuma = a fraqueza do pau-pra-toda-obra).
- Kit: nasce sem skill (`STARTER_KITS.classless = []`), arma de NASCIMENTO
  `ESPADA_CEGA` (item do tutorial, não kit de classe), outfit "cidadão". O rito
  concede o kit de skills E ENTREGA a arma da classe (troca a Cega; preserva no
  bolso se o jogador já tiver trocado por outra arma).
- **Transição** (`applyRitoTransition`): `attrs[k] = classe_base[k] + (atual[k] − 5)`
  → troca o inato, preserva os pontos alocados. maxHp/maxMana/cap são funções puras
  de (attrs,cls,level), então trocar `cls` recalcula os pools pela classe no nível
  atual (o −10% some retroativo). `RITO_COST_GOLD = 150` (✏️), `RITO_QUEST_BY_CLASS`
  plumbing pronto (null = só gold gateia até a trilha de rito ser desenhada).

## Bateria

**A) Classless é "average" (L6, base, auto-attack DPS / HP):**
| classe | DPS | HP |
|---|---|---|
| knight | 7,4 | 189 |
| rogue | 7,3 | 133 |
| **classless** | **5,6** | **140** |
| mage | 4,6 | 115 |
| priest | 4,6 | 150 |

Classless entre casters e martials em DPS, mid em HP. ~6% abaixo da média das
classes (alvo ~10%). ✏️ se quiser −10% firme, baixar levemente o growth classless.

**C) Gates OK:** uma-via (re-rito bloqueado), gate de gold (rito sem ouro
bloqueado), cobrança 200→50, kit concedido. ✓

**B) [RESOLVIDO] Furo de timing (banca de stat barato):** o custo de stat é RO-banda
por VALOR ABSOLUTO; o classless começa em 5 (banda barata) e a classe em 11+ (banda
cara). Resultado: ficar classless mais tempo acumula increments mais baratos, e o
rito os transfere → personagem final MAIS FORTE quanto mais tarde o rito. Medido:
classless L6 (20 pts banked) → knight HP **229** vs knight nativo L6 HP **205**
(~12% a mais). **Contradiz a timing-independence pedida.** Opções no fim do report.

## Resolução — RE-CUSTO NA TRANSIÇÃO (opção do criador)

`applyRitoTransition` re-custa os pontos GASTOS pela estrutura de custo da CLASSE:
para cada atributo, soma o custo RO acumulado que o classless gastou (da base 5 até
o valor atual), reseta pra base da classe e RE-GASTA esse mesmo total a partir da
base da classe (onde a base já é alta, rende menos increments). O troco que não fecha
um increment volta como ponto livre. NÃO muda o modelo de custo calibrado (M1.2) e
mantém a alocação livre do classless.

**Verificado (bateria):**
- classless L6 (+vit) → knight == knight NATIVO L6 (+vit): vit 15 / free 2 / HP 245 idênticos.
- ritar@L2 e upar até L6 == ritar@L6: idênticos. **Timing 100% independente.** ✓
