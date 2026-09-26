import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseReadmeTotal, readSiteRelease, writeSiteRelease } from './release-stats.mjs'

const SITE = `import type { IconName } from '@/components/icons'

export const RELEASE = {
  version: '2.0.0',
  tests: 4945,
  php: 'PHP 8.3+',
  laravel: 'Laravel 12–13',
  downloads: 192,
  monthlyDownloads: 127,
  statsFetchedAt: '2026-09-25',
} as const
`

test('reads the README total, grouped or not', () => {
  assert.equal(parseReadmeTotal('x\n- **Test coverage** — 4032 Pest + 1109 Vitest = **5141 passing**, 0 failing\n'), 5141)
  assert.equal(parseReadmeTotal('- **Test coverage** — a = **5,141 passing**\n'), 5141)
})

test('refuses a README without exactly one total', () => {
  assert.throws(() => parseReadmeTotal('no coverage line'), /expected one/)
  assert.throws(() => parseReadmeTotal('- **Test coverage** — x\n- **Test coverage** — y\n'), /found 2/)
  assert.throws(() => parseReadmeTotal('- **Test coverage** — = **51,41 passing**\n'), /no "= \*\*N passing\*\*"/)
})

test('rewrites only the owned RELEASE fields', () => {
  const out = writeSiteRelease(SITE, { version: '2.0.1', tests: 5141, downloads: 200, monthlyDownloads: 130, statsFetchedAt: '2026-09-26' })
  assert.deepEqual(readSiteRelease(out), { version: '2.0.1', tests: 5141, downloads: 200, monthlyDownloads: 130, statsFetchedAt: '2026-09-26' })
  assert.match(out, /php: 'PHP 8\.3\+'/)
  assert.match(out, /laravel: 'Laravel 12–13'/)
})

test('fails when a field is missing instead of skipping it', () => {
  assert.throws(() => writeSiteRelease(SITE.replace("  tests: 4945,\n", ''), { version: '2.0.1', tests: 1, downloads: 1, monthlyDownloads: 1, statsFetchedAt: 'x' }), /RELEASE\.tests not found/)
})
