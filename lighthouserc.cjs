// Lighthouse CI budgets for the three redesigned marketing pages
// (design spec's LCP/CLS/INP performance budgets). Run via
// `pnpm test:performance` (Lighthouse CI's own `autorun`), locally and
// in CI (`.github/workflows/ci.yml`'s browser-checks job), after
// `pnpm build`.
//
// `collect.staticDistDir` is deliberately not used: Lighthouse CI's
// built-in static server has no notion of this project's routing
// (a slash-less URL like `/for-agencies` resolving to its own
// prerendered `index.html`, a trailing-slash redirect, `404.html`), so
// it would not exercise the real production behaviour. `scripts/serve-dist.mjs`
// already reproduces that behaviour for Playwright (see
// playwright.config.ts) and is reused here via `startServerCommand`.
//
// INP is a field metric (real user interaction latency) and cannot be
// measured by a lab tool like Lighthouse; it is out of scope for this
// budget file. See README's CI gate section for where INP is measured.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/serve-dist.mjs dist 4190',
      startServerReadyPattern: 'serving .* on http',
      startServerReadyTimeout: 15_000,
      url: [
        'http://127.0.0.1:4190/',
        'http://127.0.0.1:4190/product',
        'http://127.0.0.1:4190/for-agencies',
      ],
      // A single headless Chrome launch on a shared/sandboxed CI runner (and
      // on this dev machine) shows real first-paint jitter of one to two
      // seconds between otherwise identical runs of the same static page,
      // most likely GPU/compositor warm-up variance with no GPU
      // acceleration available. Five runs and LHCI's default median-run
      // assertion absorb that jitter instead of gating on a single noisy
      // sample.
      numberOfRuns: 5,
    },
    assert: {
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        interactive: ['error', { maxNumericValue: 3500 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci',
    },
  },
}
