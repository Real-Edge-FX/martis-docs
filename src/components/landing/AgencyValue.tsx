const HEADING_ID = 'home-agency-heading'

interface AgencyBlock {
  label: string
  title: string
  body: string
  /** The operational consequence a reader can check, not a feature list (spec 6.3). */
  consequence: string
}

const BLOCKS: AgencyBlock[] = [
  {
    label: '01 / Baseline',
    title: 'Start from a proven baseline',
    body: 'Authentication, resources, tables, forms and policies are already built and tested, so a new client project starts at the work that is specific to that client.',
    consequence: 'One Artisan command installs config, migrations and assets into the next project.',
  },
  {
    label: '02 / Consistency',
    title: 'Keep delivery consistent',
    body: 'Every project shares the same resource, field and policy vocabulary, so any developer on the team can pick up another client’s backoffice and read familiar code.',
    consequence: 'Code review and handover follow one set of patterns across clients.',
  },
  {
    label: '03 / Ownership',
    title: 'Own the outcome',
    body: 'Martis is MIT licensed with no paid tier. Fields, pages and layouts are overridden in your application code, not forked from the package.',
    consequence: 'The license cost of the tenth project is the same as the first: nothing.',
  },
]

/**
 * "Built for agency delivery" (design spec 6.3): the three agency
 * outcomes, each closing on a consequence the reader can verify. No
 * hand-maintained counts here: numbers on this page come only from the
 * generated release and Packagist snapshots (the proof strip).
 */
export function AgencyValue() {
  return (
    <section className="home-section" aria-labelledby={HEADING_ID}>
      <div className="site-container">
        <header className="home-section__head">
          <div>
            <p className="home-kicker">Built for agency delivery</p>
            <h2 id={HEADING_ID} className="home-h2">
              One foundation. Every client’s product.
            </h2>
          </div>
          <p className="home-section__copy">
            Standardize the work clients should never pay you to rebuild, and keep the details that make each product
            theirs.
          </p>
        </header>

        <ul className="home-agency">
          {BLOCKS.map((block) => (
            <li key={block.title} className="home-agency__card">
              <p className="home-agency__label">{block.label}</p>
              <h3 className="home-agency__title">{block.title}</h3>
              <p className="home-agency__body">{block.body}</p>
              <p className="home-agency__consequence">{block.consequence}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
