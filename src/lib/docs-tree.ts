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
  /** Optional pill rendered next to the sidebar label. Use it for
   *  countable surface area: number of field types, theme tokens,
   *  generators, etc. Always pair with `tooltip` so a hover/long-press
   *  reveals what the number means. */
  badge?: string
  /** Native `title` attribute applied to the sidebar link. Lets users
   *  hover the badge to see what it counts. */
  tooltip?: string
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
      { slug: 'core/fields',          label: 'Fields',        icon: 'Stack',    badge: '50', tooltip: '50 field types (Text, Select, Date, File, Markdown, Currency, Badge…)' },
      { slug: 'core/relationships',   label: 'Relationships', icon: 'Workflow', badge: '12', tooltip: '12 Eloquent relationship kinds (BelongsTo … MorphToMany)' },
      { slug: 'core/filters',         label: 'Filters',       icon: 'Filter',   badge: '4',  tooltip: '4 filter types: Select, Boolean, Date, DateRange' },
      { slug: 'core/lenses',          label: 'Lenses',        icon: 'Eye' },
      { slug: 'core/metrics',         label: 'Metrics',       icon: 'Activity', badge: '6',  tooltip: '6 metric types: Value, Trend, Partition, Progress, ActivityFeed, EndpointTable' },
      { slug: 'core/dashboards',      label: 'Dashboards',    icon: 'Activity' },
      { slug: 'core/gates',           label: 'Soft-gates & badges', icon: 'Lock', tooltip: 'Tag pills + soft-gate modals for plan-gated features (v1.11+)' },
      { slug: 'core/actions',         label: 'Actions',       icon: 'Bolt',     badge: '4',  tooltip: '4 action types: inline, bulk, standalone, destructive (queueable)' },
      { slug: 'core/default-row-actions', label: 'Default row actions', icon: 'Bolt' },
      { slug: 'core/sticky-views',    label: 'Sticky views',  icon: 'Eye' },
      { slug: 'core/grid-layout',     label: 'Grid layout',   icon: 'Layers' },
      { slug: 'core/panels-and-tabs', label: 'Panels & Tabs', icon: 'Stack' },
      { slug: 'core/repeater',        label: 'Repeater',      icon: 'Stack' },
      { slug: 'core/menus',           label: 'Menus',         icon: 'Menu' },
      { slug: 'core/global-search',   label: 'Global search', icon: 'Search' },
    ],
  },
  {
    group: 'Customization',
    items: [
      { slug: 'customization/theming',            label: 'Theming',                icon: 'Palette',   badge: '94', tooltip: '94 design tokens across 13 categories' },
      { slug: 'customization/overrides',          label: 'Override system',        icon: 'Layers',    badge: '4',  tooltip: '4-tier component resolution (app → tool → package → built-in)' },
      { slug: 'customization/components',         label: 'Built-in components',    icon: 'Stack' },
      { slug: 'customization/tools',              label: 'Custom Tools',           icon: 'Plug' },
      { slug: 'customization/tool-boot-patterns', label: 'Tool boot patterns',     icon: 'Plug' },
      { slug: 'customization/loader',             label: 'Loader screen',          icon: 'Layers' },
      { slug: 'customization/generators',         label: 'Customising generators', icon: 'Bolt',      badge: '18', tooltip: '18 Artisan generators (martis:resource, martis:action, …)' },
      { slug: 'customization/i18n',               label: 'Internationalisation',   icon: 'Translate', badge: '3',  tooltip: '3 bundled locales: en, pt_PT, pt_BR' },
    ],
  },
  {
    group: 'Auth & Security',
    items: [
      { slug: 'auth/authentication', label: 'Authentication', icon: 'Lock' },
      { slug: 'auth/sso',            label: 'SSO',            icon: 'Shield', badge: '3', tooltip: '3 OAuth providers: Azure AD, Google, GitHub' },
      { slug: 'auth/roles',          label: 'Roles & Permissions', icon: 'Shield', badge: 'v1.6', tooltip: 'martis:roles — admin UI for users, roles, permissions on top of Spatie' },
      { slug: 'auth/impersonation',  label: 'Impersonation',  icon: 'Lock' },
      { slug: 'auth/authorization',  label: 'Authorization',  icon: 'Shield' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { slug: 'reference/api',                label: 'REST API',             icon: 'Hash' },
      { slug: 'reference/configuration',      label: 'Configuration',        icon: 'Hash' },
      { slug: 'reference/cache',              label: 'Cache',                icon: 'Stack' },
      { slug: 'reference/notifications',      label: 'Notifications',        icon: 'Activity' },
      { slug: 'reference/keyboard-shortcuts', label: 'Keyboard shortcuts',   icon: 'Hash',    badge: '9',  tooltip: '9 keyboard shortcuts available across the panel' },
      { slug: 'reference/preferences',        label: 'User preferences',     icon: 'Hash' },
      { slug: 'reference/differentials',      label: 'Martis differentials', icon: 'Compass', badge: '10', tooltip: '10 differential categories vs. Nova/Filament' },
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
