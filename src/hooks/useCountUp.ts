import { useEffect, useRef, useState } from 'react'

/**
 * Counts a numeric value up from 0 once the element scrolls into view.
 *
 * Returns `[ref, display]`: attach `ref` to the element to observe, render
 * `display` as the number. Non-digit characters in the target (commas, `+`,
 * `k`) are preserved so labels like `1,653` animate as `1,653`.
 *
 * Honours `prefers-reduced-motion`: when set, the final value renders
 * immediately with no animation.
 */
export function useCountUp(target: string, durationMs = 1400) {
  const ref = useRef<HTMLElement | null>(null)
  const [display, setDisplay] = useState('0')
  const done = useRef(false)

  // Parse the numeric portion up front. Targets with no countable number
  // (or the literal `0`), and targets rendered under
  // `prefers-reduced-motion`, have nothing to animate, so `display` just
  // mirrors `target` directly instead of being synced from an effect.
  const numeric = Number(target.replace(/[^0-9.]/g, ''))
  const isCountable = Number.isFinite(numeric) && numeric !== 0
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const shouldAnimate = isCountable && !reduce

  useEffect(() => {
    const el = ref.current
    if (!el || !shouldAnimate) return

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
        setDisplay(format(numeric * eased))
        if (t < 1) requestAnimationFrame(tick)
        else setDisplay(target)
      }
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
  }, [target, durationMs, shouldAnimate, numeric])

  return [ref, shouldAnimate ? display : target] as const
}
