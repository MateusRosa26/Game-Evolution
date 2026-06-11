# Mundo — Sistema de NPCs (comércio, diálogo, templates)

> Sub-documento de [DESIGN-MUNDO.md](DESIGN-MUNDO.md) (hub). O elenco concreto da fatia ① vive em `design/fatia-1-alvorada/NPCS.md` (e equivalentes das fatias futuras) — este doc é o SISTEMA (papéis, comércio, diálogo, templates).

# NPCs — quatro papéis

Papéis se **misturam no mesmo NPC** (o ferreiro vende, treina Knights e tem uma quest pessoal):

| Papel | Função | Já decidido em |
|---|---|---|
| **Treinador** | vende skills (classe + nível + gold) | `DESIGN-EVOLUCAO.md` |
| **Mercador** | compra/venda de itens — gold sink da economia | — |
| **Quest giver** | oferece quests diretas e abertas | — |
| **Sussurrador** | solta rumores: pistas de baús, segredos, áreas — e até **hints de Marcas** | — |

## Comércio especializado e destravável (decidido — jun/2026, modelo Apogea)

**Não existe vendedor universal.** Cada NPC compra e vende um **sortimento próprio**, coerente com quem ele é:

- **Compra especializada**: nem todo NPC compra todo item. Loot de mob tem **compradores específicos** (o caçador compra peles; o alquimista, glândulas; o ferreiro, sucata de arma). Vender bem = conhecer a cidade.
- **Trade destravado por quest**: alguns NPCs **só passam a comprar/vender certos itens depois da quest deles** — principalmente loots de mob e itens do gênero. A relação comercial é recompensa de quest: o NPC passa a confiar em você.
- **Consequência desejada**: "quem compra o quê" vira **conhecimento-loot** (pilar 4) — o mapa mental de comércio da cidade é descoberto falando com todo mundo, e cada quest feita melhora a sua economia pessoal. No online, esse conhecimento circula como as rotas de hunt.
- ✏️ Tabelas de sortimento por NPC: nascem com os NPCs da fatia (junto com loot tables, `DESIGN-ITENS.md`).

**Distribuição urbana (decidido):** o **cluster de utilidade essencial** (depot + mercado básico + praça) cria o hub — mas os demais NPCs ficam **espalhados pela cidade**: quests, compradores especializados e sussurradores moram em becos, no cais, na capela, junto à muralha. Andar a cidade inteira e falar com todo mundo é jogar bem — o hub concentra a rotina, os cantos escondem o valor.

**Sussurradores são o papel-chave do estilo.** O bêbado da taverna, o eremita, a criança que viu algo: NPCs cuja única função é fazer o sistema de descoberta girar sem UI. Todo rumor de sussurrador é **verdadeiro** (talvez distorcido, nunca falso) — o jogador precisa confiar no sistema para o hábito de "falar com todo mundo" se formar.

**Rumores evoluem com o progresso (decidido):** os rumores de uma região são **fixos** (não rotacionam por visita), mas completar quests **desbloqueia novas camadas** — o mesmo NPC passa a falar de coisas novas, revelando aspectos do mundo que antes não mencionava. Voltar a falar com NPCs conhecidos depois de uma quest é sempre potencialmente recompensador. É também o veículo da **storyline**: o mundo se revela em camadas, no ritmo do progresso de cada jogador.

## Diálogo — híbrido (decidido)

Janela de diálogo moderna com **opções clicáveis** + **campo de texto livre**:

- Opções cobrem o essencial: comércio, treino, quests oferecidas, despedida. Zero fricção no dia-a-dia.
- O campo de texto aceita **palavras-chave**: digitar algo que o NPC reconhece abre falas que nenhuma opção lista. É a camada Tibia — segredos de diálogo existem.
- **Keywords se aprendem ouvindo:** termos "digitáveis" aparecem com **destaque sutil** nas falas dos NPCs (✏️ tratamento visual — algo discreto, não link azul). Ouviu "cripta" do taverneiro → pode digitar "cripta" para o coveiro.
- Keyword não reconhecida: resposta genérica do NPC ("Não sei nada disso."), igual Tibia.

## Template de NPC

```
### <Nome> — <ocupação>, <local>
- Papéis: <treinador? mercador? quest giver? sussurrador?>
- Personalidade: <uma frase — define a voz das falas>
- Vende / treina: <itens, skills>
- Quests: <que quests dá, de que camada>
- Keywords secretas: <palavra → fala desbloqueada>
- Rumores que solta: <pistas de quais segredos/áreas>
```
