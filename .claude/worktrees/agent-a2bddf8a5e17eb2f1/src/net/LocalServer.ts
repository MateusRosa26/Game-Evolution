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
  private raf: number | null = null;
  private lastTime = 0;
  private accumulator = 0;

  constructor() {
    // Fatia ① — Alvorada (GRID.md). testMap segue no repo pro harness do Balancista.
    this.sim = new Simulation(generateAlvoradaMap());
  }

  start(): void {
    if (this.raf != null) return;
    this.lastTime = performance.now();
    // Fixed timestep com accumulator: se o frame atrasar (aba em background,
    // máquina lenta), a simulação recupera os ticks perdidos.
    //
    // O pump roda no requestAnimationFrame — o MESMO relógio que o PixiJS usa pra
    // renderizar e pro tween de movimento do EntityRenderer. Com setInterval(50ms)
    // a produção de snapshots batia num relógio diferente do tween (rAF ~16.6ms);
    // o drift/clamping do setInterval + o accumulator entregavam snapshots ora
    // agrupados ora com gap, e como o cliente re-mira o tween a cada snapshot SEM
    // buffer, a velocidade VISUAL oscilava ao longo dos passos (a média ficava
    // certa — a sim é fixed-step). Um relógio só elimina essa batida. No online,
    // este arquivo vira Node+WebSocket e o jitter de rede pede um buffer de
    // interpolação no cliente; aqui (in-process) o rAF compartilhado já basta.
    const loop = () => {
      const now = performance.now();
      this.accumulator += now - this.lastTime;
      this.lastTime = now;
      // teto de recuperação para não espiralar após pausas longas
      this.accumulator = Math.min(this.accumulator, TICK_MS * 20);
      while (this.accumulator >= TICK_MS) {
        this.accumulator -= TICK_MS;
        this.sim.tick();
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
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
