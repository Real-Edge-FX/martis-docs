import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONTACT_PROMPT_KEY } from '@/lib/contact-prompt'
import { ContactPrompt } from './ContactPrompt'

let navigate: (to: string) => void = () => {}
function NavigationProbe() {
  navigate = useNavigate()
  return null
}

function renderPrompt(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><NavigationProbe /><ContactPrompt delay={1000} /></MemoryRouter>)
}

describe('ContactPrompt', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('opens after the delay and records the day', () => {
    renderPrompt('/product')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.getByRole('dialog', { name: 'Any questions about Martis?' })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem(CONTACT_PROMPT_KEY) ?? '{}').lastShown).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('closes with the close button and with Escape', () => {
    renderPrompt('/')
    act(() => { vi.advanceTimersByTime(1000) })
    act(() => { screen.getByRole('button', { name: 'Close contact form' }).click() })
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open twice on the same day', () => {
    renderPrompt('/').unmount()
    act(() => { vi.advanceTimersByTime(1000) })
    const second = renderPrompt('/')
    act(() => { vi.advanceTimersByTime(1000) })
    second.unmount()
    renderPrompt('/')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('waits until the visitor leaves the contact page', () => {
    renderPrompt('/contact')
    act(() => { vi.advanceTimersByTime(1000) })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    act(() => { navigate('/docs') })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
