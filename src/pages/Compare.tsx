import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'
import { COMPARISONS } from '@/data/site'

const criteria = [
  ['Licence', 'MIT · no paid tier', 'Commercial', 'MIT core'],
  ['Frontend model', 'React + TypeScript', 'Vue', 'Livewire + Alpine'],
  ['Primary posture', 'Reusable foundation', 'First-party product', 'UI ecosystem'],
  ['Agency fit', 'Repeatable client delivery', 'Laravel-native procurement', 'Server-driven teams'],
] as const

export default function Compare() {
  return <SiteShell><main id="main-content">
    <section className="page-hero compare-hero"><div className="site-container"><p className="eyebrow"><span /> Compare the trade-offs</p><h1>Choose the foundation<br /><em>that fits how you ship.</em></h1><p>No winner badges. No invented scores. Just the differences that shape your delivery model, checked against official sources.</p></div></section>
    <section className="section compare-overview"><div className="site-container"><div className="comparison-table-wrap"><table className="comparison-table"><caption>Martis, Laravel Nova and Filament at a glance</caption><thead><tr><th scope="col">Criterion</th><th scope="col" className="is-martis">Martis <small>Open foundation</small></th><th scope="col">Laravel Nova</th><th scope="col">Filament</th></tr></thead><tbody>{criteria.map(([criterion, martis, nova, filament]) => <tr key={criterion}><th scope="row">{criterion}</th><td className="is-martis">{martis}</td><td>{nova}</td><td>{filament}</td></tr>)}</tbody></table></div><div className="compare-cards">{Object.values(COMPARISONS).map((item) => <Link key={item.slug} to={`/compare/${item.slug}`}><small>Detailed comparison</small><h2>Martis vs {item.name.replace('Laravel ', '')}</h2><p>{item.summary}</p><span>Compare with {item.name.replace('Laravel ', '')} <Icons.ArrowRight size={15} /></span></Link>)}</div><p className="comparison-method">Claims checked on 24 September 2026 against official product websites. Product capabilities change; every detail page links to its source.</p></div></section>
  </main></SiteShell>
}
