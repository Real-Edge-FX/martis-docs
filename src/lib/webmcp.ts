import { PUBLIC_ROUTES, getRouteMeta } from '@/lib/site-routes'

/**
 * WebMCP: tools an in-browser agent can call on getmartis.com
 * (`navigator.modelContext`, https://webmachinelearning.github.io/webmcp/).
 * They read the same public data a visitor sees: the search index and the
 * Markdown copy of every page (`/index.md`, `/docs/<slug>.md`, ...).
 */

interface ToolResult { content: Array<{ type: 'text'; text: string }> }
interface WebMcpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  annotations?: Record<string, unknown>
  execute: (input: Record<string, unknown>) => Promise<ToolResult>
}
interface ModelContext {
  registerTool?: (tool: WebMcpTool) => unknown
  provideContext?: (context: { tools: WebMcpTool[] }) => unknown
}

interface SearchEntry { slug: string; title: string; description?: string; body?: string }

const text = (value: string): ToolResult => ({ content: [{ type: 'text', text: value }] })

/** Markdown URL of a page path: `/` → `/index.md`, `/docs/x` → `/docs/x.md`. */
export function markdownUrl(path: string): string {
  const clean = path.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/'
  return clean === '/' ? '/index.md' : `${clean}.md`
}

let indexPromise: Promise<SearchEntry[]> | null = null
function searchIndex(): Promise<SearchEntry[]> {
  indexPromise ??= fetch('/search-index.json').then((r) => r.json()).then((d: { entries?: SearchEntry[] }) => d.entries ?? [])
  return indexPromise
}

export function searchDocs(entries: SearchEntry[], query: string, limit = 5): Array<{ title: string; url: string; description: string }> {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return []
  return entries
    .map((entry) => {
      const title = entry.title.toLowerCase()
      const body = `${entry.description ?? ''} ${entry.body ?? ''}`.toLowerCase()
      const score = terms.reduce((sum, term) => sum + (title.includes(term) ? 5 : 0) + (body.includes(term) ? 1 : 0), 0)
      return { entry, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => ({ title: entry.title, url: `https://getmartis.com/docs/${entry.slug}`, description: entry.description ?? '' }))
}

const tools: WebMcpTool[] = [
  {
    name: 'search_martis_docs',
    description: 'Search the Martis documentation (Laravel admin foundation) and return the best matching pages with their URLs.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look for, e.g. "drawer detail override" or "multi-column sort".' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      const results = searchDocs(await searchIndex(), String(input.query ?? ''), Number(input.limit ?? 5))
      return text(results.length ? JSON.stringify(results, null, 2) : 'No matching documentation page.')
    },
  },
  {
    name: 'get_martis_page',
    description: 'Return the Markdown content of a getmartis.com page, e.g. "/docs/core/resources" or "/showcase".',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Page path on getmartis.com, starting with "/".' } },
      required: ['path'],
    },
    annotations: { readOnlyHint: true },
    async execute(input) {
      const path = String(input.path ?? '/')
      if (!path.startsWith('/')) return text('The path must start with "/".')
      const response = await fetch(markdownUrl(path), { headers: { Accept: 'text/markdown' } })
      if (!response.ok) return text(`No page at ${path} (HTTP ${response.status}).`)
      return text(await response.text())
    },
  },
  {
    name: 'list_martis_pages',
    description: 'List the public pages of getmartis.com with their titles.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    async execute() {
      const pages = PUBLIC_ROUTES.filter((p) => p !== '/404').map((p) => ({ path: p, title: getRouteMeta(p).title }))
      return text(JSON.stringify(pages, null, 2))
    },
  },
]

/** Registers the tools when the browser exposes WebMCP; a no-op elsewhere. */
export function registerWebMcpTools(): void {
  if (typeof navigator === 'undefined') return
  const context = (navigator as Navigator & { modelContext?: ModelContext }).modelContext
  if (!context) return
  try {
    if (typeof context.registerTool === 'function') tools.forEach((tool) => context.registerTool?.(tool))
    else if (typeof context.provideContext === 'function') context.provideContext({ tools })
  } catch {
    // An agent runtime that refuses the tools must not break the page.
  }
}
