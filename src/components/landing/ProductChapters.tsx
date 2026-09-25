import { Link } from 'react-router-dom'
import { PRODUCT_CHAPTERS, type ProductChapterId } from '@/data/product'

/**
 * One line from each chapter's own code sample (`PRODUCT_CHAPTERS[].code`
 * in src/data/product.ts), shown as the chapter's technical excerpt on
 * the homepage. Landing.test.tsx asserts every excerpt is a verbatim
 * substring of that sample, so the homepage can never show a snippet
 * the Product page and the docs do not.
 */
export const HOME_CHAPTER_EXCERPTS: Record<ProductChapterId, string> = {
  model: "Text::make('title')->sortable()->searchable()->required(),",
  operate: "$post->update(['status' => 'published', 'published_at' => now()]);",
  secure: 'return $user->id === $post->author_id;',
  adapt: "'name' => 'mytheme',",
  extend: "componentRegistry.registerResourceFieldDisplay('posts', 'status', StatusBadgeDisplay)",
  ship: 'php artisan martis:install',
}

/** What each chapter covers, from design spec 6.5. */
const CHAPTER_SCOPE: Record<ProductChapterId, string> = {
  model: 'Resources, fields, relationships',
  operate: 'Tables, actions, filters, bulk workflows',
  secure: 'Authentication, authorization, policies',
  adapt: 'Themes, layouts, navigation, localization',
  extend: 'Hooks, custom fields, application code',
  ship: 'Installation, upgrades, repeatable delivery',
}

const HEADING_ID = 'home-chapters-heading'

/**
 * The homepage's six product chapters (design spec 6.5): each card names
 * what the chapter covers, its outcome, a one-line excerpt of real code
 * and two deep links, one to the chapter on /product and one to its
 * docs. The matching screenshots follow in the gallery (spec 6.7), which
 * labels each one with the same chapter name; the full chapter, with
 * code and media side by side, is the Product page's `Chapter`.
 */
export function ProductChapters() {
  return (
    <section className="home-section" aria-labelledby={HEADING_ID}>
      <div className="site-container">
        <header className="home-section__head">
          <div>
            <p className="home-kicker">The product, in six chapters</p>
            <h2 id={HEADING_ID} className="home-h2">
              Six parts of every client delivery.
            </h2>
          </div>
          <p className="home-section__copy">
            From the first resource to the handover, each chapter is plain Laravel and React code your team reads,
            reviews and owns.
          </p>
        </header>

        <ol className="home-chapters">
          {PRODUCT_CHAPTERS.map((chapter, index) => (
            <li key={chapter.id} className="home-chapter">
              <p className="home-chapter__no">
                {String(index + 1).padStart(2, '0')} / {CHAPTER_SCOPE[chapter.id]}
              </p>
              <h3 className="home-chapter__title">{chapter.title}</h3>
              <p className="home-chapter__outcome">{chapter.outcome}</p>
              <pre className="home-chapter__excerpt" data-language={chapter.code.language}>
                <code>{HOME_CHAPTER_EXCERPTS[chapter.id]}</code>
              </pre>
              <div className="home-chapter__links">
                <Link to={`/product#${chapter.id}`} className="home-link">
                  Explore {chapter.title}
                </Link>
                <Link to={chapter.docsHref} className="home-link home-link--muted">
                  {chapter.title} docs
                </Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
