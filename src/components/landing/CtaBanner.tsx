import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { InstallCommand } from '@/components/site/InstallCommand'
import { INSTALL_PATH } from '@/components/site/site-links'
import { INSTALL_COMMAND } from '@/data/landing'

const HEADING_ID = 'home-cta-heading'

/**
 * The closing call to action (design spec 6.9): the install command
 * again, the license seal, and two paths, start installing or evaluate
 * the documentation. Its labels differ from the hero's "Install Martis"
 * so every link on the page keeps a distinct accessible name.
 */
export function CtaBanner() {
  return (
    <section className="home-cta" aria-labelledby={HEADING_ID}>
      <div className="site-container home-cta__inner">
        <p className="home-kicker">Start with the foundation</p>
        <h2 id={HEADING_ID} className="home-h2 home-cta__title">
          Your next client backoffice starts here.
        </h2>
        <p className="home-seal">MIT licensed · No paid tier</p>
        <InstallCommand command={INSTALL_COMMAND} className="home-cta__install" />
        <div className="home-actions home-actions--center">
          <Link to={INSTALL_PATH} className="site-button site-button--primary home-actions__button">
            Start installing
            <Icons.ArrowRight aria-hidden="true" size={14} />
          </Link>
          <Link to="/docs" className="site-button site-button--secondary home-actions__button">
            Read the documentation
          </Link>
        </div>
      </div>
    </section>
  )
}
