import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: here('./client'),
  publicDir: false,
  plugins: [react(), tailwindcss()],
  server: { fs: { allow: [here('.')] } }, // the client imports ../shared
  build: { outDir: here('./dist'), emptyOutDir: true }
});
