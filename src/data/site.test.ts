import { describe, expect, it } from 'vitest'
import { VERSION } from '@/data/landing'
import { RELEASE } from '@/data/site'

describe('release metadata', () => {
  it('points every public release label at Martis v2.0.0', () => {
    expect(RELEASE.version).toBe('2.0.0')
    expect(VERSION).toBe(`v${RELEASE.version}`)
  })
})
