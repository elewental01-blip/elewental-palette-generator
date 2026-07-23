import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'electron/main.ts'),
      name: 'ElectronMain',
      fileName: (format) => `main.${format === 'es' ? 'mjs' : 'js'}`,
      formats: ['es'],
    },
    rollupOptions: {
      external: ['electron'],
    },
    outDir: 'dist/electron',
    emptyOutDir: true,
  },
  plugins: [react(), tailwindcss(), runtimeErrorOverlay()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, '..', '..', 'attached_assets'),
    },
  },
});