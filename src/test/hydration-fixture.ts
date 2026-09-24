// Shared between src/test/ssr-global-setup.ts (produces the fixture) and
// src/lib/client-app.test.tsx (consumes it via `inject('hydrationFixture')`
// — see that file's `ProvidedContext` augmentation in ssr-global-setup.ts):
// the URLs the hydration regression test needs server HTML for, kept in
// one place so producer and consumer can never drift apart on which URLs
// are covered.

export const HYDRATION_URLS = [
  '/',
  '/docs/getting-started/installation',
  '/for-agencies',
  // Server HTML for an unknown docs URL is the /404 render (see
  // entry-server.test.tsx); hydrating at that same URL must match it.
  '/docs/does-not-exist',
] as const
