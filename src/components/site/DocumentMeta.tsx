import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMeta } from '@/lib/site-routes'

/** Finds a `<meta>` by its `name`/`property` attribute, creating and
 *  appending one to `<head>` on first use, then writes `content`. */
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeMeta(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove()
}

/**
 * Client-only head writer: keeps `document.title` and the meta tags
 * `serializeMeta` (src/lib/seo.ts) renders on the server in sync after
 * client-side navigation, since React Router does not re-run the SSR
 * head on route changes. Renders nothing, and every DOM write happens
 * inside an effect, so mounting it during SSR is a no-op.
 *
 * Mounted once inside `App`, above the route tree, so it has router
 * context and reacts to every navigation regardless of which page
 * component is active. It is the single writer of the document head
 * on the client; no page component should set `document.title` itself.
 */
export function DocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = getRouteMeta(pathname)

    document.title = meta.title

    upsertMeta('name', 'description', meta.description)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'Martis')
    upsertMeta('property', 'og:url', meta.canonical)
    upsertMeta('property', 'og:title', meta.title)
    upsertMeta('property', 'og:description', meta.description)
    upsertMeta('property', 'og:image', meta.image)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', meta.title)
    upsertMeta('name', 'twitter:description', meta.description)
    upsertMeta('name', 'twitter:image', meta.image)

    if (meta.noIndex) {
      upsertMeta('name', 'robots', 'noindex')
    } else {
      removeMeta('name', 'robots')
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', meta.canonical)
  }, [pathname])

  return null
}
