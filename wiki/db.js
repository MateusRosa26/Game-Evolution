// db.js — Banco de dados do Codex: parsers dos .md + views interativas
// (Bestiário, Skills & Magias, Classes). Zero dependências; importado por wiki.js.
//
// IMPORTANTE: os parsers dependem da ESTRUTURA dos documentos (headings e
// colunas das tabelas). Os .md continuam sendo a fonte única da verdade —
// se mudar o formato lá, ajustar os parsers aqui.

// ---------- util ----------

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// mini-markdown inline (code, bold, italic) para células/campos
function fmt(s) {
  s = esc(s);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  s = s.replace(/✏️/g, '<span class="todo" title="número/detalhe a definir">✏️</span>');
  return s;
}

const splitRow = (l) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const isSep = (l) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(l) && l.includes("-");

const emptyMsg = () =>
  `<div class="db-empty">Nenhum resultado com os filtros atuais.</div>`;

// ---------- cores (alinhadas ao DESIGN-VISUAL.md) ----------

const FAMILY_COLORS = {
  Bestial: "#b07840",
  Humanoides: "#c0aa80",
  Vermes: "#8aa83c",
  Plantas: "#58c878",
  "Aquáticos": "#4a9cc8",
  Voadores: "#a8c4e0",
  "Mortos-Vivos": "#a88ad8",
  "Dracônicos": "#e06a3a",
  Gigantes: "#c89a4b",
  Elementais: "#6a8ad8",
  "Míticos": "#e8c84b",
  "Demônios": "#d84a6a",
};

const TIER_COLORS = { T1: "#58c878", T2: "#b8c84b", T3: "#ff8c3a", T4: "#e05a4a", T5: "#b04ad8" };

const CLASS_COLORS = { Knight: "#9fb0c8", Mage: "#5a8ae0", Rogue: "#58c878", Priest: "#ffd86a", Comum: "#c8a84b" };
// Skills são gateadas por requisito (atributo), não por classe — cores por afinidade.
const REQ_COLORS = {
  Universal: "#c8a84b", Força: "#d08a6a", Vitalidade: "#9fb0c8",
  Destreza: "#58c878", Inteligência: "#5a8ae0", Espírito: "#7ad0c0", Sagrado: "#ffd86a",
};
const REQS = ["Universal", "Força", "Vitalidade", "Destreza", "Inteligência", "Espírito", "Sagrado"];

// cores por tipo de dano (mesma tabela do DESIGN-VISUAL.md)
const ELEMENT_COLORS = [
  ["fogo", "#ff8c3a"], ["queimad", "#ff8c3a"],
  ["gelo", "#6ec4e8"], ["lentid", "#6ec4e8"], ["slow", "#6ec4e8"],
  ["veneno", "#7ec850"],
  ["sagrado", "#ffd86a"], ["holy", "#ffd86a"], ["profano", "#ffd86a"],
  ["sombrio", "#9a6ad8"],
  ["sangra", "#d84a3a"],
  ["cura", "#58c878"],
  ["físico", "#e8e4d8"], ["fisico", "#e8e4d8"],
];

function elementColor(text) {
  const t = String(text).toLowerCase();
  for (const [k, c] of ELEMENT_COLORS) if (t.includes(k)) return c;
  return null;
}

// ================================================================
// PARSERS
// ================================================================

// --- DESIGN-BESTIARIO.md → { tierLevels, families, creatures } ---

export function parseBestiary(md) {
  const lines = md.split(/\r?\n/);
  const tierLevels = {}; // "T1" → { levels: "1–8", budget: "só ataque básico" }
  const resist = {}; // família → { imune, resistente, fraco }
  const families = [];
  let cur = null;
  let section = "";
  let inFence = false;

  for (const l of lines) {
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;

    const h2 = l.match(/^##\s+(.*)$/);
    if (h2) {
      section = h2[1];
      // família: "## 3. Vermes (T1–T4) — o que rasteja no escuro"
      const fh = section.match(/^(\d+)\.\s+(.+?)\s+\((T\d)(?:[–-](T\d))?\)\s+—\s+(.+)$/);
      cur = fh
        ? {
            idx: +fh[1],
            name: fh[2].trim(),
            tierRange: fh[4] ? `${fh[3]}–${fh[4]}` : fh[3],
            tagline: fh[5].trim(),
            desc: "",
            creatures: [],
          }
        : null;
      if (cur) families.push(cur);
      continue;
    }

    // tabela de tiers: "| **T1** | 1–8 | só ataque básico |"
    const tr = l.match(/^\|\s*\*\*(T\d)\*\*\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/);
    if (tr && /^Tiers/i.test(section)) {
      tierLevels[tr[1]] = { levels: tr[2].replace(/✏️/g, "").trim(), budget: tr[3].trim() };
      continue;
    }

    // matriz de fraquezas: "| Vermes | veneno | — | **fogo** |"
    if (/^Matriz/i.test(section) && /^\s*\|/.test(l)) {
      if (isSep(l)) continue;
      const cells = splitRow(l);
      if (cells.length >= 4 && cells[0] !== "Família") {
        resist[cells[0]] = { imune: cells[1], resistente: cells[2], fraco: cells[3] };
      }
      continue;
    }

    if (!cur) continue;

    // linha de criatura
    if (/^\s*\|/.test(l)) {
      if (isSep(l)) continue;
      const cells = splitRow(l);
      if (cells.length < 4 || cells[0] === "Criatura") continue;
      const name = cells[0].replace(/\*\*/g, "").trim();
      const tm = cells[1].match(/T(\d)(?:\s*[–-]\s*T?(\d))?/);
      const tierMin = tm ? +tm[1] : 1;
      const tierMax = tm ? +(tm[2] ?? tm[1]) : tierMin;
      const c = {
        name,
        family: cur.name,
        familyIdx: cur.idx,
        tierStr: cells[1],
        tierMin,
        tierMax,
        behavior: cells[2],
        behaviors: cells[2].split(/[,+]/).map((b) => b.trim()).filter(Boolean),
        attacks: cells[3],
        notes: cells[4] ?? "",
      };
      c.isBruto = /bruto/i.test(c.notes) || /bruto/i.test(c.attacks);
      c.hasSignature = /signature/i.test(c.attacks);
      cur.creatures.push(c);
      continue;
    }

    // descrição da família (parágrafo antes da tabela)
    if (/^\s*$/.test(l) || /^\s*>/.test(l)) continue;
    if (!cur.creatures.length) cur.desc += (cur.desc ? " " : "") + l.trim();
  }

  for (const f of families) f.resist = resist[f.name] ?? null;
  return { tierLevels, families, creatures: families.flatMap((f) => f.creatures) };
}

// faixa de nível aproximada de uma criatura, via tabela de tiers
function levelLabel(c, tierLevels) {
  const lo = tierLevels["T" + c.tierMin]?.levels;
  const hi = tierLevels["T" + c.tierMax]?.levels;
  if (!lo || !hi) return "";
  const min = (lo.match(/\d+/) ?? [])[0];
  if (/\+/.test(hi)) return `${min}+`;
  const nums = hi.match(/\d+/g) ?? [];
  return `${min}–${nums[nums.length - 1]}`;
}

// --- DESIGN-EVOLUCAO.md → skills { detailed, planned } ---

function parseMutation(raw) {
  // "maioria à distância máxima → **Meteoro Distante** — alcance maior, ..."
  const parts = raw.split("→");
  if (parts.length >= 2) {
    const cond = parts[0].trim();
    const rest = parts.slice(1).join("→").trim();
    const nm = rest.match(/^\*\*(.+?)\*\*\s*(?:✏️\s*)?(?:—\s*)?(.*)$/);
    if (nm) return { cond, name: nm[1], effect: nm[2] };
    return { cond, name: "", effect: rest };
  }
  return { cond: "", name: "", effect: raw };
}

// nome de skill cru → nome limpo (tira *, ✏️, "(estilo …)"/"(Class)" e "— nota …")
const cleanSkillName = (s) =>
  s.replace(/\*/g, "").replace(/✏️/g, "").replace(/\s*—.*$/, "").replace(/\s*\([^)]*\)\s*$/, "").trim();

// célula "Requisito" do índice mestre → bucket de afinidade
function normReq(raw) {
  const r = raw.toLowerCase();
  if (/assinatura|sagrad/.test(r)) return "Sagrado";
  if (/universal/.test(r)) return "Universal";
  if (/\bdes\b/.test(r)) return "Destreza";
  if (/\bint\b/.test(r)) return "Inteligência";
  if (/\besp\b/.test(r)) return "Espírito";
  if (/\bvit\b/.test(r)) return "Vitalidade";
  if (/\bfor\b/.test(r)) return "Força";
  return "—";
}

export function parseSkills(md) {
  const lines = md.split(/\r?\n/);
  const detailed = [];
  const reqByName = {}; // nome(lower) → { name, req, arquetipo, oneLiner, tier }
  let mode = null;      // "list" | "universal" | "kit" | null
  let cur = null;
  let inMut = false;
  let inFence = false;

  for (const l of lines) {
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;
    if (/^## /.test(l)) { mode = null; cur = null; continue; }

    const h3 = l.match(/^### (.*)$/);
    if (h3) {
      cur = null;
      inMut = false;
      const t = h3[1];
      if (/lista de skills por requisito/i.test(t)) mode = "list";
      else if (/universais/i.test(t)) mode = "universal";
      else if (/primeiras skills|kit inicial/i.test(t)) mode = "kit";
      else mode = null;
      continue;
    }

    // índice mestre: nome → requisito / arquétipo / one-liner / tier
    if (mode === "list") {
      if (/^\s*\|/.test(l) && !isSep(l)) {
        const cells = splitRow(l);
        if (cells.length >= 5 && cells[0] !== "Requisito") {
          const name = cleanSkillName(cells[1]);
          if (name) {
            reqByName[name.toLowerCase()] = {
              name,
              req: normReq(cells[0]),
              arquetipo: cells[2].trim(),
              oneLiner: cells[3].trim(),
              tier: cells[4].replace(/✏️/g, "").trim(),
            };
          }
        }
      }
      continue;
    }

    if (mode !== "universal" && mode !== "kit") continue;

    const h4 = l.match(/^#### (.+?)\s*$/);
    if (h4) {
      const name = cleanSkillName(h4[1]);
      const meta = reqByName[name.toLowerCase()] ?? {};
      cur = {
        name,
        class: meta.req ?? (mode === "universal" ? "Universal" : "—"),
        arquetipo: meta.arquetipo ?? "",
        group: mode,
        fields: {},
        mutations: [],
      };
      detailed.push(cur);
      inMut = false;
      continue;
    }
    if (!cur) continue;

    const bullet = l.match(/^- \*\*([^:*]+):\*\*\s*(.*)$/);
    if (bullet) {
      const label = bullet[1].trim();
      if (/muta/i.test(label)) { inMut = true; continue; }
      inMut = false;
      const key =
        /^tipo/i.test(label) ? "tipo" :
        /tags/i.test(label) ? "tags" :
        /custo/i.test(label) ? "custo" :
        /efeito/i.test(label) ? "efeito" :
        /perfis/i.test(label) ? "perfis" :
        /requisito/i.test(label) ? "requisito" :
        /nota/i.test(label) ? "nota" : null;
      if (key) cur.fields[key] = bullet[2].trim();
      continue;
    }

    const num = l.match(/^\s+\d+\.\s+(.*)$/);
    if (num && inMut) cur.mutations.push(parseMutation(num[1].trim()));
  }

  // planejadas = entradas do índice em T1/T2 que ainda não têm ficha detalhada
  const detNames = new Set(detailed.map((d) => d.name.toLowerCase()));
  const planned = Object.entries(reqByName)
    .filter(([key, m]) => /^t\d/i.test(m.tier) && !detNames.has(key))
    .map(([, m]) => ({ name: m.name, class: m.req, oneLiner: m.oneLiner, group: "planejada" }));

  return { detailed, planned };
}

// --- DESIGN-EVOLUCAO.md → classes { lead, classes, attributes } ---

function parseCaminho(raw) {
  // "*Inabalável* — 50k bloqueios com escudo → chance de bloqueio total"
  // "**Monge** (*Mão Vazia*) — lvl 25 sem nunca equipar arma... → dano..."
  const m = raw.match(/^\*{1,2}(.+?)\*{1,2}([^—]*)—\s*(.*)$/);
  if (!m) return { name: "", alias: "", cond: raw, effect: "" };
  const alias = m[2].includes("(") ? m[2].replace(/[()*]/g, "").trim() : "";
  const parts = m[3].split("→");
  return {
    name: m[1].trim(),
    alias,
    cond: parts[0].trim(),
    effect: parts.slice(1).join("→").trim(),
  };
}

export function parseClasses(md) {
  const lines = md.split(/\r?\n/);
  const classes = [];
  const lead = [];
  const attributes = [];
  let inSection = false;
  let inFence = false;
  let cur = null;
  let inPaths = false;

  for (const l of lines) {
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;

    // tabela de atributos (vive na seção de Stats, fora de ## Classes)
    const at = l.match(/^\|\s*\*\*(Força|Destreza|Inteligência|Vitalidade|Espírito)\*\*\s*\|([^|]+)\|([^|]+)\|/);
    if (at) attributes.push({ name: at[1], governs: at[2].trim(), affinity: at[3].trim() });

    if (/^## Classes/.test(l)) { inSection = true; continue; }
    if (inSection && /^## /.test(l)) break;
    if (!inSection) continue;

    const h3 = l.match(/^### (.+)$/);
    if (h3) { cur = { name: h3[1].trim(), caminhos: [], note: "" }; classes.push(cur); inPaths = false; continue; }
    if (/^\*\*Template/.test(l.trim())) { cur = null; continue; }

    if (!cur) {
      const t = l.trim();
      if (t && !/^[>|#]/.test(t)) lead.push(t);
      continue;
    }

    const bullet = l.match(/^- \*\*([^:*]+):\*\*\s*(.*)$/);
    if (bullet) {
      const label = bullet[1].trim();
      if (/caminhos/i.test(label)) { inPaths = true; continue; }
      inPaths = false;
      if (/fantasia/i.test(label)) cur.fantasia = bullet[2].trim();
      else if (/kit/i.test(label)) cur.kit = bullet[2].trim();
      else if (/atributos/i.test(label)) cur.atributos = bullet[2].trim();
      else if (/lentes/i.test(label)) cur.lentes = bullet[2].trim();
      continue;
    }

    const num = l.match(/^\s+\d+\.\s+(.*)$/);
    if (num && inPaths) { cur.caminhos.push(parseCaminho(num[1].trim())); continue; }

    const bq = l.match(/^>\s?(.*)$/);
    if (bq && bq[1]) cur.note += (cur.note ? " " : "") + bq[1];
  }

  return { lead, classes, attributes };
}

// --- DESIGN-ITENS.md → { items, roster } ---
// Depende de: "## Tabela de itens — T<N>" com subseções ### contendo tabelas
// (colunas Item/Tipo/Par EN/Fonte/Aquisição/Bônus…/Nota/Slot/Papel), e do
// "### Roster" sob "## Tipos de item de mão".

function itemCat(group) {
  if (/elementais/i.test(group)) return "Armas elementais";
  if (/^mundo/i.test(group)) return "Mundo";
  if (/baús/i.test(group)) return "Baús (bônus)";
  if (/vendor-ponte/i.test(group)) return "Vendor-ponte";
  if (/utilitário|container/i.test(group)) return "Utilitário";
  if (/vestir/i.test(group)) return "Vestir (vendor)";
  if (/armas/i.test(group)) return "Armas";
  return group;
}

export function parseItems(md) {
  const lines = md.split(/\r?\n/);
  const items = [];
  const roster = [];
  let tier = null; // dentro de "## Tabela de itens — T<N>"
  let inRosterSection = false; // dentro de "## Tipos de item de mão"
  let group = "";
  let headers = null;
  let inFence = false;

  // primeira coluna cujo header começa com um dos prefixos
  const col = (row, ...prefixes) => {
    for (const k of Object.keys(row))
      for (const p of prefixes)
        if (k.toLowerCase().startsWith(p)) return row[k];
    return "";
  };

  for (const l of lines) {
    if (/^```/.test(l)) { inFence = !inFence; continue; }
    if (inFence) continue;

    if (/^## /.test(l)) {
      const t = l.slice(3);
      const tm = t.match(/^Tabela de itens — (T\d)/);
      tier = tm ? tm[1] : null;
      inRosterSection = /^Tipos de item de mão/.test(t);
      group = ""; headers = null;
      continue;
    }
    if (/^### /.test(l)) { group = l.slice(4).trim(); headers = null; continue; }
    if (!/^\s*\|/.test(l)) { headers = null; continue; }
    if (isSep(l)) continue;

    const cells = splitRow(l);
    if (!headers) { headers = cells.map((c) => c.replace(/\*/g, "").trim()); continue; }
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));

    if (inRosterSection && /^Roster/.test(group)) {
      roster.push({
        tipo: row["Tipo"] ?? "", maos: row["Mãos"] ?? "", escala: row["Escala"] ?? "",
        subtipo: col(row, "subtipo"), essencia: col(row, "essência", "essencia"),
      });
      continue;
    }
    if (!tier) continue;

    const cat = itemCat(group);
    const fonteImplicita = { "Vestir (vendor)": "vendor", "Utilitário": "vendor", "Vendor-ponte": "vendor (ponte)", "Baús (bônus)": "baú" }[cat] ?? "";
    items.push({
      tier, cat,
      name: (row["Item"] ?? "").replace(/\*\*/g, "").trim(),
      en: col(row, "par en").replace(/\*/g, "").trim(),
      tipo: (row["Tipo"] ?? row["Slot"] ?? "").replace(/\*\*/g, ""),
      fonte: row["Fonte"] ?? col(row, "aquisição") ?? fonteImplicita,
      bonus: col(row, "bônus", "bonus"),
      // coluna "Números" (dano @cadência / Def / faixa fixa) — decididos jun/2026
      nums: col(row, "números", "numeros"),
      nota: row["Nota"] ?? col(row, "leitura") ?? col(row, "constela") ?? row["Papel"] ?? "",
    });
    const it = items[items.length - 1];
    if (!it.fonte) it.fonte = fonteImplicita;
    if (!it.name) items.pop(); // linha sem item (defensivo)
  }
  return { items, roster };
}

// --- design/fatia-1-alvorada/QUESTS.md → { quests } ---
// Depende de: tabela do "## Índice" (colunas #, Quest, Camada, Área, Nível,
// NPC/gatilho, Destrava) + seções de detalhe "### Q<n>. Nome / *EN*" e
// "### R<n>. Nome / *EN* — rito do <Classe>" com bullets "- **Campo:** valor".

export function parseQuests(md) {
  const lines = md.split(/\r?\n/);

  // nome "PT / *EN*" → { pt, en }
  const splitName = (s) => {
    const en = (s.match(/\/\s*\*([^*]+)\*/) ?? [])[1] ?? "";
    const pt = s.split(" / ")[0].replace(/\*/g, "").trim();
    return { pt, en };
  };
  const camadaBase = (c) => {
    const t = c.toLowerCase();
    if (t.startsWith("rito")) return "rito";
    if (t.startsWith("segredo")) return "segredo";
    if (t.includes("aberta")) return "aberta";
    if (t.includes("encadeada")) return "encadeada";
    if (t.includes("composta")) return "composta";
    return "direta";
  };
  const areaBase = (a) => a.split(/[(→]/)[0].trim();

  // 1) índice — meta por id
  const meta = new Map();
  let inIndice = false, headers = null, order = 0;
  for (const l of lines) {
    if (/^## /.test(l)) { inIndice = /^## Índice/.test(l); headers = null; continue; }
    if (!inIndice || !/^\s*\|/.test(l) || isSep(l)) continue;
    const cells = splitRow(l);
    if (!headers) { headers = cells; continue; }
    const id = cells[0].replace(/\*/g, "").trim();
    if (!/^Q\d+$/.test(id)) continue; // pula a linha agregada R1–R4
    meta.set(id, {
      id, order: order++,
      ...splitName(cells[1]),
      camadaRaw: cells[2], camada: camadaBase(cells[2]),
      longa: /longa maturação/i.test(cells[2]),
      areaRaw: cells[3], area: areaBase(cells[3]),
      nivel: cells[4].replace(/\*/g, "").trim(),
      npc: cells[5], destrava: cells[6] ?? "",
    });
  }

  // 2) seções de detalhe — campos por id (Q e R)
  const details = new Map();
  const ritos = [];
  let cur = null;
  for (const l of lines) {
    const h = l.match(/^### (Q|R)(\d+)\.\s+(.*)$/);
    if (h) {
      const id = h[1] + h[2];
      cur = { id, kind: h[1], heading: h[3], fields: [] };
      details.set(id, cur);
      if (h[1] === "R") ritos.push(cur);
      continue;
    }
    if (/^## /.test(l)) { cur = null; continue; }
    const b = cur && l.match(/^- \*\*([^*]+):?\*\*:?\s*(.*)$/);
    if (b) cur.fields.push({ label: b[1].replace(/:$/, ""), value: b[2] });
  }

  // 3) monta a lista final: ritos primeiro, depois Q1..Qn na ordem do índice
  const quests = [];
  for (const r of ritos) {
    const { pt, en } = splitName(r.heading);
    const classe = (r.heading.match(/rito do (\w+)/) ?? [])[1] ?? "";
    const local = r.fields.find((f) => f.label.startsWith("Local"))?.value ?? "";
    quests.push({
      id: r.id, pt, en, classe, camadaRaw: `rito (${classe})`, camada: "rito",
      longa: false, areaRaw: "Cidade", area: "Cidade", nivel: "livre",
      npc: local, destrava: "classe + arma do kit", fields: r.fields,
    });
  }
  for (const m of [...meta.values()].sort((a, b) => a.order - b.order)) {
    quests.push({ ...m, fields: details.get(m.id)?.fields ?? [] });
  }
  return { quests };
}

// ================================================================
// VIEWS
// ================================================================

// estado dos filtros persiste enquanto a página estiver aberta
const bState = { q: "", fams: new Set(), tiers: new Set(), behs: new Set(), flags: new Set(), sort: "family", view: "cards" };
const sState = { q: "", classes: new Set(), groups: new Set() };
const iState = { q: "", tiers: new Set(), cats: new Set(), sort: "doc" };
const qState = { q: "", camadas: new Set(), areas: new Set(), sort: "doc" };

const chip = (k, v, label, on, color) =>
  `<button class="chip${on ? " on" : ""}" data-k="${k}" data-v="${esc(v)}"${color ? ` style="--c:${color}"` : ""}>${label}</button>`;

function wireToolbar($doc, st, rerenderBody, rerenderAll) {
  $doc.querySelectorAll(".db-toolbar .chip").forEach((ch) => {
    ch.addEventListener("click", () => {
      const set = st[ch.dataset.k];
      set.has(ch.dataset.v) ? set.delete(ch.dataset.v) : set.add(ch.dataset.v);
      ch.classList.toggle("on");
      rerenderBody();
    });
  });
  const $q = $doc.querySelector(".db-search");
  if ($q) $q.addEventListener("input", () => { st.q = $q.value; rerenderBody(); });
  const $clear = $doc.querySelector(".db-clear");
  if ($clear)
    $clear.addEventListener("click", () => {
      st.q = "";
      for (const v of Object.values(st)) if (v instanceof Set) v.clear();
      rerenderAll();
    });
}

export function renderDbPage($doc, page, data) {
  if (page === "bestiario" && data.bestiario) return renderBestiary($doc, data.bestiario);
  if (page === "skills" && data.skills) return renderSkills($doc, data.skills);
  if (page === "classes" && data.classes) return renderClasses($doc, data.classes);
  if (page === "itens" && data.itens) return renderItems($doc, data.itens);
  if (page === "quests" && data.quests) return renderQuests($doc, data.quests);
  $doc.innerHTML = `<p>⚠ Página não encontrada ou documento-fonte não carregou.</p>`;
}

// ---------------- Bestiário ----------------

const BEHAVIORS = ["Perseguidor", "Atirador", "Covarde", "Matilha", "Territorial", "Estacionário"];

function renderBestiary($doc, data) {
  $doc.innerHTML = `
    <header class="db-header">
      <h1>🐲 Bestiário</h1>
      <p class="db-sub"><strong>${data.creatures.length} criaturas padrão</strong> em <strong>${data.families.length} famílias</strong>, tiers T1–T5.
        Família define tema, habitat e fraquezas; a diferenciação vem dos ataques.
        Fonte: <a href="#/bestiario">DESIGN-BESTIARIO.md</a></p>
    </header>
    <div class="db-toolbar">
      <input class="db-search" type="search" placeholder="Filtrar por nome, ataque, nota…" value="${esc(bState.q)}" />
      <div class="filter-row"><span class="filter-label">Família</span><div class="chips">
        ${data.families.map((f) => chip("fams", f.name, f.name, bState.fams.has(f.name), FAMILY_COLORS[f.name])).join("")}
      </div></div>
      <div class="filter-row"><span class="filter-label">Tier</span><div class="chips">
        ${Object.keys(TIER_COLORS).map((t) =>
          chip("tiers", t, `${t} <small>nv ${esc(data.tierLevels[t]?.levels ?? "?")}</small>`, bState.tiers.has(t), TIER_COLORS[t])
        ).join("")}
      </div></div>
      <div class="filter-row"><span class="filter-label">Comportamento</span><div class="chips">
        ${BEHAVIORS.map((b) => chip("behs", b, b, bState.behs.has(b))).join("")}
      </div></div>
      <div class="filter-row"><span class="filter-label">Especial</span><div class="chips">
        ${chip("flags", "bruto", "💪 Bruto (só stats)", bState.flags.has("bruto"), "#e0a070")}
        ${chip("flags", "signature", "✦ Tem signature", bState.flags.has("signature"), "#c9a8ff")}
      </div></div>
      <div class="filter-row db-controls">
        <label>Ordenar
          <select class="db-sort">
            <option value="family">Família (ordem do doc)</option>
            <option value="tier-asc">Tier ↑ (mais fraco primeiro)</option>
            <option value="tier-desc">Tier ↓ (mais forte primeiro)</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </label>
        <div class="view-toggle">
          <button class="vt-btn" data-view="cards">▦ Cards</button>
          <button class="vt-btn" data-view="table">☰ Tabela</button>
        </div>
        <button class="db-clear">✕ Limpar filtros</button>
        <span class="db-count"></span>
      </div>
    </div>
    <div id="db-body"></div>`;

  const $sort = $doc.querySelector(".db-sort");
  $sort.value = bState.sort;
  $sort.addEventListener("change", () => { bState.sort = $sort.value; bRenderBody($doc, data); });

  $doc.querySelectorAll(".vt-btn").forEach((b) => {
    b.classList.toggle("on", b.dataset.view === bState.view);
    b.addEventListener("click", () => {
      bState.view = b.dataset.view;
      $doc.querySelectorAll(".vt-btn").forEach((x) => x.classList.toggle("on", x === b));
      bRenderBody($doc, data);
    });
  });

  // clicar numa tag de família filtra por ela
  $doc.querySelector("#db-body").addEventListener("click", (e) => {
    const ft = e.target.closest(".fam-tag");
    if (!ft?.dataset.fam) return;
    bState.fams = new Set([ft.dataset.fam]);
    renderBestiary($doc, data);
  });

  wireToolbar($doc, bState, () => bRenderBody($doc, data), () => renderBestiary($doc, data));
  bRenderBody($doc, data);
}

function bFiltered(data) {
  const q = bState.q.toLowerCase();
  let list = data.creatures.filter((c) => {
    if (bState.fams.size && !bState.fams.has(c.family)) return false;
    if (bState.tiers.size) {
      let ok = false;
      for (let t = c.tierMin; t <= c.tierMax; t++) if (bState.tiers.has("T" + t)) ok = true;
      if (!ok) return false;
    }
    if (bState.behs.size && ![...bState.behs].some((b) => c.behavior.includes(b))) return false;
    if (bState.flags.has("bruto") && !c.isBruto) return false;
    if (bState.flags.has("signature") && !c.hasSignature) return false;
    if (q) {
      const hay = `${c.name} ${c.family} ${c.behavior} ${c.attacks} ${c.notes}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const byName = (a, b) => a.name.localeCompare(b.name, "pt");
  if (bState.sort === "name") list = [...list].sort(byName);
  else if (bState.sort === "tier-asc")
    list = [...list].sort((a, b) => a.tierMin - b.tierMin || a.tierMax - b.tierMax || byName(a, b));
  else if (bState.sort === "tier-desc")
    list = [...list].sort((a, b) => b.tierMax - a.tierMax || b.tierMin - a.tierMin || byName(a, b));
  return list;
}

function bRenderBody($doc, data) {
  const list = bFiltered(data);
  $doc.querySelector(".db-count").textContent = `${list.length} de ${data.creatures.length} criaturas`;
  const $b = $doc.querySelector("#db-body");

  if (bState.view === "table") {
    $b.innerHTML = creatureTable(list, data);
    return;
  }
  if (bState.sort === "family") {
    const html = data.families
      .map((f) => {
        const cs = list.filter((c) => c.family === f.name);
        return cs.length ? famSection(f, cs, data) : "";
      })
      .join("");
    $b.innerHTML = html || emptyMsg();
  } else {
    $b.innerHTML = list.length
      ? `<div class="card-grid">${list.map((c) => creatureCard(c, data)).join("")}</div>`
      : emptyMsg();
  }
}

function resistChips(val) {
  if (!val || val === "—") return `<span class="r-none">—</span>`;
  return val
    .split(/[;,]/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<span class="el-chip" style="--c:${elementColor(p) ?? "#8890a0"}">${fmt(p)}</span>`)
    .join("");
}

function famSection(f, creatures, data) {
  const fc = FAMILY_COLORS[f.name] ?? "#8890a0";
  const r = f.resist;
  return `<section class="fam-section" style="--fc:${fc}">
    <header class="fam-head">
      <h2>${f.idx}. ${esc(f.name)} <span class="tier-range">${esc(f.tierRange)}</span>
        <span class="fam-count">${creatures.length} criatura${creatures.length > 1 ? "s" : ""}</span></h2>
      <p class="fam-tagline">${fmt(f.tagline)}</p>
      ${f.desc ? `<p class="fam-desc">${fmt(f.desc)}</p>` : ""}
      ${r ? `<div class="fam-resists">
        <span class="r-group"><span class="r-lbl">Imune</span>${resistChips(r.imune)}</span>
        <span class="r-group"><span class="r-lbl">Resistente</span>${resistChips(r.resistente)}</span>
        <span class="r-group"><span class="r-lbl">Fraco</span>${resistChips(r.fraco)}</span>
      </div>` : ""}
    </header>
    <div class="card-grid">${creatures.map((c) => creatureCard(c, data)).join("")}</div>
  </section>`;
}

function creatureCard(c, data) {
  const fc = FAMILY_COLORS[c.family] ?? "#8890a0";
  const lv = levelLabel(c, data.tierLevels);
  return `<article class="creature-card" style="--fc:${fc}">
    <div class="cc-top">
      <h3>${esc(c.name)}</h3>
      <span class="tier-badge" style="--tc:${TIER_COLORS["T" + c.tierMax] ?? "#8890a0"}">${esc(c.tierStr)}</span>
    </div>
    <div class="cc-meta">
      <span class="fam-tag" data-fam="${esc(c.family)}" title="filtrar por ${esc(c.family)}">${esc(c.family)}</span>
      ${lv ? `<span class="cc-lvl">nível ~${lv}</span>` : ""}
      ${c.isBruto ? `<span class="flag-badge bruto" title="só stats: muita vida/dano, zero skill">💪 bruto</span>` : ""}
      ${c.hasSignature ? `<span class="flag-badge sig" title="ataque/efeito exclusivo da espécie">✦ signature</span>` : ""}
    </div>
    <div class="cc-chips">${c.behaviors.map((b) => `<span class="beh-chip">${esc(b)}</span>`).join("")}</div>
    <div class="cc-attacks">${fmt(c.attacks)}</div>
    ${c.notes ? `<p class="cc-notes">${fmt(c.notes)}</p>` : ""}
  </article>`;
}

function creatureTable(list, data) {
  if (!list.length) return emptyMsg();
  return `<table class="db-table"><thead><tr>
      <th>Criatura</th><th>Família</th><th>Tier</th><th>Nível ~</th><th>Comportamento</th><th>Ataques</th><th>Notas</th>
    </tr></thead><tbody>
    ${list.map((c) => `<tr>
      <td><strong>${esc(c.name)}</strong>${c.isBruto ? ` <span class="flag-badge bruto" title="bruto">💪</span>` : ""}${c.hasSignature ? ` <span class="flag-badge sig" title="signature">✦</span>` : ""}</td>
      <td><span class="fam-tag" data-fam="${esc(c.family)}" style="--fc:${FAMILY_COLORS[c.family] ?? "#8890a0"}">${esc(c.family)}</span></td>
      <td><span class="tier-badge" style="--tc:${TIER_COLORS["T" + c.tierMax] ?? "#8890a0"}">${esc(c.tierStr)}</span></td>
      <td>${levelLabel(c, data.tierLevels)}</td>
      <td>${c.behaviors.map((b) => `<span class="beh-chip">${esc(b)}</span>`).join(" ")}</td>
      <td>${fmt(c.attacks)}</td>
      <td class="dim">${fmt(c.notes)}</td>
    </tr>`).join("")}
  </tbody></table>`;
}

// ---------------- Skills & Magias ----------------

function renderSkills($doc, data) {
  const GROUPS = [
    ["kit", "Kit inicial (M1)"],
    ["universal", "Universais (todas as classes)"],
    ["planejada", "Planejadas (M3)"],
  ];
  const total = data.detailed.length + data.planned.length;
  $doc.innerHTML = `
    <header class="db-header">
      <h1>✨ Skills & Magias</h1>
      <p class="db-sub"><strong>${data.detailed.length} skills</strong> com ficha completa + <strong>${data.planned.length} planejadas</strong> (M3).
Adquiridas pelo mundo (NPCs espalhados, drops de mob, quests) — <strong>sem kit inicial</strong>. Aprendizado gateado por <strong>atributo + nível</strong> (não por classe — sagrado/assinatura trancados). Uso extremo gera <strong>Mutações</strong> — a única forma de upgrade.
        Fonte: <a href="#/progressao">DESIGN-EVOLUCAO.md</a></p>
    </header>
    <div class="db-toolbar">
      <input class="db-search" type="search" placeholder="Filtrar por nome, efeito, mutação…" value="${esc(sState.q)}" />
      <div class="filter-row"><span class="filter-label">Requisito</span><div class="chips">
        ${REQS.map((c) => chip("classes", c, c, sState.classes.has(c), REQ_COLORS[c])).join("")}
      </div></div>
      <div class="filter-row"><span class="filter-label">Grupo</span><div class="chips">
        ${GROUPS.map(([k, label]) => chip("groups", k, label, sState.groups.has(k))).join("")}
      </div></div>
      <div class="filter-row db-controls">
        <button class="db-clear">✕ Limpar filtros</button>
        <span class="db-count"></span>
      </div>
    </div>
    <div id="db-body"></div>`;

  wireToolbar($doc, sState, () => sRenderBody($doc, data, total), () => renderSkills($doc, data));
  sRenderBody($doc, data, total);
}

function sFiltered(data) {
  const q = sState.q.toLowerCase();
  return [...data.detailed, ...data.planned].filter((s) => {
    if (sState.classes.size && !sState.classes.has(s.class)) return false;
    if (sState.groups.size && !sState.groups.has(s.group)) return false;
    if (q) {
      const hay = [
        s.name, s.class, s.oneLiner ?? "",
        ...Object.values(s.fields ?? {}),
        ...(s.mutations ?? []).map((m) => `${m.name} ${m.effect} ${m.cond}`),
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function sRenderBody($doc, data, total) {
  const list = sFiltered(data);
  $doc.querySelector(".db-count").textContent = `${list.length} de ${total} skills`;
  const SECTIONS = [
    ["kit", "Kit inicial M1", "fichas detalhadas; gate por atributo (sagrado = assinatura Priest)"],
    ["universal", "Universais — kit de sobrevivência", "qualquer classe; gate baixo/nenhum"],
    ["planejada", "Roster T1/T2", "fichas completas no M3"],
  ];
  const html = SECTIONS.map(([g, title, sub]) => {
    const items = list.filter((s) => s.group === g);
    if (!items.length) return "";
    return `<section class="db-group">
      <h2 class="db-h2">${title} <span class="dim-note">— ${sub}</span></h2>
      <div class="${g === "planejada" ? "card-grid" : "skill-grid"}">
        ${items.map((s) => (s.group === "planejada" ? plannedCard(s) : skillCard(s))).join("")}
      </div>
    </section>`;
  }).join("");
  $doc.querySelector("#db-body").innerHTML = html || emptyMsg();
}

function skillCard(s) {
  const cc = REQ_COLORS[s.class] ?? "#c8a84b";
  const f = s.fields;
  const tags = (f.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  return `<article class="skill-card" style="--cc:${cc}">
    <div class="sc-top">
      <h3>${esc(s.name)}</h3>
      <span class="class-badge">${esc(s.class === "Universal" ? "Universal · todos" : s.class)}</span>
    </div>
    <div class="cc-meta">
      ${f.tipo ? `<span class="sc-tipo">${fmt(f.tipo)}</span>` : ""}
      ${tags.map((t) => `<span class="el-chip" style="--c:${elementColor(t) ?? "#8890a0"}">${fmt(t)}</span>`).join("")}
    </div>
    ${f.efeito ? `<p class="sc-field"><span class="lbl">Efeito base</span>${fmt(f.efeito)}</p>` : ""}
    ${f.custo ? `<p class="sc-field"><span class="lbl">Custo / cooldown</span>${fmt(f.custo)}</p>` : ""}
    ${f.perfis ? `<p class="sc-field"><span class="lbl">Perfis de uso rastreados</span>${fmt(f.perfis)}</p>` : ""}
    ${s.mutations.length ? `<div class="sc-muts">
      <div class="sc-muts-title">⟡ Mutações possíveis (${s.mutations.length})</div>
      <ul>${s.mutations.map((m) => `<li>
        <span class="mut-name">${esc(m.name || "✏️")}</span>${m.effect ? ` — ${fmt(m.effect)}` : ""}
        ${m.cond ? `<div class="mut-cond">perfil: ${fmt(m.cond)}</div>` : ""}
      </li>`).join("")}</ul>
    </div>` : ""}
    ${f.nota ? `<p class="sc-field note"><span class="lbl">Nota de conduta</span>${fmt(f.nota)}</p>` : ""}
  </article>`;
}

function plannedCard(s) {
  const cc = REQ_COLORS[s.class] ?? "#c8a84b";
  return `<article class="skill-card planned" style="--cc:${cc}">
    <div class="sc-top">
      <h3>${esc(s.name)}</h3>
      <span class="class-badge">${esc(s.class)}</span>
    </div>
    <p class="sc-oneliner">${fmt(s.oneLiner)}</p>
    <span class="m3-badge">ficha completa no M3</span>
  </article>`;
}

// ---------------- Classes ----------------

function renderClasses($doc, data) {
  $doc.innerHTML = `
    <header class="db-header">
      <h1>🛡 Classes</h1>
      <p class="db-sub">${data.lead.length ? fmt(data.lead[0]) : ""}
        Fonte: <a href="#/progressao">DESIGN-EVOLUCAO.md</a></p>
      ${data.lead.slice(1).map((p) => `<p class="db-lead">${fmt(p)}</p>`).join("")}
    </header>
    ${data.attributes.length ? `<section class="db-group">
      <h2 class="db-h2">Os 5 atributos <span class="dim-note">— pontos no level up + crescimento automático por classe</span></h2>
      <table class="db-table attr-table"><thead><tr><th>Atributo</th><th>Governa</th><th>Classe afim</th></tr></thead>
      <tbody>${data.attributes.map((a) => `<tr>
        <td><strong>${esc(a.name)}</strong></td><td>${fmt(a.governs)}</td><td>${fmt(a.affinity)}</td>
      </tr>`).join("")}</tbody></table>
    </section>` : ""}
    <section class="db-group">
      <h2 class="db-h2">As 4 classes <span class="dim-note">— base fixa + especialização emergente via Caminhos</span></h2>
      <div class="class-grid">${data.classes.map(classCard).join("")}</div>
    </section>`;
}

// ---------------- Itens & Equipamento ----------------

// Sprites de item gerados (PixelLab + curadoria, jun/2026). Lista mantida à mão
// para a wiki seguir self-contained (sem glob/Vite). Caminho servido pela raiz do
// projeto no dev server. Ao aprovar novos sprites, adicione a entrada aqui.
const ITEM_SPRITE_BASE = "/src/client/assets/img/items/";
// `cat` = subpasta de categoria (espelha ItemCategory da sim); container é só-sprite.
const CAT_LABEL = { weapon: "Armas", shield: "Escudos", armor: "Armaduras & Vestir", consumable: "Consumíveis", tool: "Ferramentas", material: "Material", container: "Containers" };
const ITEM_SPRITES = [
  { slug: "espada-curta", label: "Espada Curta", cat: "weapon" },
  { slug: "espada-cega", label: "Espada Cega", cat: "weapon" },
  { slug: "adaga", label: "Adaga", cat: "weapon" },
  { slug: "machado-de-mao", label: "Machado de Mão", cat: "weapon" },
  { slug: "clava", label: "Clava", cat: "weapon" },
  { slug: "cajado-simples", label: "Cajado Simples", cat: "weapon" },
  { slug: "cetro", label: "Cetro", cat: "weapon" },
  { slug: "escudo-de-madeira", label: "Escudo de Madeira", cat: "shield" },
  { slug: "coifa-de-couro", label: "Coifa de Couro", cat: "armor" },
  { slug: "capuz-do-cacador", label: "Capuz do Caçador", cat: "armor" },
  { slug: "tunica-de-couro", label: "Túnica de Couro", cat: "armor" },
  { slug: "gibao-roto", label: "Gibão Roto", cat: "armor" },
  { slug: "robe-do-erudito", label: "Robe do Erudito", cat: "armor" },
  { slug: "peitoral-da-muralha", label: "Peitoral da Muralha", cat: "armor" },
  { slug: "calcas-de-couro", label: "Calças de Couro", cat: "armor" },
  { slug: "botas-de-couro", label: "Botas de Couro", cat: "armor" },
  { slug: "botas-surradas", label: "Botas Surradas", cat: "armor" },
  { slug: "botas-do-viajante", label: "Botas do Viajante", cat: "armor" },
  { slug: "luvas-de-couro", label: "Luvas de Couro", cat: "armor" },
  { slug: "anel-de-regeneracao-menor", label: "Anel de Regeneração Menor", cat: "armor" },
  { slug: "pao", label: "Pão", cat: "consumable" },
  { slug: "carne-assada", label: "Carne Assada", cat: "consumable" },
  { slug: "carne-crua", label: "Carne Crua", cat: "consumable" },
  { slug: "pocao-vida-pequena", label: "Poção de Vida Pequena", cat: "consumable" },
  { slug: "pa", label: "Pá", cat: "tool" },
  { slug: "corda", label: "Corda", cat: "tool" },
  { slug: "tocha", label: "Tocha", cat: "tool" },
  { slug: "faca-de-esfolar", label: "Faca de Esfolar", cat: "tool" },
  { slug: "cauda-de-rato", label: "Cauda de Rato", cat: "material" },
  { slug: "sacola-pano", label: "Sacola de Pano", cat: "container" },
];
const SPRITE_SET = new Set(ITEM_SPRITES.map((s) => s.slug));
const SPRITE_CAT = Object.fromEntries(ITEM_SPRITES.map((s) => [s.slug, s.cat]));
// nome do doc → slug do sprite, para casos em que o slug não bate direto
const SPRITE_ALIAS = { "cajado-de-fogo": "cajado-simples", "cajado-de-gelo": "cajado-simples" };

const slugify = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// sprites que casam com o nome de um item do catálogo (split em → / , ; — pega
// "Espada Cega → Espada Curta" e "Cajado de Fogo / Cajado de Gelo")
function itemSprites(name) {
  const out = [];
  for (const part of name.split(/[→\/,;]/)) {
    const slug = slugify(part);
    const hit = SPRITE_SET.has(slug) ? slug : SPRITE_ALIAS[slug];
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}
const spriteImg = (slug, label, size = 32) =>
  `<img src="${ITEM_SPRITE_BASE}${SPRITE_CAT[slug] ?? ""}/${slug}.png" alt="${esc(label)}" title="${esc(label)}" width="${size}" height="${size}" loading="lazy" style="image-rendering:pixelated;vertical-align:middle" onerror="this.style.display='none'">`;

function spriteGallery() {
  const cats = [...new Set(ITEM_SPRITES.map((s) => s.cat))];
  return `
    <section class="db-group">
      <h2 class="db-h2">🖼️ Sprites gerados <span class="dim-note">— ${ITEM_SPRITES.length} ícones (PixelLab + curadoria, jun/2026) · 32px, exibidos 2×, por categoria</span></h2>
      ${cats.map((g) => `
        <div style="margin:.4rem 0 .9rem">
          <div class="dim" style="font-size:.8rem;margin-bottom:.3rem">${esc(CAT_LABEL[g] ?? g)} <span style="opacity:.6">· ${g}/</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:.9rem">
            ${ITEM_SPRITES.filter((s) => s.cat === g).map((s) => `
              <figure style="margin:0;width:84px;text-align:center">
                <div style="background:linear-gradient(90deg,#2c3a26 50%,#969488 50%);border:1px solid #10141c;border-radius:4px;padding:6px;display:flex;align-items:center;justify-content:center;height:76px">
                  ${spriteImg(s.slug, s.label, 64)}
                </div>
                <figcaption class="dim" style="font-size:.72rem;margin-top:.25rem;line-height:1.1">${esc(s.label)}</figcaption>
              </figure>`).join("")}
          </div>
        </div>`).join("")}
    </section>`;
}

function renderItems($doc, data) {
  const tiers = [...new Set(data.items.map((i) => i.tier))];
  const cats = [...new Set(data.items.map((i) => i.cat))];
  $doc.innerHTML = `
    <header class="db-header">
      <h1>🎒 Itens & Equipamento</h1>
      <p class="db-sub"><strong>${data.items.length} itens</strong> nos catálogos por tier + <strong>${data.roster.length} tipos de item de mão</strong>.
        Matriz esparsa (modelo Tibia): cada tier estreia poucas combinações; bônus só em peças do mundo. Números T1 decididos (jun/2026); T2 ✏️.
        Fonte: <a href="#/itens-equipamento">design/itens/EQUIPAMENTO.md</a> · hub: <a href="#/itens">DESIGN-ITENS.md</a></p>
    </header>
    <div class="db-toolbar">
      <input class="db-search" type="search" placeholder="Filtrar por nome, bônus, fonte…" value="${esc(iState.q)}" />
      <div class="filter-row"><span class="filter-label">Tier</span><div class="chips">
        ${tiers.map((t) => chip("tiers", t, t, iState.tiers.has(t), TIER_COLORS[t])).join("")}
      </div></div>
      <div class="filter-row"><span class="filter-label">Categoria</span><div class="chips">
        ${cats.map((c) => chip("cats", c, c, iState.cats.has(c))).join("")}
      </div></div>
      <div class="filter-row db-controls">
        <label>Ordenar
          <select class="db-sort">
            <option value="doc">Ordem do doc</option>
            <option value="name">Nome (A–Z)</option>
            <option value="cat">Categoria</option>
          </select>
        </label>
        <button class="db-clear">✕ Limpar filtros</button>
        <span class="db-count"></span>
      </div>
    </div>
    <div id="db-body"></div>
    <section class="db-group">
      <h2 class="db-h2">Tipos de item de mão <span class="dim-note">— o roster decidido (12 tipos)</span></h2>
      <table class="db-table"><thead><tr>
        <th>Tipo</th><th>Mãos</th><th>Escala</th><th>Subtipo físico</th><th>Essência</th>
      </tr></thead><tbody>
      ${data.roster.map((r) => `<tr>
        <td><strong>${fmt(r.tipo)}</strong></td><td>${fmt(r.maos)}</td><td>${fmt(r.escala)}</td>
        <td>${fmt(r.subtipo)}</td><td class="dim">${fmt(r.essencia)}</td>
      </tr>`).join("")}</tbody></table>
    </section>
    ${spriteGallery()}`;

  const $sort = $doc.querySelector(".db-sort");
  $sort.value = iState.sort;
  $sort.addEventListener("change", () => { iState.sort = $sort.value; iRenderBody($doc, data); });
  wireToolbar($doc, iState, () => iRenderBody($doc, data), () => renderItems($doc, data));
  iRenderBody($doc, data);
}

function iRenderBody($doc, data) {
  const q = iState.q.toLowerCase();
  let list = data.items.filter((i) => {
    if (iState.tiers.size && !iState.tiers.has(i.tier)) return false;
    if (iState.cats.size && !iState.cats.has(i.cat)) return false;
    if (q) {
      const hay = `${i.name} ${i.en} ${i.tipo} ${i.fonte} ${i.bonus} ${i.nums} ${i.nota}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (iState.sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  if (iState.sort === "cat") list = [...list].sort((a, b) => a.cat.localeCompare(b.cat) || a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name));

  const $count = $doc.querySelector(".db-count");
  if ($count) $count.textContent = `${list.length} de ${data.items.length} itens`;

  $doc.querySelector("#db-body").innerHTML = !list.length ? emptyMsg() : `
    <table class="db-table"><thead><tr>
      <th></th><th>Item</th><th>EN</th><th>Tier</th><th>Categoria</th><th>Tipo/Slot</th><th>Números</th><th>Fonte</th><th>Bônus / Nota</th>
    </tr></thead><tbody>
    ${list.map((i) => {
      const ec = elementColor(i.name + " " + i.bonus);
      const sprites = itemSprites(i.name);
      return `<tr>
      <td style="width:40px;text-align:center">${sprites.map((s) => spriteImg(s, i.name)).join("")}</td>
      <td><strong${ec ? ` style="color:${ec}"` : ""}>${fmt(i.name)}</strong></td>
      <td class="dim"><em>${fmt(i.en)}</em></td>
      <td><span class="tier-badge" style="--tc:${TIER_COLORS[i.tier] ?? "#8890a0"}">${esc(i.tier)}</span></td>
      <td>${esc(i.cat)}</td>
      <td>${fmt(i.tipo)}</td>
      <td>${fmt(i.nums)}</td>
      <td>${fmt(i.fonte)}</td>
      <td class="dim">${fmt([i.bonus, i.nota].filter(Boolean).join(" — "))}</td>
    </tr>`; }).join("")}
  </tbody></table>`;
}

function classCard(c) {
  const cc = CLASS_COLORS[c.name] ?? "#c8a84b";
  const field = (lbl, val) =>
    val ? `<p class="cls-field"><span class="lbl">${lbl}</span>${fmt(val)}</p>` : "";
  return `<article class="class-card" style="--cc:${cc}">
    <h2>${esc(c.name)}</h2>
    ${c.fantasia ? `<p class="cls-fantasy">“${fmt(c.fantasia)}”</p>` : ""}
    ${field("Kit inicial", c.kit)}
    ${field("Atributos-chave", c.atributos)}
    ${field("Lentes de rastreamento", c.lentes)}
    ${c.caminhos.length ? `<div class="cls-paths">
      <span class="lbl">Caminhos típicos (especialização emergente)</span>
      ${c.caminhos.map((p) => `<div class="path-item">
        <span class="path-name">${esc(p.name || "✏️")}</span>${p.alias ? ` <span class="path-alias">(${esc(p.alias)})</span>` : ""}
        ${p.cond ? `<span class="path-cond">${fmt(p.cond)}</span>` : ""}
        ${p.effect ? `<span class="path-effect">→ ${fmt(p.effect)}</span>` : ""}
      </div>`).join("")}
    </div>` : ""}
    ${c.note ? `<p class="cls-note">${fmt(c.note)}</p>` : ""}
  </article>`;
}

// ---------------- Quests (fatia ① Alvorada) ----------------

const CAMADA_COLORS = {
  rito: "#ffd86a", direta: "#58c878", composta: "#e8a35a",
  encadeada: "#e8a35a", aberta: "#4a9cc8", segredo: "#b04ad8",
};
const CAMADA_ORDER = ["rito", "direta", "composta", "encadeada", "aberta", "segredo"];
const AREA_ORDER = ["Cidade", "Esgotos", "Oeste", "Norte", "Nordeste", "Leste", "Sul"];

function renderQuests($doc, data) {
  const camadas = CAMADA_ORDER.filter((c) => data.quests.some((q) => q.camada === c));
  const areas = AREA_ORDER.filter((a) => data.quests.some((q) => q.area === a));
  const nQ = data.quests.filter((q) => q.camada !== "rito").length;
  const nR = data.quests.length - nQ;
  $doc.innerHTML = `
    <header class="db-header">
      <h1>📜 Quests — Fatia ① (Alvorada)</h1>
      <p class="db-sub"><strong>${nQ} quests</strong> + <strong>${nR} ritos de classe</strong>, organizadas por área × nível.
        Camadas: direta (marker) · aberta (rumor) · segredo (nunca anunciada) — recompensa proporcional à opacidade.
        Fonte: <a href="#/quests-fatia1">design/fatia-1-alvorada/QUESTS.md</a></p>
    </header>
    <div class="db-toolbar">
      <input class="db-search" type="search" placeholder="Filtrar por nome, NPC, recompensa…" value="${esc(qState.q)}" />
      <div class="filter-row"><span class="filter-label">Camada</span><div class="chips">
        ${camadas.map((c) => chip("camadas", c, c, qState.camadas.has(c), CAMADA_COLORS[c])).join("")}
        ${chip("camadas", "longa", "⏳ longa maturação", qState.camadas.has("longa"), "#c9a8ff")}
      </div></div>
      <div class="filter-row"><span class="filter-label">Área</span><div class="chips">
        ${areas.map((a) => chip("areas", a, a, qState.areas.has(a))).join("")}
      </div></div>
      <div class="filter-row db-controls">
        <label>Ordenar
          <select class="db-sort">
            <option value="doc">Ordem do doc (área)</option>
            <option value="nivel">Nível ↑</option>
            <option value="camada">Camada</option>
          </select>
        </label>
        <button class="db-clear">✕ Limpar filtros</button>
        <span class="db-count"></span>
      </div>
    </div>
    <div id="db-body"></div>`;

  const $sort = $doc.querySelector(".db-sort");
  $sort.value = qState.sort;
  $sort.addEventListener("change", () => { qState.sort = $sort.value; qRenderBody($doc, data); });
  wireToolbar($doc, qState, () => qRenderBody($doc, data), () => renderQuests($doc, data));
  qRenderBody($doc, data);
}

function nivelMin(q) {
  if (q.camada === "rito") return 0;
  const m = q.nivel.match(/\d+/);
  return m ? parseInt(m[0], 10) : 99;
}

function qRenderBody($doc, data) {
  const q = qState.q.toLowerCase();
  const wantLonga = qState.camadas.has("longa");
  const wantCamadas = new Set([...qState.camadas].filter((c) => c !== "longa"));
  let list = data.quests.filter((it) => {
    if (wantCamadas.size && !wantCamadas.has(it.camada)) return false;
    if (wantLonga && !it.longa) return false;
    if (qState.areas.size && !qState.areas.has(it.area)) return false;
    if (q) {
      const hay = `${it.id} ${it.pt} ${it.en} ${it.npc} ${it.destrava} ${it.areaRaw} ${it.fields.map((f) => f.label + " " + f.value).join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (qState.sort === "nivel") list = [...list].sort((a, b) => nivelMin(a) - nivelMin(b));
  if (qState.sort === "camada")
    list = [...list].sort((a, b) => CAMADA_ORDER.indexOf(a.camada) - CAMADA_ORDER.indexOf(b.camada) || nivelMin(a) - nivelMin(b));

  const $count = $doc.querySelector(".db-count");
  if ($count) $count.textContent = `${list.length} de ${data.quests.length}`;
  $doc.querySelector("#db-body").innerHTML = list.length
    ? `<div class="quest-grid">${list.map(questCard).join("")}</div>`
    : emptyMsg();
}

// campos de texto longo viram citação; os demais, linhas label/valor
const QUOTE_FIELDS = ["Texto-pista", "Registro no diário", "Texto da carta"];

function questCard(qst) {
  const cc = CAMADA_COLORS[qst.camada] ?? "#8890a0";
  const fieldHtml = (f) => {
    const isQuote = QUOTE_FIELDS.some((x) => f.label.startsWith(x));
    if (isQuote) return `<blockquote class="q-quote"><span class="lbl">${esc(f.label.replace(/\s*✏️.*$/, ""))}</span>${fmt(f.value)}</blockquote>`;
    return `<p class="q-field"><span class="lbl">${esc(f.label)}</span>${fmt(f.value)}</p>`;
  };
  // não repetir no corpo o que já está no topo do card
  const skip = ["Camada", "Nível-alvo", "NPC / gatilho", "Local"];
  const fields = qst.fields.filter((f) => !skip.some((s) => f.label.startsWith(s)));
  return `<article class="quest-card" style="--qc:${cc}">
    <div class="qc-top">
      <h2>${esc(qst.pt)}${qst.en ? ` <em class="qc-en">${esc(qst.en)}</em>` : ""}</h2>
      <span class="qc-id">${esc(qst.id)}</span>
    </div>
    <div class="qc-meta">
      <span class="camada-badge" style="--qc:${cc}">${esc(qst.camadaRaw)}</span>
      ${qst.longa ? `<span class="camada-badge" style="--qc:#c9a8ff">⏳ longa maturação</span>` : ""}
      <span class="qc-lvl">nv ${esc(qst.nivel)}</span>
      <span class="qc-area">📍 ${esc(qst.areaRaw)}</span>
    </div>
    <p class="q-field"><span class="lbl">${qst.camada === "rito" ? "Local" : "NPC / gatilho"}</span>${fmt(qst.npc)}</p>
    ${fields.map(fieldHtml).join("")}
    ${qst.destrava ? `<p class="q-field qc-destrava"><span class="lbl">Destrava</span>${fmt(qst.destrava)}</p>` : ""}
  </article>`;
}
