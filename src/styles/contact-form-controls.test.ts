import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(`${process.cwd()}/src/styles/globals.css`, 'utf8')

describe('contact form controls', () => {
  it('gives the consent checkbox explicit light and checked states', () => {
    expect(styles).toMatch(/\.contact-consent input \{[^}]*appearance: none;/s)
    expect(styles).toMatch(/\.contact-consent input \{[^}]*background-color: #f6f4ee;/s)
    expect(styles).toMatch(/\.contact-consent input:checked \{[^}]*background-color: #657cff;/s)
    expect(styles).toMatch(/\.contact-consent input:checked \{[^}]*background-image:/s)
    expect(styles).toMatch(/\.contact-consent input:focus-visible \{[^}]*outline:/s)
  })
})
