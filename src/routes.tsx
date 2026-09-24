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
  element: ReactElement
  /** Imports the chunk(s) `pathname` needs before this route renders it. */
  preload: (pathname: string) => Promise<unknown>
}

/** The splat pattern every docs URL matches: `/docs`, `/docs/core/fields`,
 *  etc. Shared by the route table below (which decides `/docs/*` renders
 *  the docs shell) and `render-context.tsx` (which resolves the MDX
 *  module a `/docs/*` URL needs), so the two can never disagree about
 *  what counts as a docs URL. */
export const DOCS_ROUTE_PATTERN = '/docs/*'

/**
 * Opts every Router instance (BrowserRouter, StaticRouter, and the
 * MemoryRouters used in tests) into the two v6 behaviors React Router
 * warns about by default: wrapping navigations in `React.startTransition`,
 * and the v7 relative-splat-path resolution. Silences the warnings.
 *
 * What keeps server, client and every test Router agreeing on how a
 * relative link under `/docs/*` resolves is not the *value* of
 * `v7_relativeSplatPath` below — it's that every Router imports this one
 * constant instead of setting its own `future` prop, so changing the
 * value here moves every consumer together. (Today it changes nothing
 * observable either way: every `Link`/`navigate()` target in this
 * codebase is already an absolute `/docs/...` path, so no relative
 * resolution is ever in play. See the Phase 1 Task 7 fix-round-1 report.)
 *
 * `v7_startTransition` does have one real, currently-accepted UX
 * consequence, worth knowing about before it's mistaken for a bug: `App`
 * (src/App.tsx) wraps every route in one shared `<Suspense>`, and
 * `DocumentMeta` sits outside that boundary, reading the same location
 * state as a sibling. Wrapping the navigation's state update in
 * `React.startTransition` means that when a navigation's destination page
 * has not finished loading its chunk, React does not commit that
 * `<Suspense>`'s fallback the way a non-transition update would — the
 * whole pending render (the new page *and* DocumentMeta's new head/title,
 * since they update together) stays uncommitted, so the *previous* page
 * and its title remain on screen, together, until the new chunk resolves
 * and both swap in at once. The URL itself still changes immediately
 * (the history API updates independently of React's commit). Net effect:
 * on a slow chunk load, the address bar can disagree with the visible
 * page and title for a moment, with no loading indicator. Deliberately
 * left as-is here — no pending indicator built — so a future phase does
 * not mistake it for a hydration bug when it's noticed.
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
// so they always agree on which page a URL renders.
export const PAGE_ROUTES: PageRoute[] = [
  { path: '/', element: <Landing />, preload: Landing.preload },
  // Provisional pages until Phases 2 and 3 ship the real ones: each of
  // those tasks replaces its route's element (and preload) here.
  {
    path: '/product',
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
    path: DOCS_ROUTE_PATTERN,
    element: <DocsOrNotFound />,
    preload: (pathname) => (isKnownDocsPath(pathname) ? Docs.preload() : NotFound.preload()),
  },
  { path: '*', element: <NotFound />, preload: NotFound.preload },
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
