import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Tracks whether a horizontally-scrollable element actually overflows its
 * own box, after layout. Server and the first client render both start
 * `false` (there is no layout yet), so hydration never mismatches; a
 * `ResizeObserver` then re-measures on every layout change (a resize, a
 * font swap, new content), so a block that starts short but later
 * overflows still becomes reachable, and one that never overflows never
 * gets treated as a tab stop.
 *
 * Shared by `CodeBlock` and `Chapter`: both render a `<pre>` whose CSS
 * gives it `overflow-x: auto`, and both need the same "keyboard-reachable
 * only when it actually scrolls" behaviour (WCAG 2.1.1 / axe
 * `scrollable-region-focusable`) instead of each measuring it its own
 * way.
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
): { ref: RefObject<T>; overflowing: boolean } {
  const ref = useRef<T>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [remeasureKey])

  return { ref, overflowing }
}
