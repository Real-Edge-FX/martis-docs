import { Link } from 'react-router-dom'
import { SiteShell } from '@/components/site/SiteShell'
import { Icons } from '@/components/icons'

export default function NotFound() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="grid place-items-center px-6 py-24">
        <div className="text-center max-w-[44ch]">
          <div className="text-[120px] font-medium gradient-text leading-none">404</div>
          <h1 className="mt-6 text-2xl font-medium text-primary tracking-tight">
            Lost in the docs.
          </h1>
          <p className="mt-3 text-muted">
            That URL does not match any page on the site. Head back home or open
            the docs index.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="site-button site-button--primary"
            >
              Home <Icons.ArrowRight aria-hidden="true" size={13} />
            </Link>
            <Link
              to="/docs"
              className="site-button site-button--secondary"
            >
              Browse docs
            </Link>
          </div>
        </div>
      </main>
    </SiteShell>
  )
}
