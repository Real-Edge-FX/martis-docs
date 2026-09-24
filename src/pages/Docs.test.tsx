import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { App } from '@/App'
import { loadMdx } from '@/lib/mdx-loader'
import { loadInitialDocument, RenderProvider } from '@/lib/render-context'

vi.mock('@/lib/mdx-loader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/mdx-loader')>()
  return { ...actual, loadMdx: vi.fn(actual.loadMdx) }
})

/** Buttons that drive client-side navigation, standing in for sidebar links. */
function Navigator() {
  const navigate = useNavigate()
  return (
    <>
      <button type="button" onClick={() => navigate('/docs/getting-started/quick-start')}>
        Open Quick Start
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Go back
      </button>
    </>
  )
}

/** Waits until the on-this-page TOC lists `heading`, so its deferred harvest lands inside the test. */
async function waitForToc(heading: string) {
  // One link wraps the article heading, the other is the TOC entry.
  await waitFor(() => expect(screen.getAllByRole('link', { name: heading })).toHaveLength(2))
}

describe('DocPage', () => {
  let consoleError: MockInstance
  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error')
  })
  afterEach(() => {
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('renders the initial document without importing it and imports later pages on navigation', async () => {
    const initialDocument = await loadInitialDocument('/docs/getting-started/installation')
    vi.mocked(loadMdx).mockClear()

    render(
      <MemoryRouter initialEntries={['/docs/getting-started/installation']}>
        <RenderProvider initialDocument={initialDocument}>
          <App />
          <Navigator />
        </RenderProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Installation Guide' })).toBeInTheDocument()
    await waitForToc('Requirements')
    expect(loadMdx).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Open Quick Start' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Quick Start' })).toBeInTheDocument()
    await waitForToc('1. Generate the model and migration')
    expect(loadMdx).toHaveBeenCalledWith('getting-started/quick-start')

    // Back on the initial page, the module comes from context again, in the
    // same render as the navigation: no import, no loading state.
    fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Installation Guide' })).toBeInTheDocument()
    await waitForToc('Requirements')
    expect(loadMdx).not.toHaveBeenCalledWith('getting-started/installation')
  })
})
