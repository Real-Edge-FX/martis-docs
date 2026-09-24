// Shared between src/test/ssr-global-setup.mjs (which produces the
// fixture) and src/lib/client-app.test.tsx (which consumes it): the URLs
// the hydration regression test needs server HTML for, and where that
// HTML is cached on disk between the two. Kept in one place so the
// producer and consumer can never drift apart on which URLs are covered.

import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HYDRATION_URLS = [
  '/docs/getting-started/installation',
  '/for-agencies',
  // Server HTML for an unknown docs URL is the /404 render (see
  // entry-server.test.tsx); hydrating at that same URL must match it.
  '/docs/does-not-exist',
]

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** node_modules/ is already untracked, so this cache needs no gitignore entry. */
export const FIXTURE_PATH = path.join(ROOT, 'node_modules', '.cache', 'martis-docs-hydration-fixture.json')
