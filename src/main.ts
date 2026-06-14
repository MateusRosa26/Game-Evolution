import "./client/ui/dom/ui.css";
import { Application, TextureStyle } from "pixi.js";
import { loadPixellabAssets } from "./client/assets/pixellab";
import { Game } from "./client/Game";
import { LocalServer } from "./net/LocalServer";

// Pixel art: default CROCANTE (nearest) — UI, ícones, texto. A arte do MUNDO
// (terreno/objetos/chars/mobs) faz opt-in de "linear" no ponto de criação
// (sprites.ts/pixellab.ts/WorldRenderer), porque a câmera a encolhe (FOV ~9) e
// nearest no downscale não-inteiro quebra outline/cintila.
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

  // Assets PixelLab (árvores, knight preview) — antes do Game nascer.
  await loadPixellabAssets();

  // "Servidor" local — no futuro online, troca-se por um WebSocketTransport.
  const server = new LocalServer();
  server.start();
  const transport = server.connect("Herói");

  new Game(app, transport);
}

boot();
