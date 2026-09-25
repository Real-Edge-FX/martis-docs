import { describe, expect, it } from 'vitest'
import { formatLaravelRequirement, formatPhpRequirement, loadReleaseManifest } from '@/lib/generated-data'
import { PRODUCT_CHAPTERS, PRODUCT_CHAPTER_IDS, PRODUCT_MEDIA, type ProductChapterId } from './product'

const chapter = (id: ProductChapterId) => PRODUCT_CHAPTERS.find((entry) => entry.id === id)!

describe('PRODUCT_CHAPTERS', () => {
  it('defines exactly the six chapters from the design spec, in order', () => {
    expect(PRODUCT_CHAPTERS.map((chapter) => chapter.id)).toEqual(PRODUCT_CHAPTER_IDS)
    expect(PRODUCT_CHAPTER_IDS).toEqual(['model', 'operate', 'secure', 'adapt', 'extend', 'ship'])
  })

  it('gives every chapter a title, outcome, agency scenario, docs link, media, code sample and prerequisite', () => {
    for (const chapter of PRODUCT_CHAPTERS) {
      expect(chapter.title).toBeTruthy()
      expect(chapter.outcome).toBeTruthy()
      expect(chapter.agencyScenario).toBeTruthy()
      expect(chapter.docsHref.startsWith('/docs/')).toBe(true)
      expect(chapter.code.source).toBeTruthy()
      expect(chapter.code.filename).toBeTruthy()
      expect(['php', 'tsx', 'bash']).toContain(chapter.code.language)
      expect(chapter.prerequisite).toBeTruthy()
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

// Every claim here is checked against the package docs at the release the
// site shows (src/data/generated/release.json). These pin the corrections
// of claims that were false at v1.39.1, so they cannot silently return.
describe('product claims', () => {
  it('reads the Ship prerequisite\'s PHP and Laravel requirements from the release manifest', () => {
    const release = loadReleaseManifest()
    const prerequisite = chapter('ship').prerequisite
    expect(prerequisite).toContain(formatPhpRequirement(release.phpRequirement))
    expect(prerequisite).toContain(formatLaravelRequirement(release.laravelRequirement))
  })

  it('does not claim 2FA or SSO ship enabled (SSO is off by default; 2FA needs --with-profile or --with-2fa)', () => {
    const caption = PRODUCT_MEDIA.profile.caption
    expect(caption).not.toMatch(/ship[s]? enabled/i)
    expect(caption).not.toMatch(/policies gate every write/i)
  })

  it('does not claim Martis reads a model\'s fields (they are declared in the resource)', () => {
    expect(chapter('model').prerequisite).not.toMatch(/reads its fields/i)
    expect(chapter('model').prerequisite).toMatch(/fields\(\)/)
  })

  it('does not claim publishing assets recompiles a theme (a theme is plain CSS)', () => {
    expect(chapter('adapt').prerequisite).not.toMatch(/recompil/i)
  })

  it('does not claim policies must be registered (they are auto-discovered) or hide the no-policy default', () => {
    expect(chapter('secure').prerequisite).not.toMatch(/registered/i)
    expect(chapter('secure').prerequisite).toMatch(/no policy/i)
  })

  it('describes the Extend sample for what it registers (a field display, not an input)', () => {
    expect(chapter('extend').agencyScenario).not.toMatch(/star-rating input/i)
  })

  it('does not claim tables are sortable and searchable out of the box (both are opt-in per field)', () => {
    expect(PRODUCT_MEDIA['resource-index'].caption).not.toMatch(/out of the box/i)
  })
})
