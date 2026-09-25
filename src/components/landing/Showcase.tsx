import { MediaFigure } from '@/components/marketing/MediaFigure'
import { PRODUCT_CHAPTERS, PRODUCT_MEDIA, PRODUCT_MEDIA_VERSION } from '@/data/product'
import { formatVersion } from '@/lib/generated-data'

const HEADING_ID = 'home-media-heading'
const CAPTURED_AT = formatVersion(PRODUCT_MEDIA_VERSION)

/**
 * "Real product" (design spec 6.7): an editorial gallery of Playground
 * screenshots, one per product chapter and labelled with that chapter's
 * name, each with a benefit caption, descriptive alt text and reserved
 * dimensions. Plain, lazy `<img>`s: no lightbox, hover zoom or reveal,
 * so the gallery is complete in the server HTML.
 */
export function Showcase() {
  return (
    <section className="home-section" aria-labelledby={HEADING_ID}>
      <div className="site-container">
        <header className="home-section__head">
          <div>
            <p className="home-kicker">Real product, real delivery</p>
            <h2 id={HEADING_ID} className="home-h2">
              The screens your clients expect.
            </h2>
          </div>
          <p className="home-section__copy">
            Captured from the Martis Playground at {CAPTURED_AT}, never drawn as marketing fiction.
          </p>
        </header>

        <ul className="home-gallery">
          {PRODUCT_CHAPTERS.map((chapter) => {
            const media = PRODUCT_MEDIA[chapter.mediaId]
            return (
              <li key={chapter.id} className="home-gallery__item">
                <p className="home-gallery__label">{chapter.title}</p>
                <MediaFigure
                  src={media.src}
                  alt={media.alt}
                  caption={media.caption}
                  width={media.width}
                  height={media.height}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
