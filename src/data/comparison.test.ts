import { describe, expect, it } from 'vitest'
import { COMPARISON_CRITERIA, COMPARISON_PRODUCTS } from './comparison'

describe('comparison data', () => {
  it('provides a substantial and complete decision matrix', () => {
    expect(COMPARISON_CRITERIA.length).toBeGreaterThanOrEqual(10)
    for (const criterion of COMPARISON_CRITERIA) {
      expect(criterion.label).toBeTruthy()
      expect(criterion.implication).toBeTruthy()
      expect(criterion.martis).toBeTruthy()
      expect(criterion.nova).toBeTruthy()
      expect(criterion.filament).toBeTruthy()
    }
  })

  it('contains detailed analysis for both alternatives', () => {
    for (const product of Object.values(COMPARISON_PRODUCTS)) {
      expect(product.sections.length).toBeGreaterThanOrEqual(4)
      expect(product.faq.length).toBeGreaterThanOrEqual(3)
    }
  })
})
