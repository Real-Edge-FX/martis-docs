/**
 * The `fetchpriority="high"` attribute for an above-the-fold image, or
 * nothing. React 18 does not know the `fetchPriority` prop (it arrives in
 * React 19): it logs an unknown-prop warning on every server render and
 * hydration, which the SSR and hydration tests treat as a failure. The
 * lowercase attribute passes through untouched and means the same to the
 * browser.
 */
export function fetchPriorityAttribute(priority: boolean): { fetchpriority?: 'high' } {
  return priority ? { fetchpriority: 'high' } : {}
}
