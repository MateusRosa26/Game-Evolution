import { Application, TextureStyle } from "pixi.js";
import { Game } from "./client/Game";
import { LocalServer } from "./net/LocalServer";

// Pixel art: nunca suavizar texturas.
TextureStyle.defaultOptions.scaleMode = "nearest";

async function boot(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x0a0c10,
    antialias: false,
    roundPixels: true,
    preference: "webgl",
  });
  document.getElementById("game")!.appendChild(app.canvas);

  // "Servidor" local — no futuro online, troca-se por um WebSocketTransport.
  const server = new LocalServer();
  server.start();
  const transport = server.connect("Herói");

  new Game(app, transport);
}

boot();
