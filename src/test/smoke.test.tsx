import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'
import { ROUTER_FUTURE } from '@/routes'

it(
  'renders the home route',
  async () => {
    render(
      <MemoryRouter initialEntries={['/']} future={ROUTER_FUTURE}>
        <App />
      </MemoryRouter>,
    )
    // Both the inner findBy* timeout and this test's own (the third
    // argument to `it`) are raised above their 1000ms/5000ms defaults:
    // the full run renders every public route through real SSR in
    // entry-server.test.tsx, and under that concurrent load the Landing
    // chunk's dynamic import can take longer than either default to
    // settle even though nothing is actually stuck. Both need raising —
    // an outer test timeout past its default gives the inner wait
    // nowhere to spend that extra time if it stays at the default.
    expect(await screen.findByRole('main', {}, { timeout: 15_000 })).toBeInTheDocument()
  },
  20_000,
)
