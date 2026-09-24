// Unit tests for the pure pieces of scripts/sync-docs.mjs: link rewriting,
// the relative-link guard and CLI argument parsing, exercised directly
// instead of only through a real `pnpm sync-docs` against a package
// checkout. Importing sync-docs.mjs must never touch the filesystem or
// call process.exit (see that file's header comment for the entry-point
// guard that makes this safe) — that is what lets this file require
// nothing but the module itself.
//
// Run via `pnpm test:prerender` (never picked up by Vitest: see
// scripts/prerender-unit.test.mjs for why scripts/** is excluded).
import assert from 'node:assert/strict'
import test from 'node:test'
import { findRelativeLinkOffenders, parseArgs, rewriteLinks, transform } from './sync-docs.mjs'

const REPO = 'https://github.com/Real-Edge-FX/martis-package'

// --- rewriteLinks ---------------------------------------------------------

test('rewriteLinks points a same-folder docs-page link at its slug', () => {
  const out = rewriteLinks('[Fields](fields.md)', 'differentials.md')
  assert.equal(out, '[Fields](/docs/core/fields)')
})

test('rewriteLinks keeps the anchor on a docs-page link', () => {
  const out = rewriteLinks('[BelongsTo](fields.md#belongsto)', 'differentials.md')
  assert.equal(out, '[BelongsTo](/docs/core/fields#belongsto)')
})

test('rewriteLinks resolves a docs-page link against the linking page\'s own folder', () => {
  // api/overview.md is one folder below docs/, so "../fields.md" from there
  // is the same target as "fields.md" from a top-level page.
  const out = rewriteLinks('[Fields](../fields.md)', 'api/overview.md')
  assert.equal(out, '[Fields](/docs/core/fields)')
})

test('rewriteLinks rewrites a package source-file link to GitHub (fields.md case)', () => {
  const out = rewriteLinks(
    '[`ResolvesInitialsPayload`](../src/Fields/Concerns/ResolvesInitialsPayload.php)',
    'fields.md',
  )
  assert.equal(
    out,
    `[\`ResolvesInitialsPayload\`](${REPO}/blob/main/src/Fields/Concerns/ResolvesInitialsPayload.php)`,
  )
})

test('rewriteLinks rewrites a package source-file link to GitHub (preferences.md case)', () => {
  const out = rewriteLinks('[app.tsx](../resources/js/app.tsx)', 'preferences.md')
  assert.equal(out, `[app.tsx](${REPO}/blob/main/resources/js/app.tsx)`)
})

test('rewriteLinks uses tree/main for a directory target (trailing slash)', () => {
  const out = rewriteLinks('[Concerns](../src/Fields/Concerns/)', 'fields.md')
  assert.equal(out, `[Concerns](${REPO}/tree/main/src/Fields/Concerns/)`)
})

test('rewriteLinks keeps a line anchor on a rewritten source-file link', () => {
  const out = rewriteLinks('[Line 10](../src/Foo.php#L10-L20)', 'fields.md')
  assert.equal(out, `[Line 10](${REPO}/blob/main/src/Foo.php#L10-L20)`)
})

test('rewriteLinks sends an unmapped in-repo doc link to GitHub too', () => {
  // release-process.md exists under docs/ but is deliberately excluded from
  // MAP/LINK_ONLY (dev-only): it is "inside the package repository but
  // outside the mapped docs pages", same bucket as a source file.
  const out = rewriteLinks('[Process](release-process.md)', 'fields.md')
  assert.equal(out, `[Process](${REPO}/blob/main/docs/release-process.md)`)
})

test('rewriteLinks leaves an absolute URL untouched', () => {
  const md = '[External](https://example.com/fields.md)'
  assert.equal(rewriteLinks(md, 'fields.md'), md)
})

test('rewriteLinks leaves a mailto: link untouched', () => {
  const md = '[Support](mailto:support@example.com)'
  assert.equal(rewriteLinks(md, 'fields.md'), md)
})

test('rewriteLinks leaves a site-absolute path untouched', () => {
  const md = '[Fields](/docs/core/fields)'
  assert.equal(rewriteLinks(md, 'differentials.md'), md)
})

test('rewriteLinks leaves a pure anchor untouched', () => {
  const md = '[Jump](#some-section)'
  assert.equal(rewriteLinks(md, 'fields.md'), md)
})

test('rewriteLinks throws, naming the file and line, when a target escapes the package root', () => {
  const md = 'para one\n\n[Outside](../../outside.md)\n'
  assert.throws(
    () => rewriteLinks(md, 'fields.md'),
    /fields\.md:3.*escapes the package root/,
  )
})

test('rewriteLinks leaves a relative link inside a fenced code block untouched, rewrites the same link outside', () => {
  const md = [
    '```md',
    '[Fields](fields.md)',
    '```',
    '',
    '[Fields](fields.md)',
  ].join('\n')
  const lines = rewriteLinks(md, 'differentials.md').split('\n')
  assert.equal(lines[1], '[Fields](fields.md)')
  assert.equal(lines[4], '[Fields](/docs/core/fields)')
})

test('rewriteLinks does not throw on an escaping-looking target inside a fenced code block', () => {
  const md = ['```md', '[Outside](../../outside.md)', '```'].join('\n')
  assert.doesNotThrow(() => rewriteLinks(md, 'fields.md'))
})

test('rewriteLinks still rewrites a link whose text wraps onto the next line', () => {
  // Regression: overrides.md hard-wraps prose, so a real link's `[text]`
  // regularly spans a line break, e.g.
  //   see [Refreshing the extension scaffold after an
  //   upgrade](installation-guide.md#refreshing-the-extension-scaffold-after-an-upgrade).
  // A naive line-by-line fence check (splitting `md` into lines before
  // matching LINK_RE per line) breaks the `[`/`]` pair apart and leaves
  // this kind of link completely unrewritten.
  const md = [
    'See [Refreshing the extension scaffold after an',
    'upgrade](installation-guide.md#refreshing-the-extension-scaffold-after-an-upgrade).',
  ].join('\n')
  const out = rewriteLinks(md, 'overrides.md')
  assert.match(
    out,
    /\[Refreshing the extension scaffold after an\nupgrade\]\(\/docs\/getting-started\/installation#refreshing-the-extension-scaffold-after-an-upgrade\)\./,
  )
})

// --- transform --------------------------------------------------------

test('transform writes sourcePath relative to the package docs folder, not just the basename', () => {
  // A nested source keeps its folder ("api/") in the frontmatter.
  const md = '# Overview\n\nSome body text.\n'
  const out = transform(md, 'api/overview.md')
  assert.match(out, /sourcePath: "martis-package\/docs\/api\/overview\.md"/)
})

test('transform writes a top-level sourcePath unchanged (no folder to lose)', () => {
  const md = '# Fields\n\nSome body text.\n'
  const out = transform(md, 'fields.md')
  assert.match(out, /sourcePath: "martis-package\/docs\/fields\.md"/)
})

// --- findRelativeLinkOffenders --------------------------------------------

test('findRelativeLinkOffenders catches a relative markdown link', () => {
  const offenders = findRelativeLinkOffenders('See [Guide](../foo.md) for more.\n')
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].line, 1)
  assert.equal(offenders[0].target, '../foo.md')
})

test('findRelativeLinkOffenders catches a relative image target', () => {
  const offenders = findRelativeLinkOffenders('![Diagram](./diagram.png)\n')
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].target, './diagram.png')
})

test('findRelativeLinkOffenders catches a relative href in inline HTML', () => {
  const offenders = findRelativeLinkOffenders('<a href="../page.html">link</a>\n')
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].target, '../page.html')
})

test('findRelativeLinkOffenders catches a relative src in inline HTML', () => {
  const offenders = findRelativeLinkOffenders('<img src="./pic.png" />\n')
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].target, './pic.png')
})

test('findRelativeLinkOffenders catches href/src regardless of attribute case', () => {
  const offenders = findRelativeLinkOffenders('<a HREF="../page.html">x</a>\n<img SRC=\'./pic.png\'>\n')
  assert.equal(offenders.length, 2)
  assert.equal(offenders[0].target, '../page.html')
  assert.equal(offenders[1].target, './pic.png')
})

test('findRelativeLinkOffenders reports the offending line number', () => {
  const content = 'line one\nline two\n[Bad](../oops.md)\nline four\n'
  const offenders = findRelativeLinkOffenders(content)
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].line, 3)
})

test('findRelativeLinkOffenders leaves absolute, site-absolute, anchor-only and mailto: targets alone', () => {
  const content = [
    '[Ext](https://example.com/x)',
    '[Site](/docs/core/fields)',
    '[Jump](#section)',
    '[Mail](mailto:a@b.com)',
    '<a href="/docs/core/fields">home</a>',
  ].join('\n')
  assert.deepEqual(findRelativeLinkOffenders(content), [])
})

test('findRelativeLinkOffenders ignores fenced code blocks', () => {
  const content = [
    '```md',
    '[Bad](../oops.md)',
    '```',
    '[AlsoBad](../oops-for-real.md)',
  ].join('\n')
  const offenders = findRelativeLinkOffenders(content)
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].target, '../oops-for-real.md')
})

// --- parseArgs --------------------------------------------------------

test('parseArgs defaults to --check off and <cwd>/../martis-package', () => {
  const { isCheckMode, packageDir } = parseArgs([], {}, '/work/martis-docs')
  assert.equal(isCheckMode, false)
  assert.equal(packageDir, '/work/martis-package')
})

test('parseArgs turns on check mode for --check', () => {
  const { isCheckMode } = parseArgs(['--check'], {}, '/work/martis-docs')
  assert.equal(isCheckMode, true)
})

test('parseArgs resolves --package-dir against the given cwd', () => {
  const { packageDir } = parseArgs(['--package-dir', '../scratch/pkg'], {}, '/work/sub')
  assert.equal(packageDir, '/work/scratch/pkg')
})

test('parseArgs falls back to MARTIS_PACKAGE_DIR when no flag is given', () => {
  const { packageDir } = parseArgs([], { MARTIS_PACKAGE_DIR: '/env/pkg' }, '/work')
  assert.equal(packageDir, '/env/pkg')
})

test('parseArgs prefers --package-dir over MARTIS_PACKAGE_DIR when both are set', () => {
  const { packageDir } = parseArgs(
    ['--check', '--package-dir', '/flag/pkg'],
    { MARTIS_PACKAGE_DIR: '/env/pkg' },
    '/work',
  )
  assert.equal(packageDir, '/flag/pkg')
})

test('findRelativeLinkOffenders still catches a link whose text wraps onto the next line', () => {
  // Same multi-line-prose shape as the rewriteLinks regression above,
  // but as a raw offender that never went through rewriteLinks (e.g. a
  // hand-authored page): a per-line scan would split the `[`/`]` pair
  // across two lines and miss it entirely.
  const content = [
    'See [Refreshing the extension scaffold after an',
    'upgrade](../installation-guide.md#refreshing-the-extension-scaffold-after-an-upgrade).',
  ].join('\n')
  const offenders = findRelativeLinkOffenders(content)
  assert.equal(offenders.length, 1)
  assert.equal(offenders[0].target, '../installation-guide.md#refreshing-the-extension-scaffold-after-an-upgrade')
})

// --- URL schemes ------------------------------------------------------

test('findRelativeLinkOffenders reports a link with any scheme other than http(s) or mailto', () => {
  const content = [
    '[Run](javascript:void)',
    '[Data](data:text/html,hi)',
    '[Old](ftp://example.com/x)',
    '<a href="vbscript:msgbox">x</a>',
    "<img src='file:///etc/passwd'>",
  ].join('\n')
  assert.deepEqual(
    findRelativeLinkOffenders(content).map(({ target }) => target),
    ['javascript:void', 'data:text/html,hi', 'ftp://example.com/x', 'vbscript:msgbox', 'file:///etc/passwd'],
  )
})

test('findRelativeLinkOffenders accepts http:, https: and mailto: in any case', () => {
  const content = ['[A](http://example.com)', '[B](HTTPS://example.com)', '[C](MailTo:a@b.com)'].join('\n')
  assert.deepEqual(findRelativeLinkOffenders(content), [])
})

test('rewriteLinks leaves a link with another scheme untouched, for the offender check to report', () => {
  const md = '[Run](javascript:void)'
  assert.equal(rewriteLinks(md, 'fields.md'), md)
})
