# Bestiário — Criaturas Padrão

> Documento vivo. Somente criaturas padrão — mini-bosses e bosses de área ficam para documento futuro ✏️. Números (HP/dano/XP) são ✏️ até o M1/M2 darem a régua.
>
> Este arquivo é o **HUB**: princípios, tiers/orçamento, biblioteca de blocos e matriz de fraquezas/Regra 10–20. O catálogo das 12 famílias (criaturas, tabelas) vive em [design/bestiario/FAMILIAS.md](FAMILIAS.md).

## Princípios

1. **Mobs são fortes** (ver Ritmo em `DESIGN-EVOLUCAO.md`): até a criatura de tier 1 pune descuido. Nenhum mob é "de passagem".
2. **Família é organização, não mecânica** (modelo Tibia): define tema, habitat, resist/fraquezas e a unidade dos contadores de Marca. ~90% dos mobs agem de forma semelhante — perseguem e batem; alguns atiram, alguns fogem.
3. **A diferenciação vem dos ataques/skills** dos mobs, com orçamento por tier (abaixo) — não de mecânicas exóticas por família.
4. **Dificuldade crescente dentro da família**: o jogador revisita o tema mais forte, e a família inteira alimenta a mesma Marca.

## As 12 famílias (decidido)

**Bestial · Humanoides · Vermes · Plantas · Aquáticos · Voadores · Mortos-Vivos · Dracônicos · Gigantes · Elementais · Míticos · Demônios**

O detalhe por família (criaturas, tabelas) está em [design/bestiario/FAMILIAS.md](FAMILIAS.md).

## Tiers e orçamento de ataques (decidido)

| Tier | Nível-alvo ✏️ | Orçamento típico de ataques |
|---|---|---|
| **T1** | 1–8 | só ataque básico |
| **T2** | 8–15 | básico + 1 skill simples |
| **T3** | 15–25 | básico + 1 skill (+ signature às vezes) |
| **T4** | 25–40 | básico + 1–2 skills (+ signature comum) |
| **T5** | 40+ | básico + 2 skills + signature |

**Não é regra absoluta** — a exceção cria nuance: o **bruto** (só stats: muita vida, muito dano, zero skill) existe em todo tier e é tão memorável quanto o mob de signature. Ex: Urso Pardo (T3), Verme Colosso (T4), Ogro Bruto (T3).

- **Skill** = bloco reutilizável da biblioteca abaixo, com elemento/status da criatura.
- **Signature** = ataque/efeito exclusivo da espécie, a "cara" do mob (breath do Dragonete, petrificar do Basilisco). Raras por definição.

## Biblioteca de blocos de ataque (a sim implementa isso, não skills caso-a-caso)

| Bloco | Descrição |
|---|---|
| **Básico** | melee adjacente (ou projétil simples, para mobs "ranged de natureza") |
| **Projétil** | ataque à distância com elemento/status |
| **Cone (breath/onda)** | dano em cone na direção do alvo, telegrafado |
| **Área ao redor** | pisão/nova centrada no mob |
| **Status no hit** | veneno, queimadura, slow, sangramento, root, stun — anexado a qualquer bloco |
| **Autocura / regen** | cura ativa ou regeneração passiva |
| **Investida** | gap-closer em linha |
| **Autobuff** | fúria: +velocidade/+dano por Xs ✏️ |

Comportamentos (IA): base universal **Perseguidor** (A* + melee); modificadores **Atirador**, **Covarde**, **Matilha**, **Territorial**, **Estacionário** (raro).

## Matriz de fraquezas (resumo)

| Família | Imune | Resistente | Fraco |
|---|---|---|---|
| Bestial | — | — | — |
| Humanoides | — | — | — |
| Vermes | veneno | — | **fogo** |
| Plantas | sangramento | veneno | **fogo** (muito) |
| Aquáticos | — | fogo | **gelo** |
| Voadores | — | — | — |
| Mortos-Vivos | veneno, sangramento, **abissal** | gelo; físico (só Espectro) | **sagrado**, fogo |
| Dracônicos | — | fogo | **gelo** |
| Gigantes | — | — | — |
| Elementais | próprio elemento, veneno, sangramento | físico (Terra) | **elemento oposto** |
| Míticos | varia | varia | varia |
| Demônios | fogo | — | **sagrado** |

Leitura de design: **fogo** é a fraqueza mais comum no early-mid (Vermes/Plantas/Mortos-Vivos) mas perde valor no endgame (Demônios imunes, Dracônicos resistem) — o mago de fogo brilha cedo e sofre tarde. **Gelo** inverte (forte vs Aquáticos/Dracônicos no late). **Sagrado** é nicho absoluto: devastador vs profanos, neutro no resto. Nenhum elemento é resposta universal.

### Escala de multiplicadores — a "Regra 10–20" (decidido — jun/2026)

Fraqueza/resistência é **multiplicador sobre o dano** (baseline 100%), nunca interruptor — com uma única exceção: imunidade. **A norma do jogo é ±10–20%** (balance); uns **poucos quebradores autorais** passam da régua onde a **verossimilhança exige** — a quebra é sempre identitária: o corpo da criatura justifica o número.

| Camada | Faixa | Exemplo |
|---|---|---|
| **Subtipo físico** (corte/impacto/perfuração) | sussurro: **±10%**, exceções raríssimas | esqueleto: maça 110%, flecha 90% |
| **Elemental — a norma (regra 10–20)** | fraqueza **110–120%** · resistência **80–90%** | undead: fogo 110% · gelo ~85% |
| **Quebradores autorais** (poucos, identitários) | fraqueza **~125%** · resistência **~70%** | elemental × elemento oposto ~125% · undead × sagrado ~125% ✏️ · dracônico cuspidor de fogo × fogo ~70% |
| **Imunidade** | **0%**, raríssima e tematicamente óbvia | elemental × próprio elemento (golem de pedra × terra, elemental de fogo × fogo) · undead × abissal · demônio × fogo |

- **Exemplo canônico — Mortos-Vivos:** abissal **0%** · sagrado **~120–125%** (candidato a quebrador ✏️) · fogo **110%** · gelo **~85%** · demais **100%**.
- **Números exatos de toda a matriz ✏️ Balancista** — as faixas acima são a régua de design, não valores finais. **Mapeamento provisório palavra→número** (paper, jun/2026): fraco **110** · muito fraco **120** · quebrador **125** · resistente **85** · resistência identitária **70** · imune **0** · subtipo físico **90/110** — validar na sim no M2 (`docs/reports/2026-06-04-balance-consolidacao-kit-itens.md`).
- "Devastador" no vocabulário deste doc = ~125% (quebrador) — fraqueza **nunca dobra dano**.
- **Abissal / Abyssal (batizado jun/2026)** é o elemento dos profanos — a energia do Abismo (cânone: Guerra do Submundo, Fendas, Cultistas). Projétil abissal de Cultistas/Tormentadores; undead imunes (*o profano não fere o profano*). Se/quando jogadores acessam dano abissal ✏️ aberto.
- **Multiplicadores de SKILL vs família são camada separada (decidido jun/2026):** a Regra 10-20 governa a **matriz do mob**; bônus de skill (Luz Sagrada vs profanos) e futuros "dano vs X" de Marca têm valores próprios, calibrados individualmente — regra deles: base viável contra qualquer mob, bônus forte sem trivializar (✏️ valores Balancista).
- **Anti-datamine:** nenhum multiplicador aparece em tooltip ou viaja no snapshot — descobre-se sentindo o dano e por NPCs. Regras da camada física em `DESIGN-ITENS.md`.

## Ganchos com o sistema de Marcas

- **Famílias = alvo das Marcas de item** (*Quebra-Ossos* vs mortos-vivos) e dos Caminhos *Carrasco de <família>* / *Exorcista*.
- **Espécies = grind lendário específico** (✏️ proposta: Marcas de espécie e de família existem; espécie é mais rara e mais forte).
- **Famílias-lar por classe:** Priest → Mortos-Vivos/Demônios · Mage → Elementais/Dracônicos · Rogue → Humanoides/Bestial (sangramento e veneno funcionam) · Knight → Gigantes (*Inabalável* bloqueando golpes pesados).
- Covardes que fogem alimentam *Arremesso → Caçador*.
- T4–T5 são as famílias onde thresholds de 10–20k fazem sentido de tempo de jogo — T1–T2 saem de rotação no mid-game (regra anti-degeneração: kill precisa dar XP válido).

## Aberto / a decidir ✏️

- [ ] Números: HP/dano/XP/velocidade por criatura (M2)
- [ ] Marcas distinguem espécie vs família? (proposta: ambas, espécie mais rara e mais forte)
- [ ] Respawn/densidade por região (M3 — design de mapa)
- [ ] Tiles de água + regra das Piranhas (M3 — mapa)
- [ ] Mini-bosses e bosses de área (doc futuro — inclui dragões adultos)
- [ ] Loot table por criatura (M2 — itens)
- [ ] Efeitos exatos das signatures marcadas ✏️ (Marca Sombria, Grito, Pulso Arcano, Três Cabeças, Maldição)
