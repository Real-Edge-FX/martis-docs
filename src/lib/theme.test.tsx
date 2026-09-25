import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThemeProvider, ThemeToggle, useTheme } from './theme'

function ThemeProbe() {
  const { resolvedTheme } = useTheme()
  return <output data-testid="theme">{resolvedTheme}</output>
}

describe('documentation theme', () => {
  it('changes and persists an explicit light preference', async () => {
    localStorage.setItem('martis-theme', 'dark')
    render(<ThemeProvider><ThemeProbe /><ThemeToggle /></ThemeProvider>)
    await userEvent.click(screen.getByRole('button', { name: 'Use light theme' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(localStorage.getItem('martis-theme')).toBe('light')
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })
})
