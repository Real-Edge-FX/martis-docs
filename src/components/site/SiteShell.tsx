import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Icons } from '@/components/icons'
import { RELEASE } from '@/data/site'

const nav = [
  { label: 'Product', to: '/product' },
  { label: 'For Agencies', to: '/for-agencies' },
  { label: 'Compare', to: '/compare' },
  { label: 'Docs', to: '/docs' },
]

export function SiteShell({ children, surface = 'marketing' }: { children: ReactNode; surface?: 'marketing' | 'docs' }) {
  return (
    <div className="site-shell" data-surface={surface}>
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
          <a className="icon-link" href="https://github.com/Real-Edge-FX/martis-package" target="_blank" rel="noreferrer" aria-label="Martis on GitHub"><Icons.GitHub size={17} /></a>
          <Link className="button button--small button--primary" to="/docs/getting-started/installation">Install Martis</Link>
          <button ref={toggleRef} className="mobile-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? <Icons.Close size={19} /> : <Icons.Menu size={19} />}
          </button>
        </div>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)}>{item.label}<Icons.ArrowRight size={15} /></NavLink>)}
        <Link to="/docs/getting-started/installation" onClick={() => setOpen(false)}>Install Martis<Icons.ArrowRight size={15} /></Link>
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
        <FooterColumn title="Product" links={[["Product", "/product"], ["For Agencies", "/for-agencies"], ["Compare", "/compare"], ["Changelog", "/changelog"]]} />
        <FooterColumn title="Learn" links={[["Installation", "/docs/getting-started/installation"], ["Quick Start", "/docs/getting-started/quick-start"], ["Resources", "/docs/core/resources"], ["Theming", "/docs/customization/theming"]]} />
        <div className="site-footer__column"><p>Open source</p><a href="https://github.com/Real-Edge-FX/martis-package" target="_blank" rel="noreferrer">GitHub</a><a href="https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a></div>
      </div>
      <div className="site-container site-footer__bottom"><span>© 2026 Martis</span><span>Built for teams that ship.</span></div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return <div className="site-footer__column"><p>{title}</p>{links.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}</div>
}
