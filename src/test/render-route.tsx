import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { ROUTER_FUTURE } from '@/routes'

export function renderRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>
      <App />
    </MemoryRouter>,
  )
}
