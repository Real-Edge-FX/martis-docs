// Search infrastructure for the Cmd+K palette.
//
// Two layers:
//   1. STATIC_INDEX  — built from `DOC_NAV` plus a curated list of CLI
//                      commands and field deep-links. Always available
//                      (works in dev, works without Pagefind). Cheap.
//   2. Pagefind      — full-text search over the rendered MDX. Built
//                      at `pnpm build` and emitted to `dist/pagefind/`.
//                      Lazy-loaded the first time the user opens the
//                      palette. Optional: dev mode falls back gracefully
//                      to STATIC_INDEX-only.
//
// Both produce the same `SearchHit` shape so the UI does not branch on
// source. Pagefind hits are tagged with `source: 'pagefind'` for
// debugging only.

import { DOC_NAV, type DocItem } from '@/lib/docs-tree'
import type { IconName } from '@/components/icons'

export interface SearchHit {
  group: string
  title: string
  desc: string
  href: string
  icon: IconName
  /** Where the hit came from. Mostly useful for debugging. */
  source: 'static' | 'pagefind'
  /** Excerpt with `<mark>` tags from Pagefind. Optional. */
  excerpt?: string
}

// Curated extras: things we want addressable by Cmd+K but that are not
// dedicated doc pages (CLI commands, popular field types). These point
// to anchors inside the relevant page.
const EXTRAS: SearchHit[] = [
  // CLI
  { group: 'Commands', title: 'martis:install',  desc: 'Full installation with auto-migrate',    href: '/docs/getting-started/installation#install-options', icon: 'Bolt',  source: 'static' },
  { group: 'Commands', title: 'martis:resource', desc: 'Scaffold a new resource class',           href: '/docs/getting-started/quick-start#2-generate-a-martis-resource', icon: 'Bolt', source: 'static' },
  { group: 'Commands', title: 'martis:action',   desc: 'Scaffold an action class',                href: '/docs/getting-started/quick-start#5-add-a-bulk-action', icon: 'Bolt', source: 'static' },
  { group: 'Commands', title: 'martis:tool',     desc: 'Scaffold a custom sidebar tool',          href: '/docs/customization/tools', icon: 'Plug', source: 'static' },
  { group: 'Commands', title: 'martis:theme',    desc: 'Scaffold a custom theme',                 href: '/docs/customization/theming', icon: 'Palette', source: 'static' },
  { group: 'Commands', title: 'martis:policy',   desc: 'Scaffold a Martis policy class',          href: '/docs/auth/authorization', icon: 'Shield', source: 'static' },

  // Popular field types — deep links into fields page
  { group: 'Field Types', title: 'Text',     desc: 'Single-line text input',         href: '/docs/core/fields#text',     icon: 'Hash',         source: 'static' },
  { group: 'Field Types', title: 'Select',   desc: 'Dropdown options with enums',    href: '/docs/core/fields#select',   icon: 'ChevronDown',  source: 'static' },
  { group: 'Field Types', title: 'Date',     desc: 'Date and date-range pickers',    href: '/docs/core/fields#date',     icon: 'Hash',         source: 'static' },
  { group: 'Field Types', title: 'File',     desc: 'Upload with preview',            href: '/docs/core/fields#file',     icon: 'Hash',         source: 'static' },
  { group: 'Field Types', title: 'Markdown', desc: 'WYSIWYG editor',                 href: '/docs/core/fields#markdown', icon: 'Hash',         source: 'static' },
  { group: 'Field Types', title: 'Currency', desc: 'Money input with formatting',    href: '/docs/core/fields#currency', icon: 'Hash',         source: 'static' },
  { group: 'Field Types', title: 'Badge',    desc: 'Status pill with colour map',    href: '/docs/core/fields#badge',    icon: 'Hash',         source: 'static' },
]

function fromDoc(item: DocItem, group: string): SearchHit {
  return {
    group,
    title: item.label,
    desc: '',
    href: `/docs/${item.slug}`,
    icon: item.icon,
    source: 'static',
  }
}

export const STATIC_INDEX: SearchHit[] = [
  ...DOC_NAV.flatMap((g) => g.items.map((it) => fromDoc(it, g.group))),
  ...EXTRAS,
]

/** Cheap fuzzy score: substring is best, then subsequence. */
export function fuzzyScore(text: string, q: string): number {
  if (!q) return 0
  const t = text.toLowerCase()
  const idx = t.indexOf(q)
  if (idx >= 0) return 100 - idx
  let ti = 0
  let qi = 0
  let score = 0
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) {
      score += 1
      qi++
    }
    ti++
  }
  return qi === q.length ? score : 0
}

export function searchStatic(query: string): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return STATIC_INDEX
  return STATIC_INDEX
    .map((it) => ({
      it,
      s: Math.max(
        fuzzyScore(it.title, q),
        fuzzyScore(it.desc, q) * 0.6,
        fuzzyScore(it.group, q) * 0.4,
      ),
    }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.it)
}

// Full-text index ============================================================
// Built at `pnpm build-search` (and automatically before `pnpm dev` /
// `pnpm build`). Lives at `/search-index.json`. The Cmd+K palette
// fetches it lazily on first user query and caches the parsed result
// in memory for the lifetime of the page.

interface IndexEntry {
  slug: string
  title: string
  description: string
  body: string
}

interface IndexPayload {
  version: number
  builtAt: string
  entries: IndexEntry[]
}

let indexPromise: Promise<IndexPayload | null> | null = null

async function loadIndex(): Promise<IndexPayload | null> {
  if (indexPromise) return indexPromise
  indexPromise = (async () => {
    try {
      const r = await fetch('/search-index.json', { cache: 'force-cache' })
      if (!r.ok) return null
      return (await r.json()) as IndexPayload
    } catch {
      return null
    }
  })()
  return indexPromise
}

const SLUG_TO_GROUP_ICON: Record<string, { group: string; icon: IconName }> = {
  'getting-started': { group: 'Getting Started', icon: 'Bolt' },
  core:               { group: 'Core Concepts',   icon: 'Stack' },
  customization:      { group: 'Customization',   icon: 'Layers' },
  auth:               { group: 'Auth & Security', icon: 'Shield' },
  reference:          { group: 'Reference',       icon: 'Hash' },
}

/**
 * Full-text search across the doc bodies. Mirrors the static-index
 * shape so the palette can merge results without branching. Returns at
 * most 12 hits, ranked by how early/often the query terms appear.
 */
export async function searchFullText(query: string): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const payload = await loadIndex()
  if (!payload) return []
  const terms = q.split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const ranked: { hit: SearchHit; s: number; idx: number }[] = []
  for (const e of payload.entries) {
    const haystack = `${e.title} ${e.description} ${e.body}`.toLowerCase()
    let score = 0
    let firstHit = -1
    for (const t of terms) {
      const idx = haystack.indexOf(t)
      if (idx < 0) {
        score = 0
        break
      }
      score += 100 - Math.min(idx, 99)
      // bonus for hit in title
      if (e.title.toLowerCase().includes(t)) score += 50
      if (firstHit < 0 || idx < firstHit) firstHit = idx
    }
    if (score <= 0) continue
    const segment = e.slug.split('/')[0] ?? 'Docs'
    const meta = SLUG_TO_GROUP_ICON[segment] ?? { group: 'Docs', icon: 'Hash' as IconName }
    const excerptStart = Math.max(0, firstHit - 40)
    const excerpt = e.body.slice(excerptStart, excerptStart + 160).trim()
    ranked.push({
      hit: {
        group: meta.group,
        title: e.title,
        desc: excerpt || e.description,
        href: `/docs/${e.slug}`,
        icon: meta.icon,
        source: 'pagefind' as const, // kept for backwards compat with the type
        excerpt,
      },
      s: score,
      idx: firstHit,
    })
  }
  return ranked
    .sort((a, b) => b.s - a.s || a.idx - b.idx)
    .slice(0, 12)
    .map((r) => r.hit)
}

/** @deprecated Use `searchFullText`. Kept as alias for callers in flight. */
export const searchPagefind = searchFullText
