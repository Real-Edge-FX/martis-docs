import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Vitest reuses the app's own Vite config (MDX plugin, `@`/`@content`
// aliases, Tailwind) so tests exercise the same module graph the
// bundler produces, instead of drifting from it.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      // No global testTimeout override: Vitest's 5000ms default is right
      // for nearly everything here. The few tests that do real work under
      // concurrent load (SSR through renderToPipeableStream, dynamic
      // page-chunk imports) instead take their own explicit timeout at
      // the `it(...)` call — see entry-server.test.tsx's route sweep,
      // Docs.test.tsx and smoke.test.tsx — so a blanket 4x increase can't
      // hide a real hang appearing anywhere else in the suite.
      setupFiles: ['./src/test/setup.ts'],
      // Renders the hydration test's fixture HTML once, in its own
      // process, before the concurrent test phase starts, and again on
      // every watch-mode rerun (see the comment in the file itself for
      // both why this cannot run inline and why it re-renders on rerun).
      globalSetup: ['./src/test/ssr-global-setup.ts'],
      css: false,
      // scripts/ holds plain Node scripts (build-search-index.mjs,
      // prerender.mjs) and prerender.test.mjs, a `node:assert` smoke
      // test over pnpm build's output, run on its own via `pnpm
      // test:prerender`. Its name still matches Vitest's default
      // `*.test.*` glob, so exclude the directory or Vitest tries to
      // run it as a suite and fails with "No test suite found".
      //
      // tests/e2e/ holds Playwright specs (`pnpm test:e2e`), whose
      // `.spec.ts` name matches Vitest's default `*.spec.*` glob too;
      // `test.describe()` from `@playwright/test` throws outside a
      // Playwright run, so this directory must stay excluded as well.
      exclude: [...configDefaults.exclude, 'scripts/**', 'tests/e2e/**'],
    },
  }),
)
