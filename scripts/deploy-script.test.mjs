// Static checks over scripts/deploy.sh. The script publishes to
// production, so it is never executed by a test: these assertions read
// its source and pin the order of its gates instead.
//
// Run via `pnpm test:prerender`.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const script = readFileSync(new URL('./deploy.sh', import.meta.url), 'utf8')
  .split('\n')
  .filter((line) => !/^\s*#/.test(line))
  .join('\n')

/** Offset of the first match of `pattern` in the script, failing when absent. */
function indexOf(pattern, what) {
  const match = pattern.exec(script)
  assert.ok(match, `deploy.sh must contain ${what}`)
  return match.index
}

const cleanTreeGuard = () => indexOf(/if \[ -n "\$\(git status --porcelain\)" \]; then[\s\S]*?exit 1[\s\S]*?\nfi/, 'a clean-tree guard that exits')
const build = () => indexOf(/"\$\{PNPM\[@\]\}" build\n/, 'the build')
const smoke = () => indexOf(/"\$\{PNPM\[@\]\}" smoke:dist\n/, 'the dist smoke check')
const firstPublish = () => indexOf(/rsync /, 'an rsync publish')

test('deploy.sh refuses a dirty working tree before it builds anything', () => {
  assert.ok(cleanTreeGuard() < build())
})

test('deploy.sh runs the dist smoke check after the build and before publishing', () => {
  assert.ok(build() < smoke())
  assert.ok(smoke() < firstPublish())
})

test('deploy.sh probes a page-less directory for 404 and a trailing-slash URL for 301', () => {
  assert.match(script, /"\/docs\/core 404"/)
  assert.match(script, /"\/product\/ 301"/)
})
