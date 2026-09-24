import { StrictMode, type ReactElement } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/App'
import { loadInitialDocument, RenderProvider } from '@/lib/render-context'
import { preloadRoute, ROUTER_FUTURE } from '@/routes'

/**
 * Resolves what the server rendered for `pathname` (the page's chunk,
 * and on a docs page its MDX module) and builds the exact client element
 * tree `entry-client.tsx` mounts. Pulled out of `entry-client.tsx` (which
 * has an import-time side effect — it boots the app against the real
 * `#root` as soon as it is imported) so both the real entry point and the
 * hydration test (src/lib/client-app.test.tsx) build this tree from one
 * place instead of the test hand-rolling a second copy that could drift
 * from what actually ships.
 */
export async function prepareClientApp(pathname: string): Promise<ReactElement> {
  const [initialDocument] = await Promise.all([loadInitialDocument(pathname), preloadRoute(pathname)])

  return (
    <StrictMode>
      <BrowserRouter future={ROUTER_FUTURE}>
        <RenderProvider initialDocument={initialDocument}>
          <App />
        </RenderProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
