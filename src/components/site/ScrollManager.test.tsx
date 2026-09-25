import { render } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ScrollManager } from './ScrollManager'

function NavigateTo({ to }: { to: string }) {
  const navigate = useNavigate()
  useEffect(() => navigate(to), [navigate, to])
  return null
}

describe('ScrollManager', () => {
  it('restores the top when the pathname changes', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    render(<MemoryRouter initialEntries={['/product']}><ScrollManager /><NavigateTo to="/compare/filament" /></MemoryRouter>)
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' })
  })

  it('does not override anchor navigation', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    render(<MemoryRouter initialEntries={['/product#ship']}><ScrollManager /></MemoryRouter>)
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
