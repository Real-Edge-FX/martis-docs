import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { serializeMeta } from '@/lib/seo'
import { getRouteMeta } from '@/lib/site-routes'
import { ROUTER_FUTURE } from '@/routes'
import { DocumentMeta } from './DocumentMeta'

/** Mounts `DocumentMeta` plus a button that navigates client-side, so the
 *  test can assert the head follows a route change without a full `App`. */
function Harness() {
  const navigate = useNavigate()
  return (
    <>
      <DocumentMeta />
      <button type="button" onClick={() => navigate('/for-agencies')}>
        Go to for-agencies
      </button>
    </>
  )
}

function canonicalHref() {
  return document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')
}

function descriptionContent() {
  return document.head.querySelector('meta[name="description"]')?.getAttribute('content')
}

describe('DocumentMeta', () => {
  it('sets the head for the initial route and updates it after client-side navigation', () => {
    render(
      <MemoryRouter initialEntries={['/product']} future={ROUTER_FUTURE}>
        <Harness />
      </MemoryRouter>,
    )

    const productMeta = getRouteMeta('/product')
    expect(document.title).toBe(productMeta.title)
    expect(canonicalHref()).toBe(productMeta.canonical)
    expect(descriptionContent()).toBe(productMeta.description)

    fireEvent.click(screen.getByRole('button', { name: 'Go to for-agencies' }))

    const agenciesMeta = getRouteMeta('/for-agencies')
    expect(document.title).toBe(agenciesMeta.title)
    expect(canonicalHref()).toBe(agenciesMeta.canonical)
    expect(descriptionContent()).toBe(agenciesMeta.description)
    // Same <link>/<meta> elements are reused across navigations, not duplicated.
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
  })

  it('adds a noindex robots tag only on the 404 route', () => {
    const first = render(
      <MemoryRouter initialEntries={['/product']} future={ROUTER_FUTURE}>
        <DocumentMeta />
      </MemoryRouter>,
    )
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    first.unmount()

    render(
      <MemoryRouter initialEntries={['/this-route-does-not-exist']} future={ROUTER_FUTURE}>
        <DocumentMeta />
      </MemoryRouter>,
    )
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
  })
})

describe('DocumentMeta matches the server-rendered head', () => {
  const HTML_UNESCAPES: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    '#39': "'",
  }
  function unescapeHtml(value: string): string {
    return value.replace(/&(amp|lt|gt|quot|#39);/g, (_, entity: string) => HTML_UNESCAPES[entity])
  }

  /** Normalizes `serializeMeta`'s HTML string into the same
   *  `"kind:attr:key:content"` shape `readHeadTags` reads from a live
   *  `document.head`, so the server string and the client DOM can be
   *  diffed as plain data regardless of representation. */
  function parseSerializedTags(html: string): string[] {
    const tags: string[] = []
    const title = /<title>([\s\S]*?)<\/title>/.exec(html)
    if (title) tags.push(`title:::${unescapeHtml(title[1])}`)
    for (const m of html.matchAll(/<meta (name|property)="([^"]+)" content="([^"]*)" \/>/g)) {
      tags.push(`meta:${m[1]}:${m[2]}:${unescapeHtml(m[3])}`)
    }
    for (const m of html.matchAll(/<link rel="([^"]+)" href="([^"]*)" \/>/g)) {
      tags.push(`link::${m[1]}:${unescapeHtml(m[2])}`)
    }
    return tags.sort()
  }

  /** Same normalized shape, read from the live `document.head` after
   *  `DocumentMeta` has run for the current route. */
  function readHeadTags(): string[] {
    const tags: string[] = [`title:::${document.title}`]
    for (const el of document.head.querySelectorAll('meta[name], meta[property]')) {
      const attr = el.hasAttribute('name') ? 'name' : 'property'
      tags.push(`meta:${attr}:${el.getAttribute(attr)}:${el.getAttribute('content') ?? ''}`)
    }
    for (const el of document.head.querySelectorAll('link[rel]')) {
      tags.push(`link::${el.getAttribute('rel')}:${el.getAttribute('href') ?? ''}`)
    }
    return tags.sort()
  }

  /** Same normalized shape as `readHeadTags`, but scoped to only the
   *  elements DocumentMeta actually manages (`[data-document-meta]`):
   *  needed once `document.head` also holds tags DocumentMeta must never
   *  touch, which `readHeadTags`'s "every meta/link" sweep would wrongly
   *  fold in. */
  function readManagedHeadTags(): string[] {
    const tags: string[] = [`title:::${document.title}`]
    for (const el of document.head.querySelectorAll('[data-document-meta]')) {
      if (el.hasAttribute('name') || el.hasAttribute('property')) {
        const attr = el.hasAttribute('name') ? 'name' : 'property'
        tags.push(`meta:${attr}:${el.getAttribute(attr)}:${el.getAttribute('content') ?? ''}`)
      } else if (el.hasAttribute('rel')) {
        tags.push(`link::${el.getAttribute('rel')}:${el.getAttribute('href') ?? ''}`)
      }
    }
    return tags.sort()
  }

  // The static <head> tags index.html ships outside the <!--app-head-->
  // marker (see index.html at the repo root): DocumentMeta must never
  // create, adopt or remove any of these, regardless of route, because
  // upsertMeta/upsertLink only ever look up tags by the name/property/rel
  // headTags() itself asks for — none of which match these.
  const STATIC_HEAD_HTML = `
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/brand/martis-icon.png" />
    <link rel="apple-touch-icon" href="/brand/martis-icon.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
  `
  const STATIC_HEAD_SELECTORS = [
    'meta[charset="UTF-8"]',
    'meta[name="viewport"]',
    'link[rel="icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="preconnect"][href="https://fonts.googleapis.com"]',
    'link[rel="preconnect"][href="https://fonts.gstatic.com"]',
    'link[rel="stylesheet"]',
  ]

  // Establishes a clean baseline so a tag left over from an earlier test
  // in this file (or file run order) cannot leak into this describe
  // block's own assertions. This is test isolation, not what proves
  // removal: the removal proof is the single test below, which mounts
  // one DocumentMeta and navigates it through three routes without ever
  // wiping document.head in between.
  beforeEach(() => {
    document.head.querySelectorAll('meta[name], meta[property], link[rel]').forEach((el) => el.remove())
    document.title = ''
  })

  it.each(['/product', '/for-agencies', '/docs/core/fields', '/404'])(
    'renders the same tags in document.head as serializeMeta for %s',
    (route) => {
      render(
        <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>
          <DocumentMeta />
        </MemoryRouter>,
      )
      expect(readHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta(route))))
    },
  )

  /** Buttons that drive client-side navigation to two fixed destinations,
   *  standing in for real in-app links. */
  function NavigationHarness() {
    const navigate = useNavigate()
    return (
      <>
        <DocumentMeta />
        <button type="button" onClick={() => navigate('/product')}>
          To /product
        </button>
        <button type="button" onClick={() => navigate('/docs/core/fields')}>
          To /docs/core/fields
        </button>
      </>
    )
  }

  it('removes a stale tag after navigating away, not just adds new ones (e.g. /404\'s robots=noindex must not survive a navigation to /product)', () => {
    render(
      <MemoryRouter initialEntries={['/404']} future={ROUTER_FUTURE}>
        <NavigationHarness />
      </MemoryRouter>,
    )
    expect(readHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta('/404'))))

    fireEvent.click(screen.getByRole('button', { name: 'To /product' }))
    expect(readHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta('/product'))))

    fireEvent.click(screen.getByRole('button', { name: 'To /docs/core/fields' }))
    expect(readHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta('/docs/core/fields'))))
  })

  it('removes a stale tag left over from real server-rendered markup, not just one it created itself, without touching tags outside its control', () => {
    // Unlike the test above (which lets DocumentMeta create every tag
    // itself against an empty head, from its very first mount), this
    // simulates real hydration: <head> already holds the exact SSR
    // output (serializeMeta, src/lib/seo.ts) for the *starting* route
    // before DocumentMeta ever runs — because that is what actually
    // happens on every real page load, prerendered or dev-server-served.
    // A tag DocumentMeta only *adopts* on mount (finds by selector,
    // matching an existing element it did not create) must still be
    // tracked for removal exactly like one it created — the two paths to
    // the same element must not diverge.
    //
    // Also surrounds that with the real static tags index.html ships
    // (STATIC_HEAD_HTML) and plants one extra *marked* stale tag, as if
    // a previous render had created it for a route whose tags no longer
    // include it. Without both of these, this test (and the one above)
    // cannot tell a sweep correctly scoped to `[data-document-meta]`
    // apart from an over-broad one like `querySelectorAll('meta, link')`:
    // with nothing unmanaged present, an over-broad sweep would remove
    // exactly the same elements a correct one does, and pass just the
    // same. In production, that over-broad version would strip
    // index.html's favicon, preconnect and font stylesheet links on the
    // very first client-side navigation.
    document.head.innerHTML =
      STATIC_HEAD_HTML +
      serializeMeta(getRouteMeta('/404')) +
      '<meta name="x-stale" content="1" data-document-meta="" />'

    render(
      <MemoryRouter initialEntries={['/404']} future={ROUTER_FUTURE}>
        <NavigationHarness />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'To /product' }))

    expect(document.head.querySelector('meta[name="x-stale"]'), 'stale marked tag must be removed').toBeNull()
    for (const selector of STATIC_HEAD_SELECTORS) {
      expect(document.head.querySelector(selector), `static tag "${selector}" must survive`).not.toBeNull()
    }
    expect(readManagedHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta('/product'))))
  })
})
