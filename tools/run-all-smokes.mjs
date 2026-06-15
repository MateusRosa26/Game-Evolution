/**
 * RUNNER de smoke tests headless (sim pura).
 *
 * Descobre todos os tools/_smoke-*.ts, builda cada um com esbuild (bundle, platform=node)
 * e roda com node, capturando exit code. Imprime um sumário e sai 1 se algum falhar.
 *
 * Rodar:
 *   node tools/run-all-smokes.mjs            # todos
 *   node tools/run-all-smokes.mjs drop mana  # só os que casam com os filtros
 */
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const toolsDir = dirname(fileURLToPath(import.meta.url));
const filters = process.argv.slice(2);

const all = readdirSync(toolsDir)
  .filter((f) => f.startsWith("_smoke-") && f.endsWith(".ts"))
  .sort();

const selected = filters.length
  ? all.filter((f) => filters.some((q) => f.includes(q)))
  : all;

if (selected.length === 0) {
  console.error(`Nenhum smoke casou com: ${filters.join(", ")}`);
  process.exit(2);
}

console.log(`Rodando ${selected.length} smoke test(s)...\n`);

const results = [];
for (const file of selected) {
  const name = file.replace(/^_smoke-/, "").replace(/\.ts$/, "");
  const src = join(toolsDir, file);
  const out = join(tmpdir(), `smoke-${name}.cjs`);

  const build = spawnSync(
    "npx",
    ["esbuild", src, "--bundle", "--platform=node", `--outfile=${out}`],
    { encoding: "utf8" }
  );
  if (build.status !== 0) {
    console.log(`\n=== ${name} ===`);
    console.log(build.stderr || build.stdout);
    results.push({ name, status: "BUILD-FAIL" });
    continue;
  }

  const run = spawnSync("node", [out], { encoding: "utf8" });
  process.stdout.write(`\n=== ${name} ===\n`);
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  results.push({ name, status: run.status === 0 ? "PASS" : "FAIL" });
}

console.log("\n\n======== SUMÁRIO ========");
let failed = 0;
for (const r of results) {
  if (r.status !== "PASS") failed++;
  const mark = r.status === "PASS" ? "✓" : "✗";
  console.log(`  ${mark} ${r.status.padEnd(10)} ${r.name}`);
}
console.log("=========================");
console.log(`${results.length - failed}/${results.length} verde\n`);
process.exit(failed === 0 ? 0 : 1);
