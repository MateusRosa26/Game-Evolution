# Mundo — Sistema de quests (as 3 camadas)

> Sub-documento de [DESIGN-MUNDO.md](DESIGN-MUNDO.md) (hub). As specs CONCRETAS por fatia vivem em `design/fatia-1-alvorada/QUESTS.md` (e equivalentes das fatias futuras) — este doc é o SISTEMA (camadas, templates, diário).

# Quests — três camadas

| Camada | Como o jogador descobre | Guia | Recompensa típica |
|---|---|---|---|
| **Direta** | NPC oferece e explica | 📍 marca o local no mapa | gold, XP, consumíveis, gear comum–incomum |
| **Aberta** | NPC dá rumor com direção vaga | só o texto no diário | gear raro, acesso a áreas, skills intermediárias |
| **Segredo** | nunca é anunciada — só explorando | nenhum | os melhores itens fora de boss (raro–lendário) |

## Composição e ritmo (direção do criador, jun/2026)

- **Quests compostas/encadeadas**: começam com algo muito pequeno e mandam cada vez mais longe; ou passam de NPC em NPC ("fale com fulano" → "agora com beltrano"). A cadeia é a forma natural de quest grande.
- **Quests de longa maturação**: podem COMEÇAR no lvl 1 mas só terminam muito depois — a etapa final exige área difícil. O diário acumula pendências que amadurecem com o personagem (promessas em forma de quest).
- **Early game tem volume**: quests simples e rápidas logo no começo, que dão **direção** (apontam spots/estradas/serviços) e **gold inicial para a primeira classe** — a classe é **comprada + quest simples** (decidido em frente própria; ver DESIGN-EVOLUCAO). Quests um pouco mais elaboradas dão XP e empurram a exploração do mundo.
- Quests vivem em **conversa/doc próprios** — separadas do design de layout (o layout só planta os ganchos físicos: ferreiro, coveiro, moinho, baú lacrado, muralha inacabada...).

## Quests diretas (guiadas)

A espinha de progressão. Ensinam as zonas, apresentam as famílias de mob, dão o ritmo do early game de cada região.

- Formato clássico: *mate X*, *leve item Y a Z*, *vá até o local e volte*.
- O NPC marca o ponto no mapa do jogador (📍). A marca é a **única** ajuda — sem seta na tela, sem distância.
- Recompensas previsíveis e modestas: são o "salário", não o tesouro.
- **Contagem de caça SÓ nas diretas (decidido jun/2026):** a entrada do diário mostra contador discreto ("4/8") — mesma lógica do 📍 (a direta é a camada-salário, exceção consciente da constituição). Abertas e segredos: **nunca**.

## Quests abertas (rumores)

O coração do estilo Apogea. O NPC dá **direção + contexto narrativo**, e o jogador interpreta:

> *"Dizem que onde os corvos circulam, a leste do moinho velho, ninguém volta inteiro. Mas o velho Tobias voltou — e voltou rico."*

- **Sem marker, nunca.** A entrada do diário guarda as palavras do NPC; o resto é com o jogador.
- **Regra de escrita:** toda quest aberta precisa de **2–3 referências localizáveis no mundo** (o moinho existe, os corvos sobrevoam o lugar de verdade). A pista é justa — difícil ≠ adivinhação.
- Hint adicional não vem de UI: vem de **outro NPC** (sussurrador) que comenta o mesmo assunto por outro ângulo.
- Recompensa sempre acima da camada direta: o jogo paga a exploração.

## Segredos (quests não anunciadas)

Estilo Tibia clássico: **o baú no fim do lugar perigoso É a quest.** Não existem no diário até serem encontrados.

- Alavanca atrás da cachoeira, parede rachada na cripta, anel dentro de árvore oca, ilhota alcançável por um único caminho.
- Alguns são totalmente mudos; outros têm rumor de sussurrador apontando vagamente ("luzes na cripta ao norte...").
- Ao completar, viram **registro no diário** ("Encontrei a câmara sob a cachoeira") — o diário se torna o troféu de exploração do personagem.
- É aqui que moram os melhores itens fora de boss.

## Template de quest

```
### <Nome>
- Camada: <direta / aberta / segredo>
- NPC / gatilho: <quem dá, ou o que dispara (alavanca, item, região)>
- Requisitos: <nível mínimo? quest anterior? item?>
- Texto-pista: <as palavras exatas do NPC / da placa — para abertas, listar as 2–3 referências localizáveis>
- Etapas: <o que a sim rastreia: kill / item / talk / region_enter>
- Recompensa: <gold, XP, item (raridade), acesso>
- Registro no diário: <texto da entrada>
```

## Diário (journal)

- Painel por hotkey (ver layout em `DESIGN-VISUAL.md`). Entradas escritas **com as palavras do NPC**, não objetivos secos.
- Quests diretas mostram 📍 que abre o mapa; abertas só o texto; segredos aparecem **depois** de descobertos, como memória.
- Sem porcentagem de completion global visível ✏️ (proposta: não ter — o jogador nunca sabe quantos segredos faltam).
