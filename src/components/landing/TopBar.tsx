import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Icons } from '@/components/icons'
import { NAV_LINKS, VERSION } from '@/data/landing'
import { useCmdK } from '@/lib/cmdk-context'

/**
 * Sticky top bar — direct port of `landing.jsx → TopBar`. The
 * background switches from transparent to a blurred ink panel once
 * the user scrolls past 8px so the hero text never sits behind a
 * solid bar at rest.
 */
export function TopBar() {
  const { show: showCmdK } = useCmdK()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled
          ? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={26} />
          <span className="text-[17px] font-medium tracking-tight text-white">Martis</span>
          <span className="text-[10px] font-mono text-ink-300 px-1.5 py-0.5 rounded bg-ink-800 ring-faint">
            {VERSION}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.filter((l) => !l.external).map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-[13.5px] text-ink-200 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={showCmdK}
            className="hidden sm:flex items-center gap-3 h-9 pl-3 pr-2 rounded-lg bg-ink-850 ring-faint hover:bg-ink-800 transition-colors"
          >
            <Icons.Search size={14} className="text-ink-300" />
            <span className="text-[12.5px] text-ink-300">Search docs…</span>
            <span className="flex items-center gap-1 ml-4">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </button>

          <a
            href="https://github.com/Real-Edge-FX/martis-package"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-ink-850 ring-faint hover:bg-ink-800 transition-colors text-ink-200"
            aria-label="GitHub"
          >
            <Icons.GitHub size={16} />
          </a>

          <Link
            to="/docs/getting-started/installation"
            className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-lg btn-primary text-white text-[13px] font-medium"
          >
            Get started <Icons.ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </header>
  )
}
