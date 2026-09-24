// Proves scripts/build-search-index.mjs is deterministic: running it
// twice against the same src/content produces a byte-identical
// public/search-index.json, so two builds of the same commit never
// differ (the previous payload embedded `new Date().toISOString()`,
// which changes on every run no matter what content did).
//
// Run via `pnpm test:prerender` (never picked up by Vitest: see the
// comment in vitest.config.ts for why scripts/** is excluded).
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPT = path.join(ROOT, 'scripts', 'build-search-index.mjs')
const OUTPUT = path.join(ROOT, 'public', 'search-index.json')

test('produces a byte-identical file on two consecutive runs', () => {
  execFileSync(process.execPath, [SCRIPT], { cwd: ROOT })
  const first = readFileSync(OUTPUT, 'utf8')

  execFileSync(process.execPath, [SCRIPT], { cwd: ROOT })
  const second = readFileSync(OUTPUT, 'utf8')

  assert.equal(second, first)
})

test('the output has no build timestamp (the field that made it non-deterministic)', () => {
  execFileSync(process.execPath, [SCRIPT], { cwd: ROOT })
  const payload = JSON.parse(readFileSync(OUTPUT, 'utf8'))

  assert.equal('builtAt' in payload, false)
  assert.ok(Array.isArray(payload.entries) && payload.entries.length > 0)
})
