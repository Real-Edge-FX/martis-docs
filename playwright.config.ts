import { defineConfig, devices } from '@playwright/test'

// E2E visual/accessibility gate for the getmartis.com redesign (design spec
// 17, "Breakpoints de validação"): four viewports, three marketing pages,
// axe with no critical/serious violations, no horizontal overflow, a
// usable mobile menu.
//
// The suite runs against `pnpm build`'s real static output, served by
// `scripts/serve-dist.mjs`, not `vite preview`: preview's SPA fallback
// serves `index.html` for every unknown path, which would hide the fact
// that a slash-less route like `/for-agencies` resolves to its own
// prerendered file on the real static host (see that script's own
// comment). `pnpm build` must run first; `webServer` does not run it,
// so a stale `dist/` would silently test old output.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4180',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs dist 4180',
    url: 'http://127.0.0.1:4180',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
