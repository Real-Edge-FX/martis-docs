// Vitest `globalSetup`: runs once, in its own process, before any test
// file executes (see vitest.config.ts). Renders the URLs the hydration
// regression test needs (src/lib/client-app.test.tsx) through the real
// SSR entry (src/entry-server.tsx's `render()`, the exact function the
// app and the prerender script use) and caches the results to disk.
//
// Why not just call `render()` inside client-app.test.tsx's own
// `beforeAll`, in-process? Two problems, both about where the work runs:
//
// 1. React's server (Fizz, react-dom/server) and client (Fiber,
//    react-dom/client) renderers share process-wide internal state (a
//    context's "current value" slot). A *streaming* SSR render that
//    suspends and resumes — which every route here does, since every
//    page is React.lazy()-loaded — leaves that state inconsistent for a
//    *later* client render in the *same* process. The symptom has
//    nothing to do with the actual hydration under test: it surfaces as
//    a spurious "You cannot render a <Router> inside another <Router>"
//    error the moment any <BrowserRouter> renders afterwards, even with
//    a trivial client tree. `globalSetup` runs in a separate process
//    from the worker that later hydrates, so nothing is shared.
//
// 2. Even calling it in a *subprocess* from within the test file (an
//    earlier version of this fix) caused real flakiness elsewhere: the
//    subprocess boots a full Vite server, and that CPU burst, running
//    *concurrently* with the rest of the suite, was enough to blow
//    unrelated findBy*/test timeouts (Docs.test.tsx, and even
//    entry-server.test.tsx's own 60-route SSR sweep) under load — not a
//    real bug, just resource contention. Running it in `globalSetup`
//    means it happens once, serially, before the concurrent test phase
//    even starts, so it never competes with anything.
//
// Loads src/entry-server.tsx through Vite's own SSR module runner
// (createServer + ssrLoadModule) so `@/...` aliases, MDX content and
// everything else resolve exactly as they do for the real app — this
// works from source, so it needs no prior `pnpm build`.

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer } from 'vite'
import { FIXTURE_PATH, HYDRATION_URLS } from './hydration-fixture.mjs'

export default async function setup() {
  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error',
  })

  let results
  try {
    const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
    results = []
    for (const url of HYDRATION_URLS) {
      results.push(await render(url))
    }
  } finally {
    await server.close()
  }

  await mkdir(path.dirname(FIXTURE_PATH), { recursive: true })
  await writeFile(FIXTURE_PATH, JSON.stringify(Object.fromEntries(HYDRATION_URLS.map((url, i) => [url, results[i]]))))
}
