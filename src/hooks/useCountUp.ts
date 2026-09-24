import { useEffect, useRef, useState } from 'react'

/**
 * Counts a numeric value up from 0 once the element scrolls into view.
 *
 * Returns `[ref, display]`: attach `ref` to the element to observe, render
 * `display` as the number. Non-digit characters in the target (commas, `+`,
 * `k`) are preserved so labels like `1,653` animate as `1,653`.
 *
 * `display` starts as `target` itself, so the server HTML, a reader
 * without JavaScript and the first (hydrating) client render all show the
 * real number. The count only starts in an effect, after hydration, when
 * the element comes into view; under `prefers-reduced-motion` it never
 * starts.
 */
export function useCountUp(target: string, durationMs = 1400) {
  const ref = useRef<HTMLElement | null>(null)
  const [display, setDisplay] = useState(target)
  const done = useRef(false)

  const numeric = Number(target.replace(/[^0-9.]/g, ''))
  const isCountable = Number.isFinite(numeric) && numeric !== 0

  useEffect(() => {
    const el = ref.current
    if (!el || !isCountable) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    // Remember how to re-format the counted value.
    const hasComma = target.includes(',')
    const format = (n: number) => {
      const rounded = Math.round(n)
      const base = hasComma ? rounded.toLocaleString('en-US') : String(rounded)
      return target.replace(/[\d,]+/, base)
    }

    const run = () => {
      if (done.current) return
      done.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const t = Math.min((now - start) / durationMs, 1)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplay(t < 1 ? format(numeric * eased) : target)
        if (t < 1) requestAnimationFrame(tick)
      }
      setDisplay(format(0))
      requestAnimationFrame(tick)
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            run()
            io.disconnect()
          }
        }
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [target, durationMs, isCountable, numeric])

  return [ref, display] as const
}
