#!/usr/bin/env node
// prerender.mjs: turn the built SPA in dist/ into pages agents can read.
//
// For every public route (read from the app, window.__MARTIS_PUBLIC_ROUTES__)
// it renders the page in Chrome and writes:
//   dist/<route>.html   the rendered page (title, meta, canonical, content),
//                       served by .htaccess; the app still boots on top of it
//   dist/<route>.md     a Markdown copy, served for Accept: text/markdown
//   dist/404.html       the not-found page, served with a real 404
// then generates sitemap.xml, robots.txt and llms.txt.
//
// Needs Google Chrome (playwright-core, channel "chrome"); set CHROME_PATH to
// use another Chromium binary.

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, extname, join, normalize } from 'node:path'
import { chromium } from 'playwright-core'

const DIST = 'dist'
const SITE = 'https://getmartis.com'
const TODAY = new Date().toISOString().slice(0, 10)

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain', '.md': 'text/markdown',
}

const shell = await readFile(join(DIST, 'index.html'), 'utf8')
// Real descriptions of the docs pages (the route table only has a generic one).
const docDescriptions = Object.fromEntries(
  (JSON.parse(await readFile(join(DIST, 'search-index.json'), 'utf8')).entries ?? []).map((e) => [`/docs/${e.slug}`, e.description ?? '']),
)

// A static server over dist/ that answers every unknown path with the SPA
// shell, as the old catch-all did.
const server = createServer(async (req, res) => {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0])
  const file = normalize(join(DIST, path))
  if (file.startsWith(DIST) && extname(file) && extname(file) !== '.html') {
    try {
      const body = await readFile(file)
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
      return res.end(body)
    } catch { /* fall through to the shell */ }
  }
  res.writeHead(200, { 'Content-Type': MIME['.html'] })
  res.end(shell)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
const page = await context.newPage()

await page.goto(base + '/', { waitUntil: 'networkidle' })
const routes = await page.evaluate(() => window.__MARTIS_PUBLIC_ROUTES__ ?? [])
if (routes.length === 0) throw new Error('prerender: window.__MARTIS_PUBLIC_ROUTES__ is empty')

const pages = []
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1', { timeout: 20000 })
  await page.waitForTimeout(300)
  const result = await page.evaluate(({ route, SITE, docDescription }) => {
    const mdUrl = route === '/' ? '/index.md' : `${route}.md`
    if (docDescription) {
      for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
        document.head.querySelector(selector)?.setAttribute('content', docDescription)
      }
    }

    // Content must be visible without JavaScript: drop the scroll-reveal
    // gate and the transient contact prompt.
    document.documentElement.classList.remove('reveal-ready')
    document.querySelectorAll('.contact-prompt, [data-contact-prompt]').forEach((el) => el.remove())
    const alternate = document.head.querySelector('link[rel="alternate"][type="text/markdown"]')
    if (alternate) alternate.setAttribute('href', mdUrl)

    const meta = {
      title: document.title,
      description: document.head.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      canonical: document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? `${SITE}${route}`,
    }

    // Markdown from the main content.
    const abs = (href) => { try { return new URL(href, SITE + route).href } catch { return href } }
    const clean = (s) => s.replace(/\s+/g, ' ')
    const SKIP = new Set(['SCRIPT', 'STYLE', 'SVG', 'NAV', 'ASIDE', 'BUTTON', 'VIDEO', 'NOSCRIPT', 'FORM', 'IFRAME'])
    const inline = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return clean(node.nodeValue)
      if (node.nodeType !== Node.ELEMENT_NODE || SKIP.has(node.tagName)) return ''
      const inner = [...node.childNodes].map(inline).join('')
      switch (node.tagName) {
        case 'A': { const href = node.getAttribute('href'); const label = inner.trim(); return href && label ? `[${label}](${abs(href)})` : label }
        case 'CODE': return inner.trim() ? `\`${inner.trim()}\`` : ''
        case 'STRONG': case 'B': return inner.trim() ? `**${inner.trim()}**` : ''
        case 'EM': case 'I': return inner.trim() ? `*${inner.trim()}*` : ''
        case 'BR': return '\n'
        case 'IMG': return ''
        default: return inner
      }
    }
    const blocks = []
    const walk = (node, depth = 0) => {
      if (node.nodeType !== Node.ELEMENT_NODE || SKIP.has(node.tagName)) return
      const tag = node.tagName
      if (/^H[1-6]$/.test(tag)) { const t = clean(node.innerText || node.textContent || '').trim(); if (t) blocks.push(`${'#'.repeat(Number(tag[1]))} ${t}`); return }
      if (tag === 'P' || tag === 'FIGCAPTION' || tag === 'DT' || tag === 'DD') { const t = inline(node).trim(); if (t) blocks.push(t); return }
      if (tag === 'PRE') { const code = node.innerText.replace(/\n+$/, ''); if (code.trim()) blocks.push('```\n' + code + '\n```'); return }
      if (tag === 'UL' || tag === 'OL') {
        const items = [...node.children].filter((li) => li.tagName === 'LI').map((li, i) => `${'  '.repeat(depth)}${tag === 'OL' ? `${i + 1}.` : '-'} ${inline(li).trim()}`).filter((l) => l.trim().length > 2)
        if (items.length) blocks.push(items.join('\n'))
        return
      }
      if (tag === 'TABLE') {
        const rows = [...node.querySelectorAll('tr')].map((tr) => [...tr.children].map((c) => inline(c).trim().replace(/\|/g, '\\|')))
        if (rows.length) blocks.push([`| ${rows[0].join(' | ')} |`, `| ${rows[0].map(() => '---').join(' | ')} |`, ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`)].join('\n'))
        return
      }
      if (tag === 'BLOCKQUOTE') { const t = inline(node).trim(); if (t) blocks.push(`> ${t}`); return }
      ;[...node.children].forEach((child) => walk(child, depth))
      // Loose text directly inside a container (e.g. a div with text).
      const own = [...node.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => clean(n.nodeValue)).join('').trim()
      if (own && node.children.length === 0 && !/^(LI|TD|TH|A|SPAN|CODE)$/.test(tag)) blocks.push(own)
    }
    const main = document.querySelector('main') ?? document.body
    walk(main)
    const markdown = [`# ${meta.title}`, meta.description ? `> ${meta.description}` : '', `Source: ${meta.canonical}`, ...blocks]
      .filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n') + '\n'

    // The app renders the page again when it boots, so the static copy is for
    // readers without JavaScript: decorative inline icons are dropped.
    document.querySelectorAll('#root svg').forEach((el) => el.remove())

    return { meta, markdown, html: '<!doctype html>\n' + document.documentElement.outerHTML }
  }, { route, SITE, docDescription: docDescriptions[route] ?? '' })

  const htmlFile = route === '/' ? 'index.html' : route === '/404' ? '404.html' : `${route.slice(1)}.html`
  await mkdir(dirname(join(DIST, htmlFile)), { recursive: true })
  await writeFile(join(DIST, htmlFile), result.html)
  if (route !== '/404') {
    const mdFile = route === '/' ? 'index.md' : `${route.slice(1)}.md`
    await writeFile(join(DIST, mdFile), result.markdown)
    pages.push({ route, ...result.meta, md: route === '/' ? '/index.md' : `${route}.md` })
  }
  console.log(`  prerendered ${route}`)
}

await browser.close()
server.close()

// sitemap.xml
const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((p) => `  <url><loc>${SITE}${p.route === '/' ? '/' : p.route}</loc><lastmod>${TODAY}</lastmod></url>`),
  '</urlset>', ''].join('\n')
await writeFile(join(DIST, 'sitemap.xml'), sitemap)

// robots.txt (Content Signals: https://contentsignals.org)
await writeFile(join(DIST, 'robots.txt'), [
  '# getmartis.com: the Martis open-source admin foundation for Laravel.',
  '# Content Signals (https://contentsignals.org): this content may be used for',
  '# search, as input to AI answers, and to train AI models.',
  'User-agent: *',
  'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
  'Allow: /',
  'Disallow: /api/',
  '',
  `Sitemap: ${SITE}/sitemap.xml`,
  '',
].join('\n'))

// llms.txt (https://llmstxt.org)
const home = pages.find((p) => p.route === '/')
const marketing = pages.filter((p) => !p.route.startsWith('/docs'))
const docs = pages.filter((p) => p.route.startsWith('/docs'))
const line = (p) => `- [${p.title.replace(/ · Martis( docs)?$/, '')}](${SITE}${p.md})${p.description ? `: ${p.description}` : ''}`
await writeFile(join(DIST, 'llms.txt'), [
  '# Martis',
  '',
  `> ${home?.description || 'An MIT-licensed admin foundation for Laravel agencies.'}`,
  '',
  'Martis is an open-source admin panel foundation for Laravel 12 and 13 with a React and TypeScript frontend, distributed as the Composer package martis/martis. Every page below is available as Markdown (the links), and as HTML at the same path without the .md suffix. A read-only documentation MCP server is described at ' + `${SITE}/.well-known/mcp/server-card.json.`,
  '',
  '## Documentation',
  '',
  ...docs.map(line),
  '',
  '## Site',
  '',
  ...marketing.map(line),
  '',
  '## Optional',
  '',
  '- [Source code on GitHub](https://github.com/Real-Edge-FX/martis-package): the martis/martis package',
  '- [Package on Packagist](https://packagist.org/packages/martis/martis): install with composer require martis/martis',
  '',
].join('\n'))

console.log(`prerender: ${pages.length} pages, sitemap.xml, robots.txt, llms.txt`)
