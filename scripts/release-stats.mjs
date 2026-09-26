#!/usr/bin/env node
// release-stats.mjs: the numbers the site shows about Martis, read from
// their sources instead of typed by hand.
//
//   version            latest GitHub release of martis-package (not a
//                      prerelease, not a 1.x patch marked "not latest")
//   tests              the README "Test coverage" total at that tag
//   downloads/monthly  Packagist `martis/martis`
//
// Usage:
//   node scripts/release-stats.mjs            print the numbers as JSON
//   node scripts/release-stats.mjs --check    exit 1 when src/data/site.ts
//                                             disagrees on version or tests
//   node scripts/release-stats.mjs --write    write them into src/data/site.ts
//
// scripts/deploy.sh runs --write before the build and restores the file
// afterwards, so a deploy always publishes the current numbers. Any source
// that does not answer fails the run: there is no fallback to old values.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = 'Real-Edge-FX/martis-package'
export const PACKAGE = 'martis/martis'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SITE_TS = path.join(ROOT, 'src/data/site.ts')

/** The "= **N passing**" total of the README's single "- **Test coverage**" line. */
export function parseReadmeTotal(readme) {
  const lines = readme.split('\n').filter((l) => /^- \*\*Test coverage\*\*/.test(l))
  if (lines.length !== 1) {
    throw new Error(`README: expected one "- **Test coverage**" line, found ${lines.length}`)
  }
  const m = lines[0].match(/= \*\*([0-9][0-9,]*) passing\*\*/)
  if (!m || !/^([0-9]+|[0-9]{1,3}(,[0-9]{3})+)$/.test(m[1])) {
    throw new Error(`README: no "= **N passing**" total in: ${lines[0]}`)
  }
  return Number(m[1].replace(/,/g, ''))
}

/** Read the RELEASE fields this script owns from site.ts. */
export function readSiteRelease(src) {
  const block = src.match(/export const RELEASE = \{([\s\S]*?)\} as const/)
  if (!block) throw new Error('site.ts: no `export const RELEASE = { ... } as const` block')
  const str = (k) => block[1].match(new RegExp(`\\n\\s*${k}: '([^']*)'`))?.[1]
  const num = (k) => {
    const v = block[1].match(new RegExp(`\\n\\s*${k}: ([0-9_]+)`))?.[1]
    return v === undefined ? undefined : Number(v.replace(/_/g, ''))
  }
  return {
    version: str('version'),
    tests: num('tests'),
    downloads: num('downloads'),
    monthlyDownloads: num('monthlyDownloads'),
    statsFetchedAt: str('statsFetchedAt'),
  }
}

/** Replace the owned RELEASE fields in site.ts; every field must be present. */
export function writeSiteRelease(src, stats) {
  let out = src
  const set = (k, value, quoted) => {
    const re = new RegExp(`(export const RELEASE = \\{[\\s\\S]*?\\n\\s*${k}: )(${quoted ? "'[^']*'" : '[0-9_]+'})`)
    if (!re.test(out)) throw new Error(`site.ts: RELEASE.${k} not found`)
    out = out.replace(re, `$1${quoted ? `'${value}'` : String(value)}`)
  }
  set('version', stats.version, true)
  set('tests', stats.tests, false)
  set('downloads', stats.downloads, false)
  set('monthlyDownloads', stats.monthlyDownloads, false)
  set('statsFetchedAt', stats.statsFetchedAt, true)
  return out
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'martis-docs-release-stats' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.json()
}

async function getText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'martis-docs-release-stats' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  return res.text()
}

export async function fetchReleaseStats(now = new Date()) {
  const release = await getJson(`https://api.github.com/repos/${REPO}/releases/latest`)
  const tag = release?.tag_name
  if (typeof tag !== 'string' || !/^v\d+\.\d+\.\d+$/.test(tag)) {
    throw new Error(`GitHub: unexpected latest release tag ${JSON.stringify(tag)}`)
  }
  const readme = await getText(`https://raw.githubusercontent.com/${REPO}/${tag}/README.md`)
  const pkg = await getJson(`https://packagist.org/packages/${PACKAGE}.json`)
  const dl = pkg?.package?.downloads
  if (!Number.isInteger(dl?.total) || !Number.isInteger(dl?.monthly)) {
    throw new Error('Packagist: no downloads.total / downloads.monthly')
  }
  return {
    version: tag.slice(1),
    tests: parseReadmeTotal(readme),
    downloads: dl.total,
    monthlyDownloads: dl.monthly,
    statsFetchedAt: now.toISOString().slice(0, 10),
  }
}

async function main(argv) {
  const stats = await fetchReleaseStats()
  const src = fs.readFileSync(SITE_TS, 'utf8')
  if (argv.includes('--write')) {
    fs.writeFileSync(SITE_TS, writeSiteRelease(src, stats))
    console.log(`site.ts RELEASE: v${stats.version}, ${stats.tests} tests, ${stats.downloads} installs (${stats.monthlyDownloads}/month), ${stats.statsFetchedAt}`)
    return 0
  }
  if (argv.includes('--check')) {
    const site = readSiteRelease(src)
    const wrong = ['version', 'tests'].filter((k) => site[k] !== stats[k])
    for (const k of wrong) console.error(`✗ site.ts RELEASE.${k} is ${site[k]}, the source says ${stats[k]}`)
    if (wrong.length) {
      console.error('  Run `node scripts/release-stats.mjs --write` and open a PR.')
      return 1
    }
    console.log(`✓ site.ts matches v${stats.version} and ${stats.tests} tests`)
    return 0
  }
  console.log(JSON.stringify(stats, null, 2))
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      console.error(`✗ release-stats: ${err.message}`)
      process.exit(1)
    },
  )
}
