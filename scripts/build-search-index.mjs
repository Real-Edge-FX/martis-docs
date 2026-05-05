#!/usr/bin/env node
// Build a JSON full-text search index from `src/content/**/*.mdx`
// and emit it to `public/search-index.json` so Vite copies it into
// `dist/`. The Cmd+K palette fetches it lazily on first open.
//
// Why not Pagefind? Pagefind expects pre-rendered HTML on disk; we
// are a client-rendered SPA so it has no body to index. Generating
// our own JSON is a few dozen lines and gives us the exact data
// shape `lib/search.ts` already consumes.
//
// Output shape:
//   {
//     "version": 1,
//     "entries": [
//       { "slug": "core/fields", "title": "Fields", "description": "...", "body": "stripped plain text" },
//       ...
//     ]
//   }
//
// Run:
//   node scripts/build-search-index.mjs

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.resolve(ROOT, 'src', 'content')
const OUTPUT = path.resolve(ROOT, 'public', 'search-index.json')

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && full.endsWith('.mdx')) out.push(full)
  }
  return out
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) return { meta: {}, body: raw }
  const meta = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*"?(.*?)"?\s*$/)
    if (kv) meta[kv[1]] = kv[2]
  }
  return { meta, body: raw.slice(m[0].length) }
}

function stripMarkdown(md) {
  return md
    // fenced code blocks — KEEP the content (identifiers like
    // `plan_resolver`, `withIcon`, `requirePlan` only appear inside
    // fences in many pages; dropping them buried the API surface in
    // the search index). Strip only the opening fence + lang tag and
    // the closing fence; the body becomes plain text inline with the
    // rest of the prose.
    .replace(/```[a-zA-Z0-9_-]*\n?/g, ' ')
    .replace(/```/g, ' ')
    // inline code — keep the content for the same reason; only drop
    // the surrounding backticks.
    .replace(/`([^`]*)`/g, '$1')
    // images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    // links — keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // headings markers
    .replace(/^#{1,6}\s+/gm, '')
    // emphasis markers — only `*` and `~` (strikethrough). DO NOT
    // strip `_` raw: tech docs use snake_case identifiers
    // (`plan_resolver`, `email_verified_at`) that would otherwise lose
    // the underscore and become unsearchable. Underscore-emphasis is
    // rare in this codebase; if it appears, tolerate the trailing `_`.
    .replace(/[*~]+/g, '')
    // blockquote markers
    .replace(/^>\s?/gm, '')
    // lists markers
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // table separators
    .replace(/\|/g, ' ')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim()
}

const entries = []
for (const file of walk(CONTENT_DIR).sort()) {
  const raw = fs.readFileSync(file, 'utf8')
  const { meta, body } = parseFrontmatter(raw)
  const slug = path
    .relative(CONTENT_DIR, file)
    .replace(/\.mdx$/, '')
    .replaceAll(path.sep, '/')
  const title = meta.title || slug
  const description = meta.description || ''
  const text = stripMarkdown(body).slice(0, 8000) // cap per-doc body size
  entries.push({ slug, title, description, body: text })
}

const payload = { version: 1, builtAt: new Date().toISOString(), entries }
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, JSON.stringify(payload))
const sizeKb = (fs.statSync(OUTPUT).size / 1024).toFixed(1)
console.log(`search-index.json: ${entries.length} entries, ${sizeKb} KB`)
