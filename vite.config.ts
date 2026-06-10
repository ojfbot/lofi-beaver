import { defineConfig } from "vite";

export default defineConfig({
  // usePolling: fsevents starves under heavy concurrent-agent load and the
  // watcher silently serves stale modules — polling is reliable, if hungrier.
  server: { port: 5180, strictPort: false, watch: { usePolling: true, interval: 300 } },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
