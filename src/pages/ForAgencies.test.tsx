import { screen, within } from '@testing-library/react'
import { renderRoute } from '@/test/render-route'

/** The `/for-agencies` `<main>`, once the lazy ForAgencies chunk has loaded. */
async function renderForAgencies() {
  renderRoute('/for-agencies')
  await screen.findByRole('heading', { level: 1 }, { timeout: 15_000 })
  return screen.getByRole('main')
}

describe('/for-agencies', () => {
  it(
    'connects the product to repeatable client delivery',
    async () => {
      await renderForAgencies()
      for (const text of [
        'Win the next project',
        'Build with a repeatable system',
        'Hand over with confidence',
        'Maintain across clients',
        'Protect margin',
      ]) {
        expect(screen.getByRole('heading', { name: text })).toBeInTheDocument()
      }
      expect(screen.getByText('baseline → customize → deliver → maintain → reuse')).toBeInTheDocument()
    },
    20_000,
  )

  it(
    'renders exactly one H1 with the agency headline',
    async () => {
      const main = await renderForAgencies()
      expect(within(main).getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent(
        'Build a baseline once. Keep shipping it.',
      )
    },
    20_000,
  )

  it(
    'gives the adoption checklist real links into the documentation',
    async () => {
      const main = await renderForAgencies()
      const links = within(main).getAllByRole('link')
      const docsLinks = links.filter((link) => (link.getAttribute('href') ?? '').startsWith('/docs/'))
      expect(docsLinks.length).toBeGreaterThanOrEqual(5)
      for (const link of docsLinks) {
        expect(link).toHaveAccessibleName()
      }
    },
    20_000,
  )

  it(
    'renders the install command for the baseline',
    async () => {
      const main = await renderForAgencies()
      expect(within(main).getAllByText('composer require martis/martis').length).toBeGreaterThanOrEqual(1)
    },
    20_000,
  )

  it(
    'closes with a call to action toward installation and documentation',
    async () => {
      const main = await renderForAgencies()
      expect(within(main).getByRole('link', { name: /start installing/i })).toHaveAttribute(
        'href',
        '/docs/getting-started/installation',
      )
      expect(within(main).getByRole('link', { name: /read the documentation/i })).toHaveAttribute('href', '/docs')
    },
    20_000,
  )

  it(
    'never starts hidden: no element in <main> is opacity:0 or visibility:hidden',
    async () => {
      const main = await renderForAgencies()
      const hidden = [...main.querySelectorAll('[style]')].filter((el) =>
        /opacity:\s*0(?![.\d])|visibility:\s*hidden/.test(el.getAttribute('style') ?? ''),
      )
      expect(hidden).toEqual([])
    },
    20_000,
  )
})
