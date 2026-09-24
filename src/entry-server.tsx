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

export interface RenderResult {
  /** Markup for `#root`, with every lazy page resolved. */
  html: string
  /** The route's `<head>` tags, from `serializeMeta`. */
  head: string
  /** 404 for the not-found page (unknown paths and `/404`), 200 otherwise. */
  status: number
}

/**
 * Renders one URL of the site to static HTML: the markup the client
 * hydrates, the route's head tags and its HTTP status. The query string
 * and hash reach the router but not the metadata lookup.
 */
export async function render(url: string): Promise<RenderResult> {
  const pathname = parsePath(url).pathname || '/'
  const meta = getRouteMeta(pathname)
  const initialDocument = await loadInitialDocument(pathname)

  const html = await renderToHtml(
    <StaticRouter location={url}>
      <RenderProvider initialDocument={initialDocument}>
        <App />
      </RenderProvider>
    </StaticRouter>,
  )

  return { html, head: serializeMeta(meta), status: meta === NOT_FOUND_META ? 404 : 200 }
}

/**
 * Renders `element` to a string once every Suspense boundary has resolved,
 * so the lazy pages appear instead of their loading fallback. Any render
 * error rejects: a prerendered page must never ship a fallback that only
 * the client could fill in.
 */
function renderToHtml(element: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    let failed = false
    const fail = (error: unknown) => {
      failed = true
      reject(error)
    }

    const { pipe } = renderToPipeableStream(element, {
      onShellError: fail,
      onError: fail,
      onAllReady() {
        if (failed) return
        const sink = new PassThrough()
        text(sink).then((html) => resolve(stripNulPadding(html)), reject)
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
