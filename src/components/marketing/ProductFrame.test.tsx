import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProductFrame } from './ProductFrame'

describe('ProductFrame', () => {
  it('renders the release-versioned product screenshot inside a browser frame', () => {
    // React 18 warns on the camelCase `fetchPriority` prop; the attribute
    // must be set without any console error (SSR and hydration fail on one).
    const consoleError = vi.spyOn(console, 'error')
    render(
      <ProductFrame
        src="/screenshots/dashboard.png"
        alt="Martis dashboard"
        width={1280}
        height={800}
        version="v1.39.1"
        priority
      />,
    )
    const img = screen.getByRole('img', { name: 'Martis dashboard' })
    expect(img).toHaveAttribute('loading', 'eager')
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
    expect(img).toHaveAttribute('fetchpriority', 'high')
    expect(screen.getByText('v1.39.1')).toBeInTheDocument()
  })

  it('lazy-loads when not marked as the priority hero frame', () => {
    render(<ProductFrame src="/screenshots/dashboard.png" alt="Martis dashboard" width={1280} height={800} version="v1.39.1" />)
    expect(screen.getByRole('img', { name: 'Martis dashboard' })).toHaveAttribute('loading', 'lazy')
  })
})
