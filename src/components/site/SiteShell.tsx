import type { PropsWithChildren } from 'react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export type SiteSurface = 'marketing' | 'docs'

/**
 * The frame every public page renders in: skip link, header, the page
 * itself and footer. The page supplies its own `<main id="main-content">`
 * (the skip link's target). `surface` selects the token set: marketing
 * is always dark, docs follows the reader's theme.
 */
export function SiteShell({ children, surface = 'marketing' }: PropsWithChildren<{ surface?: SiteSurface }>) {
  return (
    <div className="site-shell" data-surface={surface}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <SiteHeader surface={surface} />
      {children}
      <SiteFooter />
    </div>
  )
}
