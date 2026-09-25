import { Link } from 'react-router-dom'
import { SiteShell } from '@/components/site/SiteShell'

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
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="py-24">
        <div className="site-container">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt">{eyebrow}</p>
          <h1 className="mt-4 max-w-[22ch] text-4xl font-medium tracking-tight text-primary">{title}</h1>
          <p className="mt-4 max-w-[60ch] text-muted">{summary}</p>
          <Link to="/docs/getting-started/installation" className="site-button site-button--primary mt-8">
            Install Martis
          </Link>
        </div>
      </main>
    </SiteShell>
  )
}
