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

      await page.keyboard.press('Escape')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    })
  }
})
