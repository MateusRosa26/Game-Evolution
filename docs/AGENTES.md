# Agentes — divisão de trabalho (3 funções)

> Orientação para rodar 3 agentes Claude em paralelo neste repo sem colisão.
> **Regra-mãe:** cada árvore de arquivos tem **UM dono exclusivo**. A dor que
> originou este doc (dois agentes escrevendo no mesmo `Simulation.ts`) só some
> com posse exclusiva por árvore. Leia também `CLAUDE.md` (arquitetura) e a
> constituição `DESIGN-FILOSOFIA.md`.

## Mapa de corte (segue a REGRA DE OURO da arquitetura)

| Função | Dono exclusivo de | Skills |
|---|---|---|
| **F1 — Núcleo & Balance** | `src/sim/**`, `src/shared/**`, `src/net/**` | `designer-de-sistemas` + `balancista` |
| **F2 — Cliente, Render & Arte** | `src/client/**` | `diretor-de-arte` |
| **F3 — Design, Mundo & Lore** | `design/**`, `DESIGN-*.md`, `wiki/`, `ROADMAP-MVP.md` | `world-designer` + `loremaster` |

Só **F1 e F2 escrevem código**, em árvores **disjuntas** (compartilham só
`src/shared`, que é da F1). **F3 não escreve código** — produz specs/docs. Logo,
conflito de merge entre agentes é estruturalmente impossível.

---

## F1 — Núcleo & Balance (a sim autoritativa)
**Dono:** `src/sim/**` + `src/shared/**` + `src/net/**`
**Faz:** mecânicas e regras; números/balance (baterias headless determinísticas);
o lado-sim de TODA feature (combate, skills, itens, NPC-lógica/comércio, quests,
tracking, progressão, **dados de mapa em `src/sim/maps/`**, dados de criatura em
`bestiary.ts`); refactors da sim; protocolo/tipos em `src/shared`.
**NÃO toca:** render, UI, sprites, `design/**`, docs de visão.
**Handoff:** recebe spec da F3; expõe campos no `protocol.ts` que a F2 consome.
**Skills:** `designer-de-sistemas` (estrutura/filosofia) + `balancista` (números).

## F2 — Cliente, Render & Arte
**Dono:** `src/client/**` (Game, Camera, render/, ui/, assets/, input/, dev/)
**Faz:** rendering; todas as janelas/HUD (ShopWindow, DialogueWindow, Container…);
pixel art procedural (`assets/sprites.ts` + `palette.ts`); pipeline PixelLab;
lighting; feedback visual; interpolação de movimento.
**Lê** `src/shared` (consome snapshots) — **não define regra**. Precisa de campo
novo no snapshot? Pede pra F1 adicionar.
**NÃO toca:** `src/sim`, balance, `design/**`.
**Skills:** `diretor-de-arte`.

## F3 — Design, Mundo & Lore (specs, zero código)
**Dono:** `design/**`, `DESIGN-*.md`, `wiki/`, `ROADMAP-MVP.md`
**Faz:** design de zonas/mapas/POIs/dungeons e ritmo de exploração; rosters de
NPC/quest/loot como **especificação**; nomes/flavor/lore/diálogo; decisões de
design; manutenção da wiki e dos mapas de decisão dos docs.
**NÃO escreve código** → entrega specs que F1 (dados/regras) e F2 (arte/UI)
implementam. Doc novo na wiki = entrada no array `DOCS` de `wiki/wiki.js`.
**Skills:** `world-designer` + `loremaster` (+ `designer-de-sistemas` p/ specs).

---

## Protocolo de feature cross-cutting
Uma feature que cruza camadas (ex: comércio) flui em **sequência**, nunca dois
agentes no mesmo arquivo ao mesmo tempo:

```
F3 (spec: o que é, regras, conteúdo)
   → F1 (sim: dados + regra + campo no protocolo)
      → F2 (cliente: UI + arte que consome o snapshot)
```

## Regras de convivência
- **`src/shared` é da F1.** F2 só lê. Mudança de protocolo nasce de feature da F1.
- **`src/sim/maps/` é da F1** (é código). F3 desenha o layout em spec; F1 transcreve.
- Antes de mexer, confirme que está na sua árvore. Fora dela = abre handoff, não edita.
- Commits: cada função commita só a sua árvore. Validar `npx tsc --noEmit` antes.

---

## Backlog inicial por função (pós-reset, jun/2026)

**F1**
- Comércio: encher buy-lists com mais mobs/loot; ligar consumíveis com efeito.
- Bateria T2 (próxima grande): orçamento, diferenciação real de LdG/burn/slow.
- Sistema de morte (punição de XP). Eventos `equip`/`talk`/`chest_open`.
- Recalibrar XP/h quando comida entrar; thresholds reais de Marca (wave de conteúdo).

**F2**
- Portar props procedurais (barril/caixa/tenda) do `prop-preview` pro `sprites.ts`
  + novos `MapDecor.kind` no WorldRenderer (handoff do protótipo aprovado).
- Conferir ShopWindow ao vivo (build/visual) — só `tsc` foi validado.
- Stack de profundidade do mundo: #3 hero props, #4 autotile, #5 composição.

**F3**
- `MOBILIA-URBANA.md` §4: placement da feira ao redor do poço (spec p/ F1 transcrever).
- Layout dos esgotos (continuação A1–A3); render do andar ativo (spec).
- Comida: decidir buff simples vs sistema de stamina (sessão de consumíveis).
