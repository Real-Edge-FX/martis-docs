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
import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'

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
  'core/default-row-actions': 'default_row_actions.md',
  'core/sticky-views': 'sticky_views.md',
  'core/grid-layout': 'grid-layout.md',
  'core/panels-and-tabs': 'panels-and-tabs.md',
  'core/repeater': 'repeater.md',
  'core/menus': 'menus.md',
  'core/global-search': 'global-search.md',
  'customization/theming': 'theming.md',
  'customization/overrides': 'overrides.md',
  'customization/components': 'components.md',
  'customization/tools': 'tools.md',
  'customization/tool-boot-patterns': 'tool-boot-patterns.md',
  'customization/loader': 'loader.md',
  'customization/generators': 'customizing-generators.md',
  'customization/i18n': 'i18n.md',
  'auth/authentication': 'authentication.md',
  'auth/sso': 'sso.md',
  'auth/impersonation': 'impersonation.md',
  'auth/authorization': 'authorization.md',
  'reference/configuration': 'configuration.md',
  'reference/cache': 'cache.md',
  'reference/notifications': 'notifications.md',
  'reference/keyboard-shortcuts': 'keyboard-shortcuts.md',
  'reference/preferences': 'preferences.md',
  'reference/differentials': 'differentials.md',
  // martis-package v1.2.0 sanitised api/overview.md (no more
  // admin@martis.local / martis.realedgefx.com leaks) and shipped the
  // OpenAPI surface promised on the page, so the docs site no longer
  // needs the hand-authored override and can sync it directly.
  'reference/api': 'api/overview.md',
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
    // 2. Escape `{` outside backticks. Three branches in priority order:
    //    a. backtick block       → leave untouched (literal code span)
    //    b. `\{` already escaped → leave untouched (markdown-level escape)
    //    c. bare `{`             → escape to `\{`
    //    The original regex only had (a) and (c), so any `\{X}` from the
    //    source was double-escaped to `\\{X}`, which markdown renders as
    //    `\` + `{X}` and MDX then parses `{X}` as a JSX expression
    //    (e.g. `ResourceBaseName` breaking /docs/core/resources at
    //    runtime with "ReferenceError: ... is not defined").
    safe = safe.replace(
      /(`[^`]*`)|(\\\{)|(\{)/g,
      (whole, code, alreadyEscaped) =>
        code ? whole : alreadyEscaped ? whole : '\\{',
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

// Patterns we never want to ship to the public docs site. If any of
// these survive a sync (e.g. someone adds an entry to MAP that points
// at a leaky source file), abort the build. Tracked upstream in
// Real-Edge-FX/martis-package#94.
const FORBIDDEN_PATTERNS = [
  { name: 'admin@martis.local',          re: /admin@martis\.local/ },
  { name: 'martis.realedgefx.com',       re: /martis\.realedgefx\.com/ },
  { name: 'martis-docs.realedgefx.com',  re: /martis-docs\.realedgefx\.com/ },
  { name: 'internal IP 192.168.50.21',   re: /192\.168\.50\.21/ },
  { name: 'SSH key path secrets/martis', re: /secrets\/martis[\w-]*ed25519/ },
]

function leakSweep() {
  const offenders = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && full.endsWith('.mdx')) {
        const value = fs.readFileSync(full, 'utf8')
        for (const { name, re } of FORBIDDEN_PATTERNS) {
          if (re.test(value)) {
            offenders.push({ file: path.relative(ROOT, full), pattern: name })
          }
        }
      }
    }
  }
  walk(CONTENT_DIR)
  if (offenders.length) {
    console.error(`\n${offenders.length} leak(s) found in src/content/:`)
    for (const o of offenders) {
      console.error(`  ✗ ${o.file} contains ${o.pattern}`)
    }
    console.error(
      '\nRefusing to ship — see Real-Edge-FX/martis-package#94 ' +
        'for the full list of forbidden patterns.',
    )
    process.exit(3)
  }
  console.log('✓ no forbidden patterns in src/content/.')
}

leakSweep()

// Compile every MDX file (synced + hand-authored) through the same
// remark/rehype pipeline the runtime uses. Catches MDX syntax errors
// at sync time rather than letting them through to runtime as
// "ReferenceError: <thing> is not defined" when the bundle tries to
// evaluate a stray JSX expression.
async function validateAll() {
  const all = []
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && full.endsWith('.mdx')) all.push(full)
    }
  }
  walk(CONTENT_DIR)

  const failures = []
  for (const file of all) {
    const value = fs.readFileSync(file, 'utf8')
    try {
      await compile(
        { path: file, value },
        {
          providerImportSource: '@mdx-js/react',
          remarkPlugins: [
            remarkGfm,
            remarkFrontmatter,
            [remarkMdxFrontmatter, { name: 'frontmatter' }],
          ],
        },
      )
    } catch (err) {
      failures.push({ file, err })
    }
  }

  if (failures.length) {
    console.error(`\n${failures.length} MDX file(s) FAILED to compile:`)
    for (const { file, err } of failures) {
      const rel = path.relative(ROOT, file)
      const loc = err.line ? ` (${err.line}:${err.column})` : ''
      console.error(`  ✗ ${rel}${loc}: ${err.reason ?? err.message}`)
    }
    process.exit(2)
  }
  console.log(`✓ ${all.length} MDX file(s) compile cleanly.`)
}

await validateAll()

if (isCheckMode && stale > 0) {
  console.error(`\n${stale} doc(s) stale — run \`pnpm sync-docs\` to update.`)
  process.exit(1)
}

if (!isCheckMode) {
  console.log(`\n${written} doc(s) written, ${Object.keys(MAP).length - written} unchanged.`)
}
