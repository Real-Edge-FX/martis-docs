import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'

export function Hero() {
  const [copied, setCopied] = useState(false)

  function copyInstall() {
    navigator.clipboard?.writeText('composer require martis/martis').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 grid-bg opacity-60 pointer-events-none"
        style={{
          maskImage:
            'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
        }}
      />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] accent-glow pointer-events-none" />
      <div className="noise" />

      <div className="relative max-w-[1280px] mx-auto px-6 pt-20 pb-12">
        <div className="flex flex-col items-center text-center">
          {/* Release badge: pill kept to a single row on every viewport.
              On <sm the freeform changelog summary is hidden so the pill
              shape is preserved (the user reported it wrapping into two
              lines on mobile). The version chip + arrow always render. */}
          <Link
            to="/docs/getting-started/installation"
            className="group inline-flex items-center gap-2 h-7 max-w-full px-3 rounded-full bg-ink-850 ring-faint hover:bg-ink-800 transition-colors mb-7 whitespace-nowrap overflow-hidden"
          >
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-cobalt-300 bg-cobalt-500/15 px-1.5 py-0.5 rounded">
              v1.3.0
            </span>
            <span className="hidden sm:inline text-[12.5px] text-ink-200 truncate">
              Laravel 13 support
            </span>
            <span className="sm:hidden text-[12.5px] text-ink-200">
              What&apos;s new
            </span>
            <Icons.ArrowRight
              size={11}
              className="shrink-0 text-ink-300 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <h1 className="text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] tracking-[-0.035em] font-medium gradient-text max-w-[14ch]">
            The admin engine Laravel devs{' '}
            <span className="font-serif italic font-normal text-violet-400">actually</span>{' '}
            ship with.
          </h1>

          <p className="mt-6 max-w-[58ch] text-[16.5px] leading-relaxed text-ink-200">
            Martis is a React-first admin panel for Laravel — built on PrimeReact,
            Tailwind, React Router and TanStack Query. Resources, fields, lenses,
            metrics, dashboards, actions and tools out of the box. Override anything
            without forking.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center h-12 pl-4 pr-2 rounded-xl bg-ink-850 ring-faint font-mono text-[13.5px]">
              <span className="text-violet-400 mr-2">$</span>
              <span className="text-ink-100">composer require</span>
              <span className="text-cobalt-300 ml-1.5">martis/martis</span>
              <button
                type="button"
                onClick={copyInstall}
                className="ml-3 h-8 w-8 grid place-items-center rounded-lg hover:bg-white/5 text-ink-300 hover:text-white"
                aria-label="Copy install command"
              >
                {copied ? <Icons.Check size={13} /> : <Icons.Copy size={13} />}
              </button>
            </div>

            <Link
              to="/docs/getting-started/installation"
              className="h-12 px-5 inline-flex items-center gap-2 rounded-xl btn-primary text-white text-[14px] font-medium"
            >
              Get started <Icons.ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-5 text-[12px] text-ink-300 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-soft" />
              1,653 tests passing
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">MIT licensed</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">PHP 8.2+ / Laravel 11+</span>
          </div>
        </div>

        {/* Hero screenshot — real dashboard from the playground. The
            two floating screenshots (resource index + system cache)
            are clipped on small viewports so the main shot stays
            centred and intelligible. */}
        <div className="relative mt-16">
          <div className="absolute -inset-x-20 -top-10 -bottom-10 accent-glow opacity-60 pointer-events-none" />
          <div className="relative rounded-2xl ring-1 ring-white/10 bg-ink-900 overflow-hidden shadow-[0_30px_120px_-20px_rgba(91,127,255,0.35)]">
            <div className="flex items-center gap-2 px-4 h-9 bg-ink-850 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
              <div className="ml-4 flex items-center gap-2 h-6 px-3 rounded-md bg-ink-900 ring-faint text-[11px] font-mono text-ink-300">
                <Icons.Lock size={10} /> martis.realedgefx.com/martis
              </div>
            </div>
            <img
              src="/screenshots/dashboard.png"
              alt="Martis dashboard"
              className="w-full block"
              loading="eager"
            />
          </div>

          <div className="hidden lg:block absolute -right-4 -bottom-10 w-[280px] rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden shadow-2xl rotate-3">
            <img
              src="/screenshots/resource-index.png"
              alt="Resource index"
              className="w-full block opacity-95"
              loading="lazy"
            />
          </div>
          <div className="hidden lg:block absolute -left-6 -bottom-4 w-[220px] rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden shadow-2xl -rotate-3">
            <img
              src="/screenshots/system-cache.png"
              alt="System cache"
              className="w-full block opacity-95"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
