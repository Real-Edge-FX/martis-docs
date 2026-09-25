import { act, render, screen } from '@testing-library/react'
import { useOverflowFocusable } from './useOverflowFocusable'

/** A tiny host component, standing in for CodeBlock/Chapter: attaches
 *  the hook's ref to a real `<pre>` and renders whether it currently
 *  measures as overflowing, so the hook can be exercised against real
 *  DOM refs and a real `ResizeObserver` instead of hand-built fakes. */
function Host({ remeasureKey }: { remeasureKey?: string }) {
  const { ref, overflowing } = useOverflowFocusable<HTMLPreElement>(remeasureKey)
  return (
    <pre ref={ref} data-testid="host-pre">
      {overflowing ? 'overflowing' : 'not-overflowing'}
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
  it('starts not overflowing (server/first-render safe: no layout exists yet)', () => {
    render(<Host />)
    expect(screen.getByTestId('host-pre')).toHaveTextContent('not-overflowing')
  })

  it('measures a short element as not overflowing after mount', async () => {
    mockOverflow(false)
    await act(async () => {
      render(<Host />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('not-overflowing')
  })

  it('measures an element whose content overflows as overflowing after mount', async () => {
    mockOverflow(true)
    await act(async () => {
      render(<Host />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('overflowing')
  })

  it('re-measures when remeasureKey changes', async () => {
    mockOverflow(false)
    const { rerender } = render(<Host remeasureKey="a" />)
    await act(async () => {})
    expect(screen.getByTestId('host-pre')).toHaveTextContent('not-overflowing')

    mockOverflow(true)
    await act(async () => {
      rerender(<Host remeasureKey="b" />)
    })
    expect(screen.getByTestId('host-pre')).toHaveTextContent('overflowing')
  })
})
