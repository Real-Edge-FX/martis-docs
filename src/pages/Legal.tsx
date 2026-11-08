import { Link } from 'react-router-dom'
import { SiteShell } from '@/components/site/SiteShell'
import { SUPPORT_EMAIL } from '@/data/support'

const UPDATED = '2026-11-08'

export default function Legal() {
  return (
    <SiteShell>
      <main id="main-content">
        <section className="page-hero">
          <div className="site-container">
            <p className="eyebrow"><span /> Legal</p>
            <h1>Terms and <em>privacy.</em></h1>
            <p>How getmartis.com may be used and what happens to the data you send through it. Last updated {UPDATED}.</p>
          </div>
        </section>
        <section className="section legal-page">
          <div className="site-container legal-page__body">
            <h2 id="who">Who runs this site</h2>
            <p>getmartis.com is the website of the Martis open-source project, maintained by Luiz Moura. Contact: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>

            <h2 id="terms">Terms of use</h2>
            <p>The Martis software is licensed under the <a href="https://github.com/Real-Edge-FX/martis-package/blob/main/LICENSE">MIT License</a>; that licence, not this page, governs your use of the code. The website and its documentation are provided as they are, without warranty of any kind, and may change at any time. You may read, link to and quote the documentation. Do not use the site to send spam, probe it for vulnerabilities without permission, or overload it.</p>
            <p>Automated agents may read and index the public pages (see <a href="/robots.txt">robots.txt</a>, <a href="/llms.txt">llms.txt</a> and the documentation <a href="/.well-known/mcp/server-card.json">MCP server</a>).</p>

            <h2 id="privacy">Privacy</h2>
            <p><strong>Browsing.</strong> The site sets no cookies of its own and runs no analytics or advertising trackers. The hosting provider's network may set a technical cookie to protect the site from abuse. Fonts are loaded from Google Fonts, and the install counter reads public download numbers from Packagist; both services receive your IP address when your browser contacts them.</p>
            <p><strong>Contact form.</strong> When you send a message, the name, email address, company and message you enter are emailed to the Martis team so we can reply, and a confirmation is emailed to you. The site keeps no copy of the message. For abuse protection it keeps a truncated, irreversible hash of your IP address in its request log and rate limiter.</p>
            <p><strong>Your rights.</strong> To ask what we hold about you, or to have your messages deleted from our mailbox, write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>

            <h2 id="contact">Contact</h2>
            <p>Questions about these terms or your data: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or the <Link to="/contact">contact form</Link>.</p>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}
