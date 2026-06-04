import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    watch: {
      // Projeto em /mnt/c (WSL): inotify não funciona em drvfs — usar polling.
      usePolling: true,
      interval: 300,
    },
  },
  build: {
    target: "es2022",
  },
});
