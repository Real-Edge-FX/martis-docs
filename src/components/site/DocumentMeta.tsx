import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { headTags } from '@/lib/seo'
import { getRouteMeta } from '@/lib/site-routes'

/** Marks every `<meta>`/`<link>` element `DocumentMeta` creates, so a
 *  later render can tell "a tag this component owns but the current
 *  route no longer lists" (must be removed) apart from unrelated head
 *  elements it must never touch (favicon, preconnect, stylesheet links
 *  from index.html — see the static markup DocumentMeta is never meant
 *  to manage). Presence-only; the value carries no information. */
const MANAGED_ATTR = 'data-document-meta'

/** Finds a `<meta>` by its `name`/`property` attribute, creating and
 *  appending one to `<head>` on first use, then writes `content`.
 *  Returns the element so the caller can record it as still-current.
 *  Marks the element as managed unconditionally, not only when creating
 *  it: the first one DocumentMeta ever sees for a given key is usually
 *  *adopted*, not created — the real server-rendered element already in
 *  `<head>` on the very first hydration — and it must be tracked for
 *  later removal exactly like one this component created itself. */
function upsertMeta(attr: 'name' | 'property', key: string, content: string): Element {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute(MANAGED_ATTR, '')
  el.setAttribute('content', content)
  return el
}

/** Finds a `<link>` by its `rel`, creating and appending one to `<head>`
 *  on first use, then writes `href`. Returns the element so the caller
 *  can record it as still-current. Marks the element as managed
 *  unconditionally: see `upsertMeta`'s comment on adopted vs. created
 *  elements — the same reasoning applies here. */
function upsertLink(rel: string, href: string): Element {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute(MANAGED_ATTR, '')
  el.setAttribute('href', href)
  return el
}

/**
 * Client-only head writer: keeps `document.title` and the meta/link tags
 * `serializeMeta` (src/lib/seo.ts) renders on the server in sync after
 * client-side navigation, since React Router does not re-run the SSR
 * head on route changes. Both consumers derive from the same `headTags`
 * list, so they cannot drift apart — including for *removal*: a tag one
 * route renders and the next does not (today, only `robots`; potentially
 * anything `headTags` ever grows) is removed generically, by diffing
 * every `[data-document-meta]` element against the new tag list, rather
 * than a special case naming one tag by key. Renders nothing, and every
 * DOM write happens inside an effect, so mounting it during SSR is a
 * no-op.
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
    const current = new Set<Element>()

    for (const tag of headTags(meta)) {
      switch (tag.kind) {
        case 'title':
          document.title = tag.content
          break
        case 'meta':
          current.add(upsertMeta(tag.attr, tag.key, tag.content))
          break
        case 'link':
          current.add(upsertLink(tag.rel, tag.href))
          break
        default: {
          // Exhaustiveness check: a new HeadTag kind must teach this
          // switch how to render it, or this line fails to typecheck.
          const exhaustive: never = tag
          throw new Error(`DocumentMeta: unhandled head tag ${JSON.stringify(exhaustive)}`)
        }
      }
    }

    // Anything this component previously wrote that the new tag list no
    // longer includes is stale (e.g. the last route's robots=noindex,
    // once the new route is not noIndex) and must go, whatever it is —
    // generic over headTags()'s output, not hardcoded to any one tag.
    for (const el of document.head.querySelectorAll(`[${MANAGED_ATTR}]`)) {
      if (!current.has(el)) el.remove()
    }
  }, [pathname])

  return null
}
