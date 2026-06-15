/**
 * VERIFICADOR de LOOT DE CADÁVER (sim pura): matar um mob cria um cadáver-container
 * abrível; o loot é SEEDADO e DETERMINÍSTICO — duas execuções idênticas produzem
 * conteúdo byte-a-byte igual (mesmo ouro, mesmos templateIds/contagens).
 *
 * Não depende de taxas de drop específicas — prova só o determinismo da rng de loot.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-loot.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-loot.cjs && node /tmp/smoke-loot.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

/**
 * Mata o PRIMEIRO rato do testMap de forma rápida e determinística e retorna a
 * assinatura canônica do conteúdo do cadáver gerado (ou null se algo falhou).
 *
 * Receita: acha o rato (kind "monster"), zera o HP pra 1, posiciona o player
 * ADJACENTE e FORA da zona segura (3x3 ao redor de 28,26), manda atacar (selectTarget)
 * e roda ticks até o mob morrer.
 */
function killFirstRatAndDump(): { sig: string; corpseId: number } | null {
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Acougueiro");
  sim.tick();

  const entities = (sim as any).entities as Map<number, any>;
  const containers = (sim as any).containers;
  const corpses = (sim as any).corpses as { containerId: number; pos: { x: number; y: number }; z: number }[];

  // Acha o primeiro rato (menor id pra ser estável entre execuções).
  let rat: any = null;
  let ratId = -1;
  for (const [id, e] of entities) {
    if (e.kind === "monster" && e.species === "rato" && !e.dead) {
      if (ratId === -1 || id < ratId) { ratId = id; rat = e; }
    }
  }
  if (!rat) return null;

  const player = entities.get(pid);

  // Posiciona o player num tile ortogonalmente adjacente ao rato e FORA da zona
  // segura (27..29 × 25..27). O rato-âncora fica em (33,27); (32,27) é seguro.
  const adj = { x: rat.pos.x - 1, y: rat.pos.y };
  player.pos = { x: adj.x, y: adj.y };
  player.z = rat.z;

  // Mata rápido: HP baixo o bastante pra cair no primeiro/segundo golpe.
  rat.hp = 1;

  // Auto-attack: mira o monstro. A sim resolve o golpe nos ticks seguintes.
  sim.handleCommand(pid, { type: "selectTarget", entityId: ratId });

  // Roda ticks até o rato morrer (orçamento curto).
  const before = corpses.length;
  let dead = false;
  for (let i = 0; i < 40; i++) {
    sim.tick();
    if (rat.dead) { dead = true; break; }
  }
  if (!dead) return null;

  // Encontra o cadáver recém-criado na posição do rato.
  const corpse = corpses.slice(before).find((c) => c.pos.x === rat.pos.x && c.pos.y === rat.pos.y && c.z === rat.z)
    ?? corpses[corpses.length - 1];
  if (!corpse) return null;

  const c = containers.get(corpse.containerId);
  if (!c) return null;

  // Assinatura canônica do conteúdo: gold + (templateId×count) ordenados.
  const items = (sim as any).items;
  let gold = 0;
  const tally: Record<string, number> = {};
  for (const s of c.slots) {
    if (s == null) continue;
    if (s.kind === "gold") gold += s.amount;
    else if (s.kind === "stack") tally[s.templateId] = (tally[s.templateId] ?? 0) + s.count;
    else if (s.kind === "item") {
      const tid = items.get(s.instanceId)?.templateId ?? "?";
      tally[tid] = (tally[tid] ?? 0) + 1;
    }
  }
  const itemsSig = Object.keys(tally).sort().map((k) => `${k}x${tally[k]}`).join(",");
  const sig = `gold=${gold}|items=[${itemsSig}]`;
  return { sig, corpseId: corpse.containerId };
}

console.log("LOOT — cadáver + drop seedado (sim pura)\n");

console.log("== (1) matar um mob cria um cadáver-container abrível ==");
let runA: { sig: string; corpseId: number } | null = null;
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Acougueiro");
  sim.tick();

  const entities = (sim as any).entities as Map<number, any>;
  const containers = (sim as any).containers;
  const corpses = (sim as any).corpses as any[];

  let rat: any = null, ratId = -1;
  for (const [id, e] of entities) {
    if (e.kind === "monster" && e.species === "rato" && !e.dead) { if (ratId === -1 || id < ratId) { ratId = id; rat = e; } }
  }
  ok(!!rat, "rato plantado no testMap encontrado");

  const player = entities.get(pid);
  player.pos = { x: rat.pos.x - 1, y: rat.pos.y };
  player.z = rat.z;
  ok(!(sim as any).world.isSafeZone(player.pos.x, player.pos.y, player.z), "player posicionado FORA da zona segura");

  rat.hp = 1;
  sim.handleCommand(pid, { type: "selectTarget", entityId: ratId });
  let dead = false;
  for (let i = 0; i < 40; i++) { sim.tick(); if (rat.dead) { dead = true; break; } }
  ok(dead, "rato morreu sob auto-attack");

  const corpse = corpses.find((c) => c.pos.x === rat.pos.x && c.pos.y === rat.pos.y && c.z === rat.z);
  ok(!!corpse, "cadáver criado na posição do mob");
  ok(corpse && typeof corpse.containerId === "number", "cadáver tem containerId");

  const c = corpse ? containers.get(corpse.containerId) : undefined;
  ok(!!c, "container do cadáver existe no registry");

  // Abrível: player a ≤2 tiles do cadáver → openContainer passa no gate.
  if (corpse) {
    sim.handleCommand(pid, { type: "openContainer", containerId: corpse.containerId });
    sim.tick();
    ok(player.openContainers.has(corpse.containerId), "cadáver abrível (player adjacente)");
  }

  // Guarda a assinatura desta primeira execução pelo dump helper-livre acima.
  if (corpse && c) {
    const items = (sim as any).items;
    let gold = 0; const tally: Record<string, number> = {};
    for (const s of c.slots) {
      if (s == null) continue;
      if (s.kind === "gold") gold += s.amount;
      else if (s.kind === "stack") tally[s.templateId] = (tally[s.templateId] ?? 0) + s.count;
      else if (s.kind === "item") { const tid = items.get(s.instanceId)?.templateId ?? "?"; tally[tid] = (tally[tid] ?? 0) + 1; }
    }
    const itemsSig = Object.keys(tally).sort().map((k) => `${k}x${tally[k]}`).join(",");
    runA = { sig: `gold=${gold}|items=[${itemsSig}]`, corpseId: corpse.containerId };
  }
}

console.log("== (2) loot é DETERMINÍSTICO entre execuções idênticas ==");
{
  // Duas execuções FRESCAS e idênticas via helper (inclui a da seção 1 como runA).
  const r1 = killFirstRatAndDump();
  const r2 = killFirstRatAndDump();
  ok(!!r1 && !!r2, "ambas as execuções produziram cadáver");
  if (r1 && r2) {
    console.log(`     runB.sig = ${r1.sig}`);
    console.log(`     runC.sig = ${r2.sig}`);
    ok(r1.sig === r2.sig, "conteúdo do cadáver byte-idêntico entre duas execuções frescas");
  }
  if (runA && r1) ok(runA.sig === r1.sig, "execução da seção (1) bate com as execuções do helper");
}

console.log(failures === 0 ? "\nLOOT OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
