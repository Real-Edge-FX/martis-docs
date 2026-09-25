// Static checks over lighthouserc.cjs, the Lighthouse CI budgets for the
// three marketing pages. The spec budgets LCP, CLS and INP (INP is a field
// metric, out of a lab tool's reach), plus the accessibility and SEO
// scores. Each budget is asserted against the median run: LHCI's default
// aggregation (`optimistic`, @lhci/utils src/assertions.js) instead
// asserts the most favorable of the runs, so one lucky run out of five
// would pass a page whose typical load misses the budget.
//
// Run via `pnpm test:prerender`.
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const config = require('../lighthouserc.cjs')
const assertions = config.ci.assert.assertions

const BUDGETED = [
  'largest-contentful-paint',
  'cumulative-layout-shift',
  'categories:accessibility',
  'categories:seo',
]

test('asserts exactly the spec budgets, and no time-to-interactive gate', () => {
  assert.deepEqual(Object.keys(assertions).sort(), [...BUDGETED].sort())
})

test('holds every budget as an error against the median run', () => {
  for (const id of BUDGETED) {
    const [level, options] = assertions[id]
    assert.equal(level, 'error', `${id} must fail the build`)
    assert.equal(options.aggregationMethod, 'median-run', `${id} must be asserted against the median run`)
  }
})

test('keeps the spec thresholds', () => {
  assert.equal(assertions['largest-contentful-paint'][1].maxNumericValue, 2500)
  assert.equal(assertions['cumulative-layout-shift'][1].maxNumericValue, 0.1)
  assert.equal(assertions['categories:accessibility'][1].minScore, 0.95)
  assert.equal(assertions['categories:seo'][1].minScore, 0.95)
})

test('collects enough runs for a median', () => {
  assert.ok(config.ci.collect.numberOfRuns >= 3 && config.ci.collect.numberOfRuns % 2 === 1)
})
