# Catálogo de skills sobre os primitivos prontos (data-only)

Data: 2026-06-11 · Branch: `feat/skills-engine`

Popula o catálogo (`design/skills/CATALOGO.md`) com as skills que são **só DADO**
sobre os executores genéricos já implementados (`projectileTarget`,
`lineThrough`, `meleeTarget` + status `bleed`, `selfRadius`). NENHUM executor
novo escrito. Skills que exigem mecânica inexistente ficaram **✏️ pendentes**
(lista abaixo). Números 100% placeholder `// ✏️ balancista` (régua = briefing
`2026-06-11-briefing-balancista-skills.md`).

## Skills adicionadas (7)

| id | nome | classe | targeting | dano | nota / banda |
|---|---|---|---|---|---|
| `arcane_dart` | Dardo Arcano | mage | projectileTarget | arcane | single barato, sem status — banda ① (pré-Bola) |
| `bolt` | Raio | mage | lineThrough | lightning | feixe instantâneo, sem status (spec: linha já cobre, sem primitivo novo) — banda ③ |
| `throw` | Arremesso | null (universal) | projectileTarget | physical | projétil físico fraco (pull/finisher) — banda ① |
| `piercing_shot` | Disparo Perfurante | rogue | projectileTarget | physical | single-target ranged (caminho do arco) — banda ③ |
| `rend` | Retalho | rogue | meleeTarget | physical | **+ bleed** (DoT físico declarativo) — banda ③ |
| `steelstorm` | Vendaval de Aço | rogue | selfRadius | physical | AoE pack-answer @~lvl 20; escala a ARMA (ledger) — banda ④ |
| `burst_of_light` | Explosão de Luz | priest | selfRadius | holy | nova sagrada anti-pack @~lvl 20; usa o anti-profano do `holyDamage` já no executor — banda ④ |

Notas de montagem:
- **Raio** confirma a decisão do spec (linha 81): `lineThrough` instantâneo sem
  status — nenhum primitivo novo, só uma entrada de dados (≠ Lança de Gelo, que
  carrega slow).
- **Retalho** é o primeiro consumidor real do status `bleed` (DoT físico): o
  executor já tinha o case `bleed` em `applySkillStatus`, faltava uma skill que o
  declarasse. Parâmetros do DoT vêm do dado (`RETALHO.bleed`), não hardcoded.
- **Disparo Perfurante** é `projectileTarget` (single), conforme CATALOGO ("tiro
  single-target à distância") — NÃO `lineThrough` (apesar do nome "perfurante").
- **Explosão de Luz** reusa a lógica anti-profano/penalidade-fora-do-nicho que o
  `computeDamage` já aplica a qualquer skill `damageType: "holy"` (cheio vs
  undead/demon, reduzido vs resto). Sem `unholyMultiplier` próprio (só Luz
  Sagrada tem o bônus calibrado); herda a penalidade `HOLY_NONUNDEAD_MULT`.
- Tags novas em `types.ts`: `arcano`, `distancia`, `sangramento`.

## Skills ✏️ PENDENTES (mecânica faltante — sem executor)

Cada uma precisa de um primitivo que ainda não existe na sim. Mapeadas no spec
P1 (`2026-06-11-spec-targetings-novos.md` §P1). NÃO entram como dados até o
primitivo existir.

| Skill (CATALOGO) | Mecânica faltante | Primitivo (spec P1) |
|---|---|---|
| Lume | emitir luz ao redor (estado de luz na entidade + render) | — (utilidade/exploração) |
| Dash / Disparada · Blink / Piscar · Charge / Investida | mobilidade (deslocar/teleportar o caster) | "Dash/mobilidade" |
| First Aid / Primeiros Socorros | cura canalizada SEM mana, cancela ao tomar hit | canal não-mágico (variação de cast-time c/ cura) |
| War Cry / Grito de Guerra | taunt (força `targetId` dos mobs no raio) | "Taunt" (IA de mob) |
| Bulwark / Baluarte · Arcane Barrier / Barreira Arcana · Holy Shield / Escudo Sagrado · Blessing / Bênção · Poison Blade / Lâmina Envenenada | buff/shield em self/aliado (absorb / dmgReduction / regen / on-hit) | `effect: "buff"` (novo EffectKind + estado de buff na entidade) |
| Conjure Arrow / Conjurar Flechas | gera item temporário no inventário | "Conjurar item" |
| Stealth / Furtividade | estado de stealth (invisibilidade + abertura de backstab) | — (utilidade/mobilidade) |
| Wall / Muralha | cria tile bloqueante temporário (interage com pathfinding) | "Obstáculo" |
| Blizzard / Nevasca · Consecrate / Consagrar | zona persistente no chão (tica efeito em quem está dentro) | `groundZone` |
| Flame Wave / Onda de Chamas | cone (leque na direção do facing) | `cone` (ou aproximar por `groundTarget` à frente) |
| Purify / Purificar | cleanse (remove veneno/debuffs do alvo) | remoção seletiva de status |
| Fists of Faith / Punhos da Fé | melee desarmado sagrado (porta do Caminho Monge) | depende do sistema de Caminhos/desarmado |

> Já existiam (não re-adicionadas): Golpe Forte, Bola de Fogo, Lança de Gelo,
> Apunhalar, Luz Sagrada, Curar Ferimentos (= **Heal/Cura**), Garras da Terra,
> Tempestade, Redemoinho, Aura Sagrada, Fagulhas, Dreno Vital.

## Refactor de status (item 2 do briefing) — JÁ ESTAVA FEITO

A seção "Smell" do spec pede tornar os params de status DECLARATIVOS por skill,
para `applySkillStatus` lê-los da skill em vez de hardcoded
(`BOLA_DE_FOGO.burn`, `LANCA_DE_GELO.slow`). **Esse refactor já tinha sido
aplicado pela leva de executores** (`2026-06-11-skills-executors.md` /
fundação): `applySkillStatus` (executor.ts L104) lê `def.applyStatus` — a union
discriminada `SkillStatusApply` que cada `SkillDef` carrega (burn/bleed/poison/
slow/root, cada um com seus próprios `damagePerTick`/`durationMs`/`intervalMs`/
`stepMsMultiplier`). Bola de Fogo, Lança de Gelo e Garras da Terra já declaram
seus params no dado em `definitions.ts`.

Verificação: `grep` por `BOLA_DE_FOGO`/`LANCA_DE_GELO`/`.burn`/`.slow` em
`executor.ts` retorna SÓ a referência na docstring de `applySkillStatus` — zero
leitura hardcoded de params de status. As únicas constantes de `numbers.ts` ainda
lidas no executor são MULTIPLICADORES DE DANO (`GOLPE_FORTE.weaponMultiplier`,
`APUNHALAR.backstabMultiplier`, `LUZ_SAGRADA.unholyMultiplier`) — não params de
status, e inerentes à fórmula de dano daquelas skills, não ao smell.

**Conclusão:** nada a refatorar — Retalho (bleed) já entra no caminho 100%
declarativo, provando que o motor escala pra N skills com status sem tocar o
executor.

## Resultado

- `npx tsc --noEmit`: **limpo (exit 0)**.
- Skills no jogo: 12 → **19**.
- Todos os números novos: placeholder `// ✏️ balancista`.
