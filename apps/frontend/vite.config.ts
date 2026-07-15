/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(async () => {
  const tailwindcss = (await import('@tailwindcss/vite')).default;
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/frontend',
    server: {
      port: 4200,
      host: '0.0.0.0',
    },
    preview: {
      port: 4300,
      host: 'localhost',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
    },
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [ nxViteTsPaths() ],
    // },
    build: {
      outDir: './dist',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  }
});
