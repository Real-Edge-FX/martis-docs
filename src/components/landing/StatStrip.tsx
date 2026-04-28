import { STATS } from '@/data/landing'

export function StatStrip() {
  return (
    <section className="border-y border-white/5 bg-ink-900/40">
      <div className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-[44px] font-medium tracking-tight gradient-text leading-none">
              {s.n}
            </div>
            <div className="mt-2 text-[12px] uppercase tracking-[0.18em] font-mono text-ink-300">
              {s.l}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
