import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
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

  it('marks the current heading level so Home and Product can each control document structure', () => {
    render(
      <MemoryRouter>
        <Chapter chapter={chapter} headingLevel={3} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 3, name: chapter.title })).toBeInTheDocument()
  })
})
