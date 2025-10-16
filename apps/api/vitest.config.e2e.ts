import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/e2e/**/*.e2e-spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 30000, // E2E tests may take longer
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: true, // Run each test file in isolation
    pool: 'forks', // Use process pool for better isolation
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
});
