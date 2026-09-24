import { DOC_FLAT } from '@/lib/docs-tree'

// Single source of truth for every public route and its SEO metadata.
// Consumed by `DocumentMeta` (client-side head updates), the SSR entry
// and `serializeMeta` (server-rendered head), the static prerender
// script and the dist smoke test — each of those walks `PUBLIC_ROUTES`
// and/or calls `getRouteMeta` instead of hard-coding route strings.

export const SITE_URL = 'https://getmartis.com'

export interface RouteMeta {
  path: string
  title: string
  description: string
  canonical: string
  image: string
  /** Alt text for `image` (rendered as `og:image:alt` / `twitter:image:alt`
   *  by `headTags` in `src/lib/seo.ts`). Defaults to `DEFAULT_IMAGE_ALT`
   *  when a route does not need a more specific description. */
  imageAlt?: string
  noIndex?: boolean
}

/** The `/404` entry, returned by `getRouteMeta` for any unmatched path. Defined
 *  separately (rather than picked out of `ROUTE_META` by position) so the
 *  fallback does not depend on where `/404` sits in the list below. */
export const NOT_FOUND_META: RouteMeta = {
  path: '/404',
  title: 'Page not found · Martis',
  description: 'This page does not exist. Head back to the Martis homepage or browse the documentation.',
  canonical: `${SITE_URL}/404`,
  image: `${SITE_URL}/social/home.png`,
  noIndex: true,
}

// The nine static marketing/docs-index routes. Copy follows the
// approved positioning (docs/superpowers/specs/2026-09-24-getmartis-redesign-design.md
// §4-11): confident, concrete, technical, MIT licensed / no paid tier
// as a recurring proof point, comparison pages kept neutral (no
// winner badges, no unverifiable claims).
const ROUTE_META: RouteMeta[] = [
  {
    path: '/',
    title: 'The admin foundation your agency can ship again · Martis',
    description:
      'The open-source Laravel admin foundation agencies ship again and again on client projects. MIT licensed. No paid tier.',
    canonical: `${SITE_URL}/`,
    image: `${SITE_URL}/social/home.png`,
  },
  {
    path: '/product',
    title: 'Product · Martis',
    description:
      'Model, operate, secure, adapt, extend and ship: the six systems behind the Martis Laravel admin foundation.',
    canonical: `${SITE_URL}/product`,
    image: `${SITE_URL}/social/product.png`,
  },
  {
    path: '/for-agencies',
    title: 'For Agencies · Martis',
    description:
      'Ship the craft, reuse the foundation. How Laravel agencies standardize client admin delivery with Martis and protect their margin.',
    canonical: `${SITE_URL}/for-agencies`,
    image: `${SITE_URL}/social/for-agencies.png`,
  },
  {
    path: '/compare',
    title: 'Compare · Martis',
    description:
      'A decision aid, not a scorecard. Compare Martis with Laravel Nova and Filament on licensing, stack and extensibility.',
    canonical: `${SITE_URL}/compare`,
    image: `${SITE_URL}/social/compare.png`,
  },
  {
    path: '/compare/nova',
    title: 'Martis vs Laravel Nova',
    description:
      'How Martis compares with Laravel Nova on licensing, frontend stack, customization and agency economics.',
    canonical: `${SITE_URL}/compare/nova`,
    image: `${SITE_URL}/social/compare.png`,
  },
  {
    path: '/compare/filament',
    title: 'Martis vs Filament',
    description:
      'How Martis compares with Filament on licensing, frontend stack, customization and agency economics.',
    canonical: `${SITE_URL}/compare/filament`,
    image: `${SITE_URL}/social/compare.png`,
  },
  {
    path: '/docs',
    title: 'Documentation · Martis',
    description:
      'Install Martis, build your first resource and go deeper: task-based navigation through the documentation.',
    canonical: `${SITE_URL}/docs`,
    image: `${SITE_URL}/social/docs.png`,
  },
  {
    path: '/changelog',
    title: 'Changelog · Martis',
    description:
      'Built in public, shipped with proof. Every Martis release with upgrade notes, generated from validated release data.',
    canonical: `${SITE_URL}/changelog`,
    image: `${SITE_URL}/social/home.png`,
  },
  NOT_FOUND_META,
]

/** Every route the site prerenders: the nine static routes above, plus one per `DOC_FLAT` entry. */
export const PUBLIC_ROUTES: string[] = [
  ...ROUTE_META.map(({ path }) => path),
  ...DOC_FLAT.map(({ slug }) => `/docs/${slug}`),
]

/** Whether `text` already names the Martis brand, so a title/description
 *  built from it must not also append a second, redundant mention (see
 *  `docsTitle`/`docsDescription` below, and the static `/compare/nova`
 *  and `/compare/filament` titles above, which drop their own brand
 *  suffix for the same reason). */
function mentionsMartis(text: string): boolean {
  return text.includes('Martis')
}

/** `'Filters'` -> `'Filters · Martis docs'`. A label that already names
 *  Martis (`docs-tree.ts`'s 'reference/differentials' entry is "Martis
 *  differentials") drops the brand from the suffix instead of repeating
 *  it, keeping only the "docs" qualifier: `'Martis differentials · Docs'`. */
function docsTitle(label: string): string {
  return mentionsMartis(label) ? `${label} · Docs` : `${label} · Martis docs`
}

/** `'Filters'` -> `'Learn about Filters in Martis.'`, with the same
 *  brand-repetition guard as `docsTitle`. */
function docsDescription(label: string): string {
  return mentionsMartis(label) ? `Learn about ${label}.` : `Learn about ${label} in Martis.`
}

/**
 * Resolves the metadata for a pathname: an exact static route, a
 * derived docs route, or the noindex 404 entry as a fallback. A
 * single trailing slash is stripped first (except for `/` itself) so
 * `/product/` and `/product` resolve to the same entry.
 */
export function getRouteMeta(pathname: string): RouteMeta {
  const normalized = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  const exact = ROUTE_META.find(({ path }) => path === normalized)
  if (exact) return exact

  const doc = DOC_FLAT.find(({ slug }) => `/docs/${slug}` === normalized)
  if (doc) {
    return {
      path: normalized,
      title: docsTitle(doc.label),
      description: docsDescription(doc.label),
      canonical: `${SITE_URL}${normalized}`,
      image: `${SITE_URL}/social/docs.png`,
    }
  }

  return NOT_FOUND_META
}
