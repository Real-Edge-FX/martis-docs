import { waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// entry-client.tsx boots the app as an import-time side effect (it reads
// #root and calls start() as soon as the module evaluates), so every case
// here needs a #root already in the document *before* importing it, and a
// fresh module registry per case so the mock below actually takes effect.
const SERVER_HTML = '<main data-testid="server-html">Server rendered page</main>'

describe('entry-client boot', () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="root">${SERVER_HTML}</div>`
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('@/lib/client-app')
    vi.resetModules()
    document.body.innerHTML = ''
  })

  it('logs a clear console.error and leaves the server HTML in place when start() rejects', async () => {
    vi.doMock('@/lib/client-app', () => ({
      prepareClientApp: () => Promise.reject(new Error('stale chunk: failed to fetch dynamically imported module')),
    }))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await import('./entry-client')

    await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1))
    const [message, error] = consoleError.mock.calls[0]
    expect(message).toMatch(/failed to start/i)
    expect(error).toBeInstanceOf(Error)

    // Neither unmounted nor replaced: the server markup is exactly what it was.
    expect(document.getElementById('root')?.innerHTML).toBe(SERVER_HTML)
  })
})
