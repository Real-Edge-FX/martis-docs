import { describe, expect, it } from 'vitest'
import { DOC_NAV } from './docs-tree'

const items = DOC_NAV.flatMap((group) => group.items)
const bySlug = (slug: string) => items.find((item) => item.slug === slug)!

// The sidebar badges are numeric claims about the package, so each one is
// pinned to its source at the release the site shows (v1.39.1).
describe('docs nav badges', () => {
  it('states the same number in the badge and its tooltip', () => {
    for (const item of items) {
      if (!item.badge || !/^\d+$/.test(item.badge)) continue
      expect(item.tooltip, item.slug).toMatch(new RegExp(`^${item.badge}\\b`))
    }
  })

  it.each([
    // 177 distinct --martis-* names in resources/css/martis.css
    // (knowledge/THEME_SYSTEM.md; "94 across 13" predates later additions).
    ['customization/theming', '177'],
    // src/Filters: Select, MultiSelect, Boolean, Date, DateRange (filters.md).
    ['core/filters', '5'],
    // keyboard-shortcuts.md "Built-in shortcuts": mod+k, /, shift+?.
    ['reference/keyboard-shortcuts', '3'],
    // differentials.md has eleven top-level sections.
    ['reference/differentials', '11'],
  ])('pins %s to %s', (slug, badge) => {
    expect(bySlug(slug).badge).toBe(badge)
  })
})
