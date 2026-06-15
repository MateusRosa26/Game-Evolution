// Smoke headless do motor de QUEST — etapa `kill` (e o que dá pra alcançar de
// `collect`/turn-in sem montar o cast de NPCs). Prova ponta a ponta que:
//   (1) matar a criatura-alvo CREDITA progresso e avança a etapa de caça;
//   (2) o contador respeita `count` (N kills → fecha em "report");
//   (3) etapas encadeadas (kill→kill) avançam pelo MESMO evento de morte;
//   (4) o GATE de espécie/`mapId` rejeita kills que não casam (espécie errada,
//       mapId errado) — nada credita;
//   (5) over-kill depois de fechar NÃO corrompe o estado;
//   (6) a etapa `collect` NÃO avança por evento de mundo (entrega é por diálogo)
//       — prova que kill/collect são caminhos separados no engine.
//
// NÃO duplica _smoke-quest-hooks.ts (que cobre `interact` + `region_enter`).
//
// TURN-IN/RECOMPENSA (completeQuest): no engine atual o pagamento da recompensa
// (XP/gold/item) só acontece via efeito `completeQuest` de um nó de DIÁLOGO de um
// NPC real (Simulation.ts ~947), e não há debug helper para reportar uma quest.
// Montar o cast/diálogo foge do escopo determinístico deste smoke — então o
// reward-grant em si NÃO é exercido aqui (marcado SKIPPED no fim). O que provamos
// é tudo que leva DETERMINISTICAMENTE até a porta do report.
//
// Rodar: node tools/run-all-smokes.mjs quest-kill   (esbuild bundle → node)

import { Simulation } from "../src/sim/Simulation";
import { QUESTS, type QuestDef } from "../src/sim/quests";
import { generateTestMap } from "../src/sim/maps/testMap";

// ── Quests de teste (registradas em runtime, NÃO commitadas como conteúdo) ────
// O testMap não tem `id` → o evento de morte usa mapId "alvorada" (Simulation
// ~614). Quests sem `mapId` casam em qualquer mapa.
const Q_KILL1: QuestDef = {
  id: "_smoke_kill1",
  name: "[smoke] Matar 1 rato",
  layer: "direta",
  giverNpcId: "_smoke",
  stages: [{ type: "kill", species: "rato", count: 1 }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
const Q_KILL2: QuestDef = {
  id: "_smoke_kill2",
  name: "[smoke] Matar 2 ratos",
  layer: "direta",
  giverNpcId: "_smoke",
  stages: [{ type: "kill", species: "rato", count: 2 }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
// Encadeada: 1 rato → 1 rato (duas etapas de caça, ambas count 1).
const Q_CHAIN: QuestDef = {
  id: "_smoke_chain",
  name: "[smoke] Caçar em duas etapas",
  layer: "direta",
  giverNpcId: "_smoke",
  stages: [
    { type: "kill", species: "rato", count: 1 },
    { type: "kill", species: "rato", count: 1 },
  ],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
// Gate de espécie: pede uma espécie que o testMap NÃO tem.
const Q_WRONGSP: QuestDef = {
  id: "_smoke_wrongsp",
  name: "[smoke] Matar um lobo (espécie inexistente aqui)",
  layer: "direta",
  giverNpcId: "_smoke",
  stages: [{ type: "kill", species: "lobo", count: 1 }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
// Gate de mapId: rato, mas restrito a um mapa que não é o do evento ("alvorada").
const Q_WRONGMAP: QuestDef = {
  id: "_smoke_wrongmap",
  name: "[smoke] Matar rato em outro mapa",
  layer: "direta",
  giverNpcId: "_smoke",
  stages: [{ type: "kill", species: "rato", count: 1, mapId: "porao_estalagem" }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
// Collect: NÃO deve avançar por evento de mundo (turn-in é por diálogo).
const Q_COLLECT: QuestDef = {
  id: "_smoke_collect",
  name: "[smoke] Coletar (não credita por kill)",
  layer: "direta",
  giverNpcId: "_smoke",
  stages: [{ type: "collect", templateId: "cauda_de_rato", count: 1, turnInNpcId: "_smoke" }],
  rewards: { xp: 0, gold: 0 },
  journalActive: "(smoke)",
  journalCompleted: "(smoke)",
};
for (const q of [Q_KILL1, Q_KILL2, Q_CHAIN, Q_WRONGSP, Q_WRONGMAP, Q_COLLECT]) {
  QUESTS[q.id] = q;
}

const PASS = "✅";
const FAIL = "❌";
let failures = 0;
function check(label: string, cond: boolean): void {
  console.log(`  ${cond ? PASS : FAIL} ${label}`);
  if (!cond) failures++;
}

// ── Helper de morte determinística (técnica de _smoke-loot.ts) ────────────────
// Acha um rato VIVO de menor id, posiciona o player ortogonalmente adjacente e
// FORA da zona segura (3×3 em volta do spawn), zera o HP e dirige selectTarget
// até a morte. Retorna a species do morto (ou null se nada morreu no orçamento).
function killOneRat(sim: Simulation, pid: number): string | null {
  const entities = (sim as any).entities as Map<number, any>;
  const player = entities.get(pid);

  let rat: any = null;
  let ratId = -1;
  for (const [id, e] of entities) {
    if (e.kind === "monster" && e.species === "rato" && !e.dead) {
      if (ratId === -1 || id < ratId) { ratId = id; rat = e; }
    }
  }
  if (!rat) return null;

  // Adjacente a oeste do rato, fora da zona segura (rato-âncora em (33,27)).
  player.pos = { x: rat.pos.x - 1, y: rat.pos.y };
  player.z = rat.z;
  rat.hp = 1;

  sim.handleCommand(pid, { type: "selectTarget", entityId: ratId });
  for (let i = 0; i < 40; i++) {
    sim.tick();
    if (rat.dead) return "rato";
  }
  return null;
}

console.log("QUEST KILL — motor staged (etapa de caça)\n");

// ── 1. kill count 1: mata → avança pra report ─────────────────────────────────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_KILL1.id);

  check("(1) kill count1 começa 'active'", sim.__debugQuestStage(pid, Q_KILL1.id) === "active");
  const killed = killOneRat(sim, pid);
  check("(1) um rato morreu sob auto-attack", killed === "rato");
  check("(1) matar o alvo credita e fecha a etapa única (→ report)",
    sim.__debugQuestStage(pid, Q_KILL1.id) === "report");
}

// ── 2. kill count 2: 1ª morte NÃO fecha; 2ª fecha ─────────────────────────────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_KILL2.id);

  const questsMap = (sim as any).entities.get(pid).quests as Map<string, any>;
  killOneRat(sim, pid);
  check("(2) após 1/2 kills a quest segue 'active'",
    sim.__debugQuestStage(pid, Q_KILL2.id) === "active");
  check("(2) progress = 1 após o 1º kill", questsMap.get(Q_KILL2.id).progress === 1);

  killOneRat(sim, pid);
  check("(2) após 2/2 kills a etapa fecha (→ report)",
    sim.__debugQuestStage(pid, Q_KILL2.id) === "report");
  check("(2) progress = count (2) no fechamento", questsMap.get(Q_KILL2.id).progress === 2);
}

// ── 3. cadeia kill→kill: cada morte avança UMA etapa ──────────────────────────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_CHAIN.id);

  const st = ((sim as any).entities.get(pid).quests as Map<string, any>).get(Q_CHAIN.id);
  check("(3) cadeia começa na etapa 0", st.stageIndex === 0 && st.stage === "active");
  killOneRat(sim, pid);
  check("(3) 1º kill avança pra etapa 1 (não fecha a quest)",
    st.stageIndex === 1 && st.stage === "active");
  killOneRat(sim, pid);
  check("(3) 2º kill fecha a última etapa (→ report)", st.stage === "report");
}

// ── 4a. GATE de espécie: matar rato NÃO credita uma quest que pede 'lobo' ──────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_WRONGSP.id);

  killOneRat(sim, pid);
  check("(4a) matar a espécie ERRADA não credita (segue 'active')",
    sim.__debugQuestStage(pid, Q_WRONGSP.id) === "active");
  check("(4a) progress segue 0 na espécie errada",
    ((sim as any).entities.get(pid).quests as Map<string, any>).get(Q_WRONGSP.id).progress === 0);
}

// ── 4b. GATE de mapId: rato certo, mapId errado → não credita ─────────────────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_WRONGMAP.id);

  killOneRat(sim, pid);
  check("(4b) kill com mapId que não casa não credita (segue 'active')",
    sim.__debugQuestStage(pid, Q_WRONGMAP.id) === "active");
}

// ── 5. over-kill: matar de novo depois de fechar NÃO corrompe o estado ────────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_KILL1.id);

  killOneRat(sim, pid);
  check("(5) etapa fechou (→ report) antes do over-kill",
    sim.__debugQuestStage(pid, Q_KILL1.id) === "report");
  const st = ((sim as any).entities.get(pid).quests as Map<string, any>).get(Q_KILL1.id);
  const snap = { stageIndex: st.stageIndex, progress: st.progress, stage: st.stage };
  killOneRat(sim, pid); // mata outro rato — quest já não está 'active', deve ignorar
  check("(5) over-kill não muda stage (segue 'report')", st.stage === snap.stage);
  check("(5) over-kill não mexe em stageIndex/progress",
    st.stageIndex === snap.stageIndex && st.progress === snap.progress);
}

// ── 6. collect NÃO avança por evento de mundo (caminho separado de kill) ──────
{
  const sim = new Simulation(generateTestMap());
  const pid = sim.addPlayer("Cacador");
  sim.tick();
  sim.__debugAcceptQuest(pid, Q_COLLECT.id);

  killOneRat(sim, pid); // morte gera evento kill — uma etapa collect deve IGNORAR
  check("(6) etapa collect não avança por kill (segue 'active')",
    sim.__debugQuestStage(pid, Q_COLLECT.id) === "active");
  check("(6) progress da collect segue 0",
    ((sim as any).entities.get(pid).quests as Map<string, any>).get(Q_COLLECT.id).progress === 0);
}

console.log(`\nSKIPPED: turn-in/reward (completeQuest) — exige nó de diálogo de NPC`);
console.log(`         real (Simulation.ts ~947) e não há debug helper de report.`);
console.log(`\n${failures === 0 ? PASS + " TODOS OS ASSERTS OK" : FAIL + " " + failures + " FALHA(S)"}`);
process.exit(failures === 0 ? 0 : 1);
