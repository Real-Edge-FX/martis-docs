// Unit tests for the pure pieces of scripts/prerender.mjs: the parts
// that do not depend on a real render() call, so they exercise the
// fail-closed branches (a missing template marker, a non-200 status,
// XML escaping) directly instead of only indirectly through a full
// `pnpm build`. scripts/prerender.test.mjs stays the artifact-level
// smoke test over dist/; this one is unit-level.
//
// Run via `pnpm test:prerender` (never picked up by Vitest:
// vitest.config.ts excludes scripts/** from test discovery).
import assert from 'node:assert/strict'
import test from 'node:test'
import { assertOk, buildRobots, buildSitemap, escapeXml, injectPage, outputPathFor } from './prerender.mjs'

test('injectPage replaces both markers with the given head and html', () => {
  const template = '<head><!--app-head--></head><body><!--app-html--></body>'
  const page = injectPage(template, '<title>T</title>', '<main>ok</main>')
  assert.equal(page, '<head><title>T</title></head><body><main>ok</main></body>')
})

test('injectPage uses replacer functions, not replacement-string expansion', () => {
  // A naive template.replace(marker, html) would expand "$&"/"$1" in html
  // as special replacement patterns; the docs contain PHP and regex
  // samples with exactly that syntax, so the replacement must not do this.
  const template = '<!--app-head--><!--app-html-->'
  const page = injectPage(template, '$&', '$1 costs $&')
  assert.equal(page, '$&$1 costs $&')
})

test('injectPage throws when the head marker is missing', () => {
  assert.throws(
    () => injectPage('<body><!--app-html--></body>', 'head', 'html', 'dist/index.html'),
    /dist\/index\.html is missing/,
  )
})

test('injectPage throws when the html marker is missing', () => {
  assert.throws(
    () => injectPage('<head><!--app-head--></head>', 'head', 'html', 'dist/index.html'),
    /dist\/index\.html is missing/,
  )
})

test('assertOk does not throw for a real route rendered at 200', () => {
  assert.doesNotThrow(() => assertOk('/product', 200))
})

test('assertOk does not throw for /404 rendered at 404', () => {
  assert.doesNotThrow(() => assertOk('/404', 404))
})

test('assertOk throws, naming the route and status, when a real route is not 200', () => {
  assert.throws(() => assertOk('/product', 500), /"\/product".*500/)
})

test('outputPathFor maps / and /404 specially, everything else to <route>/index.html', () => {
  assert.equal(outputPathFor('/', 'dist'), 'dist/index.html')
  assert.equal(outputPathFor('/404', 'dist'), 'dist/404.html')
  assert.equal(outputPathFor('/product', 'dist'), 'dist/product/index.html')
  assert.equal(outputPathFor('/docs/core/fields', 'dist'), 'dist/docs/core/fields/index.html')
})

test('buildSitemap skips /404 and noIndex routes, keeps the rest', () => {
  const meta = {
    '/': { canonical: 'https://getmartis.com/', noIndex: false },
    '/404': { canonical: 'https://getmartis.com/404', noIndex: true },
    '/draft': { canonical: 'https://getmartis.com/draft', noIndex: true },
    '/docs': { canonical: 'https://getmartis.com/docs', noIndex: false },
  }
  const xml = buildSitemap(Object.keys(meta), (route) => meta[route])
  assert.match(xml, /<\?xml version="1\.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<loc>https:\/\/getmartis\.com\/<\/loc>/)
  assert.match(xml, /<loc>https:\/\/getmartis\.com\/docs<\/loc>/)
  assert.doesNotMatch(xml, /\/404/)
  assert.doesNotMatch(xml, /draft/)
})

test('buildSitemap XML-escapes the canonical URL', () => {
  const xml = buildSitemap(['/x'], () => ({
    canonical: 'https://getmartis.com/x?a=1&b=2<3>\'"',
    noIndex: false,
  }))
  assert.match(xml, /<loc>https:\/\/getmartis\.com\/x\?a=1&amp;b=2&lt;3&gt;&apos;&quot;<\/loc>/)
})

test('buildRobots allows everything and points Sitemap at <siteUrl>/sitemap.xml', () => {
  assert.equal(
    buildRobots('https://getmartis.com'),
    'User-agent: *\nAllow: /\n\nSitemap: https://getmartis.com/sitemap.xml\n',
  )
})

test('escapeXml escapes all five XML-sensitive characters', () => {
  assert.equal(escapeXml(`&<>"'`), '&amp;&lt;&gt;&quot;&apos;')
})
