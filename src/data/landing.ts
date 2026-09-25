// Shared homepage copy kept out of the JSX, so editorial tweaks do not
// touch layout code. Numbers never live here: release facts and download
// counts come from the validated generated snapshots
// (src/data/generated/*.json, read through src/lib/generated-data.ts).

// The single source of truth for the installable command shown in the
// hero, the final CTA and anywhere else the redesign's
// `InstallCommand` component (src/components/site/InstallCommand.tsx)
// renders (design spec 6.1, 6.9). Kept here, not inline in JSX, so a
// future change to the recommended install command is a one-line edit.
export const INSTALL_COMMAND = 'composer require martis/martis'

// The legacy top bar (src/components/landing/TopBar.tsx), which the docs
// shell keeps until Phase 3 moves it onto the site header. Its old
// in-page anchors (/#features, /#components) went with the homepage
// sections they pointed at; these are the matching site routes.
export interface NavLink {
  label: string
  href: string
  external?: boolean
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Docs',       href: '/docs/getting-started/installation' },
  { label: 'Product',    href: '/product' },
  { label: 'Compare',    href: '/compare' },
  { label: 'GitHub',     href: 'https://github.com/Real-Edge-FX/martis-package', external: true },
]
