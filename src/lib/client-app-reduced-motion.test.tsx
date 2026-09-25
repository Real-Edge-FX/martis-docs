import { act } from '@testing-library/react'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, expect, inject, it, vi, type MockInstance } from 'vitest'
import { hasReactFiber, hydrateServerHtml } from '@/test/hydrate-server-html'

// Same hydration proof as client-app.test.tsx, for a visitor with
// `prefers-reduced-motion: reduce`, on every redesigned marketing page.
// Its own file because the preference has to be in place before any
// component in this worker reads it (usePrefersReducedMotion reads
// `matchMedia` once React has hydrated): stubbing it here, before the first render,
// keeps the other hydration tests on the default preference.

const serverResults = inject('hydrationFixture')

beforeAll(() => {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

let consoleError: MockInstance
let hydratedRoot: Root | undefined

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  if (hydratedRoot) act(() => hydratedRoot!.unmount())
  hydratedRoot = undefined
  consoleError.mockRestore()
  document.body.innerHTML = ''
})

for (const url of ['/', '/product', '/for-agencies'] as const) {
  it(`hydrates ${url} under reduced motion without discarding the server-rendered <main>`, async () => {
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)

    const { root, container, serverMain, onRecoverableError } = await hydrateServerHtml(url, serverResults[url].html)
    hydratedRoot = root

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    expect(container.querySelector('main')).toBe(serverMain)
    expect(hasReactFiber(serverMain!)).toBe(true)
    // Nothing on these pages waits on motion: after hydration under
    // reduced motion no element in <main> may be transparent or hidden.
    await act(async () => {})
    const hidden = [...container.querySelectorAll('main [style]')].filter((el) =>
      /opacity:\s*0(?![.\d])|visibility:\s*hidden/.test(el.getAttribute('style') ?? ''),
    )
    expect(hidden).toEqual([])
    // Same budget as client-app.test.tsx's hydration tests.
  }, 20_000)
}
