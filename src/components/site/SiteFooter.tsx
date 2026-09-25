import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { formatVersion, loadReleaseManifest } from '@/lib/generated-data'
import { FOOTER_LINKS } from './site-links'

// From the validated release snapshot, never hand-written.
const VERSION = formatVersion(loadReleaseManifest().version)

/** The site footer: what Martis is, its licence terms and the links a
 *  reader needs after the page content. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer__inner">
        <div className="site-footer__brand">
          <Link to="/" className="site-footer__logo">
            <Logo withWordmark size={24} />
          </Link>
          <p className="site-footer__tagline">The open-source admin engine for Laravel.</p>
          <p className="site-footer__licence">MIT licensed · No paid tier</p>
        </div>

        <nav aria-label="Footer" className="site-footer__nav">
          <ul>
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                {link.external ? (
                  <a href={link.href} className="site-footer__link" rel="noopener noreferrer">
                    {link.label}
                  </a>
                ) : (
                  <Link to={link.href} className="site-footer__link">
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="site-footer__meta">
        <div className="site-container">Martis {VERSION}</div>
      </div>
    </footer>
  )
}
