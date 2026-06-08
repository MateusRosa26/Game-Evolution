# Itens — Economia (loot, gold, preços, sinks)

> Sub-documento de [DESIGN-ITENS.md](DESIGN-ITENS.md) (o hub: decisões-mãe, slots, raridades, instância+ledger). Aqui vivem **loot & gold** e a discussão de **economia/sinks**. Catálogos em [EQUIPAMENTO.md](EQUIPAMENTO.md); consumíveis em [CONSUMIVEIS.md](CONSUMIVEIS.md).

## Loot & gold (decidido — jun/2026, direção do criador)

- **Mobs dropam gold direto** (estilo Tibia/Apogea) — mas **bem pouco**. Gold é difícil de conseguir por design.
- **Representação: ouro é ITEM empilhável no bolso** (modelo Tibia — decidido/implementado jun/2026, revisando o "número no personagem" do 1º passe). **Stack ILIMITADO numa única pilha** por container (funde ao depositar); o cadáver guarda a pilha, saquear move/funde pro bolso. **Saque**: `shift`/`alt`+clique na pilha (auto-deposita) ou **arrastar** a pilha pro bolso aberto; **clique simples não pega** (decisão do criador). Recompensa de quest também deposita no bolso. O **HUD mostra o total carregado** (soma das pilhas do bolso).
- **Peso do ouro (decidido jun/2026, criador)**: cada moeda pesa **0.1**, mas SÓ as **primeiras 150 moedas** têm peso — **teto de 15 de peso** (`min(amount,150)×0.1`); 200 de ouro = 15 de peso. Custo inicial de carga sem que hoardar ouro trave a caça. Entra no cap (`formulas.maxCarry` via Força). Hooks: `items/templates.goldWeight`, `ContainerRegistry.depositGold/totalGold`; `progress.gold` no snapshot = soma do bolso. ✏️ *gastar* (lojas NPC) saca do bolso quando o comércio entrar; moeda de prata/platina ✏️ se a economia crescer.
- **Loot de caça é a segunda camada da renda** — e a venda é **pouco óbvia**: compradores **específicos** espalhados pela cidade (não vendor universal — ver `design/mundo/SISTEMA-NPCS.md` §Comércio especializado), e **muitos loots só se tornam vendáveis após a quest do NPC comprador** (o trade destravado é recompensa de quest). Saber quem compra o quê é conhecimento-loot.
- Consequência de design: o caçador novato vive do gold miúdo dos mobs; quem fez as quests e conhece a cidade **monetiza a caçada inteira**. A diferença de renda é conhecimento, não grind.
- ✏️ Modelo de loot table por família/tier (estrutura genérica); as tabelas CONCRETAS da fatia ① vivem em `design/fatia-1-alvorada/`.

## Gold T1 — 1º passe calibrado (criador + Balancista, jun/2026)

Report completo: `docs/reports/2026-06-05-economia-gold-passe1.md`. Régua-mãe: **tudo baixo**
(`DESIGN-EVOLUCAO.md` §"Escala de números"). ✏️ validar na sim quando loot/gold entrarem (M2).

| Eixo | Números |
|---|---|
| Drop de gold | rato/bestial **0–1 (média ~0,4)** · goblin/humanoide **0–4 (média ~1,5)** |
| Gold/h T1 | **40–80 nu** · 70–120 vendendo na Nina · **120–220 informado** (compradores especializados) |
| Loot vendável | pele de rato **1 (Nina) / 2 (Amaro pós-Q7)** · orelha de goblin **2** (bounty Capitão) |
| Quests | 6 simples = **150** (20/20/25/25/30/30) · compostas por ato (Q7 30→60 · Q8 30→50→80 · Q9 80 · Q10 40) · abertas/segredos **0** (pagam em baú/registro) |
| Rito de classe | **custa 10** (sink simbólico), não paga |
| Preços de vendor | pão **2** · tocha **3** · flechas (lote 50) **10** · corda **15** / pá **20** · peça de couro **15–30** · arma T1 **40** (machado **60**) · **Poção Pequena 65** (≈ 33min de caça = luxo) |
| Sink âncora | **skills do tier seguinte em NPC: 150–300** (~1,5–2,5h de caça) — o T1→T2 |
| Validação do arco | budget do early ≈ 400–500 · completar o T1 ≈ 395–490 → **fecha justo, sem sobra estrutural** |

Princípios verificados (Koster): sink âncora > faucet acumulado do tier; venda do kit ≈ 0
(anti-loop); nenhum gold de graça. ⚠️ A vigiar no online: preços fixos de NPC + faucet por
jogador = inflação serial — reavaliar com dados do M6.

## Economia ✏️ (em discussão — acoplada ao PvP/perda de loot)

**A decisão-mãe pendente:** o jogo terá **PvP com perda de loot** (✏️ modelo a decidir — ver Aberto no hub). Perda de loot é o churn natural de itens; o quanto de sink *artificial* a economia precisa depende dela. Discutir os dois juntos para não drenar demais a balança.

Estado da discussão:

- **Descartado:** encantamento temporário/renovável (treadmill estilo imbuement do Tibia — vira imposto).
- **Em avaliação (não decidido):** desmantelar/salvage (risco: sink demais se somado à perda de loot), *Têmpera* (encanto permanente 1/item), *Preparos* (consumíveis táticos de caçada).
- **Direções aceitas:** quests/oferendas que **consomem** itens; vendor floor; **ledger = apreciação** (itens valorizam com uso, projetos de Marca paralelos multiplicam demanda); demanda situacional por loadouts (matriz de fraquezas).
- ~~✏️ gold drop por tier, preços~~ — **T1 calibrado no 1º passe** (seção acima); tiers seguintes com os mobs deles.
