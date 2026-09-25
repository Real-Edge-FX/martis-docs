import { waitFor } from '@testing-library/react'
import { expect, it } from 'vitest'
import { renderRoute } from '@/test/render-route'

it('updates title, description and canonical for the active route', async () => {
  renderRoute('/for-agencies')
  await waitFor(() => expect(document.title).toBe('For Laravel Agencies · Martis'))
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://getmartis.com/for-agencies')
  expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', 'A repeatable admin foundation for client delivery.')
})
