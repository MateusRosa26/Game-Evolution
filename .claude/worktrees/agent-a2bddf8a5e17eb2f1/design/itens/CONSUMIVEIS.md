# Itens — Consumíveis (comida & cozinha, poções, ferramentas)

> Sub-documento de [DESIGN-ITENS.md](DESIGN-ITENS.md) (o hub: decisões-mãe, slots, raridades, instância+ledger). Aqui vive o **sustain consumível**: comida/cozinha, poções e ferramentas. Equipamento em [EQUIPAMENTO.md](EQUIPAMENTO.md); preços/economia em [ECONOMIA.md](ECONOMIA.md). O **sistema de cozinha** (receitas, ingredientes, vasilhames, verbo de cozinhar, buff de refeição, 4 tiers) tem doc próprio: [COZINHA.md](COZINHA.md).

## Consumíveis — Comida & Cozinha (decidido — jun/2026, BASE Apogea, sistema PRÓPRIO)

O sistema de comida é a **fundação do sustain**. Referência explícita do criador: o modelo do Apogea é melhor e mais completo que o do Tibia — **usamos como base de pensamento, mas o sistema é NOSSO** (✏️ Designer de Sistemas desenha a identidade própria em cima dos fundamentos abaixo; não copiar receitas/números):

- **Fome como portão do regen**: o regen natural de HP/mana **só funciona saciado**. Comida comum e barata (pão, carne assada) mantém o regen ligado — é o arroz-com-feijão do caçador, sempre na mochila.
- **Comida cozida = buff food**: receitas preparadas dão **regen melhor + stats temporários por duração** (ex. Apogea: dano+1 + vel. ataque + regen por ~5min; regen forte + habilidade por ~8min). É o "luxo acessível" do dia-a-dia — e cria a decisão de custo-por-minuto antes da caçada.
- **Cozinhar NÃO é skill com level** (modelo Apogea): é atividade de utilidade — fogueira/cozinha como estação, **receitas como conhecimento descobrível** (livros, NPCs, experimentação ✏️) — encaixa direto no pilar "informação é loot".
- **Ingredientes vêm do mundo**: carnes da caça (loot tables), **pesca** (vara = ferramenta), forrageio/hortas, compra e intermediários (massa, queijo ✏️).
- **Divisão de papéis do sustain** (a hierarquia que evita degenerar): regen base (saciado) → kit de classe (*Primeiros Socorros*/*Curar Ferimentos*) → buff food (planejamento) → **poção (emergência cara)**.
- **Fome — modelo de DURAÇÃO (decidido jun/2026, modelo Tibia):** cada comida ativa a saciedade por um **tempo específico do alimento** (pão X min, assado Y min…); acabou a duração, precisa comer de novo. **Sem comida ativa, a ÚNICA consequência é o regen natural de HP/mana desligado** — nenhum debuff, nenhum dano, nada além disso. Durações e valores por alimento ✏️ Balancista (bateria M2, junto da economia de comida).
- ✏️ Quest do cozinheiro (modelo *Licensed Chef* do Apogea) — destrava estação/receitas; fatia ①.

### Esqueleto do sistema próprio (direção do criador — peças do Apogea a TRADUZIR, não copiar)

| Peça | O que é | Decisão/nota |
|---|---|---|
| **Cru × cozido** | todo ingrediente animal existe em 2 estados | **decidido**: cru sacia MENOS, **sem risco** (nada de efeito ruim). E **receitas usam cru OU cozido conforme a receita** — usar cru não torna a receita pior; é dimensão de ingrediente, não hierarquia de qualidade |
| **Fogueiras** | estação de cozinha do MUNDO | **decidido: FIXAS pelo mapa, NUNCA montáveis** — cozinhar exige **planejamento** (preparar na cidade) ou **achar fogueiras espalhadas** (acampamentos, clareiras — viram pontos de descanso/landmark; o world-designer as posiciona como beats de vale) |
| **Utensílios** | itens que destravariam categorias de receita (pote p/ caldos, espeto…) | ✏️ **EM AVALIAÇÃO — pensar mais a fundo SE existe**; se entrar: pote+água (poço/rio) → caldos/sopas. **Adagas e facas cortam alguns tipos de comida** (decidido) — arma serve de utensílio de corte |
| **Sanduíches/montados** | comida FRIA montada (pão + recheios), sem fogo | a comida de viagem: prepara na cidade, come na dungeon — categoria própria |
| **NPC que compra comida** | cozinheiro/estalajadeiro compram ingredientes E pratos prontos | **renda não-combate**: caçar→cozinhar→vender vira loop legítimo (entra no mapa de comércio) |

- A régua das categorias (esforço/conhecimento ↑ = recompensa ↑): **assado** (fogueira, simples) < **prato de receita** (descoberta, buff food); caldos/sopas condicionados à decisão de utensílios ✏️.
- ✏️ Identidade própria a desenhar (Designer de Sistemas + Loremaster): pratos regionais por cidade? qualidade por ingrediente? — o que nos torna NÓS e não um clone do Apogea.

## Consumíveis — Poções (decidido — jun/2026)

- **Poção de vida em 3 tamanhos: pequena / média / grande.**
- **Poção é LUXO até certo nível**: cara em relação ao gold/hora do early. **Preço da Pequena calibrado (criador, jun/2026): 65 gold ≈ ~33min de caça T1 informada** (report `2026-06-05-economia-gold-passe1.md`) — meia hora de caça por UMA emergência. Anti-degeneração dupla: poção não pode (a) **cobrir falha de gameplay com dinheiro**, nem (b) permitir **caçar acima do tier expamando poção** porque o gold sobrou. Papel: **emergência** — o sustain de rotina é comida + kit (ver Comida & Cozinha).
- **Acesso escalonado com barreira ALTA (revisado)**: a *pequena* no vendor padrão da cidade (cara pro novato); a **média atrás de quest T2+** — **não vinculada às quests iniciais**, é conquista do mid-game; a **grande atrás de barreira T3+/NPCs específicos remotos**. Nunca nos vendors padrão.
- ⚠️ Interação com o sustain de classe e comida: poção complementa, **nunca substitui** — se virar o sustain principal, os números estão errados (Balancista).
- ✏️ Poção de mana: mesma lógica de tamanhos/barreiras? — a decidir.
- ✏️ Stack/peso de poções: limite natural de inventário é parte do anti-spam.

## Ferramentas (corda/pá/tocha) — economia

Mecânica decidida em `design/mundo/EXPLORACAO.md` §Ferramentas de exploração. Lado item (✏️ detalhar na fatia ①): proposta — **corda e pá permanentes** (ferramenta de verdade, compra única não-trivial), **tocha consumível** (queima); "bem pensadas" é requisito do criador — cada uma com peso/slot/preço que torne o kit do aventureiro uma DECISÃO de mochila, não um checkbox.
