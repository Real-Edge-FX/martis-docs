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
  })
})
