import { screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderRoute } from '@/test/render-route'

it('offers task-oriented journeys on the docs index', async () => {
  renderRoute('/docs')
  expect(await screen.findByRole('heading', { level: 1, name: 'Build with Martis.' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /Install Martis/i }).some((link) => link.getAttribute('href') === '/docs/getting-started/installation')).toBe(true)
  expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument()
})
