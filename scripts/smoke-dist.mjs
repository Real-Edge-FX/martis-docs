// Verifies dist/ is a complete, correct static build before it is
// deployed or gated in CI: every public route has its own prerendered
// HTML with real content, title, description, canonical and Open
// Graph tags; every /assets/ file a page references actually exists;
// search-index.json, sitemap.xml, robots.txt and .htaccess agree with
// the route registry; and nothing in the output leaks a local
// hostname or a machine-specific path.
//
// Run after `pnpm build` (or just `pnpm build && pnpm smoke:dist`).
//
// The checks below are pure functions — string/array in, an array of
// human-readable failure messages out (empty means "passed") — and
// exported for scripts/smoke-dist-unit.test.mjs, which covers one
// failing case per check without a real build. Only main() touches
// the filesystem or dist-ssr/entry-server.js (imported lazily inside
// it, not at module scope, for the same reason as prerender.mjs: this
// module must stay importable before dist-ssr/entry-server.js exists).

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DIST, HEAD_MARKER, HTML_MARKER, outputPathFor, ROOT } from './prerender.mjs'

/** Routes that must always exist in PUBLIC_ROUTES: if the route registry
 *  ever drops one of these by accident, that is a regression worth
 *  failing the build over even though the main loop below only checks
 *  whatever PUBLIC_ROUTES actually contains. */
export const REQUIRED_ROUTES = [
  '/',
  '/product',
  '/for-agencies',
  '/compare',
  '/compare/nova',
  '/compare/filament',
  '/docs',
  '/docs/getting-started/installation',
  '/changelog',
  '/404',
]

/** [name, pattern] for every local hostname or machine path a generated
 *  URL must never contain. IPv4 patterns require the full dotted-quad
 *  shape so they do not fire on an unrelated version number like "10.5". */
const FORBIDDEN_PATTERNS = [
  ['localhost', /localhost/i],
  ['127.0.0.1', /127\.0\.0\.1/],
  ['0.0.0.0', /0\.0\.0\.0/],
  ['a private 192.168.x.x address', /\b192\.168\.\d{1,3}\.\d{1,3}\b/],
  ['a private 10.x.x.x address', /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/],
  ['a /Users/ machine path', /\/Users\//],
]

/** Names every forbidden pattern found in `text`, empty when clean. */
export function findForbiddenStrings(text) {
  return FORBIDDEN_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name)
}

/** Required routes missing from `routes` (order of REQUIRED_ROUTES). */
export function findMissingRequiredRoutes(routes, required = REQUIRED_ROUTES) {
  const present = new Set(routes)
  return required.filter((route) => !present.has(route))
}

/** Counts `<main` tag opens; `<main-panel>` or similar custom elements
 *  do not count (the space/`>` boundary excludes them). */
export function countMainTags(html) {
  return (html.match(/<main[\s>]/g) ?? []).length
}

/** The page's <title> text, trimmed; null when missing or blank. */
export function extractTitle(html) {
  const text = /<title>([^<]*)<\/title>/.exec(html)?.[1]?.trim()
  return text ? text : null
}

export function hasMetaDescription(html) {
  return /<meta\s+name="description"\s+content="[^"]+"\s*\/?>/.test(html)
}

/** Every `rel="canonical"` href found, in document order. */
export function extractCanonicalLinks(html) {
  return [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"\s*\/?>/g)].map((m) => m[1])
}

const OG_PROPERTIES = ['og:title', 'og:url', 'og:image']

/** Which of og:title/og:url/og:image are absent (with non-empty content). */
export function missingOpenGraphTags(html) {
  return OG_PROPERTIES.filter(
    (property) => !new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]+"\\s*/?>`).test(html),
  )
}

/** Whether #root wraps real rendered markup rather than being empty.
 *  Strips React's SSR boundary comments (`<!--$-->`/`<!--/$-->`) before
 *  checking, so a page whose only content is an empty Suspense
 *  boundary is still correctly reported as empty. */
export function rootHasContent(html) {
  const after = /<div id="root">([\s\S]*)/.exec(html)?.[1]
  if (after === undefined) return false
  const stripped = after.replace(/<!--\$-->|<!--\/\$-->/g, '').trimStart()
  return stripped.length > 0 && !stripped.startsWith('</div>')
}

/** src of every `<script type="module">`, in document order. Checks
 *  `type="module"` and `src="..."` independently within each opening
 *  tag, so it matches regardless of which attribute comes first. */
export function extractModuleScriptSrcs(html) {
  const srcs = []
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    if (!/\btype="module"/.test(tag)) continue
    const src = /\bsrc="([^"]*)"/.exec(tag)?.[1]
    if (src) srcs.push(src)
  }
  return srcs
}

/** Every /assets/ path referenced by an href or src attribute. */
export function extractAssetReferences(html) {
  return [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
}

export function hasStaleMarkers(html) {
  return html.includes(HEAD_MARKER) || html.includes(HTML_MARKER)
}

export function hasRobotsNoindex(html) {
  return /<meta\s+name="robots"\s+content="noindex"\s*\/?>/.test(html)
}

/** Content between <head> and </head>, '' when there is no head at all. */
export function extractHeadSection(html) {
  return /<head[^>]*>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? ''
}

/** Every href/src attribute value in the whole document, in order. Used
 *  only for the forbidden-host/path scan: a real link or asset URL
 *  pointing at localhost is a bug, but the docs legitimately show
 *  "localhost" in prose and code samples, which this never touches. */
export function extractHrefSrcValues(html) {
  return [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1])
}

/** Removes every href="..."/src="..." attribute value from `text`. Used
 *  to keep the <head>-text forbidden-host scan from re-reporting a
 *  value the href/src-attribute scan (over the whole document) already
 *  covers more precisely — so a bad host inside a head href is reported
 *  once, not twice. */
export function stripHrefSrcAttributeValues(text) {
  return text.replace(/(?:href|src)="[^"]*"/g, '')
}

/** All checks for one route's prerendered HTML file. `meta` is this
 *  route's `getRouteMeta(route)` result. Returns failure messages
 *  (exact duplicates removed), empty when the page is clean. */
export function checkRoute(route, html, meta) {
  const failures = []
  // description/canonical/Open Graph/robots must come from <head>: a
  // copy of any of these tags sitting in the body (e.g. inside a docs
  // page's example markup) must not count as the page's real metadata.
  const head = extractHeadSection(html)

  const mainCount = countMainTags(html)
  if (mainCount !== 1) failures.push(`expected exactly one <main>, found ${mainCount}`)

  if (!extractTitle(html)) failures.push('missing or empty <title>')

  if (!hasMetaDescription(head)) failures.push('missing <meta name="description"> in <head>')

  // Duplicate detection stays whole-document: a stray second canonical
  // anywhere, even outside <head>, is still wrong. But the one
  // canonical that counts as "present" must actually be the one in
  // <head> — an exact count of 1 that turns out to live in the body
  // does not satisfy the check.
  const allCanonicals = extractCanonicalLinks(html)
  const headCanonicals = extractCanonicalLinks(head)
  if (allCanonicals.length !== 1) {
    failures.push(`expected exactly one canonical link, found ${allCanonicals.length}`)
  } else if (headCanonicals.length !== 1) {
    failures.push('canonical link is not in <head>')
  } else if (headCanonicals[0] !== meta.canonical) {
    failures.push(`canonical is "${headCanonicals[0]}", expected "${meta.canonical}"`)
  }

  const missingOg = missingOpenGraphTags(head)
  if (missingOg.length > 0) failures.push(`missing Open Graph tag(s) in <head>: ${missingOg.join(', ')}`)

  if (!rootHasContent(html)) failures.push('#root has no rendered content')

  const moduleAssets = extractModuleScriptSrcs(html).filter((src) => src.startsWith('/assets/'))
  if (moduleAssets.length === 0) failures.push('no <script type="module"> served from /assets/')

  if (hasStaleMarkers(html)) failures.push(`leftover ${HEAD_MARKER} or ${HTML_MARKER} marker`)

  // Independent of the metadata: /404 must be noindex no matter what
  // the route registry says, so a registry mistake (meta.noIndex
  // wrongly false/missing for /404) cannot silently pass alongside a
  // page that is genuinely missing the tag.
  const expectNoIndex = route === '/404' || Boolean(meta.noIndex)
  const actualNoIndex = hasRobotsNoindex(head)
  if (expectNoIndex && !actualNoIndex) {
    failures.push('missing <meta name="robots" content="noindex"> in <head>')
  } else if (!expectNoIndex && actualNoIndex) {
    failures.push('unexpected <meta name="robots" content="noindex"> (only /404 should have it)')
  }

  // Scan <head> text with its own href/src values stripped out first:
  // those are already checked, more precisely, by the loop below (over
  // the whole document), so a bad host inside a head href is reported
  // once, not once per scan.
  for (const name of findForbiddenStrings(stripHrefSrcAttributeValues(head))) {
    failures.push(`<head> contains ${name}`)
  }
  for (const value of extractHrefSrcValues(html)) {
    for (const name of findForbiddenStrings(value)) {
      failures.push(`href/src attribute "${value}" contains ${name}`)
    }
  }

  return [...new Set(failures)]
}

/** Parses dist/search-index.json and checks it is non-empty. */
export function checkSearchIndex(raw) {
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return [`search-index.json is not valid JSON: ${error.message}`]
  }
  if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) {
    return ['search-index.json has no entries']
  }
  return []
}

/** Checks dist/sitemap.xml lists exactly `expectedCanonicals` (no
 *  missing, no extra, no duplicates), and leaks no local host/path. */
export function checkSitemap(xml, expectedCanonicals) {
  const failures = []
  const found = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1])
  const foundSet = new Set(found)
  const expectedSet = new Set(expectedCanonicals)

  for (const url of expectedCanonicals) {
    if (!foundSet.has(url)) failures.push(`sitemap.xml is missing <loc>${url}</loc>`)
  }
  for (const url of found) {
    if (!expectedSet.has(url)) failures.push(`sitemap.xml has an unexpected <loc>${url}</loc>`)
  }
  if (new Set(found).size !== found.length) failures.push('sitemap.xml has duplicate <loc> entries')
  for (const name of findForbiddenStrings(xml)) failures.push(`sitemap.xml contains ${name}`)

  return failures
}

/** Checks dist/robots.txt points Sitemap: at `${siteUrl}/sitemap.xml`
 *  exactly, and leaks no local host/path. */
export function checkRobots(text, siteUrl) {
  const failures = []
  const expected = `${siteUrl}/sitemap.xml`
  const match = /^Sitemap:\s*(\S+)\s*$/m.exec(text)

  if (!match) failures.push('robots.txt has no Sitemap: line')
  else if (match[1] !== expected) failures.push(`robots.txt Sitemap: is "${match[1]}", expected "${expected}"`)
  for (const name of findForbiddenStrings(text)) failures.push(`robots.txt contains ${name}`)

  return failures
}

/** Checks dist/.htaccess declares the 404 handler and has no leftover
 *  catch-all rewrite to /index.html (the old SPA fallback). */
export function checkHtaccess(text) {
  const failures = []

  if (!/ErrorDocument\s+404\s+\/404\.html/.test(text)) {
    failures.push('.htaccess is missing "ErrorDocument 404 /404.html"')
  }
  if (/RewriteRule\s+(?:\.|\^)\s*\/index\.html/.test(text)) {
    failures.push('.htaccess has a catch-all rewrite to /index.html (stale SPA fallback)')
  }

  return failures
}

async function main() {
  let entryServer
  try {
    entryServer = await import('../dist-ssr/entry-server.js')
  } catch (error) {
    throw new Error('Could not load dist-ssr/entry-server.js — run `pnpm build` first.', { cause: error })
  }
  const { PUBLIC_ROUTES, getRouteMeta, SITE_URL } = entryServer

  const failures = []
  const addFailures = (scope, messages) => {
    for (const message of messages) failures.push({ scope, message })
  }

  addFailures(
    'routes',
    findMissingRequiredRoutes(PUBLIC_ROUTES).map(
      (route) => `required route "${route}" is missing from PUBLIC_ROUTES`,
    ),
  )

  const referencedAssets = new Set()

  for (const route of PUBLIC_ROUTES) {
    const filePath = outputPathFor(route, DIST)
    if (!existsSync(filePath)) {
      addFailures(route, [`missing prerendered file ${path.relative(ROOT, filePath)}`])
      continue
    }
    const html = await readFile(filePath, 'utf8')
    addFailures(route, checkRoute(route, html, getRouteMeta(route)))
    for (const assetPath of extractAssetReferences(html)) referencedAssets.add(assetPath)
  }

  for (const assetPath of referencedAssets) {
    if (!existsSync(path.join(DIST, assetPath))) {
      addFailures('assets', [`referenced asset ${assetPath} does not exist in dist/`])
    }
  }

  const searchIndexPath = path.join(DIST, 'search-index.json')
  if (!existsSync(searchIndexPath)) {
    addFailures('search-index.json', ['dist/search-index.json is missing'])
  } else {
    addFailures('search-index.json', checkSearchIndex(await readFile(searchIndexPath, 'utf8')))
  }

  const expectedCanonicals = PUBLIC_ROUTES.filter((route) => {
    const meta = getRouteMeta(route)
    return route !== '/404' && !meta.noIndex
  }).map((route) => getRouteMeta(route).canonical)

  const sitemapPath = path.join(DIST, 'sitemap.xml')
  if (!existsSync(sitemapPath)) {
    addFailures('sitemap.xml', ['dist/sitemap.xml is missing'])
  } else {
    addFailures('sitemap.xml', checkSitemap(await readFile(sitemapPath, 'utf8'), expectedCanonicals))
  }

  const robotsPath = path.join(DIST, 'robots.txt')
  if (!existsSync(robotsPath)) {
    addFailures('robots.txt', ['dist/robots.txt is missing'])
  } else {
    addFailures('robots.txt', checkRobots(await readFile(robotsPath, 'utf8'), SITE_URL))
  }

  const htaccessPath = path.join(DIST, '.htaccess')
  if (!existsSync(htaccessPath)) {
    addFailures('.htaccess', ['dist/.htaccess is missing'])
  } else {
    addFailures('.htaccess', checkHtaccess(await readFile(htaccessPath, 'utf8')))
  }

  console.log(`Checked ${PUBLIC_ROUTES.length} routes.`)
  if (failures.length > 0) {
    console.error(`\n${failures.length} smoke check failure(s):\n`)
    for (const { scope, message } of failures) console.error(`  [${scope}] ${message}`)
    process.exitCode = 1
  } else {
    console.log(`All distribution smoke checks passed (${PUBLIC_ROUTES.length} routes, 0 failures).`)
  }
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isEntryPoint) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
