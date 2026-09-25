import type { IconName } from '@/components/icons'

export const RELEASE = {
  version: '2.0.1',
  tests: 5141,
  php: 'PHP 8.3+',
  laravel: 'Laravel 12–13',
  downloads: 192,
  monthlyDownloads: 127,
  statsFetchedAt: '2026-09-25',
} as const

export interface ProductChapter {
  id: string
  number: string
  title: string
  kicker: string
  description: string
  details: string[]
  icon: IconName
  docsHref: string
}

export const PRODUCT_CHAPTERS: ProductChapter[] = [
  {
    id: 'model',
    number: '01',
    title: 'Model',
    kicker: 'Turn Eloquent into a working product surface.',
    description: 'Define resources, fields and relationships in PHP. Martis turns them into a coherent React interface your team can keep shaping.',
    details: ['50 field types', '12 relationship kinds', 'Resource-driven API'],
    icon: 'Stack',
    docsHref: '/docs/core/resources',
  },
  {
    id: 'operate',
    number: '02',
    title: 'Operate',
    kicker: 'Build the workflows real teams need.',
    description: 'Search, filter, act and report without rebuilding the operational layer for every client project.',
    details: ['Filters and lenses', 'Bulk and queued actions', 'Metrics and dashboards'],
    icon: 'Workflow',
    docsHref: '/docs/core/actions',
  },
  {
    id: 'secure',
    number: '03',
    title: 'Secure',
    kicker: 'Make access control part of the foundation.',
    description: 'Authentication, policies, roles, permissions, SSO and impersonation live in the same delivery system.',
    details: ['Policies and gates', 'Roles and permissions', 'SSO and 2FA'],
    icon: 'Shield',
    docsHref: '/docs/auth/authorization',
  },
  {
    id: 'adapt',
    number: '04',
    title: 'Adapt',
    kicker: 'Make every delivery feel like the client’s product.',
    description: 'Use themes, layouts, navigation and localization without forking the admin foundation underneath.',
    details: ['94 design tokens', 'Dark and light themes', 'Three bundled locales'],
    icon: 'Palette',
    docsHref: '/docs/customization/theming',
  },
  {
    id: 'extend',
    number: '05',
    title: 'Extend',
    kicker: 'Keep the escape hatches your engineers expect.',
    description: 'Custom tools, fields, components and a four-tier override system keep application-specific work in your control.',
    details: ['Custom React tools', 'Component overrides', 'Extension generators'],
    icon: 'Plug',
    docsHref: '/docs/customization/tools',
  },
  {
    id: 'ship',
    number: '06',
    title: 'Ship',
    kicker: 'Reuse the baseline. Protect the margin.',
    description: 'A predictable install and upgrade path turns accumulated agency knowledge into a repeatable delivery advantage.',
    details: ['Single install command', 'Versioned documentation', 'MIT, no paid tier'],
    icon: 'Bolt',
    docsHref: '/docs/getting-started/installation',
  },
]

export const AGENCY_VALUE = [
  {
    number: '01',
    title: 'Start from a proven baseline',
    body: 'Stop rebuilding the same authentication, resource and workflow decisions at the start of every client project.',
  },
  {
    number: '02',
    title: 'Keep delivery consistent',
    body: 'Give every team the same vocabulary, quality bar and extension points—without making every project look identical.',
  },
  {
    number: '03',
    title: 'Own the outcome',
    body: 'MIT licensed, no paid tier and no per-project fee. Your team controls the code, the roadmap and the handover.',
  },
] as const
