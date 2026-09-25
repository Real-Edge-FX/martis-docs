import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ContactForm } from './ContactForm'

describe('ContactForm', () => {
  it('validates and reports a successful submission', async () => {
    const user = userEvent.setup()
    const submit = vi.fn().mockResolvedValue(undefined)
    render(<ContactForm submit={submit} />)
    await user.click(screen.getByRole('button', { name: 'Send project details' }))
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Name'), 'Ana')
    await user.type(screen.getByLabelText('Work email'), 'ana@example.com')
    await user.type(screen.getByLabelText('Project context'), 'We deliver several Laravel client platforms.')
    await user.click(screen.getByLabelText(/I agree/i))
    await user.click(screen.getByRole('button', { name: 'Send project details' }))

    expect(await screen.findByText(/Thanks, Ana/i)).toBeInTheDocument()
    expect(submit).toHaveBeenCalledTimes(1)
  })
})
