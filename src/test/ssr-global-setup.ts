// Vitest `globalSetup` (see vitest.config.ts): runs once, in its own
// process, before any test file executes. Renders the URLs the hydration
// regression test needs (src/lib/client-app.test.tsx) through the real
// SSR entry (src/entry-server.tsx's `render()`, the exact function the
// app and the prerender script use) and hands the result to that test via
// `project.provide()` / `inject()` — no disk cache, no file for tsc to
// treat specially: this runs as ordinary TypeScript through Vitest's own
// module runner, the same as any other test-support file.
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
// Regenerated on every watch-mode rerun via `project.onTestsRerun`, not
// produced once and reused: without this, editing a page's source under
// `pnpm test:watch` would keep hydrating today's client code against a
// server-HTML snapshot taken before the edit, hiding a real mismatch (or
// reporting a stale one that no longer exists).
//
// Each regeneration — the initial one and every rerun — creates its own
// short-lived Vite server rather than reusing one kept alive across the
// whole watch session: a fresh server's module graph starts empty, so
// `ssrLoadModule` always reads the current on-disk source; a long-lived
// server would need its cache explicitly invalidated to notice a change,
// which is exactly the file-watcher machinery the next paragraph turns
// off. That server is deliberately inert beyond loading one SSR module:
// middleware mode, with the HMR WebSocket, the filesystem watcher and the
// dependency optimizer's discovery all disabled. Nothing here needs
// live-reload or optimized deps, and leaving them on risks a real port
// clash (the WebSocket server binds one) when a parallel worktree or
// session runs its own tests on this machine at the same time — which
// would print a raw connection error and break otherwise-pristine test
// output rather than fail cleanly.
//
// Loads src/entry-server.tsx through Vite's own SSR module runner
// (createServer + ssrLoadModule) so `@/...` aliases, MDX content and
// everything else resolve exactly as they do for the real app — this
// works from source, so it needs no prior `pnpm build`.

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
    // Sequential, not Promise.all: see the Fizz/Fiber process-shared-state
    // note above — the same caution that keeps this out of the test
    // worker applies to running renders concurrently within one process.
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
