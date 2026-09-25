import { CtaBanner } from '@/components/landing/CtaBanner'
import { Chapter } from '@/components/marketing/Chapter'
import { ChapterNav } from '@/components/marketing/ChapterNav'
import { SiteShell } from '@/components/site/SiteShell'
import { PRODUCT_CHAPTERS } from '@/data/product'

const EXTENSION_HEADING_ID = 'product-extension-heading'

/**
 * `/product`: the full six-chapter tour (design spec 7), each chapter
 * built from the same `Chapter` component the homepage's excerpts point
 * back to, so the outcome, agency scenario, code sample and screenshot
 * never fork between the two pages. `ChapterNav` gives desktop a sticky
 * jump list and mobile a scrollable one, both plain fragment links: no
 * scroll-spy is required to read the page. The closing block (spec 7,
 * last sentence) explains the extension model and draws the line
 * between what Martis ships and what stays application code, before the
 * shared closing call to action.
 *
 * The server HTML is the finished page: nothing starts hidden or
 * transformed, and it reads the same before and after hydration.
 */
export default function Product() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="product-page">
        <header className="product-page__intro site-container">
          <p className="home-kicker">Product</p>
          <h1 className="product-page__title">One foundation. Six parts of delivery.</h1>
          <p className="product-page__lede">
            Every client backoffice needs the same six systems. Martis ships all six as plain Laravel and React code
            your team reads, reviews and owns, chapter by chapter below.
          </p>
        </header>

        <ChapterNav chapters={PRODUCT_CHAPTERS} />

        <div className="site-container">
          {PRODUCT_CHAPTERS.map((chapter, index) => (
            <Chapter key={chapter.id} chapter={chapter} headingLevel={2} priorityMedia={index === 0} />
          ))}
        </div>

        <section className="product-extension" aria-labelledby={EXTENSION_HEADING_ID}>
          <div className="site-container product-extension__inner">
            <p className="home-kicker">Where the foundation ends</p>
            <h2 id={EXTENSION_HEADING_ID} className="product-extension__title">
              Where Martis ends and your code begins.
            </h2>
            <p className="product-extension__copy">
              Resources, actions, policies, themes and the install flow above are the baseline every client project
              starts from. Past that baseline, Martis resolves fields, layouts and views through a four-tier
              override registry (see Extend) instead of forking its own source: your application code, registered
              through that registry, decides the rest. Martis does not generate business logic, does not own your
              database schema, and does not ship a design system beyond its own component set. What you build with
              those extension points, and how you deploy the Laravel application around them, stays yours to run and
              maintain.
            </p>
          </div>
        </section>

        <CtaBanner />
      </main>
    </SiteShell>
  )
}
