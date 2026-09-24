// The URLs the hydration tests need server HTML for, shared between the
// producer (src/test/ssr-global-setup.ts) and the consumers
// (src/lib/client-app*.test.tsx, through `inject('hydrationFixture')`) so
// they cannot drift apart.

export const HYDRATION_URLS = [
  '/',
  '/docs/getting-started/installation',
  '/for-agencies',
  // Server HTML for an unknown docs URL is the /404 render (see
  // entry-server.test.tsx); hydrating at that same URL must match it.
  '/docs/does-not-exist',
] as const
