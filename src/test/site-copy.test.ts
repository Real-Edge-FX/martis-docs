// @vitest-environment node
import { expect, it } from 'vitest'
import { render } from '@/entry-server'

// The marketing copy is written in US English (design spec: one voice
// across the site), and the footer names Martis the way the homepage
// headline does. Checked over the real server HTML of each redesigned
// page, so a British spelling anywhere in a rendered string, a heading,
// an alt text or a caption fails here, not in review.

const MARKETING_ROUTES = ['/', '/product', '/for-agencies'] as const

/** Visible text and text-bearing attributes of the server HTML, without markup or class names. */
function renderedCopy(html: string): string {
  const attributes = [...html.matchAll(/\s(?:alt|aria-label|title)="([^"]*)"/g)].map((match) => match[1])
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/g, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
  return `${text} ${attributes.join(' ')}`
}

// UK spellings that have a distinct US form. Word stems, matched
// case-insensitively, so "Licence", "customisation" and "colours" all hit.
const UK_SPELLINGS = [
  /\blicence/i,
  /\bcolour/i,
  /\bbehaviour/i,
  /\bcustomis/i,
  /\bstandardis/i,
  /\borganis/i,
  /\bauthoris/i,
  /\brecognis/i,
  /\boptimis/i,
  /\binternationalis/i,
  /\bfavourit/i,
  /\bcentre\b/i,
  /\bcatalogue\b/i,
]

for (const route of MARKETING_ROUTES) {
  it(`writes ${route} in US English`, async () => {
    const copy = renderedCopy((await render(route)).html)
    const hits = UK_SPELLINGS.flatMap((pattern) => copy.match(new RegExp(pattern.source, 'gi')) ?? [])
    expect(hits, `${route} uses UK spellings`).toEqual([])
  })

  it(`names Martis the open-source admin foundation in the ${route} footer`, async () => {
    const { html } = await render(route)
    expect(html).toContain('The open-source admin foundation for Laravel.')
    expect(html).not.toContain('admin engine')
  })
}
