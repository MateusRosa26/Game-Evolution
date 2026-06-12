# Fila do Motor Emergente — handoff entre os 2 chats

> **Workflow de 2 chats (decidido jun/2026):**
> - **Chat A — Motor & Conteúdo** (*dono ÚNICO do código da sim*): implementa
>   primitivos novos, adiciona/edita `EffectSpec` nas definições, roda o motor.
>   É o **único** que escreve em `src/sim/` (regra do projeto: sim é sequencial,
>   não paraleliza em worktrees).
> - **Chat B — Refino & Design**: afina os já-criados, ajusta números, e às vezes
>   **modifica o efeito**. NÃO escreve na sim — produz **itens de fila** aqui, que
>   o Chat A consome. Pode editar docs/catálogo livremente.
>
> Ciclo infinito: B desenha/refina o lote N+1 enquanto A implementa+testa o lote N.
>
> **Estado do motor (base):** framework `EffectSpec` + `activeEffects`/cache +
> hooks **P1 damageMult · P2 onKill · P3 blockFull · P4 crit · P8 grantSkills**
> IMPLEMENTADOS e testados (smoke 12/12). Ver `2026-06-11-catalogo-emergente-lote1-engine.md`.

## Formato de um item da fila

```
### [ID] Título — TIPO
- Tipo: novo-primitivo | modifica-primitivo | nova-ficha | afina-numero
- Alvo: (qual primitivo/ficha/arquivo)
- Mudança: (o EffectSpec ou número, declarativo — pronto p/ A colar)
- Motivo: (1 linha)
- Status: FILA | EM-ANDAMENTO (A) | FEITO
```

A consome de cima pra baixo; marca `FEITO` e move pro histórico no fim.

---

## FILA (a fazer — populada por B / seed inicial)

### [Q1] P7 skillSwap — ligar Mutação ao executor — novo-primitivo
- Tipo: novo-primitivo
- Alvo: `executor.ts` (resolve a skill EFETIVA) + `activeEffects`
- Mudança: ao resolver um cast, se a entidade tem efeito `{kind:"skillSwap", mutatedSkillId}` para aquela skill base, resolve com a def mutada. Requer as DEFS de skill mutada existirem (conteúdo).
- Motivo: destrava as Mutações (Lote 1 ⑨⑩⑪ + **Lote 2**). **Bloqueado por: (a) merge da
  `feat/skills-engine` — decisão do criador — e (b) as defs mutadas.**
- **DEPENDÊNCIA mapeada:** `docs/reports/2026-06-11-catalogo-emergente-lote2-mutacoes.md`
  §6 (harvest) — P7 precisa de selfRadius/dash/shield (skills-engine) + 4 status novos
  declarativos (`root`/`armorShred`/`bleed`/`regenHoT`). Zero sensor novo (✓ §7).
- Status: FILA (aguarda merge + revisão do B)

### [Q6] Lote 2 (Mutações) — AGUARDA revisão de SIGNIFICADO do Chat B — nova-ficha
- Tipo: nova-ficha (design pronto pelo Chat A)
- Alvo: `docs/reports/2026-06-11-catalogo-emergente-lote2-mutacoes.md` (10 mutações p/
  Golpe Forte / Lança de Gelo / Apunhalar / Luz Sagrada / Curar Ferimentos)
- Mudança: **Chat B revisa o significado** (identidade, verbo↔fantasia, anti-treadmill,
  flavor EN/PT) quando fechar o Lote 1. Mudanças de efeito → voltam pra esta fila.
- Status: **REVISADO pelo B (§8 do catálogo Lote 2)** — 9/10 aprovadas; efeito muda só em [B10] Fôlego. Pendências de DECISÃO do criador: reconciliar nomes c/ CATALOGO.md + confirmar Passo Sombrio. Falta: implementar (P7/merge skills-engine + 4 status novos).

### [Q7] Lote 3 (Mutações, 2ª leva) — AGUARDA revisão do Chat B — nova-ficha
- Tipo: nova-ficha (design pronto pelo Chat A)
- Alvo: `docs/reports/2026-06-11-catalogo-emergente-lote3-mutacoes.md` (10 mutações p/
  Investida / Retalho / Raio / Fagulhas / Bênção)
- Mudança: revisão de significado pelo Chat B. **Harvest §6** lista os primitivos novos
  (custo crescente; `knockback` da Aríete é o mais caro, possivelmente adiado).
- Status: FILA (handoff p/ B)

### [S1] SENSOR — skills sem alvo não mutam (decisão do criador) — sensor
- Tipo: decisão de sensor/convenção (NÃO é motor de efeito)
- Alvo: convenção de emissão de `skill_use` (hoje só com `targetsHit>0`).
- Achado (Lote 3 §7): skills puramente utilitárias/mobilidade SEM alvo (Dash, Lume,
  Muralha) nunca emitem `skill_use` → não têm perfil → **não podem mutar**. Opções:
  (a) não mutam (aceitável) · (b) emitir cast-sem-alvo (`targetsHit:0`+`castResolved`)
  abrindo perfis tipo "N dashes através de inimigos". **Recomendação: (a) por ora.**
- Status: FILA (decisão ✏️ criador)

### [Q4] P9 derivedMod — corpo do Monge — novo-primitivo
- Tipo: novo-primitivo
- Alvo: `recomputePlayerDerived`/`formulas.ts`
- Mudança: `{kind:"derivedMod", stat:"unarmedDamage", params}` reescreve a fórmula de dano desarmado. Desenhar JUNTO com as skills marciais que o Monge destrava (P8 já pronto).
- Motivo: Classe escondida ⑫ (o teto). Depende do design das skills marciais.
- Status: FILA

### [Q5] Fichas reais dos Caminhos do Lote 1 — nova-ficha
- Tipo: nova-ficha
- Alvo: `tracking/definitions.ts` (hoje DUMMY com thresholds de teste)
- Mudança: criar as fichas ①②④⑤⑦⑧ com gatilho+spec reais (specs já desenhadas no catálogo §1). Thresholds ✏️ Balancista; flavor ✏️ Loremaster.
- Motivo: hoje só ① Roedor/③ Exagero têm spec ligada; faltam as outras do Lote 1.
- Status: **FEITO (A) — ①②③④⑤⑥⑦** reescritas como fichas REAIS em `definitions.ts` (DUMMY Roedor/Chama-Viva/Naturalista/Punho-Bruto saíram; mutações Eclosão/Meteoro ficam DUMMY p/ P7). Flavor do §6; números do Chat C em ①(15000/1.12) ②(2000/1.20) ④(30000/0.12), ✏️ nos demais. **2 enablers feitos junto:** (a) ④ = Marca de ESCUDO — engine.onBlock agora usa `equippedShieldInstanceId` (não a arma); (b) ⑥ = `combat_end` ganhou `physicalDamageDealt` + fato `magicOnlyVictory` (vitória só-magia). tsc 0 + build 0 + smoke de fiação 5/5 (activeEffects devolve os specs). ⚠️ números do Chat C **aguardam OK do criador**. ⑨⑩⑪⑫ pendentes (P7/Monge).
- **Nota da revisão Chat B (§6 do catálogo):** flavor/nomes/hints finalizados em §6 — usar de lá. Correções a embutir nas fichas reais: **①** usa `victim.family==undead` (DUMMY testa `bestial`); **⑨⑩⑪** têm **hint POR PERFIL distinto** (o DUMMY compartilha — errado por design: ⑨="latejam perto da pele" / ⑩="anseia pelo horizonte"); **⑥** = *Intocado* (não Intocável; alinhar comentários `events.ts`/`engine.ts`); **④** = Marca de escudo/acúmulo (NÃO conduta); **⑫** conduta com escopo `sinceClass` e SEM class-lock duro (auto-gateia ao Priest via Esp).
- **NÚMEROS CALIBRADOS — Chat C (bateria `2026-06-11-bateria-marcas-lote1-tipo1.md`):** tipo-1 (①②④) com número final, prontos pra colar na ficha real (4 valores ✏️ aguardam OK do criador — faixas no report):
  - **① Quebra-Ossos:** `threshold: 15000` · spec `{kind:"damageMult", mult:1.12, when:[{field:"target.family",op:"==",value:"undead"}, {field:"viaWeapon",op:"==",value:true}]}` (≈35 h; `viaWeapon` ver [C1] — não buffa magia).
  - **② Última Resposta:** `threshold: 2000` (golpe final com `attackerHpPct<0.10`) · spec `{kind:"damageMult", mult:1.12, when:[{field:"attackerHpPct",op:"<",value:0.25}, {field:"viaWeapon",op:"==",value:true}]}` (mult 1.20→1.15→**1.12 = paridade c/ ①**, decisão criador: clutch vem da CONDIÇÃO não do número; multiplicador não escala c/ força do mob; `viaWeapon` ver [C1]). **⚠️ NÃO usar ~10k** — gatilho raro (~8–11% dos kills mesmo em pack imprudente, 0% em farm saudável) → 10k = ~250 h inalcançável; 2k dá ~40–50 h, alinhado em TEMPO às outras.
  - **④ Inabalável:** `threshold: 30000` bloqueios (NÃO 50k — ~62 h destoa ~1,6× e arrisca passar da vida útil do escudo) · spec `{kind:"blockFull", chance:0.12}`.
  - Re-pin proporcional (mesma régua de tempo) quando comida real / escudo T2 / undead T3 entrarem.

### [C1] Marca de arma (damageMult) só no dano de ORIGEM-ARMA (não em magia) — modifica-primitivo
- Tipo: modifica-primitivo (escopo do `when` de P1 damageMult p/ Marcas de arma) — **origem: Chat C / criador (jun/2026)**
- Alvo: `combat.applyDamage` (facts de `evalOutgoing`, hoje em `combat.ts:88`) + `when` das Marcas ①② em `definitions.ts`.
- Mudança: os `facts` de `evalOutgoing` NÃO carregam se o dano veio de AUTO-ATTACK ou de SKILL. `applyDamage` já recebe `weapon` e `skillId` (params) → expor fato, ex `viaWeapon: (weapon != null && skillId == null)` (= só auto-attack). Marcas de arma de DANO (①②③) ganham `{field:"viaWeapon",op:"==",value:true}` no `when` → o bônus NÃO vaza pra Bola de Fogo/Luz Sagrada.
- Nuance (decisão à parte): skills MELEE que usam a arma (Golpe Forte/Apunhalar escalam a arma) — SEGURO = só AA (`skillId==null`, recomendado pelo criador); expandir p/ weapon-skills depois se quiser (precisaria de um discriminador "skill usou arma" em vez de `skillId==null`).
- Motivo: coerência de eixo (Marca de arma = só golpe da arma, não magia) + segurança de balance (não combina com burst de skill). **Decisão criador jun/2026.**
- Status: FILA (Chat A — engine; depois Chat C confirma que nada vazou)

> **Vindos da revisão Chat B (§6 do catálogo Lote 1).** Só os itens que TOCAM O EFEITO
> entram aqui; renames/rótulos/flavor já foram editados no catálogo direto.

### [B1] ③ Transbordo (ex-Exagero) — forma do respingo + `damageType` — modifica-primitivo
- Tipo: modifica-primitivo
- Alvo: `EffectSpec` `onKill` (campo de forma) + `effects.ts` `collectOnKill`/`OnKillAreaAction` + aplicação do dano de área na Simulation; spec de `MARK_EXAGERO` em `definitions.ts`.
- Mudança (DECISÃO CRIADOR jun/2026):
  1. **Forma do respingo NÃO é mais raio-1 cheio (8 tiles).** Adicionar forma à `onKill`: **`lateral`** (os 2 tiles perpendiculares ao vetor algoz→vítima — cleave que atravessa, PREFERIDA) ou **`cross`** (N-S-E-W, 4 tiles, fallback que não precisa de direção). `lateral` exige o vetor do golpe (posições já em `finalBlow`/kill facts); `cross` não. Trocar `radius:1` por `shape:"lateral"|"cross"`.
  2. **`damageType` do respingo:** hoje undefined. Definir — **tipo do golpe fatal** (propagar `facts["damageType"]`) ou `physical` fixo.
- Motivo: raio-1 cheio é forte demais E incoerente (explosão ≠ transbordar). Cleave lateral = cirúrgico + coerente. Fração do overkill segue ✏️ Balancista (NÃO fixar "metade").
- Status: **FEITO (A)** — `onKill.radius`→`shape:"lateral"|"cross"` + `areaShapeTiles()` + `dealAreaDamage` por tiles; def renomeada *Transbordo* (`shape:"lateral"`, damageType propaga o golpe fatal). Smoke 8/8. ✏️ scale/threshold Balancista.

### [B5] ⑤ Sombra Sem Nome — primitivo de redução de dano RECEBIDO (mitigação de abertura) — novo-primitivo
- Tipo: novo-primitivo
- Alvo: `applyDamage` (ramo do player como ALVO) + `EffectSpec` + `CombatSession` (flag novo).
- Mudança (DECISÃO CRIADOR jun/2026 — SUBSTITUI o efeito antigo de ⑤, que era `crit` P4):
  1. Novo `EffectSpec` de **redução de dano RECEBIDO** (ex.: `{kind:"incomingMult", mult, when?}`) — hoje TODOS os efeitos são de SAÍDA; este é o 1º de entrada. Aplicado quando o player é o alvo em `applyDamage`.
  2. Novo flag na `CombatSession`: **"1º hit recebido desta sessão"** (análogo ao `dealtDamageThisSession` que já existe p/ o P4). O `when` da redução casa esse flag → só a abertura contra o player é reduzida.
  3. ⑤ deixa de usar `crit`/P4 (P4 permanece no motor p/ outro conteúdo — ex: Riposte).
- Motivo: crit ×2 garantido = power-spike (fere "emergente=tempero"); mitigação de abertura é tempero defensivo e CASA o eixo do gatilho (vencer sem tomar dano). % ✏️ Balancista; janela `COMBAT_IDLE_MS` (hoje 4s) governa o re-arme — avaliar alongar p/ este Caminho.
- Status: **FEITO (A)** — novo `EffectSpec` `incomingMult` (1º efeito de ENTRADA) + `evalIncoming` + hook no `applyDamage` (ramo do alvo) + flag `tookDamageThisSession` + fato `firstHitReceivedOfCombat`. Smoke 8/8. P4/crit segue no motor p/ outro conteúdo. ✏️ % Balancista; ficha real do ⑤ no Q5.

### [B2] ⑧ O Naturalista — CORTADO (DECISÃO CRIADOR jun/2026) — decisão de conteúdo
- Tipo: decisão de conteúdo (NÃO mexer no motor)
- Alvo: `tracking/definitions.ts` (`PATH_NATURALISTA` é DUMMY).
- Decisão: **CORTAR o trait.** O criador confirmou "corta". O primitivo `distinct` **PERMANECE** no motor (serve Explorador = N regiões / Polímata = N skills, muito melhores). Só não existe mais a ficha "Naturalista" de dano.
- Ação Chat A: remover/não-criar a ficha real do Naturalista; manter `distinct` e o sample DUMMY pode sair quando as fichas reais entrarem.
- Status: FEITO (decisão) — sem trabalho de engine.

### [B6] ⑥ Intocado — efeito-verbo "a magia se alimenta" (mana on magic-kill) — novo-primitivo
- Tipo: novo-primitivo (ação nova de `onKill`)
- Alvo: `EffectSpec` `onKill` (nova `action`) + `effects.ts` `collectOnKill` + aplicação na Simulation; ficha real em `definitions.ts`.
- Achado: o efeito antigo ("mana regen em combate") é **no-op** — a mana JÁ regenera em combate (`regenTick` todo tick, `Simulation.ts:1072`). E a proposta "regen turbinado + ratio" foi **REJEITADA pelo criador** (regen = número/anti-Koster; ratio = cópia do ⑦).
- Mudança (DECISÃO CRIADOR jun/2026 — CONFIRMADA, mago-puro):
  1. **Efeito (verbo):** ao dar o **golpe final com MAGIA**, devolve **~1-2 de mana** ("a magia se alimenta"). Nova `action:"restoreMana"` no `onKill` (`{kind:"onKill", action:"restoreMana", amount, when:[damageType é mágico]}`) — reusa o hook de onKill (P2), ação nova. Loop condicional, não número passivo. Magnitude 1-2 ✏️ Balancista.
  2. **Condição:** vencer ~N combates causando **só dano mágico** (físico=0 na sessão, via `combat_end` `dmgByElement`/share físico==0 + `endedBy:victory`). Reusa `combat_end` (existe). Distinto do ratio do ⑦ e do "sem tomar dano" do ⑤. **Mago-puro** — Rogue de arco não qualifica (dano físico) e nem se beneficiaria (arco não gasta mana).
  3. Atualizar DESIGN-EVOLUCAO:348 (efeito velho) + comentários "Intocável"→"Intocado".
- **⚠️ BRIEF BALANCISTA (crítico):** mana-on-kill é **sustento de mana** → ataca o freio "caster é mana-bound" que segura o kiting (`bateria-farm-loop.md`). Os 1-2 de mana/kill têm de ficar **MENORES que a mana gasta pra conseguir o kill** (reembolso parcial que suaviza downtime, **nunca** motor net-positive) — senão kiting vira sustentável pra sempre. Rodar o farm-loop de kite com o trait ligado.
- Motivo: efeito velho no-op + condição velha impraticável; nova versão é verbo coerente ("o corpo não suja as mãos — a magia se basta").
- Status: **FEITO (A)** — nova `action:"restoreMana"` no `onKill` + `collectOnKillMana` + aplicação em `source.mp` no ramo fatal de `applyDamage` (facts ganharam `damageType` p/ o `when` filtrar kill mágico). Smoke 4/4 (fire devolve, physical não). ✏️ **Chat C calibra a magnitude (1-2) + farm-loop de kite** (brief acima); ficha real do ⑥ no Q5.

### [B7] ⑦ Senhor dos Extremos — mínimo POR ELEMENTO no gate de ratio — modifica-primitivo
- Tipo: modifica-primitivo (gate `ratio`)
- Alvo: `PathDef` ratio (`types.ts` num/den/minRatio) + avaliação no `engine.ts`.
- Mudança (DECISÃO CRIADOR jun/2026): o gate hoje exige só `(fogo+gelo)/tudo ≥ minRatio` — permite **94% fogo / 1% gelo** e ainda passa. Adicionar **piso por elemento** pra ser "mestre dos DOIS": ex. um `subMin` por numerador (fogo ≥X% E gelo ≥X% do total), ou cap na diferença `|fogo−gelo|`. Capacidade nova no `ratio` (hoje é um numerador só). Números ✏️ Balancista.
- Motivo: sem isso, o Caminho é "quase-mono + tempero", não dual-elemento real. **Nota design:** garantir também que o KIT acessível no nível-alvo tenha dano NÃO-fogo/gelo (senão o ratio é satisfeito por falta de opção — não é compromisso). Choque térmico (burst) → Balancista.
- Status: **FEITO (A)** — `PathDef.subNumerators[]` (piso por componente) + `subNum[]` no estado + checagem no `checkRatioMilestones`. Senhor dos Extremos ligado (fogo≥30% E gelo≥30%, ✏️). Smoke 3/3 (94/1 e 95/5 falham, 50/50 passa).

### [B8] ⑨ Eclosão Ígnea — knockback é o ganho, SEM AoE-dano de área — afina skill-def
- Tipo: modifica-primitivo (na DEF da skill mutada, via [Q1] skillSwap)
- Alvo: skill def mutada de Eclosão Ígnea.
- Mudança (DECISÃO CRIADOR jun/2026): "explosão centrada no caster" **NÃO** deve dar dano em área a todos em volta (fura o gate de AoE-dano ~lvl 20, hub §6). O valor da mutação é o **knockback** (controle/reposição — o caster colado ganha espaço) + a mecânica própria. Dano permanece essencialmente single-target; **no MÁXIMO** aplicar **burn-chip (DoT) em 1–2 adjacentes** — e o Balancista confere se nem isso fica OP.
- Motivo: consistência com o gate de AoE e com o tratamento do ⑪ (espalhar = chip, não deleta-pack). Mutação = condicionador de estilo, não power-spike.
- Status: FILA

### [B3] ⑩ Meteoro Distante — dano-por-distância DOIS-LADOS (anti-upgrade-puro) — afina-primitivo
- Tipo: modifica-primitivo (na DEF da skill mutada, não no motor de efeito)
- Alvo: skill def mutada de Meteoro (criada junto com [Q1]) — param `damageScalesWithDistance`.
- Mudança: dano-por-distância **dois-lados** — **bônus longe + penalidade perto** (ou **range mínimo** abaixo do qual é fraco), pra Meteoro ser **sidegrade/estilo**, não estritamente melhor que a base. Mutação **substitui** a base; upgrade puro = degeneração Sirlin. Confirmar `damageScalesWithDistance` como o param novo aceitável.
- Motivo: constituição — "Mutação = ganho pequeno + condicionador de estilo, NUNCA power-spike". Curva = ✏️ Balancista; aqui só a **forma** (dois-lados).
- Status: FILA

### [B4] ⑪ Fogo Voraz — `spreadStatus` (reacende primário + pula burn-fraco a 1-2 adj) — novo-primitivo
- Tipo: novo-primitivo (executor de skill, via [Q1] skillSwap)
- Alvo: `executor.ts` — resolve a skill mutada de Fogo Voraz.
- Mudança (DECISÃO CRIADOR jun/2026 — forma FECHADA): `spreadStatus` faz DUAS coisas, ambas via STATUS/DoT (NÃO dano cru): **(1) reacende/intensifica o `burn` no alvo atingido** + **(2) espalha `burn` de dano SIMBÓLICO pras casas em CRUZ N-S-E-W (4 ortogonais)** do alvo (contágio). O executor hoje não propaga status. Validar keys com `skills/status.ts` (`burn` real existe; cuidado de recursão como no [Q3]).
- Motivo: mantém a identidade "incêndio que se alastra" SEM virar dano-cleave (que colidiria com ③/⑨) nem "Bola de Fogo VI" (só +burn single). **⚠️ Balancista:** dano do burn espalhado = **simbólico** (nicho Fagulhas), respeitar gate de AoE ~lvl 20 (hub §6); intensidade do burn-fraco ✏️. Forma da área = **cruz N-S-E-W** (criador).
- Status: FILA

### [B9] ⑫ Monge — conduta quebra só por ARMA PRIMÁRIA + milestone lvl 20 — nova-ficha/dep-equipamento
- Tipo: nova-ficha (depende do sistema de slots de equipamento)
- Alvo: ficha real do Monge em `definitions.ts` + evento `equip` (campo `slot`) + taxonomia de slots.
- Mudança (DECISÃO CRIADOR jun/2026):
  1. **`milestoneLevel` 25 → ~20** (alinha com Intocado/Senhor dos Extremos). Atualizar DESIGN-EVOLUCAO (diz 25).
  2. **`breakFilter` = `slot==mainHand && category==weapon`** — só ARMA PRIMÁRIA quebra. **Luva e off-hands LIBERADOS** (o Monge luta de luva/punho). Exige o `equip` distinguir **main-hand-arma** de **off-hand/luva** → **DEP: o sistema de slots de equipamento precisa dessa distinção** (slot taxonomy). Sem ela, a conduta não tem como filtrar corretamente.
  3. Escopo `sinceClass`. Efeito (grantSkills+derivedMod) inalterado — ver [Q4].
- Motivo: lvl 25 sem NENHUMA arma era o teto; criador relaxou p/ lvl 20 + permitir luva/off-hand (coerente com o punho/luva do Monge).
- Status: FILA (bloqueado por: distinção de slot main-hand vs off-hand no equipamento)

> **Lote 2 (Mutações) — revisão de significado do Chat B FEITA** (§8 do catálogo
> `2026-06-11-catalogo-emergente-lote2-mutacoes.md`). 9/10 aprovadas; só 1 mudança de efeito ↓.
> Pendências de DECISÃO do criador (não-engine): reconciliar nomes com `design/skills/CATALOGO.md`
> (Lote 2 substitui os rascunhos?); confirmar o *Passo Sombrio* (ressuscita o "Passo das Sombras"
> removido). Tradeoffs anti-upgrade-puro (Quebra-Guarda/Permafrost/Passo Sombrio) = Balancista.

### [B10] Fôlego (mut. de Curar Ferimentos) — instantâneo + rabo de HoT, não só HoT — modifica skill-def
- Tipo: modifica-primitivo (na DEF da skill mutada, via [Q1] skillSwap; usa o status novo `regenHoT` do harvest do Lote 2)
- Alvo: skill def mutada de Fôlego.
- Mudança (revisão Chat B + CRIADOR): o gatilho é *self-cast sob pressão (HP<40%)* mas o prêmio proposto era **só HoT** (cura lenta) — incoerente. **Fôlego = cura INSTANTÂNEA (mantém) + aplica `regenHoT` (rabo de regen)** = **3-7% da cura total** como bônus over-time (guia do criador). Clutch-viável + verbo novo. Números ✏️ Balancista.
- Motivo: o prêmio não pode ser PIOR para o comportamento que o destrava (cura lenta para quem casta sob pressão).
- Status: FILA (depende de [Q1] + status `regenHoT`)

### [B11] Lote 2 — formas/efeitos das defs mutadas (decisões do criador na revisão 1-a-1) — modifica skill-def
- Tipo: modifica-primitivo (nas DEFS mutadas, via [Q1]) — coletor das decisões da passada do criador.
- Alvo: as `SkillDef` mutadas do Lote 2 (escrever junto com [Q1]).
- Decisões (criador, jun/2026):
  - **Talho Amplo (Golpe Forte):** forma = **arco de 3 casas À FRENTE** (precisa de facing), NÃO todos os adjacentes. Dano dividido. ⚠️ **condicionado à aprovação do Balancista** (risco de AoE no Knight).
  - **Estilhaço (Lança de Gelo):** **REMOVE o pierce** (`lineThrough`) da mutada e troca por **estilhaçar em 3 casas (lateral/atrás do 1º contato)**. Dano dividido (aumento pequeno).
  - **Permafrost (Lança de Gelo):** `root` com duração **~0.2s** (guia do criador p/ Balancista).
  - **Exorcismo (Luz Sagrada):** sidegrade explícito — single **100%→75%** + **~20% em AoE** (só vs profano) + ~5% perda líquida; **threshold ALTO** (Priest caça profano naturalmente). Tudo ✏️ Balancista.
  - **Passo Sombrio (Apunhalar): CORTADA** — gatilho "cast de longe" impossível p/ melee + ressuscita skill removida. Não criar a def.
  - **Permafrost:** (já acima) root ~0.2s.
  - **Raio Solar (Luz Sagrada): CORTADA** — fraca/situacional. Não criar a def; Luz Sagrada fica só com Exorcismo; 2ª mutação a pensar depois.
  - ⏳ **GARFO MELEE pendente (Quebra-Guarda + Hemorragia):** reframe proposto = "veto só ao FLAT INCONDICIONAL; dano CONDICIONAL é verbo". Candidatos: Hemorragia → **ignora armadura** (ou manter sangramento/bleed); Quebra-Guarda → **Vulnerável** (janela de combo). Aguarda escolha do criador (vale p/ Lote 3).
- Status: FILA (depende de [Q1]; números ✏️ Balancista)

---

## HISTÓRICO (FEITO)

- Framework do motor (EffectSpec tipado, activeEffects+cache, onUnlock/invalidação).
- P1 damageMult, P2 onKill, P3 blockFull, P4 crit, P8 grantSkills — hooks + smoke 12/12.
- Specs ligadas: Roedor de Ferro (P1 vs bestial), Exagero (P2 overkill 0.5× raio 1).
- **[Q2] P5 regen** — `regenTick(prog,e,hpMult,manaMult)` + `evalRegenMult` + cálculo
  na Simulation (efeitos ativos × `effectSessionFacts`). Smoke 5/5 (base 30 → ×2 = 60).
  Pronto p/ a ficha do Intocado (`{kind:"regen",resource:"mana",mult,when:[inCombat==true]}`).
- **[Q3] P6 statusCombo** — `matchStatusCombos` + hook pós-dano em `applyDamage` (burst
  `suppressEffects`, consome status, recomputa stepMs). **Status reais: gelo=`slow`,
  fogo=`burn`** (NÃO existe "frozen"). Senhor dos Extremos ligado com 2 combos direcionais
  (burst 10 ✏️). Smoke 8/8 (base 5 + burst 10 = hp 85, slow consumido, stepMs 500→250).
- **`TrackingEffect.spec` agora aceita `EffectSpec | EffectSpec[]`** — necessário p/ Senhor
  dos Extremos (2 combos) e Monge (grantSkills+derivedMod). `activeEffects`/`onUnlock` achatam.
