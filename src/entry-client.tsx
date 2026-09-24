import { createRoot, hydrateRoot } from 'react-dom/client'
import { prepareClientApp } from '@/lib/client-app'
import '@/styles/globals.css'
import '@/styles/prose.css'

/**
 * Resolves what the server rendered before React touches the markup (the
 * page's chunk and, on a docs page, its MDX module), so the first client
 * render matches the server HTML instead of starting from a loading state.
 * If either import fails, the caller (see `start()`'s catch below) leaves
 * the static HTML as it is.
 */
async function start(root: HTMLElement) {
  const app = await prepareClientApp(window.location.pathname)

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
//
// A rejected boot (a stale chunk 404ing after a deploy, a broken MDX
// import, ...) must not become an unhandled rejection: catch it and log
// it clearly, and leave the server-rendered HTML exactly as it is rather
// than unmounting or replacing it with nothing.
void start(root).catch((error: unknown) => {
  console.error('Martis failed to start the client app; the server-rendered page is still shown.', error)
})
