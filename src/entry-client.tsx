import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App, preloadRoute } from '@/App'
import { loadInitialDocument, RenderProvider } from '@/lib/render-context'
import '@/styles/globals.css'
import '@/styles/prose.css'

/**
 * Resolves what the server rendered before React touches the markup (the
 * page's chunk and, on a docs page, its MDX module), so the first client
 * render matches the server HTML instead of starting from a loading state.
 * If either import fails, the static HTML stays as it is.
 */
async function start(root: HTMLElement) {
  const { pathname } = window.location
  const [initialDocument] = await Promise.all([loadInitialDocument(pathname), preloadRoute(pathname)])

  const app = (
    <StrictMode>
      <BrowserRouter>
        <RenderProvider initialDocument={initialDocument}>
          <App />
        </RenderProvider>
      </BrowserRouter>
    </StrictMode>
  )

  // A prerendered page ships its markup inside #root. The dev server only
  // ships the `<!--app-html-->` placeholder comment, so there is nothing to
  // hydrate and the app renders from scratch.
  if (root.firstElementChild) {
    hydrateRoot(root, app)
  } else {
    createRoot(root).render(app)
  }
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('#root element missing: check index.html')
}

// Not a top-level await: the page chunks import shared code from this entry
// chunk, so awaiting one of them while this module is still evaluating
// deadlocks the production bundle before React ever hydrates.
void start(root)
