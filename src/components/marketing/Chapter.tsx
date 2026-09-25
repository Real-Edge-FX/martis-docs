import { createElement } from 'react'
import { Link } from 'react-router-dom'
import type { ProductChapterData } from '@/data/product'
import { PRODUCT_MEDIA } from '@/data/product'
import { useOverflowFocusable } from '@/hooks/useOverflowFocusable'
import { MediaFigure } from './MediaFigure'

interface ChapterProps {
  chapter: ProductChapterData
  /** Heading level for the chapter title, so Home (h3 under an h2) and
   *  Product (h2 per chapter section) each keep a correct document
   *  outline instead of Chapter guessing one. Defaults to `2`. */
  headingLevel?: 2 | 3 | 4
  /** The hero chapter loads its screenshot eagerly; every other chapter stays lazy. */
  priorityMedia?: boolean
  className?: string
}

/**
 * One of the six product chapters (design spec 6.5 "Capítulos do
 * produto" on Home, spec 7 "Página Product" for the full version):
 * outcome, agency scenario, a real code sample and the matching
 * screenshot, with a deep link into docs. Both pages compose the same
 * component so the chapter's substance never forks between them.
 */
export function Chapter({ chapter, headingLevel = 2, priorityMedia = false, className }: ChapterProps) {
  const media = PRODUCT_MEDIA[chapter.mediaId]
  // Whether the code sample actually overflows and needs a
  // keyboard-reachable scroller (see useOverflowFocusable, shared with
  // CodeBlock). Each chapter mounts a fresh instance (keyed per chapter
  // id by the caller), so no remeasure key is needed beyond mount +
  // resize.
  const { ref: codeRef, overflowing: codeOverflowing } = useOverflowFocusable<HTMLPreElement>()

  return (
    <article className={['chapter', className].filter(Boolean).join(' ')} id={chapter.id} data-chapter={chapter.id}>
      <div className="chapter__copy">
        {createElement(`h${headingLevel}`, { className: 'chapter__title' }, chapter.title)}
        <p className="chapter__outcome">{chapter.outcome}</p>
        <p className="chapter__scenario">{chapter.agencyScenario}</p>
        <Link to={chapter.docsHref} className="chapter__link">
          Read the docs
        </Link>
      </div>

      <div className="chapter__demo">
        {/* `overflow-x: auto` (marketing.css) can make this a scrollable region
         *  on narrow viewports; without a focusable, labelled element a
         *  keyboard user would have no way to reach that horizontal scroll
         *  (axe "scrollable-region-focusable", serious impact). Only a sample
         *  that actually overflows takes a tab stop (useOverflowFocusable,
         *  shared with CodeBlock), so a short sample never gets an extra stop
         *  it does not need. Server and the first client render both start
         *  non-overflowing (no layout yet), so hydration never mismatches. */}
        <pre
          ref={codeRef}
          className="chapter__code"
          data-language={chapter.code.language}
          {...(codeOverflowing
            ? {
                tabIndex: 0,
                role: 'region',
                'aria-label': `${chapter.code.filename} code sample`,
              }
            : {})}
        >
          <span className="chapter__code-filename">{chapter.code.filename}</span>
          <code>{chapter.code.source}</code>
        </pre>
        <p className="chapter__prerequisite">{chapter.prerequisite}</p>
        <MediaFigure
          src={media.src}
          alt={media.alt}
          caption={media.caption}
          width={media.width}
          height={media.height}
          priority={priorityMedia}
          className="chapter__media"
        />
      </div>
    </article>
  )
}
