import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/yayaandkekeworld/',
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
