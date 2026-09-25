import { Link, useParams } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'
import { COMPARISONS, type ComparedProduct } from '@/data/site'

export default function CompareProduct() {
  const { product } = useParams<{ product: ComparedProduct }>()
  const data = product ? COMPARISONS[product] : undefined
  if (!data) return <SiteShell><main id="main-content" className="compare-missing"><h1>Comparison not found</h1><Link to="/compare">Back to comparisons</Link></main></SiteShell>

  return <SiteShell><main id="main-content">
    <section className="page-hero compare-detail-hero"><div className="site-container"><Link className="back-link" to="/compare">← All comparisons</Link><p className="eyebrow"><span /> Explicit comparison</p><h1>Martis vs<br /><em>{data.name}</em></h1><p>{data.summary}</p></div></section>
    <section className="section choice-section"><div className="site-container choice-grid"><article className="choice-card choice-card--martis"><small>Choose Martis when…</small><h2>Your agency wants an open React foundation.</h2><ul>{data.chooseMartis.map((item) => <li key={item}><Icons.Check size={15} />{item}</li>)}</ul></article><article className="choice-card"><small>Choose {data.name} when…</small><h2>Its delivery model is closer to your team.</h2><ul>{data.chooseAlternative.map((item) => <li key={item}><Icons.Check size={15} />{item}</li>)}</ul></article></div></section>
    <section className="section source-section"><div className="site-container source-section__inner"><div><p className="eyebrow"><span /> Methodology</p><h2>Make the decision<br /><em>with the source open.</em></h2></div><div><p>This comparison is editorial guidance based on public product information. It does not claim a universal winner.</p><a href={data.sourceUrl} target="_blank" rel="noreferrer">{data.sourceLabel} <Icons.ArrowRight size={14} /></a><span>Checked {data.checkedAt}</span><a href="https://github.com/Real-Edge-FX/martis-package/issues/new" target="_blank" rel="noreferrer">Report a correction</a></div></div></section>
  </main></SiteShell>
}
