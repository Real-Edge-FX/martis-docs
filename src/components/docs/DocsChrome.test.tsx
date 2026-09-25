import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DocsBreadcrumbs } from './Breadcrumbs'
import { DocsPagination } from './Pagination'
import { DocsSidebar } from './Sidebar'
import { Toc } from './Toc'

describe('documentation chrome', () => {
  it('exposes semantic hooks for light-theme styling', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/docs/getting-started/installation']}>
        <DocsSidebar />
        <DocsBreadcrumbs slug="getting-started/installation" />
        <DocsPagination slug="getting-started/installation" />
        <Toc slug="getting-started/installation" />
      </MemoryRouter>,
    )

    expect(container.querySelector('.docs-nav-badge')).toBeInTheDocument()
    expect(container.querySelector('.docs-breadcrumbs__current')).toBeInTheDocument()
    expect(container.querySelector('.docs-pagination__link')).toBeInTheDocument()
    expect(container.querySelector('.docs-pagination__title')).toBeInTheDocument()
    expect(container.querySelector('.docs-toc')).toBeInTheDocument()
  })
})
