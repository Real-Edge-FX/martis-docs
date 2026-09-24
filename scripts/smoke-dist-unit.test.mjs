// Unit tests for the pure pieces of scripts/smoke-dist.mjs: functions
// that take a string (or array) and return an array of failure
// messages, so each failing case is exercised directly instead of only
// through a real `pnpm build` + `pnpm smoke:dist`. scripts/smoke-dist.mjs
// itself is the artifact-level check over the real dist/; this one is
// unit-level, and needs no build to run (see that file's header comment).
//
// Run via `pnpm test:prerender` (never picked up by Vitest: see
// scripts/prerender-unit.test.mjs for why scripts/** is excluded).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  checkAssetsHtaccess,
  checkHtaccess,
  checkRobots,
  checkRoute,
  checkSearchIndex,
  checkSiteImages,
  checkSitemap,
  countMainTags,
  extractAssetReferences,
  extractCanonicalLinks,
  extractHeadSection,
  extractHrefSrcValues,
  extractModuleScriptSrcs,
  extractTitle,
  findForbiddenStrings,
  findMissingRequiredRoutes,
  hasMetaDescription,
  hasRobotsNoindex,
  hasStaleMarkers,
  missingOpenGraphTags,
  REQUIRED_ROUTES,
  rootHasContent,
  stripHrefSrcAttributeValues,
} from './smoke-dist.mjs'

// A realistic clean page, close to what prerender.mjs actually
// produces, so checkRoute()'s happy path is exercised against
// something representative rather than a minimal fixture.
const OK_META = {
  path: '/product',
  title: 'Product · Martis',
  description: 'Model, operate and ship.',
  canonical: 'https://getmartis.com/product',
  image: 'https://getmartis.com/social/product.png',
}

function okHtml({ canonical = OK_META.canonical, noIndex = false } = {}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <title>Product · Martis</title>
    <meta name="description" content="Model, operate and ship." />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:title" content="Product · Martis" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="https://getmartis.com/social/product.png" />
    ${noIndex ? '<meta name="robots" content="noindex" />' : ''}
    <script type="module" crossorigin src="/assets/index-abc123.js"></script>
    <link rel="stylesheet" href="/assets/index-abc123.css">
  </head>
  <body>
    <div id="root"><!--$--><main class="flex-1"><h1>Product</h1></main><!--/$--></div>
  </body>
</html>`
}

test('checkRoute reports no failures for a clean page', () => {
  assert.deepEqual(checkRoute('/product', okHtml(), OK_META), [])
})

test('checkRoute fails when <main> is missing', () => {
  const html = okHtml().replace('<main class="flex-1"><h1>Product</h1></main>', '<div>no main here</div>')
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('exactly one <main>, found 0')))
})

test('checkRoute fails when <main> appears twice', () => {
  const html = okHtml().replace('<main class="flex-1"><h1>Product</h1></main>', '<main></main><main></main>')
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('exactly one <main>, found 2')))
})

test('checkRoute fails on an empty or missing <title>', () => {
  const html = okHtml().replace('<title>Product · Martis</title>', '<title></title>')
  assert.ok(checkRoute('/product', html, OK_META).includes('missing or empty <title>'))
})

test('checkRoute fails when the description meta tag is missing', () => {
  const html = okHtml().replace('<meta name="description" content="Model, operate and ship." />', '')
  assert.ok(checkRoute('/product', html, OK_META).includes('missing <meta name="description"> in <head>'))
})

test('checkRoute does not count a description tag that only exists in the body', () => {
  const html = okHtml()
    .replace('<meta name="description" content="Model, operate and ship." />', '')
    .replace('<h1>Product</h1>', '<h1>Product</h1><meta name="description" content="stray, from the body" />')
  assert.ok(checkRoute('/product', html, OK_META).includes('missing <meta name="description"> in <head>'))
})

test('checkRoute fails when the canonical link is missing', () => {
  const html = okHtml().replace('<link rel="canonical" href="https://getmartis.com/product" />', '')
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('exactly one canonical link, found 0')))
})

test('checkRoute fails when two canonical links are present', () => {
  const html = okHtml().replace(
    '<link rel="canonical" href="https://getmartis.com/product" />',
    '<link rel="canonical" href="https://getmartis.com/product" /><link rel="canonical" href="https://getmartis.com/dup" />',
  )
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('exactly one canonical link, found 2')))
})

test('checkRoute fails when a second canonical link is in the body, not just in <head>', () => {
  // The duplicate check is whole-document on purpose: a stray second
  // canonical anywhere is still wrong, even outside <head>.
  const html = okHtml().replace(
    '<h1>Product</h1>',
    '<h1>Product</h1><link rel="canonical" href="https://getmartis.com/dup-in-body" />',
  )
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('exactly one canonical link, found 2')))
})

test('checkRoute does not count a canonical link that only exists in the body', () => {
  const html = okHtml()
    .replace('<link rel="canonical" href="https://getmartis.com/product" />', '')
    .replace('<h1>Product</h1>', '<h1>Product</h1><link rel="canonical" href="https://getmartis.com/product" />')
  assert.ok(checkRoute('/product', html, OK_META).includes('canonical link is not in <head>'))
})

test('checkRoute fails when the canonical does not match getRouteMeta', () => {
  const html = okHtml({ canonical: 'https://getmartis.com/wrong' })
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('canonical is "https://getmartis.com/wrong"')))
})

test('checkRoute fails when an Open Graph tag is missing', () => {
  const html = okHtml().replace('<meta property="og:image" content="https://getmartis.com/social/product.png" />', '')
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('missing Open Graph tag(s) in <head>: og:image')))
})

test('checkRoute does not count an Open Graph tag that only exists in the body', () => {
  const html = okHtml()
    .replace('<meta property="og:image" content="https://getmartis.com/social/product.png" />', '')
    .replace(
      '<h1>Product</h1>',
      '<h1>Product</h1><meta property="og:image" content="https://getmartis.com/social/product.png" />',
    )
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('missing Open Graph tag(s) in <head>: og:image')))
})

test('checkRoute fails when #root has no rendered content', () => {
  const html = okHtml().replace(
    '<div id="root"><!--$--><main class="flex-1"><h1>Product</h1></main><!--/$--></div>',
    '<div id="root"></div>',
  )
  assert.ok(checkRoute('/product', html, OK_META).includes('#root has no rendered content'))
})

test('checkRoute fails when there is no module script under /assets/', () => {
  const html = okHtml().replace('<script type="module" crossorigin src="/assets/index-abc123.js"></script>', '')
  assert.ok(checkRoute('/product', html, OK_META).includes('no <script type="module"> served from /assets/'))
})

test('checkRoute fails on a leftover template marker', () => {
  const html = `${okHtml()}<!--app-head-->`
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('leftover')))
})

test('checkRoute fails when a non-404 route is marked noindex', () => {
  const html = okHtml({ noIndex: true })
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('unexpected') && f.includes('noindex')))
})

test('checkRoute fails when the 404 route is missing noindex', () => {
  const failures = checkRoute('/404', okHtml(), { ...OK_META, noIndex: true })
  assert.ok(failures.some((f) => f.includes('missing') && f.includes('noindex')))
})

test('checkRoute requires noindex on /404 even if the route metadata wrongly omits it', () => {
  // The /404 requirement does not trust meta.noIndex alone: a registry
  // mistake (noIndex missing/false for the 404 entry) must not let a
  // 404 page that is genuinely missing the tag pass silently.
  const failures = checkRoute('/404', okHtml(), { ...OK_META, noIndex: false })
  assert.ok(failures.some((f) => f.includes('missing') && f.includes('noindex')))
})

test('checkRoute passes noindex on the 404 route when present', () => {
  const html = okHtml({ noIndex: true })
  assert.deepEqual(checkRoute('/404', html, { ...OK_META, noIndex: true }), [])
})

test('checkRoute ignores a noindex tag that only exists in the body', () => {
  // A <meta name="robots"> outside <head> has no effect for a real
  // browser or crawler either, so a body-only one must not count as
  // "present" — and must not falsely trigger "unexpected" on a normal
  // route, since the page's real (head) metadata has none.
  const html = okHtml().replace(
    '<h1>Product</h1>',
    '<h1>Product</h1><meta name="robots" content="noindex" />',
  )
  assert.deepEqual(checkRoute('/product', html, OK_META), [])
})

test('checkRoute fails when the head contains a local hostname', () => {
  const html = okHtml().replace(
    'https://getmartis.com/social/product.png',
    'http://localhost:5173/social/product.png',
  )
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('<head> contains localhost')))
})

test('checkRoute reports a forbidden host inside a head href only once', () => {
  // Before de-duplication, a bad href in <head> was reported twice:
  // once by the <head>-text scan (which sees the raw href="...") and
  // once by the href/src-attribute scan. Only the more precise
  // href/src message should survive. Uses an extra, unrelated <link>
  // (not the canonical/OG tags) so this is the only forbidden-host
  // failure in play.
  const html = okHtml().replace(
    '</head>',
    '    <link rel="alternate" href="http://localhost/product" />\n  </head>',
  )
  const localhostFailures = checkRoute('/product', html, OK_META).filter((f) => f.includes('localhost'))
  assert.equal(localhostFailures.length, 1)
  assert.ok(localhostFailures[0].includes('href/src attribute'))
})

test('checkRoute fails when an href attribute contains a machine path', () => {
  const html = okHtml().replace('<div id="root">', '<div id="root"><a href="/Users/me/file">x</a>')
  assert.ok(checkRoute('/product', html, OK_META).some((f) => f.includes('/Users/')))
})

test('checkRoute does not flag localhost mentioned in body text (not an attribute)', () => {
  const html = okHtml().replace('<h1>Product</h1>', '<h1>Product</h1><p>Run curl http://localhost:8000</p>')
  assert.deepEqual(checkRoute('/product', html, OK_META), [])
})

// --- small pure helpers, spot-checked individually ---

test('countMainTags ignores tag names that merely start with "main"', () => {
  assert.equal(countMainTags('<main-panel></main-panel>'), 0)
})

test('extractTitle trims whitespace and treats blank text as missing', () => {
  assert.equal(extractTitle('<title>  Product  </title>'), 'Product')
  assert.equal(extractTitle('<title>   </title>'), null)
  assert.equal(extractTitle('<html></html>'), null)
})

test('hasMetaDescription requires non-empty content', () => {
  assert.equal(hasMetaDescription('<meta name="description" content="x" />'), true)
  assert.equal(hasMetaDescription('<meta name="description" content="" />'), false)
})

test('extractCanonicalLinks returns every canonical href found', () => {
  assert.deepEqual(
    extractCanonicalLinks('<link rel="canonical" href="/a" /><link rel="canonical" href="/b" />'),
    ['/a', '/b'],
  )
})

test('missingOpenGraphTags reports only the properties that are absent', () => {
  const html = '<meta property="og:title" content="T" /><meta property="og:url" content="U" />'
  assert.deepEqual(missingOpenGraphTags(html), ['og:image'])
})

test('rootHasContent ignores React SSR boundary comments around real markup', () => {
  assert.equal(rootHasContent('<div id="root"><!--$--><p>hi</p><!--/$--></div>'), true)
})

test('rootHasContent is false for an empty root div', () => {
  assert.equal(rootHasContent('<div id="root"></div>'), false)
  assert.equal(rootHasContent('<html><div id="root"></div></html>'), false)
})

test('rootHasContent is false when there is no #root at all', () => {
  assert.equal(rootHasContent('<html><body>no root here</body></html>'), false)
})

test('extractModuleScriptSrcs only matches type="module" scripts', () => {
  const html = '<script src="/assets/a.js"></script><script type="module" src="/assets/b.js"></script>'
  assert.deepEqual(extractModuleScriptSrcs(html), ['/assets/b.js'])
})

test('extractModuleScriptSrcs matches regardless of attribute order', () => {
  // Real build output puts type="module" before src, but nothing
  // guarantees that order — the check must not depend on it.
  const html = '<script src="/assets/reordered.js" type="module" crossorigin></script>'
  assert.deepEqual(extractModuleScriptSrcs(html), ['/assets/reordered.js'])
})

test('stripHrefSrcAttributeValues removes href/src attribute values but leaves surrounding text intact', () => {
  assert.equal(
    stripHrefSrcAttributeValues('<link rel="canonical" href="http://localhost/x"><title>Hi</title>'),
    '<link rel="canonical" ><title>Hi</title>',
  )
})

test('extractAssetReferences collects both href and src under /assets/, nothing else', () => {
  const html = '<link href="/assets/a.css"><script src="/assets/b.js"></script><img src="/brand/x.png">'
  assert.deepEqual(extractAssetReferences(html), ['/assets/a.css', '/assets/b.js'])
})

test('hasStaleMarkers detects either leftover template marker', () => {
  assert.equal(hasStaleMarkers('<!--app-head-->'), true)
  assert.equal(hasStaleMarkers('<!--app-html-->'), true)
  assert.equal(hasStaleMarkers('<p>ok</p>'), false)
})

test('hasRobotsNoindex requires the exact meta tag', () => {
  assert.equal(hasRobotsNoindex('<meta name="robots" content="noindex" />'), true)
  assert.equal(hasRobotsNoindex('<meta name="robots" content="index" />'), false)
})

test('extractHeadSection returns only what is between <head> and </head>', () => {
  assert.equal(extractHeadSection('<html><head>X</head><body>Y</body></html>'), 'X')
  assert.equal(extractHeadSection('<html><body>Y</body></html>'), '')
})

test('extractHrefSrcValues returns every href/src attribute value in document order', () => {
  assert.deepEqual(extractHrefSrcValues('<a href="/x"><img src="/y.png">'), ['/x', '/y.png'])
})

test('findForbiddenStrings names every local host/path pattern it matches', () => {
  assert.deepEqual(findForbiddenStrings('see http://localhost:3000'), ['localhost'])
  assert.deepEqual(findForbiddenStrings('http://127.0.0.1/x'), ['127.0.0.1'])
  assert.deepEqual(findForbiddenStrings('bind 0.0.0.0'), ['0.0.0.0'])
  assert.deepEqual(findForbiddenStrings('http://192.168.1.20/'), ['a private 192.168.x.x address'])
  assert.deepEqual(findForbiddenStrings('http://10.0.0.5/'), ['a private 10.x.x.x address'])
  assert.deepEqual(findForbiddenStrings('/Users/me/project'), ['a /Users/ machine path'])
  assert.deepEqual(findForbiddenStrings('https://getmartis.com/product'), [])
})

test('findForbiddenStrings does not flag a three-component version number starting with 10', () => {
  // Must contain a real "10." prefix (unlike the old fixture, which had
  // no "10." substring at all and so passed even with the pattern
  // deleted) so this genuinely exercises the 4-component requirement.
  assert.deepEqual(findForbiddenStrings('Laravel 10.48.2 on PHP 8.3.10'), [])
})

test('findForbiddenStrings does flag a real 10.x.x.x dotted quad', () => {
  // The counterpart to the test above: every *four*-component 10.x
  // address must still be flagged — this is not a blanket exemption
  // for anything starting with "10.".
  assert.deepEqual(findForbiddenStrings('proxied through 10.20.30.40 internally'), ['a private 10.x.x.x address'])
})

test('findMissingRequiredRoutes reports required routes absent from the given list', () => {
  const routes = REQUIRED_ROUTES.filter((route) => route !== '/changelog')
  assert.deepEqual(findMissingRequiredRoutes(routes), ['/changelog'])
})

test('findMissingRequiredRoutes returns [] once every required route is present', () => {
  assert.deepEqual(findMissingRequiredRoutes(REQUIRED_ROUTES), [])
})

// --- search-index.json / sitemap.xml / robots.txt / .htaccess ---

test('checkSearchIndex rejects invalid JSON', () => {
  assert.ok(checkSearchIndex('{not json').some((f) => f.includes('not valid JSON')))
})

test('checkSearchIndex rejects an empty entries array', () => {
  assert.deepEqual(checkSearchIndex(JSON.stringify({ version: 1, entries: [] })), ['search-index.json has no entries'])
})

test('checkSearchIndex passes a populated index', () => {
  assert.deepEqual(checkSearchIndex(JSON.stringify({ version: 1, entries: [{ slug: 'x' }] })), [])
})

test('checkSitemap reports a missing route and an unexpected extra route', () => {
  const xml =
    '<urlset><url><loc>https://getmartis.com/</loc></url><url><loc>https://getmartis.com/extra</loc></url></urlset>'
  const failures = checkSitemap(xml, ['https://getmartis.com/', 'https://getmartis.com/product'])
  assert.ok(failures.some((f) => f.includes('missing') && f.includes('/product')))
  assert.ok(failures.some((f) => f.includes('unexpected') && f.includes('/extra')))
})

test('checkSitemap reports duplicate loc entries', () => {
  const xml = '<urlset><url><loc>https://getmartis.com/</loc></url><url><loc>https://getmartis.com/</loc></url></urlset>'
  const failures = checkSitemap(xml, ['https://getmartis.com/'])
  assert.ok(failures.some((f) => f.includes('duplicate')))
})

test('checkSitemap passes when the loc set exactly matches', () => {
  const xml =
    '<urlset><url><loc>https://getmartis.com/</loc></url><url><loc>https://getmartis.com/product</loc></url></urlset>'
  assert.deepEqual(checkSitemap(xml, ['https://getmartis.com/', 'https://getmartis.com/product']), [])
})

test('checkSitemap flags a local host leaking into a <loc>', () => {
  const xml = '<urlset><url><loc>http://localhost/product</loc></url></urlset>'
  const failures = checkSitemap(xml, ['http://localhost/product'])
  assert.ok(failures.some((f) => f.includes('localhost')))
})

test('checkRobots passes when Sitemap: matches the site URL exactly', () => {
  assert.deepEqual(checkRobots('User-agent: *\nSitemap: https://getmartis.com/sitemap.xml\n', 'https://getmartis.com'), [])
})

test('checkRobots fails when there is no Sitemap: line', () => {
  assert.ok(checkRobots('User-agent: *\n', 'https://getmartis.com').some((f) => f.includes('no Sitemap:')))
})

test('checkRobots fails when Sitemap: points at the wrong host', () => {
  const failures = checkRobots('Sitemap: http://localhost/sitemap.xml\n', 'https://getmartis.com')
  assert.ok(failures.some((f) => f.includes('Sitemap: is')))
  assert.ok(failures.some((f) => f.includes('localhost')))
})

test('checkHtaccess requires the ErrorDocument 404 directive', () => {
  assert.ok(checkHtaccess('RewriteEngine On\n').some((f) => f.includes('ErrorDocument 404')))
})

const CLEAN_HTACCESS = [
  'DirectorySlash Off',
  'ErrorDocument 404 /404.html',
  'RewriteCond %{REQUEST_FILENAME} !-f',
  'RewriteCond %{REQUEST_FILENAME}/index.html -f',
  'RewriteRule ^(.*[^/])$ $1/index.html [L]',
  'Header set Cache-Control "public, max-age=3600"',
].join('\n')

test('checkHtaccess passes a clean, prerendered-site config', () => {
  assert.deepEqual(checkHtaccess(CLEAN_HTACCESS), [])
})

test('checkHtaccess rejects every catch-all rewrite back to /index.html', () => {
  for (const rule of [
    'RewriteRule . /index.html [L]',
    'RewriteRule .* /index.html [L]',
    'RewriteRule ^(.*)$ /index.html [L]',
    'RewriteRule ^ index.html [L]',
    '  RewriteRule "^.*$" "/index.html" [QSA,L]',
  ]) {
    const failures = checkHtaccess(`${CLEAN_HTACCESS}\n${rule}\n`)
    assert.ok(failures.some((f) => f.includes('catch-all')), rule)
  }
})

test('checkHtaccess rejects a FallbackResource (the other way to spell an SPA fallback)', () => {
  const failures = checkHtaccess(`${CLEAN_HTACCESS}\nFallbackResource /index.html\n`)
  assert.ok(failures.some((f) => f.includes('FallbackResource')))
})

test('checkHtaccess ignores directives that only appear in comments', () => {
  const text = `${CLEAN_HTACCESS}\n# RewriteRule . /index.html [L]\n  # FallbackResource /index.html\n`
  assert.deepEqual(checkHtaccess(text), [])
})

test('checkHtaccess requires DirectorySlash Off', () => {
  const failures = checkHtaccess(CLEAN_HTACCESS.replace('DirectorySlash Off', ''))
  assert.ok(failures.some((f) => f.includes('DirectorySlash Off')))
})

test('checkHtaccess requires the rewrite that serves a slash-less route from its index.html', () => {
  const failures = checkHtaccess(CLEAN_HTACCESS.replace('RewriteRule ^(.*[^/])$ $1/index.html [L]', ''))
  assert.ok(failures.some((f) => f.includes('slash-less')))
})

test('checkHtaccess rejects a year-long immutable cache outside /assets/', () => {
  const text = `${CLEAN_HTACCESS}\nHeader set Cache-Control "public, max-age=31536000, immutable"\n`
  assert.ok(checkHtaccess(text).some((f) => f.includes('immutable')))
})

test('checkAssetsHtaccess requires the year-long immutable cache for fingerprinted files', () => {
  assert.deepEqual(checkAssetsHtaccess('Header set Cache-Control "public, max-age=31536000, immutable"\n'), [])
  assert.ok(checkAssetsHtaccess('Header set Cache-Control "public, max-age=3600"\n').length > 0)
  assert.ok(checkAssetsHtaccess('# Header set Cache-Control "public, max-age=31536000, immutable"\n').length > 0)
})

test('the real public/.htaccess and public/assets/.htaccess pass their checks', () => {
  const read = (file) => readFileSync(new URL(`../public/${file}`, import.meta.url), 'utf8')
  assert.deepEqual(checkHtaccess(read('.htaccess')), [])
  assert.deepEqual(checkAssetsHtaccess(read('assets/.htaccess')), [])
})

// --- og:image / twitter:image files ---

test('checkSiteImages reports an og:image and a twitter:image under the site URL with no file in dist/', () => {
  const html = okHtml().replace(
    '</head>',
    '<meta name="twitter:image" content="https://getmartis.com/social/missing.png" />\n</head>',
  )
  const failures = checkSiteImages(html, 'https://getmartis.com', () => false)
  assert.deepEqual(failures, [
    'og:image "https://getmartis.com/social/product.png" has no file in dist/ (/social/product.png)',
    'twitter:image "https://getmartis.com/social/missing.png" has no file in dist/ (/social/missing.png)',
  ])
})

test('checkSiteImages passes when every site image exists, and looks each one up by its path', () => {
  const looked = []
  const failures = checkSiteImages(okHtml(), 'https://getmartis.com', (urlPath) => {
    looked.push(urlPath)
    return true
  })
  assert.deepEqual(failures, [])
  assert.deepEqual(looked, ['/social/product.png'])
})

test('checkSiteImages ignores an image hosted elsewhere and one that only appears in the body', () => {
  const html = okHtml()
    .replace('https://getmartis.com/social/product.png', 'https://cdn.example.com/card.png')
    .replace('<h1>Product</h1>', '<h1>Product</h1><meta property="og:image" content="https://getmartis.com/x.png" />')
  assert.deepEqual(checkSiteImages(html, 'https://getmartis.com', () => false), [])
})
