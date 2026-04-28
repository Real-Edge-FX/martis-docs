#!/usr/bin/env node
// Sync source-of-truth markdown from martis-package/docs/ into the
// docs site as MDX files mapped to the slugs declared in
// `src/lib/docs-tree.ts`. Each mapping is explicit so we can:
//
//   - rename a slug without renaming the source file, and
//   - decide which package docs surface publicly (excludes
//     `release-process.md` / `v1-roadmap.md` / etc. that are dev-only).
//
// Run from the docs repo root:
//   pnpm sync-docs           # copies + transforms
//   pnpm sync-docs --check   # exits non-zero if anything is stale
//
// Transformations applied to each .md → .mdx:
//   1. Frontmatter block prepended (title, description, sourcePath).
//   2. Relative `[link](other.md)` rewritten to `/docs/<slug>`.
//   3. `<` and `{` outside fenced blocks escaped so JSX does not eat
//      them. (MDX is strict about `{` and tag-like sequences.)
//
// The script is intentionally synchronous and dependency-free so it
// can be invoked from CI without reaching for esbuild/sucrase.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PACKAGE_DOCS = path.resolve(
  ROOT,
  '..',
  'martis-package',
  'docs',
)
const CONTENT_DIR = path.resolve(ROOT, 'src', 'content')

// slug → package source filename. Keep in sync with `docs-tree.ts`.
// Slugs not listed here remain "to be authored" and stay as
// hand-written MDX (or absent — the docs UI shows a "doc not found"
// page in that case).
const MAP = {
  'getting-started/installation': 'installation-guide.md',
  // 'getting-started/quick-start' — hand-authored
  // 'getting-started/troubleshooting' — hand-authored
  'core/resources': 'resources.md',
  'core/fields': 'fields.md',
  'core/relationships': 'relationships.md',
  'core/filters': 'filters.md',
  'core/lenses': 'lenses.md',
  'core/metrics': 'metrics.md',
  'core/dashboards': 'dashboards.md',
  'core/actions': 'actions.md',
  'core/grid-layout': 'grid-layout.md',
  'core/panels-and-tabs': 'panels-and-tabs.md',
  'core/repeater': 'repeater.md',
  'core/menus': 'menus.md',
  'customization/theming': 'theming.md',
  'customization/overrides': 'overrides.md',
  'customization/components': 'components.md',
  'customization/tools': 'tools.md',
  'customization/i18n': 'i18n.md',
  'auth/authentication': 'authentication.md',
  'auth/sso': 'sso.md',
  'auth/impersonation': 'impersonation.md',
  'auth/authorization': 'authorization.md',
  'reference/configuration': 'configuration.md',
  'reference/cache': 'cache.md',
  'reference/notifications': 'notifications.md',
  'reference/differentials': 'differentials.md',
  // 'reference/api' — hand-authored entry that links to the OpenAPI
  // dump rather than re-rendering it.
}

// Inverse map of package filename → public slug. Used to rewrite
// inter-doc relative links during the sync.
const INVERSE = Object.fromEntries(
  Object.entries(MAP).map(([slug, file]) => [file, slug]),
)

const isCheckMode = process.argv.includes('--check')

function rewriteLinks(md) {
  // [text](file.md) or [text](file.md#anchor) → [text](/docs/<slug>#anchor)
  return md.replace(
    /\[([^\]]+)\]\(([a-z0-9_\-]+)\.md(#[a-z0-9_\-]+)?\)/gi,
    (whole, text, file, anchor) => {
      const slug = INVERSE[`${file}.md`]
      if (!slug) return whole // unmapped; leave the broken link visible
      return `[${text}](/docs/${slug}${anchor ?? ''})`
    },
  )
}

// Self-closing void HTML elements that MDX rejects without a slash.
const VOID_ELEMENTS = ['br', 'hr', 'img', 'input', 'wbr', 'col', 'area', 'base', 'link', 'meta', 'source', 'track', 'embed']

function escapeMdxHazards(md) {
  // Walk line-by-line, flipping a "we are inside ``` " flag so we
  // only escape outside fenced blocks (where MDX parser cares).
  const out = []
  let inFence = false
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence
      out.push(line)
      continue
    }
    if (inFence) {
      out.push(line)
      continue
    }
    let safe = line
    // 1. Self-close void HTML elements (`<br>` → `<br />`). Skips
    //    occurrences already inside backticks (preserves docs that
    //    talk about the literal markup).
    for (const tag of VOID_ELEMENTS) {
      const re = new RegExp(`(\`[^\`]*\`)|<${tag}(\\s[^>]*)?>(?!\\s*</${tag}>)`, 'gi')
      safe = safe.replace(re, (whole, code) => {
        if (code) return code
        return whole.replace(/>$/, ' />')
      })
    }
    // 2. Escape `{` outside backticks — MDX would parse it as a JSX
    //    expression and fail on the unmatched closing brace.
    safe = safe.replace(/(`[^`]*`)|(\{)/g, (_, code, brace) =>
      code ? code : '\\{',
    )
    out.push(safe)
  }
  return out.join('\n')
}

function deriveTitleAndDescription(md) {
  // Title = first level-1 heading; description = first non-blockquote
  // non-empty paragraph after the title that isn't a heading or list.
  const titleMatch = md.match(/^#\s+(.+?)\s*$/m)
  const title = titleMatch ? titleMatch[1] : 'Untitled'
  const afterTitle = titleMatch
    ? md.slice(titleMatch.index + titleMatch[0].length).trimStart()
    : md
  const paragraphs = afterTitle.split(/\n\s*\n/)
  let description = ''
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue
    // Skip blockquotes, headings, list items, fenced code, HTML.
    if (/^[>#\-*]/.test(trimmed)) continue
    if (trimmed.startsWith('```')) continue
    if (trimmed.startsWith('<')) continue
    description = trimmed.replace(/\n/g, ' ').slice(0, 280).trim()
    break
  }
  return { title, description }
}

function transform(slug, sourceFile) {
  const md = fs.readFileSync(sourceFile, 'utf8')
  const { title, description } = deriveTitleAndDescription(md)
  // Strip the duplicated H1 (we render the title from frontmatter).
  const body = md.replace(/^#\s+.+?\s*$/m, '').trimStart()
  const transformed = escapeMdxHazards(rewriteLinks(body))
  const safeTitle = title.replace(/"/g, '\\"')
  const safeDesc = description.replace(/"/g, '\\"')
  const frontmatter = [
    '---',
    `title: "${safeTitle}"`,
    `description: "${safeDesc}"`,
    `sourcePath: "martis-package/docs/${path.basename(sourceFile)}"`,
    '---',
    '',
    `# ${title}`,
    '',
  ].join('\n')
  return frontmatter + transformed + '\n'
}

let stale = 0
let written = 0

for (const [slug, file] of Object.entries(MAP)) {
  const source = path.join(PACKAGE_DOCS, file)
  if (!fs.existsSync(source)) {
    console.error(`SKIP ${slug}: source missing (${source})`)
    continue
  }
  const dest = path.join(CONTENT_DIR, `${slug}.mdx`)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const next = transform(slug, source)
  const prev = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : ''
  if (next !== prev) {
    if (isCheckMode) {
      console.error(`STALE ${slug}`)
      stale++
    } else {
      fs.writeFileSync(dest, next)
      console.log(`WROTE ${slug}`)
      written++
    }
  }
}

if (isCheckMode && stale > 0) {
  console.error(`\n${stale} doc(s) stale — run \`pnpm sync-docs\` to update.`)
  process.exit(1)
}

if (!isCheckMode) {
  console.log(`\n${written} doc(s) written, ${Object.keys(MAP).length - written} unchanged.`)
}
