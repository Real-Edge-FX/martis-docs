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

  it('removes a stale tag left over from real server-rendered markup, not just one it created itself', () => {
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
    document.head.innerHTML = serializeMeta(getRouteMeta('/404'))

    render(
      <MemoryRouter initialEntries={['/404']} future={ROUTER_FUTURE}>
        <NavigationHarness />
      </MemoryRouter>,
    )
    expect(readHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta('/404'))))

    fireEvent.click(screen.getByRole('button', { name: 'To /product' }))
    expect(readHeadTags()).toEqual(parseSerializedTags(serializeMeta(getRouteMeta('/product'))))
  })
})
