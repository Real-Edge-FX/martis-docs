import { describe, expect, it } from 'vitest'
import { RELEASE } from '@/data/site'

describe('release metadata', () => {
  it('points every public release label at Martis v2.0.1', () => {
    expect(RELEASE.version).toBe('2.0.1')
  })
})
