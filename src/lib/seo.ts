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

/**
 * Renders a route's `<head>` tags (title, description, canonical,
 * Open Graph, Twitter card, and `robots` when `noIndex`) as a single
 * HTML string. Used by the SSR entry to fill the server-rendered
 * head. `DocumentMeta` mirrors the same tag set on the client, one
 * element at a time, for client-side navigation.
 *
 * JSON-LD structured data is out of scope for this registry.
 */
export function serializeMeta(meta: RouteMeta): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const canonical = escapeHtml(meta.canonical)
  const image = escapeHtml(meta.image)

  const tags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Martis" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ]

  if (meta.noIndex) {
    tags.push(`<meta name="robots" content="noindex" />`)
  }

  return tags.join('\n')
}
