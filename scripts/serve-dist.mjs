// Production-like static server for `dist/`, used by the Playwright E2E
// suite (playwright.config.ts's `webServer`) and available for manual
// checks (`node scripts/serve-dist.mjs [dist] [port]`).
//
// `vite preview` cannot stand in for this: its SPA fallback serves
// `index.html` for every unknown path, including a slash-less route like
// `/for-agencies`, so a client-only render would hide a route that the real
// static host (public/.htaccess) answers with the route's own prerendered
// `index.html`. This server mirrors that host instead: a route resolves to
// `<route>/index.html`, a directory URL with a trailing slash redirects to
// its slash-less form (301), and an unknown path is answered with
// `dist/404.html` and HTTP 404, never a fallback to the app shell.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

// Text assets are gzipped when the client sends `Accept-Encoding: gzip`,
// matching the compression a real Apache/LiteSpeed host applies to text
// responses by default (mod_deflate/LiteSpeed's built-in compression;
// see public/.htaccess). Skipping this here would make the Lighthouse CI
// performance budget (lighthouserc.cjs, which serves through this same
// script) measure an artificially heavier, uncompressed transfer than
// production actually ships.
const COMPRESSIBLE_EXTENSIONS = new Set(['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt'])

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
}

/**
 * Resolves `pathname` under `root` to the file (or redirect/404) the
 * production host would serve, as `{ status, file, location }`:
 * - `location` set (and `status` 301): the pathname is a directory URL
 *   with a trailing slash; redirect to its slash-less form.
 * - `file` set and `status` 200: serve that file as-is.
 * - `file` set and `status` 404: no matching file; serve `dist/404.html`
 *   with a 404 status (or a plain-text 404 if even that is missing).
 *
 * Exported so the unit test can check routing decisions directly,
 * against a small fixture tree, without going through a live socket.
 */
export function resolveRequest(root, pathname) {
  let file = path.join(root, pathname)
  // `file.startsWith(root)` is not enough: a sibling directory that merely
  // shares `root`'s name as a *prefix* (`<root>-secret`) also starts with
  // the string `root`, so `/../<root-basename>-secret/x` walked straight
  // past it. `path.relative` instead answers "how do you get from root to
  // file": escaping the tree always starts that answer with `..`.
  const relative = path.relative(root, file)
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return { status: 403, file: null, location: null }
  }

  const isDir = fs.existsSync(file) && fs.statSync(file).isDirectory()
  if (isDir && pathname.length > 1 && pathname.endsWith('/')) {
    return { status: 301, file: null, location: pathname.slice(0, -1) }
  }
  if (isDir) {
    file = path.join(file, 'index.html')
  }

  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    return { status: 200, file, location: null }
  }

  const notFound = path.join(root, '404.html')
  if (fs.existsSync(notFound)) {
    return { status: 404, file: notFound, location: null }
  }
  return { status: 404, file: null, location: null }
}

/** Builds the `http.createServer` request listener for `root` (an absolute
 *  path to a built `dist/` directory). Kept separate from `listen()` so the
 *  unit test can drive it on an ephemeral port. */
export function createRequestListener(root) {
  return (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')

    let pathname
    try {
      pathname = decodeURIComponent(url.pathname)
    } catch {
      // Malformed percent-encoding (e.g. `GET /%E0%A4%A`, a cut-off
      // multi-byte escape) makes `decodeURIComponent` throw a `URIError`
      // synchronously. Uncaught, that escapes this request listener and
      // crashes the whole process — which is also the Playwright
      // `webServer`, so one bad request takes the entire E2E run down
      // with it. It is a client protocol error, not ours: answer 400.
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      res.end('Bad request')
      return
    }

    const resolved = resolveRequest(root, pathname)

    if (resolved.status === 301) {
      res.writeHead(301, { Location: resolved.location + url.search })
      res.end()
      return
    }
    if (resolved.status === 403) {
      res.writeHead(403)
      res.end()
      return
    }
    if (!resolved.file) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }

    const ext = path.extname(resolved.file)
    const acceptsGzip = (req.headers['accept-encoding'] ?? '').includes('gzip')
    const shouldCompress = acceptsGzip && COMPRESSIBLE_EXTENSIONS.has(ext)

    // A stream can still fail after `resolveRequest` found the file (it
    // was removed or became unreadable between the `existsSync` check and
    // the actual open, a bad symlink, a disk error): left unhandled, the
    // stream's 'error' event throws and crashes the process the same way
    // a bad decode would. Headers are deferred to the stream's 'open'
    // event instead of written eagerly, so on error (which fires instead
    // of 'open' when the file cannot be opened) nothing has been sent yet
    // and this can still answer 500; once headers are sent, the best this
    // can do is end the response without a body.
    const failResponse = () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Internal server error')
      } else {
        res.destroy()
      }
    }

    const source = fs.createReadStream(resolved.file)
    source.on('error', failResponse)
    source.once('open', () => {
      res.writeHead(resolved.status, {
        'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream',
        ...(shouldCompress ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
      })
    })

    if (shouldCompress) {
      const gzip = zlib.createGzip()
      gzip.on('error', failResponse)
      source.pipe(gzip).pipe(res)
    } else {
      source.pipe(res)
    }
  }
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isEntryPoint) {
  const root = path.resolve(process.argv[2] ?? 'dist')
  const port = Number(process.argv[3] ?? process.env.PORT ?? 4180)
  http
    .createServer(createRequestListener(root))
    .listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`))
}
