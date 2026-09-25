import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock } from './CodeBlock'

/** Stubs `<pre>`'s scroll/client width so the overflow effect measures a
 *  deterministic result: jsdom never lays anything out, so both are 0
 *  (no overflow) unless a test overrides them like this. */
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

describe('CodeBlock', () => {
  it('keeps a short block, which does not overflow, out of the tab order', async () => {
    mockOverflow(false)
    await act(async () => {
      render(<CodeBlock code="echo 1;" lang="php" filename="short.php" />)
    })
    expect(screen.getByTestId('code-block-pre')).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('gives an overflowing block a tab stop and an accessible name, after measuring it post-mount', async () => {
    mockOverflow(true)
    await act(async () => {
      render(<CodeBlock code="echo 'a very long line that would need to scroll horizontally';" lang="php" filename="long.php" />)
    })
    const group = screen.getByRole('group', { name: 'Code: long.php' })
    expect(group.tagName).toBe('PRE')
    expect(group).toHaveAttribute('tabindex', '0')
  })

  it('falls back to a language-based accessible name when there is no filename', async () => {
    mockOverflow(true)
    await act(async () => {
      render(<CodeBlock code="echo 'a very long line that would need to scroll horizontally';" lang="bash" />)
    })
    expect(screen.getByRole('group', { name: 'Code sample (bash)' })).toBeInTheDocument()
  })

  it('re-measures on resize through ResizeObserver instead of only once at mount', async () => {
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
      render(<CodeBlock code="echo 1;" lang="php" filename="a.php" />)
    })
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(observe).toHaveBeenCalled()

    // The viewport narrowed (or the block's content changed) and the
    // block now overflows: the observer's callback re-measures it.
    mockOverflow(true)
    await act(async () => {
      observedCallback?.([], {} as ResizeObserver)
    })
    expect(screen.getByRole('group', { name: 'Code: a.php' })).toBeInTheDocument()

    vi.unstubAllGlobals()
  })
})
