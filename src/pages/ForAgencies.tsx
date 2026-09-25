import { CtaBanner } from '@/components/landing/CtaBanner'
import { AdoptionChecklist } from '@/components/marketing/AdoptionChecklist'
import { AgencyCycle } from '@/components/marketing/AgencyCycle'
import { InstallCommand } from '@/components/site/InstallCommand'
import { SiteShell } from '@/components/site/SiteShell'

const CYCLE_STEPS = ['baseline', 'customize', 'deliver', 'maintain', 'reuse']

interface AgencyValueItem {
  id: string
  title: string
  copy: string
}

/** The five reasons an agency adopts Martis (design spec 8), each a concrete
 *  consequence of shipping from a shared baseline rather than a numeric
 *  savings claim: no promise ships without real data behind it. */
const AGENCY_VALUE_ITEMS: AgencyValueItem[] = [
  {
    id: 'win',
    title: 'Win the next project',
    copy: 'Bring a working, browsable prototype to the pitch: resources, roles and workflows already running, not a slide deck.',
  },
  {
    id: 'build',
    title: 'Build with a repeatable system',
    copy: 'Auth, CRUD, filters, actions and layout are already decided. Every engagement starts from the same reviewed foundation instead of a blank Laravel install.',
  },
  {
    id: 'handover',
    title: 'Hand over with confidence',
    copy: "The client's team inherits code that follows one documented pattern, backed by public docs they, or their next agency, can read without you.",
  },
  {
    id: 'maintain',
    title: 'Maintain across clients',
    copy: 'A Martis upgrade or a fix you make once flows into every client running the baseline, instead of being patched project by project.',
  },
  {
    id: 'margin',
    title: 'Protect margin',
    copy: 'Martis is MIT licensed with no per-project fee and no paid tier: the baseline does not eat into delivery margin the way a licensed platform would.',
  },
]

/**
 * `/for-agencies`: the case for standardizing client admin delivery on one
 * Martis baseline (design spec 8). Structure: the delivery cycle diagram,
 * the five concrete reasons an agency adopts it, a real adoption checklist
 * linked to the documentation, and the shared install command and call to
 * action.
 *
 * The server HTML is the finished page: nothing starts hidden or
 * transformed, and it reads the same before and after hydration.
 */
export default function ForAgencies() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="agencies-page">
        <header className="agencies-page__intro site-container">
          <p className="home-kicker">For Laravel agencies</p>
          <h1 className="agencies-page__title">Build a baseline once. Keep shipping it.</h1>
          <p className="agencies-page__lede">
            Turn recurring client backoffice work into a maintained capability your team carries from project to
            project, instead of re-deciding auth, CRUD and layout every time.
          </p>
        </header>

        <section className="agencies-cycle" aria-labelledby="agencies-cycle-heading">
          <div className="site-container">
            <h2 id="agencies-cycle-heading" className="agencies-page__section-title">
              The delivery cycle
            </h2>
            <AgencyCycle steps={CYCLE_STEPS} />
          </div>
        </section>

        <section className="agencies-value" aria-labelledby="agencies-value-heading">
          <div className="site-container">
            <h2 id="agencies-value-heading" className="sr-only">
              Why agencies choose Martis
            </h2>
            <ul className="agencies-value__grid">
              {AGENCY_VALUE_ITEMS.map((item) => (
                <li key={item.id} className="agencies-value__item">
                  <h3 className="agencies-value__title">{item.title}</h3>
                  <p className="agencies-value__copy">{item.copy}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="agencies-adoption" aria-labelledby="agencies-adoption-heading">
          <div className="site-container">
            <h2 id="agencies-adoption-heading" className="agencies-page__section-title">
              Adopt it on the next engagement
            </h2>
            <AdoptionChecklist />
          </div>
        </section>

        <section className="agencies-install" aria-labelledby="agencies-install-heading">
          <div className="site-container agencies-install__inner">
            <h2 id="agencies-install-heading" className="agencies-page__section-title">
              Start with the baseline
            </h2>
            <p className="agencies-page__lede">
              Evaluate it against your own delivery checklist, or install it straight into the next client project.
            </p>
            <InstallCommand command="composer require martis/martis" className="agencies-install__command" />
          </div>
        </section>

        <CtaBanner />
      </main>
    </SiteShell>
  )
}
