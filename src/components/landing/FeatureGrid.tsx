import { FEATURES } from '@/data/landing'
import { Icons } from '@/components/icons'
import { Reveal, RevealItem } from '@/components/landing/Reveal'
import { Spotlight } from '@/components/landing/Spotlight'

// Bento rhythm: a couple of anchor cards span two columns so the grid
// reads less like a uniform table and more like a product surface.
const WIDE = new Set([0, 7])

export function FeatureGrid() {
  return (
    <section id="features" className="relative py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <Reveal className="max-w-3xl mb-14">
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
        </Reveal>

        <Reveal
          stagger
          staggerGap={0.05}
          className="grid sm:grid-cols-2 lg:grid-cols-3 lg:[grid-auto-flow:dense] gap-3"
        >
          {FEATURES.map((f, i) => {
            const Ico = Icons[f.ico]
            const wide = WIDE.has(i)
            return (
              <RevealItem key={i} className={wide ? 'lg:col-span-2' : ''}>
                <Spotlight className="h-full rounded-2xl">
                  <div className="relative z-[1] h-full p-6 rounded-2xl bg-ink-900/80 ring-1 ring-white/[0.07] hover:ring-white/15 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-cobalt-500/20 to-violet-500/20 ring-1 ring-white/10 text-cobalt-300 group-hover/spot:from-cobalt-500/35 group-hover/spot:to-violet-500/35 group-hover/spot:text-cobalt-200 transition-colors">
                      <Ico size={18} />
                    </div>
                    <div className="mt-4 text-[15px] font-medium text-white">{f.title}</div>
                    <div className="mt-1.5 text-[13.5px] text-ink-300 leading-relaxed">{f.body}</div>
                  </div>
                </Spotlight>
              </RevealItem>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
