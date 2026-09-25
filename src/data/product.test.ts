import { describe, expect, it } from 'vitest'
import { PRODUCT_CHAPTERS, PRODUCT_CHAPTER_IDS, PRODUCT_MEDIA } from './product'

describe('PRODUCT_CHAPTERS', () => {
  it('defines exactly the six chapters from the design spec, in order', () => {
    expect(PRODUCT_CHAPTERS.map((chapter) => chapter.id)).toEqual(PRODUCT_CHAPTER_IDS)
    expect(PRODUCT_CHAPTER_IDS).toEqual(['model', 'operate', 'secure', 'adapt', 'extend', 'ship'])
  })

  it('gives every chapter a title, outcome, agency scenario, docs link, media and code sample', () => {
    for (const chapter of PRODUCT_CHAPTERS) {
      expect(chapter.title).toBeTruthy()
      expect(chapter.outcome).toBeTruthy()
      expect(chapter.agencyScenario).toBeTruthy()
      expect(chapter.docsHref.startsWith('/docs/')).toBe(true)
      expect(chapter.code.source).toBeTruthy()
      expect(chapter.code.filename).toBeTruthy()
      expect(['php', 'tsx', 'bash']).toContain(chapter.code.language)
      // mediaId must resolve to a real, typed media entry.
      expect(PRODUCT_MEDIA[chapter.mediaId]).toBeDefined()
    }
  })

  it('points every media entry at real pixel dimensions', () => {
    for (const media of Object.values(PRODUCT_MEDIA)) {
      expect(media.width).toBeGreaterThan(0)
      expect(media.height).toBeGreaterThan(0)
      expect(media.src.startsWith('/screenshots/')).toBe(true)
      expect(media.alt).toBeTruthy()
    }
  })
})
