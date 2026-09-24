import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { headTags } from '@/lib/seo'
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

/** Finds a `<link>` by its `rel`, creating and appending one to `<head>`
 *  on first use, then writes `href`. */
function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Client-only head writer: keeps `document.title` and the meta/link tags
 * `serializeMeta` (src/lib/seo.ts) renders on the server in sync after
 * client-side navigation, since React Router does not re-run the SSR
 * head on route changes. Both consumers derive from the same `headTags`
 * list, so they cannot drift apart. Renders nothing, and every DOM write
 * happens inside an effect, so mounting it during SSR is a no-op.
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

    for (const tag of headTags(meta)) {
      switch (tag.kind) {
        case 'title':
          document.title = tag.content
          break
        case 'meta':
          upsertMeta(tag.attr, tag.key, tag.content)
          break
        case 'link':
          upsertLink(tag.rel, tag.href)
          break
      }
    }

    // headTags() only ever *adds* a robots tag (for a noIndex route); a
    // route that stops being noIndex across a client navigation must have
    // the previous route's tag removed explicitly.
    if (!meta.noIndex) {
      removeMeta('name', 'robots')
    }
  }, [pathname])

  return null
}
