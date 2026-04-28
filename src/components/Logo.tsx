interface LogoProps {
  size?: number
  className?: string
  /** Render the lockup (icon + Martis wordmark) instead of the bare cube. */
  withWordmark?: boolean
}

/**
 * Martis logomark — uses the canonical brand PNGs shipped in
 * `public/brand/`:
 *   - `martis-icon.png`  — isometric cube with violet→cobalt gradient,
 *     bar chart on the left face, `M` chevron on top, `M`-shaped void
 *     on the right face. 283×300, transparent background.
 *   - `martis-logo.png`  — same cube + wordmark in matching gradient.
 *     1003×316, used in the topbar/footer with `withWordmark`.
 *
 * The earlier inline-SVG cube was a hand-rolled approximation that did
 * not match the brand. Always use the PNGs.
 */
export function Logo({ size = 28, className = '', withWordmark = false }: LogoProps) {
  if (withWordmark) {
    // Aspect ratio of martis-logo.png is roughly 3.17:1 (1003×316).
    // Scale by height so callers can pass a single `size` and get a
    // proportional lockup.
    return (
      <img
        src="/brand/martis-logo.png"
        alt="Martis"
        height={size}
        style={{ height: size, width: 'auto' }}
        className={`block ${className}`}
        draggable={false}
      />
    )
  }
  return (
    <img
      src="/brand/martis-icon.png"
      alt="Martis"
      width={size}
      height={size}
      className={`block ${className}`}
      draggable={false}
    />
  )
}
