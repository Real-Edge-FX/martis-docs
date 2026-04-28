import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Icons } from '@/components/icons'

const FOOTER_COLS: {
  heading: string
  links: { label: string; href: string; external?: boolean }[]
}[] = [
  {
    heading: 'Documentation',
    links: [
      { label: 'Installation',  href: '/docs/getting-started/installation' },
      { label: 'Quick Start',   href: '/docs/getting-started/quick-start' },
      { label: 'Resources',     href: '/docs/core/resources' },
      { label: 'Fields',        href: '/docs/core/fields' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'GitHub',     href: 'https://github.com/Real-Edge-FX/martis-package', external: true },
      { label: 'Changelog',  href: 'https://github.com/Real-Edge-FX/martis-package/blob/main/CHANGELOG.md', external: true },
      { label: 'Releases',   href: 'https://github.com/Real-Edge-FX/martis-package/releases',                external: true },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'MIT License', href: 'https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE', external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-12">
      <div className="max-w-[1280px] mx-auto px-6 py-12 grid md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
        <div>
          <Logo size={24} withWordmark />
          <p className="mt-3 text-[13px] text-ink-300 max-w-[34ch]">
            A modern, open-source admin engine for Laravel. React-first.
            Context-aware. Built for developers who ship.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <a
              href="https://github.com/Real-Edge-FX/martis-package"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 w-8 grid place-items-center rounded-md bg-ink-850 ring-faint text-ink-200 hover:text-white"
              aria-label="GitHub"
            >
              <Icons.GitHub size={14} />
            </a>
          </div>
        </div>

        {FOOTER_COLS.map((col) => (
          <div key={col.heading}>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-ink-400 mb-3">
              {col.heading}
            </div>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-ink-200 hover:text-white"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.href} className="text-[13px] text-ink-200 hover:text-white">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-[1280px] mx-auto px-6 py-5 flex items-center justify-between text-[12px] text-ink-400 font-mono">
          <span>© Martis 2026 · Released under MIT</span>
          <span>Built with Martis</span>
        </div>
      </div>
    </footer>
  )
}
