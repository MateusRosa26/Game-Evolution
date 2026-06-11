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

## ADENDO — UI/NPC do rito (treinadores + quest gate) — 2026-06-11

Fechado o gate quest+gold E os 4 treinadores (escopo cheio, escolha do criador).

- **4 quests de rito** (`rito_knight/mage/rogue/priest`) em `quests.ts` — kill-based
  (feitas ENQUANTO classless, só auto-attack), flavored pela classe: Ricardo/6 ratos,
  Leonor/5 morcegos, Vincente/6 ratos, Gabriel/5 esqueletos (undead, tema do priest).
  `RITO_QUEST_BY_CLASS` agora aponta pra elas → `chooseClass` exige a quest concluída.
- **`performRito` effect** no `dialogue.ts` + handler no `Simulation` (dialogueChoice).
  Diálogo agora é CIENTE DE CLASSE (`root/choose` recebem `cls`): classless vê o
  caminho, quem já é classe ouve banter.
- **4 treinadores** via factory `makeTrainer(cls, questId, voz)` — fluxo idêntico
  (pitch → aceita trial → andamento → reporta [conclui quest] → cerimônia → confirma
  [performRito]). Falas-rascunho ✏️ Loremaster. Sem UI nova: flui pela `DialogueWindow`.
- **Placement** provisório na rua ao sul da casa-tutorial (andável, ✏️ world-designer
  realoca pros distritos). **CharacterPanel** mostra a classe ("Sem Classe" p/ classless).

**Bateria (fluxo e2e, mapa real):** classless fala c/ Ricardo → aceita Prova de Aço →
6 ratos → reporta (quest completed) → paga 150 → vira Cavaleiro (Espada Curta equipada,
Golpe Forte concedido); banter pós-rito não reoferece; `chooseClass` sem a quest =
BLOQUEADO. ✓ Tudo verde.
