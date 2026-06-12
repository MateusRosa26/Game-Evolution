# Auditoria de Mutações — Regra de 3 Partes (jun/2026)

> **Regra ratificada pelo criador (jun/2026).** Uma mutação é válida se tiver **PELO
> MENOS UMA** das três:
> 1. **Condicional** — o ganho só vale às vezes (vs família, HP baixo, cercado…). Não é always-on.
> 2. **Tradeoff** — abre mão de algo da base (alcance, single-target, pierce).
> 3. **Decisão nova** — muda COMO se joga (posição, combo, escolha de alvo).
>
> **VETA só:** "+X% sempre, sem condição, sem tradeoff, sem decisão nova" (flat
> incondicional = treadmill + escolha falsa + zero identidade). Vale p/ caster E melee.
> Esta auditoria varre TODAS as mutações (Lote 1/2/3 + rascunhos do `CATALOGO.md`).
> Destino da regra: registrar no anti-treadmill do `DESIGN-SKILLS.md`.

## A. MUST-REVISE — falham a regra (flat incondicional)

> Padrão revelado: os 3 FAILs são todos de skills de **UTILIDADE/economia** — é onde o
> número flat se infiltra (verbo é mais difícil de imaginar p/ utilitária). Proposta de
> conserto = trocar o "mais/maior" por um VERBO (qualququer das 3 partes).

| # | Skill → Mutação | O que é hoje | DECISÃO CRIADOR (jun/2026) |
|---|---|---|---|
| 1 | **Lume → Luz Duradoura** | "raio e duração maiores" | **CORTADA** — gastar evolução numa magia "só ilumina" é cilada (mesmo fazendo sentido na filosofia). **Lume provavelmente NÃO muta** (utilitária pura). |
| 2 | **Conjure Arrow → Aljava Infinita** | "mais flechas / menos mana" | **trocar QUANTIDADE por DURAÇÃO** (menos flechas, duram bem mais) = *tradeoff* (casa com o uso real: flecha morre por tempo, não por gasto). **NÃO "não-expira"** (viraria moeda/quebra mercado — criador). **RENOMEAR** (não é "infinita" — ✏️ Loremaster). |
| 3 | **Aura Sagrada → Graça Compartilhada** | "raio maior / cura extra" | ⏳ bloco 2 — proposta: **excedente de cura vira escudo breve** (overheal→shield). |

**Melee (garfo resolvido, regra de 3 partes):**
- **Hemorragia** (Apunhalar/costas) → **ignora ~7-10% da armadura** (penetração PEQUENA, não toda — criador; ✏️ Balancista). Verbo bounded.
- **Quebra-Guarda** (Golpe Forte/abertura) → **Vulnerável SELF-ONLY** (só os SEUS golpes de follow-up batem +dano por Xs, não o dano da party) + magnitude PEQUENA. Self-only mata o risco de virar meta de party ("todos precisam de um QG"). ⏳ confirmar self-only.

## B. BORDERLINE — passam pela LETRA (são condicionais) mas são "número condicional" (identidade mais fraca)

> Passam a regra (têm condição), mas o ganho ainda é "um número maior, só que às vezes".
> **Aceitáveis** se você quiser — mas são o degrau de menor identidade. Decidir caso a caso
> se vira verbo ou fica condicional-número.

| Skill → Mutação | É | Observação |
|---|---|---|
| **Heal → Reflexo Vital** | "cura muito maior quando quase morto" | condicional ✓; mas é "Heal maior às vezes". Verbo alt: cura crítica também dá breve invulnerabilidade/regen |
| **Golpe Forte → Golpe Desesperado** | "dano escala com HP perdido" | condicional + decisão (jogar baixo) ✓; **incentiva ficar em HP baixo de propósito** (mesmo risco da ② Última Resposta) — vigiar |
| **Lança de Gelo → Geada Perfurante** | "perfura tudo + slow maior por alvo" | ⚠️ **a base JÁ perfura** (`lineThrough`) → "perfura tudo" é redundante; sobra "+slow" (número). Reescrever ou cortar |
| **Apunhalar → Golpe Súbito** | "dano enorme no 1º golpe do combate" | condicional (abertura) ✓; burst-de-abertura. Ok como execute-reverso, mas é número condicional |
| **Luz Sagrada → Fervor** | "dano sobe enquanto não tomar dano" | condicional ✓; **+ COLISÃO DE NOME** com *Fervor* da Bênção (Lote 3) — renomear um |

## C. ADITIVAS — "base + bônus condicional" (passam, mas manter magnitude PEQUENA)

> Não são flat-incondicional (têm condição), então passam. Mas são "base intacta + um extra",
> então o risco é virar upgrade de fato se o número crescer. Brief Balancista: **manter o bônus pequeno.**

- **Fogo Voraz** (⑪) — base + contágio de burn simbólico (condicional: alvo já queimando).
- **Fôlego** (Lote 2) — cura instantânea + HoT 3-7% (condicional: self sob pressão).
- **Transfusão** (Lote 2) — cura + escudo (condicional: aliado).
- **Permafrost** (Lote 2) — slow→root (condicional: já-lento); root>slow, mitigado por 0.2s.

## D. Achados estruturais (bônus)

- **Colisão de nome "Fervor"** — existe em *Luz Sagrada* (rascunho CATALOGO: "dano sobe sem tomar dano") E em *Bênção* (Lote 3: "buff defensivo→ofensivo lifesteal"). **Renomear um** (Loremaster).
- **Geada Perfurante redundante** — "perfura tudo na linha" é o que a base já faz; a mutação só agrega "+slow". Reescrever o verbo ou cortar.
- **Meteoro Distante (⑩)** — lembrete: só não é upgrade puro porque forçamos "fraco perto" (dois-lados). Confirmar que a def mutada implementa a penalidade-perto, senão recai no FAIL.

## E. PASSAM LIMPO (não precisam revisão) — ~28 mutações

Lote 1: Eclosão ✓ · (Meteoro ✓ com a penalidade-perto · Fogo Voraz → C). Lote 2: Talho Amplo ·
Estilhaço · Exorcismo · Quebra-Guarda(→Vulnerável) · Hemorragia(→ignora-armadura/bleed) ✓ (+ Permafrost→C, Fôlego/Transfusão→C). Lote 3 (todo limpo):
Aríete · Estopim · Estripar · Marca Mortal · Corrente · Fulminar · Estática · Foco · Fervor(Bênção) · Litania.
CATALOGO: Mãos Generosas · Recuperação · Lampejo · Pés Alados · Ímpeto · Sangue Frio · Descanso de
Veterano · Caçador · Pontaria Cruel(execute) · Riposte · Lâmina do Fim(execute) · Estilhaço Profundo ·
Muralha de Inverno · Lâmina Suja · Flecha de Emergência · Chama Purificadora · Nova Sagrada · Refúgio · Prece de Guerra.

## Decisões da passada 1-a-1 (criador, jun/2026)

- **Hemorragia** → ignora **7-10% da armadura** (penetração pequena). **Quebra-Guarda** → **Vulnerável SELF-ONLY** + magnitude pequena (mata o risco de meta-de-party). **Luz Duradoura** → CORTADA. **Aljava Infinita** → troca quantidade↔duração (não "não-expira"; renomear).
- **Graça Compartilhada** → overheal→escudo **com cap pequeno**.
- **Reflexo Vital** → MANTÉM condicional, mas **pequeno**: +7-10% cura em HP baixo (máx 12-15%).
- **Golpe Desesperado** → MANTÉM condicional (criador aceita o incentivo de jogar no fio; ⚠️ junto com ② Última Resposta forma um *cluster de incentivo a HP baixo* — Balancista vigiar o conjunto).
- **Geada Perfurante** → **CORTADA** (CC/zona é fancy demais p/ magia de gelo de ENTRADA; pool da Lança de Gelo estava inchado). Lança fica com Estilhaço / Estilhaço Profundo / Muralha de Inverno / Permafrost.
- **Golpe Súbito** → MANTÉM condicional, mas **+7-10% SÓ** na abertura (não "dano enorme").
- **Fervor (Luz Sagrada)** → MANTÉM condicional pequeno (ramp capado) + **RENOMEAR** (o nome "Fervor" fica com a Bênção/Lote 3; ✏️ Loremaster renomeia este).
- **Quebra-Guarda** → **SELF-ONLY confirmado** (Vulnerável só pros próprios golpes).
- 🔢 **Régua emergente (criador):** bônus condicional pequeno ancora em **~7-10%** (Hemorragia armor-pen, Reflexo Vital cura, Golpe Súbito dano) — anchor p/ o Balancista.

### 🆕 PRINCÍPIO — a mutação respeita o TIER da skill base (decidido jun/2026)
Skill de **entrada** muta **modesto**; **mecânica high-level** (CC forte, zonas de chão, links entre alvos, deslocamento forçado) fica reservada às skills de **tier alto**. Gastar um verbo caro numa skill básica (a) desperdiça o verbo e (b) incha o pool de uma skill que deveria ser simples. → registrar no `DESIGN-SKILLS.md` junto com a regra de 3 partes. **Corolário:** revisar pools inchados (Lança de Gelo tem 5 mutações possíveis — alvo 2-3).

## Resumo — RESOLVIDO (passada 1-a-1 do criador, jun/2026)

**2 CORTADAS:** Luz Duradoura (Lume = utilitária, não muta) · Geada Perfurante (CC fancy demais p/ gelo de entrada + pool inchado).
**Reescritas (verbo/tradeoff):** Aljava Infinita (quantidade↔duração + renomear) · Graça Compartilhada (overheal→escudo, cap pequeno) · Hemorragia (ignora 7-10% armadura) · Quebra-Guarda (Vulnerável self-only).
**Mantidas condicionais, mas PEQUENAS:** Reflexo Vital (+7-10%, máx 12-15%) · Golpe Desesperado (escala c/ HP perdido) · Golpe Súbito (+7-10% abertura) · Fervor/Luz Sagrada (ramp capado + renomear).
**Aditivas mantidas (Balancista: pequeno):** Fogo Voraz · Fôlego · Transfusão · Permafrost.
**2 regras NOVAS na constituição** (`DESIGN-SKILLS.md` §3): Corolário C (regra de 3 partes) + Corolário D (mutação respeita o tier da base). Régua de magnitude: ~7-10% p/ bônus condicional; debuffs de setup = self-only.
**Tarefas restantes:** ✏️ Loremaster renomeia (Aljava, Fervor-Luz, + EN/PT do garfo); Chat A embute consertos nas defs (via [Q1]); **mesclar tudo no `design/skills/CATALOGO.md`** (pools por skill, alvo 2-3).
