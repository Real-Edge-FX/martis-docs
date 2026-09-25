import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Responsive visual/a11y QA for the three redesigned marketing pages
// (design spec 17, "Breakpoints de validação"): 375, 768, 1024 and
// 1440 px, no horizontal overflow, the primary CTA visible, zero axe
// violations of critical or serious impact, and no console errors.
// Runs against `pnpm build`'s real static output (see playwright.config.ts):
// `vite preview`'s SPA fallback would hide a slash-less route like
// `/for-agencies` resolving to its own prerendered page.

const PAGES = ['/', '/product', '/for-agencies'] as const

const VIEWPORTS = [
  { name: '375x844 (mobile)', width: 375, height: 844 },
  { name: '768x1024 (tablet)', width: 768, height: 1024 },
  { name: '1024x768 (laptop)', width: 1024, height: 768 },
  { name: '1440x900 (desktop)', width: 1440, height: 900 },
] as const

for (const route of PAGES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`${route} at ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test('has no horizontal overflow, a visible primary CTA, and no critical/serious axe violations', async ({
        page,
      }) => {
        const consoleErrors: string[] = []
        page.on('console', (message) => {
          if (message.type() === 'error') consoleErrors.push(message.text())
        })
        page.on('pageerror', (error) => consoleErrors.push(String(error)))

        await page.goto(route)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        // No hydration wait needed here: a Chapter/CodeBlock code sample's
        // tab stop (useOverflowFocusable) is present in the server-rendered
        // HTML itself (assumed focusable until measured otherwise, WCAG
        // 2.1.1 — see that hook and src/entry-server.test.tsx), so the axe
        // scrollable-region-focusable check below already passes on the
        // static markup, before any JavaScript runs.

        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        )
        expect(hasHorizontalOverflow, `${route} at ${viewport.name} must not overflow horizontally`).toBe(false)

        // The header's "Install Martis" action is the one primary CTA present
        // on every marketing page at every width (the homepage hero repeats
        // it, hence `.first()`).
        await expect(page.getByRole('link', { name: 'Install Martis' }).first()).toBeVisible()

        const results = await new AxeBuilder({ page }).analyze()
        const criticalOrSerious = results.violations.filter(
          (violation) => violation.impact === 'critical' || violation.impact === 'serious',
        )
        expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([])

        expect(consoleErrors, `console errors on ${route} at ${viewport.name}: ${consoleErrors.join('\n')}`).toEqual(
          [],
        )
      })
    })
  }
}

test.describe('no JavaScript (static markup)', () => {
  for (const route of ['/', '/product']) {
    test(`gives an overflowing code sample a keyboard-reachable tab stop without any JS running at ${route}`, async ({
      page,
    }) => {
      // Blocks every script, so nothing hydrates and useOverflowFocusable's
      // measurement effect never runs: this is exactly the reader WCAG
      // 2.1.1 is for, whose only chance to reach a scrollable code sample
      // is whatever the server actually sent.
      await page.route('**/*.js', (route) => route.abort())
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const results = await new AxeBuilder({ page }).analyze()
      const scrollableRegionViolations = results.violations.filter(
        (violation) => violation.id === 'scrollable-region-focusable',
      )
      expect(scrollableRegionViolations, JSON.stringify(scrollableRegionViolations, null, 2)).toEqual([])

      const criticalOrSerious = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      )
      expect(criticalOrSerious, JSON.stringify(criticalOrSerious, null, 2)).toEqual([])
    })
  }
})

test.describe('mobile navigation menu', () => {
  test.use({ viewport: { width: 375, height: 844 } })

  for (const route of PAGES) {
    test(`opens, exposes every primary link, and closes on Escape at ${route}`, async ({ page }) => {
      await page.goto(route)

      // The toggle is a native `<summary>` inside `<details>` (SiteHeader):
      // real browsers and assistive tech expose it as a button (HTML-AAM),
      // but Playwright's own accessibility-role computation has no mapping
      // for `<summary>` (it only maps `<details>` itself, to "group", with
      // no accessible name from content). `getByRole` cannot find it as a
      // result, so it is targeted by its own tag and its visible label
      // instead of by role, and by CSS class only as a last resort.
      const toggle = page.locator('summary', { hasText: 'Menu' })
      await expect(toggle).toBeVisible()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')

      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')

      const panel = page.getByRole('navigation', { name: 'Primary' }).last()
      for (const label of ['Product', 'For Agencies', 'Compare', 'Docs', 'GitHub']) {
        await expect(panel.getByRole('link', { name: label })).toBeVisible()
      }

      // Move into the panel first, so Escape has focus to give back.
      await page.keyboard.press('Tab')
      await expect(panel.getByRole('link', { name: 'Product' })).toBeFocused()

      await page.keyboard.press('Escape')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      // Escape closes the panel the keyboard was inside (its links unmount):
      // focus must land back on the control that opened it, not on <body>.
      await expect(toggle).toBeFocused()
    })
  }
})

test.describe('mobile navigation menu without JavaScript', () => {
  test.use({ viewport: { width: 375, height: 844 }, javaScriptEnabled: false })

  for (const route of PAGES) {
    test(`opens natively (<details>) and exposes every primary link at ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      const menu = page.locator('details.site-menu')
      const toggle = menu.locator('summary', { hasText: 'Menu' })
      await expect(toggle).toBeVisible()
      await expect(menu).not.toHaveAttribute('open', '')

      // No script runs: this is the browser's own disclosure behaviour.
      await toggle.click()
      await expect(menu).toHaveAttribute('open', '')

      const panel = menu.getByRole('navigation', { name: 'Primary' })
      for (const [label, href] of [
        ['Product', '/product'],
        ['For Agencies', '/for-agencies'],
        ['Compare', '/compare'],
        ['Docs', '/docs'],
      ] as const) {
        await expect(panel.getByRole('link', { name: label, exact: true })).toBeVisible()
        await expect(panel.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', href)
      }
      await expect(panel.getByRole('link', { name: 'GitHub' })).toBeVisible()

      await toggle.click()
      await expect(menu).not.toHaveAttribute('open', '')
    })
  }
})

test.describe('/for-agencies delivery cycle', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test('lines the step names up across the five cycle cards', async ({ page }) => {
    await page.goto('/for-agencies')
    const names = page.locator('.agency-cycle__step-name')
    await expect(names).toHaveCount(5)
    const tops = await names.evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().top))
    for (const top of tops) expect(Math.abs(top - tops[0]), `step name tops ${tops.join(', ')}`).toBeLessThan(1)
  })
})

// WCAG 2.2 2.4.11 (Focus Not Obscured, Minimum): a keyboard user moving
// backwards through the page makes the browser scroll each newly focused
// element into view from above, which is exactly where the sticky site
// header (and, on /product, the sticky ChapterNav under it) sits. Without
// `scroll-padding-top` on the root scroller the browser scrolls the
// element flush to the viewport top, under those bars.
test.describe('focus not obscured by sticky bars (WCAG 2.4.11)', () => {
  const FOCUS_VIEWPORTS = [
    { name: '375x844', width: 375, height: 844 },
    { name: '1440x900', width: 1440, height: 900 },
  ] as const

  for (const route of ['/', '/product'] as const) {
    for (const viewport of FOCUS_VIEWPORTS) {
      test(`keeps every element focused with Shift+Tab below the sticky bars at ${route} ${viewport.name}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

        // From a blank focus state, Shift+Tab starts at the last tab stop
        // on the page (the footer) and walks back up to the skip link.
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())

        const checked: string[] = []
        for (let step = 0; step < 300; step += 1) {
          await page.keyboard.press('Shift+Tab')
          // `html { scroll-behavior: smooth }` animates the scroll focus
          // triggers: measure the position the reader ends up at, once
          // the page has stopped moving for a few frames.
          await page.evaluate(
            () =>
              new Promise<void>((resolve) => {
                let last = window.scrollY
                let still = 0
                const tick = () => {
                  still = window.scrollY === last ? still + 1 : 0
                  last = window.scrollY
                  if (still >= 5) resolve()
                  else requestAnimationFrame(tick)
                }
                requestAnimationFrame(tick)
              }),
          )
          const state = await page.evaluate(() => {
            const active = document.activeElement as HTMLElement | null
            if (!active || active === document.body) return { done: true as const }
            const label = `${active.tagName.toLowerCase()} "${(active.getAttribute('aria-label') ?? active.textContent ?? '').trim().slice(0, 40)}"`
            if (active.classList.contains('skip-link')) return { done: true as const, label }
            const bars = [...document.querySelectorAll<HTMLElement>('.site-header, .chapter-nav')]
            // A tab stop inside a sticky bar is the bar itself, not obscured by it.
            if (bars.some((bar) => bar.contains(active))) return { done: false as const, label, obscuredBy: null }
            const rect = active.getBoundingClientRect()
            for (const bar of bars) {
              const barRect = bar.getBoundingClientRect()
              const overlaps = rect.top < barRect.bottom && rect.bottom > barRect.top
              if (overlaps) {
                return {
                  done: false as const,
                  label,
                  obscuredBy: `${bar.className} (element top ${rect.top.toFixed(1)}, bar ${barRect.top.toFixed(1)}-${barRect.bottom.toFixed(1)})`,
                }
              }
            }
            return { done: false as const, label, obscuredBy: null }
          })
          if (state.done) break
          checked.push(state.label)
          expect(state.obscuredBy, `${state.label} is hidden under ${state.obscuredBy}`).toBeNull()
        }
        // The walk must actually have covered the page, not stopped early.
        expect(checked.length).toBeGreaterThan(10)
      })
    }
  }
})
