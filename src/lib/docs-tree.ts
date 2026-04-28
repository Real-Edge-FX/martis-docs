import type { IconName } from '@/components/icons'

// Navigation tree for /docs/*. Mirrors the structure shown on the
// design system reference (`design-system/Martis Docs/src/docs-shell.jsx`)
// — group → items, with optional badge counters and per-item icon.
//
// The slug here is the URL path under /docs/. The MDX file behind it
// lives at `src/content/<slug>.mdx` (or a nested folder for grouping).

export interface DocItem {
  slug: string
  label: string
  icon: IconName
  badge?: string
}

export interface DocGroup {
  group: string
  items: DocItem[]
}

export const DOC_NAV: DocGroup[] = [
  {
    group: 'Getting Started',
    items: [
      { slug: 'getting-started/installation',    label: 'Installation',     icon: 'Bolt' },
      { slug: 'getting-started/quick-start',     label: 'Quick Start',      icon: 'ArrowRight' },
      { slug: 'getting-started/troubleshooting', label: 'Troubleshooting',  icon: 'Shield' },
    ],
  },
  {
    group: 'Core Concepts',
    items: [
      { slug: 'core/resources',       label: 'Resources',     icon: 'Stack' },
      { slug: 'core/fields',          label: 'Fields',        icon: 'Stack',    badge: '50' },
      { slug: 'core/relationships',   label: 'Relationships', icon: 'Workflow', badge: '12' },
      { slug: 'core/filters',         label: 'Filters',       icon: 'Filter' },
      { slug: 'core/lenses',          label: 'Lenses',        icon: 'Eye' },
      { slug: 'core/metrics',         label: 'Metrics',       icon: 'Activity' },
      { slug: 'core/dashboards',      label: 'Dashboards',    icon: 'Activity' },
      { slug: 'core/actions',         label: 'Actions',       icon: 'Bolt' },
      { slug: 'core/grid-layout',     label: 'Grid layout',   icon: 'Layers' },
      { slug: 'core/panels-and-tabs', label: 'Panels & Tabs', icon: 'Stack' },
      { slug: 'core/repeater',        label: 'Repeater',      icon: 'Stack' },
      { slug: 'core/menus',           label: 'Menus',         icon: 'Menu' },
    ],
  },
  {
    group: 'Customization',
    items: [
      { slug: 'customization/theming',    label: 'Theming',              icon: 'Palette',   badge: '94' },
      { slug: 'customization/overrides',  label: 'Override system',      icon: 'Layers' },
      { slug: 'customization/components', label: 'Built-in components',  icon: 'Stack' },
      { slug: 'customization/tools',      label: 'Custom Tools',         icon: 'Plug' },
      { slug: 'customization/i18n',       label: 'Internationalisation', icon: 'Translate' },
    ],
  },
  {
    group: 'Auth & Security',
    items: [
      { slug: 'auth/authentication', label: 'Authentication', icon: 'Lock' },
      { slug: 'auth/sso',            label: 'SSO',            icon: 'Shield' },
      { slug: 'auth/impersonation',  label: 'Impersonation',  icon: 'Lock' },
      { slug: 'auth/authorization',  label: 'Authorization',  icon: 'Shield' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'reference/api',           label: 'REST API',             icon: 'Hash' },
      { slug: 'reference/configuration', label: 'Configuration',        icon: 'Hash' },
      { slug: 'reference/cache',         label: 'Cache',                icon: 'Stack' },
      { slug: 'reference/notifications', label: 'Notifications',        icon: 'Activity' },
      { slug: 'reference/differentials', label: 'Martis differentials', icon: 'Compass' },
    ],
  },
]

/** Flat list of every doc, in declared order. Used by pagination. */
export const DOC_FLAT: (DocItem & { group: string })[] = DOC_NAV.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.group })),
)

export function findBySlug(slug: string): (DocItem & { group: string }) | undefined {
  return DOC_FLAT.find((i) => i.slug === slug)
}

export function prevNext(slug: string): {
  prev: (DocItem & { group: string }) | null
  next: (DocItem & { group: string }) | null
} {
  const idx = DOC_FLAT.findIndex((i) => i.slug === slug)
  return {
    prev: idx > 0 ? DOC_FLAT[idx - 1] : null,
    next: idx >= 0 && idx < DOC_FLAT.length - 1 ? DOC_FLAT[idx + 1] : null,
  }
}

/** Default landing slug for /docs (no path). */
export const DOC_DEFAULT_SLUG = 'getting-started/installation'
