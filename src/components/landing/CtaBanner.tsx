import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { Reveal } from '@/components/landing/Reveal'

/**
 * Closing call-to-action band. Sits between the stack section and the
 * footer to give the page a deliberate finish: a generated brand-light
 * backdrop (`/brand/cta-backdrop.webp`) under a dark legibility wash,
 * with the install command and primary CTA.
 */
export function CtaBanner() {
  const [copied, setCopied] = useState(false)

  function copyInstall() {
    navigator.clipboard?.writeText('composer require martis/martis').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  return (
    <section className="py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
            {/* Generated brand-light backdrop. */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: 'url(/brand/cta-backdrop.webp)' }}
            />
            {/* Legibility wash. */}
            <div className="absolute inset-0 bg-gradient-to-b from-ink-900/80 via-ink-900/60 to-ink-900/85" />
            <div className="noise" />

            <div className="relative px-6 py-20 sm:py-24 flex flex-col items-center text-center">
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-4">
                Ship today
              </div>
              <h2 className="text-[clamp(2rem,4.5vw,3.2rem)] tracking-[-0.03em] leading-[1.05] font-medium gradient-text max-w-[18ch]">
                Stop wiring admin panels by hand.
              </h2>
              <p className="mt-5 max-w-[52ch] text-[16px] leading-relaxed text-ink-200">
                One Composer require, one resource class, and you have a real,
                production-grade admin panel. Override anything when you need to.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-center gap-3">
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
              </div>

              <a
                href="https://github.com/Real-Edge-FX/martis-package"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-[13px] text-ink-300 hover:text-white transition-colors"
              >
                <Icons.GitHub size={15} /> Star it on GitHub
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
