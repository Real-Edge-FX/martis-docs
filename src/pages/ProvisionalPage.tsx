import { Link } from 'react-router-dom'
import { TopBar } from '@/components/landing/TopBar'
import { Footer } from '@/components/landing/Footer'

interface ProvisionalPageProps {
  /** Short label above the heading: the section or audience. */
  eyebrow: string
  /** The page's H1. */
  title: string
  /** One sentence saying what the page will hold, without claiming it exists yet. */
  summary: string
}

/**
 * Stand-in for a public route whose real page ships in a later phase:
 * a heading, one honest sentence and the install link, all in the
 * server-rendered HTML. `App` wires each route to it with its own copy;
 * later phases swap that route's element for the real page.
 */
export default function ProvisionalPage({ eyebrow, title, summary }: ProvisionalPageProps) {
  return (
    <div className="min-h-screen bg-ink-900 text-ink-100 flex flex-col">
      <TopBar />
      <main className="flex-1 px-6 py-24">
        <div className="max-w-[1280px] mx-auto">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300">{eyebrow}</p>
          <h1 className="mt-4 max-w-[22ch] text-4xl font-medium text-white tracking-tight">{title}</h1>
          <p className="mt-4 max-w-[60ch] text-ink-200">{summary}</p>
          <Link
            to="/docs/getting-started/installation"
            className="mt-8 h-10 px-4 inline-flex items-center rounded-lg btn-primary text-white text-[13px] font-medium"
          >
            Install Martis
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
