# Bateria — Mobs da Alvorada (4 espécies novas) + Respawn por-spot

**Data:** 2026-06-10 · **Skill:** Balancista · **Harness:** descartável (esbuild+node, sim headless, `/tmp/bat-mobs.ts`, `/tmp/bat-respawn.ts`).
**Atacante de referência:** knight lvl 1, espada curta, 114 HP (mesma régua das baterias anteriores). Combate medido FORA da safe zone (player não ataca de dentro dela; IA é cega lá).

Duas camadas (pedido do criador): **(1) por-espécie** (TTK/TTL/XP) e **(2) por-respawn** (cada spot com seu próprio respawn → teto de exp/h).

---

## Camada 1 — Por-espécie

### TTK 1v1 (segundos p/ matar) + HP perdido

| Espécie | Tier | HP | TTK (s) | HP perdido / 114 | xp | xp/s |
|---|---|---|---|---|---|---|
| rato_lanhoso (âncora) | T1 | 24 | 1,90 | 11 | 15 | 7,9 |
| morcego_sanguessuga | T1 | 16 | 1,90 | 7 | 12 | 6,3 |
| goblin_batedor | T1 | 32 | 3,80 | 17 | **22** | 5,8 |
| lobo_cinzento | **T1** | **40** | 3,80 | 23 | 32 | 8,4 |
| javali_de_presas | T2 | 80 | 9,50 | 61 | 60 | 6,3 |
| esqueleto (âncora) | T2 | 95 | 11,40 | 50 | 80 | 7,0 |

TTK escala linear e limpa com HP (sem breakpoint estranho). xp/s razoavelmente plano (5,8–8,4) → **nenhum spot vira farm degenerado** (Sirlin ✓).

### TTL passivo (player NÃO reage — "matilha pune")

| Espécie | 2 mobs (s) | 3 mobs (s) |
|---|---|---|
| rato_lanhoso | 16,0 | 9,6 |
| morcego_sanguessuga | 21,0 | 12,6 |
| goblin_batedor | 14,4 | 9,0 |
| **lobo_cinzento** | **10,2** | **6,8** |

Ignorar 2+ mobs = morte real (10–21s mesmo no knight de 114 HP, o mais tanque; classes squishy morrem em ~metade). **Lobo é a matilha mais letal de todos os T1** — 2 lobos matam 1,5× mais rápido que 2 ratos. "A alcateia é a skill" confirmado empíricamente.

### Decisões aplicadas em `bestiary.ts`

- **lobo_cinzento: T2 → T1, HP 46 → 40.** Reconciliação data-informada (GRID dizia Toca=T1, seed botou T2, FAMILIAS diz T1–T2). `tier` alimenta `creatureLevelForTier` (T1→nível 1, T2→nível 8) e o anti-farm de XP (`xpFromKill`, falloff a partir de +5 níveis). Como T1, o lobo dá **XP cheia até ~lvl 6–7 e depois expira** (você gradua da Toca) — coerente com mob de entrada met no lvl 3–5. Como T2 renderia até lvl 13, cedo demais. **A dificuldade do lobo vem da matilha, não do HP solo** → HP 40 (T1-topo, TTK 3,8s) + a TTL de matilha mais letal entregam o "feel T2" sem o tier.
- **goblin_batedor: xp 20 → 22.** Paridade de xp/s no ladder (estava em 5,3, o mais baixo).
- **morcego (16/5/12) e javali (80/16/60): mantidos** — bem proporcionados (o SEED se segurou). Javali = bruiser T2 que pune (dmg 16, o maior; mata 61/114 HP só pra você matar UM).

> Régua de nível-alvo: T1 met lvl 1–4, lobo (T1-topo) lvl 3–6, T2 (javali) lvl 5–8. Medições no knight lvl1 = "o que o novato sente ao topar cada um" (T2 é assustador de propósito a lvl 1).

---

## Camada 2 — Por-respawn (o teto de exp/h por-spot)

### Feature implementada: `MapMonster.respawnMs` (override por-spot)

Antes, `respawnMs` era só por-ESPÉCIE (`bestiary.ts`) → impossível afinar o teto zona-a-zona. Agora cada ponto de spawn (`MapMonster`) pode trazer seu próprio `respawnMs`, que sobrepõe o do template. **7 pontos tocados:** `MapMonster` (+ campo), `SimEntity` (+ campo), `spawnMonster` (+ param), `spawnInitialMonsters` (overworld + andares passam o override), `PendingRespawn` (+ campo, carrega pro mob renascido), o push de morte (`e.respawnMs ?? template.respawnMs`) e o processamento de respawn.
**Verificado** (`/tmp/bat-respawn.ts`): mesmo rato (template 10s) respawna em **3s** com override 3000ms, e em **10s** sem override. ✓

### O modelo (decidido, `EXPLORACAO.md`): respawn-timer É o teto de exp/h

```
teto_exp/h_da_zona = nº_pontos × (3600 / respawn_seg) × xp_mob
```

Quando o TTK do jogador é rápido o bastante pra limpar mais rápido que o respawn, ele bate nesse teto (matar mais rápido não rende mais → espera). Um jogador **on-level** fica abaixo do teto (TTK-limited, sempre ocupado, downtime ~0 = bom feel); um **over-leveled** bate no teto e rende pouco ("esse spot acabou pra você, segue"). Refil infinito removeria o teto e degeneraria o farm → por isso **não existe spawn que nunca acaba** (modelo Tibia).

### Recomendação de respawn POR PADRÃO (ponto de partida ✏️)

| Padrão | nº pontos típico | respawn/ponto sugerido | Intenção |
|---|---|---|---|
| **Sentinela** | 1 | **60–90s** | sinal, NÃO farm — teto miúdo de propósito (1 goblin @60s = ~1.300 xp/h, não-farmável) |
| **Bando** | 2–4 | **20–30s** | farm de superfície modesto |
| **Pool** | 6–10 | **25–40s** | a caçada dedicada — teto alto o bastante pra on-level não bater nele |

**Exemplo trabalhado — Pool do Acampamento Goblin (S5, ~8 pontos, xp 22):**
- respawn 45s → teto = 8 × 80 × 22 = **14.080 xp/h**
- respawn 30s → teto = 8 × 120 × 22 = **21.120 xp/h**
- respawn 20s → teto = 8 × 180 × 22 = **31.680 xp/h**

→ recomendo **respawn ~30–45s** no Pool de goblin pra o teto ficar acima do clear-rate on-level (mantém o caçador ocupado) sem premiar o over-leveled.

> ⚠️ **O que falta pra fechar os números exatos:** o teto acima é o LIMITE; o **exp/h realizado** (com caminhada entre pontos + regen/descanso) precisa do **farm-loop sim**, que depende da **COMIDA na sim** (regen é food-gated — trabalho do agente de comida, em paralelo). Isso é a próxima bateria (backlog item 7: "recalibrar XP/h quando a comida entrar"). Sem ela, os respawns acima são modelo, não final. E o **recast da Alvorada pra vila** (paliçada, ~30–40 tiles) vai mover os spots → afinar respawn por-spot só depois do re-layout assentar.

---

## Arquivos tocados

- `src/sim/bestiary.ts` — lobo (T1/hp40), goblin (xp22), com notas da bateria.
- `src/shared/types.ts` — `MapMonster.respawnMs?`.
- `src/sim/entity.ts` — `SimEntity.respawnMs?`.
- `src/sim/Simulation.ts` — `spawnMonster` param, `spawnInitialMonsters`, `PendingRespawn`, push de morte, processamento de respawn.
- `tsc --noEmit` limpo.

## Pendências ✏️

- [ ] **Farm-loop sim (exp/h realizado)** — espera comida na sim; fecha os respawns por-spot reais.
- [ ] **Respawn por-spot final** — espera o re-layout da vila; aplicar os valores por padrão no `alvorada.ts`.
- [ ] **morcego/javali** — mantidos sem mudança; re-checar na bateria de farm T2.
- [ ] **pack-AI do lobo** (coesão de matilha) — wave futura (hoje é `chaser` simples; a TTL já mostra a letalidade da matilha mesmo sem coesão).
- [ ] **TTL por classe** — medido só no knight (mais tanque); squishy morre mais rápido, validar quando a seleção de classe entrar no fluxo.

---

## ADENDO (mesma sessão) — Recast do Esqueleto T2 → T1

O criador apontou que o esqueleto estava "muito mais forte que os outros" e decidiu o recast da **família undead**: o **esqueleto é o undead de ENTRADA (T1)**, e o **ghoul** é o próximo degrau (T2). (As tabelas acima refletem o esqueleto AINDA T2/hp95 — estado da medição; o recast veio depois, nesta sessão.)

**Por que fazia sentido:** o esqueleto-T2 (hp95) era o mob mais tanque + mais XP do set, distorcendo o ladder. Medido ao longo da progressão, o esqueleto era 1,2–1,5× mais tanque que o **javali** (T2 real), o que contrariava a intuição (o javali, bruiser de presas, é que deveria ser o T2 forte). Recast resolve: esqueleto desce pro ladder T1, javali vira o T2 mais forte do set aceso.

**Aplicado em `bestiary.ts`:** esqueleto **T2→T1**, hp 95→28, dmg 12→8, xp 80→17 (passo 300 mantido = undead arrastado/kitável, a identidade). Re-medido (knight lvl1): **TTK 1,9s**, assenta entre rato (24hp) e goblin (32hp). Ladder T1 final por HP: morcego 16 · rato 24 · esqueleto 28 · goblin 32 · lobo 40. Único T2 aceso: **javali 80 (TTK 9,5s) = o mais forte**, como esperado.

**Canon atualizado:** `FAMILIAS.md §7` (família "T2–T4"→"T1–T4"; esqueleto T1; ghoul T2).

**Ripples ✏️ (criador/designer, fatia ② Charneca):**
- O papel de **dummy T2 on-level (lvl 10)** que o esqueleto-T2/hp95 cumpria na bateria de diferenciação de classe (08/jun) **migra p/ outro mob** — os achados de mecânica daquela bateria seguem, mas o boneco T2 precisa de substituto.
- **Ghoul T2 vs T3** + posição do **Zumbi Pútrido** (T2–T3) na escada undead — fechar na **bateria da família undead** (fatia ②), junto dos números de ghoul/zumbi/espectro e da matriz resist/fraqueza.
- Esqueleto T1 hp30/dmg9/xp18 é **provisório** até essa bateria.

---

## ADENDO 2 (mesma sessão) — Alargamento do T1 (progressão DENTRO do tier)

O criador apontou: **o intervalo entre os T1 estava pequeno demais** e **faltava diferença de DANO pra haver progressão dentro do T1** (esqueleto e goblin tinham dano idêntico = 8; faixa de dano só 5–10).

**Diagnóstico:** o TTK é quantizado pelo dano do player (~14/golpe), então HP entre 16–40 quase não muda a contagem de golpes → "tempo pra matar" não progride dentro do T1. **O dano que o MOB faz em VOCÊ** é o eixo de progressão que se SENTE (contínuo). Logo, a diferenciação intra-T1 tem que vir do dano do mob (+ HP secundário).

**Aplicado (rato fixo = anchor):**

| mob | hp (antes→agora) | dmg (antes→agora) | xp | TTK | HP perdido (knight) |
|---|---|---|---|---|---|
| morcego | 16 | 5 | 12 | 1,9s | 7 |
| rato (anchor) | 24 | 7 | 15 | 1,9s | 11 |
| esqueleto | 28→**30** | 8→**9** | 18 | 3,8s | 11 |
| goblin | 32→**38** | 8→**11** | 24 | 3,8s | **26** |
| lobo | 40→**48** | 10→**14** | 36 | 5,7s | **45** |
| javali (T2) | 80 | 16 | — | 9,5s | 61 |

**Resultado:** dano sobe limpo **5·7·9·11·14** (sem empate, faixa 2,8×); HP 16→48 (3×). A progressão agora SE SENTE — HP-perdido por kill 7→11→26→45 (lobo custa ~6× o morcego). TTK ganha 3 degraus (1,9/3,8/5,7s). Matilha de lobo ficou letal (2 passivos matam em 6,8s, era 10,2s) e o lobo (dmg14) faz ponte suave pro javali T2 (dmg16). Régua de progressão intra-tier estabelecida: **dano do mob é o eixo, +2/+3 por degrau.**
