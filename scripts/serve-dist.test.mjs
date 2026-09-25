// Unit test for scripts/serve-dist.mjs, the static server the Playwright
// E2E suite runs `dist/` through (see playwright.config.ts). Builds a
// small fixture tree under a temp directory instead of depending on a real
// `pnpm build` output, so it runs standalone as part of `pnpm
// test:prerender`.
import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PassThrough } from 'node:stream'
import test, { after } from 'node:test'
import zlib from 'node:zlib'
import { createRequestListener, resolveRequest } from './serve-dist.mjs'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-dist-test-'))
fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>Home</title>')
fs.mkdirSync(path.join(root, 'for-agencies'))
fs.writeFileSync(path.join(root, 'for-agencies', 'index.html'), '<!doctype html><title>For Agencies</title>')
fs.writeFileSync(path.join(root, '404.html'), '<!doctype html><title>Not found</title>')
fs.mkdirSync(path.join(root, 'assets'))
fs.writeFileSync(path.join(root, 'assets', 'app.css'), 'body{color:red}')
// A binary, non-compressible asset: real bytes (not just an extension),
// so a broken gzip branch that recompressed it would corrupt the file
// (a `Buffer.equal` check below would fail) rather than merely tagging
// it wrong.
const PNG_BYTES = Buffer.from('89504e470d0a1a0a0000000d4948445200000001000000010806000000', 'hex')
fs.writeFileSync(path.join(root, 'assets', 'pixel.png'), PNG_BYTES)

// A sibling directory that merely shares `root`'s basename as a string
// *prefix* (`<root>-secret` starts with `<root>`), to reproduce the
// `file.startsWith(root)` escape: `/../<root-basename>-secret/secret.txt`
// resolves outside `root` but used to pass the old, string-only check.
const siblingRoot = `${root}-secret`
fs.mkdirSync(siblingRoot)
fs.writeFileSync(path.join(siblingRoot, 'secret.txt'), 'top secret')

test('resolveRequest serves a route directory’s index.html for its slash-less URL', () => {
  const resolved = resolveRequest(root, '/for-agencies')
  assert.equal(resolved.status, 200)
  assert.equal(resolved.file, path.join(root, 'for-agencies', 'index.html'))
})

test('resolveRequest redirects a route’s trailing-slash URL to its slash-less form', () => {
  const resolved = resolveRequest(root, '/for-agencies/')
  assert.equal(resolved.status, 301)
  assert.equal(resolved.location, '/for-agencies')
})

test('resolveRequest answers an unknown path with 404.html and HTTP 404, no SPA fallback', () => {
  const resolved = resolveRequest(root, '/does-not-exist')
  assert.equal(resolved.status, 404)
  assert.equal(resolved.file, path.join(root, '404.html'))
})

test('resolveRequest serves a static asset by its own content type', () => {
  const resolved = resolveRequest(root, '/assets/app.css')
  assert.equal(resolved.status, 200)
  assert.equal(resolved.file, path.join(root, 'assets', 'app.css'))
})

test('resolveRequest refuses a path that escapes the root', () => {
  const resolved = resolveRequest(root, '/../../etc/passwd')
  assert.equal(resolved.status, 403)
})

test('resolveRequest refuses a sibling directory that only shares root as a string prefix', () => {
  // Reproduces the reported escape directly against resolveRequest, the
  // way it must be reproduced: through createRequestListener, the
  // `new URL(req.url, 'http://localhost')` call already collapses a
  // leading `/../` in the path (there's nothing above `/` to go to), so
  // an actual HTTP request never reaches resolveRequest with a raw `..`
  // segment in the first place. The bug (and the fix) live entirely in
  // resolveRequest's own handling of whatever pathname it is given.
  const pathname = `/../${path.basename(siblingRoot)}/secret.txt`
  const resolved = resolveRequest(root, pathname)
  assert.equal(resolved.status, 403)
  assert.equal(resolved.file, null)
})

test('the live server never SPA-falls-back an unknown route to index.html', async () => {
  const server = http.createServer(createRequestListener(root))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  try {
    const home = await fetch(`http://127.0.0.1:${port}/`)
    assert.equal(home.status, 200)
    assert.match(await home.text(), /Home/)

    const route = await fetch(`http://127.0.0.1:${port}/for-agencies`)
    assert.equal(route.status, 200)
    assert.match(await route.text(), /For Agencies/)

    const trailingSlash = await fetch(`http://127.0.0.1:${port}/for-agencies/`, { redirect: 'manual' })
    assert.equal(trailingSlash.status, 301)
    assert.equal(trailingSlash.headers.get('location'), '/for-agencies')

    const missing = await fetch(`http://127.0.0.1:${port}/nope`)
    assert.equal(missing.status, 404)
    assert.match(await missing.text(), /Not found/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('a malformed percent-encoded path answers 400 instead of crashing the server', async () => {
  const server = http.createServer(createRequestListener(root))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  try {
    // A truncated multi-byte escape (`%E0%A4%A` is missing its last
    // hex digit): `decodeURIComponent` throws a `URIError` on it.
    const malformed = await fetch(`http://127.0.0.1:${port}/%E0%A4%A`)
    assert.equal(malformed.status, 400)

    // The server (and the process it runs in) must still be alive and
    // answering normal requests after that.
    const home = await fetch(`http://127.0.0.1:${port}/`)
    assert.equal(home.status, 200)
    assert.match(await home.text(), /Home/)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('a read error on the underlying file stream answers 500 instead of crashing the server', async () => {
  const server = http.createServer(createRequestListener(root))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  const originalCreateReadStream = fs.createReadStream
  fs.createReadStream = () => {
    // Stands in for a file removed, made unreadable, or otherwise
    // failing between resolveRequest's existsSync check and the actual
    // open: a stream that errors instead of opening.
    const stream = new PassThrough()
    queueMicrotask(() => stream.destroy(new Error('simulated read failure')))
    return stream
  }

  try {
    const response = await fetch(`http://127.0.0.1:${port}/`)
    assert.equal(response.status, 500)

    // The process (and this server) must still be alive afterwards.
    fs.createReadStream = originalCreateReadStream
    const home = await fetch(`http://127.0.0.1:${port}/`)
    assert.equal(home.status, 200)
  } finally {
    fs.createReadStream = originalCreateReadStream
    await new Promise((resolve) => server.close(resolve))
  }
})

/** Issues a raw HTTP GET with an explicit `Accept-Encoding` header and
 *  resolves with `{ status, headers, body }` (`body` as a `Buffer`,
 *  never transparently decompressed) — unlike the global `fetch`, which
 *  negotiates its own `Accept-Encoding` and auto-decodes the body, so it
 *  cannot tell this suite whether compression actually happened or
 *  distinguish "not compressed" from "compressed, then decoded back to
 *  the same bytes". */
function rawGet(port, pathname, acceptEncoding) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { host: '127.0.0.1', port, path: pathname, headers: acceptEncoding ? { 'Accept-Encoding': acceptEncoding } : {} },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
        res.on('error', reject)
      },
    )
    req.on('error', reject)
  })
}

test('a text asset is gzipped when the client sends Accept-Encoding: gzip', async () => {
  const server = http.createServer(createRequestListener(root))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  try {
    const compressed = await rawGet(port, '/assets/app.css', 'gzip')
    assert.equal(compressed.headers['content-encoding'], 'gzip')
    assert.equal(compressed.headers['vary'], 'Accept-Encoding')
    // The wire bytes are gzip, not the original CSS text; decoding them
    // recovers the exact source (round-trips through zlib, not just
    // "the header says gzip").
    assert.notEqual(compressed.body.toString('utf8'), 'body{color:red}')
    assert.equal(zlib.gunzipSync(compressed.body).toString('utf8'), 'body{color:red}')

    const uncompressed = await rawGet(port, '/assets/app.css', 'identity')
    assert.equal(uncompressed.headers['content-encoding'], undefined)
    assert.equal(uncompressed.body.toString('utf8'), 'body{color:red}')
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

test('an already-compressed image is served as-is, never gzipped again', async () => {
  const server = http.createServer(createRequestListener(root))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()

  try {
    const response = await rawGet(port, '/assets/pixel.png', 'gzip')
    assert.equal(response.headers['content-encoding'], undefined)
    assert.equal(response.headers['content-type'], 'image/png')
    // Exact original bytes, not merely "still a valid PNG": a
    // recompress-then-serve-uncompressed bug could still corrupt them.
    assert.ok(response.body.equals(PNG_BYTES))
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})

after(() => {
  fs.rmSync(siblingRoot, { recursive: true, force: true })
  fs.rmSync(root, { recursive: true, force: true })
  console.log('serve-dist.mjs validated.')
})
