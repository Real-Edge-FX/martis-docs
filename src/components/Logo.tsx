interface LogoProps {
  size?: number
  className?: string
  withWordmark?: boolean
}

/**
 * Martis logomark — isometric cube. Direct port of
 * design-system/Martis Docs/src/icons.jsx → `Icons.Logo` so this
 * component stays pixel-identical to the brand reference.
 *
 * Pass `withWordmark` to render the cube + the word "Martis"
 * inline, matching the topnav layout on the design system landing.
 */
export function Logo({ size = 28, className = '', withWordmark = false }: LogoProps) {
  const cube = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Martis"
      className={withWordmark ? '' : className}
    >
      <defs>
        <linearGradient id="martis-cube-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7B95FF" />
          <stop offset="55%" stopColor="#5B7FFF" />
          <stop offset="100%" stopColor="#8B5BFF" />
        </linearGradient>
        <linearGradient id="martis-cube-grad-2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#4A6BFF" />
          <stop offset="100%" stopColor="#7444F5" />
        </linearGradient>
      </defs>
      <path d="M16 3 L28 9 L28 23 L16 29 L4 23 L4 9 Z" fill="url(#martis-cube-grad)" opacity=".15" />
      <path d="M16 3 L28 9 L16 15 L4 9 Z" fill="url(#martis-cube-grad)" />
      <path d="M4 9 L16 15 L16 29 L4 23 Z" fill="url(#martis-cube-grad-2)" opacity=".82" />
      <path d="M28 9 L16 15 L16 29 L28 23 Z" fill="url(#martis-cube-grad)" opacity=".55" />
      <path d="M16 3 L28 9 L28 23 L16 29 L4 23 L4 9 Z" stroke="rgba(255,255,255,.12)" strokeWidth=".75" fill="none" />
    </svg>
  )

  if (!withWordmark) return cube

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {cube}
      <span className="text-white text-[1.05rem] font-semibold tracking-tight">Martis</span>
    </span>
  )
}
