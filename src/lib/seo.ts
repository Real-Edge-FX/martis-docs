import type { RouteMeta } from '@/lib/site-routes'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/** Escapes the five characters unsafe in HTML text and double-quoted attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/** Used for `og:image:alt`/`twitter:image:alt` on any route whose `RouteMeta`
 *  does not set its own `imageAlt`. */
export const DEFAULT_IMAGE_ALT = 'Martis, the open-source admin foundation for Laravel agencies'

/**
 * One tag in a route's `<head>`: a `<title>`, a `<meta name="...">` /
 * `<meta property="...">`, or a `<link rel="...">`. The ordered list
 * `headTags()` returns is the single source of truth for which tags a
 * route renders; `serializeMeta` (server string) and `DocumentMeta`
 * (client DOM upsert) each turn the same list into their own
 * representation instead of hand-duplicating the tag set.
 */
export type HeadTag =
  | { kind: 'title'; content: string }
  | { kind: 'meta'; attr: 'name' | 'property'; key: string; content: string }
  | { kind: 'link'; rel: string; href: string }

/**
 * Turns a route's metadata into the ordered list of head tags it
 * renders: title, description, canonical, Open Graph, Twitter card
 * (including an image alt for both, defaulting to `DEFAULT_IMAGE_ALT`
 * when the route sets none), and `robots` when `noIndex`.
 *
 * JSON-LD structured data is out of scope for this registry.
 */
export function headTags(meta: RouteMeta): HeadTag[] {
  const imageAlt = meta.imageAlt ?? DEFAULT_IMAGE_ALT

  const tags: HeadTag[] = [
    { kind: 'title', content: meta.title },
    { kind: 'meta', attr: 'name', key: 'description', content: meta.description },
    { kind: 'link', rel: 'canonical', href: meta.canonical },
    { kind: 'meta', attr: 'property', key: 'og:type', content: 'website' },
    { kind: 'meta', attr: 'property', key: 'og:site_name', content: 'Martis' },
    { kind: 'meta', attr: 'property', key: 'og:url', content: meta.canonical },
    { kind: 'meta', attr: 'property', key: 'og:title', content: meta.title },
    { kind: 'meta', attr: 'property', key: 'og:description', content: meta.description },
    { kind: 'meta', attr: 'property', key: 'og:image', content: meta.image },
    { kind: 'meta', attr: 'property', key: 'og:image:width', content: '1200' },
    { kind: 'meta', attr: 'property', key: 'og:image:height', content: '630' },
    { kind: 'meta', attr: 'property', key: 'og:image:alt', content: imageAlt },
    { kind: 'meta', attr: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { kind: 'meta', attr: 'name', key: 'twitter:title', content: meta.title },
    { kind: 'meta', attr: 'name', key: 'twitter:description', content: meta.description },
    { kind: 'meta', attr: 'name', key: 'twitter:image', content: meta.image },
    { kind: 'meta', attr: 'name', key: 'twitter:image:alt', content: imageAlt },
  ]

  if (meta.noIndex) {
    tags.push({ kind: 'meta', attr: 'name', key: 'robots', content: 'noindex' })
  }

  return tags
}

function tagToHtml(tag: HeadTag): string {
  switch (tag.kind) {
    case 'title':
      return `<title>${escapeHtml(tag.content)}</title>`
    case 'meta':
      return `<meta ${tag.attr}="${tag.key}" content="${escapeHtml(tag.content)}" />`
    case 'link':
      return `<link rel="${tag.rel}" href="${escapeHtml(tag.href)}" />`
  }
}

/**
 * Renders a route's `<head>` tags (from `headTags`) as a single HTML
 * string, used by the SSR entry to fill the server-rendered head.
 * `DocumentMeta` mirrors the same tags on the client, one DOM element
 * at a time, for client-side navigation.
 */
export function serializeMeta(meta: RouteMeta): string {
  return headTags(meta).map(tagToHtml).join('\n')
}
