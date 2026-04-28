import { useState } from 'react'
import { CodeBlock } from '@/components/CodeBlock'
import { Icons } from '@/components/icons'
import { CODE_SAMPLES, type CodeSampleKey } from '@/data/landing'

const TABS: { id: CodeSampleKey; label: string; lines: number; preview: string; alt: string }[] = [
  { id: 'resource', label: 'Resource', lines: 22, preview: '/screenshots/resource-index.png',  alt: 'Resource index'  },
  { id: 'metric',   label: 'Metric',   lines: 18, preview: '/screenshots/dashboard.png',       alt: 'Dashboard'       },
  { id: 'action',   label: 'Action',   lines: 28, preview: '/screenshots/resource-create.png', alt: 'Create form'     },
]

export function CodeUI() {
  const [tab, setTab] = useState<CodeSampleKey>('resource')
  const sample = CODE_SAMPLES[tab]
  const cur = TABS.find((t) => t.id === tab)!

  return (
    <section className="py-24 relative">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="max-w-3xl mb-12">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-3">
            Code → UI
          </div>
          <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.025em] leading-[1.1] font-medium text-white">
            Declare it once. Ship a real panel.
          </h2>
          <p className="mt-4 text-ink-200">
            Every Resource, Metric and Action is a plain PHP class. Martis renders
            the React, wires routes, builds forms, validates input, and persists
            view state — for free.
          </p>
        </div>

        <div className="flex items-center gap-1 mb-5 p-1 rounded-lg bg-ink-850 ring-faint w-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 h-8 rounded-md text-[12.5px] font-medium transition-colors ${
                tab === t.id
                  ? 'bg-cobalt-500/20 text-white'
                  : 'text-ink-300 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="lg:sticky lg:top-24">
            <CodeBlock
              lang={sample.lang}
              filename={sample.file}
              code={sample.code}
              lineNumbers
            />
          </div>
          <div>
            <div className="rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden">
              <div className="flex items-center gap-2 px-3 h-8 bg-ink-850 border-b border-white/5 text-[11px] font-mono text-ink-300">
                <Icons.Eye size={11} /> rendered output
              </div>
              <img
                src={cur.preview}
                alt={cur.alt}
                className="w-full block"
                loading="lazy"
              />
            </div>
            <div className="mt-3 text-[12.5px] text-ink-300 font-mono">
              <span className="text-cobalt-300">→</span> auto-discovered, no
              registration code, ~{cur.lines} lines of PHP
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
