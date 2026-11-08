import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Icons } from '@/components/icons'
import { RELEASE } from '@/data/site'
import { SUPPORT_EMAIL, SUPPORT_URL } from '@/data/support'
import { ThemeToggle } from '@/lib/theme'
import { useSpotlight } from '@/hooks/useMotion'

const nav = [
  { label: 'Product', to: '/product' },
  { label: 'For Agencies', to: '/for-agencies' },
  { label: 'Showcase', to: '/showcase' },
  { label: 'Compare', to: '/compare' },
  { label: 'Docs', to: '/docs' },
  { label: 'Contact', to: '/contact' },
]

export function SiteShell({ children, surface = 'marketing' }: { children: ReactNode; surface?: 'marketing' | 'docs' }) {
  useReveal(surface === 'marketing')
  useSpotlight()
  return (
    <div className="site-shell" data-surface={surface}>
      {surface === 'marketing' && <div className="ambient" aria-hidden="true"><span className="ambient__blob ambient__blob--one" /><span className="ambient__blob ambient__blob--two" /><span className="ambient__blob ambient__blob--three" /></div>}
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader surface={surface} />
      {children}
      <SiteFooter />
    </div>
  )
}

function SiteHeader({ surface }: { surface: 'marketing' | 'docs' }) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  return (
    <header className="site-header" data-surface={surface}>
      <div className="site-container site-header__inner">
        <Link to="/" className="site-brand" aria-label="Martis home">
          <Logo withWordmark size={27} />
          <span>v{RELEASE.version}</span>
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {nav.map((item) => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}
        </nav>
        <div className="site-header__actions">
          {surface === 'docs' && <ThemeToggle />}
          <a className="icon-link" href="https://github.com/Real-Edge-FX/martis-package" target="_blank" rel="noreferrer" aria-label="Martis on GitHub"><Icons.GitHub size={17} /></a>
          <a className="coffee-button" href={SUPPORT_URL} target="_blank" rel="noreferrer" aria-label="Buy Martis a coffee on Ko-fi"><Icons.Coffee size={16} /><span>Buy a coffee</span></a>
          <Link className="button button--small button--primary" to="/docs/getting-started/installation">Install Martis</Link>
          <button ref={toggleRef} className="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? <Icons.Close size={19} /> : <Icons.Menu size={19} />}
          </button>
        </div>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}<Icons.ArrowRight size={15} /></NavLink>)}
        <Link to="/docs/getting-started/installation" onClick={() => setOpen(false)}>Install Martis<Icons.ArrowRight size={15} /></Link>
        <a href={SUPPORT_URL} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>Buy Martis a coffee<Icons.Coffee size={15} /></a>
      </nav>}
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-container site-footer__grid">
        <div className="site-footer__brand">
          <Logo withWordmark size={27} />
          <p>The open-source admin foundation built for repeatable Laravel delivery.</p>
          <span>MIT licensed · No paid tier</span>
        </div>
        <FooterColumn title="Product" links={[["Product", "/product"], ["For Agencies", "/for-agencies"], ["Showcase", "/showcase"], ["Compare", "/compare"], ["Changelog", "/changelog"], ["Contact", "/contact"]]} />
        <div className="site-footer__column"><p>Company</p><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/legal">Terms and privacy</Link><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div>
        <FooterColumn title="Learn" links={[["Installation", "/docs/getting-started/installation"], ["Quick Start", "/docs/getting-started/quick-start"], ["Resources", "/docs/core/resources"], ["Theming", "/docs/customization/theming"]]} />
        <div className="site-footer__column"><p>Open source</p><a href="https://github.com/Real-Edge-FX/martis-package" target="_blank" rel="noreferrer">GitHub</a><a href="https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a><a className="site-footer__support" href={SUPPORT_URL} target="_blank" rel="noreferrer"><Icons.Coffee size={14} /> Buy Martis a coffee</a></div>
      </div>
      <div className="site-container site-footer__bottom"><span>© 2026 Martis</span><span>Built for teams that ship.</span></div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return <div className="site-footer__column"><p>{title}</p>{links.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}</div>
}

/**
 * Fades marketing blocks marked `.reveal` in as they scroll into view. The
 * CSS keeps them visible without JavaScript and for reduced motion; this only
 * adds `is-visible` once an element enters the viewport.
 */
function useReveal(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return
    const root = document.documentElement
    root.classList.add('reveal-ready')
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
    const observe = () => document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => observer.observe(el))
    observe()
    const mutations = new MutationObserver(observe)
    mutations.observe(document.body, { childList: true, subtree: true })
    return () => { observer.disconnect(); mutations.disconnect(); root.classList.remove('reveal-ready') }
  }, [enabled])
}
