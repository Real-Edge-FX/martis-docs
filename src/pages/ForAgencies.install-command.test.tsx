import { screen, within } from '@testing-library/react'
import { vi } from 'vitest'
import { renderRoute } from '@/test/render-route'

// /for-agencies renders the one shared install command (src/data/landing.ts),
// never its own copy of the string: replacing the shared value must change
// what this page shows too.
vi.mock('@/data/landing', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/landing')>()),
  INSTALL_COMMAND: 'composer require example/sentinel',
}))

it(
  'renders the shared INSTALL_COMMAND, not a hand-written copy',
  async () => {
    renderRoute('/for-agencies')
    await screen.findByRole('heading', { level: 1 }, { timeout: 15_000 })
    const main = screen.getByRole('main')
    expect(within(main).getAllByText('composer require example/sentinel').length).toBeGreaterThanOrEqual(1)
    expect(within(main).queryByText('composer require martis/martis')).not.toBeInTheDocument()
  },
  20_000,
)
