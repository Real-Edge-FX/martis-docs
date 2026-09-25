import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Tracks whether a horizontally-scrollable element needs to be a
 * keyboard-reachable tab stop: it does, unless and until measured
 * otherwise. `focusable` starts `true`, so the server HTML and the very
 * first client render both carry `tabIndex`/`role`/an accessible name
 * (see `CodeBlock`/`Chapter`) — before any JavaScript has run, there is
 * no way to know whether the block actually overflows, and a keyboard
 * user who cannot even ask (no JS, or JS still loading) must still be
 * able to reach it if it does (WCAG 2.1.1). Once mounted, an effect
 * measures the real, laid-out element and drops the tab stop only for a
 * block that turns out not to need it; a `ResizeObserver` then keeps
 * re-measuring on every layout change (a resize, a font swap, new
 * content), so a block that stops fitting later regains it, and one
 * that never overflows loses it for good, not just at first paint.
 *
 * Server and the first client render always agree (`focusable` starts
 * `true` in both), so hydration never mismatches; the measurement only
 * ever runs after mount, client-side.
 *
 * Shared by `CodeBlock` and `Chapter`: both render a `<pre>` whose CSS
 * gives it `overflow-x: auto`, and both need the same behaviour instead
 * of each measuring it its own way.
 *
 * `remeasureKey` re-runs the measurement (and re-subscribes the
 * observer) when it changes, for a caller whose element keeps the same
 * identity but whose content can change under it (`CodeBlock`, reused
 * with a different `code`/`lang`). A caller that always remounts a fresh
 * element for new content (`Chapter`, keyed per chapter) can leave it
 * out: the initial measurement plus the resize observer are enough.
 */
export function useOverflowFocusable<T extends HTMLElement>(
  remeasureKey?: string | number,
): { ref: RefObject<T>; focusable: boolean } {
  const ref = useRef<T>(null)
  const [focusable, setFocusable] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => setFocusable(el.scrollWidth > el.clientWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [remeasureKey])

  return { ref, focusable }
}
