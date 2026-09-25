export type ComparedProduct = 'nova' | 'filament'

export interface ComparisonCriterion {
  id: string
  category: string
  label: string
  implication: string
  martis: string
  nova: string
  filament: string
}

export const COMPARISON_CRITERIA: ComparisonCriterion[] = [
  { id: 'licence', category: 'Commercial', label: 'Licence', implication: 'Determines whether the foundation can be reused across client projects without recurring product fees.', martis: 'MIT, with no paid tier', nova: 'Commercial licence', filament: 'MIT core' },
  { id: 'cost', category: 'Commercial', label: 'Cost model', implication: 'Affects margin and procurement when the same baseline is delivered repeatedly.', martis: 'No licence or per-project fee', nova: 'Licence required for eligible production use', filament: 'Core is free; commercial ecosystem products may be optional' },
  { id: 'frontend', category: 'Architecture', label: 'Frontend stack', implication: 'Shapes hiring, component reuse and how product teams extend the client interface.', martis: 'React + TypeScript', nova: 'Vue', filament: 'Livewire + Alpine.js' },
  { id: 'execution', category: 'Architecture', label: 'UI execution model', implication: 'Changes where interaction logic lives and how frontend-heavy workflows are built.', martis: 'Client application backed by explicit APIs', nova: 'Resource-driven Vue application', filament: 'Server-driven Livewire components' },
  { id: 'boundary', category: 'Architecture', label: 'Laravel boundary', implication: 'Defines how clearly backend capabilities and frontend experiences can evolve independently.', martis: 'Explicit REST boundary with Laravel resources', nova: 'First-party Laravel product conventions', filament: 'Laravel and Livewire component boundary' },
  { id: 'customisation', category: 'Product', label: 'Visual customisation', implication: 'Matters when the admin must feel like the client’s own product rather than a standard panel.', martis: 'Design tokens, themes and component overrides', nova: 'Custom cards, tools and Vue components', filament: 'Themes, panels and Livewire components' },
  { id: 'extension', category: 'Product', label: 'Extension model', implication: 'Controls how far a team can go beyond the packaged resource experience.', martis: 'Tools, fields, React components and four-tier overrides', nova: 'Fields, cards, tools and resource tooling', filament: 'Resources, widgets, plugins and custom components' },
  { id: 'auth', category: 'Operations', label: 'Access control', implication: 'Determines how much of the security baseline is ready before client-specific policy work begins.', martis: 'Policies, roles, permissions, SSO, 2FA and impersonation', nova: 'Laravel policies plus application-level authentication', filament: 'Laravel policies with panel and plugin options' },
  { id: 'ecosystem', category: 'Operations', label: 'Ecosystem posture', implication: 'Balances breadth of existing integrations against control of a smaller, coherent foundation.', martis: 'Focused foundation with package-owned primitives', nova: 'Laravel first-party ecosystem', filament: 'Large community and plugin ecosystem' },
  { id: 'reuse', category: 'Agency delivery', label: 'Cross-project reuse', implication: 'Shows how naturally the product supports a maintained baseline shared across many clients.', martis: 'Designed explicitly as a reusable agency foundation', nova: 'Reusable through application conventions and packages', filament: 'Reusable through plugins, presets and team conventions' },
  { id: 'team', category: 'Agency delivery', label: 'Best-aligned team', implication: 'The best choice usually follows the team’s frontend model and delivery constraints.', martis: 'Laravel agencies with React capability', nova: 'Teams wanting an official Laravel product', filament: 'Teams committed to Livewire and server-driven UI' },
  { id: 'handover', category: 'Agency delivery', label: 'Client handover', implication: 'Affects long-term ownership, licensing expectations and the skills needed after launch.', martis: 'Open codebase with no product licence dependency', nova: 'Ongoing use follows the commercial licence', filament: 'Open core maintained through Laravel and Livewire skills' },
]

interface ComparisonSection {
  title: string
  martis: string
  alternative: string
  agencyImpact: string
}

interface ComparisonFaq {
  question: string
  answer: string
}

export interface ComparisonProduct {
  slug: ComparedProduct
  name: string
  shortName: string
  summary: string
  decision: string
  chooseMartis: string[]
  chooseAlternative: string[]
  sections: ComparisonSection[]
  faq: ComparisonFaq[]
  checkedAt: string
}

export const COMPARISON_PRODUCTS: Record<ComparedProduct, ComparisonProduct> = {
  nova: {
    slug: 'nova', name: 'Laravel Nova', shortName: 'Nova', checkedAt: '24 September 2026',
    summary: 'Two resource-driven approaches with different licensing, frontend and ownership models.',
    decision: 'Choose Martis for an open React foundation your agency can standardise across clients. Choose Nova when first-party Laravel stewardship and its established commercial model matter more.',
    chooseMartis: ['You want an MIT foundation with no paid tier.', 'Your frontend team works in React and TypeScript.', 'You need a reusable baseline across many client projects.', 'You want client handover without a product licence dependency.'],
    chooseAlternative: ['You prefer an official first-party Laravel product.', 'A commercial licence fits your procurement model.', 'Your team is already invested in Nova resources and Vue tooling.', 'You value Nova’s established Laravel-specific workflow.'],
    sections: [
      { title: 'Ownership and cost', martis: 'MIT licensed with no paid tier or per-project fee.', alternative: 'A commercial product governed by its production licensing terms.', agencyImpact: 'Martis makes the commercial model predictable when the same baseline is reused across many clients.' },
      { title: 'Frontend architecture', martis: 'React and TypeScript with an explicit API boundary.', alternative: 'A Vue interface integrated with Nova’s resource conventions.', agencyImpact: 'The practical choice follows the frontend skills your agency wants to compound across projects.' },
      { title: 'Custom product work', martis: 'Themes, tools, fields and component overrides are part of the core extension model.', alternative: 'Custom fields, cards and tools extend the Nova product surface.', agencyImpact: 'Martis favours agencies that expect the interface to become a distinctive client product.' },
      { title: 'Delivery posture', martis: 'Built to be maintained as an agency-wide starting point.', alternative: 'Built as a first-party administration product for individual Laravel applications.', agencyImpact: 'Nova reduces product selection risk; Martis prioritises reuse, control and an open handover.' },
    ],
    faq: [
      { question: 'Is Martis a drop-in Nova replacement?', answer: 'No. Both are resource-driven, but their frontend stacks and extension contracts differ. Treat migration as a product transition, not a package swap.' },
      { question: 'Does Martis require a commercial licence?', answer: 'No. Martis is MIT licensed and has no paid tier.' },
      { question: 'Which is better for an agency baseline?', answer: 'Martis is explicitly designed for repeatable multi-client delivery. Nova may be preferable when clients request the official Laravel product.' },
    ],
  },
  filament: {
    slug: 'filament', name: 'Filament', shortName: 'Filament', checkedAt: '24 September 2026',
    summary: 'Two open approaches separated primarily by React versus Livewire and by foundation versus ecosystem posture.',
    decision: 'Choose Martis when React, explicit APIs and a controlled agency baseline are central. Choose Filament when your team prefers Livewire and values the breadth of its community ecosystem.',
    chooseMartis: ['You want React as the product interface.', 'You value explicit REST boundaries and frontend extension points.', 'You want one controlled agency baseline.', 'You expect substantial client-specific product UI.'],
    chooseAlternative: ['Your team prefers Livewire and Alpine.js.', 'You want Filament’s wider plugin ecosystem.', 'You prefer server-driven UI over a React application boundary.', 'Your delivery process already standardises on Filament panels.'],
    sections: [
      { title: 'Interaction model', martis: 'React runs the product interface against explicit backend APIs.', alternative: 'Livewire keeps most interaction in server-driven Laravel components.', agencyImpact: 'Choose the model your team can debug, extend and hand over confidently.' },
      { title: 'Ecosystem strategy', martis: 'A focused set of primitives maintained as one coherent foundation.', alternative: 'A broad ecosystem of panels, plugins and community packages.', agencyImpact: 'Breadth accelerates common cases; a controlled foundation reduces dependency variance between clients.' },
      { title: 'Product customisation', martis: 'TypeScript components, tools and four-tier overrides support deep product work.', alternative: 'Themes, custom components and plugins extend a Livewire-first surface.', agencyImpact: 'Martis aligns naturally with agencies that already build React product interfaces.' },
      { title: 'Repeatable delivery', martis: 'The agency baseline is the product’s primary posture.', alternative: 'Repeatability is assembled through team conventions, plugins and presets.', agencyImpact: 'Both can be standardised; Martis makes that operating model explicit from the start.' },
    ],
    faq: [
      { question: 'Is Martis intended to reproduce the Filament ecosystem?', answer: 'No. Martis favours a smaller, coherent React foundation rather than matching every plugin or panel capability.' },
      { question: 'Can a Livewire team use Martis?', answer: 'Yes, but the product interface is React and TypeScript. A team committed to Livewire should weigh that change deliberately.' },
      { question: 'Which gives an agency more control?', answer: 'Both are extensible. Martis places explicit APIs, React components and cross-project reuse at the centre of its design.' },
    ],
  },
}
