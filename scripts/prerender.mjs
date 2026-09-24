// Turns the SSR bundle's `render(url)` into the static site: one HTML
// file per public route, a real 404 page, a sitemap and a robots.txt.
// Everything comes from the compiled server bundle
// (dist-ssr/entry-server.js) — this script never imports a TypeScript
// source directly, so it never drifts from what the client build and
// the SSR build actually shipped.
//
// Run after both: `pnpm build:client && pnpm build:ssr && pnpm prerender`
// (or just `pnpm build`, which chains all three).

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRouteMeta, PUBLIC_ROUTES, render, SITE_URL } from '../dist-ssr/entry-server.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')

const HEAD_MARKER = '<!--app-head-->'
const HTML_MARKER = '<!--app-html-->'

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }
function escapeXml(value) {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char])
}

/** '/' -> dist/index.html; '/404' -> dist/404.html (never dist/404/index.html,
 *  so it never shadows a real "/404" route); anything else -> dist/<route>/index.html. */
function outputPathFor(route) {
  if (route === '/') return path.join(DIST, 'index.html')
  if (route === '/404') return path.join(DIST, '404.html')
  return path.join(DIST, route, 'index.html')
}

async function writePage(route, template) {
  const { html, head, status } = await render(route).catch((error) => {
    // Reject with the route attached: 51 routes render in sequence, and
    // "render did not complete within 20000ms" alone does not say which
    // one hung or threw.
    throw new Error(`render("${route}") failed: ${error.message}`, { cause: error })
  })
  if (route !== '/404' && status !== 200) {
    throw new Error(`render("${route}") returned status ${status}, expected 200`)
  }

  const page = template.replace(HEAD_MARKER, () => head).replace(HTML_MARKER, () => html)
  const outPath = outputPathFor(route)
  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, page, 'utf8')
}

async function writeSitemap() {
  const locs = PUBLIC_ROUTES.filter((route) => route !== '/404' && !getRouteMeta(route).noIndex).map(
    (route) => `  <url><loc>${escapeXml(getRouteMeta(route).canonical)}</loc></url>`,
  )
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs.join('\n')}\n</urlset>\n`
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf8')
}

async function writeRobots() {
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  await writeFile(path.join(DIST, 'robots.txt'), robots, 'utf8')
}

async function main() {
  // Read the client build's HTML shell once, before writing anything: the
  // '/' route's own output overwrites dist/index.html, so reading it again
  // mid-loop would hand later routes an already-rendered page as their
  // "template".
  const templatePath = path.join(DIST, 'index.html')
  const template = await readFile(templatePath, 'utf8')
  if (!template.includes(HEAD_MARKER) || !template.includes(HTML_MARKER)) {
    throw new Error(
      `${templatePath} is missing ${HEAD_MARKER} or ${HTML_MARKER}; check index.html and the client build`,
    )
  }

  for (const route of PUBLIC_ROUTES) {
    await writePage(route, template)
  }

  await writeSitemap()
  await writeRobots()

  console.log(`Prerendered ${PUBLIC_ROUTES.length} routes to dist/.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
