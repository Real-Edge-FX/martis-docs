import { act } from '@testing-library/react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, inject, it, vi, type MockInstance } from 'vitest'
import { HYDRATION_URLS } from '@/test/hydration-fixture'
import { prepareClientApp } from './client-app'

// There is no automated proof, elsewhere in this suite, that the client
// actually reuses the server-rendered markup instead of silently
// re-rendering over it (which would still "work" today because nothing
// diffs the two): this file is that proof. For each URL it takes the real
// server HTML (the same `render()` the SSR entry and the prerender script
// use — pre-rendered by src/test/ssr-global-setup.ts's `globalSetup` and
// handed over via `inject('hydrationFixture')`; see that file for why
// this cannot simply call `render()` here), drops it into a #root
// container exactly as the static HTML shell does, then hydrates it with
// the exact tree `entry-client.tsx` builds (`prepareClientApp`, extracted
// so this test cannot drift from what the real client does) and checks
// hydration reached `<main>` rather than silently no-oping: no
// recoverable error, no console error, the server's own `<main>` element
// survives as the same DOM node, and (see `hasReactFiber` below) that
// node actually carries React's own record of having taken it over.

const serverResults = inject('hydrationFixture')

let consoleError: MockInstance
let hydratedRoot: Root | undefined

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  // Unmount whatever this test hydrated: leaving React roots attached
  // across tests risks one test's effects/timers firing during another's,
  // and a lingering root never gets a chance to fail loudly if its own
  // unmount would have thrown.
  if (hydratedRoot) act(() => hydratedRoot!.unmount())
  hydratedRoot = undefined
  consoleError.mockRestore()
  document.body.innerHTML = ''
})

/** Whether React has recorded taking ownership of `node` during a
 *  render — the internal `__reactFiber$<id>` property react-dom attaches
 *  to every DOM node a fiber is associated with. Without this check, the
 *  three assertions below (no recoverable error, no console error, same
 *  `<main>` node) would all pass just as well if `hydrateRoot` were never
 *  called at all: an untouched node trivially has no error to report and
 *  is trivially "the same node", since nothing ever happened to it. This
 *  is what actually proves hydration reached `<main>`, not merely that
 *  nothing visibly broke. */
function hasReactFiber(node: Element): boolean {
  return Object.keys(node).some((key) => key.startsWith('__reactFiber$'))
}

describe('client hydration reuses the server markup', () => {
  it.each(HYDRATION_URLS)('hydrates %s without discarding the server-rendered <main>', async (url) => {
    const { html } = serverResults[url]

    const container = document.createElement('div')
    container.id = 'root'
    container.innerHTML = html
    document.body.appendChild(container)

    const serverMain = container.querySelector('main')
    expect(serverMain, 'server HTML must contain a <main>').not.toBeNull()

    window.history.pushState({}, '', url)
    const app = await prepareClientApp(window.location.pathname)

    const onRecoverableError = vi.fn()
    await act(async () => {
      hydratedRoot = hydrateRoot(container, app, { onRecoverableError })
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    // Same node, not merely equivalent markup: a mismatch makes React
    // discard and replace the boundary with a freshly client-rendered one.
    expect(container.querySelector('main')).toBe(serverMain)
    expect(hasReactFiber(serverMain!)).toBe(true)
  })
})
