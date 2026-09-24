import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { ROUTER_FUTURE } from '@/routes'

it('renders the home route', async () => {
  render(
    <MemoryRouter initialEntries={['/']} future={ROUTER_FUTURE}>
      <App />
    </MemoryRouter>,
  )
  // The default findBy* timeout (1000ms) is tight for this suite: the
  // full run renders every public route through real SSR in
  // entry-server.test.tsx, and under that concurrent load the Landing
  // chunk's dynamic import can take longer than 1000ms to settle even
  // though nothing is actually stuck.
  expect(await screen.findByRole('main', {}, { timeout: 5000 })).toBeInTheDocument()
})
