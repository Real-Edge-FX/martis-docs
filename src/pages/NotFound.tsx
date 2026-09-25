import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'

export default function NotFound() {
  return (
    <SiteShell>
      <main id="main-content" className="site-not-found">
        <div className="text-center max-w-[44ch]">
          <div className="text-[120px] font-medium gradient-text leading-none">404</div>
          <h1 className="mt-6 text-2xl font-medium text-white tracking-tight">
            Lost in the docs.
          </h1>
          <p className="mt-3 text-ink-300">
            That URL does not match any page on the site. Head back home or open
            the docs index.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/"
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg btn-primary text-white text-[13px] font-medium"
            >
              Home <Icons.ArrowRight size={13} />
            </Link>
            <Link
              to="/docs"
              className="h-10 px-4 inline-flex items-center gap-2 rounded-lg bg-ink-850 ring-faint hover:bg-ink-800 text-ink-200 text-[13px]"
            >
              Browse docs
            </Link>
          </div>
        </div>
      </main>
    </SiteShell>
  )
}
