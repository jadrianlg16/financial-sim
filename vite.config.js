import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep font files as files: inlined as data: URIs they would bloat the CSS and
    // need a looser Content-Security-Policy (font-src data:).
    assetsInlineLimit: (filePath) => (/\.woff2?$/.test(filePath) ? false : undefined),
  },
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node',
  },
});
