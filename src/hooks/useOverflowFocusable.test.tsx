import { act, render, screen } from '@testing-library/react'
import { useOverflowFocusable } from './useOverflowFocusable'

// The hook's default before any measurement (`focusable` starts `true`,
// so server-rendered/no-JS markup keeps the WCAG 2.1.1 tab stop) is
// covered by src/entry-server.test.tsx, not here: React SSR never runs
// effects, so that is the only place that genuinely observes the
// pre-measurement state. jsdom + React Testing Library's `act` flushes
// passive effects synchronously on every `render()`, so a test in this
// file can only ever observe the *post-effect* value, however early it
// asserts — these tests cover that measurement instead: what the effect
// settles on, and how it changes.

/** A tiny host component, standing in for CodeBlock/Chapter: attaches
 *  the hook's ref to a real `<pre>` and renders whether it currently
 *  measures as needing a tab stop, so the hook can be exercised against
 *  real DOM refs and a real `ResizeObserver` instead of hand-built fakes. */
function Host({ remeasureKey }: { remeasureKey?: string }) {
  const { ref, focusable } = useOverflowFocusable<HTMLPreElement>(remeasureKey)
  return (
    <pre ref={ref} data-testid="host-pre">
      {focusable ? 'focusable' : 'not-focusable'}
    </pre>
  )
}

function mockOverflow(overflowing: boolean) {
  Object.defineProperty(HTMLPreElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => (overflowing ? 800 : 400),
  })
  Object.defineProperty(HTMLPreElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 400,
  })
}

afterEach(() => {
  Reflect.deleteProperty(HTMLPreElement.prototype, 'scrollWidth')
  Reflect.deleteProperty(HTMLPreElement.prototype, 'clientWidth')
})

describe('useOverflowFocusable', () => {
  it('loses the tab stop once measured as not overflowing after mount', async () => {
    mockOverflow(false)
    await act(async () => {
      render(<Host />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('not-focusable')
  })

  it('keeps the tab stop once measured as overflowing after mount', async () => {
    mockOverflow(true)
    await act(async () => {
      render(<Host />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('focusable')
  })

  it('re-measures when remeasureKey changes', async () => {
    mockOverflow(false)
    const { rerender } = render(<Host remeasureKey="a" />)
    await act(async () => {})
    expect(screen.getByTestId('host-pre')).toHaveTextContent('not-focusable')

    mockOverflow(true)
    await act(async () => {
      rerender(<Host remeasureKey="b" />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('focusable')
  })

  it('re-measures through ResizeObserver, regaining the tab stop when a resize makes it overflow', async () => {
    mockOverflow(false)
    let observedCallback: ResizeObserverCallback | undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          observedCallback = cb
        }
        observe = observe
        unobserve = vi.fn()
        disconnect = disconnect
      },
    )

    await act(async () => {
      render(<Host />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('not-focusable')
    expect(observe).toHaveBeenCalled()

    mockOverflow(true)
    await act(async () => {
      observedCallback?.([], {} as ResizeObserver)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('focusable')

    vi.unstubAllGlobals()
  })
})
