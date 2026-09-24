import { expect, it } from 'vitest'
import { DOC_FLAT } from './docs-tree'
import { getRouteMeta, PUBLIC_ROUTES, SITE_URL, type RouteMeta } from './site-routes'

it('contains every required marketing route exactly once', () => {
  expect(PUBLIC_ROUTES).toEqual(expect.arrayContaining([
    '/', '/product', '/for-agencies', '/compare',
    '/compare/nova', '/compare/filament', '/docs', '/changelog', '/404',
  ]))
  expect(new Set(PUBLIC_ROUTES).size).toBe(PUBLIC_ROUTES.length)
})

it('returns route-specific canonical metadata', () => {
  expect(getRouteMeta('/for-agencies')).toMatchObject({
    canonical: 'https://getmartis.com/for-agencies',
    title: expect.stringContaining('Agencies'),
  })
})

it('adds one route per DOC_FLAT entry on top of the nine static routes', () => {
  expect(PUBLIC_ROUTES.length).toBe(9 + DOC_FLAT.length)
  for (const doc of DOC_FLAT) {
    expect(PUBLIC_ROUTES).toContain(`/docs/${doc.slug}`)
  }
})

it('derives metadata for a docs route from DOC_FLAT', () => {
  expect(getRouteMeta('/docs/core/filters')).toEqual<RouteMeta>({
    path: '/docs/core/filters',
    title: 'Filters · Martis docs',
    description: 'Learn about Filters in Martis.',
    canonical: 'https://getmartis.com/docs/core/filters',
    image: 'https://getmartis.com/social/docs.png',
  })
})

it('strips exactly one trailing slash before matching a route', () => {
  expect(getRouteMeta('/product/')).toEqual(getRouteMeta('/product'))
  expect(getRouteMeta('/docs/core/filters/')).toEqual(getRouteMeta('/docs/core/filters'))
  // '/' itself must not be reduced to an empty string.
  expect(getRouteMeta('/').path).toBe('/')
})

it('falls back to the noindex 404 entry for an unknown path', () => {
  const meta = getRouteMeta('/this-route-does-not-exist')
  expect(meta).toEqual(getRouteMeta('/404'))
  expect(meta.noIndex).toBe(true)
})

it('gives every static route non-empty, on-brief metadata', () => {
  const staticPaths = [
    '/', '/product', '/for-agencies', '/compare',
    '/compare/nova', '/compare/filament', '/docs', '/changelog', '/404',
  ]
  for (const path of staticPaths) {
    const meta = getRouteMeta(path)
    expect(meta.title.length).toBeGreaterThan(0)
    expect(meta.description.length).toBeGreaterThan(0)
    expect(meta.description.length).toBeLessThanOrEqual(160)
    expect(meta.canonical).toBe(`${SITE_URL}${path === '/' ? '/' : path}`)
    expect(meta.image).toMatch(new RegExp(`^${SITE_URL}/social/.+\\.png$`))
  }
})

it('marks only the 404 route as noindex', () => {
  expect(getRouteMeta('/404').noIndex).toBe(true)
  for (const path of ['/', '/product', '/for-agencies', '/compare', '/docs', '/changelog']) {
    expect(getRouteMeta(path).noIndex).toBeUndefined()
  }
})

it('avoids repeating the brand for a docs page whose own label already names Martis', () => {
  // src/lib/docs-tree.ts's 'reference/differentials' entry is labeled
  // "Martis differentials": the generic '<label> · Martis docs' / 'Learn
  // about <label> in Martis.' pattern would read "Martis differentials ·
  // Martis docs" / "Learn about Martis differentials in Martis." — the
  // same brand-suffix duplication the static titles are fixed for below,
  // just reached through the docs-derived path instead of a hand-written
  // one.
  expect(getRouteMeta('/docs/reference/differentials')).toEqual<RouteMeta>({
    path: '/docs/reference/differentials',
    title: 'Martis differentials · Docs',
    description: 'Learn about Martis differentials.',
    canonical: 'https://getmartis.com/docs/reference/differentials',
    image: 'https://getmartis.com/social/docs.png',
  })
})

it('never repeats the "Martis" brand name within a single route title or description', () => {
  // e.g. '/compare/nova' must read "Martis vs Laravel Nova", not
  // "Martis vs Laravel Nova · Martis" (the static-title brand suffix
  // duplicating a "Martis" already in the page-specific title). Checked
  // for every docs slug too, not just the nine static routes — that gap
  // (a docs label that already names Martis, e.g. "Martis
  // differentials", still getting the generic "· Martis docs" / "in
  // Martis." suffix) is exactly what the test above pins down for one
  // route; this is the general rule none of them may violate.
  const staticPaths = [
    '/', '/product', '/for-agencies', '/compare',
    '/compare/nova', '/compare/filament', '/docs', '/changelog', '/404',
  ]
  const docsPaths = DOC_FLAT.map((doc) => `/docs/${doc.slug}`)
  for (const path of [...staticPaths, ...docsPaths]) {
    const { title, description } = getRouteMeta(path)
    expect(title.split('Martis').length - 1, `title "${title}" for ${path}`).toBeLessThanOrEqual(1)
    expect(
      description.split('Martis').length - 1,
      `description "${description}" for ${path}`,
    ).toBeLessThanOrEqual(1)
  }
})
