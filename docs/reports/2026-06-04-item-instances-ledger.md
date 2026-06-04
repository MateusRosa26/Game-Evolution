# Report: Itens como instâncias com ID + ledger (fundação + arma equipada)

**Branch:** `feature/item-instances-ledger`
**Data:** 2026-06-04
**Complexidade:** high

## O que foi feito

Fundação de dados de itens que `DESIGN-EVOLUCAO.md` manda definir cedo ("Itens são
instâncias com ID + ledger, não stacks de template — definir cedo para não
retrofitar"). **SIM only** — sem UI de inventário (M2), client intocado.

Implementa: templates de item, instâncias com ledger de proveniência, registry
determinístico na sim, arma inicial da classe equipada como instância no spawn,
combate usando o template da arma equipada, eventos `kill`/`damage` carregando
`weaponInstanceId`+`weaponTemplateId`, e um assinante do bus que alimenta o ledger
das instâncias com as regras de anti-degeneração e atribuição arma-vs-magia.

### Módulo novo `src/sim/items/`
- **`templates.ts`** — `ItemTemplate` (id, nome, `slot` weapon/shield/armor,
  `tags`, `rarity`, `weapon: WeaponStats`). `markSlotsForRarity` traduz raridade →
  nº de slots de Marca (comum/uncommon/rare=1, legendary=2, unique=3). Templates do
  kit das 4 classes: `espada_curta` (Knight), `cajado_simples` (Mage), `adaga`
  (Rogue, escala Destreza), `cetro` (Priest) + **`fists`** ("Punhos") como template
  REAL do desarmado (decisão abaixo). `STARTER_WEAPON_BY_CLASS` mapeia classe→arma.
- **`instances.ts`** — `ItemInstance { id, templateId, ledger }` + `ItemRegistry`
  (cria instâncias com IDs por CONTADOR determinístico, contador próprio separado
  do de entidades — o item sobrevive ao dono).
- **`ledger.ts`** — `ItemLedger` (shape JSON-safe, abaixo) + `createLedger` +
  `attachItemLedger(bus, deps)` (assinante de `kill`/`damage`) + `recordPreviousOwner`
  (proveniência futura).
- **`index.ts`** — barrel.

### Mudanças mínimas no resto da sim/shared
- **`entity.ts`** — campo `equippedWeaponId: number | null` (instância no registry).
- **`events.ts`** — `DamageEvent`/`KillEvent` ganham `weaponInstanceId`+
  `weaponTemplateId` (a CHAVE que o ledger usa). `weaponId` legado mantido p/
  floating text, marcado deprecado como fonte de verdade da arma.
- **`combat.ts`** — `applyDamage` agora recebe um `WeaponSource | null`
  (`{ instanceId, templateId, label }`) em vez de `weaponId: string`; popula os dois
  campos novos nos payloads. Monstros passam `null` (sem arma-instância).
- **`skills/executor.ts`** — `SkillCastCtx.weaponSource`. Skills FÍSICAS de arma
  (Golpe Forte/Apunhalar, `effect: "physical"`) passam a `WeaponSource`; projéteis/
  linha/cura passam `null` → magia não toca o ledger da arma.
- **`Simulation.ts`** — cria `ItemRegistry`, `attachItemLedger` no construtor; no
  `addPlayer` cria+equipa a arma da classe; `recomputePlayerDerived` e o cast de
  skill leem dano-base/cooldown/escala do TEMPLATE da arma equipada; auto-attack e
  Golpe Forte/Apunhalar propagam o `WeaponSource`; snapshot projeta a arma equipada.
- **`balance.ts`** — `STARTER_WEAPON_DAMAGE` e `STARTER_WEAPON_ID` REMOVIDOS
  (substituídos pelos templates — era o placeholder que a tarefa pediu trocar).
- **`protocol.ts`** — `EquippedWeaponState { instanceId, templateId, name }` em
  `EntityState.weapon?` (só player). **O ledger NÃO vai ao snapshot** (oculto por
  design — Marcas são secretas).

## Decisões documentadas

- **"Punhos" é template REAL (`fists`), não caso especial.** Desarmar = equipar a
  instância de punhos, nunca `equippedWeaponId: null` no player. Mantém o pipeline
  (dano da arma, ledger, instância) UNIFORME. Tag `desarmado` é o que o Caminho
  Monge ("Mão Vazia") lerá. Substitui o antigo `STARTER_WEAPON_ID = "fists"`.
- **Atribuição arma vs magia** (vem das fichas, §"Magias e Skills"): conta para a
  ARMA o evento com `weaponInstanceId != null`. Auto-attack e skills FÍSICAS de arma
  (Golpe Forte/Apunhalar, tag `arma`) trazem a instância; magias (Bola de Fogo/Lança
  de Gelo/Luz Sagrada), DoT e cura trazem `null` → não tocam o ledger da arma.
  (Magias alimentarão Mutações de skill — outra wave.)
- **Anti-degeneração no kill da arma:** só conta se o kill for VÁLIDO
  (`formulas.isValidKill` — ainda dá XP para o nível do dono) E se a arma deu o
  GOLPE FINAL estando equipada (= `weaponInstanceId` no `kill`).
- **Ledger JSON-safe:** `Record<string, number>` (não `Map`) para que
  `JSON.stringify(ledger)` baste no save futuro e na borda do trade. Zero Maps/refs.
- **Dia/noite:** não existe na sim (`CombatContext.night` sempre false). Contexto
  `atNight` fica em 0 (alimentado como "não-noite") com `TODO(dia/noite)` claro.
- **IDs determinísticos:** contador no `ItemRegistry` (nunca UUID/Math.random).

## Self-verify
- `npx tsc --noEmit` ✅ · `npm run build` (tsc + vite, 755 módulos) ✅
- Harness temporário (esbuild+node, apagado) — 0 assertion failures:
  - Knight mata 5 ratos por auto-attack → ledger da espada: `totalKills=5`,
    `killsByFamily.bestial=5`, `killsBySpecies.rato_lanhoso=5`, `finalBlow=5`,
    `atNight=0`, `totalDamageDealt>0`; todo `kill` carrega `weaponInstanceId=1` +
    `weaponTemplateId="espada_curta"`.
  - Mage mata rato por Bola de Fogo (sem auto-attack) → ledger do cajado **intacto**
    (`totalKills=0`, `totalDamageDealt=0`).
  - Knight mata 3 ratos só com Golpe Forte (skill de arma) → `totalKills=3`, dano
    acumula, kill carrega `skillId="golpe_forte"`.
  - Snapshot do player traz `weapon {instanceId,templateId,name}` e NENHUM contador
    de ledger (`killsByFamily` ausente do JSON do snapshot inteiro).
  - Determinismo: duas sims com mesma seed → ledgers byte-idênticos.
- `git status`: nenhum `src/client/**` tocado.

---

## Contrato para waves futuras

### Shape do ledger (`src/sim/items/ledger.ts` — `ItemLedger`)
JSON-safe. Vive na INSTÂNCIA, viaja no trade/drop. **OCULTO do snapshot.**
```
totalKills: number                       // kills com golpe final da arma equipada (válidos)
killsByFamily: Record<string, number>    // ex: { undead: 14000, bestial: 30 }
killsBySpecies: Record<string, number>   // ex: { esqueleto: 14000, rato_lanhoso: 30 }
killsByContext: {
  atNight: number      // golpe final à noite — TODO(dia/noite): 0 até o ciclo existir
  ownerLowHp: number   // golpe final com HP% do dono < 10% (Marca "Última Resposta")
  finalBlow: number    // golpe final (== totalKills; explícito p/ simetria)
}
totalDamageDealt: number                 // dano da arma (auto-attack + skills de arma)
blockedHits: number                      // futuro shield — `block` não emitido no M1
previousOwners: { id: number, name: string }[]  // proveniência (trade futuro; hoje vazio)
```
Dicionários por família/espécie crescem sob demanda (chave criada no 1º kill).

### Regra de atribuição (o que alimenta o ledger da arma)
- **Conta:** evento `kill`/`damage` com `weaponInstanceId != null`.
  - Auto-attack: sempre a instância equipada.
  - Skill física de arma (`effect: "physical"` — Golpe Forte/Apunhalar): instância
    equipada.
- **NÃO conta:** magia (projétil/linha — Bola de Fogo/Lança de Gelo/Luz Sagrada),
  DoT, cura, dano ambiental → `weaponInstanceId == null`.
- **Filtros no `kill`:** kill válido (`isValidKill`, anti-farm por nível) + vítima é
  criatura do bestiário + atacante tem nível (player). Caso contrário, ignora.

### Como o tracking de Marcas (wave futura) vai ler
1. Resolver a instância pelo payload de evento: `registry.get(ev.weaponInstanceId)`.
2. As DEFINIÇÕES de Marca (dados: tipo de evento + filtro + threshold) leem os
   contadores do `ledger` da instância — ex.: *Quebra-Ossos* = `killsByFamily.undead
   >= 15000`; *Última Resposta* = `killsByContext.ownerLowHp >= 10000`; *Lâmina da
   Vigília* = `killsByContext.atNight >= 8000` (ativa quando dia/noite existir).
3. `markSlotsForRarity(template.rarity)` limita quantas Marcas cristalizam (o ledger
   CONTINUA contando mesmo com slots cheios — regra do design).
4. O ledger é a fonte de verdade que viaja no trade (`recordPreviousOwner` na borda
   da troca registra o dono que sai). A revelação de hint/unlock vai por evento no
   protocol (a definir na wave de Marcas) — NUNCA expondo os contadores.

### Snapshot novo (`src/shared/protocol.ts`)
- `EntityState.weapon?: EquippedWeaponState { instanceId, templateId, name }` — só
  player, só identidade (mínimo p/ HUD futura). Ledger jamais entra.

## Arquivos alterados
- `src/sim/items/templates.ts` (novo)
- `src/sim/items/instances.ts` (novo)
- `src/sim/items/ledger.ts` (novo)
- `src/sim/items/index.ts` (novo)
- `src/sim/entity.ts` (campo `equippedWeaponId`)
- `src/sim/events.ts` (`weaponInstanceId`/`weaponTemplateId` em damage/kill)
- `src/sim/combat.ts` (`WeaponSource`, `applyDamage` propaga a instância)
- `src/sim/skills/executor.ts` (`weaponSource`; skill física de arma propaga)
- `src/sim/Simulation.ts` (registry, ledger, equip no spawn, derivados da arma, projeção)
- `src/sim/balance.ts` (remove `STARTER_WEAPON_DAMAGE`/`STARTER_WEAPON_ID`)
- `src/shared/protocol.ts` (`EquippedWeaponState`, `EntityState.weapon?`)
- `docs/reports/2026-06-04-item-instances-ledger.md` (novo)

---

## Verificação independente (verificador)

**Status: VERIFIED** · ROUND: 1

Agente fresco, sem contexto do implementador. Verificado contra o diff real
(`git diff main...HEAD`) e por harness comportamental (esbuild+node temporário,
apagado — não commitado). Sem browser/Playwright.

### Escopo e regras estáticas
- **`src/client/**` INTOCADO** — `git diff main...HEAD --name-only | grep src/client`
  retorna vazio. ✅
- **Proibições da sim** — grep de `pixi`/`Math.random`/`Date.now`/`performance.now`/
  `window.`/`document.` nos arquivos sim/shared alterados: só aparições em
  COMENTÁRIO ("nunca UUID/Math.random", "zero pixi/browser"); zero uso real. ✅
- **IDs determinísticos** — `ItemRegistry.nextId` por contador (começa em 1), sem
  UUID/random. Determinismo confirmado no harness (ledger JSON byte-idêntico em
  duas runs). ✅
- **Ledger JSON-safe** — só `Record<string,number>`, números e arrays; nenhum
  `Map`/`Set`/ref dentro do `ItemLedger`. (O `ItemRegistry` usa `Map` no lookup,
  mas isso é estado da sim, não o ledger serializado.) ✅
- **Vazamento de snapshot** — grep dos campos do ledger em `protocol.ts`: só a
  palavra "ledger" num COMENTÁRIO ("o ledger é oculto"). No harness, `JSON.stringify`
  do snapshot inteiro NÃO contém nenhum de: `ledger`/`killsByFamily`/`killsBySpecies`/
  `killsByContext`/`totalKills`/`totalDamageDealt`/`blockedHits`/`previousOwners`/
  `ownerLowHp`. O snapshot traz só `weapon {instanceId,templateId,name}`. ✅

### Regras de atribuição conferidas (leitura + harness)
- **Auto-attack credita a arma** — Knight mata 5 ratos: `totalKills=5`,
  `killsByFamily.bestial=5`, `killsBySpecies.rato_lanhoso=5`, `finalBlow=5`,
  `atNight=0`, `totalDamageDealt>0`; 5 eventos `kill` todos com
  `weaponInstanceId=<id da espada>` + `weaponTemplateId="espada_curta"`. ✅
- **Magia NÃO credita** — Mage mata por Bola de Fogo (projétil): ledger do cajado
  `totalKills=0`, `totalDamageDealt=0`. Confirmado no código: `execProjectile`/
  `execLine` passam `weapon=null` (combat.ts l.179/205); DoT/status passa `null`
  (status.ts l.137). ✅
- **Caso DoT explícito** — projétil NÃO mata (rat hp alto), o golpe final vem da
  QUEIMADURA (DoT). Ledger do cajado segue `totalKills=0` — o golpe final por DoT
  não toca a arma. ✅
- **Skill física de arma credita** — Golpe Forte mata 3 ratos: `totalKills=3`,
  3 eventos `kill` com `skillId="golpe_forte"` E `weaponInstanceId != null`.
  Código: `execMelee` usa `def.effect === "physical" ? ctx.weaponSource : null`. ✅
- **Anti-degeneração (isValidKill)** — `attachItemLedger.onKill` filtra por
  `isValidKill(template.xp, attackerLevel, creatureLevel)`, que é exatamente
  `xpFromKill > 0` (mesma regra que concede XP — fonte única). Harness: player nível
  100 mata rato T1 → rato morre, mas `totalKills=0` e `xp=0`. Kill inválido NÃO
  conta. ✅
- **Contexto ownerLowHp** — golpe final com HP% do dono < 10% (`OWNER_LOW_HP_PCT=0.1`,
  lê `ev.attackerHpPct`): incrementa para 1 ao matar com dono a 5% HP; fica em 0 ao
  matar com HP cheio. ✅
- **atNight** — `CombatContext.night` sempre false no M1 → sempre 0, com `TODO`
  claro. Conferido. ✅

### Regressão (Waves 1-3)
- **XP/level** — kill ainda concede XP (`prog.xp` sobe). ✅
- **Skills** — Bola de Fogo, Golpe Forte e DoT de queimadura funcionam no harness. ✅
- **`physicalDamage`/`attackCooldownMs`** ganharam params opcionais
  (`usesDexterity=false`, `weaponBaseCooldown=default`) — retrocompatíveis. ✅
- **Respawn mantém a arma E o ledger** — ao matar o player e respawnar,
  `equippedWeaponId` é inalterado e `ledger.totalKills` preservado (o ledger NÃO
  reseta na morte — comportamento correto: a história pertence ao objeto). ✅

### Build
- `npx tsc --noEmit` ✅ (exit 0)
- `npm run build` ✅ (tsc + vite, 755 módulos)

### Discrepâncias
Nenhuma material. Todas as falhas iniciais do meu harness foram ARTEFATOS DO TESTE
(ratos acumulados matando o player antes do golpe do player) — corrigidas isolando
cada kill (limpar mobs entre kills, ratos inofensivos quando preciso). A
implementação bateu com o relatório do worker em todos os pontos verificados.
