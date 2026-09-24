import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia?.(QUERY)
  query?.addEventListener?.('change', onChange)
  return () => query?.removeEventListener?.('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia?.(QUERY).matches ?? false
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Whether the visitor asked for reduced motion, safe to call in a
 * prerendered component. The server and the hydrating render both see
 * `false` (the server cannot know the preference), so hydration reuses
 * the server markup; React then re-renders with the real preference.
 * `motion`'s own `useReducedMotion` reads it during the first render
 * instead, so under reduced motion its hydrating render disagrees with
 * the server HTML and the server's hidden `initial` styles stay on
 * elements that no longer animate.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
