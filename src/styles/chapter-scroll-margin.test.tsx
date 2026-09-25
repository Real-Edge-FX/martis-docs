import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { PRODUCT_CHAPTERS } from '@/data/product'
import { Chapter } from '@/components/marketing/Chapter'
import { MemoryRouter } from 'react-router-dom'

// The fragment target for both ChapterNav's links and the homepage's
// `/product#<id>` deep links is the `<article id>` itself, not a heading
// (globals.css's `[id]` scroll-margin rule only matches h1-h6). Without
// its own `scroll-margin-top`, the sticky site header (64px) plus the
// sticky ChapterNav (~68px) hide the chapter's H2 after navigating here.
// It must be derived from the two tokens that describe those bars, not a
// hardcoded pixel sum, so it keeps tracking either one changing.

const marketingCss = readFileSync(resolve(process.cwd(), 'src/styles/marketing.css'), 'utf8')

let style: HTMLStyleElement

beforeEach(() => {
  style = document.createElement('style')
  style.textContent = marketingCss
  document.head.appendChild(style)
})

afterEach(() => {
  style.remove()
})

it('gives every chapter article a scroll-margin-top derived from the header and chapter-nav tokens', () => {
  render(
    <MemoryRouter>
      <Chapter chapter={PRODUCT_CHAPTERS[0]} />
    </MemoryRouter>,
  )
  const article = document.querySelector(`#${PRODUCT_CHAPTERS[0].id}`)
  expect(article).not.toBeNull()
  const computed = getComputedStyle(article!).getPropertyValue('scroll-margin-top')
  // jsdom does not resolve calc()/var() to a pixel value, so this checks
  // the expression itself: both sticky-bar tokens, not a magic number.
  expect(computed.replace(/\s+/g, '')).toBe(
    'calc(var(--site-header-height)+var(--chapter-nav-height))',
  )
})

it('never hardcodes the chapter scroll offset as a bare pixel value in the stylesheet', () => {
  const rules = [...marketingCss.matchAll(/\.chapter\s*\{([^}]*)\}/g)]
  expect(rules.length).toBeGreaterThan(0)
  const [, body] = rules[0]
  expect(body).toMatch(/scroll-margin-top:\s*calc\(var\(--site-header-height\)\s*\+\s*var\(--chapter-nav-height\)\)/)
})
