// Smoke headless dos HOOKS DE MUNDO do motor staged (etapas `interact` e
// `region_enter`). Prova ponta a ponta que: (1) usar o comando `interact` perto
// de um `InteractableDef` avança uma quest, e (2) ENTRAR num `QuestRegionDef`
// avança outra — UMA vez. Não depende do client (só a sim pura + protocolo).
//
// Rodar: esbuild bundle (platform=node) → node. Ex.:
//   npx esbuild tools/_smoke-quest-hooks.ts --bundle --platform=node \
//     --outfile=/tmp/smoke.cjs && node /tmp/smoke.cjs
//
// Fixtures: o testMap planta 1 interactable ("test_alvenaria" em (24,26)) e
// 1 região ("test_ruina", a ruína ao norte). Aqui registramos 2 quests de teste
// no registry `QUESTS` (em runtime, NÃO commitadas como conteúdo) cujas etapas
// casam esses ids — é o único jeito de `creditQuestEvent` achar a def.

import { Simulation } from "../src/sim/Simulation";
import { QUESTS, type QuestDef } from "../src/sim/quests";
import { generateTestMap } from "../src/sim/maps/testMap";
import type { Snapshot } from "../src/shared/protocol";

// ── Quests de teste (single-stage; uma `interact`, outra `region_enter`) ──────
const Q_INTERACT: QuestDef = {
  id: "_smoke_interact",
  name: "[smoke] Examinar a alvenaria",
  layer: "aberta",
  giverNpcId: "_smoke",
  stages: [{ type: "interact", interactableId: "test_alvenaria" }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
const Q_REGION: QuestDef = {
  id: "_smoke_region",
  name: "[smoke] Entrar na ruína",
  layer: "aberta",
  giverNpcId: "_smoke",
  stages: [{ type: "region_enter", regionId: "test_ruina" }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
QUESTS[Q_INTERACT.id] = Q_INTERACT;
QUESTS[Q_REGION.id] = Q_REGION;

const PASS = "✅";
const FAIL = "❌";
let failures = 0;
function check(label: string, cond: boolean): void {
  console.log(`  ${cond ? PASS : FAIL} ${label}`);
  if (!cond) failures++;
}

// Posição atual do jogador (lida do último snapshot — rota online-ready).
let lastSnap: Snapshot | null = null;
function playerPos(pid: number): { x: number; y: number } {
  const me = lastSnap?.entities.find((e) => e.id === pid);
  return me ? me.pos : { x: -1, y: -1 };
}

// Caminha até (x,y) e tica SÓ até chegar a ≤`within` tiles do alvo (não fica
// idle: o testMap tem ratos perto do spawn que matariam o jogador parado, daí o
// orçamento curto + parada por chegada em vez de ticar um número fixo grande).
function walkTo(sim: Simulation, pid: number, x: number, y: number, within = 0, budget = 80): void {
  sim.handleCommand(pid, { type: "walkTo", x, y });
  for (let i = 0; i < budget; i++) {
    sim.tick();
    const p = playerPos(pid);
    if (Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= within) return;
  }
}

const sim = new Simulation(generateTestMap());
sim.onSnapshot((s) => { lastSnap = s; });
const pid = sim.addPlayer("Smoke");
sim.__debugAcceptQuest(pid, Q_INTERACT.id);
sim.__debugAcceptQuest(pid, Q_REGION.id);

console.log("HOOKS DE MUNDO — smoke do motor staged\n");
check("quest interact começa 'active'", sim.__debugQuestStage(pid, Q_INTERACT.id) === "active");
check("quest region começa 'active'", sim.__debugQuestStage(pid, Q_REGION.id) === "active");

// ── 1. INTERACT ───────────────────────────────────────────────────────────
// Interagir LONGE não deve avançar (prova o gate de alcance reach-based).
sim.handleCommand(pid, { type: "interact", interactableId: "test_alvenaria" });
sim.tick();
check("interact fora de alcance NÃO avança", sim.__debugQuestStage(pid, Q_INTERACT.id) === "active");

// Anda até o tile a leste da alvenaria (25,26) — chebyshev 1 do alvo — e interage.
walkTo(sim, pid, 25, 26, 0);
sim.handleCommand(pid, { type: "interact", interactableId: "test_alvenaria" });
sim.tick();
check("interact perto avança a quest (→ report)", sim.__debugQuestStage(pid, Q_INTERACT.id) === "report");

// Interagir de novo NÃO re-dispara (a etapa já passou; one-shot natural).
sim.handleCommand(pid, { type: "interact", interactableId: "test_alvenaria" });
sim.tick();
check("interact repetido não muda nada", sim.__debugQuestStage(pid, Q_INTERACT.id) === "report");

// ── 2. REGION_ENTER ─────────────────────────────────────────────────────────
check("region ainda 'active' antes de entrar", sim.__debugQuestStage(pid, Q_REGION.id) === "active");
// A ruína (test_ruina) é o rect x=22..34, y=10..18 — anda pra dentro (28,14).
walkTo(sim, pid, 28, 14, 0, 120);
check("entrar na região avança a quest (→ report)", sim.__debugQuestStage(pid, Q_REGION.id) === "report");

// Sai e volta: one-shot por personagem (enteredRegions) — não re-dispara nada.
walkTo(sim, pid, 28, 20, 0, 120); // pra fora (sul da ruína, y20 > rect.y+h=18)
walkTo(sim, pid, 28, 14, 0, 120); // de volta pra dentro
check("re-entrar não re-dispara (one-shot)", sim.__debugQuestStage(pid, Q_REGION.id) === "report");

console.log(`\n${failures === 0 ? PASS + " TODOS OS HOOKS OK" : FAIL + " " + failures + " FALHA(S)"}`);
process.exit(failures === 0 ? 0 : 1);
