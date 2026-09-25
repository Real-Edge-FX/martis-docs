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
import test, { after } from 'node:test'
import { createRequestListener, resolveRequest } from './serve-dist.mjs'

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-dist-test-'))
fs.writeFileSync(path.join(root, 'index.html'), '<!doctype html><title>Home</title>')
fs.mkdirSync(path.join(root, 'for-agencies'))
fs.writeFileSync(path.join(root, 'for-agencies', 'index.html'), '<!doctype html><title>For Agencies</title>')
fs.writeFileSync(path.join(root, '404.html'), '<!doctype html><title>Not found</title>')
fs.mkdirSync(path.join(root, 'assets'))
fs.writeFileSync(path.join(root, 'assets', 'app.css'), 'body{color:red}')

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

after(() => {
  fs.rmSync(root, { recursive: true, force: true })
  console.log('serve-dist.mjs validated.')
})
