import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'

export function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>)
}
