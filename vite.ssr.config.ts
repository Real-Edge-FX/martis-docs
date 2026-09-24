import { defineConfig, mergeConfig } from 'vite'
import viteConfig from './vite.config'

// Builds the Node-executable bundle `scripts/prerender.mjs` imports:
// `render`, `PUBLIC_ROUTES`, `getRouteMeta` and `SITE_URL` from
// `src/entry-server.tsx`. Reuses the client config (MDX plugin,
// Tailwind, `@`/`@content` aliases) via `mergeConfig` so the module
// graph the server bundle sees never drifts from the client's, then
// overrides `build` for an SSR entry: `build.ssr` makes Vite treat
// this as a server build (dependencies stay real `node_modules`
// imports instead of being bundled) and emit a single ES module,
// `dist-ssr/entry-server.js`, importable by that plain Node script.
export default mergeConfig(
  viteConfig,
  defineConfig({
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: 'dist-ssr',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: 'entry-server.js',
        },
      },
    },
  }),
)
