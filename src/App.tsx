import { lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { matchRoutes, useRoutes } from 'react-router-dom'
import { LoadingScreen } from '@/components/LoadingScreen'
import { DocumentMeta } from '@/components/site/DocumentMeta'
import { CmdKProvider } from '@/lib/cmdk-context'

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
  /** Imports the chunk of the page `element` renders. */
  preload: () => Promise<unknown>
}

// The route table, read by both `PageRoutes` and `preloadRoute` so they
// always agree on which page a URL renders.
const PAGE_ROUTES: PageRoute[] = [
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
  { path: '/docs/*', element: <Docs />, preload: Docs.preload },
  { path: '*', element: <NotFound />, preload: NotFound.preload },
]

function PageRoutes() {
  return useRoutes(PAGE_ROUTES)
}

/**
 * The route tree shared by every entry: the browser wraps it in
 * `BrowserRouter`, the server in `StaticRouter`, tests in `MemoryRouter`.
 */
export function App() {
  return (
    <CmdKProvider>
      <DocumentMeta />
      <Suspense fallback={<LoadingScreen />}>
        <PageRoutes />
      </Suspense>
    </CmdKProvider>
  )
}

/**
 * Imports the chunk of the page `pathname` renders. The client awaits it
 * before hydrating, so the lazy page resolves from the module cache
 * rather than keeping its server HTML inert while the chunk downloads.
 */
export function preloadRoute(pathname: string): Promise<unknown> {
  const [match] = matchRoutes(PAGE_ROUTES, pathname) ?? []
  return match ? match.route.preload() : Promise.resolve()
}
