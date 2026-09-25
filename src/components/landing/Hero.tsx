import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { ProductFrame } from '@/components/marketing/ProductFrame'
import { InstallCommand } from '@/components/site/InstallCommand'
import { INSTALL_PATH } from '@/components/site/site-links'
import { INSTALL_COMMAND } from '@/data/landing'
import { PRODUCT_MEDIA, PRODUCT_MEDIA_VERSION } from '@/data/product'
import { formatVersion } from '@/lib/generated-data'

const HEADING_ID = 'home-hero-heading'
const HERO_MEDIA = PRODUCT_MEDIA.dashboard

/**
 * The homepage hero (design spec 6.1): eyebrow, headline, one supporting
 * sentence, the two actions, the license seal, the install command and a
 * real Playground screenshot labelled with the release it was captured
 * at. Everything is in its final state in the server HTML: no entrance
 * animation, parallax or ambient effect, so the page reads the same
 * with JavaScript, without it and under reduced motion.
 */
export function Hero() {
  return (
    <section className="home-hero" aria-labelledby={HEADING_ID}>
      <div className="site-container home-hero__grid">
        <div className="home-hero__copy">
          <p className="home-eyebrow">Open-source admin foundation for Laravel agencies</p>
          <h1 id={HEADING_ID} className="home-hero__title">
            The admin foundation your agency can <em>ship again.</em>
          </h1>
          <p className="home-hero__lede">
            Start every client backoffice from the same tested Laravel and React baseline, keep control of every
            override, and deliver without a license fee per project.
          </p>
          <div className="home-actions">
            <Link to={INSTALL_PATH} className="site-button site-button--primary home-actions__button">
              Install Martis
              <Icons.ArrowRight aria-hidden="true" size={14} />
            </Link>
            <a href="#how-it-works" className="site-button site-button--secondary home-actions__button">
              See how it works
            </a>
          </div>
          <p className="home-seal">MIT licensed · No paid tier</p>
          <InstallCommand command={INSTALL_COMMAND} className="home-hero__install" />
        </div>

        <ProductFrame
          src={HERO_MEDIA.src}
          alt={HERO_MEDIA.alt}
          width={HERO_MEDIA.width}
          height={HERO_MEDIA.height}
          version={`Martis Playground · captured at ${formatVersion(PRODUCT_MEDIA_VERSION)}`}
          priority
          className="home-hero__frame"
        />
      </div>
    </section>
  )
}
