import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssMinify: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    restoreMocks: true,
    // Tests use a fixed catalogue, so editing products in /admin cannot block a deploy.
    alias: [
      {
        find: /^\.\/products\.json$/,
        replacement: fileURLToPath(new URL('./src/test/fixtures/products.json', import.meta.url)),
      },
    ],
  },
});
