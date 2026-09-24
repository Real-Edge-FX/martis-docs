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
      // Vitest's 5000ms default is tight for this suite: several files do
      // real work (SSR through renderToPipeableStream, dynamic page-chunk
      // imports) rather than mocking it, and entry-server.test.tsx renders
      // every public route in one test. Comfortably under is fine locally,
      // but under concurrent load (every test file's real work competing
      // for the same CPU) individual tests were timing out at the default
      // even though nothing was actually stuck. 20s matches the order of
      // magnitude of RENDER_TIMEOUT_MS (src/entry-server.tsx), the deadline
      // already accepted there as "generous but still catches a real hang".
      testTimeout: 20_000,
      setupFiles: ['./src/test/setup.ts'],
      // Renders the hydration test's fixture HTML once, in its own
      // process, before the concurrent test phase starts (see the
      // comment in the file itself for why this cannot run inline).
      globalSetup: ['./src/test/ssr-global-setup.mjs'],
      css: false,
      // scripts/ holds plain Node scripts (build-search-index.mjs,
      // prerender.mjs) and prerender.test.mjs, a `node:assert` smoke
      // test over pnpm build's output, run on its own via `pnpm
      // test:prerender`. Its name still matches Vitest's default
      // `*.test.*` glob, so exclude the directory or Vitest tries to
      // run it as a suite and fails with "No test suite found".
      exclude: [...configDefaults.exclude, 'scripts/**'],
    },
  }),
)
