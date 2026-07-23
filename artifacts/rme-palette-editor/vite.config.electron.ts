import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "electron/main.ts"),
      name: "main",
      fileName: () => "main.js",
      formats: ["cjs"],
    },
    outDir: path.resolve(__dirname, "dist/electron"),
    emptyOutDir: false,
    rollupOptions: {
      external: ["electron"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
