import type { ProductChapterData } from '@/data/product'

interface ChapterNavProps {
  chapters: ProductChapterData[]
}

/**
 * The Product page's chapter navigation (spec 7 "navegação lateral ou
 * sticky progress"): a sticky bar on desktop, a horizontally scrollable
 * row on mobile, built from plain native fragment links (`<a href="#id">`)
 * so it works without JavaScript and needs no scroll-spy to be useful.
 * Reuses each chapter's own `id`, the same fragment the homepage's
 * `ProductChapters` links to (`/product#${chapter.id}`), so a reader who
 * lands here from a deep link and one who clicks a nav item land on the
 * same heading.
 */
export function ChapterNav({ chapters }: ChapterNavProps) {
  return (
    <nav className="chapter-nav" aria-label="Chapters">
      <ol className="chapter-nav__list">
        {chapters.map((chapter, index) => (
          <li key={chapter.id} className="chapter-nav__item">
            <a href={`#${chapter.id}`} className="chapter-nav__link">
              <span className="chapter-nav__no" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              {chapter.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
