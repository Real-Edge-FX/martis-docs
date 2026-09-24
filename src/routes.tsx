import { lazy, type ComponentType, type ReactElement } from 'react'
import { matchPath, matchRoutes, useLocation } from 'react-router-dom'
import { docSlugFromSplat, hasMdx } from '@/lib/mdx-loader'

// The route table (PAGE_ROUTES) and its helpers (lazyPage, preloadRoute)
// live here, separate from App.tsx, so App.tsx stays just the component
// tree and keeps working as a Fast Refresh boundary: a file that also
// exports data (a route table) and functions loses that.

/** `lazy()` that keeps its import factory as `preload`, so the page's chunk
 *  can be fetched before the page renders. */
function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  return Object.assign(lazy(load), { preload: load })
}

// Each page is its own chunk, fetched on demand, so the landing's CSS / JS
// budget does not pay for the docs renderer (and vice-versa).
const Landing = lazyPage(() => import('@/pages/Landing'))
const Docs = lazyPage(() => import('@/pages/Docs'))
const ProvisionalPage = lazyPage(() => import('@/pages/ProvisionalPage'))
const NotFound = lazyPage(() => import('@/pages/NotFound'))

interface PageRoute {
  path: string
  /** Always true: `getRouteMeta` and the prerendered files on disk are
   *  case-sensitive, so `/PRODUCT` must render the 404 page, not Product. */
  caseSensitive: true
  element: ReactElement
  /** Imports the chunk(s) `pathname` needs before this route renders it. */
  preload: (pathname: string) => Promise<unknown>
}

/** The splat pattern every docs URL matches: `/docs`, `/docs/core/fields`,
 *  etc. Shared by the route table below (which decides `/docs/*` renders
 *  the docs shell) and `render-context.tsx` (which resolves the MDX
 *  module a `/docs/*` URL needs), so the two can never disagree about
 *  what counts as a docs URL. Case-sensitive, like every route here. */
export const DOCS_ROUTE_PATTERN = { path: '/docs/*', caseSensitive: true } as const

/**
 * The `future` flags every Router (BrowserRouter, StaticRouter and the
 * test MemoryRouters) shares, so server, client and tests resolve links
 * and schedule navigations the same way. Opts into the two v6 behaviours
 * React Router otherwise warns about.
 *
 * With `v7_startTransition`, a navigation to a page whose chunk is still
 * loading keeps the previous page and its head (DocumentMeta sits outside
 * App's `<Suspense>`) on screen until the chunk resolves; the address bar
 * already shows the new URL meanwhile. That is expected, not a hydration
 * bug.
 */
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true } as const

/** Whether `pathname` is a `/docs` URL this site can actually render: the
 *  index or a slug with a registered MDX module. The boundary between the
 *  docs shell and the global not-found page for `/docs/*` — an unmatched
 *  slug must render identical markup to any other unknown URL (see
 *  `DocsOrNotFound`), so Apache's static `404.html` and a client-side
 *  hydration at that same URL never disagree. */
function isKnownDocsPath(pathname: string): boolean {
  const slug = docSlugFromSplat(matchPath(DOCS_ROUTE_PATTERN, pathname)?.params['*'])
  return slug === '' || hasMdx(slug)
}

/** Element for `/docs/*`: the docs shell for the index and every known
 *  slug, the global not-found page for anything else. */
function DocsOrNotFound() {
  const { pathname } = useLocation()
  return isKnownDocsPath(pathname) ? <Docs /> : <NotFound />
}

// The route table, read by both `App` (via `useRoutes`) and `preloadRoute`
// so they always agree on which page a URL renders. Every static route in
// `site-routes.ts` has its own entry (site-routes.test.ts checks it).
export const PAGE_ROUTES: PageRoute[] = [
  { path: '/', caseSensitive: true, element: <Landing />, preload: Landing.preload },
  // Provisional pages until Phases 2 and 3 ship the real ones: each of
  // those tasks replaces its route's element (and preload) here.
  {
    path: '/product',
    caseSensitive: true,
    element: (
      <ProvisionalPage
        eyebrow="Product"
        title="One foundation. Six parts of delivery."
        summary="The chapter-by-chapter tour of Martis is still being written; until it ships, the documentation covers every feature."
      />
    ),
    preload: ProvisionalPage.preload,
  },
  {
    path: '/for-agencies',
    caseSensitive: true,
    element: (
      <ProvisionalPage
        eyebrow="For Laravel agencies"
        title="Build a baseline once. Keep shipping it."
        summary="The guide to running client admin work on one Martis baseline is still being written; the installation guide is the place to start."
      />
    ),
    preload: ProvisionalPage.preload,
  },
  {
    path: '/compare',
    caseSensitive: true,
    element: (
      <ProvisionalPage
        eyebrow="Compare"
        title="Compare Martis with Nova and Filament"
        summary="The comparison with Laravel Nova and Filament is still being written, and every claim in it will cite an official source."
      />
    ),
    preload: ProvisionalPage.preload,
  },
  {
    path: '/compare/nova',
    caseSensitive: true,
    element: (
      <ProvisionalPage
        eyebrow="Compare"
        title="Martis vs Laravel Nova"
        summary="The side-by-side comparison with Laravel Nova is still being written, and every claim in it will cite an official source."
      />
    ),
    preload: ProvisionalPage.preload,
  },
  {
    path: '/compare/filament',
    caseSensitive: true,
    element: (
      <ProvisionalPage
        eyebrow="Compare"
        title="Martis vs Filament"
        summary="The side-by-side comparison with Filament is still being written, and every claim in it will cite an official source."
      />
    ),
    preload: ProvisionalPage.preload,
  },
  {
    path: '/changelog',
    caseSensitive: true,
    element: (
      <ProvisionalPage
        eyebrow="Changelog"
        title="Martis releases"
        summary="The browsable release history is still being built; until it ships, every release note is published on GitHub."
      />
    ),
    preload: ProvisionalPage.preload,
  },
  {
    ...DOCS_ROUTE_PATTERN,
    element: <DocsOrNotFound />,
    preload: (pathname) => (isKnownDocsPath(pathname) ? Docs.preload() : NotFound.preload()),
  },
  { path: '/404', caseSensitive: true, element: <NotFound />, preload: NotFound.preload },
  { path: '*', caseSensitive: true, element: <NotFound />, preload: NotFound.preload },
]

/**
 * Imports the chunk of the page `pathname` renders. The client awaits it
 * before hydrating, so the lazy page resolves from the module cache
 * rather than keeping its server HTML inert while the chunk downloads.
 */
export function preloadRoute(pathname: string): Promise<unknown> {
  const [match] = matchRoutes(PAGE_ROUTES, pathname) ?? []
  return match ? match.route.preload(pathname) : Promise.resolve()
}
