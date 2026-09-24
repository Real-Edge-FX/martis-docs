import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CmdK } from '@/components/CmdK'
import { searchFullText, type SearchHit } from '@/lib/search'
import { ROUTER_FUTURE } from '@/routes'

// `STATIC_INDEX`/`searchStatic` are replaced with empty results so every
// hit rendered in these tests comes from the mocked `searchFullText`
// debounce path under test — nothing here depends on real doc content.
vi.mock('@/lib/search', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/search')>()
  return {
    ...actual,
    STATIC_INDEX: [],
    searchStatic: vi.fn(() => []),
    searchFullText: vi.fn(),
  }
})

const searchFullTextMock = vi.mocked(searchFullText)

const PLACEHOLDER = 'Search docs, fields, commands…'
const DEBOUNCE_MS = 120

function hit(title: string): SearchHit {
  return {
    group: 'Docs',
    title,
    desc: '',
    href: `/docs/${title.toLowerCase().replace(/\s+/g, '-')}`,
    icon: 'Hash',
    source: 'pagefind',
  }
}

/** A promise whose resolution the test controls explicitly, so a mocked
 * request can be held "in flight" for as long as a scenario needs. */
function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function renderPalette() {
  render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <CmdK open onClose={() => {}} />
    </MemoryRouter>,
  )
  return screen.getByPlaceholderText(PLACEHOLDER)
}

async function flushDebounce() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS)
  })
}

describe('CmdK full-text debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    searchFullTextMock.mockReset()
    searchFullTextMock.mockImplementation(async (q: string) => {
      if (q === 'alpha') return [hit('Alpha result')]
      if (q === 'beta') return [hit('Beta result')]
      return []
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // Control: the containment case a broader fix could accidentally break.
  it('shows the current query full-text hit once its debounce resolves', async () => {
    const input = renderPalette()

    fireEvent.change(input, { target: { value: 'alpha' } })
    // Nothing has arrived yet — the debounce has not elapsed.
    expect(screen.queryByText('Alpha result')).not.toBeInTheDocument()

    await flushDebounce()
    expect(screen.getByText('Alpha result')).toBeInTheDocument()
  })

  // The route the reviewer named: clear, then type a new query.
  it('drops a previous query full-text hit after the query is cleared and a new one is typed', async () => {
    const input = renderPalette()

    fireEvent.change(input, { target: { value: 'alpha' } })
    await flushDebounce()
    expect(screen.getByText('Alpha result')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: '' } })
    fireEvent.change(input, { target: { value: 'beta' } })

    // Before beta's own debounce resolves, alpha's stale hit must be gone.
    expect(screen.queryByText('Alpha result')).not.toBeInTheDocument()

    await flushDebounce()
    expect(screen.getByText('Beta result')).toBeInTheDocument()
    expect(screen.queryByText('Alpha result')).not.toBeInTheDocument()
  })

  // Adjacent route: switching directly between two non-blank queries,
  // with no blank query in between to trigger a naive blank-only reset.
  it('drops a previous query full-text hit when switching directly to a new non-blank query', async () => {
    const input = renderPalette()

    fireEvent.change(input, { target: { value: 'alpha' } })
    await flushDebounce()
    expect(screen.getByText('Alpha result')).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'beta' } })

    // Before beta's own debounce resolves, alpha's stale hit must be gone.
    expect(screen.queryByText('Alpha result')).not.toBeInTheDocument()

    await flushDebounce()
    expect(screen.getByText('Beta result')).toBeInTheDocument()
    expect(screen.queryByText('Alpha result')).not.toBeInTheDocument()
  })

  // A late-resolving request for an abandoned query must not clobber the
  // state of the query the user has since moved on to. Alpha's response
  // is a manually controlled deferred promise so it can be resolved
  // *after* beta's has already landed and rendered — an auto-resolving
  // mock would let beta's write always land last regardless of whether
  // the `cancelled` guard in CmdK.tsx exists, proving nothing.
  it('ignores a stale full-text response that resolves after the query changed again', async () => {
    const alphaResponse = createDeferred<SearchHit[]>()
    searchFullTextMock.mockImplementation(async (q: string) => {
      if (q === 'alpha') return alphaResponse.promise
      if (q === 'beta') return [hit('Beta result')]
      return []
    })

    const input = renderPalette()

    fireEvent.change(input, { target: { value: 'alpha' } })
    // Let alpha's debounce fire, so its request is genuinely in flight —
    // `searchFullText('alpha')` has been called and is awaiting
    // `alphaResponse`, which nothing resolves yet.
    await flushDebounce()

    fireEvent.change(input, { target: { value: 'beta' } })
    await flushDebounce()
    expect(screen.getByText('Beta result')).toBeInTheDocument()

    // Alpha's request finally resolves, long after the query moved on.
    // `advanceTimersByTimeAsync(0)` drains the microtask queue (the mock's
    // own `async` wrapping plus the effect's `.then()`) so the resulting
    // `setFullTextHits` call, if any, has already applied.
    await act(async () => {
      alphaResponse.resolve([hit('Alpha result')])
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(screen.queryByText('Alpha result')).not.toBeInTheDocument()
    expect(screen.getByText('Beta result')).toBeInTheDocument()
  })
})
