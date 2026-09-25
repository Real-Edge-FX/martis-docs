import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteMeta } from '@/lib/site-routes'

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value)
}

export function DocumentMeta() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = getRouteMeta(pathname)
    document.title = meta.title
    upsertMeta('meta[name="description"]', { name: 'description', content: meta.description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: meta.description })
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: meta.image })
    upsertMeta('meta[name="robots"]', { name: 'robots', content: meta.noIndex ? 'noindex, nofollow' : 'index, follow' })

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = meta.canonical
  }, [pathname])

  return null
}
