import { describe, expect, it } from 'vitest'
import { markdownUrl, searchDocs } from '@/lib/webmcp'

describe('WebMCP tools', () => {
  it('maps a page path to its Markdown copy', () => {
    expect(markdownUrl('/')).toBe('/index.md')
    expect(markdownUrl('/docs/core/resources')).toBe('/docs/core/resources.md')
    expect(markdownUrl('/showcase/?x=1#top')).toBe('/showcase.md')
  })

  it('ranks title matches above body matches', () => {
    const entries = [
      { slug: 'core/fields', title: 'Fields', description: 'Field types', body: 'drawer mentioned once' },
      { slug: 'customization/overrides', title: 'Drawer overrides', description: 'Override system', body: '' },
    ]
    const results = searchDocs(entries, 'drawer', 5)
    expect(results.map((r) => r.url)).toEqual([
      'https://getmartis.com/docs/customization/overrides',
      'https://getmartis.com/docs/core/fields',
    ])
    expect(searchDocs(entries, '   ')).toEqual([])
  })
})
