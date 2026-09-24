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
      setupFiles: ['./src/test/setup.ts'],
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
