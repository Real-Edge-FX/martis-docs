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
//   pnpm sync-docs                              # copies + transforms
//   pnpm sync-docs --check                      # exits non-zero if anything is stale
//   pnpm sync-docs --package-dir ../martis-package
//   pnpm sync-docs --content-dir /tmp/out       # write somewhere other than src/content
//
// `--package-dir` is the martis-package checkout (default: the sibling
// `../martis-package`); its `docs/` folder is read. `--content-dir`
// defaults to `src/content`.
//
// Transformations applied to each .md → .mdx:
//   1. Frontmatter block prepended (title, description, sourcePath). The
//      title and description are YAML double-quoted strings with `\` and
//      `"` escaped; the description skips markdown tables. `sourcePath`
//      keeps the subfolder of a nested doc (`docs/api/overview.md`).
//   2. Relative links resolve against the folder of the page that holds
//      them. A link to a synced (or hand-authored) page becomes
//      `/docs/<slug>`; any other relative link (`../src/...`,
//      `../CHANGELOG.md`, an unpublished doc) becomes a GitHub URL on the
//      martis-package repository. Links in fenced or inline code are kept.
//   3. `<` and `{` outside fenced blocks escaped so JSX does not eat
//      them. (MDX is strict about `{` and tag-like sequences.)
//
// The pure transforms are exported for `scripts/sync-docs.test.mjs`
// (`pnpm test`); the sync itself only runs when the file is executed.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
export const DEFAULT_PACKAGE_DIR = path.resolve(ROOT, '..', 'martis-package')
export const DEFAULT_CONTENT_DIR = path.resolve(ROOT, 'src', 'content')

// Where relative links that leave the synced docs point to.
export const GITHUB_REPO = 'Real-Edge-FX/martis-package'
export const GITHUB_BRANCH = 'main'

// slug → package source path, relative to martis-package/docs/ (a doc in a
// subfolder keeps it: 'api/overview.md'). Keep in sync with `docs-tree.ts`.
// Slugs not listed here remain "to be authored" and stay as
// hand-written MDX (or absent: the docs UI shows a "doc not found"
// page in that case).
export const MAP = {
  'getting-started/installation': 'installation-guide.md',
  // 'getting-started/quick-start': hand-authored
  // 'getting-started/troubleshooting': hand-authored
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
  'customization/agent-guidelines': 'agent-guidelines.md',
  'customization/tools': 'tools.md',
  'customization/tool-fields': 'tool-fields.md',
  'customization/tool-boot-patterns': 'tool-boot-patterns.md',
  'customization/loader': 'loader.md',
  'customization/generators': 'customizing-generators.md',
  'customization/i18n': 'i18n.md',
  'auth/authentication': 'authentication.md',
  'auth/sso': 'sso.md',
  'auth/impersonation': 'impersonation.md',
  'auth/invitations': 'invitations.md',
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

// Package docs whose page on the site is hand-authored rather than ported
// (see HAND_AUTHORED_SOURCEPATH below, and core/gates, which carries no
// sourcePath). They are not synced, but a ported page that links one must
// still land on it.
export const LINK_ONLY = {
  'getting-started/quick-start': 'quick-start.md',
  'getting-started/troubleshooting': 'troubleshooting.md',
  'auth/roles': 'roles.md',
  'core/gates': 'gates.md',
}

// Inverse map of package path → public slug. Used to rewrite
// inter-doc relative links during the sync.
export const INVERSE = Object.fromEntries(
  Object.entries({ ...LINK_ONLY, ...MAP }).map(([slug, file]) => [file, slug]),
)

// Pages that carry a `sourcePath` for reference but are DELIBERATELY
// hand-authored on the site (a friendlier / intentionally divergent version),
// so they are not auto-ported. Adding a slug here is a conscious decision; the
// alternative is to put it in MAP so it auto-syncs. Either way a sourcePath
// page must be accounted for: that is what stops silent drift.
const HAND_AUTHORED_SOURCEPATH = new Set([
  'getting-started/quick-start',
  'getting-started/troubleshooting',
  'auth/roles',
])

export function parseArgs(argv, cwd = process.cwd()) {
  const options = {
    check: false,
    packageDir: DEFAULT_PACKAGE_DIR,
    contentDir: DEFAULT_CONTENT_DIR,
  }
  const valued = { '--package-dir': 'packageDir', '--content-dir': 'contentDir' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--check') {
      options.check = true
      continue
    }
    const [flag, inline] = arg.split(/=(.*)/s)
    if (!(flag in valued)) throw new Error(`Unknown option: ${arg}`)
    const value = inline !== undefined ? inline : argv[++i]
    if (!value || value.startsWith('--')) throw new Error(`${flag} needs a path`)
    options[valued[flag]] = path.resolve(cwd, value)
  }
  return options
}

function githubUrl(repoPath, { image, directory }) {
  if (image) {
    return `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${repoPath}`
  }
  return `https://github.com/${GITHUB_REPO}/${directory ? 'tree' : 'blob'}/${GITHUB_BRANCH}/${repoPath}`
}

// Resolve one link target found in `sourceFile` (a path relative to the
// package docs). Returns the new target, or null to leave it as written
// (absolute URLs, site paths, in-page anchors, or a path that climbs out of
// the package repository).
export function resolveLinkTarget(target, sourceFile, { image = false } = {}) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/') || target.startsWith('#')) {
    return null
  }
  const hashAt = target.indexOf('#')
  const pathPart = hashAt === -1 ? target : target.slice(0, hashAt)
  const anchor = hashAt === -1 ? '' : target.slice(hashAt)
  if (!pathPart) return null

  const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile), pathPart))
  const slug = image ? undefined : INVERSE[resolved]
  if (slug) return `/docs/${slug}${anchor}`

  const repoPath = path.posix.normalize(path.posix.join('docs', resolved)).replace(/\/$/, '')
  if (repoPath === '..' || repoPath.startsWith('../') || repoPath === '.') return null
  return githubUrl(repoPath, { image, directory: pathPart.endsWith('/') }) + anchor
}

// Link text may wrap onto the next line; a code span may not.
const INLINE_LINK_RE = /(`[^`\n]*`)|(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g
const REFERENCE_DEF_RE = /^(\s{0,3}\[[^\]]+\]:\s+)(\S+)(.*)$/gm

function rewriteProse(chunk, sourceFile) {
  return chunk
    .replace(REFERENCE_DEF_RE, (whole, lead, target, rest) => {
      const next = resolveLinkTarget(target, sourceFile)
      return next ? `${lead}${next}${rest}` : whole
    })
    .replace(INLINE_LINK_RE, (whole, code, bang, text, target, title) => {
      if (code) return whole
      const next = resolveLinkTarget(target, sourceFile, { image: bang === '!' })
      return next ? `${bang}[${text}](${next}${title})` : whole
    })
}

// Rewrite the links of the prose between fenced blocks; fenced code is
// copied untouched.
export function rewriteLinks(md, sourceFile) {
  const out = []
  let prose = []
  let inFence = false
  const flush = () => {
    if (prose.length) out.push(rewriteProse(prose.join('\n'), sourceFile))
    prose = []
  }
  for (const line of md.split('\n')) {
    const isFence = /^\s{0,3}(```|~~~)/.test(line)
    if (inFence || isFence) {
      flush()
      out.push(line)
      if (isFence) inFence = !inFence
    } else {
      prose.push(line)
    }
  }
  flush()
  return out.join('\n')
}

// Self-closing void HTML elements that MDX rejects without a slash.
const VOID_ELEMENTS = ['br', 'hr', 'img', 'input', 'wbr', 'col', 'area', 'base', 'link', 'meta', 'source', 'track', 'embed']

export function escapeMdxHazards(md) {
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
        if (/\/>$/.test(whole)) return whole // already self-closed (e.g. <br />)
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

// The description is plain text (the search index shows it as an excerpt):
// drop link targets, emphasis markers, backticks and markdown escapes, keep
// their text.
export function plainText(md) {
  return md
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/`([^`]*)`|\\([\\`*_{}[\]()#+\-.!|<>~])/g, (whole, code, escaped) =>
      code !== undefined ? code : escaped,
    )
}

const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/

// The lines of a paragraph that come before its first markdown table (a
// `| ... |` row, a `---|---` separator, or the header row above one).
export function textBeforeTable(paragraph) {
  const lines = paragraph.split('\n')
  const kept = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*\|/.test(line) || TABLE_SEPARATOR_RE.test(line)) break
    if (lines[i + 1] !== undefined && TABLE_SEPARATOR_RE.test(lines[i + 1])) break
    kept.push(line)
  }
  return kept.join('\n').trim()
}

export function deriveTitleAndDescription(md) {
  // Title = first level-1 heading; description = first non-blockquote
  // non-empty paragraph after the title that isn't a heading, list,
  // code, HTML or table.
  const titleMatch = md.match(/^#\s+(.+?)\s*$/m)
  const title = titleMatch ? titleMatch[1] : 'Untitled'
  const afterTitle = titleMatch
    ? md.slice(titleMatch.index + titleMatch[0].length).trimStart()
    : md
  const paragraphs = afterTitle.split(/\n\s*\n/)
  let description = ''
  let inFence = false
  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue
    // A fenced block may span blank lines: skip every paragraph inside it.
    const fences = (trimmed.match(/^\s{0,3}(```|~~~)/gm) ?? []).length
    if (inFence || trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      if (fences % 2 === 1) inFence = !inFence
      continue
    }
    const text = textBeforeTable(trimmed)
    if (!text) continue
    // Skip blockquotes, headings, list items, HTML.
    if (/^[>#\-*]/.test(text)) continue
    if (text.startsWith('<')) continue
    description = plainText(text.replace(/\n/g, ' ')).slice(0, 280).trim()
    break
  }
  return { title, description }
}

// A YAML double-quoted scalar: `\` first, then `"`, so an escaped quote is
// not escaped twice.
export function yamlString(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\t/g, '\\t')}"`
}

// `sourceFile` is relative to the package docs folder (posix separators).
export function transformMarkdown(md, sourceFile) {
  const { title, description } = deriveTitleAndDescription(md)
  // Strip the duplicated H1 (we render the title from frontmatter).
  const body = md.replace(/^#\s+.+?\s*$/m, '').trimStart()
  const transformed = escapeMdxHazards(rewriteLinks(body, sourceFile))
  const frontmatter = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `sourcePath: ${yamlString(`martis-package/docs/${sourceFile}`)}`,
    '---',
    '',
    `# ${title}`,
    '',
  ].join('\n')
  return frontmatter + transformed + '\n'
}

function walkMdx(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walkMdx(full, visit)
    else if (entry.isFile() && full.endsWith('.mdx')) visit(full)
  }
}

function syncAll({ packageDocs, contentDir, check }) {
  let stale = 0
  for (const [slug, file] of Object.entries(MAP)) {
    const source = path.join(packageDocs, ...file.split('/'))
    if (!fs.existsSync(source)) {
      console.error(`SKIP ${slug}: source missing (${source})`)
      continue
    }
    const dest = path.join(contentDir, `${slug}.mdx`)
    const next = transformMarkdown(fs.readFileSync(source, 'utf8'), file)
    const prev = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : ''
    if (next === prev) continue
    if (check) {
      console.error(`STALE ${slug}`)
      stale++
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, next)
      console.log(`WROTE ${slug}`)
    }
  }
  return stale
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

function leakSweep(contentDir) {
  const offenders = []
  walkMdx(contentDir, (full) => {
    const value = fs.readFileSync(full, 'utf8')
    for (const { name, re } of FORBIDDEN_PATTERNS) {
      if (re.test(value)) offenders.push({ file: path.relative(ROOT, full), pattern: name })
    }
  })
  if (offenders.length) {
    console.error(`\n${offenders.length} leak(s) found in ${contentDir}:`)
    for (const o of offenders) {
      console.error(`  ✗ ${o.file} contains ${o.pattern}`)
    }
    console.error(
      '\nRefusing to ship: see Real-Edge-FX/martis-package#94 ' +
        'for the full list of forbidden patterns.',
    )
    return false
  }
  console.log(`✓ no forbidden patterns in ${contentDir}.`)
  return true
}

// Compile every MDX file (synced + hand-authored) through the same
// remark/rehype pipeline the runtime uses. Catches MDX syntax errors
// at sync time rather than letting them through to runtime as
// "ReferenceError: <thing> is not defined" when the bundle tries to
// evaluate a stray JSX expression.
async function validateAll(contentDir) {
  const all = []
  walkMdx(contentDir, (full) => all.push(full))

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
    return false
  }
  console.log(`✓ ${all.length} MDX file(s) compile cleanly.`)
  return true
}

// Guard against the "hand-authored page silently drifts" class of bug: any
// page that declares a `sourcePath` (i.e. is meant to mirror a
// martis-package/docs/*.md) MUST be in MAP (or HAND_AUTHORED_SOURCEPATH),
// or `pnpm sync-docs` never touches it and it falls behind the package doc
// without anyone noticing. Fail --check when a sourcePath page is not mapped.
function checkPortedPagesMapped(contentDir) {
  const unmapped = []
  walkMdx(contentDir, (full) => {
    const head = fs.readFileSync(full, 'utf8').slice(0, 800)
    const m = head.match(/^sourcePath:\s*["']?martis-package\/docs\/([^"'\n]+)["']?/m)
    if (!m) return
    const slug = path.relative(contentDir, full).split(path.sep).join('/').replace(/\.mdx$/, '')
    if (!(slug in MAP) && !HAND_AUTHORED_SOURCEPATH.has(slug)) {
      unmapped.push({ slug, source: m[1], rel: path.relative(ROOT, full) })
    }
  })

  if (unmapped.length) {
    console.error(`\n${unmapped.length} page(s) declare a sourcePath but are NOT in the porter MAP (they silently drift):`)
    for (const u of unmapped) {
      console.error(`  ✗ ${u.rel}: add '${u.slug}': '${u.source}' to MAP (auto-port) or to HAND_AUTHORED_SOURCEPATH (keep hand-authored) in scripts/sync-docs.mjs`)
    }
    return false
  }
  console.log('✓ every sourcePath page is in the porter MAP.')
  return true
}

// A relative `.md` link on the site is a 404: the pages live under
// /docs/<slug>. The porter rewrites every relative link, so one that
// survives sits in a hand-authored page that must use the /docs/<slug>
// form itself. Fenced code is ignored.
function checkRelativeMdLinks(contentDir) {
  const offenders = []
  walkMdx(contentDir, (full) => {
    let inFence = false
    fs.readFileSync(full, 'utf8').split('\n').forEach((line, index) => {
      if (/^\s{0,3}```/.test(line)) {
        inFence = !inFence
        return
      }
      if (inFence) return
      for (const m of line.matchAll(/\]\(([^)\s]+?\.md(?:#[^)\s]*)?)\)/g)) {
        if (/^[a-z]+:\/\//i.test(m[1])) continue
        offenders.push(`${path.relative(ROOT, full)}:${index + 1}: ${m[1]}`)
      }
    })
  })

  if (offenders.length) {
    console.error(`\n${offenders.length} relative .md link(s) that 404 on the site (use /docs/<slug>, or map the page):`)
    for (const o of offenders) console.error(`  ✗ ${o}`)
    return false
  }
  console.log(`✓ no relative .md links in ${contentDir}.`)
  return true
}

export async function main(argv = process.argv.slice(2)) {
  const { check, packageDir, contentDir } = parseArgs(argv)
  const packageDocs = path.join(packageDir, 'docs')
  if (!fs.existsSync(packageDocs) || !fs.statSync(packageDocs).isDirectory()) {
    throw new Error(`--package-dir: no docs/ folder in ${packageDir}`)
  }
  fs.mkdirSync(contentDir, { recursive: true })

  const stale = syncAll({ packageDocs, contentDir, check })
  if (!leakSweep(contentDir)) return 3
  if (!(await validateAll(contentDir))) return 2
  const portedMapOk = checkPortedPagesMapped(contentDir)
  const linksOk = checkRelativeMdLinks(contentDir)

  if (check && (stale > 0 || !portedMapOk || !linksOk)) {
    if (stale > 0) console.error(`\n${stale} doc(s) stale: run \`pnpm sync-docs\` to update.`)
    return 1
  }
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    process.exitCode = await main()
  } catch (err) {
    console.error(err.message)
    process.exitCode = 1
  }
}
