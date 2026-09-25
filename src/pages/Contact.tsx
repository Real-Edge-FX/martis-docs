import { ContactForm } from '@/components/contact/ContactForm'
import { SiteShell } from '@/components/site/SiteShell'

export default function Contact() {
  return <SiteShell><main id="main-content">
    <section className="page-hero contact-hero"><div className="site-container"><p className="eyebrow"><span /> Start a conversation</p><h1>Tell us what<br /><em>your agency is shipping.</em></h1><p>Share the project, the repeated work you want to remove and the delivery model you need to protect.</p></div></section>
    <section className="section contact-section"><div className="site-container contact-layout"><div><small>Good context to include</small><h2>One useful message is enough.</h2><ul><li>How many client projects your team delivers</li><li>Your Laravel and frontend stack</li><li>The workflows you repeatedly rebuild</li><li>What a successful evaluation looks like</li></ul><p>No mailing list. No sales automation. Just a direct reply about Martis.</p></div><ContactForm /></div></section>
  </main></SiteShell>
}
