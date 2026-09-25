import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { ROUTER_FUTURE } from '@/routes'
import { SiteShell } from './SiteShell'

const GITHUB = 'https://github.com/Real-Edge-FX/martis-package'
const LICENSE = 'https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE'

function renderShell() {
  return render(
    <MemoryRouter future={ROUTER_FUTURE}>
      <SiteShell>
        <main id="main-content">Content</main>
      </SiteShell>
    </MemoryRouter>,
  )
}

/** The mobile menu's disclosure: the `<details>` and its `<summary>` toggle. */
function menu() {
  const toggle = screen.getByText('Menu').closest('summary')
  if (!toggle) throw new Error('the mobile menu has no <summary> toggle')
  return { toggle, details: toggle.parentElement as HTMLDetailsElement }
}

it('exposes primary navigation and the install action', () => {
  renderShell()
  expect(screen.getByRole('link', { name: 'Product' })).toHaveAttribute('href', '/product')
  expect(screen.getByRole('link', { name: 'For Agencies' })).toHaveAttribute('href', '/for-agencies')
  expect(screen.getByRole('link', { name: 'Install Martis' })).toHaveAttribute('href', '/docs/getting-started/installation')
  expect(screen.getByText(/MIT licensed · No paid tier/i)).toBeInTheDocument()
})

describe('header', () => {
  it('links every primary destination, GitHub included', () => {
    renderShell()
    const header = screen.getByRole('banner')
    const nav = within(header).getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare')
    expect(within(nav).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(within(nav).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', GITHUB)
    expect(within(header).getByRole('link', { name: 'Martis' })).toHaveAttribute('href', '/')
  })

  it('offers a skip link to the page content before anything else', () => {
    const { container } = renderShell()
    const skip = screen.getByRole('link', { name: 'Skip to content' })
    expect(skip).toHaveAttribute('href', '#main-content')
    expect(container.querySelector('a')).toBe(skip)
  })

  it('records which surface it serves', () => {
    const { container } = render(
      <MemoryRouter future={ROUTER_FUTURE}>
        <SiteShell surface="docs">
          <main id="main-content">Docs</main>
        </SiteShell>
      </MemoryRouter>,
    )
    expect(container.firstElementChild).toHaveAttribute('data-surface', 'docs')
  })
})

describe('footer', () => {
  it('links docs, compare, changelog, GitHub and the MIT license', () => {
    renderShell()
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(within(footer).getByRole('link', { name: 'Compare' })).toHaveAttribute('href', '/compare')
    expect(within(footer).getByRole('link', { name: 'Changelog' })).toHaveAttribute('href', '/changelog')
    expect(within(footer).getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', GITHUB)
    expect(within(footer).getByRole('link', { name: 'MIT license' })).toHaveAttribute('href', LICENSE)
  })

  it('states the licence message exactly once in the whole shell', () => {
    const { container } = renderShell()
    expect(container.textContent?.split('MIT licensed · No paid tier')).toHaveLength(2)
  })
})

describe('mobile menu', () => {
  it('starts closed, without duplicating the desktop links', () => {
    renderShell()
    const { toggle, details } = menu()
    expect(details.tagName).toBe('DETAILS')
    expect(details.open).toBe(false)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getAllByRole('link', { name: 'Product' })).toHaveLength(1)
  })

  it('opens with every primary link and keeps the install action outside it', () => {
    renderShell()
    const { toggle, details } = menu()
    fireEvent.click(toggle)

    expect(details.open).toBe(true)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = within(details).getByRole('navigation', { name: 'Primary' })
    for (const [name, href] of [
      ['Product', '/product'],
      ['For Agencies', '/for-agencies'],
      ['Compare', '/compare'],
      ['Docs', '/docs'],
      ['GitHub', GITHUB],
    ]) {
      expect(within(panel).getByRole('link', { name })).toHaveAttribute('href', href)
    }
    expect(within(details).queryByRole('link', { name: 'Install Martis' })).toBeNull()
  })

  it('closes on Escape and returns focus to the toggle', () => {
    renderShell()
    const { toggle, details } = menu()
    fireEvent.click(toggle)
    const firstLink = within(details).getByRole('link', { name: 'Product' })
    firstLink.focus()

    fireEvent.keyDown(firstLink, { key: 'Escape' })

    expect(details.open).toBe(false)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveFocus()
  })

  it('keeps keyboard focus inside the open panel', () => {
    renderShell()
    const { toggle, details } = menu()
    fireEvent.click(toggle)
    const links = within(details).getAllByRole('link')
    const last = links[links.length - 1]

    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(toggle).toHaveFocus()

    fireEvent.keyDown(toggle, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('closes after a link in it is followed', () => {
    renderShell()
    const { toggle, details } = menu()
    fireEvent.click(toggle)
    fireEvent.click(within(details).getByRole('link', { name: 'Compare' }))
    expect(details.open).toBe(false)
  })

  it('closes on a click outside it', () => {
    renderShell()
    const { toggle, details } = menu()
    fireEvent.click(toggle)
    fireEvent.pointerDown(screen.getByRole('main'))
    expect(details.open).toBe(false)
  })
})

describe('server HTML (no JavaScript)', () => {
  const html = renderToString(
    <MemoryRouter future={ROUTER_FUTURE}>
      <SiteShell>
        <main id="main-content">Content</main>
      </SiteShell>
    </MemoryRouter>,
  )
  const doc = new DOMParser().parseFromString(html, 'text/html')

  it('renders every navigation link as a real <a href>', () => {
    const navs = Array.from(doc.querySelectorAll('nav'))
    expect(navs.length).toBeGreaterThanOrEqual(3)
    for (const nav of navs) {
      const links = Array.from(nav.querySelectorAll('a'))
      expect(links.length, nav.outerHTML).toBeGreaterThan(0)
      for (const link of links) expect(link.getAttribute('href'), link.outerHTML).toMatch(/^(\/|https:\/\/)/)
      // No link-shaped buttons that only work once React is running.
      expect(nav.querySelectorAll('button, [role="link"]')).toHaveLength(0)
    }
  })

  it('ships the mobile menu as a native disclosure that already holds its links', () => {
    const details = doc.querySelector('header details')
    expect(details).not.toBeNull()
    expect(details!.hasAttribute('open')).toBe(false)
    expect(details!.querySelector(':scope > summary')?.textContent).toContain('Menu')
    const hrefs = Array.from(details!.querySelectorAll('nav a')).map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(['/product', '/for-agencies', '/compare', '/docs', GITHUB])
    expect(doc.querySelector('header')!.innerHTML).toMatch(/href="\/docs\/getting-started\/installation"[^>]*>Install Martis</)
  })

  it('renders nothing hidden or transparent by default', () => {
    for (const el of Array.from(doc.querySelectorAll('[style]'))) {
      expect(el.getAttribute('style'), el.outerHTML).not.toMatch(/opacity\s*:\s*0(?![.\d]*[1-9])|visibility\s*:\s*hidden|display\s*:\s*none/)
    }
    expect(doc.querySelectorAll('[hidden], [inert], [aria-hidden="true"] a')).toHaveLength(0)
  })
})

describe('menu opened before hydration', () => {
  it('keeps its links and a consistent state when React takes over an open <details>', async () => {
    const tree = (
      <MemoryRouter future={ROUTER_FUTURE}>
        <SiteShell>
          <main id="main-content">Content</main>
        </SiteShell>
      </MemoryRouter>
    )
    const container = document.createElement('div')
    container.innerHTML = renderToString(tree)
    document.body.appendChild(container)
    // The reader opens the native disclosure while the JavaScript is
    // still loading.
    container.querySelector('details')!.open = true

    const onRecoverableError = vi.fn()
    const root = await act(async () => hydrateRoot(container, tree, { onRecoverableError }))
    try {
      expect(onRecoverableError).not.toHaveBeenCalled()
      const { toggle, details } = menu()
      expect(details.open).toBe(true)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      const panel = within(details).getByRole('navigation', { name: 'Primary' })
      expect(within(panel).getAllByRole('link')).toHaveLength(5)

      fireEvent.keyDown(within(panel).getByRole('link', { name: 'Product' }), { key: 'Escape' })
      expect(details.open).toBe(false)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(toggle).toHaveFocus()

      fireEvent.click(toggle)
      expect(details.open).toBe(true)
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
    } finally {
      act(() => root.unmount())
      container.remove()
    }
  })
})
