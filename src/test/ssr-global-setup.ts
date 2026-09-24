// Vitest `globalSetup` (see vitest.config.ts): runs once, in its own
// process, before any test file. Renders HYDRATION_URLS through the real
// SSR entry (`render()` in src/entry-server.tsx) and hands the results to
// the hydration tests (src/lib/client-app*.test.tsx) through
// `project.provide()` / `inject()`.
//
// Why a separate process instead of calling `render()` in the test file:
//
// 1. React's server (Fizz) and client (Fiber) renderers share
//    process-wide internal state. A streaming SSR render that suspends
//    and resumes (every page here is `React.lazy()`) leaves that state
//    inconsistent for a later client render in the same process, which
//    then fails with a spurious "You cannot render a <Router> inside
//    another <Router>".
// 2. Doing it here, once and before the concurrent test phase, keeps the
//    cost of booting a Vite server from competing with other test files
//    for CPU (which pushed unrelated waits past their timeouts).
//
// On every watch-mode rerun (`project.onTestsRerun`) it renders again with
// a fresh, short-lived Vite server, so the fixture always reflects the
// current source. That server only loads one SSR module: middleware mode,
// no HMR WebSocket (which would bind a port another worktree may hold),
// no file watcher, no dependency discovery.

import { createServer } from 'vite'
import type { TestProject } from 'vitest/node'
import type { RenderResult } from '@/entry-server'
import { HYDRATION_URLS } from './hydration-fixture'

type HydrationFixture = Record<(typeof HYDRATION_URLS)[number], RenderResult>

declare module 'vitest' {
  export interface ProvidedContext {
    hydrationFixture: HydrationFixture
  }
}

async function renderFixture(): Promise<HydrationFixture> {
  const server = await createServer({
    server: { middlewareMode: true, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: 'custom',
    logLevel: 'error',
  })

  try {
    const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
    // Sequential for simplicity: a handful of renders, and concurrent
    // server-only renders would be safe too (point 1 above is about a
    // later *client* render).
    const results: RenderResult[] = []
    for (const url of HYDRATION_URLS) {
      results.push(await render(url))
    }
    return Object.fromEntries(HYDRATION_URLS.map((url, i) => [url, results[i]])) as HydrationFixture
  } finally {
    await server.close()
  }
}

export default async function setup(project: TestProject) {
  project.provide('hydrationFixture', await renderFixture())
  project.onTestsRerun(async () => {
    project.provide('hydrationFixture', await renderFixture())
  })
}
