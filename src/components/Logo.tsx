interface LogoProps {
  size?: number
  className?: string
  /** Render the lockup (symbol + Martis wordmark) instead of the bare symbol. */
  withWordmark?: boolean
}

/**
 * Martis logo (2026-11 identity): a hexagon holding an M folded from one
 * ribbon, with a spark at the fold, in the cobalt to violet accent. Vector
 * files in `public/brand/`:
 *   - `martis-icon.svg`: the symbol (940×1116 viewBox).
 *   - `martis-logo.svg`: symbol + white wordmark, for dark surfaces
 *     (`martis-logo-dark.svg` has a dark wordmark for light surfaces).
 * PNG renders of both sit next to them for e-mail and other raster uses.
 */
export function Logo({ size = 28, className = '', withWordmark = false }: LogoProps) {
  if (withWordmark) {
    return (
      <img
        src="/brand/martis-logo.svg"
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
      src="/brand/martis-icon.svg"
      alt="Martis"
      height={size}
      style={{ height: size, width: 'auto' }}
      className={`block ${className}`}
      draggable={false}
    />
  )
}
