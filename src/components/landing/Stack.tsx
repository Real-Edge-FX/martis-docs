import { STACK_ROWS } from '@/data/landing'

export function Stack() {
  return (
    <section className="py-24 border-t border-white/5">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-3">
              The stack
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.4rem)] tracking-[-0.025em] leading-[1.1] font-medium text-white">
              Modern. Boring. On purpose.
            </h2>
            <p className="mt-4 text-ink-200">
              No exotic deps. Tools you already know. Versions we pin and test
              against.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-px bg-white/5 rounded-xl overflow-hidden ring-1 ring-white/5">
            {STACK_ROWS.map((r) => (
              <div key={r.k} className="bg-ink-900 p-5">
                <div className="text-[10px] uppercase font-mono tracking-[0.2em] text-ink-400 mb-1">
                  {r.k}
                </div>
                <div className="text-[14px] text-white">{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
