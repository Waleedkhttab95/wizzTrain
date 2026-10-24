import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the app's pure logic — the program-builder diff, date and
 * formatting helpers, roster status rules.
 *
 * Components are not covered here: rendering them would pull in jsdom and a
 * testing library, and the screens are verified end to end against the running
 * API instead. This config deliberately stays at one dependency.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // A test that needs a browser API is a signal it belongs in the e2e pass.
    globals: false,
  },
});
