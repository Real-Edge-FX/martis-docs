import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})

// Browser API stubs for jsdom. A test file that opts into the node
// environment (`// @vitest-environment node`, like the SSR entry test) gets
// none of them, so any browser-global access during a server render fails
// there instead of silently hitting a stub.
if (typeof window !== 'undefined') {
  // jsdom does not implement matchMedia. The site header reads its
  // desktop breakpoint and `usePrefersReducedMotion` reads
  // `prefers-reduced-motion` through it.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )

  // jsdom implements `window.scrollTo` as a stub that logs "Not implemented"
  // noise to the console when called.
  vi.stubGlobal('scrollTo', vi.fn())

  // jsdom implements neither observer. A component that constructs one
  // purely to schedule a callback renders fine against a no-op stub,
  // without simulating real viewport/size behaviour.
  class ResizeObserverStub implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)

  class IntersectionObserverStub implements IntersectionObserver {
    readonly root: Element | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)

  // jsdom does not implement `innerText`, which needs layout. The docs TOC
  // reads its headings' text with it; for plain heading text,
  // `textContent` is the same string.
  Object.defineProperty(HTMLElement.prototype, 'innerText', {
    get(this: HTMLElement) {
      return this.textContent ?? ''
    },
    set(this: HTMLElement, value: string) {
      this.textContent = value
    },
    configurable: true,
  })
}
