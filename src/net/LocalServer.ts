import { TICK_MS } from "../shared/constants";
import type { ClientCommand, ClientTransport, ServerMessage } from "../shared/protocol";
import { Simulation } from "../sim/Simulation";
import { generateAlvoradaMap } from "../sim/maps/alvorada";

/**
 * "Servidor" embutido: roda a Simulation em ticks dentro da página e entrega
 * mensagens pelo mesmo protocolo que um servidor real usaria.
 *
 * Migração para online: este arquivo vira um processo Node + WebSocket;
 * o resto do jogo não muda.
 */
export class LocalServer {
  private sim: Simulation;
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastTime = 0;
  private accumulator = 0;

  constructor() {
    // Fatia ① — Alvorada (GRID.md). testMap segue no repo pro harness do Balancista.
    this.sim = new Simulation(generateAlvoradaMap());
  }

  start(): void {
    if (this.timer) return;
    this.lastTime = performance.now();
    // Fixed timestep com accumulator: se os timers atrasarem (aba em
    // background, máquina lenta), a simulação recupera os ticks perdidos.
    this.timer = setInterval(() => {
      const now = performance.now();
      this.accumulator += now - this.lastTime;
      this.lastTime = now;
      // teto de recuperação para não espiralar após pausas longas
      this.accumulator = Math.min(this.accumulator, TICK_MS * 20);
      while (this.accumulator >= TICK_MS) {
        this.accumulator -= TICK_MS;
        this.sim.tick();
      }
    }, TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Conecta um cliente: faz o "join" e devolve o transport. */
  connect(playerName: string): ClientTransport {
    const listeners: ((msg: ServerMessage) => void)[] = [];
    const playerId = this.sim.addPlayer(playerName);

    this.sim.onSnapshot((snap) => {
      for (const cb of listeners) cb({ type: "snapshot", snap });
    });

    return {
      send: (cmd: ClientCommand) => this.sim.handleCommand(playerId, cmd),
      onMessage: (cb: (msg: ServerMessage) => void) => {
        listeners.push(cb);
        // welcome entregue de forma assíncrona, como seria na rede
        queueMicrotask(() => cb({ type: "welcome", playerId, map: this.sim.world.map }));
      },
    };
  }
}
