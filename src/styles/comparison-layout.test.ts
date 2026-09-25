import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const styles = readFileSync(`${process.cwd()}/src/styles/globals.css`, 'utf8')

describe('comparison table layout', () => {
  it('does not offset the table header away from its row', () => {
    expect(styles).not.toMatch(/\.comparison-table thead \{ position: sticky;/)
    expect(styles).not.toMatch(/\.comparison-table thead th \{ position: sticky;/)
  })
})
