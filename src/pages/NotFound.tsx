import { Link } from 'react-router-dom'
import { TopBar } from '@/components/landing/TopBar'
import { Footer } from '@/components/landing/Footer'
import { Icons } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-900 text-ink-100 flex flex-col">
      <TopBar />
      <main className="flex-1 grid place-items-center px-6 py-24">
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
      <Footer />
    </div>
  )
}
