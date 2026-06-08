# Economia de gold — 1º passe (proposta ✏️)

**Data:** 2026-06-05 · **Balancista** · primeira numeração da economia (DESIGN-ITENS
§"Loot & gold": direção decidida, números ✏️). Gold NÃO existe na sim ainda — este passe é
**aritmética sobre as taxas medidas** nas baterias M1.x (kills/h reais) + as âncoras
relativas já decididas nos docs. Validar em sim quando loot/gold entrarem (junto do
inventário, M2).

## Régua-mãe (decidida)

- **Tudo baixo** (DESIGN-EVOLUCAO §"Escala de números"): gold contado em moedas de 1
  dígito por kill; preços de 2 dígitos; nada de milhares no T1.
- **"Mobs dropam bem pouco; gold é difícil por design"** (DESIGN-ITENS §Loot & gold).
- **Venda no vendor geral ≈ ruim; conhecimento monetiza** (compradores especializados
  destravados por quest pagam ~2× a Nina).
- **Âncora de quest (QUESTS.md):** 6 simples ≈ rito + caça T1 até lvl 6–8.
- **Sink âncora (Koster):** skills compradas em NPC; poção = luxo; vendor de equipamento.

## Taxas-base medidas (baterias M1.x)

| Métrica | Valor | Fonte |
|---|---|---|
| Kills/h T1 (bot cuidadoso, knight) | ~140–300 | M1.2 |
| Kills/h T1 (teto degenerado) | ~475–590 | M1 V1 / M1.2 rogue |
| Jogador real estimado (anda, erra, conversa) | **~100–200/h** | desconto sobre o bot |
| Caça até lvl 6–8 (XP 2.470–6.840 cúbica, c/ quests no early) | **~1,5–3h** | M1.1/M1.2 + Adendo 3 |

## Faucets propostos (✏️ tudo)

| Fonte | Gold | Nota |
|---|---|---|
| Rato/bestial T1 | **0–1, média ~0,4/kill** | bicho não carrega bolsa — o grosso é o LOOT (pele/carne) |
| Goblin/humanoide T1 | **0–4, média ~1,5/kill** | humanoide carrega moeda (já no DESIGN-BESTIARIO) |
| Pele de rato → Nina / Amaro | **1 / 2** | o exemplo canônico do "conhecimento paga 2×" |
| Orelha de goblin → Capitão (bounty) | **2** | camada-salário da Q8 |
| Quest simples (Q1–Q6) | **média ~25** (faixa 15–40) | 6 simples ≈ **150** total |
| Quests compostas/encadeadas (por ato final) | **40–80** | proporcional ao risco T2 da ponta |
| Rito de classe | **0 de recompensa** (CUSTA 10 simbólico) | rito é sink narrativo, não faucet |

**Gold/h T1 derivado:** caça nua (só moeda) ≈ **40–80/h** · vendendo loot na Nina ≈
**70–120/h** · com compradores especializados (pós-quests) ≈ **120–220/h**. A diferença
de renda é CONHECIMENTO, não grind ✓ (DESIGN-ITENS). Arco do early completo (lvl 1→8,
quests + caça): acumula ≈ **400–500 gold**.

## Sinks propostos (✏️ tudo) — preço em ~minutos de caça T1 informada (~2 gold/min)

| Item/serviço | Preço | Em tempo | Papel |
|---|---|---|---|
| Pão | **2** | 1min | o saciador barato (fome→regen) |
| Tocha | **3** | — | consumível de exploração |
| Flechas (lote 50) | **10** | 5min | rotina do arqueiro (~15–20min de caça) |
| Corda / Pá | **15 / 20** | ~8–10min | chaves de exploração permanentes |
| Peça de couro (coifa/calça/botas) | **15–20** | ~8–10min | o chão confiável |
| Túnica de Couro | **30** | 15min | a peça-âncora do peito |
| Arma T1 do vendor (espada/clava/adaga) | **40** | 20min | repor/2ª arma; machado **60** (premium de perfil) |
| Rito de classe | **10** | 5min | simbólico (decidido: "quest boba + gold simbólico") |
| Skills do kit (no rito) | **0** | — | entregues pelo rito (kit inicial decidido) |
| Skills do tier seguinte (NPC, M3) | **150–300** | ~1,5–2,5h | O SINK ÂNCORA do T1→T2 |
| Poção Pequena de Vida | **65** (criador, ↑ de 50) | **~33min** | LUXO de emergência ✓ barreira alta |

**Validação do arco (aritmética):** budget do early ≈ 400–500 · gastos "completar o T1"
(couro Σ + arma extra + ferramentas + flechas/pão + 1–2 poções a 65 + 1ª skill T2) ≈
**395–490** → o jogador termina o T1 **justo, quase exato** — aperto saudável, sem
torneira aberta. Poção em 65 reforça as duas anti-degenerações (não cobre falha de
gameplay barato; não banca caçar acima do tier) — meia hora de caça por UMA emergência.

## Decisão do criador (mesma sessão)

**Tabela aprovada como base ✏️ com um ajuste: Poção Pequena 50 → 65.** Gold distribuído
por quest no QUESTS.md (6 simples = 150: 20/20/25/25/30/30; Q7 30→60 · Q8 30→50→80 ·
Q9 80 · Q10 40; abertas/segredos 0). Validação na sim quando loot/gold entrarem (M2).

## Princípios verificados (Koster)

- ✅ Sink âncora (skills) > faucet acumulado do tier — o T1 não infla.
- ✅ Venda do kit inicial ≈ 0 (anti-loop) — já decidido.
- ✅ Nenhum gold "de graça": quest paga serviço, rito custa.
- ⚠️ A vigiar no online: preços de NPC fixos + faucet por jogador = inflação serial em
  mundo compartilhado. Sinks futuros já decididos ajudam (oferendas/quests que consomem
  itens); reavaliar com dados de M6.

## Pendências

1. **Gold/loot na sim** (M2, junto do inventário) — re-medir gold/h real e validar preços.
2. Drop rates de loot por mob (% pele/orelha) — bateria própria quando loot entrar
   (esfola condicional já tem report: `2026-06-05-esfolar-e-fome.md`).
3. Preços T2+ (escada de skills por tier = curva do sink âncora) — com o 1º mob T2.
4. Gold por quest individual (QUESTS.md ✏️) — distribuir os ~150 das simples + 40–80 das
   compostas quando este passe for aprovado.
