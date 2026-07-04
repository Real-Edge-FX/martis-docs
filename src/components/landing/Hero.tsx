import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Icons } from '@/components/icons'
import { VERSION, RELEASE_HEADLINE } from '@/data/landing'
import { AuroraBackdrop } from '@/components/landing/AuroraBackdrop'

const EASE = [0.22, 1, 0.36, 1] as const

// Headline split into words so each rises in sequence. The emphasised
// "actually" keeps its serif italic treatment.
const HEAD_WORDS: { t: string; em?: boolean }[] = [
  { t: 'The' }, { t: 'admin' }, { t: 'engine' }, { t: 'Laravel' },
  { t: 'devs' }, { t: 'actually', em: true }, { t: 'ship' }, { t: 'with.' },
]

export function Hero() {
  const [copied, setCopied] = useState(false)
  const reduce = useReducedMotion()
  const heroRef = useRef<HTMLDivElement | null>(null)

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const yMain = useTransform(scrollYProgress, [0, 1], [0, 70])
  const yLeft = useTransform(scrollYProgress, [0, 1], [0, 150])
  const yRight = useTransform(scrollYProgress, [0, 1], [0, 40])

  function copyInstall() {
    navigator.clipboard?.writeText('composer require martis/martis').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  }
  const rise = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  }

  return (
    <section ref={heroRef} className="relative overflow-hidden">
      <AuroraBackdrop />

      {/* Fine grid + noise sit above the aurora but below content. */}
      <div
        className="absolute inset-0 grid-bg opacity-30 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse at 50% 25%, black 25%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 25%, black 25%, transparent 70%)',
        }}
      />
      <div className="noise" />

      <div className="relative max-w-[1280px] mx-auto px-6 pt-24 pb-12">
        <motion.div
          className="flex flex-col items-center text-center"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Release badge */}
          <motion.div variants={rise}>
            <Link
              to="/docs/getting-started/installation"
              className="group inline-flex items-center gap-2 h-7 max-w-full px-3 rounded-full glass hover:bg-ink-800/70 transition-colors mb-7 whitespace-nowrap overflow-hidden"
            >
              <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-cobalt-300 bg-cobalt-500/15 px-1.5 py-0.5 rounded">
                {VERSION}
              </span>
              <span className="hidden sm:inline text-[12.5px] text-ink-200 truncate">
                {RELEASE_HEADLINE}
              </span>
              <span className="sm:hidden text-[12.5px] text-ink-200">What&apos;s new</span>
              <Icons.ArrowRight
                size={11}
                className="shrink-0 text-ink-300 group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          </motion.div>

          {/* Headline — word-by-word rise */}
          <h1 className="text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] tracking-[-0.035em] font-medium gradient-text max-w-[14ch]">
            {HEAD_WORDS.map((w, i) => (
              <motion.span key={i} variants={rise} className="inline-block mr-[0.25em]">
                {w.em ? (
                  <span className="font-serif italic font-normal text-violet-400">{w.t}</span>
                ) : (
                  w.t
                )}
              </motion.span>
            ))}
          </h1>

          <motion.p
            variants={rise}
            className="mt-6 max-w-[58ch] text-[16.5px] leading-relaxed text-ink-200"
          >
            Martis is a React-first admin panel for Laravel — built on PrimeReact,
            Tailwind, React Router and TanStack Query. Resources, fields, lenses,
            metrics, dashboards, actions and tools out of the box. Override anything
            without forking.
          </motion.p>

          <motion.div
            variants={rise}
            className="mt-9 flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="flex items-center h-12 pl-4 pr-2 rounded-xl glass font-mono text-[13.5px]">
              <span className="text-violet-400 mr-2">$</span>
              <span className="text-ink-100">composer require</span>
              <span className="text-cobalt-300 ml-1.5">martis/martis</span>
              <button
                type="button"
                onClick={copyInstall}
                className="ml-3 h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-white transition-colors"
                aria-label="Copy install command"
              >
                {copied ? <Icons.Check size={13} /> : <Icons.Copy size={13} />}
              </button>
            </div>

            <Link
              to="/docs/getting-started/installation"
              className="h-12 px-5 inline-flex items-center gap-2 rounded-xl btn-primary text-white text-[14px] font-medium hover:gap-3 transition-all"
            >
              Get started <Icons.ArrowRight size={14} />
            </Link>
          </motion.div>

          <motion.div
            variants={rise}
            className="mt-6 flex items-center gap-5 text-[12px] text-ink-300 font-mono"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-soft" />
              2,363 tests passing
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">MIT licensed</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">PHP 8.3+ / Laravel 12/13</span>
          </motion.div>
        </motion.div>

        {/* Hero screenshot composition with scroll parallax. */}
        <div className="relative mt-16">
          <div className="absolute -inset-x-20 -top-10 -bottom-10 accent-glow opacity-50 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
            style={reduce ? undefined : { y: yMain }}
            className="relative rounded-2xl ring-1 ring-white/10 bg-ink-900 overflow-hidden shadow-[0_30px_120px_-20px_rgba(91,127,255,0.4)]"
          >
            <div className="flex items-center gap-2 px-4 h-9 bg-ink-850 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              <div className="ml-4 flex items-center gap-2 h-6 px-3 rounded-md bg-ink-900 ring-faint text-[11px] font-mono text-ink-300">
                <Icons.Lock size={10} /> getmartis.com/martis
              </div>
            </div>
            <img
              src="/screenshots/dashboard.png"
              alt="Martis dashboard"
              className="w-full block"
              loading="eager"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reduce ? 0 : 30 }}
            animate={{ opacity: 0.95, x: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.65 }}
            style={reduce ? undefined : { y: yRight }}
            className="hidden lg:block absolute -right-4 -bottom-10 w-[280px] rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden shadow-2xl rotate-3"
          >
            <img
              src="/screenshots/resource-index.png"
              alt="Resource index"
              className="w-full block"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reduce ? 0 : -30 }}
            animate={{ opacity: 0.95, x: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.8 }}
            style={reduce ? undefined : { y: yLeft }}
            className="hidden lg:block absolute -left-6 -bottom-4 w-[220px] rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden shadow-2xl -rotate-3"
          >
            <img
              src="/screenshots/system-cache.png"
              alt="System cache"
              className="w-full block"
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
