# Balance — Consolidação das pendências numéricas (sessão de itens/kit, jun/2026)

> **Balancista, 2026-06-04.** A sessão de design de hoje (tipos de mão, Regra 10-20, escudo, kit inicial, rito de classe) gerou pendências numéricas. Estado da sim: M1 com **1 mob** (Rato Lanhoso), skills com números **✏️ placeholder**, itens **não implementados** (M2) — simulação empírica agora mediria placeholder, não design. Este report crava **alvos provisórios de paper** onde dá, ordena o **backlog de calibração** e registra **1 flag de coerência** achada no código.

## 🚩 Flag de coerência: `LUZ_SAGRADA.unholyMultiplier = 2.5` × Regra 10-20

`src/sim/skills/numbers.ts` dá à Luz Sagrada **×2.5 vs profanos** (+150%). A Regra 10-20 decidida hoje teta a **matriz de resist** em ~125% ("fraqueza nunca dobra dano"). Stacking atual: 2.5 (skill) × ~1.2 (sagrado vs undead na matriz) = **×3.0 total**.

**Pergunta ao criador (via Designer de Sistemas):** o teto da Regra 10-20 vale só para a matriz do mob, ou também para multiplicadores de skill vs família?

- **Se só matriz** (skill é camada separada, estilo card do RO): ok por design — mas registrar explicitamente, e o ×2.5 ainda precisa de calibração (3× total pode trivializar o farm do Priest vs undead).
- **Se vale para tudo**: multiplier cai para ~1.25 e o farm solo do Priest precisa de outra fonte de força (rever "Atenção de balance" do DESIGN-EVOLUCAO).

## Alvos provisórios (paper — validar na sim no M2)

### 1. Priest-luva no early (luva + Luz Sagrada vs T1)

Com os placeholders atuais: Luz Sagrada custa 12 mana / cd 1.5s — pool early (~base+Int×k) sustenta ~4–5 casts até secar → o gargalo é **regen de mana (Esp)**, não dano. Paper-viável como ciclo "casta → soca → regenera".

**Critérios de aceitação para a bateria M2** (quando luva existir):
- TTK do Priest-luva vs mob T1 ≤ **2×** o TTK do Priest-cetro (mais lento ok; inviável não).
- Ciclo sustentável: matar 1 Rato sem secar a mana OU com janela de regen < 30% do tempo de caça.
- Se falhar: a alavanca é regen de Esp / custo da Luz Sagrada, **não** dano da luva (luva segue sem dano — o dano desarmado real é do Monge, lvl 25).

### 2. Lote inicial de flechas (Rogue-arco no rito)

Alvo de design: o lote cobre **~15–20 min de caça T1** — até a primeira volta natural ao vendor; repor flechas é a primeira rotina de compra do arqueiro, nunca uma corrente no pescoço.

**Provisório: 50 flechas** ✏️ — validar com TTK real de arco no M2 (flechas/kill × kills até o primeiro gold).

### 3. Escudo — bloqueio e ordem das camadas de mitigação

Provisórios (faixa 60–80% decidida em `DESIGN-ITENS.md`):
- **Chance de bloqueio**: ~20% no escudo T1 ✏️ (cresce por tier).
- **Chunk absorvido**: **70%** (meio da faixa) ✏️.

**Ordem das camadas (proposta de fórmula, com o Designer):**
```
dano físico:  1) roll de bloqueio → absorve chunk %   (evento `block`)
              2) − Def flat (soma das peças + escudo)
              3) piso: final = max(1, …)              (nunca 0 — arranhão, não imunidade)
dano elemental/mágico: resist % da parcela do tipo; Def flat NÃO se aplica
```

### 4. Regra 10-20 — mapeamento provisório palavra → número

Tradução da matriz verbal do `DESIGN-BESTIARIO.md` para multiplicadores:

| Palavra na matriz | Multiplicador |
|---|---|
| fraco | **110%** |
| muito fraco / fraqueza forte | **120%** |
| quebrador autoral (elemental × oposto; undead × sagrado ✏️) | **125%** |
| resistente | **85%** |
| resistência identitária (dracônico cuspidor × fogo) | **70%** |
| imune | **0%** |
| subtipo físico (camada-sussurro) | **90% / 110%** |

### 5. Defesa flat — forma da fórmula (`formulas.ts`, M2)

`final = max(1, bruto − ΣDef)` — **determinística** (sem roll de armadura estilo Tibia: coerente com a decisão "dano estável/legível"). A escala de Def por tier sai da bateria M2 contra o dano dos mobs por tier.

## Backlog de calibração (ordem de execução)

1. **Bateria M1** (régua base, nunca rodada): TTK/TTL Knight vs Rato ×1/2/3, XP/hora, mana economy das 6 skills — pré-requisito de tudo.
2. Migração da curva de XP para a forma decidida (exponencial ~2×/nível, alvo 1→25 em 30–45h) — `formulas.ts` ainda usa a cúbica do Tibia.
3. **M2 (itens implementados)**: bateria de escudo (chance/chunk) · flechas (lote) · Priest-luva (critérios acima) · Def flat por tier.
4. Matriz 10-20 completa por família na sim + TTK Priest vs undead com o teto novo (depende da flag acima).
5. Custo em gold do rito de classe + preços das skills básicas ("quase grátis") — junto com o primeiro passe de economia.
