import { screen, within } from '@testing-library/react'
import { PRODUCT_CHAPTERS } from '@/data/product'
import { renderRoute } from '@/test/render-route'

/** The `/product` `<main>`, once the lazy Product chunk has loaded. */
async function renderProduct() {
  renderRoute('/product')
  await screen.findByRole('heading', { level: 1 }, { timeout: 15_000 })
  return screen.getByRole('main')
}

describe('/product', () => {
  it(
    'renders every product chapter with a docs link',
    async () => {
      const main = await renderProduct()
      for (const name of ['Model', 'Operate', 'Secure', 'Adapt', 'Extend', 'Ship']) {
        expect(within(main).getByRole('heading', { name })).toBeInTheDocument()
      }
      expect(within(main).getAllByRole('link', { name: /Read the docs/i })).toHaveLength(6)
    },
    20_000,
  )

  it(
    'renders exactly one H1 and one H2 per chapter, in chapter order',
    async () => {
      const main = await renderProduct()
      expect(within(main).getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent(
        'One foundation. Six parts of delivery.',
      )
      const h2s = within(main).getAllByRole('heading', { level: 2 })
      // Every chapter title appears as an H2, in the same order as the data.
      const chapterTitles = PRODUCT_CHAPTERS.map((chapter) => chapter.title)
      const h2Texts = h2s.map((heading) => heading.textContent)
      for (const title of chapterTitles) {
        expect(h2Texts).toContain(title)
      }
      expect(
        chapterTitles.every((title, index) => h2Texts.indexOf(title) >= (index === 0 ? 0 : h2Texts.indexOf(chapterTitles[index - 1]))),
      ).toBe(true)
    },
    20_000,
  )

  it(
    'gives each chapter a stable fragment id matching the homepage deep links',
    async () => {
      const main = await renderProduct()
      for (const chapter of PRODUCT_CHAPTERS) {
        expect(main.querySelector(`#${chapter.id}`)).not.toBeNull()
      }
    },
    20_000,
  )

  it(
    'renders a chapter nav with a native fragment link per chapter',
    async () => {
      const main = await renderProduct()
      const nav = within(main).getByRole('navigation', { name: /chapters/i })
      for (const chapter of PRODUCT_CHAPTERS) {
        const link = within(nav).getByRole('link', { name: chapter.title })
        expect(link).toHaveAttribute('href', `#${chapter.id}`)
      }
    },
    20_000,
  )

  it(
    'closes with a block explaining the extension model and where Martis responsibility ends',
    async () => {
      const main = await renderProduct()
      expect(
        within(main).getByRole('heading', { name: /where martis ends|extension model|your code/i, level: 2 }),
      ).toBeInTheDocument()
    },
    20_000,
  )

  it(
    'never starts hidden: no element in <main> is opacity:0 or visibility:hidden',
    async () => {
      const main = await renderProduct()
      const hidden = [...main.querySelectorAll('[style]')].filter((el) =>
        /opacity:\s*0(?![.\d])|visibility:\s*hidden/.test(el.getAttribute('style') ?? ''),
      )
      expect(hidden).toEqual([])
    },
    20_000,
  )
})
