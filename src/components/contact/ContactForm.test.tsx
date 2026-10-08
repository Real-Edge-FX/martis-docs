import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ContactDeliveryError } from '@/lib/contact'
import { ContactForm } from './ContactForm'

describe('ContactForm', () => {
  it('validates and reports a successful submission', async () => {
    const user = userEvent.setup()
    const submit = vi.fn().mockResolvedValue(undefined)
    render(<MemoryRouter initialEntries={['/contact']}><ContactForm submit={submit} /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: 'Send project details' }))
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Ana Silva')
    await user.type(screen.getByLabelText('Work email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Project context'), 'We deliver several Laravel client platforms.')
    await user.click(screen.getByLabelText(/I agree/i))
    await user.click(screen.getByRole('button', { name: 'Send project details' }))

    expect(await screen.findByText(/Thanks, Ana\./i)).toBeInTheDocument()
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@example.com' }), { source: 'contact-page', page: '/contact' })
  })

  it('sends compact submissions as the prompt and explains rate limiting', async () => {
    const user = userEvent.setup()
    const submit = vi.fn().mockRejectedValue(new ContactDeliveryError('rate_limited'))
    render(<MemoryRouter initialEntries={['/product']}><ContactForm variant="compact" submit={submit} /></MemoryRouter>)
    expect(screen.queryByLabelText('Company (optional)')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Ana')
    await user.type(screen.getByLabelText('Email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Your question'), 'Does it support multi-tenancy?')
    await user.click(screen.getByLabelText(/I agree/i))
    await user.click(screen.getByRole('button', { name: 'Send message' }))

    expect(await screen.findByText(/several messages from you/i)).toBeInTheDocument()
    expect(submit).toHaveBeenCalledWith(expect.anything(), { source: 'prompt', page: '/product' })
  })
})
