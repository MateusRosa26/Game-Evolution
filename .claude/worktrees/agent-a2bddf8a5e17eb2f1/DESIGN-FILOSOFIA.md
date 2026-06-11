# Filosofia de Design — A Constituição

> Documento-mãe. Curto de propósito: aqui vivem os **pilares inegociáveis** e o teste que toda feature precisa passar. O detalhe de cada princípio vive nos docs específicos (apontados em cada seção). Toda skill de design do repo (`.claude/skills/`) carrega este documento como critério de veto.

## O jogo que estamos fazendo

Um RPG **difícil, opaco e recompensador** — na contramão dos jogos modernos que mastigam tudo. Sem setas brilhantes, sem objetivos rastreados na tela, sem tutorial que segura a mão. O jogo é para ser **descoberto**, é para ser **punitivo**, e jogar é para ser uma **aventura**.

A referência emocional: a primeira vez jogando Tibia/Apogea — perdido, ameaçado, e cada descoberta era SUA.

## Os 8 pilares

### 1. O jogo é descoberta
Nada que o design quer oculto ganha contador, barra, %, marker ou seta. O oculto **se revela** (hint vago aos ~50%), nunca se lista. Quem quer saber, explora, conversa, teoriza com a comunidade.
→ Detalhe: `DESIGN-EVOLUCAO.md` (Visibilidade), `DESIGN-MUNDO.md` (3 camadas de quest, journal sem tracker).

### 2. Punitivo, nunca injusto
Mobs são fortes — até o T1 pune descuido. Morte custa. MAS: difícil ≠ adivinhação. Toda pista é justa (2–3 referências localizáveis no mundo), todo perigo é legível no momento do confronto (telegrafia), toda morte ensina algo. Punir o descuido ≠ roubar o jogador.
→ Detalhe: `DESIGN-BESTIARIO.md` (princípio 1), `DESIGN-MUNDO.md` (regra de escrita de quest aberta).

### 3. Recompensa proporcional à opacidade
Quanto menos o jogo te guiou até algo, melhor o prêmio. Quest com marker paga salário; rumor vago paga bem; segredo nunca anunciado paga o melhor. Vale para itens, skills, áreas e conhecimento.
→ Detalhe: `DESIGN-MUNDO.md` (camadas de quest, tipos de baú).

### 4. Informação é loot
Rumores, livros, keywords de NPC, placas — valem tanto quanto item. Falar com todo mundo é jogar bem. A informação flui pelo MUNDO (NPCs, objetos), nunca pela UI.
→ Detalhe: `DESIGN-MUNDO.md` (sussurradores, keywords, rumores que evoluem).

### 5. Nomeado e narrativo > numérico
"Quebra-Ossos" > "+15% dano vs mortos-vivos". O nome É a recompensa social. Tudo que é raro tem nome próprio e flavor; números ficam para o vocabulário base.
→ Detalhe: `DESIGN-EVOLUCAO.md` (pilares das Marcas), `DESIGN-MUNDO.md` (nomenclatura, 5 fontes).

### 6. Identidade emerge do que você FEZ
A build vem de stats/skills (camada sólida, clara e completa); a **identidade** vem do comportamento cristalizado (Marcas/Mutações/Caminhos). Ninguém escolhe quem é num menu — acontece jogando. E história não reseta: conduta quebrada = perdida; ledger viaja com o item.
→ Detalhe: `DESIGN-EVOLUCAO.md` (inteiro).

### 7. Sem grind obrigatório, sem treadmill
Dificuldade vem de perigo e opacidade, nunca de espera. Nada de treinar skill AFK, encantamento que expira, imposto de manutenção. Grind brutal existe (thresholds de Marca) mas é **opcional e emergente** — nunca requisito de progressão.
→ Detalhe: `DESIGN-EVOLUCAO.md` (regra de ouro do balance), `DESIGN-ITENS.md` (economia — descartado treadmill).

### 8. O mundo não gira em torno do jogador
Princípio MMO desde o dia 1: o mundo é de todos, o progresso é do personagem. Nada que um jogador faz remove conteúdo dos outros. O mundo é estável, indiferente e maior que você — é isso que faz a aventura ser real.
→ Detalhe: `DESIGN-MUNDO.md` (princípio MMO).

## O Teste da Mastigação

Toda feature nova (mecânica, UI, quest, item, texto) responde antes de entrar:

1. **Isso mostra um caminho que o jogador deveria descobrir?** (seta, marker, glow, tracker) → corta.
2. **Isso adiciona contador/barra/% a algo desenhado para ser oculto?** → corta.
3. **Isso perdoa automaticamente o descuido que deveria punir?** (auto-save antes do perigo, aviso de área perigosa, undo) → corta.
4. **O jogador apressado recebe o mesmo que o explorador?** → errado; reequilibra a recompensa.
5. **Essa informação poderia vir do mundo (NPC, livro, placa, visual da cena) em vez da UI?** → então vem do mundo.
6. **Isso cria espera disfarçada de dificuldade?** (timer, manutenção, repetição vazia) → corta.
7. **Um veterano de Tibia acharia isso "mastigado"?** → ouve o veterano.

**Exceções existem** — mas são decisão consciente do criador, registradas no doc relevante (ex: quest direta TEM marker por design — é a camada-salário; a barra de XP é visível porque a camada sólida é clara por contrato).

## O que punitivo NÃO é (anti-padrões)

- Dano surpresa sem nenhuma telegrafia ou padrão aprendível
- Pista impossível (adivinhação pura, pixel hunting sem lógica)
- Perda por obscuridade de CONTROLE (o jogador não sabia que botão apertar)
- Tempo desperdiçado artificial (corpse run vazio, espera, viagem sem decisão)
- Punição que não ensina nada na segunda vez

A régua: **o jogador que morreu deve pensar "a culpa foi minha"** — e saber o que fará diferente.

## Hierarquia dos documentos

| Doc | Autoridade sobre |
|---|---|
| `DESIGN-FILOSOFIA.md` | os pilares — em conflito, este doc vence |
| `DESIGN.md` | visão geral, arquitetura, roadmap |
| `DESIGN-EVOLUCAO.md` | progressão, Marcas/Mutações/Caminhos, classes, skills |
| `DESIGN-BESTIARIO.md` | criaturas, famílias, tiers |
| `DESIGN-MUNDO.md` | exploração, quests, NPCs, baús, nomenclatura |
| `DESIGN-LORE.md` | história, cânone, linha do tempo |
| `DESIGN-ITENS.md` | equipamento, raridades, economia |
| `DESIGN-VISUAL.md` | direção de arte, UI, feedback |

✏️ Seções marcadas assim em qualquer doc são do criador — skills propõem, criador decide.
