import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

// Every scroll into view (a fragment link, an MDX heading anchor, and
// keyboard focus landing on an element above the fold) must stop below
// the sticky bars, not under them (WCAG 2.2 2.4.11). That offset lives
// in one place, the root scroller's `scroll-padding-top`, derived from
// the tokens that describe those bars (never a hand-added pixel sum), so
// it keeps tracking either bar changing. tests/e2e/marketing.spec.ts
// proves the real browser behaviour; this pins the expressions.

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src/styles', file), 'utf8')
const normalize = (css: string) => css.replace(/\s+/g, '')

it('pads the root scroller by the full sticky header box plus breathing room', () => {
  const globals = normalize(read('globals.css'))
  expect(globals).toContain('html{scroll-padding-top:calc(var(--site-header-offset)+var(--space-4));}')
})

it('adds the sticky ChapterNav to that padding on the page that renders it', () => {
  const marketing = normalize(read('marketing.css'))
  expect(marketing).toContain(
    'html:has(.chapter-nav){scroll-padding-top:calc(var(--site-header-offset)+var(--chapter-nav-height)+var(--space-4));}',
  )
})

it('counts each sticky bar border in the token that measures it', () => {
  const tokens = normalize(read('tokens.css'))
  expect(tokens).toContain('--site-header-offset:calc(var(--site-header-height)+var(--site-header-border));')
  expect(normalize(read('site.css'))).toMatch(/\.site-header\{[^}]*border-bottom:var\(--site-header-border\)solid/)

  const marketing = normalize(read('marketing.css'))
  expect(marketing).toContain(
    '--chapter-nav-height:calc(var(--site-touch-target)+(var(--space-3)*2)+var(--chapter-nav-border));',
  )
  expect(marketing).toMatch(/\.chapter-nav\{[^}]*top:var\(--site-header-offset\);/)
  expect(marketing).toMatch(/\.chapter-nav\{[^}]*border-bottom:var\(--chapter-nav-border\)solid/)
})

it('leaves no scroll-margin on anchors that would add to the root padding', () => {
  // A target's scroll-margin adds to the scroller's scroll-padding, so a
  // leftover one would double the offset for that target.
  for (const file of ['globals.css', 'marketing.css', 'site.css', 'home.css', 'prose.css']) {
    expect(read(file), file).not.toMatch(/scroll-margin-top\s*:/)
  }
})
