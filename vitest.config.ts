import { defineConfig, mergeConfig } from 'vitest/config'
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
    },
  }),
)
