# Catálogo Emergente — Lote 3 (MUTAÇÕES, 2ª leva)

> Continuação do Lote 2. Mesma disciplina: **verbo novo (Koster), sidegrade, perfil
> mutuamente exclusivo, reusa primitivo onde dá.** Agora no próximo anel do roster
> (CATALOGO planejado), escolhido por variedade de **mecânica/verbo** (mobilidade,
> DoT, raio/chain, chip-field, buff). Alimenta o P7 quando destravar.
>
> ### ⚠️ INVARIANTE — mutação vem de HÁBITO, nunca de ATRIBUTO
> O atributo no cabeçalho é **só metadado da skill base** (qual stat escala o dano).
> A condição de mutar é **SEMPRE o perfil de uso** (hábito). Atributo nunca gateia
> mutação. Skills variadas = variedade de mecânica, NÃO de atributo.
>
> **[engine]** = primitivo da branch `feat/skills-engine` (não mergeada). **[novo]** =
> primitivo de skill a criar. Perfil-gatilho usa fato do sensor EMITIDO hoje salvo
> onde marcado ⚠️. Números/flavor = ✏️ Balancista/Loremaster/Chat B.

---

## 1. Investida / *Charge* (`charge` · For · mobilidade+stun · gap-closer)

| Mutação | Perfil-gatilho | Verbo novo | Primitivo |
|---|---|---|---|
| **Aríete** / *Battering Ram* | investidas CURTAS (`castDistance≤2`) N vezes | stun pontual → **atropela a linha** (empurra + dano no caminho) | **[novo]** knockback + dano-em-trajeto |
| **Estopim** / *Headlong* | investidas LONGAS (`castDistance≥4`) N vezes | stun pontual → **stun em ÁREA na chegada** | **[engine]** selfRadius + **[novo]** status `stun` |

- Significado: Aríete = "não para no primeiro — atravessa a fileira". Estopim = "chega
  como um trovão e tudo ao redor trava". ✏️
- Eixo do perfil = DISTÂNCIA da investida (curta=na fuzarca / longa=caçada). Sem sensor novo.

## 2. Retalho / *Rend* (`rend` · Des · sangramento single-target)

| Mutação | Perfil-gatilho | Verbo novo | Primitivo |
|---|---|---|---|
| **Estripar** / *Eviscerate* | usado em alvo já sangrando (`targetWasPoisoned`/bleed) N vezes | DoT acumulado → **detona o sangramento num burst** | **[novo]** consumir-status→burst (self-combo, primo do P6) |
| **Marca Mortal** / *Deathmark* | usado em alvo fresco (`targetHpPctBefore≥0.9`) N vezes | DoT → **marca** (alvo recebe +dano e cura menos por Xs) | **[novo]** status `mark` (debuff de vulnerabilidade) |

- Significado: Estripar = "abre o que já estava aberto". Marca Mortal = "o primeiro corte
  é uma sentença". ✏️
- Estripar é primo do `statusCombo` (P6), mas auto-disparado pela própria skill — avaliar
  se reusa o mesmo hook.

## 3. Raio / *Bolt* (`bolt` · Int · feixe instantâneo, relâmpago)

| Mutação | Perfil-gatilho | Verbo novo | Primitivo |
|---|---|---|---|
| **Corrente** / *Chain Lightning* | acertando aglomerados (`targetsHit≥2`) N vezes | linha → **salta entre alvos próximos** | **[engine]** chain (já existe p/ Sparks) |
| **Fulminar** / *Smite Bolt* | single à distância (`castDistance≥4 && targetsHit==1`) N vezes | chip → **descarga única que atordoa** | **[novo]** status `stun` |

- Significado: Corrente = "o raio procura o próximo". Fulminar = "toda a carga num ponto só". ✏️
- Corrente é barata (chain já existe na skills-engine).

## 4. Fagulhas / *Sparks* (`sparks` · Int · chip-AoE FRACO — guardrail: NUNCA vira deleter)

| Mutação | Perfil-gatilho | Verbo novo | Primitivo |
|---|---|---|---|
| **Estática** / *Static Field* | acertando clusters (`targetsHit≥3`) N vezes | chip instantâneo → **campo que lasca no chão** (DoT-zona fraco) | **[engine]** groundZone |
| **Foco** / *Focused Spark* | acertando alvo único (`targetsHit==1`) N vezes | espalha → **colapsa num zap único + stun breve** | **[novo]** status `stun` |

- Significado: Estática = "as fagulhas ficam no ar". Foco = "todas as faíscas num só ponto". ✏️
- ⚠️ **Guardrail (hub §6):** ambas seguem CHIP — Estática lasca por tempo, Foco é single.
  Nenhuma pode escalar a deleter de pack (sublinear em Int). Balancista cuida.

## 5. Bênção / *Blessing* (`blessing` · Esp · buff regen/resist em si/aliado)

| Mutação | Perfil-gatilho | Verbo novo | Primitivo |
|---|---|---|---|
| **Fervor** / *Zeal* | auto-cast sob pressão (`targetSelf && casterHpPct<0.4`) N vezes | buff defensivo → **buff OFENSIVO** (golpes drenam vida por Xs) | **[novo/engine]** buff temporário c/ lifesteal-on-hit |
| **Litania** / *Litany* | cast em ALIADO (`!targetSelf`) N vezes (online) | buff único → **aura** (espalha aos aliados próximos) | **[engine]** aura/selfRadius de buff |

- Significado: Fervor = "a fé que defende vira a fé que queima". Litania = "a bênção
  transborda pra quem está perto". ✏️
- Litania é aposta online (party), como Mártir/Transfusão. Fervor é o solo-viável.

---

## 6. HARVEST — primitivos novos do Lote 3 (custo crescente)

| Primitivo | Mutações | Origem | Peso |
|---|---|---|---|
| `chain` | Corrente | **[engine]** | barato (existe) |
| `groundZone` | Estática | **[engine]** | médio (skills-engine) |
| `selfRadius` | Estopim | **[engine]** | barato (já no harvest L2) |
| aura/buff radial | Litania | **[engine]** | médio |
| buff ofensivo (lifesteal-on-hit) | Fervor | **[novo/engine]** | médio |
| status **`stun`** | Estopim, Fulminar, Foco | **[novo]** | médio (controle — cuidar do gate) |
| status **`mark`** (vulnerabilidade) | Marca Mortal | **[novo]** | médio |
| **knockback** + dano-em-trajeto | Aríete | **[novo]** | **CARO** (deslocamento forçado na sim) |
| consumir-status→burst | Estripar | **[novo]** | médio (primo do P6) |

**Leitura do harvest:** o Lote 3 é mais caro que o Lote 2 — utilitárias/mobilidade
puxam primitivos exóticos (**knockback** é o mais pesado: mover entidade à força mexe
em colisão/ocupação/pathfinding). `stun` aparece 3×, então vale a pena como 1 status
declarativo reusável. Recomendação de ordem ao implementar: **stun → mark → consumir-
status → groundZone/aura → knockback por último** (e talvez Aríete vire ✏️ "fica pra
depois" se o custo de deslocamento forçado não compensar).

## 7. ACHADO IMPORTANTE — skills SEM alvo não podem mutar hoje

Desenhando este lote (e tentando Dash/Disparada, Lume), bati num limite **estrutural**:
o gatilho de Mutação roda em `skill_use` com `targetsHit>0` (a sim só emite cast que
CONECTOU num alvo). **Skills puramente utilitárias/mobilidade sem alvo (Dash, Lume,
Muralha) NUNCA emitem `skill_use`** → não há perfil de uso → **não podem ter Mutação**.

- Por isso o Lote 3 ficou em skills com alvo (ou self-target, que EMITE — o alvo é o
  próprio caster, ver Curar/Bênção).
- **Decisão necessária (✏️ criador + Designer):** ou (a) skills sem alvo simplesmente
  **não mutam** (aceitável — Mutação é prêmio de combate), ou (b) emitir `skill_use`
  também para casts sem alvo (com `targetsHit:0` + um `castResolved:true`), abrindo
  perfis como "N dashes através de inimigos" / "N usos de Muralha que bloquearam". É
  **mudança de sensor/convenção** — entra na fila de sensores, não no motor de efeito.
- Recomendação: deixar (a) por ora (não mutar utilitária pura) e revisitar se o
  playtest pedir. Registrado pra não ser esquecido.

## 8. Handoff
- **Chat B:** revisar significado das 10 (mesmo processo). Mudança de efeito → fila.
- **Chat A (P7):** depende do merge skills-engine + status novos (`stun`/`mark`).
  Ordem do §6. Aríete (knockback) possivelmente adiado.
- **Sensores:** o achado §7 (skills sem alvo) é decisão do criador — fila de sensores.
