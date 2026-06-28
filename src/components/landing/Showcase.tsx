import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Icons } from '@/components/icons'
import { Reveal, RevealItem } from '@/components/landing/Reveal'

interface ShowcaseItem {
  src: string
  title: string
  desc: string
}

const ITEMS: ShowcaseItem[] = [
  { src: '/screenshots/dashboard.png',          title: 'Dashboards',      desc: 'Multi-dashboard with metric cards, filters, polling' },
  { src: '/screenshots/resource-index.png',     title: 'Resource index',  desc: 'Sticky filters, sort, pagination, per-row actions' },
  { src: '/screenshots/resource-create.png',    title: 'Create form',     desc: 'Multi-column grid, reactive fields, save variants' },
  { src: '/screenshots/system-cache.png',       title: 'System cache',    desc: 'Per-subsystem toggle, version, clear' },
  { src: '/screenshots/profile.png',            title: 'Profile & 2FA',   desc: 'Avatar, TOTP enrolment, recovery codes' },
  { src: '/screenshots/login.png',              title: 'Authentication',  desc: 'Login, SSO, locale switcher' },
]

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * "Real screens from real apps" — gallery section. Clicking a tile opens
 * a lightbox where the screenshot morphs from its thumbnail to a large
 * view (shared-layout via motion `layoutId`) over a blurred brand-tinted
 * backdrop, with keyboard + prev/next navigation. Honours reduced-motion.
 */
export function Showcase() {
  const reduce = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)

  const close = useCallback(() => setActive(null), [])
  const go = useCallback(
    (dir: number) => setActive((i) => (i === null ? i : (i + dir + ITEMS.length) % ITEMS.length)),
    [],
  )

  // Keyboard control + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [active, close, go])

  const layoutTransition = reduce
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 260, damping: 30 }

  const current = active === null ? null : ITEMS[active]

  return (
    <section id="components" className="py-24 relative">
      <div className="max-w-[1280px] mx-auto px-6">
        <Reveal className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-3">
              A tour
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.025em] leading-[1.1] font-medium text-white">
              Real screens from real apps.
            </h2>
          </div>
          <Link
            to="/docs/getting-started/installation"
            className="text-[13px] text-ink-200 hover:text-white inline-flex items-center gap-1.5"
          >
            Browse the full docs <Icons.ArrowRight size={13} />
          </Link>
        </Reveal>

        <Reveal stagger staggerGap={0.06} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ITEMS.map((it, i) => (
            <RevealItem key={it.title}>
              <button
                type="button"
                onClick={() => setActive(i)}
                className="group block w-full text-left cursor-zoom-in"
                aria-label={`Open ${it.title} screenshot`}
              >
                <div className="relative rounded-xl ring-1 ring-white/10 group-hover:ring-cobalt-400/40 bg-ink-900 overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_50px_-20px_rgba(91,127,255,0.5)]">
                  <motion.img
                    layoutId={`shot-${i}`}
                    src={it.src}
                    alt={it.title}
                    className="w-full block transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                    transition={layoutTransition}
                  />
                  {/* Hover affordance: a subtle expand glyph. */}
                  <div className="absolute top-2.5 right-2.5 h-7 w-7 grid place-items-center rounded-lg bg-ink-950/60 ring-1 ring-white/10 text-ink-100 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    <Icons.Eye size={13} />
                  </div>
                </div>
                <div className="mt-3 text-[14px] font-medium text-white">{it.title}</div>
                <div className="text-[12.5px] text-ink-300">{it.desc}</div>
              </button>
            </RevealItem>
          ))}
        </Reveal>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active !== null && current && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          >
            {/* Blurred brand-tinted backdrop. */}
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute inset-0 bg-ink-950/85 backdrop-blur-xl cursor-zoom-out"
            />
            <div className="absolute inset-x-0 top-[15%] h-[60%] accent-glow opacity-40 pointer-events-none" />

            {/* Stage */}
            <div className="relative z-[1] w-full max-w-[1120px] flex flex-col items-center">
              <motion.img
                key={active}
                layoutId={`shot-${active}`}
                src={current.src}
                alt={current.title}
                className="w-full max-h-[78vh] object-contain rounded-2xl ring-1 ring-white/15 shadow-[0_40px_140px_-30px_rgba(91,127,255,0.6)]"
                transition={layoutTransition}
              />

              {/* Caption */}
              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : 0.15, ease: EASE }}
                className="mt-5 flex items-center gap-4 text-center"
              >
                <div>
                  <div className="text-[15px] font-medium text-white">{current.title}</div>
                  <div className="text-[12.5px] text-ink-300">{current.desc}</div>
                </div>
              </motion.div>

              <div className="mt-3 text-[11px] font-mono text-ink-400">
                {active + 1} / {ITEMS.length}
              </div>
            </div>

            {/* Controls */}
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 z-[2] h-10 w-10 grid place-items-center rounded-xl glass text-ink-100 hover:text-white hover:bg-ink-800/70 transition-colors"
            >
              <Icons.Close size={16} />
            </button>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-[2] h-11 w-11 grid place-items-center rounded-xl glass text-ink-100 hover:text-white hover:bg-ink-800/70 transition-colors"
            >
              <Icons.ChevronRight size={18} className="rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-[2] h-11 w-11 grid place-items-center rounded-xl glass text-ink-100 hover:text-white hover:bg-ink-800/70 transition-colors"
            >
              <Icons.ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
