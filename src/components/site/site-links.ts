// Destinations shared by the site header and footer, so the two cannot
// drift apart on a URL.

export const GITHUB_URL = 'https://github.com/Real-Edge-FX/martis-package'
export const LICENSE_URL = 'https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE'
export const INSTALL_PATH = '/docs/getting-started/installation'

export interface SiteLink {
  label: string
  href: string
  /** Off-site: rendered as a plain `<a>`, not a router link. */
  external?: boolean
}

/** The header's primary navigation, in display order. */
export const PRIMARY_LINKS: SiteLink[] = [
  { label: 'Product', href: '/product' },
  { label: 'For Agencies', href: '/for-agencies' },
  { label: 'Compare', href: '/compare' },
  { label: 'Docs', href: '/docs' },
  { label: 'GitHub', href: GITHUB_URL, external: true },
]

/** The footer's links, in display order. */
export const FOOTER_LINKS: SiteLink[] = [
  { label: 'Docs', href: '/docs' },
  { label: 'Compare', href: '/compare' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'GitHub', href: GITHUB_URL, external: true },
  { label: 'MIT license', href: LICENSE_URL, external: true },
]
