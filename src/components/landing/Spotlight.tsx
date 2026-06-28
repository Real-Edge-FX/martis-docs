import { type ReactNode, useRef } from 'react'

interface SpotlightProps {
  children: ReactNode
  className?: string
  /** Glow radius in px. */
  radius?: number
}

/**
 * Wraps content in a card surface that lights up where the cursor is.
 * Pointer position is written to `--mx`/`--my` CSS vars and the `.spotlight`
 * layer (defined in globals.css) paints a soft brand-tinted radial glow.
 *
 * Pure CSS-var updates, no React state per move, so it stays cheap. On
 * touch / no-hover devices the glow simply never activates.
 */
export function Spotlight({ children, className = '', radius = 260 }: SpotlightProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`spotlight group/spot relative ${className}`}
      style={{ '--spot-r': `${radius}px` } as React.CSSProperties}
    >
      {children}
    </div>
  )
}
