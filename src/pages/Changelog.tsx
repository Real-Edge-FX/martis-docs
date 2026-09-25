import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'
import { RELEASE } from '@/data/site'

const releases = [
  { version: RELEASE.version, label: 'Current', title: 'The current stable Martis foundation', items: ['Laravel 12 and 13 support', 'React-first administration surface', 'Resources, actions, filters, metrics and extension tools', 'Versioned public documentation'] },
  { version: '1.16.1', label: 'Security', title: 'Compatibility and notification hardening', items: ['Removed unsupported Laravel 11 compatibility', 'Corrected published platform requirements', 'Documented notification controls'] },
  { version: '1.16.0', label: 'Security', title: 'Ecosystem security audit', items: ['XSS and authorization hardening', 'IDOR protections', 'Expanded automated coverage'] },
] as const

export default function Changelog() {
  return <SiteShell><main id="main-content">
    <section className="page-hero changelog-hero"><div className="site-container"><p className="eyebrow"><span /> Product history</p><h1>Changelog</h1><p>What changed, why it matters and where to find the complete release notes.</p></div></section>
    <section className="section changelog-list"><div className="site-container">{releases.map((release) => <article key={release.version} id={`v${release.version.replaceAll('.', '-')}`}><div className="changelog-version"><span>v{release.version}</span><small>{release.label}</small></div><div><h2>{release.title}</h2><ul>{release.items.map((item) => <li key={item}>{item}</li>)}</ul><a href={`https://github.com/Real-Edge-FX/martis-package/releases/tag/v${release.version}`} target="_blank" rel="noreferrer">View release notes <Icons.ArrowRight size={14} /></a></div></article>)}</div></section>
  </main></SiteShell>
}
