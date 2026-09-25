import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { InstallCommand } from '@/components/site/InstallCommand'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// The copy status is the InstallCommand's role="status"/aria-live region.
// `display: none` takes it out of the accessibility tree, and a live
// region that is not in the tree when its text changes is often never
// announced (WCAG 4.1.3). The homepage may collapse it while empty, but
// must keep it rendered, empty or not.

// Read from disk (Vitest runs from the project root): it does not
// process CSS, so a `?raw` import comes back empty.
const homeCss = readFileSync(resolve(process.cwd(), 'src/styles/home.css'), 'utf8')

let style: HTMLStyleElement

beforeEach(() => {
  style = document.createElement('style')
  style.textContent = homeCss
  document.head.appendChild(style)
})

afterEach(() => {
  style.remove()
})

function renderOnHome() {
  render(
    <main className="home">
      <section className="home-hero">
        <InstallCommand command="composer require martis/martis" />
      </section>
    </main>,
  )
  return screen.getByRole('status')
}

it('keeps the empty copy status rendered on the homepage', () => {
  const status = renderOnHome()
  expect(status).toBeEmptyDOMElement()
  expect(getComputedStyle(status).display).not.toBe('none')
  expect(getComputedStyle(status).visibility).not.toBe('hidden')
})

it('keeps the copy status rendered once it has something to announce', async () => {
  const status = renderOnHome()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
  })
  expect(status).toHaveTextContent('Copied')
  expect(getComputedStyle(status).display).not.toBe('none')
})

it('never hides the status with display:none in the homepage stylesheet', () => {
  const rules = [...homeCss.matchAll(/([^{}]*install-command__status[^{}]*)\{([^}]*)\}/g)]
  expect(rules.length).toBeGreaterThan(0)
  for (const [, selector, body] of rules) {
    expect(body, selector.trim()).not.toMatch(/display:\s*none/)
  }
})
