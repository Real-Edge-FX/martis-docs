import { describe, expect, it } from 'vitest'
import { RELEASE } from '@/data/site'

// The deploy writes RELEASE from the latest martis-package release
// (scripts/release-stats.mjs); the committed values only have to be well formed.
describe('release metadata', () => {
  it('holds a release version and positive counts', () => {
    expect(RELEASE.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(RELEASE.tests).toBeGreaterThan(0)
    expect(RELEASE.downloads).toBeGreaterThan(0)
  })
})
