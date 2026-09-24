import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import { LoadingScreen } from '@/components/LoadingScreen'
import { DocumentMeta } from '@/components/site/DocumentMeta'
import { CmdKProvider } from '@/lib/cmdk-context'
import { PAGE_ROUTES } from '@/routes'

function PageRoutes() {
  return useRoutes(PAGE_ROUTES)
}

/**
 * The route tree shared by every entry: the browser wraps it in
 * `BrowserRouter`, the server in `StaticRouter`, tests in `MemoryRouter`.
 * Exports only this component (the route table, `lazyPage` and
 * `preloadRoute` live in `src/routes.tsx`) so this file stays a plain
 * Fast Refresh boundary.
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
