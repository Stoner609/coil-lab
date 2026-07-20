import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { finMindProxyOptions } from './src/domain/twseProxy';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/finmind': finMindProxyOptions,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
