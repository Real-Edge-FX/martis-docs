import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'

interface ShowcaseItem {
  src: string
  title: string
  desc: string
}

const ITEMS: ShowcaseItem[] = [
  { src: '/screenshots/dashboard.png',          title: 'Dashboards',      desc: 'Multi-dashboard with metric cards, filters, polling' },
  { src: '/screenshots/resource-index.png',     title: 'Resource index',  desc: 'Sticky filters, sort, pagination, per-row actions' },
  { src: '/screenshots/resource-create.png',    title: 'Create form',     desc: 'Multi-column grid, reactive fields, save variants' },
  { src: '/screenshots/system-cache.png',       title: 'System cache',    desc: 'Per-subsystem toggle, version, clear' },
  { src: '/screenshots/profile.png',            title: 'Profile & 2FA',   desc: 'Avatar, TOTP enrolment, recovery codes' },
  { src: '/screenshots/login.png',              title: 'Authentication',  desc: 'Login, SSO, locale switcher' },
]

/**
 * "Real screens from real apps" — gallery section ported from the
 * design-system reference (`landing.jsx → Showcase`). Each tile links
 * back to the docs home so visitors land on the navigation tree.
 */
export function Showcase() {
  return (
    <section id="components" className="py-24 relative">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-3">
              A tour
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.025em] leading-[1.1] font-medium text-white">
              Real screens from real apps.
            </h2>
          </div>
          <Link
            to="/docs/getting-started/installation"
            className="text-[13px] text-ink-200 hover:text-white inline-flex items-center gap-1.5"
          >
            Browse the full docs <Icons.ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ITEMS.map((i) => (
            <Link to="/docs/getting-started/installation" key={i.title} className="group">
              <div className="rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden">
                <img
                  src={i.src}
                  alt={i.title}
                  className="w-full block transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
              <div className="mt-3 text-[14px] font-medium text-white">{i.title}</div>
              <div className="text-[12.5px] text-ink-300">{i.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
