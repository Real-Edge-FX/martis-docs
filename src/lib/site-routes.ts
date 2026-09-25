import { DOC_FLAT } from '@/lib/docs-tree'

export const SITE_URL = 'https://getmartis.com'

export interface RouteMeta {
  path: string
  title: string
  description: string
  canonical: string
  image: string
  noIndex?: boolean
}

const socialImage = (name: string) => `${SITE_URL}/social/${name}.png`

const ROUTE_META: RouteMeta[] = [
  {
    path: '/',
    title: 'Martis — The admin foundation your agency can ship again',
    description: 'An MIT-licensed admin foundation for Laravel agencies. No paid tier.',
    canonical: `${SITE_URL}/`,
    image: socialImage('home'),
  },
  {
    path: '/product',
    title: 'Product · Martis',
    description: 'Model, operate, secure, adapt, extend and ship Laravel admin products.',
    canonical: `${SITE_URL}/product`,
    image: socialImage('product'),
  },
  {
    path: '/for-agencies',
    title: 'For Laravel Agencies · Martis',
    description: 'A repeatable admin foundation for client delivery.',
    canonical: `${SITE_URL}/for-agencies`,
    image: socialImage('agencies'),
  },
  {
    path: '/compare',
    title: 'Compare Martis',
    description: 'An evidence-based comparison of Laravel admin foundations.',
    canonical: `${SITE_URL}/compare`,
    image: socialImage('compare'),
  },
  {
    path: '/compare/nova',
    title: 'Martis vs Laravel Nova',
    description: 'Compare licensing, stack, workflow and extensibility.',
    canonical: `${SITE_URL}/compare/nova`,
    image: socialImage('compare-nova'),
  },
  {
    path: '/compare/filament',
    title: 'Martis vs Filament',
    description: 'Compare licensing, stack, workflow and extensibility.',
    canonical: `${SITE_URL}/compare/filament`,
    image: socialImage('compare-filament'),
  },
  {
    path: '/docs',
    title: 'Documentation · Martis',
    description: 'Install, configure and extend Martis.',
    canonical: `${SITE_URL}/docs`,
    image: socialImage('docs'),
  },
  {
    path: '/changelog',
    title: 'Changelog · Martis',
    description: 'Product releases and upgrade notes.',
    canonical: `${SITE_URL}/changelog`,
    image: socialImage('changelog'),
  },
  {
    path: '/contact',
    title: 'Contact · Martis',
    description: 'Talk to Martis about a repeatable Laravel delivery foundation for your agency.',
    canonical: `${SITE_URL}/contact`,
    image: socialImage('agencies'),
  },
]

const NOT_FOUND_META: RouteMeta = {
  path: '/404',
  title: 'Page not found · Martis',
  description: 'The requested page was not found.',
  canonical: `${SITE_URL}/404`,
  image: socialImage('home'),
  noIndex: true,
}

export const PUBLIC_ROUTES = [
  ...ROUTE_META.map(({ path }) => path),
  ...DOC_FLAT.map(({ slug }) => `/docs/${slug}`),
  NOT_FOUND_META.path,
]

export function getRouteMeta(pathname: string): RouteMeta {
  const normalized = pathname !== '/' ? pathname.replace(/\/$/, '') : pathname
  const exact = ROUTE_META.find(({ path }) => path === normalized)
  if (exact) return exact

  const doc = DOC_FLAT.find(({ slug }) => `/docs/${slug}` === normalized)
  if (doc) {
    return {
      path: normalized,
      title: `${doc.label} · Martis docs`,
      description: `Learn about ${doc.label} in Martis.`,
      canonical: `${SITE_URL}${normalized}`,
      image: socialImage('docs'),
    }
  }

  return NOT_FOUND_META
}
