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
  // CI also writes the HTML report so a failing run has something to
  // upload as an artifact (.github/workflows/ci.yml's browser-checks job).
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4180',
    trace: 'on-first-retry',
  },
  projects: [
    // `visual.spec.ts`'s pixel baselines are platform-specific (see that
    // file), so it is split into its own project, run only by
    // `pnpm test:visual`, and excluded from the `chromium` project that
    // `pnpm test:e2e`/CI run.
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /visual\.spec\.ts/ },
    { name: 'visual', use: { ...devices['Desktop Chrome'] }, testMatch: /visual\.spec\.ts/ },
  ],
  webServer: {
    command: 'node scripts/serve-dist.mjs dist 4180',
    url: 'http://127.0.0.1:4180',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
