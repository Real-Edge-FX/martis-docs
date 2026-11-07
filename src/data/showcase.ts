export interface ShowcaseScreen {
  src: string
  label: string
  caption: string
}

export interface ShowcaseProject {
  id: string
  name: string
  kind: string
  summary: string
  description: string
  stats: Array<[string, string]>
  martis: Array<{ title: string; body: string }>
  screens: ShowcaseScreen[]
}

/**
 * Products built on Martis, with real screens captured from their staging
 * environments. Personal data is replaced before capture (operator name,
 * avatar, e-mail addresses).
 */
export const SHOWCASE: ShowcaseProject[] = [
  {
    id: 'cato-trade',
    name: 'Cato Trade',
    kind: 'Trading SaaS · Back office',
    summary: 'The back office behind a trading tools business: subscriptions, affiliates, machine provisioning and an AI support desk, in one operating surface.',
    description: 'Cato Trade sells trading tools on a subscription and runs the machines that host them. Its back office is a Martis panel: the team follows revenue and Stripe fees, answers customers, pays affiliate commissions, provisions and audits machines, and reviews every conversation its AI support agents hold, without leaving one interface.',
    stats: [
      ['35+', 'Resources'],
      ['2', 'Languages'],
      ['5', 'AI support agents'],
    ],
    martis: [
      { title: 'Dashboards and metrics', body: 'A tabbed overview with value, trend and sparkline metrics, period filters and an issues banner fed by the data.' },
      { title: 'Resources at scale', body: 'Customers, affiliates, commissions, releases, machines, provider accounts, audit log and more, grouped in a menu with live counts.' },
      { title: 'Detail drawers', body: 'Support conversations open in a drawer over the list, with the transcript, the agents path and the rating, and keep the list in place.' },
      { title: 'Filters and sticky views', body: 'Period filters, search and per-page settings that survive a round trip to a record.' },
      { title: 'Roles, permissions and audit', body: 'Admin users, roles and permissions managed in the panel, with an action log for what operators do.' },
      { title: 'Theme and localisation', body: 'Cato’s own palette, typography and logo on the Martis theme variables, in English and Portuguese.' },
    ],
    screens: [
      { src: '/media/showcase/cato-trade/dashboard.webp', label: 'Overview dashboard', caption: 'MRR, revenue, Stripe fees and profit with sparklines, a revenue trend and the issues to review.' },
      { src: '/media/showcase/cato-trade/conversations.webp', label: 'Support conversations', caption: 'Every chat handled by the AI agents: the path between agents, how it ended, rating, topic and cost.' },
      { src: '/media/showcase/cato-trade/conversation-drawer.webp', label: 'Conversation in a drawer', caption: 'A record opened in place over the list, with its transcript, using the Martis detail drawer.' },
    ],
  },
]
