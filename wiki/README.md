# Codex — wiki de design (somente leitura)

Wiki estática que renderiza os documentos de design do jogo (`DESIGN*.md` na raiz do projeto). **Fonte única da verdade são os arquivos markdown** — a wiki só lê; toda edição é feita nos `.md` via repositório.

## Como acessar

Com o dev server do jogo rodando (`npm run dev`):

```
http://localhost:5173/wiki/
```

## Como adicionar um documento novo

1. Crie o `DESIGN-XXX.md` na raiz do projeto.
2. Adicione uma entrada no array `DOCS` em `wiki/wiki.js`:

```js
{ id: "xxx", title: "Título no menu", file: "../DESIGN-XXX.md" }
```

Pronto — navegação, índice por seção e busca passam a incluir o doc automaticamente.

## Banco de dados (views interativas)

Além da leitura dos docs, a wiki tem três views estruturadas com **filtros e ordenação** (`db.js`):

- **`#/db/bestiario`** — todas as criaturas em cards (agrupadas por família) ou tabela; filtros por família, tier (com faixa de nível), comportamento, bruto/signature; busca e ordenação.
- **`#/db/skills`** — kit inicial M1, skills comuns e roster planejado, com mutações; filtros por classe e grupo.
- **`#/db/classes`** — os 5 atributos + as 4 classes com kit, lentes e Caminhos típicos.

**Os dados são parseados dos próprios `.md`** (zero duplicação — os docs continuam sendo a fonte única da verdade). Os parsers em `db.js` dependem da estrutura dos documentos:

- Bestiário: headings de família `## N. Nome (T1–T3) — tagline`, tabelas com colunas `Criatura | Tier | Comportamento | Ataques | Notas`, tabela de tiers (seção "Tiers") e "Matriz de fraquezas".
- Skills: blocos `#### Nome (Classe)` sob `### Skills comuns` / `### Kit inicial`, bullets `- **Campo:** valor`, mutações em lista numerada; tabela do `### Roster planejado`.
- Classes: blocos `### Nome` sob `## Classes`, bullets de Fantasia/Kit/Atributos/Lentes e Caminhos numerados; tabela de atributos.

Se mudar a estrutura nos `.md`, ajustar os parsers correspondentes em `db.js`.

## Arquitetura (de propósito)

- **Zero dependências**: HTML + CSS + JS puros, renderer de markdown próprio (subset GFM: headings, tabelas, listas aninhadas, código, citações, links, checkboxes). Nada de CDN, funciona offline.
- **Zero acoplamento com o jogo**: não importa nada de `src/`. O Vite só serve os arquivos.
- **Busca** client-side por seção (heading) em todos os docs carregados.
- Deep-link por hash: `#/bestiario/tiers-e-orcamento-de-ataques-decidido`, `#/db/bestiario`.

## Como extrair para um projeto separado (futuro)

1. Copie a pasta `wiki/` e os arquivos `DESIGN*.md`.
2. Coloque os `.md` ao lado da pasta (ou ajuste os paths em `DOCS` no `wiki.js`).
3. Sirva com qualquer servidor estático (`npx serve`, GitHub Pages, Netlify, nginx…). Não há build.
