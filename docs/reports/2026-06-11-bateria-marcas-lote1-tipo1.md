# Bateria — Marcas do Lote 1 (TIPO 1: sem engine nova) → thresholds + mults

**Data:** 2026-06-11
**Chat:** C (Balanceamento)
**Escopo:** calibrar **empiricamente** os números das 3 fichas que NÃO dependem de
engine nova (roteamento §7 do catálogo Lote 1): **① Quebra-Ossos**, **② Última
Resposta**, **④ Inabalável**. Saída = número final + evidência da sim. Os números
entram nas **fichas reais** quando o Chat A construir [Q5] (`tracking/definitions.ts`
hoje é DUMMY) — esta bateria NÃO edita a sim (sim é sequencial, estrutura é do A).

> **Régua (constituição):** camada emergente = **tempero, nunca pilar** (bônus
> pequenos, nada balanceado assumindo Marcas) · thresholds "entrada descobrível,
> aprofundamento brutal" = **dezenas de horas dedicadas**, muito difícil mas não
> inalcançável · números baixos (escala Tibia, ±1 é sentido) · alvo = HORAS entre
> uma coisa nova e a próxima.

---

## Método

Harness headless descartável (`/tmp`, real `Simulation` + `testMap`, RNG seedado).
Knight com Escudo de Madeira (T1: `block {chance:0.30, chunkPct:0.70}`), saciado-carne
(regen 1,5×), mob spawnado adjacente reposto a cada morte (pop travada no `packSize`;
respawn automático da sim desligado). Eventos do bus contados: `block`, `damage`-no-player,
`kill` + HP% do player no instante de cada kill. 10 min sim-time/cenário (20 tps).

**Nota de leitura:** o `kills/h` do harness é o **teto de combate puro** (zero travel,
HP topado) — ~1,7× o XP/h realista medido na `bateria-farm-loop.md` (fator de realismo
medido: rato L1 harness 912/h ÷ farm-loop 531/h = **0,58**). Por isso as taxas/hora
realistas abaixo usam **métricas intensivas do harness** (bloqueios/kill, % de golpe
bloqueado, HP%@kill — que NÃO dependem de travel) **×** o `kills/h` realista do farm-loop.

## Medições brutas (10 min/cenário)

| cenário | maxHp | kills | blocks | hits | **block%** | **blocks/kill** | avgHP%@kill | kill@<10% | kill@<25% | mortes |
|---|---|---|---|---|---|---|---|---|---|---|
| ④ knight L1 · 1×rato · refill | 144 | 152 | 130 | 468 | **28%** | **0,86** | 100% | 0% | 0% | 0 |
| ④ knight L1 · 3×rato · refill | 144 | 155 | 394 | 1258 | **31%** | **2,54** | 100% | 0% | 0% | 0 |
| ④ knight L8 · 1×lobo · refill | 283 | 139 | 139 | 455 | **31%** | **1,00** | 100% | 0% | 0% | 0 |
| ④ knight L8 · 3×lobo · refill | 283 | 142 | 330 | 1094 | **30%** | **2,32** | 100% | 0% | 0% | 0 |
| ① knight L1 · 1×esqueleto · refill | 144 | 125 | 94 | 316 | 30% | 0,75 | 100% | 0% | 0% | 0 |
| ① priest L8 · 1×esqueleto (auto) | 222 | 77 | — | — | — | — | 100% | 0% | 0% | 0 |
| ② knight L1 · 3×rato · **NO-refill** | 129 | 162 | 356 | 1220 | 29% | 2,20 | **55%** | **8,0%** | **20,4%** | 0 |
| ② knight L8 · 3×lobo · **NO-refill** | 208 | 149 | 348 | 1138 | 30% | 2,34 | **53%** | **10,7%** | **24,8%** | 0 |

**Confirmação de engine:** todo golpe que chega emite `damage`; os bloqueados emitem
`block` ADICIONAL → `block / hits = ~30%` em todos os cenários = a `chance:0.30` do
escudo. ✓ (o `chunkPct:0.70` reduz 70% mas o resíduo ≥1 ainda gera `damage`).

---

## ① Quebra-Ossos — threshold **15.000** (CONFIRMA o catálogo) · mult **+12% vs undead**

**Threshold (tempo):** o esqueleto (undead T1) é a unidade. kills/h realista =
harness 750/h × 0,58 = **~435/h** dedicado. `15.000 ÷ 435 = ~34,5 h` de caça dedicada a
mortos-vivos com a MESMA arma → cai no alvo "dezenas de horas, brutal, auto-gateada"
(e mais em wall-clock real, já que ninguém só farma undead). **15k está bem calibrado —
mantém.** (O priest, farmer natural de undead via Luz Sagrada, fecha mais rápido, mas a
Marca vive no **ledger da arma melee** — o número é ancorado no melee.)

**Mult (tempero):** golpe médio do knight L1 = `physicalDamage(str 11, espada base 10)`
= ⌊10×(1+11×0,05)⌋ = **15** (rola ±40% → 9–21); esqueleto tem **30 HP** → 2 golpes.
- **+12%** → médio 16,8: continua 2 golpes, mas **apara o 3º golpe** dos under-rolls →
  ~10–13% mais rápido vs undead. **+2 de dano num golpe de 15 = "±1–2 sentido"** (escala
  Tibia), NÃO muda que tier você enfrenta — **tempero puro** sobre a sua presa-assinatura.
- Recomendado **+12%** (faixa considerada: +10% piso conservador … +15% teto). Acima de
  +15% começaria a "trivializar undead" = vira pilar. ✏️ criador.

## ② Última Resposta — threshold **~2.000** (CORRIGE o ~10k) · mult **+12% em HP<25%**

**O achado central — o gatilho é RARO, ~10k é inalcançável.** O gatilho exige o **golpe
final com o player em HP<10%**. Em farm saudável (refill) isso é **0%** dos kills. No
cenário mais imprudente sustentável (3-pack contínuo, só regen de comida, sem topar HP, o
jeito que alguém perseguindo a Marca jogaria) só **8,0% (L1) / 10,7% (L8)** dos kills
qualificam — e o knight sobrevive nisso (0 mortes, HP médio ~53–55%). Em jogo misto normal:
~1–4%.

- Taxa de qualificação dedicada: ~8–11% × kills/h realista dedicado (~400–500) =
  **~35–50 kills-qualificados/h**.
- Pra ② custar **dezenas de horas de busca deliberada** (alinhado às outras Marcas, ~35–50h):
  `40 h × ~40/h ≈ 1.600` → **~2.000** kills qualificados.
- **~10k** exigiria ~250 h de jogo-no-fio dedicado (ou 1000 h+ em jogo normal) =
  **inalcançável → recalibrar pra baixo ~5×.** O número-de-kills é pequeno **de propósito**:
  compensa a raridade intrínseca do evento (igual em TEMPO às Marcas de 15k, com 1/7 da
  contagem porque o evento é 1/7 tão frequente).
- Recomendado **2.000** (faixa: 1.500 … 3.000). ✏️ criador.

**Mult (tempero clutch):** ativo só em **HP<25%** (baixa uptime, alto risco). Golpe 15 →
**+12%** ≈ 17 (rola 10–23). Ajuda a **fechar o combate no fio** sem virar pilar.
**Trajetória do número:** +20% (1ª proposta) → +15% → **+12% = paridade com ①** (decisão
criador, jun/2026). Motivos do corte:
- **Escala Tibia / anti-degeneração (Sirlin):** spike de dano grande gatilhado por *estar
  quase morto* incentiva ficar-no-HP-baixo de propósito (mesmo motivo do ⑤ perder o crit).
- **A identidade de clutch vem da CONDIÇÃO (HP<25%), não de ser um número maior que ①.**
  Manter ① = ② em magnitude deixa o lote de Marca de arma num patamar único modesto.
- **Multiplicador NÃO escala com força do mob** (preocupação levantada): +12% = ~11% mais
  rápido em TODO tier (T1 e T5 igual). É *por isso* que se usa % e não +N fixo (o +N é que
  trivializa fraco e some no forte). O que cresce é a UTILIDADE do clutch em luta difícil
  (você cai abaixo de 25% mais vezes) — comportamento desejado de uma Marca de "resposta".
- ✏️ criador. **Guardrail sistêmico:** manter os multiplicadores **aditivos/sem-stack
  multiplicativo** (② × crit × outra Marca = spike) — o risco de over-scaling é o STACK,
  não uma Marca sozinha.

**Escopo do dano (decisão criador, jun/2026 → fila [C1], engine):** o `damageMult` da
Marca de arma deve aplicar **só ao dano de ORIGEM-ARMA (auto-attack)**, NUNCA a magia
(Bola de Fogo, Luz Sagrada) — a Marca vive na arma, é o *golpe da arma* que aprende. Vale
p/ ① também. Codável: `applyDamage` já recebe `weapon`/`skillId`; expor fato `viaWeapon` +
`when: viaWeapon==true`. SEGURO = só AA (`skillId==null`); weapon-skills (Golpe Forte/
Apunhalar) = decisão à parte.

## ④ Inabalável — threshold **~30.000 bloqueios** (50k destoa) · blockFull **~12%**

**Brief atendido (bloqueios/hora × magnitude das outras Marcas):**
- **Taxa de bloqueio = 30% dos golpes recebidos** (medido, = `chance:0.30`).
- **Bloqueios acumulam ~1,5–2,3× mais rápido que kills** pra um shield-knight: blocks/kill
  = **0,86** (1×1 leve) → **2,3–2,5** (tankando pack-3). O shield É o arquétipo que tanka
  pack → o regime relevante é o de pack (~2×).
- **Bloqueios/h realista** = blocks/kill × kills/h realista do farm-loop:
  - 1×1 leve L1: 0,86 × 531 = **~457/h**
  - pack-tank L1: ~2,5 × ~500 = **~1.250/h**
  - pack-tank L8: ~2,3 × 306 = **~700/h**
  - representativo (shield-knight que busca pack): **~800/h**.
- **Alinhar à magnitude de ① (15k kills ≈ 35 h):** `35 h × ~800/h ≈ 28k` → **~30.000 bloqueios**
  ≈ **37 h** dedicado = MESMO tempo que Quebra-Ossos. ✓
- **Por que 50k destoa:** `50.000 ÷ ~800 = ~62 h` (1,6× as outras Marcas) — e como só
  existe o escudo T1 hoje e a Marca vive na **instância do escudo**, 62 h arrisca passar
  da **vida útil de um escudo** → "inalcançável" (fere a régua). 30k já **exige lealdade
  ao escudo** exatamente como as Marcas de arma exigem 15k kills com a MESMA arma — coerente.
- Recomendado **30.000** (faixa: 25k … 35k). ✏️ criador.

**blockFull % (P3 — secundário, depende da ficha [Q5]):** chance de um bloqueio absorver
**100%** em vez de 70%. Tempero defensivo pro tank dedicado: **~12%** dos bloqueios viram
cheios (≈ +3,6 pontos de mitigação efetiva sobre os 30%×70% já existentes — sensível, não
quebra). Faixa 10–15%. ✏️ criador (calibra junto quando [Q5] criar a ficha real).

---

## Resumo (handoff p/ [Q5] — Chat A embute nas fichas reais)

| Ficha | Threshold | Mult / efeito | Tempo ≈ | Evidência |
|---|---|---|---|---|
| **① Quebra-Ossos** | **15.000** kills undead | **+12%** dmg vs undead | ~35 h | esqueleto ~435 kills/h real; golpe 15 vs hp30 |
| **② Última Resposta** | **~2.000** kills (golpe final HP<10%) | **+12%** dmg em HP<25% (só AA) | ~40–50 h | qualif. 8–11% mesmo em pack imprudente; 0% saudável |
| **④ Inabalável** | **~30.000** bloqueios | blockFull **~12%** | ~37 h | bloqueio=30% dos golpes; ~800 blocks/h (pack-tank) |

**Princípio transversal validado:** os três caem na MESMA banda de tempo (~35–50 h
dedicados) apesar de contagens muito diferentes (2k … 30k) — porque a contagem se ajusta à
**frequência do evento** (kill comum 15k · bloqueio 2× mais comum 30k · kill-clutch 7×
mais raro 2k). É assim que "alinhado em magnitude, não em número absoluto" (brief) se
materializa. Nenhum bônus é pilar: +12%/+12%/blockFull-12% são todos tempero (regra de ouro
preservada — quem não desbloquear nada joga um RPG completo). **Marcas de dano (①②) só no
auto-attack** (fila [C1]) — não vazam pra magia.

## Escopo PvP (DECISÃO CRIADOR, jun/2026) — restrição de calibração

O **eixo decide o escopo de balance**:
- **Marca de arma/escudo (gear — ①②③④):** **PvE-only** (vive na economia de loot/grind;
  normalizada/desligada no duelo). → Os números desta bateria (12%/15%/blockFull-12%) só
  passam pelo crivo **PvE** — é por isso que calibrá-los puramente contra o farm-loop está
  correto. Nenhum precisa sobreviver ao teste de duelo.
- **Eixo personagem (Título/Caminho/Mutação/hidden-class — ⑤⑥⑦⑨⑩⑪⑫):** define o **BUILD**
  → **balanceado p/ PvP E PvE.** Quando eu calibrar esses (tipo 2), cada um sai com **duas
  medições**: feel PvE *+* impacto PvP (Sirlin no duelo — nenhum build domina sem
  counterplay; simetria entre arquétipos). Mais sensíveis: **⑤** (mitiga 1º golpe recebido =
  mecânica de duelo), **⑨** (knockback = controle), **⑦** (burst), **⑫** (classe inteira).
- **Cânone:** a linha fundacional disso (eixo→escopo PvP) ✏️ entra no `DESIGN-EVOLUCAO.md`
  (designer-de-sistemas).

## Pendências / ✏️ criador
- [ ] Confirmar os 4 valores ✏️ (15k / +12% · 2k / +15% · 30k / blockFull 12%).
- [ ] ② e ④ usam **engine que já existe** (P1 damageMult, P3 blockFull) — entram em [Q5]
  assim que o Chat A criar as fichas reais (hoje DUMMY). ① idem (P1).
- [ ] Re-ancorar quando: (a) **comida real** entrar (muda kills/h → re-pin proporcional dos
  thresholds, mesma régua de tempo); (b) **escudos T2+** existirem (vida útil do escudo
  vira o teto duro de ④ — re-checar 30k contra ela); (c) **T3+ undead** (ghoul) entrarem
  (kills/h de undead muda → re-pin de ① pelo tempo, não pela contagem).
