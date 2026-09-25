interface AgencyCycleProps {
  /** The cycle's steps, in order. Joined with ` → ` for the caption below, so
   *  passing `['baseline', 'customize', 'deliver', 'maintain', 'reuse']`
   *  produces the exact string the design spec (section 8) requires:
   *  `baseline → customize → deliver → maintain → reuse`. */
  steps: string[]
  className?: string
}

/** What each step means, keyed by the step name. A step with no entry here
 *  (there is none today) falls back to its own name, so the diagram never
 *  renders blank if a future step is added without updating this map. */
const STEP_COPY: Record<string, string> = {
  baseline: 'Install the shared Martis baseline once, before the first client engagement.',
  customize: "Adapt brand, fields, layouts and workflows to this client's project.",
  deliver: 'Ship the client project running on that baseline.',
  maintain: 'Maintain the baseline: upgrades and fixes land once, not per client.',
  reuse: 'Carry the baseline, and everything learned customizing it, into the next client.',
}

/**
 * The delivery cycle diagram (design spec 8): a simple, ordered loop from
 * baseline to reuse, so the reader sees the repeatable process, not a
 * one-off install. The visual steps below are a `<ol>` of plain elements
 * (works and reads correctly without CSS or JavaScript); the caption
 * repeats the same sequence as one line of text, both as a visible summary
 * and as the exact string the design spec and the page's own test look
 * for.
 */
export function AgencyCycle({ steps, className }: AgencyCycleProps) {
  return (
    <div className={['agency-cycle', className].filter(Boolean).join(' ')}>
      <ol className="agency-cycle__steps">
        {steps.map((step, index) => (
          <li key={step} className="agency-cycle__step">
            <span className="agency-cycle__step-no" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="agency-cycle__step-name">{step}</span>
            <p className="agency-cycle__step-copy">{STEP_COPY[step] ?? step}</p>
          </li>
        ))}
      </ol>
      <p className="agency-cycle__caption">{steps.join(' → ')}</p>
    </div>
  )
}
