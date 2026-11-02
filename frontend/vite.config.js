import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { port: 5173, host: true },
  build: { outDir: 'dist', assetsInlineLimit: 0, target: 'es2019' },
});
