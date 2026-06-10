// Codex — wiki de design (somente leitura).
// Autocontida: renderer de markdown próprio (subset GFM), zero dependências.
// Views interativas (Bestiário/Skills/Classes) em db.js — parseiam os mesmos .md.
// Para extrair para outro projeto: copiar a pasta wiki/ + os .md e ajustar DOCS.

import { parseBestiary, parseSkills, parseClasses, parseItems, parseQuests, renderDbPage } from "./db.js";

// ---------- Registry de documentos (adicionar novos docs aqui) ----------

const DOCS = [
  { id: "filosofia", title: "Filosofia (Constituição)", file: "../DESIGN-FILOSOFIA.md",
    desc: "Os 8 pilares inegociáveis, o Teste da Mastigação e a hierarquia dos documentos." },
  { id: "visao", title: "Visão & Arquitetura", file: "../DESIGN.md",
    desc: "Visão do jogo, sistemas decididos, arquitetura sim/client e roadmap M0–M6." },
  { id: "progressao", title: "Progressão & Marcas", file: "../DESIGN-EVOLUCAO.md",
    desc: "Duas camadas: sólida (stats, skills, level) + emergente (Marcas, Mutações, Caminhos)." },
  { id: "bestiario", title: "Bestiário — Hub", file: "../DESIGN-BESTIARIO.md",
    desc: "Princípios, tiers e orçamento de ataques, biblioteca de blocos e matriz de fraquezas (Regra 10–20)." },
  { id: "bestiario-familias", title: "Bestiário — Famílias", file: "../design/bestiario/FAMILIAS.md",
    desc: "O catálogo das 12 famílias com todas as criaturas (tabelas parseadas pela view do bestiário)." },
  { id: "mundo", title: "Mundo — Hub", file: "../DESIGN-MUNDO.md",
    desc: "Filosofia de exploração, princípio MMO, permanência do mapa, recorte do MVP e nomenclatura." },
  { id: "mundo-quests", title: "Mundo — Sistema de Quests", file: "../design/mundo/SISTEMA-QUESTS.md",
    desc: "As 3 camadas (diretas, abertas, segredos), template de quest e o diário." },
  { id: "mundo-npcs", title: "Mundo — Sistema de NPCs", file: "../design/mundo/SISTEMA-NPCS.md",
    desc: "Comércio especializado e destravável, diálogo híbrido e template de NPC." },
  { id: "mundo-exploracao", title: "Mundo — Exploração", file: "../design/mundo/EXPLORACAO.md",
    desc: "Gramática de spawns, layout da área inicial, baús, portas & chaves, ferramentas e casa inicial." },
  { id: "mundo-andares", title: "Mundo — Sistema de Andares", file: "../design/mundo/SISTEMA-ANDARES.md",
    desc: "Z-levels estilo Tibia: andares empilhados, buracos vazados, escada/corda/pá/tocha, cavernas escuras, faseamento." },
  { id: "mundo-mobilia", title: "Mundo — Mobília urbana", file: "../design/mundo/MOBILIA-URBANA.md",
    desc: "Contrato de props de cidade (MapDecor: tenda/barril/caixa/poço/tocha) + placement da feira ao redor do poço da Alvorada." },
  { id: "lore", title: "Lore & História", file: "../DESIGN-LORE.md",
    desc: "Linha do tempo do mundo: a Chegada, o Primeiro Mago, a Guerra do Submundo, raças e os 5 continentes." },
  { id: "itens", title: "Itens — Hub", file: "../DESIGN-ITENS.md",
    desc: "O hub de itens: decisões-mãe, slots (modelo Tibia), raridades, instância+ledger e estudo de referência." },
  { id: "itens-equipamento", title: "Itens — Equipamento", file: "../design/itens/EQUIPAMENTO.md",
    desc: "Roster de tipos de mão, modelos de peça, famílias temáticas, kit de nascimento/rito e os catálogos T1/T2." },
  { id: "itens-consumiveis", title: "Itens — Consumíveis", file: "../design/itens/CONSUMIVEIS.md",
    desc: "Comida & cozinha (fome = portão do regen), poções (luxo de emergência) e ferramentas." },
  { id: "itens-cozinha", title: "Itens — Cozinha & Buff Food", file: "../design/itens/COZINHA.md",
    desc: "Sistema de cozinha: receitas, ingredientes/vasilhames, verbo de cozinhar, buff de refeição e os 4 tiers de comida." },
  { id: "itens-economia", title: "Itens — Economia", file: "../design/itens/ECONOMIA.md",
    desc: "Loot & gold, preços e sinks (1º passe T1 calibrado) e a discussão de economia acoplada ao PvP." },
  { id: "visual", title: "Design Visual & UI", file: "../DESIGN-VISUAL.md",
    desc: "Direção de arte, layout de tela, tokens de UI e feedback de combate." },
  { id: "quests-fatia1", title: "Quests — Fatia ① (Alvorada)", file: "../design/fatia-1-alvorada/QUESTS.md",
    desc: "Spec das 15 quests + 4 ritos da fatia ①: camadas, áreas, níveis, NPCs, XP e recompensas." },
  { id: "npcs-fatia1", title: "NPCs — Fatia ① (Alvorada)", file: "../design/fatia-1-alvorada/NPCS.md",
    desc: "O elenco batizado da fatia ①: 19 NPCs com papéis, locais e vozes + topônimos PT/EN." },
  { id: "esgotos-fatia1", title: "Esgotos — Fatia ① (Alvorada)", file: "../design/fatia-1-alvorada/ESGOTOS.md",
    desc: "Spec implementável dos 3 andares de esgoto (A1/A2/A3) em z-level real: 5 bocas, footprints, portais, baú lacrado, Q10/Q15, ghouls." },
];

// Views interativas (banco de dados) — parseadas dos .md acima em db.js
const DB_PAGES = [
  { id: "bestiario", title: "Bestiário", icon: "🐲",
    desc: "Todas as criaturas com filtros por família, tier e comportamento — em cards ou tabela." },
  { id: "skills", title: "Skills & Magias", icon: "✨",
    desc: "Kit inicial, skills comuns e roster planejado — com mutações e filtros por classe." },
  { id: "classes", title: "Classes", icon: "🛡️",
    desc: "Knight, Mage, Rogue e Priest: kits, atributos-chave e Caminhos típicos." },
  { id: "itens", title: "Itens & Equipamento", icon: "🎒",
    desc: "Catálogos T1–T2 e o roster de tipos de mão — filtros por tier, categoria e busca." },
  { id: "quests", title: "Quests", icon: "📜",
    desc: "As 15 quests + 4 ritos da fatia ① — filtros por camada, área e nível; cards com pista, etapas e recompensa." },
];

// ---------- Markdown → HTML (subset: headings, tabelas, listas, código, quote, hr, inline) ----------

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    const md = u.match(/^([\w.-]+)\.md(#.*)?$/i);
    if (md) {
      const doc = DOCS.find((d) => d.file.endsWith("/" + md[1] + ".md"));
      if (doc) return `<a href="#/${doc.id}">${t}</a>`;
    }
    return `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  s = s.replace(/✏️/g, '<span class="todo" title="número/detalhe a definir">✏️</span>');
  return s;
}

function slugify(text, used) {
  let slug = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) slug = "sec";
  let s = slug, n = 2;
  while (used.has(s)) s = `${slug}-${n++}`;
  used.add(s);
  return s;
}

// Renderiza markdown. Retorna { html, toc, sections } — sections alimentam a busca.
function renderMarkdown(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  const toc = [];
  const sections = [];
  const used = new Set();
  let cur = { heading: "(início)", id: "", text: "" };
  sections.push(cur);
  let i = 0;

  const isTableSep = (l) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-");
  const listRe = /^(\s*)([-*]|\d+[.)])\s+(.*)$/;

  function addText(t) { cur.text += " " + t; }

  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*$/.test(line)) { i++; continue; }

    // bloco de código
    if (/^```/.test(line)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; // fecha ```
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
      addText(buf.join(" "));
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = h[2].trim();
      const id = slugify(text, used);
      out.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      if (level === 2 || level === 3) toc.push({ level, text, id });
      cur = { heading: text, id, text: "" };
      sections.push(cur);
      i++;
      continue;
    }

    // hr
    if (/^\s*---+\s*$/.test(line)) { out.push("<hr />"); i++; continue; }

    // blockquote
    if (/^\s*>/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push(`<blockquote><p>${buf.map(inline).join("<br />")}</p></blockquote>`);
      addText(buf.join(" "));
      continue;
    }

    // tabela
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const splitRow = (l) =>
        l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const headers = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && !/^\s*$/.test(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      let html = "<table><thead><tr>";
      html += headers.map((c) => `<th>${inline(c)}</th>`).join("");
      html += "</tr></thead><tbody>";
      for (const r of rows) {
        html += "<tr>" + r.map((c) => `<td>${inline(c)}</td>`).join("") + "</tr>";
      }
      html += "</tbody></table>";
      out.push(html);
      addText(headers.join(" "));
      rows.forEach((r) => addText(r.join(" ")));
      continue;
    }

    // lista (com aninhamento por indentação)
    if (listRe.test(line)) {
      const items = [];
      while (i < lines.length && listRe.test(lines[i])) {
        const m = lines[i].match(listRe);
        items.push({ indent: m[1].length, ordered: /\d/.test(m[2]), text: m[3] });
        i++;
        // continuação de item (linha indentada que não é novo item)
        while (
          i < lines.length &&
          /^\s{2,}\S/.test(lines[i]) &&
          !listRe.test(lines[i])
        ) {
          items[items.length - 1].text += " " + lines[i].trim();
          i++;
        }
      }
      out.push(renderList(items, 0, addText));
      continue;
    }

    // parágrafo
    {
      const buf = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^(#{1,6})\s/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^\s*>/.test(lines[i]) &&
        !/^\s*---+\s*$/.test(lines[i]) &&
        !listRe.test(lines[i]) &&
        !(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))
      ) {
        buf.push(lines[i]);
        i++;
      }
      const text = buf.join(" ");
      out.push(`<p>${inline(text)}</p>`);
      addText(text);
    }
  }

  return { html: out.join("\n"), toc, sections: sections.filter((s) => s.text.trim()) };
}

function renderList(items, start, addText) {
  // agrupa por nível de indentação a partir de items[start]
  const base = items[start].indent;
  const ordered = items[start].ordered;
  let html = ordered ? "<ol>" : "<ul>";
  let k = start;
  while (k < items.length && items[k].indent >= base) {
    if (items[k].indent > base) {
      // sub-lista: pertence ao item anterior
      const sub = [];
      while (k < items.length && items[k].indent > base) sub.push(items[k++]);
      html = html.replace(/<\/li>$/, renderList(sub, 0, addText) + "</li>");
      continue;
    }
    let t = items[k].text;
    addText(t);
    const check = t.match(/^\[( |x)\]\s+(.*)$/i);
    if (check) {
      const checked = check[1].toLowerCase() === "x" ? " checked" : "";
      html += `<li><input type="checkbox" disabled${checked} />${inline(check[2])}</li>`;
    } else {
      html += `<li>${inline(t)}</li>`;
    }
    k++;
  }
  html += ordered ? "</ol>" : "</ul>";
  return html;
}

// ---------- Estado / carregamento ----------

const state = { docs: new Map() }; // id → { ...doc, md, html, toc, sections }
const dbData = {}; // bestiario / skills / classes (estruturas parseadas)

async function loadAll() {
  await Promise.all(
    DOCS.map(async (doc) => {
      try {
        const res = await fetch(doc.file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const md = await res.text();
        state.docs.set(doc.id, { ...doc, md, ...renderMarkdown(md) });
      } catch (err) {
        state.docs.set(doc.id, {
          ...doc,
          md: "",
          html: `<p>⚠ Não foi possível carregar <code>${esc(doc.file)}</code> (${esc(String(err))}).</p>`,
          toc: [],
          sections: [],
        });
      }
    })
  );
}

function buildDb() {
  // Bestiário pós-split (jun/2026): tiers/matriz vivem no hub, famílias no
  // sub-doc — o parser é sequencial, então concatenamos os dois textos.
  const best = state.docs.get("bestiario");
  const fams = state.docs.get("bestiario-familias");
  if (best?.md || fams?.md) {
    dbData.bestiario = parseBestiary(`${best?.md ?? ""}\n${fams?.md ?? ""}`);
  }
  const evo = state.docs.get("progressao");
  if (evo?.md) {
    dbData.skills = parseSkills(evo.md);
    dbData.classes = parseClasses(evo.md);
  }
  // Catálogos/roster de itens vivem no sub-doc EQUIPAMENTO.md (split jun/2026).
  const it = state.docs.get("itens-equipamento");
  if (it?.md) dbData.itens = parseItems(it.md);
  const qs = state.docs.get("quests-fatia1");
  if (qs?.md) dbData.quests = parseQuests(qs.md);
}

// ---------- Navegação ----------

const $nav = document.getElementById("nav");
const $doc = document.getElementById("doc");

function buildNav() {
  const dbItems = DB_PAGES.map(
    (p) => `<div class="nav-db" data-page="${p.id}">
      <a href="#/db/${p.id}"><span class="nav-icon">${p.icon}</span>${esc(p.title)}</a>
    </div>`
  ).join("");

  const docItems = DOCS.map((d) => {
    const loaded = state.docs.get(d.id);
    const toc = (loaded?.toc ?? [])
      .map(
        (t) =>
          `<li><a class="toc-h${t.level}" href="#/${d.id}/${t.id}">${esc(t.text)}</a></li>`
      )
      .join("");
    return `<div class="nav-doc" data-doc="${d.id}">
      <a href="#/${d.id}">${esc(d.title)}</a>
      <ul class="nav-toc">${toc}</ul>
    </div>`;
  }).join("");

  $nav.innerHTML =
    `<div class="nav-group">Banco de dados</div>${dbItems}` +
    `<div class="nav-group">Documentos</div>${docItems}`;
}

function renderHome() {
  $doc.innerHTML = `
    <header class="home-hero">
      <h1>⚔ Codex</h1>
      <p>Wiki de design do RPG — leitura e consulta rápida.<br />
      A fonte da verdade são os <code>DESIGN-*.md</code> do repositório; o banco de dados é parseado deles.</p>
    </header>
    <h2 class="home-group">Banco de dados <span>— views interativas com filtros e ordenação</span></h2>
    <div class="home-grid">
      ${DB_PAGES.map(
        (p) => `<a class="home-card db" href="#/db/${p.id}">
          <span class="hc-icon">${p.icon}</span>
          <strong>${esc(p.title)}</strong>
          <span class="hc-desc">${esc(p.desc)}</span>
        </a>`
      ).join("")}
    </div>
    <h2 class="home-group">Documentos de design <span>— texto completo; busca na barra lateral</span></h2>
    <div class="home-grid">
      ${DOCS.map(
        (d) => `<a class="home-card" href="#/${d.id}">
          <strong>${esc(d.title)}</strong>
          <span class="hc-desc">${esc(d.desc ?? "")}</span>
          <span class="hc-file">${esc(d.file.replace("../", ""))}</span>
        </a>`
      ).join("")}
    </div>`;
}

function route() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [head, ...rest] = hash.split("/");

  document
    .querySelectorAll(".nav-doc, .nav-db")
    .forEach((el) => el.classList.remove("active"));

  // home
  if (!head) {
    $doc.classList.add("wide");
    renderHome();
    window.scrollTo(0, 0);
    return;
  }

  // banco de dados: #/db/<page>
  if (head === "db") {
    const page = rest[0];
    document.querySelector(`.nav-db[data-page="${page}"]`)?.classList.add("active");
    $doc.classList.add("wide");
    renderDbPage($doc, page, dbData);
    window.scrollTo(0, 0);
    return;
  }

  // documento
  const anchor = rest[0];
  const doc = state.docs.get(head) ?? state.docs.get(DOCS[0].id);
  if (!doc) return;

  document.querySelectorAll(".nav-doc").forEach((el) => {
    el.classList.toggle("active", el.dataset.doc === doc.id);
  });

  $doc.classList.remove("wide");
  $doc.innerHTML =
    `<p class="doc-meta">Fonte: <code>${esc(doc.file.replace("../", ""))}</code> — edite no repositório.</p>` +
    doc.html;

  if (anchor) {
    const target = document.getElementById(anchor);
    if (target) {
      target.scrollIntoView();
      target.classList.add("flash");
      setTimeout(() => target.classList.remove("flash"), 1700);
    }
  } else {
    document.getElementById("content").scrollTop = 0;
    window.scrollTo(0, 0);
  }
}

// ---------- Busca ----------

const $search = document.getElementById("search");
const $results = document.getElementById("search-results");

function snippet(text, q) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + q.length + 60);
  let s = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  s = esc(s).replace(new RegExp(escRegex(esc(q)), "gi"), (m) => `<mark>${m}</mark>`);
  return s;
}
function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function doSearch() {
  const q = $search.value.trim();
  if (q.length < 2) {
    $results.hidden = true;
    $results.innerHTML = "";
    return;
  }
  const hits = [];
  for (const doc of state.docs.values()) {
    for (const sec of doc.sections) {
      const haystack = sec.heading + " " + sec.text;
      if (haystack.toLowerCase().includes(q.toLowerCase())) {
        hits.push({ doc, sec });
        if (hits.length >= 30) break;
      }
    }
    if (hits.length >= 30) break;
  }
  $results.hidden = false;
  $results.innerHTML = hits.length
    ? hits
        .map(
          ({ doc, sec }) =>
            `<a class="search-hit" href="#/${doc.id}${sec.id ? "/" + sec.id : ""}">
              <span class="hit-where">${esc(doc.title)} › ${esc(sec.heading)}</span>
              <span class="hit-snippet">${snippet(sec.heading + " — " + sec.text, q)}</span>
            </a>`
        )
        .join("")
    : `<div class="search-empty">Nada encontrado para “${esc(q)}”.</div>`;
}

$search.addEventListener("input", doSearch);
$results.addEventListener("click", () => {
  $results.hidden = true;
  $search.value = "";
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#search-box")) $results.hidden = true;
});

// ---------- Boot ----------

window.addEventListener("hashchange", route);

await loadAll();
buildDb();
buildNav();
route();
