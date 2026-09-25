// @vitest-environment node
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { loadPackagistStats, loadReleaseManifest, formatCount, formatVersion } from '@/lib/generated-data'
import { DOC_NAV } from '@/lib/docs-tree'
import { serializeMeta } from '@/lib/seo'
import { getRouteMeta, PUBLIC_ROUTES } from '@/lib/site-routes'
import { assertConsoleSilent } from '@/test/assert-console-silent'
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
  // Node 21+ defines a minimal `navigator` global (e.g. `navigator.userAgent`
  // reads "Node.js/24"). Stub it away for every SSR test: without this, a
  // render-time `navigator` read would pass this "no browser globals"
  // guarantee here and only mismatch later, on hydration, where a real
  // browser's navigator has different values.
  vi.stubGlobal('navigator', undefined)
})
afterEach(() => {
  // The navigator stub has no recorded calls to lose, so it can be torn
  // down up front; assertConsoleSilent (src/test/assert-console-silent.ts)
  // handles the spies, where the ordering actually matters.
  vi.unstubAllGlobals()
  assertConsoleSilent(consoleSpies)
})

it('does not see a Node-provided navigator global (SSR must not read browser globals)', () => {
  expect(globalThis.navigator).toBeUndefined()
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
    expect(firstHeading(html)).toBe('Lost in the docs.')
  })

  it('renders an unknown docs slug identically to any other unknown URL', async () => {
    // Apache serves the same static dist/404.html for every unmatched
    // path, including one under /docs/: the markup for all three must
    // be byte-identical, or the client hydrates over different server
    // HTML than what was actually served (React hydration errors #418
    // and #422).
    const notFound = await render('/404')
    expect((await render('/docs/does-not-exist')).html).toBe(notFound.html)
    expect((await render('/no/such/page')).html).toBe(notFound.html)
  })

  it('ignores the query string and hash when resolving the route', async () => {
    const { html, head, status } = await render('/docs/getting-started/installation?ref=newsletter#requirements')
    expect(status).toBe(200)
    expect(head).toBe(serializeMeta(getRouteMeta('/docs/getting-started/installation')))
    expect(firstHeading(html)).toBe(mdxHeading('getting-started/installation'))
  })

  it.each(['/PRODUCT', '/Docs', '/Docs/getting-started/installation', '/docs/Getting-Started/Installation'])(
    'matches routes case-sensitively, like getRouteMeta and the files on disk: %s is a 404',
    async (url) => {
      const notFound = await render('/404')
      const { html, head, status } = await render(url)
      expect(status).toBe(404)
      expect(head).toBe(notFound.head)
      expect(html).toBe(notFound.html)
    },
  )

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

describe('the homepage without JavaScript', () => {
  // The prerendered `/` is the finished page (Phase 1 inherited criterion
  // in the master plan): nothing may start transparent, hidden or moved
  // off-screen waiting for an animation that only runs after hydration.
  it('renders nothing hidden, transparent or transformed', async () => {
    const { html } = await render('/')
    const main = /<main\b[\s\S]*<\/main>/.exec(html)?.[0] ?? ''
    expect(main).not.toBe('')
    expect(main).not.toMatch(/opacity:\s*0(?![.\d])/)
    expect(main).not.toMatch(/visibility:\s*hidden/)
    expect(main).not.toMatch(/transform:/)
    expect(main).not.toMatch(/\shidden(=|\s|>)/)
  })

  it('shows the real generated release and download figures', async () => {
    const { html } = await render('/')
    const release = loadReleaseManifest()
    const stats = loadPackagistStats()
    for (const value of [formatVersion(release.version), formatCount(release.totalTests), formatCount(stats.total)]) {
      expect(html).toContain(`<span class="proof-strip__value">${value}</span>`)
    }
    expect(html).not.toContain('Data temporarily unavailable')
  })

  it('carries the approved headline and licence seal in the server HTML', async () => {
    const { html } = await render('/')
    expect(firstHeading(html)).toBe('The admin foundation your agency can ship again.')
    expect(html.match(/MIT licensed · No paid tier/g)?.length).toBeGreaterThanOrEqual(2)
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

// Every route, because the registries it guards (site-routes.ts and
// routes.tsx) can drift for any one of them. The "Loading…" and U+0000
// checks over the same HTML run in `pnpm smoke:dist` (checkRoute in
// scripts/smoke-dist.mjs), against the files that actually ship.
it(
  'renders every public route with its own page and status',
  async () => {
    const notFound = await render('/404')
    for (const route of PUBLIC_ROUTES) {
      const { html, status } = await render(route)
      expect(status, route).toBe(route === '/404' ? 404 : 200)
      expect(html, route).toContain('<main')
      // A route the router does not know renders the 404 page with a 200
      // head: the registries in site-routes.ts and routes.tsx disagree.
      if (route !== '/404') expect(html === notFound.html, `${route} renders the 404 page`).toBe(false)
    }
  },
  // Vitest's 5000ms default is tight for a real SSR render of every
  // public route under the load of the rest of the suite. 20s matches
  // RENDER_TIMEOUT_MS in src/entry-server.tsx, and applies to this test
  // only, so a hang anywhere else still fails fast.
  20_000,
)

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

it('rejects within the timeout when a lazy import never resolves, instead of hanging', async () => {
  vi.resetModules()
  // A page whose dynamic import never settles: no throw, no resolve.
  // Without a timeout, `render` would wait for it forever.
  vi.doMock('@/pages/NotFound', () => new Promise(() => {}))
  try {
    const { render: renderWithHangingPage } = await import('./entry-server')
    await expect(renderWithHangingPage('/missing', 50)).rejects.toThrow(/did not complete within 50ms/)
  } finally {
    vi.doUnmock('@/pages/NotFound')
    vi.resetModules()
  }
})

it("rejects within the timeout when a docs page's MDX import never settles, instead of hanging", async () => {
  vi.resetModules()
  // `render`'s *first* await — loadInitialDocument, before renderToHtml
  // even starts — has its own path to a hang: mock one slug's MDX import
  // to never settle. The test above only exercises the lazy-*page*-import
  // path (`/missing` is a 404, so it never reaches loadMdx at all); this
  // one proves the initial-document stage is inside the same budget.
  vi.doMock('@/lib/mdx-loader', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/mdx-loader')>()
    return {
      ...actual,
      loadMdx: (slug: string) => (slug === 'core/fields' ? new Promise<never>(() => {}) : actual.loadMdx(slug)),
    }
  })
  try {
    const { render: renderWithHangingMdx } = await import('./entry-server')
    await expect(renderWithHangingMdx('/docs/core/fields', 50)).rejects.toThrow(
      /loading the initial document did not complete within 50ms/,
    )
  } finally {
    vi.doUnmock('@/lib/mdx-loader')
    vi.resetModules()
  }
})
