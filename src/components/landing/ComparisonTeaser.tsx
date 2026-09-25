import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'

const HEADING_ID = 'home-compare-heading'

interface Criterion {
  name: string
  question: string
}

// The comparison criteria from design spec 9 ("comparar casos de uso,
// modelo de licença, stack, personalização, extensão e operação"). The
// teaser names the questions only: every per-product value belongs to
// the sourced, date-stamped comparison pages, never to this page.
const CRITERIA: Criterion[] = [
  { name: 'Licence and cost', question: 'What does the core cost on each new client project?' },
  { name: 'Frontend stack', question: 'Which frontend model does your team already build and maintain?' },
  { name: 'Customisation', question: 'How far can each client’s backoffice move away from the defaults?' },
  { name: 'Extension', question: 'Where does custom code live, and who owns it after handover?' },
  { name: 'Operation', question: 'How are upgrades, permissions and day-to-day workflows handled?' },
]

/**
 * The comparison teaser (design spec 6.6): an honest introduction that
 * the right choice depends on delivery model, stack and control, the
 * criteria in summary, and one link to the full comparison. No scores,
 * medals or winner badges.
 */
export function ComparisonTeaser() {
  return (
    <section className="home-section" aria-labelledby={HEADING_ID}>
      <div className="site-container home-compare">
        <div className="home-compare__copy">
          <p className="home-kicker">Compare clearly</p>
          <h2 id={HEADING_ID} className="home-h2">
            Choose the foundation that fits how you deliver.
          </h2>
          <p className="home-section__copy">
            Martis, Laravel Nova and Filament are all serious options. The right one depends on your delivery model,
            the stack your team prefers and how much of the admin you need to control.
          </p>
          <Link to="/compare" className="site-button site-button--secondary home-compare__link">
            Compare with Nova and Filament
            <Icons.ArrowRight aria-hidden="true" size={14} />
          </Link>
        </div>

        <dl className="home-compare__criteria">
          {CRITERIA.map((criterion) => (
            <div key={criterion.name} className="home-compare__criterion">
              <dt className="home-compare__name">{criterion.name}</dt>
              <dd className="home-compare__question">{criterion.question}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
