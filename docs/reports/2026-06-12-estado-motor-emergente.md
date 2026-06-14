# Estado do Motor Emergente — consolidação de fechamento do ciclo

**Data:** 2026-06-12 · **Branch:** `balance/curva-xp-regen`
**Para quê:** índice ÚNICO do ciclo de 3 chats (A=engine · B=design · C=balance) sobre a
camada emergente (Marcas/Mutações/Caminhos) + a engine de skills que a sustenta. Lê-se em
1 página pra **encerrar os chats sem perder nada**: o que está em CÓDIGO, o que é FILA, o
que espera DECISÃO do criador, e onde cada fonte vive.

---

## 1. EM CÓDIGO (implementado + testado neste ciclo)

**Engine de skills** (`feat/skills-engine` mergeada — commit `d5b3965`):
- Cast-time (begin/resolve, cancela por mover/dano), executores `groundTarget` / `selfRadius`
  / `chain` / `lifedrain`, status declarativos (`root` / `bleed`), render no client (cast bar,
  telegraph de skillshot, area burst, input de mira). Catálogo de 7 skills data-only (`5f592d6`).

**Motor de efeitos das Marcas** (commit `f47332f`):
- `TrackingEffect.payload` freeform → **união tipada `EffectSpec`**; `when?` reusa o `Filter`
  dos gatilhos (engine declarativa dos 2 lados); `activeEffects`/cache invalidado em unlock/equip.
- **Primitivos PRONTOS:** P1 `damageMult` · P2 `onKill` (areaDamage + `restoreMana`) · P3
  `blockFull` · P4 `crit` · P5 `regen` · P6 `statusCombo` · P8 `grantSkills` · **`incomingMult`**
  (1º efeito de ENTRADA) · ratio **`subNumerators`** (piso por elemento).
- **Sensores** (spec `2026-06-11-spec-sensores-tracking.md`): `Accumulator` count/distinct/sum/max;
  ratio (num/den/minRatio + milestone); eventos `equip`/`unequip`/`consume`/`combat_end`; fatos
  ricos (overkill, attackerHpPct, firstHitReceivedOfCombat, magicOnlyVictory, …).
- **Fichas REAIS ligadas** em `tracking/definitions.ts`: ①②③④⑤⑥⑦ (DUMMYs Roedor/Chama-Viva/
  Naturalista/Punho-Bruto removidos). ④ = Marca de ESCUDO (usa `equippedShieldInstanceId`).
- **P7 skillSwap:** *ligado mas INERTE* — `resolvedMutationSkill` + tradução no cast existem,
  mas caem na base enquanto não houver DEFS mutadas.

## 2. FILA (pendente) — por dono

**Engine (Chat A):**
- [Q1] DEFS mutadas + status novos `dash`/`shield`/`stun`/`armorShred`/`regenHoT` (P7 fica inerte sem eles).
- [Q4]/[B9] Monge: `derivedMod` (dano desarmado) + ficha — **bloqueado** por taxonomia de slot main-hand×off-hand.
- [C1] fato `viaWeapon` em `applyDamage` (Marca de arma só no auto-attack, não em magia).
- [B8]/[B3]/[B4] formas das mutações ⑨⑩⑪ (knockback / dano-por-distância 2-lados / spreadStatus).
- [B10]/[B11] formas das mutações do Lote 2.

**Balance (Chat C — eu, com engine já pronta):**
- ⑥ Intocado: magnitude da mana-on-magic-kill (1-2) **+ farm-loop de kite** (brief crítico: reembolso parcial, nunca net-positive).
- ⑤ Sombra Sem Nome: % de mitigação do 1º golpe (agora com lente PvP).
- ⑦ Senhor dos Extremos: burst do choque térmico + pisos por elemento (hoje 30/30 ✏️).
- ③ Transbordo: fração do overkill. Mutações Lote 2/3: números (tradeoffs anti-upgrade-puro).

**Decisão do criador (não-engine):**
- Confirmar os 4 números do Lote 1 (ver §3 — convergidos, falta aplicar no código).
- Lote 2: reconciliar nomes com `design/skills/CATALOGO.md` (substitui os rascunhos?); confirmar cortes (Passo Sombrio, Raio Solar).

## 3. Números calibrados — Marcas Lote 1 (DECIDIDOS, jun/2026)

> Bateria `2026-06-11-bateria-marcas-lote1-tipo1.md` (harness real Simulation).
> **CONFIRMADOS pelo criador (2026-06-12)** — não mais ✏️. Ação restante (Chat A): aplicar em
> `definitions.ts` — ② 1.20→1.12 + `viaWeapon` ([C1]).

| Ficha | Threshold | Efeito | Escopo | Tempo ≈ |
|---|---|---|---|---|
| ① Quebra-Ossos | **15.000** kills undead | **+12%** vs undead | PvE · **só AA** (`viaWeapon`) | ~35 h |
| ② Última Resposta | **~2.000** (golpe final HP<10%) | **+12%** em HP<25% | PvE · **só AA** (`viaWeapon`) | ~40–50 h |
| ④ Inabalável | **~30.000** bloqueios | blockFull **~12%** | PvE | ~37 h |

Princípio: a contagem se ajusta à **frequência do evento** → os 3 caem na MESMA banda de tempo.
Bônus pequenos (tempero, regra de ouro). **Guardrail:** multiplicadores aditivos (anti-spike por stack).

## 4. Buracos de documentação — CÂNONE (status)

| # | Onde | Decisão | Status |
|---|---|---|---|
| A1 | `:348` Intocado | EM REVISÃO → FINAL (mana-on-magic-kill, mago-puro) | ✅ FEITO (designer, 2026-06-12) |
| A2 | `:247` Última Resposta (+`:249` Inabalável + rodapé) | 10k→~2k · +12% HP<25% · PvE-only/só-AA | ✅ FEITO |
| A3 | `:31` Ritmo/Morte | exponencial → power-law `175·(n−1)^2.5` | ✅ FEITO |
| A4 | nova linha "Escopo PvP" no Mapa de decisões | gear=PvE-only · personagem=PvP+PvE | ✅ FEITO |
| A5 | sim (4 comentários "Intocável") | **NÃO é rename mecânico** — 3 dos 4 descrevem o efeito/condição VELHOS → reescrita semântica | → **fila [C2]** (Chat A; só A toca src/sim) |

## 5. Índice de fontes (onde tudo vive)

- **Constituição/visão:** `DESIGN-EVOLUCAO.md` (Pilares das Marcas, eixos, escada de 4 camadas) · `DESIGN-FILOSOFIA.md`.
- **Catálogo + design Lote 1:** `docs/reports/2026-06-11-catalogo-emergente-lote1-engine.md` (§6 revisão B, §7 roteamento).
- **Lotes de mutação:** `…-lote2-mutacoes.md` (revisado B §8) · `…-lote3-mutacoes.md` · auditoria `2026-06-11-audit-mutacoes-regra-3-partes.md`.
- **Handoff/engine ledger:** `docs/reports/fila-motor-emergente.md` (FILA + HISTÓRICO; itens Q*/B*/C*/S*).
- **Sensores:** `docs/reports/2026-06-11-spec-sensores-tracking.md`.
- **Balance:** `2026-06-11-bateria-marcas-lote1-tipo1.md` (Marcas) · `…-bateria-farm-loop.md` (XP/h, kite) · `…-curva-xp-*.md`.
- **Skills:** `DESIGN-SKILLS.md` + `design/skills/CATALOGO.md`.
- **Código:** `src/sim/tracking/` (engine/definitions/effects/types) · `src/sim/combat.ts` (hooks) · `src/sim/skills/`.
- **Memórias:** `marcas-motor-emergente`, `sessao-skills-estado`, `curva-xp-lei-potencia`.

## 6. Checklist de fechamento do ciclo

- [x] Cânone A1–A4 no DESIGN-EVOLUCAO (designer, 2026-06-12).
- [ ] [C2] reescrita dos 4 comentários "Intocável"→"Intocado" na sim — Chat A (texto exato na fila).
- [ ] Chat A aplica os números do §3 em `definitions.ts` (②: 1.20→1.12; ①②: `viaWeapon` via [C1]).
- [ ] Commit do trabalho em voo (`Simulation.ts`, `tracking/engine.ts`, `DESIGN-SKILLS.md`, fila, audit) — Chat A (dono da sim).
- [ ] Decisões de design não-engine (Lote 2 nomes/cortes) — Chat B + criador.
- [ ] (Próximo ciclo) Calibração do eixo personagem ⑤⑥⑦ + mutações, com régua dupla PvE+PvP.
