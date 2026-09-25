import { act } from '@testing-library/react'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, inject, it, vi, type MockInstance } from 'vitest'
import { HYDRATION_URLS } from '@/test/hydration-fixture'
import { hasReactFiber, hydrateServerHtml } from '@/test/hydrate-server-html'

// Proves the client reuses the server markup instead of re-rendering over
// it. The server HTML comes from the real `render()`, produced by
// src/test/ssr-global-setup.ts (see that file for why it cannot run here)
// and handed over through `inject('hydrationFixture')`.

const serverResults = inject('hydrationFixture')

let consoleError: MockInstance
let hydratedRoot: Root | undefined

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  // Unmount between tests so one test's effects and timers cannot fire
  // during the next one.
  if (hydratedRoot) act(() => hydratedRoot!.unmount())
  hydratedRoot = undefined
  consoleError.mockRestore()
  document.body.innerHTML = ''
})

// Hydration imports each page's lazy chunk and hydrates a full page:
// under the load of the whole suite that can exceed Vitest's 5000ms
// default. 20s matches the SSR route tests (src/entry-server.test.tsx)
// and RENDER_TIMEOUT_MS, and applies only to these tests, so a hang
// anywhere else still fails fast.
const HYDRATION_TIMEOUT_MS = 20_000

describe('client hydration reuses the server markup', () => {
  it.each(HYDRATION_URLS)('hydrates %s without discarding the server-rendered <main>', async (url) => {
    const { root, container, serverMain, onRecoverableError } = await hydrateServerHtml(url, serverResults[url].html)
    hydratedRoot = root

    expect(serverMain, 'server HTML must contain a <main>').not.toBeNull()
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    // Same node, not merely equivalent markup: a mismatch makes React
    // discard and replace the boundary with a freshly client-rendered one.
    expect(container.querySelector('main')).toBe(serverMain)
    expect(hasReactFiber(serverMain!)).toBe(true)
  }, HYDRATION_TIMEOUT_MS)
})

describe('docs scroll handling', () => {
  const docsUrl = '/docs/getting-started/installation'
  let scrollIntoView: MockInstance<Element['scrollIntoView']>

  beforeEach(() => {
    vi.mocked(window.scrollTo).mockClear()
    // jsdom does not implement scrollIntoView.
    const stub = vi.fn<Element['scrollIntoView']>()
    Element.prototype.scrollIntoView = stub
    scrollIntoView = stub
  })

  afterEach(() => {
    delete (Element.prototype as Partial<Element>).scrollIntoView
  })

  /** Lets the requestAnimationFrame the hash scroll waits for run. */
  const nextFrame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))

  // The browser has already placed the reader (at the top, at the hash
  // target, or wherever they scrolled before the JavaScript arrived):
  // hydrating must not move them.
  it.each([docsUrl, `${docsUrl}#requirements`])('does not scroll while hydrating %s', async (url) => {
    const { root } = await hydrateServerHtml(url, serverResults[docsUrl].html)
    hydratedRoot = root
    await nextFrame()

    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(scrollIntoView).not.toHaveBeenCalled()
  }, HYDRATION_TIMEOUT_MS)

  it('scrolls a newly opened page to the top, and to the hash target, after hydration', async () => {
    const { root, container } = await hydrateServerHtml(docsUrl, serverResults[docsUrl].html)
    hydratedRoot = root

    const link = container.querySelector<HTMLAnchorElement>('a[href="/docs/getting-started/quick-start"]')
    await act(async () => {
      link!.click()
    })
    await vi.waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 }), { timeout: 10_000 })

    await act(async () => {
      window.history.pushState({}, '', `${docsUrl}#requirements`)
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await vi.waitFor(
      async () => {
        await nextFrame()
        expect(scrollIntoView).toHaveBeenCalled()
      },
      { timeout: 10_000 },
    )
  }, 30_000)
})
