import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CodeBlock, COPY_RESET_MS } from './CodeBlock'

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

// The default before any measurement (server HTML and the first client
// render both keep the tab stop, per useOverflowFocusable's "focusable
// until measured otherwise" contract, WCAG 2.1.1) is covered by
// src/entry-server.test.tsx, not here: these tests only ever observe the
// post-effect state (see that hook's own test file for why).
describe('CodeBlock', () => {
  it('loses the tab stop, post-mount, once measured as not overflowing', async () => {
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
    // Restored below to src/test/setup.ts's stub, not unstubbed: the tests
    // after this one still construct a ResizeObserver.
    const setupResizeObserver = globalThis.ResizeObserver
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

    vi.stubGlobal('ResizeObserver', setupResizeObserver)
  })
})

// The copy button in the filename chrome. Clipboard access is a progressive
// enhancement: a blocked or missing clipboard must leave the reader with a
// visible way to copy by hand (the same pattern as InstallCommand), and a
// pending "Copied" reset must never outlive the component.
describe('CodeBlock copy button', () => {
  const setClipboard = (value: unknown) =>
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true })

  afterEach(() => {
    vi.useRealTimers()
    Reflect.deleteProperty(navigator, 'clipboard')
    window.getSelection()?.removeAllRanges()
  })

  it('hides its icons from assistive tech (the button carries the name)', () => {
    render(<CodeBlock code="echo 1;" filename="a.php" />)
    const button = screen.getByRole('button', { name: 'Copy code' })
    const icons = button.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
    for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('announces a successful copy in a visible status next to the button', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ writeText })
    render(<CodeBlock code="echo 1;" filename="a.php" />)
    await act(async () => {
      screen.getByRole('button', { name: 'Copy code' }).click()
    })
    expect(writeText).toHaveBeenCalledWith('echo 1;')
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
  })

  it.each([
    ['rejects', () => ({ writeText: vi.fn().mockRejectedValue(new Error('blocked')) })],
    ['is missing', () => undefined],
  ])('selects the code and shows a visible manual-copy message when the clipboard %s', async (_, clipboard) => {
    setClipboard(clipboard())
    render(<CodeBlock code="echo 1;" filename="a.php" />)
    await act(async () => {
      screen.getByRole('button', { name: 'Copy code' }).click()
    })
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Select and copy the code')
    expect(status).not.toHaveClass('sr-only')
    expect(window.getSelection()?.toString()).toContain('echo 1;')
  })

  it('clears the pending "Copied" reset when it unmounts', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    const { unmount } = render(<CodeBlock code="echo 1;" filename="a.php" />)
    await act(async () => {
      screen.getByRole('button', { name: 'Copy code' }).click()
    })
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('returns to idle after the reset delay', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) })
    render(<CodeBlock code="echo 1;" filename="a.php" />)
    await act(async () => {
      screen.getByRole('button', { name: 'Copy code' }).click()
    })
    act(() => {
      vi.advanceTimersByTime(COPY_RESET_MS)
    })
    expect(screen.getByRole('status')).toHaveTextContent('')
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
  })
})
