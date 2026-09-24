// Turns the SSR bundle's `render(url)` into the static site: one HTML
// file per public route, a real 404 page, a sitemap and a robots.txt.
// Everything comes from the compiled server bundle
// (dist-ssr/entry-server.js) — this script never imports a TypeScript
// source directly, so it never drifts from what the client build and
// the SSR build actually shipped.
//
// Run after both: `pnpm build:client && pnpm build:ssr && pnpm prerender`
// (or just `pnpm build`, which chains all three).
//
// The pure pieces below (injectPage, assertOk, outputPathFor,
// buildSitemap, buildRobots, escapeXml) are exported for
// scripts/prerender-unit.test.mjs and scripts/smoke-dist.mjs (which
// reuses outputPathFor to find each route's prerendered file).
// Importing this module never touches dist-ssr/entry-server.js or the
// filesystem as a side effect: render/PUBLIC_ROUTES/getRouteMeta/
// SITE_URL are imported lazily inside main(), not at module scope, and
// main().catch(...) only runs behind the is-entry-point guard at the
// bottom — so both test files can import the pure pieces before
// dist-ssr/entry-server.js exists (i.e. before a `pnpm build`).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DIST = path.join(ROOT, 'dist')

export const HEAD_MARKER = '<!--app-head-->'
export const HTML_MARKER = '<!--app-html-->'

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
export function escapeXml(value) {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char])
}

/** '/' -> dist/index.html; '/404' -> dist/404.html (never dist/404/index.html,
 *  so it never shadows a real "/404" route); anything else -> dist/<route>/index.html.
 *  `dist` defaults to the real build output but is a parameter so tests
 *  do not need the real absolute path. */
export function outputPathFor(route, dist = DIST) {
  if (route === '/') return path.join(dist, 'index.html')
  if (route === '/404') return path.join(dist, '404.html')
  return path.join(dist, route, 'index.html')
}

/** Fails loudly if `template` is missing either marker (a broken client
 *  build would otherwise silently ship every page with no head or
 *  content), else returns it with both replaced. Replacer *functions*,
 *  never replacement strings: the docs contain PHP and regex samples
 *  where `$&`/`$1` would be silently expanded by String.replace. */
export function injectPage(template, head, html, templatePath = 'dist/index.html') {
  if (!template.includes(HEAD_MARKER) || !template.includes(HTML_MARKER)) {
    throw new Error(
      `${templatePath} is missing ${HEAD_MARKER} or ${HTML_MARKER}; check index.html and the client build`,
    )
  }
  return template.replace(HEAD_MARKER, () => head).replace(HTML_MARKER, () => html)
}

/** Every route other than `/404` must render 200; anything else fails
 *  the build with the offending route named. */
export function assertOk(route, status) {
  if (route !== '/404' && status !== 200) {
    throw new Error(`render("${route}") returned status ${status}, expected 200`)
  }
}

/** One `<url><loc>` per indexable route (skips `/404` and any `noIndex`
 *  route), from its canonical URL, XML-escaped, no timestamps (keeps the
 *  build deterministic). `resolveMeta` is injected so this stays
 *  testable without a real SSR bundle. */
export function buildSitemap(routes, resolveMeta) {
  const locs = routes
    .filter((route) => route !== '/404' && !resolveMeta(route).noIndex)
    .map((route) => `  <url><loc>${escapeXml(resolveMeta(route).canonical)}</loc></url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.join('\n')}\n</urlset>\n`
}

/** Allow-all robots.txt pointing at the sitemap. */
export function buildRobots(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
}

async function writePage(route, template, render) {
  const { html, head, status } = await render(route).catch((error) => {
    // Reject with the route attached: 51 routes render in sequence, and
    // "render did not complete within 20000ms" alone does not say which
    // one hung or threw.
    throw new Error(`render("${route}") failed: ${error.message}`, { cause: error })
  })
  assertOk(route, status)

  const page = injectPage(template, head, html, path.join(DIST, 'index.html'))
  const outPath = outputPathFor(route)
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, page, 'utf8')
}

async function main() {
  // See the file-header comment: imported here (not at module scope) so
  // this module's pure exports stay importable before a `pnpm build`.
  const { getRouteMeta, PUBLIC_ROUTES, render, SITE_URL } = await import('../dist-ssr/entry-server.js')

  // Read the client build's HTML shell once, before writing anything: the
  // '/' route's own output overwrites dist/index.html, so reading it again
  // mid-loop would hand later routes an already-rendered page as their
  // "template". A missing marker surfaces on the first route's
  // injectPage() call below, failing the whole build immediately.
  const template = await readFile(path.join(DIST, 'index.html'), 'utf8')

  for (const route of PUBLIC_ROUTES) {
    await writePage(route, template, render)
  }

  await writeFile(path.join(DIST, 'sitemap.xml'), buildSitemap(PUBLIC_ROUTES, getRouteMeta), 'utf8')
  await writeFile(path.join(DIST, 'robots.txt'), buildRobots(SITE_URL), 'utf8')

  console.log(`Prerendered ${PUBLIC_ROUTES.length} routes to dist/.`)
}

const isEntryPoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isEntryPoint) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
