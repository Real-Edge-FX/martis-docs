import { describe, expect, it } from 'vitest'
import { DEFAULT_IMAGE_ALT, serializeMeta } from './seo'
import type { RouteMeta } from './site-routes'

const BASE_META: RouteMeta = {
  path: '/product',
  title: 'Product · Martis',
  description: 'Model, operate, secure, adapt, extend and ship with Martis.',
  canonical: 'https://getmartis.com/product',
  image: 'https://getmartis.com/social/product.png',
}

describe('serializeMeta', () => {
  it('escapes hostile input in every text and attribute value', () => {
    const hostile: RouteMeta = {
      ...BASE_META,
      title: `<script>alert('x')</script> & "quoted"`,
      description: `Say "hi" & <bye> to 'agencies'`,
      canonical: `https://getmartis.com/product?x="><script>`,
      image: `https://getmartis.com/social/product.png?x="><script>`,
    }

    const html = serializeMeta(hostile)

    expect(html).not.toContain('<script>')
    expect(html).not.toContain(`'x'`)
    expect(html).toContain('&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;')
    expect(html).toContain('&amp;')
    expect(html).toContain('&quot;quoted&quot;')
    expect(html).toContain('&#39;agencies&#39;')
  })

  it('emits exactly one canonical link, matching the route canonical', () => {
    const html = serializeMeta(BASE_META)
    const matches = html.match(/rel="canonical"/g) ?? []

    expect(matches).toHaveLength(1)
    expect(html).toContain(`<link rel="canonical" href="${BASE_META.canonical}" />`)
  })

  it('omits the robots tag for an indexable route', () => {
    const html = serializeMeta(BASE_META)
    expect(html).not.toContain('robots')
  })

  it('adds a noindex robots tag when noIndex is set', () => {
    const html = serializeMeta({ ...BASE_META, noIndex: true })
    expect(html).toContain('<meta name="robots" content="noindex" />')
  })

  it('includes title, description, Open Graph and Twitter card tags', () => {
    const html = serializeMeta(BASE_META)

    expect(html).toContain(`<title>${BASE_META.title}</title>`)
    expect(html).toContain(`<meta name="description" content="${BASE_META.description}" />`)
    expect(html).toContain('<meta property="og:type" content="website" />')
    expect(html).toContain('<meta property="og:site_name" content="Martis" />')
    expect(html).toContain(`<meta property="og:url" content="${BASE_META.canonical}" />`)
    expect(html).toContain(`<meta property="og:title" content="${BASE_META.title}" />`)
    expect(html).toContain(`<meta property="og:description" content="${BASE_META.description}" />`)
    expect(html).toContain(`<meta property="og:image" content="${BASE_META.image}" />`)
    expect(html).toContain('<meta property="og:image:width" content="1200" />')
    expect(html).toContain('<meta property="og:image:height" content="630" />')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
    expect(html).toContain(`<meta name="twitter:title" content="${BASE_META.title}" />`)
    expect(html).toContain(`<meta name="twitter:description" content="${BASE_META.description}" />`)
    expect(html).toContain(`<meta name="twitter:image" content="${BASE_META.image}" />`)
  })

  it('defaults the Open Graph and Twitter image alt when the route sets none', () => {
    const html = serializeMeta(BASE_META)
    expect(html).toContain(`<meta property="og:image:alt" content="${DEFAULT_IMAGE_ALT}" />`)
    expect(html).toContain(`<meta name="twitter:image:alt" content="${DEFAULT_IMAGE_ALT}" />`)
  })

  it('uses a route-supplied imageAlt over the default', () => {
    const html = serializeMeta({ ...BASE_META, imageAlt: 'A custom description of the image' })
    expect(html).toContain('<meta property="og:image:alt" content="A custom description of the image" />')
    expect(html).toContain('<meta name="twitter:image:alt" content="A custom description of the image" />')
  })
})
