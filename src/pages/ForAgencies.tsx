import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { InstallCommand } from '@/components/site/InstallCommand'
import { SiteShell } from '@/components/site/SiteShell'

const lifecycle = [
  ['01', 'Baseline', 'Start from a tested Laravel and React operating system.'],
  ['02', 'Customise', 'Apply the client’s brand, domain and workflows.'],
  ['03', 'Deliver', 'Ship a coherent product without a per-project licence.'],
  ['04', 'Maintain', 'Update shared capabilities from one foundation.'],
  ['05', 'Reuse', 'Carry the learning into the next client engagement.'],
] as const

const outcomes = [
  ['Win the next project', 'Show a credible operating surface while the proposal is still being shaped.'],
  ['Build with a repeatable system', 'Give teams conventions for resources, actions, permissions, layouts and extensions.'],
  ['Hand over with confidence', 'Leave clients with a documented, versioned foundation—not a private collection of shortcuts.'],
  ['Maintain across clients', 'Bring fixes and improvements back to a shared baseline without cloning application logic.'],
  ['Protect margin', 'Keep licensing predictable: Martis is MIT licensed and has no paid tier.'],
] as const

export default function ForAgencies() {
  return <SiteShell><main id="main-content">
    <section className="page-hero agency-hero"><div className="site-container agency-hero__grid"><div><p className="eyebrow"><span /> For Laravel agencies</p><h1>Build a baseline once.<br /><em>Keep shipping it.</em></h1><p>Martis turns the recurring admin work behind client projects into a delivery advantage your whole agency can use.</p><div className="hero-actions"><Link className="button button--primary" to="/docs/getting-started/installation">Evaluate Martis <Icons.ArrowRight size={16} /></Link><Link className="button button--ghost" to="/compare">Compare alternatives</Link></div></div><div className="agency-metric"><span>One foundation</span><strong>Every client<br />starts further ahead.</strong><p>MIT licensed · No paid tier</p></div></div></section>
    <section className="section section--paper"><div className="site-container"><header className="section-intro section-intro--dark"><p className="eyebrow"><span /> The delivery loop</p><h2>Turn every project into<br /><em>leverage for the next.</em></h2><p>A repeatable system compounds engineering decisions without flattening the client-specific work.</p></header><ol className="agency-cycle">{lifecycle.map(([number, name, body]) => <li key={name}><span>{number}</span><h3>{name}</h3><p>{body}</p></li>)}</ol></div></section>
    <section className="section"><div className="site-container"><div className="agency-outcomes">{outcomes.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><div><h2>{title}</h2><p>{body}</p></div><Icons.ArrowRight size={18} /></article>)}</div></div></section>
    <section className="section agency-checklist"><div className="site-container agency-checklist__grid"><div><p className="eyebrow"><span /> Adoption checklist</p><h2>Use Martis when your team wants to…</h2></div><ul>{['Standardise common admin patterns across projects', 'Keep Laravel on the backend and React on the frontend', 'Own every extension and application-specific decision', 'Avoid commercial tiers and per-project licensing', 'Validate the foundation in a real Laravel Playground'].map((item) => <li key={item}><Icons.Check size={15} />{item}</li>)}</ul></div></section>
    <section className="section compact-cta"><div className="site-container"><div><p className="eyebrow"><span /> Try the baseline</p><h2>Start with one project.<br /><em>Reuse what proves itself.</em></h2><Link className="text-link" to="/contact">Discuss an agency project <Icons.ArrowRight size={14} /></Link></div><InstallCommand /></div></section>
  </main></SiteShell>
}
