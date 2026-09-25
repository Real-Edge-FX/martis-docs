import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { compile } from '@mdx-js/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import {
  DEFAULT_CONTENT_DIR,
  DEFAULT_PACKAGE_DIR,
  deriveTitleAndDescription,
  parseArgs,
  rewriteLinks,
  transformMarkdown,
  yamlString,
} from './sync-docs.mjs'

const BLOB = 'https://github.com/Real-Edge-FX/martis-package/blob/main'

async function frontmatterOf(mdx) {
  const file = await compile(mdx, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkGfm, remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
  })
  const code = String(file.value)
  const runtime = { Fragment: Symbol('f'), jsx: () => null, jsxs: () => null }
  return new Function(code)(runtime).frontmatter
}

// 1. YAML frontmatter escaping.

test('yamlString escapes backslashes before quotes', () => {
  assert.equal(yamlString('App\\Models\\User'), '"App\\\\Models\\\\User"')
  assert.equal(yamlString('say "hi"'), '"say \\"hi\\""')
  assert.equal(yamlString('a \\"b'), '"a \\\\\\"b"')
})

test('a description with backslashes and quotes survives a YAML round trip', async () => {
  const md = '# Models\n\nBind `App\\Models\\User` to the "users" resource.\n'
  const fm = await frontmatterOf(transformMarkdown(md, 'resources.md'))
  assert.equal(fm.title, 'Models')
  assert.equal(fm.description, 'Bind App\\Models\\User to the "users" resource.')
})

test('transformed pages end with exactly one newline', () => {
  const out = transformMarkdown('# Page\n\nBody.\n\n', 'page.md')
  assert.match(out, /Body\.\n$/)
  assert.doesNotMatch(out, /\n\n$/)
})

// 2. Links.

test('links between synced pages stay site links, with anchors', () => {
  const out = rewriteLinks('See [fields](fields.md#text) and [api](api/overview.md).', 'resources.md')
  assert.equal(out, 'See [fields](/docs/core/fields#text) and [api](/docs/reference/api).')
})

test('links out of the synced docs become GitHub URLs', () => {
  const out = rewriteLinks(
    '[src](../src/Fields/Text.php) [log](../CHANGELOG.md#v2) [plan](superpowers/plans/x.md) [dir](../src/Fields/)',
    'fields.md',
  )
  assert.equal(
    out,
    `[src](${BLOB}/src/Fields/Text.php) [log](${BLOB}/CHANGELOG.md#v2) ` +
      `[plan](${BLOB}/docs/superpowers/plans/x.md) ` +
      '[dir](https://github.com/Real-Edge-FX/martis-package/tree/main/src/Fields)',
  )
})

test('links resolve against the folder of a nested doc', () => {
  const out = rewriteLinks('[f](../fields.md) [c](../../composer.json)', 'api/overview.md')
  assert.equal(out, `[f](/docs/core/fields) [c](${BLOB}/composer.json)`)
})

test('images use raw URLs; absolute, site and anchor links are kept', () => {
  const md = '![shot](img/a.png) [x](https://example.com) [y](/docs/core/fields) [z](#top) [w](mailto:a@b.c)'
  assert.equal(
    rewriteLinks(md, 'fields.md'),
    '![shot](https://raw.githubusercontent.com/Real-Edge-FX/martis-package/main/docs/img/a.png) ' +
      '[x](https://example.com) [y](/docs/core/fields) [z](#top) [w](mailto:a@b.c)',
  )
})

test('links in code, and paths leaving the repository, are left alone', () => {
  const md = ['`[a](../src/A.php)`', '```', '[b](../src/B.php)', '```', '[c](../../../outside.md)'].join('\n')
  assert.equal(rewriteLinks(md, 'fields.md'), md)
})

test('link text that wraps onto the next line is rewritten', () => {
  assert.equal(
    rewriteLinks('See [Declarative query\nscopes](authorization.md#scopes).', 'relationships.md'),
    'See [Declarative query\nscopes](/docs/auth/authorization#scopes).',
  )
})

test('reference-style link definitions are rewritten too', () => {
  assert.equal(
    rewriteLinks('[src]: ../src/Martis.php "Martis"', 'fields.md'),
    `[src]: ${BLOB}/src/Martis.php "Martis"`,
  )
})

// 3. --package-dir option.

test('parseArgs defaults to the sibling package and src/content', () => {
  assert.deepEqual(parseArgs([]), {
    check: false,
    packageDir: DEFAULT_PACKAGE_DIR,
    contentDir: DEFAULT_CONTENT_DIR,
  })
  assert.equal(path.basename(DEFAULT_PACKAGE_DIR), 'martis-package')
})

test('parseArgs reads --package-dir and --content-dir in both forms', () => {
  const opts = parseArgs(['--check', '--package-dir', 'pkg', '--content-dir=/tmp/out'], '/work')
  assert.deepEqual(opts, { check: true, packageDir: '/work/pkg', contentDir: '/tmp/out' })
})

test('parseArgs rejects unknown options and a missing path', () => {
  assert.throws(() => parseArgs(['--pkg', 'x']), /Unknown option/)
  assert.throws(() => parseArgs(['--package-dir']), /needs a path/)
  assert.throws(() => parseArgs(['--package-dir', '--check']), /needs a path/)
})

// 4. Nested sourcePath.

test('a nested doc keeps its subfolder in sourcePath', () => {
  const out = transformMarkdown('# API\n\nThe HTTP API.\n', 'api/overview.md')
  assert.match(out, /^sourcePath: "martis-package\/docs\/api\/overview\.md"$/m)
})

// 5. Tables never leak into the description.

test('a page that starts with a table takes the next paragraph', () => {
  const md = '# Fields\n\n| Field | Type |\n|---|---|\n| name | Text |\n\nFields describe columns.\n'
  assert.equal(deriveTitleAndDescription(md).description, 'Fields describe columns.')
})

test('text followed by a table keeps only the text', () => {
  const md = '# Cache\n\nThe cache keys are:\n| Key | TTL |\n| --- | --- |\n| a | 1 |\n'
  assert.equal(deriveTitleAndDescription(md).description, 'The cache keys are:')
})

test('a pipe-less table is skipped too', () => {
  const md = '# T\n\nKey | Value\n--- | ---\na | b\n\nReal description.\n'
  assert.equal(deriveTitleAndDescription(md).description, 'Real description.')
})

test('a fenced block with blank lines is skipped whole', () => {
  const md = '# T\n\n```php\n$a = 1;\n\n$b = 2;\n```\n\nAfter the code.\n'
  assert.equal(deriveTitleAndDescription(md).description, 'After the code.')
})
