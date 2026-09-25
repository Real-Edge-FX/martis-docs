import { describe, expect, it } from 'vitest'
import { getRouteMeta, PUBLIC_ROUTES } from './site-routes'

describe('site route registry', () => {
  it('contains every required marketing route exactly once', () => {
    expect(PUBLIC_ROUTES).toEqual(expect.arrayContaining([
      '/',
      '/product',
      '/for-agencies',
      '/compare',
      '/compare/nova',
      '/compare/filament',
      '/docs',
      '/changelog',
      '/404',
    ]))
    expect(new Set(PUBLIC_ROUTES).size).toBe(PUBLIC_ROUTES.length)
  })

  it('returns route-specific canonical metadata', () => {
    expect(getRouteMeta('/for-agencies')).toMatchObject({
      canonical: 'https://getmartis.com/for-agencies',
      title: expect.stringContaining('Agencies'),
    })
  })

  it('marks unknown routes as non-indexable', () => {
    expect(getRouteMeta('/missing')).toMatchObject({
      path: '/404',
      noIndex: true,
    })
  })
})
