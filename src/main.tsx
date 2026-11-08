import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from '@/App'
import '@/styles/globals.css'
import '@/styles/prose.css'
import { registerWebMcpTools } from '@/lib/webmcp'
import { PUBLIC_ROUTES } from '@/lib/site-routes'

// A deploy replaces the hashed chunks. A page still holding the previous
// build (Safari's back/forward cache, a tab left open) then fails to load the
// next lazy chunk and would hang on the loading screen: reload once to pick
// up the new build. The flag stops a reload loop when the chunk is really
// missing.
const RELOAD_FLAG = 'martis-docs:chunk-reload'
window.addEventListener('vite:preloadError', (event) => {
  let reloaded = false
  try { reloaded = sessionStorage.getItem(RELOAD_FLAG) === '1' } catch { /* storage unavailable */ }
  if (reloaded) return
  event.preventDefault()
  try { sessionStorage.setItem(RELOAD_FLAG, '1') } catch { /* storage unavailable */ }
  window.location.reload()
})
window.addEventListener('load', () => {
  window.setTimeout(() => { try { sessionStorage.removeItem(RELOAD_FLAG) } catch { /* storage unavailable */ } }, 10_000)
})

registerWebMcpTools()
// The build's prerender step (scripts/prerender.mjs) reads the route list here.
;(window as Window & { __MARTIS_PUBLIC_ROUTES__?: string[] }).__MARTIS_PUBLIC_ROUTES__ = PUBLIC_ROUTES

const root = document.getElementById('root')
if (!root) {
  throw new Error('#root element missing — check index.html')
}

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
