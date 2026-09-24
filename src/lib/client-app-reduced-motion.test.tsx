import { act } from '@testing-library/react'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, expect, inject, it, vi, type MockInstance } from 'vitest'
import { hasReactFiber, hydrateServerHtml } from '@/test/hydrate-server-html'

// Same hydration proof as client-app.test.tsx, for a visitor with
// `prefers-reduced-motion: reduce`. Its own file because `motion` caches
// the preference module-wide on first read: it has to be set before any
// component in this worker asks for it.

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

it('hydrates / under reduced motion without discarding the server-rendered <main>', async () => {
  expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true)

  const { root, container, serverMain, onRecoverableError } = await hydrateServerHtml('/', serverResults['/'].html)
  hydratedRoot = root

  expect(onRecoverableError).not.toHaveBeenCalled()
  expect(consoleError).not.toHaveBeenCalled()
  expect(container.querySelector('main')).toBe(serverMain)
  expect(hasReactFiber(serverMain!)).toBe(true)
  // Reveal renders plain, never-hidden elements under reduced motion: none
  // of the server's `initial` styles (opacity 0) may survive hydration on
  // the content it wraps, like the stats strip.
  await act(async () => {})
  const hiddenStats = [...container.querySelectorAll('[style*="opacity:0"]')].filter((el) =>
    el.textContent?.includes('Field types'),
  )
  expect(hiddenStats).toEqual([])
})
