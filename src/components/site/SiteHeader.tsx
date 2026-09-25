import { useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Icons } from '@/components/icons'
import { INSTALL_PATH, PRIMARY_LINKS, type SiteLink } from './site-links'

/** Width at which the inline navigation replaces the menu disclosure.
 *  Keep in sync with the `@media (min-width: 900px)` rules in site.css. */
const DESKTOP_QUERY = '(min-width: 900px)'

function ExternalArrow() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

function NavItem({ link, className, onNavigate }: { link: SiteLink; className: string; onNavigate?: () => void }) {
  if (link.external) {
    return (
      <a href={link.href} className={className} rel="noopener noreferrer" onClick={onNavigate}>
        {link.label}
        <ExternalArrow />
      </a>
    )
  }
  // A plain Link, not NavLink: the markup must not depend on the URL,
  // because Apache serves the same prerendered 404.html for every
  // unknown path and the client hydrates over it wherever it landed.
  return (
    <Link to={link.href} className={className} onClick={onNavigate}>
      {link.label}
    </Link>
  )
}

interface SiteHeaderProps {
  surface?: 'marketing' | 'docs'
}

/**
 * The site's top bar: logo, primary navigation, GitHub and the Install
 * Martis action. Every link is a real `<a href>` in the server HTML.
 *
 * Below 900 px the navigation moves into a native `<details>` disclosure,
 * which opens and closes without JavaScript. With JavaScript it is
 * enhanced: `aria-expanded` on the toggle, Escape and outside clicks
 * close it, focus returns to the toggle, and Tab stays inside the open
 * panel (it covers the page content below it). The install action stays
 * in the bar at every width.
 */
export function SiteHeader({ surface = 'marketing' }: SiteHeaderProps) {
  // `enhanced` is false in the server render and during hydration, so
  // the server HTML (and the first client render that must match it)
  // keeps the menu links inside the closed <details>, where the browser
  // shows them natively on toggle. Once React runs, the menu is
  // state-driven and only renders its links while open.
  const [enhanced, setEnhanced] = useState(false)
  const [open, setOpen] = useState(false)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const toggleRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Take over from the native disclosure: the reader may have opened
    // it while the JavaScript was loading, so adopt the DOM's real state
    // in the same render that enables the enhancement. The links never
    // unmount from an open panel, and state and DOM never disagree.
    setOpen(detailsRef.current?.open ?? false)
    setEnhanced(true)
  }, [])

  const onToggleClick = (event: MouseEvent<HTMLElement>) => {
    // React owns the open state once enhanced; the native toggle is
    // replaced so the panel renders in the same commit that opens it.
    if (!enhanced) return
    event.preventDefault()
    setOpen((current) => !current)
  }

  // Anything else that toggles the element natively (the browser's
  // find-in-page, for one) still ends up in state: the DOM stays the
  // single source of truth.
  const onToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const domOpen = event.currentTarget.open
    setOpen((current) => (current === domOpen ? current : domOpen))
  }

  useEffect(() => {
    if (!open) return
    const details = detailsRef.current
    const toggle = toggleRef.current
    if (!details || !toggle) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        toggle.focus()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [toggle, ...Array.from(details.querySelectorAll<HTMLElement>('nav a[href]'))]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!details.contains(event.target as Node)) setOpen(false)
    }
    // Widening past the breakpoint hides the disclosure: close it so no
    // invisible panel keeps trapping focus.
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const onBreakpoint = () => {
      if (desktop.matches) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    desktop.addEventListener('change', onBreakpoint)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
      desktop.removeEventListener('change', onBreakpoint)
    }
  }, [open])

  return (
    <header className="site-header" data-surface={surface}>
      <div className="site-container site-header__bar">
        <Link to="/" className="site-header__brand">
          <Logo withWordmark size={26} />
        </Link>

        <nav aria-label="Primary" className="site-header__nav">
          <ul>
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <NavItem link={link} className="site-header__link" />
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <Link to={INSTALL_PATH} className="site-button site-button--primary">
            Install Martis
          </Link>

          <details ref={detailsRef} className="site-menu" open={open} onToggle={onToggle}>
            <summary
              ref={toggleRef}
              className="site-menu__toggle"
              aria-expanded={enhanced ? open : undefined}
              onClick={onToggleClick}
            >
              <Icons.Menu aria-hidden="true" size={18} className="site-menu__icon site-menu__icon--open" />
              <Icons.Close aria-hidden="true" size={18} className="site-menu__icon site-menu__icon--close" />
              <span>Menu</span>
            </summary>
            {(!enhanced || open) && (
              <nav aria-label="Primary" className="site-menu__panel">
                <ul>
                  {PRIMARY_LINKS.map((link) => (
                    <li key={link.href}>
                      <NavItem link={link} className="site-menu__link" onNavigate={() => setOpen(false)} />
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </details>
        </div>
      </div>
    </header>
  )
}
