# Bateria T2 — skills vs Esqueleto (lvl 1 + on-level)

**Data:** 2026-06-09 · **Balancista** · backlog #6 (diferenciação de skill, destravada pelo
Esqueleto T2). Harness descartável (esbuild+node, sim headless). Dois passes:
- **Pass 1 (lvl 1):** atributos-base — calibra o *relativo* (qual skill faz o quê) e o estrutural.
- **Pass 2 (on-level, lvl 10):** harness levela o bot farmando rato (XP turbinado SÓ no teste),
  distribui pontos na build da classe (~2:1 primário:Vit/Int), remove os ratos e mede vs Esqueleto.

## Resultado on-level (lvl 10), 1 Esqueleto — APÓS calibração

| Rotação | TTK | HP perdido | nota |
|---|---|---|---|
| knight auto+Golpe Forte | 3,9s | 45 | fight real (era 0,1s/one-shot com HP 48) |
| rogue auto+Apunhalar | 1,3s | 52 | o mais rápido single-target (barato/spammável) |
| mage auto+Bola de Fogo | 3,0s | 49 | burn contribui |
| mage auto+Lança de Gelo | 4,0s | 57 | mais lento, aplica slow (controle) |
| priest auto+Luz Sagrada | 2,1s | 50 | 2 casts vs undead — forte, **não** one-shot |
| **mage auto-only (cajado)** | **>60s** | **176** | 🔴 wand quebrada (não escala Int) |

## Mudanças aplicadas (verificadas na sim)

1. **`LUZ_SAGRADA.unholyMultiplier` 2,5 → 1,8** (`skills/numbers.ts`). Com 2,5 a Luz one-shotava
   o Esqueleto (a família-coração) já no lvl 1 → trivializava o farm do Priest. 1,8 = kill em
   ~2 casts: segue disparado o melhor anti-profano, sem botão-de-deletar. (DESIGN-BESTIARIO:
   "forte sem trivializar a família-coração".)
2. **Esqueleto `maxHp` 48 → 95** (`bestiary.ts`). On-level (lvl 10), 48 era ONE-SHOTADO por melee
   (knight GF 41+auto=64) e pela Luz Sagrada → trivial num mob de lvl 8-15. 95 dá "contagem de
   golpes" real (melee ~2-4s, caster ~3-4 casts) sem virar esponja. (48 foi útil no lvl 1 pra
   DESTRAVAR a diferenciação; agora cumpriu o papel.)
3. **Esqueleto `xp` 45 → 80** (`bestiary.ts`). Kill ~2× mais longo → XP sobe junto pra segurar o
   XP/h. ✏️ re-régua exata na bateria de farm T2 (XP/hora medido).

## Achado #1 — wand de caster QUEBRADA (estrutural, prioritário)

Mago/Priest **sem mana** são inúteis: cajado/cetro dão dano FIXO (~3) que **não escala com
Inteligência**. On-level: mage auto-only leva **>60s e perde 176 HP** pra matar 1 Esqueleto. É o
buraco mais feio do combate de caster.

**Modelo correto (criador, 09/jun — Tibia): a wand NÃO escala com atributo.** O cajado/cetro tem
dano PRÓPRIO (uma faixa por wand, ex. 3-6 / 7-8), e quem escala com Int são as MAGIAS. A
progressão do "tiro básico" do mago vem de **comprar wands melhores** (gear), como o guerreiro
troca de arma.

**Dois bugs no estado atual:**
- (a) cajado faz **3 fixo** — baixo demais para uma wand inicial (régua do balancer: ~T1 na faixa
  3-6, ~T2 7-8 ✏️).
- (b) o auto da wand hoje passa por `physicalDamage` → **soma Força** (errado: mago tem STR baixa,
  e mesmo se tivesse não deveria contar). A wand deve usar o **dano próprio dela, sem somar atributo**.

**Fix (código — adiar até a sim liberar do Agente 1):** auto-attack de arma mágica usa o dano da
wand direto (flat), não `physicalDamage`. Toca `Simulation.recomputePlayerDerived` + leitura do
template. ✏️ ABERTO: a faixa rola aleatório por hit (Tibia) ou é fixa por wand? — interage com a
decisão "sem variância invisível no combate core" (melee hoje é dano único fixo). Criador decide.

## Flags (NÃO mexer ainda — não é número)

- **Knight lento na matilha** (3 Esqueletos: 15,3s, perde 244/273 HP — quase morre). NÃO é bug de
  número: é **lacuna de conteúdo** — o Knight não tem AoE ainda. O design já prevê **Redemoinho**
  (T2, AoE) exatamente pra packs. Buffar o single-target do Knight pra compensar AoE faltante seria
  errado. Resolver com a skill, não com o coeficiente.
- **Apunhalar (Rogue) quente**: 1,3s single (≈3× o Knight), barato (5 mana) e cooldown curto (1s).
  É a fantasia do Rogue (lâmina rápida), mas vigiar — possível +cooldown quando a comparação for
  justa (com Redemoinho existindo).
- **Casters frágeis em matilha** (>60s/quase-morte vs 3 on-level): direcional — o harness não kita
  nem foge, então superestima o perigo; mas confirma "glass cannon + matilha = morte real" (ok).

## Próximos passos

1. **Codar o fix da wand** (achado #1) assim que a sim liberar — é o maior buraco do caster.
2. **Implementar Redemoinho** (AoE do Knight) — destrava o teste justo de pack.
3. **Bateria de farm T2** (XP/hora real) pra cravar o XP do Esqueleto.
4. Coeficientes de combate (`STRENGTH_/INTELLIGENCE_DAMAGE_FACTOR`) ficaram OK no single-target
   (spread knight 3,9 / mage 3,0 / rogue 1,3 / priest 2,1) — não mexer reativamente; re-checar no T3.
