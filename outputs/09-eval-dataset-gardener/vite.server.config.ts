import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "src/server.ts",
    outDir: "dist/server",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "server.js",
      },
    },
  },
});
