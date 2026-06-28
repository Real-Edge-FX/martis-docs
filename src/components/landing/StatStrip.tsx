import { STATS } from '@/data/landing'
import { useCountUp } from '@/hooks/useCountUp'
import { Reveal, RevealItem } from '@/components/landing/Reveal'

function StatNumber({ value }: { value: string }) {
  const [ref, display] = useCountUp(value)
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="text-[44px] font-medium tracking-tight gradient-text leading-none tabular-nums"
    >
      {display}
    </div>
  )
}

export function StatStrip() {
  return (
    <section className="border-y border-white/5 bg-ink-900/40">
      <Reveal
        as="div"
        stagger
        className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        {STATS.map((s) => (
          <RevealItem key={s.l} className="text-center">
            <StatNumber value={s.n} />
            <div className="mt-2 text-[12px] uppercase tracking-[0.18em] font-mono text-ink-300">
              {s.l}
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </section>
  )
}
