import { Logo } from '@/components/Logo'

/**
 * Shown while React lazy chunks resolve. Keeps the brand mark
 * present so the bare-paint moment between landing and docs feels
 * intentional rather than like a fetch hiccup.
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen w-full grid place-items-center bg-ink-900">
      <div className="flex items-center gap-3 opacity-70">
        <Logo size={32} />
        <span className="text-ink-200 text-sm">Loading…</span>
      </div>
    </div>
  )
}
