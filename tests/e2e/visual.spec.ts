import { expect, test } from '@playwright/test'

// Pixel regression gate for the three redesigned marketing pages, one
// baseline per route per validation breakpoint (design spec 17,
// "Breakpoints de validação": 375, 768, 1024, 1440 px).
//
// Baselines are platform-specific: Playwright renders fonts and
// anti-aliasing differently per OS, so a baseline captured on macOS will
// never byte-match a Linux CI runner. This suite therefore runs locally
// only (see playwright.config.ts's `visual` project, matched by
// `pnpm test:visual` and excluded from `test:e2e`/CI) against baselines
// captured and approved on the machine that runs them.
//
// Reduced motion plus `animations: 'disabled'` keep hover/scroll
// transitions and the reduced-motion-aware entrance animations from
// landing mid-transition and flaking the diff.

const PAGES = ['/', '/product', '/for-agencies'] as const

const VIEWPORTS = [
  { label: '375x844', width: 375, height: 844 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '1024x768', width: 1024, height: 768 },
  { label: '1440x900', width: 1440, height: 900 },
] as const

for (const route of PAGES) {
  const routeSlug = route === '/' ? 'home' : route.replaceAll('/', '-')

  test.describe(`${route} visual snapshot`, () => {
    for (const viewport of VIEWPORTS) {
      test.describe(viewport.label, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } })

        test(`${route} matches the approved composition at ${viewport.label}`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await page.goto(route)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

          await expect(page).toHaveScreenshot(`${routeSlug}-${viewport.label}.png`, {
            fullPage: true,
            animations: 'disabled',
            maxDiffPixelRatio: 0.005,
          })
        })
      })
    }
  })
}
