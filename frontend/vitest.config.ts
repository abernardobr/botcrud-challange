import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['./tests/unit/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: [
        'src/**/*.d.ts',
        'src/boot/**',
        'src/router/**',
      ],
    },
  },
  resolve: {
    alias: {
      src: resolve(__dirname, './src'),
      stores: resolve(__dirname, './src/stores'),
      components: resolve(__dirname, './src/components'),
    },
  },
});
