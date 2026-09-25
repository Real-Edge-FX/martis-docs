import { Link, useParams } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'
import { COMPARISON_PRODUCTS, type ComparedProduct } from '@/data/comparison'

export default function CompareProduct() {
  const { product } = useParams<{ product: ComparedProduct }>()
  const data = product ? COMPARISON_PRODUCTS[product] : undefined
  if (!data) return <SiteShell><main id="main-content" className="compare-missing"><h1>Comparison not found</h1><Link to="/compare">Back to comparisons</Link></main></SiteShell>

  return <SiteShell><main id="main-content">
    <section className="page-hero compare-detail-hero"><div className="site-container"><Link className="back-link" to="/compare">← All comparisons</Link><p className="eyebrow"><span /> Explicit comparison</p><h1>Martis vs<br /><em>{data.name}</em></h1><p>{data.summary}</p></div></section>
    <section className="section decision-section"><div className="site-container"><p className="eyebrow"><span /> Decision snapshot</p><h2>{data.decision}</h2></div></section>
    <section className="section choice-section"><div className="site-container choice-grid"><article className="choice-card choice-card--martis"><small>Choose Martis when…</small><h2>Your agency wants an open React foundation.</h2><ul>{data.chooseMartis.map((item) => <li key={item}><Icons.Check size={15} />{item}</li>)}</ul></article><article className="choice-card"><small>Choose {data.name} when…</small><h2>Its delivery model is closer to your team.</h2><ul>{data.chooseAlternative.map((item) => <li key={item}><Icons.Check size={15} />{item}</li>)}</ul></article></div></section>
    <section className="section compare-analysis"><div className="site-container"><p className="eyebrow"><span /> What changes in practice</p><div className="analysis-list">{data.sections.map((section, index) => <article key={section.title}><span>0{index + 1}</span><div><h2>{section.title}</h2><p>{section.agencyImpact}</p></div><dl><div className="is-martis"><dt>Martis</dt><dd>{section.martis}</dd></div><div><dt>{data.shortName}</dt><dd>{section.alternative}</dd></div></dl></article>)}</div></div></section>
    <section className="section compare-faq"><div className="site-container"><p className="eyebrow"><span /> Practical questions</p><div className="faq-grid">{data.faq.map((item) => <article key={item.question}><h2>{item.question}</h2><p>{item.answer}</p></article>)}</div></div></section>
    <section className="section source-section"><div className="site-container source-section__inner"><div><p className="eyebrow"><span /> Methodology</p><h2>A dated comparison,<br /><em>not a winner badge.</em></h2></div><div><p>This is editorial guidance based on publicly documented product information. Capabilities change and the right choice depends on the team and delivery model.</p><span>Reviewed {data.checkedAt}</span><Link to="/contact?topic=correction">Report a correction <Icons.ArrowRight size={14} /></Link></div></div></section>
  </main></SiteShell>
}
