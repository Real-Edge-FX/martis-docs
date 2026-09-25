import { render, screen } from '@testing-library/react'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { assertConsoleSilent } from '@/test/assert-console-silent'
import { MediaFigure } from './MediaFigure'

describe('MediaFigure', () => {
  it('reserves the aspect ratio and lazy-loads by default', () => {
    render(
      <MediaFigure
        src="/screenshots/resource-index.png"
        alt="Resource index table"
        caption="Filter, sort and bulk-act on any resource."
        width={1280}
        height={800}
      />,
    )
    const img = screen.getByRole('img', { name: 'Resource index table' })
    expect(img).toHaveAttribute('width', '1280')
    expect(img).toHaveAttribute('height', '800')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).not.toHaveAttribute('fetchpriority')
    expect(screen.getByText('Filter, sort and bulk-act on any resource.')).toBeInTheDocument()
  })

  it('marks a priority image eager with a high fetch priority', () => {
    // React 18 warns on the camelCase `fetchPriority` prop; the attribute
    // must be set without any console error (SSR and hydration fail on one).
    const consoleError = vi.spyOn(console, 'error')
    // Restored even when an assertion below fails first.
    onTestFinished(() => consoleError.mockRestore())
    render(
      <MediaFigure
        src="/screenshots/dashboard.png"
        alt="Dashboard overview"
        caption="The first screen a team sees."
        width={1280}
        height={800}
        priority
      />,
    )
    const img = screen.getByRole('img', { name: 'Dashboard overview' })
    expect(img).toHaveAttribute('loading', 'eager')
    expect(img).toHaveAttribute('fetchpriority', 'high')
    assertConsoleSilent([consoleError])
  })
})
