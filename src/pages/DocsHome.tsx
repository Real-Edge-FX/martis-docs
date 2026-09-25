import { Link } from 'react-router-dom'
import { Icons, type IconName } from '@/components/icons'
import { RELEASE } from '@/data/site'

const journeys: Array<{ title: string; body: string; href: string; icon: IconName }> = [
  { title: 'Install Martis', body: 'Add the package, publish assets and create the first administrator.', href: '/docs/getting-started/installation', icon: 'Bolt' },
  { title: 'Build a resource', body: 'Turn an Eloquent model into a complete operating surface.', href: '/docs/core/resources', icon: 'Stack' },
  { title: 'Add filters and actions', body: 'Shape the workflows teams use every day.', href: '/docs/core/filters', icon: 'Filter' },
  { title: 'Customise the product', body: 'Apply themes, overrides, components and tools.', href: '/docs/customization/theming', icon: 'Palette' },
  { title: 'Secure access', body: 'Configure policies, roles, permissions, SSO and 2FA.', href: '/docs/auth/authorization', icon: 'Shield' },
  { title: 'Understand upgrades', body: 'Review releases and keep each client baseline current.', href: '/changelog', icon: 'Workflow' },
]

export default function DocsHome() {
  return <main id="main-content" className="docs-home">
    <div className="docs-home__hero"><p className="eyebrow"><span /> Documentation · v{RELEASE.version}</p><h1>Build with Martis.</h1><p>Start with the outcome you need. Every guide is connected to the same resource-driven foundation.</p></div>
    <div className="docs-journeys">{journeys.map((journey) => { const Icon = Icons[journey.icon]; return <Link key={journey.title} to={journey.href}><Icon size={18} /><h2>{journey.title}</h2><p>{journey.body}</p><span>Open guide <Icons.ArrowRight size={13} /></span></Link> })}</div>
    <div className="docs-home__help"><div><small>Quick start</small><h2>From install to first resource.</h2></div><Link to="/docs/getting-started/quick-start">Follow the quick start <Icons.ArrowRight size={14} /></Link></div>
  </main>
}
