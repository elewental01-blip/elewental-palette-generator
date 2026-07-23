import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "electron/main.ts"),
      formats: ["cjs"],
      fileName: () => "main.mjs",
    },
    outDir: path.resolve(__dirname, "dist/electron"),
    target: "node20",
    rollupOptions: {
      external: ["electron"],
      output: {
        format: "cjs",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});