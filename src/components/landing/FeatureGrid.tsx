import { FEATURES } from '@/data/landing'
import { Icons } from '@/components/icons'

export function FeatureGrid() {
  return (
    <section id="features" className="relative py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-14">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-3">
            Surface area
          </div>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.025em] leading-[1.1] font-medium text-white">
            Everything you'd reach for, already wired.
          </h2>
          <p className="mt-4 text-ink-200 max-w-2xl">
            No copy-paste from someone's gist. No "just use this trait." Open a
            resource class, declare your fields, and ship the panel.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden ring-1 ring-white/5">
          {FEATURES.map((f, i) => {
            const Ico = Icons[f.ico]
            return (
              <div key={i} className="bg-ink-900 p-6 hover:bg-ink-850 transition-colors group">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cobalt-500/20 to-violet-500/20 ring-1 ring-white/10 text-cobalt-300 group-hover:from-cobalt-500/30 group-hover:to-violet-500/30 transition-colors">
                  <Ico size={18} />
                </div>
                <div className="mt-4 text-[15px] font-medium text-white">{f.title}</div>
                <div className="mt-1.5 text-[13.5px] text-ink-300 leading-relaxed">{f.body}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
