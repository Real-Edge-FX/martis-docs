import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { getRouteMeta } from '@/lib/site-routes'
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
      <MemoryRouter initialEntries={['/product']}>
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
      <MemoryRouter initialEntries={['/product']}>
        <DocumentMeta />
      </MemoryRouter>,
    )
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    first.unmount()

    render(
      <MemoryRouter initialEntries={['/this-route-does-not-exist']}>
        <DocumentMeta />
      </MemoryRouter>,
    )
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex')
  })
})
