import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'
import { SUPPORT_EMAIL } from '@/data/support'

export default function About() {
  return (
    <SiteShell>
      <main id="main-content">
        <section className="page-hero">
          <div className="site-container">
            <p className="eyebrow"><span /> About</p>
            <h1>About <em>Martis.</em></h1>
            <p>Martis is an open-source admin foundation for Laravel: a PHP resource layer and a React operating surface that agencies reuse across client projects.</p>
          </div>
        </section>
        <section className="section legal-page">
          <div className="site-container legal-page__body">
            <h2>What Martis is</h2>
            <p>Martis turns Eloquent models into a complete admin product: resources, fields, filters, lenses, actions, dashboards and metrics, roles and policies, theming and localisation, with a React and TypeScript frontend on top of Laravel 12 and 13. It is distributed as the <a href="https://packagist.org/packages/martis/martis">martis/martis</a> Composer package.</p>
            <h2>Open source, no paid tier</h2>
            <p>The package is released under the <a href="https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE">MIT License</a>. There is no commercial edition and no per-project licence. The source, issues and releases live on <a href="https://github.com/Real-Edge-FX/martis-package">GitHub</a>.</p>
            <h2>Who maintains it</h2>
            <p>Martis is an independent open-source project maintained by Luiz Moura. It is validated against a real Laravel application (the Martis Playground) and used in production by products such as the <Link to="/showcase">Cato Trade back office</Link>.</p>
            <h2>Contact</h2>
            <p>Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the <Link to="/contact">contact form</Link>. Terms and privacy are on the <Link to="/legal">legal page</Link>.</p>
            <p><Link className="text-link" to="/docs/getting-started/installation">Install Martis <Icons.ArrowRight size={14} /></Link></p>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
