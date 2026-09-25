import { act, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PRODUCT_CHAPTERS } from '@/data/product'
import { Chapter } from './Chapter'

const chapter = PRODUCT_CHAPTERS[0]

function renderChapter(props: Partial<ComponentProps<typeof Chapter>> = {}) {
  return render(
    <MemoryRouter>
      <Chapter chapter={chapter} {...props} />
    </MemoryRouter>,
  )
}

/** Stubs `<pre>`'s scroll/client width so the overflow effect
 *  (useOverflowFocusable, shared with CodeBlock) measures a deterministic
 *  result: jsdom never lays anything out, so both are 0 (no overflow)
 *  unless a test overrides them like this. */
function mockOverflow(overflowing: boolean) {
  Object.defineProperty(HTMLPreElement.prototype, 'scrollWidth', {
    configurable: true,
    get: () => (overflowing ? 800 : 400),
  })
  Object.defineProperty(HTMLPreElement.prototype, 'clientWidth', {
    configurable: true,
    get: () => 400,
  })
}

afterEach(() => {
  Reflect.deleteProperty(HTMLPreElement.prototype, 'scrollWidth')
  Reflect.deleteProperty(HTMLPreElement.prototype, 'clientWidth')
})

describe('Chapter', () => {
  it('renders the title, outcome, agency scenario and a docs deep link', () => {
    renderChapter()
    expect(screen.getByRole('heading', { name: chapter.title })).toBeInTheDocument()
    expect(screen.getByText(chapter.outcome)).toBeInTheDocument()
    expect(screen.getByText(chapter.agencyScenario)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /read the docs/i })).toHaveAttribute('href', chapter.docsHref)
  })

  it('renders the chapter prerequisite', () => {
    renderChapter()
    expect(screen.getByText(chapter.prerequisite)).toBeInTheDocument()
  })

  it('renders the real, current code sample with its filename', () => {
    renderChapter()
    expect(screen.getByText(chapter.code.filename)).toBeInTheDocument()
    expect(screen.getByText((_, node) => node?.textContent === chapter.code.source)).toBeInTheDocument()
  })

  it('renders the chapter media with a benefit-oriented caption', () => {
    renderChapter()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('keeps a code sample that does not overflow out of the tab order', async () => {
    mockOverflow(false)
    await act(async () => {
      renderChapter()
    })
    const pre = screen.getByText(chapter.code.filename).closest('pre')
    expect(pre).not.toHaveAttribute('tabindex')
    expect(pre).not.toHaveAttribute('role')
  })

  it('gives an overflowing code sample a tab stop and an accessible name, after measuring it post-mount', async () => {
    mockOverflow(true)
    await act(async () => {
      renderChapter()
    })
    const region = screen.getByRole('region', { name: `${chapter.code.filename} code sample` })
    expect(region.tagName).toBe('PRE')
    expect(region).toHaveAttribute('tabindex', '0')
  })

  it('marks the current heading level so Home and Product can each control document structure', () => {
    render(
      <MemoryRouter>
        <Chapter chapter={chapter} headingLevel={3} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 3, name: chapter.title })).toBeInTheDocument()
  })
})
