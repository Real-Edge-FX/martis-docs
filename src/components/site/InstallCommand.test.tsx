import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InstallCommand } from './InstallCommand'

describe('InstallCommand', () => {
  it('renders the command as selectable text, usable without JavaScript', () => {
    render(<InstallCommand command="composer require martis/martis" />)
    const code = screen.getByText('composer require martis/martis')
    expect(code.tagName).toBe('CODE')
  })

  it('copies the install command and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallCommand command="composer require martis/martis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    expect(writeText).toHaveBeenCalledWith('composer require martis/martis')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('copies the install command and exposes a manual fallback', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'))
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallCommand command="composer require martis/martis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    expect(screen.getByText('Select and copy the command')).toBeInTheDocument()
  })

  it('exposes the status announcement politely for assistive tech', () => {
    render(<InstallCommand command="composer require martis/martis" />)
    const status = screen.getByRole('status', { hidden: true })
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})
