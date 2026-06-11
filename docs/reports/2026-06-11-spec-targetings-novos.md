# Spec de dados — targetings & mecânicas novas de skill (handoff Designer → código)

**Data:** 2026-06-11 · **Origem:** sessão de skills (catálogo ~38, `DESIGN-SKILLS.md` + `design/skills/CATALOGO.md`). **Tipo:** spec-de-dados implementável (definição → campos → exemplos), na regra de ouro: lógica na **sim**, dados **declarativos**, protocolo **serializável**. Números = ✏️ Balancista (briefing `2026-06-11-briefing-balancista-skills.md`). Mecânica estrutural = este doc.

## Estado atual (o que a engine já faz)

`src/sim/skills/` resolve cast **instantâneo no tick** (estilo runa de Tibia; client anima depois via evento `cast`). Vocabulário existente:
- **TargetingKind:** `meleeTarget` · `meleePositional` · `projectileTarget` · `lineThrough` · `healTarget` (executores em `executor.ts`).
- **EffectKind:** `physical` · `magic` · `heal`. **DamageType:** físico/fire/ice/holy/arcane.
- **SkillStatusApply.kind:** `burn` · `slow` · `poison` (poison tipado, **nenhuma skill aplica ainda**). ⚠️ **Smell:** os PARÂMETROS do status (dano/duração) estão **hardcoded** em `applySkillStatus` (lê `BOLA_DE_FOGO.burn`, `LANCA_DE_GELO.slow`) — não escala pra N skills com status.

## Princípio que organiza tudo

A maioria das skills novas **não são código novo, são DADOS novos** sobre executores genéricos — desde que a engine ganhe os **primitivos** abaixo. Cada primitivo serve várias skills. Implementar o primitivo uma vez, depois o catálogo é montagem.

---

## P0 — primitivos que destravam o briefing do Balancista

### A. `castTimeMs` (campo cross-cutting em `SkillDef`)
Skill que **não resolve no tick** — o caster **inicia** o cast e o efeito acontece `castTimeMs` depois. Estado novo na entidade: `casting?: { skillId, endTick, aimPoint? }`.
- **Comprometimento:** durante o cast o caster **não anda nem ataca** (commit). É o que torna o efeito **telegrafável e justo** (pilar 2: o perigo é legível ANTES).
- **Interrupção (✏️ criador, 2 opções):** (a) **andar cancela** (player escolhe abortar; inimigo não interrompe) — modelo limpo; (b) **tomar hit cancela** (mais punitivo — caster precisa de cobertura). Recomendo **(a)** pro MVP (menos estado, e o risco já é ficar parado).
- **Protocolo/snapshot:** o snapshot precisa expor `casting` (skillId + progresso) pro client desenhar a barra/telegrafia. **Mudança em `shared/protocol.ts`.**
- **Determinístico:** `castTimeMs → ticks` por `msToTicks`; zero RNG.
- **Usa:** Garras da Terra (e qualquer skill "pesada" futura).

### B. `groundTarget` (TargetingKind novo) — skillshot de área
Mira um **TILE** (ponto), não uma entidade; após `castTimeMs`, aplica efeito num raio `areaRadius` (2–3 casas) **no tile mirado** — **não persegue** (true skillshot: o alvo sai andando na janela do cast).
- **Campos novos:** `areaRadius: number`. Reusa `range` (alcance do mira) e `castTimeMs`.
- **Protocolo:** `useSkill` hoje manda um **alvo**; precisa de variante **cast-em-ponto** (`{ skillId, aim: Vec2 }`). **Mudança em `protocol.ts`.**
- **Usa:** **Garras da Terra** (root na área), e Storm se for mirado (✏️ ou Storm = `selfRadius`).
- **Resolução:** acha entidades vivas cujo tile está a `≤ areaRadius` (Chebyshev) do `aim`; aplica dano + status.

### C. `selfRadius` (TargetingKind novo) — burst instantâneo ao redor de si
Atinge **tudo num raio `areaRadius` ao redor do caster**, no tick (sem mira). Inimigos (dano) ou aliados+self (cura).
- **Campos:** `areaRadius`. Reusa `effect` (magic/physical → dano; heal → cura radial).
- **Usa (alto leverage — cobre 5 skills):** Whirlwind/Redemoinho, Steelstorm/Vendaval de Aço, Burst of Light/Explosão de Luz (dano) · **Sacred Aura/Aura Sagrada** (heal radial) · base p/ Eclosão/Nova (mutações).
- **Cura radial (Aura Sagrada):** cura caster + entidades-aliadas no raio. **No MVP solo não há aliados** → cura só o caster no raio (exatamente o design: "solo cura só você"). Quando aliados/online existirem, o mesmo executor já cobre.

### D. `chain` (TargetingKind novo) — salto entre alvos
Atinge o alvo primário, depois **salta** pro inimigo vivo mais próximo não-atingido dentro de `chainRange`, até `chainMax` saltos; dano **decai** por salto (`chainFalloff`).
- **Campos:** `chainMax: number`, `chainRange: number`, `chainFalloff: number` (0–1).
- **Usa:** **Sparks/Fagulhas** (chip-AoE do Mage). ⚠️ **Guardrail do Balancista** (briefing #2): `chainMax` baixo (2–3) + `chainFalloff` forte + escala **sublinear** em Int → **amacia, não deleta** (não fura o gate ~20 do deleter).
- **Determinístico:** desempate de "mais próximo" por ordem estável (id), sem RNG.

### E. `lifedrainPct` (campo cross-cutting) — dano que cura o caster
Fração do dano causado que vira cura no caster (`applyDamage` → `applyHeal` no mesmo tick).
- **Campo:** `lifedrainPct?: number` (0–1) em `SkillDef`.
- **Usa:** **Life Drain/Dreno Vital**. Genérico — qualquer skill de Morte pode marcar.

### F. Status declarativo (refactor estrutural — destrava todos acima)
Mover os PARÂMETROS do status do hardcode pra **dentro de `SkillStatusApply`** (dados), pra `applySkillStatus` virar genérico:
```
SkillStatusApply =
  | { kind: "burn";  damagePerTick; durationMs; intervalMs; damageType }
  | { kind: "bleed"; damagePerTick; durationMs; intervalMs }   // físico (Rend)
  | { kind: "poison";damagePerTick; durationMs; intervalMs }   // Poison Blade
  | { kind: "slow";  stepMsMultiplier; durationMs }
  | { kind: "root";  durationMs }                              // Garras da Terra
  | { kind: "armorShred"; defReduction; durationMs }           // Terra (alt do root)
  | { kind: "curse"; healReductionPct; durationMs }            // Morte (alt do lifedrain)
```
- **Status novos:** `root` (não anda — reusa o mecanismo do slow levado ao extremo, mas é flag de imobilizar), `bleed` (= burn físico), `poison` (ativar o já-tipado), `armorShred`, `curse`. Cada **elemento ganha seu status** (hub §3): fogo=burn · gelo=slow · terra=root|armorShred · raio=(chain, sem status) · morte=lifedrain|curse.
- **✏️ criador/designer:** Terra fica com **root** (escolhido na sessão — skillshot) ; armorShred fica de reserva. Morte fica com **lifedrain** (Dreno Vital escolhido); curse de reserva p/ uma 2ª skill de morte.

---

## P1 — primitivos do resto do catálogo (sequência seguinte)

| Primitivo | TargetingKind / campo | Skills | Nota |
|---|---|---|---|
| **Zona persistente** | `groundZone` (dura `durationMs`, tica efeito em quem está dentro) | Nevasca (slow-field), Consagrar (zona sacra) | difere do selfRadius: PERSISTE no chão; precisa de entidade-zona na sim |
| **Cone** | `cone` (leque na direção do facing, `range`+ângulo) | Flame Wave/Onda de Chamas | ✏️ ou aproximar por `groundTarget` à frente |
| **Buff/shield em self/aliado** | `effect: "buff"` + payload (absorb / dmgReduction / regen, `durationMs`) | Barreira Arcana, Escudo Sagrado, Baluarte, Blessing/Bênção, Lâmina Envenenada (buff que aplica veneno) | novo EffectKind `buff`; estado de buff na entidade |
| **Dash/mobilidade** | `effect`/targeting de movimento (teleporta/desloca o caster) | Blink/Piscar, Charge/Investida, Dash/Disparada | mexe em posição/cooldown, não em dano |
| **Obstáculo** | cria tile bloqueante temporário | Wall/Muralha | world-mutation; interage com pathfinding |
| **Conjurar item** | gera item temporário no inventário | Conjure Arrow/Conjurar Flechas | toca inventário, não combate |
| **Taunt** | força `targetId` dos mobs no raio | War Cry/Grito de Guerra | IA de mob |

**Beam/Bolt (Raio):** **NÃO precisa de primitivo novo** — é `lineThrough` instantâneo sem status (a engine já faz linha). Só uma entrada de dados.

---

## Mapa skill → primitivo (P0 + o que já existe)

| Skill | Targeting | Campos novos | Status |
|---|---|---|---|
| Sparks / Fagulhas | `chain` | chainMax, chainRange, chainFalloff | — |
| Earthen Grasp / Garras da Terra | `groundTarget` | areaRadius, **castTimeMs** | root |
| Life Drain / Dreno Vital | `projectileTarget` (já existe) | **lifedrainPct** | (curse, reserva) |
| Sacred Aura / Aura Sagrada | `selfRadius` + effect `heal` | areaRadius | — |
| Whirlwind/Steelstorm/Burst of Light | `selfRadius` + effect dano | areaRadius | — |
| Rend / Retalho | `meleeTarget` (já existe) | — | **bleed** |
| Storm / Tempestade | `selfRadius` **ou** `groundTarget` | areaRadius (+castTime se mirado) | — |
| Bolt / Raio | `lineThrough` (já existe) | — | — |

## Compliance (regra de ouro)

- **Sim autoritativa:** toda resolução (cast-time, área, chain, lifedrain, root) roda na sim; determinística (desempates por id, tempo por `msToTicks`, zero `Math.random`).
- **Protocolo serializável (2 mudanças necessárias):** (1) `useSkill` com **ponto de mira** (`aim: Vec2`) p/ skillshot; (2) snapshot expõe **`casting`** (skillId + progresso) p/ o client desenhar barra/telegrafia. Formato já-de-rede.
- **Client só desenha:** telegrafia do `groundTarget` (zona mirada), barra de cast, animação de chain/área — tudo a partir de eventos/snapshot; **nenhuma regra no client**.

## ✅ Decisões fechadas (criador, 11/jun/2026)

1. **Interrupção do cast-time:** **andar OU tomar hit cancela** (ambos). Exige rastrear movimento E dano-durante-cast → ao cancelar, devolve o cast (sem gastar mana? ✏️ Balancista decide se reembolsa) e zera o `casting`.
2. **Storm / Tempestade:** **`groundTarget`** (mirado + cast-time) — usa o MESMO primitivo do Garras da Terra. Reforça o valor do T2.
3. **Status por elemento:** terra=**root** · morte=**lifedrain** (Dreno Vital). armorShred/curse = reserva p/ 2ªs skills do elemento.
4. **Escopo da entrega:** **sim + client render** (mecânica jogável de verdade — skillshot/cast-time precisam de telegrafia). Numbers/Balancista = passo separado pós-merge.

### Plano de execução (worktree-swarm, 11/jun)
- **Batch 1 — WT `skills-engine-foundation`:** status declarativo (F) + cast-time infra c/ cancelamento por andar-ou-hit (A) + protocolo (`useSkill` com `aim:Vec2` + snapshot `casting`) + **superfície de tipos completa** (todos os TargetingKind novos + campos do SkillDef) + **cases-stub** no executor (`throw "TODO"`). Merge na main antes do batch 2.
- **Batch 2 (∥) — WT `skills-engine-executors`** (T2 groundTarget [Garras+Storm] + T3 selfRadius + T4 chain + T5 lifedrain, sequencial em 1 branch) **∥ WT `skills-client-render`** (cast-bar, telegrafia de zona mirada, anim área/chain).

→ Números (raio, castTime, chainMax/falloff, lifedrainPct, durações) = **Balancista**, com os guardrails do briefing.
