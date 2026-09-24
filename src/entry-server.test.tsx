// @vitest-environment node
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { DOC_NAV } from '@/lib/docs-tree'
import { serializeMeta } from '@/lib/seo'
import { getRouteMeta, PUBLIC_ROUTES } from '@/lib/site-routes'
import { render } from './entry-server'

/** Text of the first `<h1>` in `html`, with any inline markup (anchor, code) stripped. */
function firstHeading(html: string): string | undefined {
  return /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]+>/g, '')
}

/** The `# Heading` line of a docs page's MDX source. */
function mdxHeading(slug: string): string | undefined {
  const source = readFileSync(new URL(`./content/${slug}.mdx`, import.meta.url), 'utf8')
  return /^# (.+)$/m.exec(source)?.[1]
}

// A server render must be silent: React and React Router report SSR
// misuse (a `<Navigate>` in a `StaticRouter`, `useLayoutEffect` on the
// server, key or markup errors) through the console.
let consoleSpies: MockInstance[] = []
beforeEach(() => {
  consoleSpies = [vi.spyOn(console, 'error'), vi.spyOn(console, 'warn')]
})
afterEach(() => {
  for (const spy of consoleSpies) {
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  }
})

it('renders meaningful HTML and metadata without a browser', async () => {
  const result = await render('/for-agencies')
  expect(result.status).toBe(200)
  expect(result.html).toContain('For Laravel agencies')
  expect(result.head).toContain('https://getmartis.com/for-agencies')
})

it('marks unknown routes as 404', async () => {
  expect((await render('/missing')).status).toBe(404)
})

it('renders a docs page from its MDX module, not the loading screen', async () => {
  const { html, status } = await render('/docs/getting-started/installation')
  expect(status).toBe(200)
  expect(firstHeading(html)).toBe(mdxHeading('getting-started/installation'))
  expect(html).not.toContain('Loading…')
})

describe('status and head', () => {
  it('serializes the metadata of the rendered route into the head', async () => {
    expect((await render('/product')).head).toBe(serializeMeta(getRouteMeta('/product')))
  })

  it('answers 404 with the noindex head for /404 itself', async () => {
    const { head, status } = await render('/404')
    expect(status).toBe(404)
    expect(head).toContain('<meta name="robots" content="noindex" />')
  })

  it('answers 404 for a docs slug with no page', async () => {
    const { html, status } = await render('/docs/core/not-a-page')
    expect(status).toBe(404)
    expect(firstHeading(html)).toBe('Doc not found')
  })

  it('ignores the query string and hash when resolving the route', async () => {
    const { html, head, status } = await render('/docs/getting-started/installation?ref=newsletter#requirements')
    expect(status).toBe(200)
    expect(head).toBe(serializeMeta(getRouteMeta('/docs/getting-started/installation')))
    expect(firstHeading(html)).toBe(mdxHeading('getting-started/installation'))
  })

  it('treats a trailing slash like the bare path', async () => {
    const page = await render('/for-agencies/')
    expect(page.status).toBe(200)
    expect(page.head).toBe(serializeMeta(getRouteMeta('/for-agencies')))
    expect(firstHeading(page.html)).toBe('Build a baseline once. Keep shipping it.')

    const doc = await render('/docs/getting-started/installation/')
    expect(doc.status).toBe(200)
    expect(firstHeading(doc.html)).toBe(mdxHeading('getting-started/installation'))
  })
})

describe('provisional marketing pages', () => {
  it.each([
    ['/product', 'Product', 'One foundation. Six parts of delivery.'],
    ['/for-agencies', 'For Laravel agencies', 'Build a baseline once. Keep shipping it.'],
    ['/compare', 'Compare', 'Compare Martis with Nova and Filament'],
    ['/compare/nova', 'Compare', 'Martis vs Laravel Nova'],
    ['/compare/filament', 'Compare', 'Martis vs Filament'],
    ['/changelog', 'Changelog', 'Martis releases'],
  ])('%s renders its eyebrow, heading and install link', async (path, eyebrow, heading) => {
    const { html, status } = await render(path)
    expect(status).toBe(200)
    expect(html).toContain(`>${eyebrow}</p>`)
    expect(firstHeading(html)).toBe(heading)
    expect(html).toMatch(/<a [^>]*href="\/docs\/getting-started\/installation"[^>]*>Install Martis<\/a>/)
  })
})

it('renders the docs index as a list of every docs page', async () => {
  const { html, status } = await render('/docs')
  expect(status).toBe(200)
  expect(firstHeading(html)).toBe('Documentation')
  for (const item of DOC_NAV.flatMap((group) => group.items)) {
    expect(html).toContain(`href="/docs/${item.slug}"`)
  }
})

it('renders every public route to complete, well-formed HTML', async () => {
  for (const route of PUBLIC_ROUTES) {
    const { html, status } = await render(route)
    expect(status, route).toBe(route === '/404' ? 404 : 200)
    expect(html, route).toContain('<main')
    expect(html, route).not.toContain('Loading…')
    // U+0000 is never valid in HTML, so it can only be stream corruption.
    expect(html, route).not.toContain('\u0000')
  }
})

it('renders the same URL to the same markup every time', async () => {
  const first = await render('/docs/core/fields')
  expect(await render('/docs/core/fields')).toEqual(first)
})

it('rejects when a page throws, instead of resolving with a client-only fallback', async () => {
  vi.resetModules()
  vi.doMock('@/pages/NotFound', () => ({
    default: () => {
      throw new Error('page exploded')
    },
  }))
  try {
    const { render: renderWithBrokenPage } = await import('./entry-server')
    await expect(renderWithBrokenPage('/missing')).rejects.toThrow('page exploded')
  } finally {
    vi.doUnmock('@/pages/NotFound')
    vi.resetModules()
  }
})
