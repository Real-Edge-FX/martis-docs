import { screen, within } from '@testing-library/react'
import { renderRoute } from '@/test/render-route'
import { PRODUCT_CHAPTERS } from '@/data/product'
import { HOME_CHAPTER_EXCERPTS } from '@/components/landing/ProductChapters'

/** The homepage `<main>`, once the lazy Landing chunk has loaded. */
async function renderHome() {
  renderRoute('/')
  // The Landing page is a lazy route chunk: wait for its heading, not
  // just for <main>, so the assertions below see the real page.
  await screen.findByRole('heading', { level: 1 }, { timeout: 15_000 })
  return screen.getByRole('main')
}

it(
  'presents the approved agency narrative in conversion order',
  async () => {
    const main = await renderHome()
    expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent(
      'The admin foundation your agency can ship again.',
    )
    // The licence seal appears in the hero and again in the final CTA
    // (design spec 6.1 and 6.9), so it is asserted in each region.
    const hero = within(main).getByRole('region', { name: 'The admin foundation your agency can ship again.' })
    expect(within(hero).getByText('MIT licensed · No paid tier')).toBeInTheDocument()
    const cta = within(main).getByRole('region', { name: /Your next client backoffice/i })
    expect(within(cta).getByText('MIT licensed · No paid tier')).toBeInTheDocument()

    expect(within(main).getByRole('link', { name: 'Install Martis' })).toBeVisible()
    expect(within(main).getByText('Start from a proven baseline')).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: /Compare with Nova and Filament/i })).toHaveAttribute(
      'href',
      '/compare',
    )
  },
  20_000,
)

it(
  'orders the sections as the approved narrative: hero, proof, value, code, chapters, compare, media, engineering, CTA',
  async () => {
    const main = await renderHome()
    const headings = within(main)
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    expect(headings).toEqual([
      'Martis at a glance',
      'One foundation. Every client’s product.',
      'Declare the resource. Ship the workflow.',
      'Six parts of every client delivery.',
      'Choose the foundation that fits how you deliver.',
      'The screens your clients expect.',
      'Built to be checked, not taken on trust.',
      'Your next client backoffice starts here.',
    ])
  },
  20_000,
)

it(
  'links the hero actions to the install guide and the code-to-UI walkthrough',
  async () => {
    const main = await renderHome()
    expect(within(main).getByRole('link', { name: 'Install Martis' })).toHaveAttribute(
      'href',
      '/docs/getting-started/installation',
    )
    expect(within(main).getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#how-it-works')
    expect(main.querySelector('#how-it-works')).not.toBeNull()
    // The install command is shown twice: hero and final CTA.
    expect(within(main).getAllByText('composer require martis/martis')).toHaveLength(2)
  },
  20_000,
)

it(
  'links every product chapter to its Product section and its docs',
  async () => {
    const main = await renderHome()
    for (const chapter of PRODUCT_CHAPTERS) {
      expect(within(main).getByRole('heading', { level: 3, name: chapter.title })).toBeInTheDocument()
      expect(within(main).getByRole('link', { name: `Explore ${chapter.title}` })).toHaveAttribute(
        'href',
        `/product#${chapter.id}`,
      )
      expect(within(main).getByRole('link', { name: `${chapter.title} docs` })).toHaveAttribute(
        'href',
        chapter.docsHref,
      )
    }
  },
  20_000,
)

it('only excerpts code that the chapter itself ships (no invented snippets)', () => {
  for (const chapter of PRODUCT_CHAPTERS) {
    expect(chapter.code.source, chapter.id).toContain(HOME_CHAPTER_EXCERPTS[chapter.id])
  }
})

it(
  'links the engineering proof to the code, the changelog and the docs',
  async () => {
    const main = await renderHome()
    const section = within(main).getByRole('region', { name: 'Built to be checked, not taken on trust.' })
    expect(within(section).getByRole('link', { name: /source on GitHub/i })).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/github\.com\/Real-Edge-FX\/martis-package\//),
    )
    expect(within(section).getByRole('link', { name: /changelog/i })).toHaveAttribute('href', '/changelog')
    expect(within(section).getByRole('link', { name: /documentation/i })).toHaveAttribute('href', '/docs')
  },
  20_000,
)

it(
  'keeps the comparison teaser neutral: no winner badges or scores',
  async () => {
    const main = await renderHome()
    const section = within(main).getByRole('region', { name: 'Choose the foundation that fits how you deliver.' })
    expect(section.textContent).not.toMatch(/winner|best|%|better than/i)
  },
  20_000,
)

it(
  'shows only real, dimensioned screenshots, with the hero frame loaded first',
  async () => {
    const main = await renderHome()
    const images = within(main).getAllByRole('img')
    expect(images.length).toBeGreaterThan(0)
    for (const image of images) {
      expect(image.getAttribute('src'), image.outerHTML).toMatch(/^\/screenshots\/.+\.webp$/)
      expect(image).toHaveAttribute('width')
      expect(image).toHaveAttribute('height')
      expect(image.getAttribute('alt')).toBeTruthy()
    }
    const eager = images.filter((image) => image.getAttribute('loading') === 'eager')
    expect(eager).toHaveLength(1)
    expect(eager[0]).toHaveAttribute('fetchpriority', 'high')
  },
  20_000,
)
