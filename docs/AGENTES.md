# Como trabalhamos — agentes em paralelo neste repo

> Modelo decidido em 10/jun/2026, substituindo a divisão antiga por dono-de-árvore
> (F1 sim / F2 client / F3 design). Aquela cortava por **camada**, mas toda feature
> é **vertical** (cruza sim+shared+client) → forçava cada feature pela fila
> F3→F1→F2, que travava. Leia também `CLAUDE.md` (arquitetura) e a constituição
> `DESIGN-FILOSOFIA.md`.

## A regra-mãe

**N chats simultâneos = N worktrees, 1 feature VERTICAL por chat.** Cada chat pega
uma feature e a faz inteira — sim → shared → client → arte (placeholder) — sem
esperar outro agente. O isolamento por worktree torna colisão de arquivo
**impossível por construção**; o resto é convenção mínima.

Por que vertical e não por camada: a dor real é o criador rodando 3-4 chats e tendo
que *"dar instruções que não conflitem"*. Isso tem dois custos — (1) conflito de
arquivo e (2) coordenação de tempo ("espera o outro adicionar o campo"). Worktree
mata o #1; feature auto-contida mata o #2 (acaba a fila de espera).

## O fluxo de uma feature

```
1. git worktree add ~/rpg-worktrees/<slug> -b feat/<slug> <base>   (base = main atual)
   └─ symlink do node_modules (ver swarm-worktree-setup); porta de dev própria
2. o chat faz a fatia vertical, INVOCANDO o skill do domínio que tocar
3. "pronto" =  npx tsc --noEmit limpo
            ·  visto/rodado NO JOGO (não só headless — FPS headless é SwiftShader)
            ·  bate com a constituição (DESIGN-FILOSOFIA.md)
            ·  decisão confirmada escrita no DOC de design
            ·  estado em voo escrito na MEMÓRIA
4. merge no main · apaga o branch
```

Branch **curto**: branch longo diverge e vira fila-de-merge. Feature grande demais
pra caber num contexto? Então **são duas features** ligadas por um contrato
congelado — não uma feature sub-dividida.

## Os skills são a guarda da visão (não papéis, não donos de pasta)

A parte BOA dos "3 agentes" eram os skills — cada um carrega a constituição como
veto. Eles continuam, invocados **quando o trabalho toca o domínio**:

| Domínio | Skill |
|---|---|
| Mecânica / sistema / filosofia | `designer-de-sistemas` |
| Números (dano/XP/custo/curva) | `balancista` |
| Sprite / UI / pixel art / "ficou feio" | `diretor-de-arte` |
| Nome / flavor / lore / cânone | `loremaster` |
| Mapa / zona / spawn / POI | `world-designer` |

Coerência da visão é um **passo dentro da feature**, não um agente atrás dela na fila.

## As 2 regras que evitam dor

1. **`src/shared` (`protocol.ts` / `types.ts`) é o único ponto que colide mesmo em
   worktrees** — cada feature tende a adicionar um campo no protocolo. Convenção:
   quem precisa de campo novo **adiciona**; os outros **dão rebase**. Serializa só o
   contrato, nunca a feature inteira.
2. **Em working tree COMPARTILHADO** (vários chats no mesmo dir, ex.: `main`):
   só `git add <arquivos específicos>` + commit. **NUNCA** `git reset --hard`,
   `git checkout .`, `git stash`, nem trocar de branch — apagam o não-commitado dos
   outros chats. (Worktree próprio por chat elimina isso na raiz.)

## A arquitetura do CÓDIGO continua (≠ divisão de trabalho)

A separação **sim pura ↔ client burro ↔ shared serializável** (REGRA DE OURO do
`CLAUDE.md`) é arquitetura para o online — **fica intacta**. O que mudou foi só a
organização de *quem faz o quê*: um chat atravessa as três camadas na sua feature.

## Durabilidade mora no DISCO

Chat é cursor descartável que reidrata do disco. O que sobrevive ao reset:
**git** (código), **docs de design** (a visão — decisão confirmada vira doc), e
**memória** (estado em voo + gotchas). Se não está no disco, não existe no próximo chat.

## NÃO construir agora (YAGNI)

Governança pesada (guardião como papel, definition-of-done cerimonial em fases,
contract-first como protocolo, regras de sub-despacho) fica pro dia em que a dor
aparecer. **Gatilho futuro único:** um `WORK-BOARD.md` (3 linhas por chat:
*trabalhando em X · arquivos Y · status*) entra SE o glance do `src/shared` começar
a doer (você inseguro se alguém está mexendo no contrato) — não antes.

---

Relacionado na memória: `modelo-trabalho-worktree`, `swarm-worktree-setup`.
