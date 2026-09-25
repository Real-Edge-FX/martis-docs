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
      // Five runs, asserted against the median, for ordinary machine-to-
      // machine timing variance between runs.
      numberOfRuns: 5,
      // Lighthouse's default `simulate` throttling method does not replay
      // the page load under throttled conditions; it runs once
      // unthrottled and then estimates a throttled timeline from a
      // dependency graph of every request the page *started* before the
      // observed paint. Against a loopback static server (this project's
      // `scripts/serve-dist.mjs`), nearly every request — the JS entry,
      // every route chunk, every font — starts within the first few
      // milliseconds (no real network latency to space them out), so the
      // simulator treats them as if they contended for bandwidth on the
      // critical path even though none of them gate the LCP paint (the
      // LCP element here is the prerendered lede paragraph, already in
      // the static HTML: `Load Delay` and `Load Time` are both 0, i.e.
      // the observed LCP *is* FCP). That inflated `/` and `/product` to
      // 3.4-4.1s under `simulate`, comfortably over budget, on an
      // otherwise-fast page. `devtools` instead actually replays the
      // load through Chrome DevTools Protocol network/CPU throttling
      // (same mobile profile: 150ms RTT, 1.6 Mbps, 4x CPU), producing a
      // real timeline instead of a simulated one from an unthrottled
      // trace — LCP measures ~1.6s on every route with it. This is a
      // measurement-method fix, not a loosened budget: the 2500ms budget
      // and the mobile throttling profile are unchanged.
      settings: { throttlingMethod: 'devtools' },
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
