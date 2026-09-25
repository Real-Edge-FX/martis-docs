import { expect, test, type Locator, type Page } from '@playwright/test'

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

/**
 * Forces every `<img>` to load and finish decoding, and waits for every
 * `@font-face` to settle, before a screenshot is taken. `toHaveScreenshot`
 * scrolls the page for a full-page capture, which is what triggers a
 * `loading="lazy"` image's native load in the first place — a race the
 * scroll does not reliably win against the decode, so a below-the-fold
 * screenshot could otherwise capture an empty image frame. Removing the
 * `loading` attribute makes Chromium fetch immediately instead of
 * waiting for the image to near the viewport.
 */
async function waitForImagesAndFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll('img'))
    for (const image of images) image.removeAttribute('loading')
    await Promise.all(images.map((image) => image.decode().catch(() => {})))
    await document.fonts.ready
  })
}

for (const route of PAGES) {
  const routeSlug = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')

  test.describe(`${route} visual snapshot`, () => {
    for (const viewport of VIEWPORTS) {
      test.describe(viewport.label, () => {
        test.use({ viewport: { width: viewport.width, height: viewport.height } })

        test(`${route} matches the approved composition at ${viewport.label}`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: 'reduce' })
          await page.goto(route)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
          await waitForImagesAndFonts(page)

          // Masked: every region that renders generated data, which
          // changes on a data refresh or a Martis release independently of
          // any visual change to the page, so neither ever fails this gate.
          // - `.proof-strip` (home): live Packagist download counts and a
          //   "fetched at" timestamp (src/components/marketing/ProofStrip.tsx).
          // - `.home-engineering` (home): the release's version and test
          //   counts (src/components/landing/EngineeringProof.tsx).
          // - `.site-footer__meta` (every page): the release version
          //   (src/components/site/SiteFooter.tsx).
          const mask: Locator[] = []
          for (const selector of ['.proof-strip', '.home-engineering', '.site-footer__meta']) {
            const region = page.locator(selector)
            if ((await region.count()) > 0) mask.push(region)
          }

          await expect(page).toHaveScreenshot(`${routeSlug}-${viewport.label}.png`, {
            fullPage: true,
            animations: 'disabled',
            maxDiffPixelRatio: 0.005,
            mask,
          })
        })
      })
    }
  })
}
