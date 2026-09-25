import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImageLightbox } from './ImageLightbox'

const items = [
  { src: '/one.png', alt: 'First screen', label: 'Clients' },
  { src: '/two.png', alt: 'Second screen', label: 'Dashboard' },
]

describe('ImageLightbox', () => {
  it('supports keyboard navigation and closes with Escape', async () => {
    const user = userEvent.setup()
    const onIndexChange = vi.fn()
    const onClose = vi.fn()
    render(<ImageLightbox items={items} activeIndex={0} onIndexChange={onIndexChange} onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Clients' })).toBeInTheDocument()
    await user.keyboard('{ArrowRight}')
    expect(onIndexChange).toHaveBeenCalledWith(1)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('offers an explicit zoom control', async () => {
    const user = userEvent.setup()
    render(<ImageLightbox items={items} activeIndex={0} onIndexChange={() => undefined} onClose={() => undefined} />)
    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
  })
})
