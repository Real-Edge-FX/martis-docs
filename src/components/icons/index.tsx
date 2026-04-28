import type { SVGProps } from 'react'

// Icon set — direct port of design-system/Martis Docs/src/icons.jsx.
// All icons are stroke-based, 1.6 weight, 24×24 viewBox (Phosphor-
// style minimalism) with the exception of the brand wordmarks
// (GitHub, Discord, X, Laravel) which use filled paths.

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number
  strokeWidth?: number
}

const baseProps = (p: IconProps): SVGProps<SVGSVGElement> => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: p.size ?? 18,
  height: p.size ?? 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: p.strokeWidth ?? 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: p.className,
  ...p,
})

const filledProps = (p: IconProps): SVGProps<SVGSVGElement> => ({
  ...baseProps(p),
  fill: 'currentColor',
  stroke: undefined,
  strokeWidth: 0,
})

export const Icons = {
  Search: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  ArrowRight: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  ),
  ChevronRight: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  ChevronDown: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Copy: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  GitHub: (p: IconProps) => (
    <svg {...filledProps(p)}>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.46-1.11-1.46-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  ),
  Lock: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  ),
  Eye: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Stack: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 18 9 5 9-5" />
    </svg>
  ),
  Workflow: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M9 6h7a3 3 0 0 1 3 3v6" />
    </svg>
  ),
  Bolt: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  Activity: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  ),
  Filter: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M3 5h18l-7 9v6l-4-2v-4z" />
    </svg>
  ),
  Plug: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M9 2v6" />
      <path d="M15 2v6" />
      <path d="M5 8h14v3a7 7 0 0 1-14 0z" />
      <path d="M12 15v6" />
    </svg>
  ),
  Layers: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  ),
  Shield: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />
    </svg>
  ),
  Palette: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <circle cx="13.5" cy="6.5" r="1.2" fill="currentColor" />
      <circle cx="17" cy="11" r="1.2" fill="currentColor" />
      <circle cx="7" cy="9" r="1.2" fill="currentColor" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" />
      <path d="M12 3a9 9 0 1 0 9 9c0-1.5-1.2-3-2.5-3H17c-1.5 0-2-1-1.4-2.4l.4-1C16.4 4.4 14.5 3 12 3z" />
    </svg>
  ),
  Translate: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M5 8h6" />
      <path d="M8 5v3c0 4-2 6-3 7" />
      <path d="M5 13c1.5 2 4 3 6 3" />
      <path d="M22 22l-5-12-5 12" />
      <path d="m14 18 6 0" />
    </svg>
  ),
  Compass: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 6-6 2 2-6z" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Hash: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
    </svg>
  ),
  CornerDownLeft: (p: IconProps) => (
    <svg {...baseProps(p)}>
      <path d="M9 10 4 15l5 5" />
      <path d="M20 4v7a4 4 0 0 1-4 4H4" />
    </svg>
  ),
}

export type IconName = keyof typeof Icons
