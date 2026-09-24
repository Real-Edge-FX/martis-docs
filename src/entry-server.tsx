import { PassThrough } from 'node:stream'
import { text } from 'node:stream/consumers'
import type { ReactNode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { parsePath } from 'react-router-dom'
import { StaticRouter } from 'react-router-dom/server'
import { App } from '@/App'
import { loadInitialDocument, RenderProvider } from '@/lib/render-context'
import { serializeMeta } from '@/lib/seo'
import { getRouteMeta, NOT_FOUND_META } from '@/lib/site-routes'
import { ROUTER_FUTURE } from '@/routes'

// The static prerender script (scripts/prerender.mjs) drives the whole
// build from the compiled SSR bundle, so it needs more than `render`:
// re-exporting these here means that Node script only ever imports
// `dist-ssr/entry-server.js`, never a TypeScript source file directly.
export { PUBLIC_ROUTES, getRouteMeta, SITE_URL } from '@/lib/site-routes'

export interface RenderResult {
  /** Markup for `#root`, with every lazy page resolved. */
  html: string
  /** The route's `<head>` tags, from `serializeMeta`. */
  head: string
  /** 404 for the not-found page (unknown paths and `/404`), 200 otherwise. */
  status: number
}

/** Default time budget for one `render()` call — a single deadline for
 *  every stage it awaits (loading the initial MDX document, then the
 *  full SSR render), not a separate budget per stage. Without it, a page
 *  or import that never resolves would hang the prerender build forever.
 *  Exported so a focused test can pass a much shorter budget instead of
 *  waiting it out. */
export const RENDER_TIMEOUT_MS = 20_000

/**
 * Renders one URL of the site to static HTML: the markup the client
 * hydrates, the route's head tags and its HTTP status. The query string
 * and hash reach the router but not the metadata lookup. `timeoutMs` is
 * one budget for the whole call: loading the initial document and then
 * rendering both draw from the same deadline, so a stall in either one
 * rejects with a clear error naming the URL and the stage, instead of
 * only the second stage being guarded.
 */
export async function render(url: string, timeoutMs = RENDER_TIMEOUT_MS): Promise<RenderResult> {
  const pathname = parsePath(url).pathname || '/'
  const meta = getRouteMeta(pathname)
  const deadline = Date.now() + timeoutMs

  const initialDocument = await withDeadline(
    loadInitialDocument(pathname),
    deadline,
    `render(${JSON.stringify(url)}): loading the initial document did not complete within ${timeoutMs}ms`,
  )

  const html = await renderToHtml(
    <StaticRouter location={url} future={ROUTER_FUTURE}>
      <RenderProvider initialDocument={initialDocument}>
        <App />
      </RenderProvider>
    </StaticRouter>,
    deadline,
    `render(${JSON.stringify(url)}): render did not complete within ${timeoutMs}ms`,
  )

  return { html, head: serializeMeta(meta), status: meta === NOT_FOUND_META ? 404 : 200 }
}

/** Rejects with `new Error(message)` if `promise` has not settled by
 *  `deadline` (a `Date.now()`-style absolute timestamp); otherwise
 *  settles the same way `promise` does. Generic on purpose: it is what
 *  keeps every stage `render()` awaits inside one shared budget, rather
 *  than each stage getting its own fresh `timeoutMs`. */
function withDeadline<T>(promise: Promise<T>, deadline: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), Math.max(0, deadline - Date.now()))
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

/**
 * Renders `element` to a string once every Suspense boundary has resolved,
 * so the lazy pages appear instead of their loading fallback. Any render
 * error rejects: a prerendered page must never ship a fallback that only
 * the client could fill in.
 *
 * Guards against a render that never settles (a lazy import stuck
 * forever): once `deadline` passes, it aborts the stream and rejects with
 * `timeoutMessage` instead of hanging. `abort()` re-invokes `onError` for
 * every boundary still pending, so `fail` must be (and is) idempotent
 * past the first call — including the stream-read failure below, which
 * is routed through the same `fail` rather than rejecting directly, so
 * every failure path clears the timer and aborts exactly once.
 */
function renderToHtml(element: ReactNode, deadline: number, timeoutMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let failed = false
    const fail = (error: unknown) => {
      if (failed) return
      failed = true
      clearTimeout(timer)
      abort(error)
      reject(error)
    }

    const timer = setTimeout(() => {
      fail(new Error(timeoutMessage))
    }, Math.max(0, deadline - Date.now()))

    const { pipe, abort } = renderToPipeableStream(element, {
      onShellError: fail,
      onError: fail,
      onAllReady() {
        if (failed) return
        clearTimeout(timer)
        const sink = new PassThrough()
        text(sink).then((html) => resolve(stripNulPadding(html)), fail)
        pipe(sink)
      },
    })
  })
}

/**
 * React 18.3's Node stream writer pads a chunk with NUL bytes whenever a
 * multi-byte character does not fit in the rest of its 2 KB buffer: it
 * flushes the whole buffer instead of only the bytes written. U+0000 is
 * never valid in HTML, so dropping it restores the exact markup.
 */
function stripNulPadding(html: string): string {
  return html.replaceAll('\u0000', '')
}
