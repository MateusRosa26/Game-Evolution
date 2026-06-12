import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    watch: {
      // Projeto em /mnt/c (WSL): inotify não funciona em drvfs — usar polling.
      // Cada poll faz fs.stat de cada arquivo vigiado cruzando a fronteira WSL↔Windows
      // (drvfs/9P), que é lento. Com 300ms vigiando a árvore toda, o event loop do Node
      // fica saturado de stat e DEMORA ~12s pra responder uma request (página fica "impossível
      // de abrir"). Solução: intervalo maior + só vigiar código-fonte, ignorando as pastas
      // pesadas que não disparam HMR (assets, docs, build). Derruba 12s → ~0,1s.
      usePolling: true,
      interval: 1000,
      ignored: [
        "**/node_modules/**",
        "**/.git/**",
        "**/dist/**",
        "**/design/**",
        "**/wiki/**",
        "**/*.png",
        "**/*.md",
      ],
    },
  },
  build: {
    target: "es2022",
  },
});
