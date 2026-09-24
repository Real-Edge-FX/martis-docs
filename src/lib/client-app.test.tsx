import { act } from '@testing-library/react'
import { readFile } from 'node:fs/promises'
import { hydrateRoot } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { FIXTURE_PATH, HYDRATION_URLS } from '@/test/hydration-fixture.mjs'
import { prepareClientApp } from './client-app'

// There is no automated proof, elsewhere in this suite, that the client
// actually reuses the server-rendered markup instead of silently
// re-rendering over it (which would still "work" today because nothing
// diffs the two): this file is that proof. For each URL it takes the real
// server HTML (the same `render()` the SSR entry and the prerender script
// use — pre-rendered once by src/test/ssr-global-setup.mjs; see that file
// for why this cannot simply call `render()` here), drops it into a #root
// container exactly as the static HTML shell does, then hydrates it with
// the exact tree `entry-client.tsx` builds (`prepareClientApp`, extracted
// so this test cannot drift from what the real client does) and checks
// hydration was a no-op: no recoverable error, no console error, and the
// server's own <main> element survives as the same DOM node.

interface SsrResult {
  html: string
  head: string
  status: number
}

let serverResults: Record<(typeof HYDRATION_URLS)[number], SsrResult>

beforeAll(async () => {
  serverResults = JSON.parse(await readFile(FIXTURE_PATH, 'utf8'))
})

let consoleError: MockInstance

beforeEach(() => {
  consoleError = vi.spyOn(console, 'error')
})

afterEach(() => {
  consoleError.mockRestore()
  document.body.innerHTML = ''
})

describe('client hydration reuses the server markup', () => {
  it.each(HYDRATION_URLS)('hydrates %s without discarding the server-rendered <main>', async (url) => {
    const { html } = serverResults[url]

    const container = document.createElement('div')
    container.id = 'root'
    container.innerHTML = html
    document.body.appendChild(container)

    const serverMain = container.querySelector('main')
    expect(serverMain, 'server HTML must contain a <main>').not.toBeNull()

    window.history.pushState({}, '', url)
    const app = await prepareClientApp(window.location.pathname)

    const onRecoverableError = vi.fn()
    await act(async () => {
      hydrateRoot(container, app, { onRecoverableError })
    })

    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(consoleError).not.toHaveBeenCalled()
    // Same node, not merely equivalent markup: a mismatch makes React
    // discard and replace the boundary with a freshly client-rendered one.
    expect(container.querySelector('main')).toBe(serverMain)
  })
})
