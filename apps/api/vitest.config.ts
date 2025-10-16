import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/unit/**/*.spec.ts'], // Unit tests only
    exclude: ['test/e2e/**/*.ts', 'node_modules/**', 'dist/**'],
    passWithNoTests: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.module.ts',
        '**/*.dto.ts',
        '**/*.interface.ts',
        '**/*.decorator.ts',
        '**/*.guard.ts',
        '**/*.strategy.ts',
        '**/main.ts',
        '**/index.ts',
        '**/*.d.ts',
      ],
      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
    },
  },
});
