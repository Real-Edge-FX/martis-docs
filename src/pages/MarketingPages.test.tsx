import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoute } from '@/test/render-route'

describe('marketing routes', () => {
  it('positions Martis for agencies on the homepage', async () => {
    renderRoute('/')
    expect(await screen.findByRole('heading', {
      level: 1,
      name: 'The admin foundation your agency can ship again.',
    })).toBeInTheDocument()
    expect(screen.getAllByText('MIT licensed · No paid tier').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Install Martis' })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ href: expect.stringContaining('/docs/getting-started/installation') }),
      ]),
    )
  })

  it('renders the six product chapters', async () => {
    renderRoute('/product')
    expect(await screen.findByRole('heading', { level: 1, name: /One foundation/i })).toBeInTheDocument()
    for (const name of ['Model', 'Operate', 'Secure', 'Adapt', 'Extend', 'Ship']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument()
    }
  })

  it('explains the repeatable agency delivery cycle', async () => {
    renderRoute('/for-agencies')
    expect(await screen.findByRole('heading', { level: 1, name: /Build a baseline once/i })).toBeInTheDocument()
    expect(screen.getByText('Baseline')).toBeInTheDocument()
    expect(screen.getByText('Reuse')).toBeInTheDocument()
  })

  it('offers explicit Nova and Filament comparisons', async () => {
    renderRoute('/compare')
    expect(await screen.findByRole('heading', { level: 1, name: /Choose the foundation/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Compare with Nova/i })).toHaveAttribute('href', '/compare/nova')
    expect(screen.getByRole('link', { name: /Compare with Filament/i })).toHaveAttribute('href', '/compare/filament')
    expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(11)
    expect(document.querySelector('a[href*="nova.laravel.com"]')).not.toBeInTheDocument()
    expect(document.querySelector('a[href*="filamentphp.com"]')).not.toBeInTheDocument()
  })

  it('renders a local changelog route', async () => {
    renderRoute('/changelog')
    expect(await screen.findByRole('heading', { level: 1, name: 'Changelog' })).toBeInTheDocument()
  })
})
