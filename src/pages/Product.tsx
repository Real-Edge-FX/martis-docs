import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { ProductVisual } from '@/components/marketing/ProductVisual'
import { InstallCommand } from '@/components/site/InstallCommand'
import { SiteShell } from '@/components/site/SiteShell'
import { PRODUCT_CHAPTERS } from '@/data/site'

const chapterImages = ['/screenshots/resource-index.png', '/screenshots/dashboard.png', '/screenshots/login.png', '/screenshots/profile.png', '/screenshots/tool-system-status.png', '/screenshots/resource-create.png']

export default function Product() {
  return <SiteShell><main id="main-content">
    <section className="page-hero"><div className="site-container"><p className="eyebrow"><span /> Product system</p><h1>One foundation.<br /><em>Six parts of delivery.</em></h1><p>Martis connects the model, interface, operational workflow and handover into a system your agency can reuse without making every project the same.</p><nav className="chapter-jump" aria-label="Product chapters">{PRODUCT_CHAPTERS.map((chapter) => <a key={chapter.id} href={`#${chapter.id}`}>{chapter.number} {chapter.title}</a>)}</nav></div></section>
    <div className="product-chapters">
      {PRODUCT_CHAPTERS.map((chapter, index) => {
        const Icon = Icons[chapter.icon]
        return <section className="product-chapter" id={chapter.id} key={chapter.id}><div className="site-container product-chapter__grid"><div className="product-chapter__copy"><div className="product-chapter__number"><span>{chapter.number}</span><Icon size={20} /></div><h2>{chapter.title}</h2><h3>{chapter.kicker}</h3><p>{chapter.description}</p><ul>{chapter.details.map((detail) => <li key={detail}><Icons.Check size={14} />{detail}</li>)}</ul><Link to={chapter.docsHref}>Read the {chapter.title.toLowerCase()} docs <Icons.ArrowRight size={14} /></Link></div><ProductVisual image={chapterImages[index]} label={`${chapter.title} in Martis`} /></div></section>
      })}
    </div>
    <section className="section compact-cta"><div className="site-container"><div><p className="eyebrow"><span /> Start building</p><h2>A foundation is useful when<br /><em>the team can own it.</em></h2></div><InstallCommand /></div></section>
  </main></SiteShell>
}
