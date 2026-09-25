import { Link } from 'react-router-dom'

interface AdoptionStep {
  id: string
  label: string
  description: string
  href: string
}

/** Concrete steps for putting Martis on the next client engagement, each
 *  linked to the real documentation page that covers it (design spec 8:
 *  "checklist de adoção"). No step promises a numeric time or cost saving;
 *  the case for adopting the baseline is the repeatable process itself. */
const ADOPTION_STEPS: AdoptionStep[] = [
  {
    id: 'install',
    label: 'Install the baseline',
    description:
      'Run the installer once per project: authentication and the admin shell are wired from the first commit, ready for your first resource.',
    href: '/docs/getting-started/installation',
  },
  {
    id: 'theme',
    label: "Apply the client's theme",
    description: 'Swap the design tokens for the client brand without forking a single component.',
    href: '/docs/customization/theming',
  },
  {
    id: 'overrides',
    label: 'Register your own overrides',
    description:
      'Register your own field components, layouts and views with the override registry for anything the baseline should not decide.',
    href: '/docs/customization/overrides',
  },
  {
    id: 'roles',
    label: "Set up the client team's roles",
    description:
      'Run martis:roles to scaffold users, roles and permissions on spatie/laravel-permission for the people who will use the panel.',
    href: '/docs/auth/roles',
  },
  {
    id: 'generate',
    label: 'Generate the next resource',
    description: 'Scaffold resources, actions and fields with the Artisan generators instead of hand-written boilerplate.',
    href: '/docs/customization/generators',
  },
]

/**
 * The adoption checklist (design spec 8): concrete, actionable steps for
 * putting the baseline on the next client engagement, each one a real link
 * into the documentation rather than a marketing claim. Renders as a plain
 * ordered list of links, so it works and reads correctly before hydration.
 */
export function AdoptionChecklist({ className }: { className?: string }) {
  return (
    <ol className={['adoption-checklist', className].filter(Boolean).join(' ')}>
      {ADOPTION_STEPS.map((step, index) => (
        <li key={step.id} className="adoption-checklist__item">
          <span className="adoption-checklist__no" aria-hidden="true">
            {index + 1}
          </span>
          <div className="adoption-checklist__body">
            <Link to={step.href} className="adoption-checklist__link">
              {step.label}
            </Link>
            <p className="adoption-checklist__copy">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
