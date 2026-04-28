import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icons } from '@/components/icons'
import {
  STATIC_INDEX,
  searchStatic,
  searchFullText,
  type SearchHit,
} from '@/lib/search'

interface CmdKProps {
  open: boolean
  onClose: () => void
}

/**
 * Cmd+K command palette. Direct port of the design-system reference,
 * extended with Pagefind-backed full-text search when the runtime
 * `/pagefind/pagefind.js` is present (post-build) and a graceful
 * fallback to the static index otherwise.
 *
 * Keyboard:
 *   ↑ / ↓ / k / j   move selection
 *   ↵               navigate to active hit
 *   Esc             close
 */
export function CmdK({ open, onClose }: CmdKProps) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [fullTextHits, setFullTextHits] = useState<SearchHit[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Reset state on open. The setTimeout gives the modal a tick to mount
  // before we steal focus — without it Safari sometimes loses the
  // keyboard event that opened us.
  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setFullTextHits([])
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [open])

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Pagefind side-channel: debounce, then merge into the visible list.
  useEffect(() => {
    if (!open) return
    if (!q.trim()) {
      setFullTextHits([])
      return
    }
    let cancelled = false
    const t = setTimeout(() => {
      void searchFullText(q).then((hits) => {
        if (!cancelled) setFullTextHits(hits)
      })
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q, open])

  const flat = useMemo(() => {
    const staticHits = q.trim() ? searchStatic(q) : STATIC_INDEX
    if (!fullTextHits.length) return staticHits
    // Merge: keep static hits first (curated nav, fast), then pagefind
    // hits whose href is not already covered. Static wins on ties.
    const seen = new Set(staticHits.map((h) => h.href))
    const extras = fullTextHits.filter((h) => !seen.has(h.href))
    return [...staticHits, ...extras]
  }, [q, fullTextHits])

  const grouped = useMemo(() => {
    const m = new Map<string, SearchHit[]>()
    for (const it of flat) {
      const arr = m.get(it.group) ?? []
      arr.push(it)
      m.set(it.group, arr)
    }
    return Array.from(m.entries())
  }, [flat])

  // Keyboard navigation. Bound to window so the input does not need to
  // capture every keystroke (the input still receives text input).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'j')) {
        e.preventDefault()
        setActive((a) => Math.min(a + 1, flat.length - 1))
      } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault()
        setActive((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const hit = flat[active]
        if (hit) {
          onClose()
          navigate(hit.href)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, flat, active, onClose, navigate])

  // Reset highlight when the query changes.
  useEffect(() => {
    setActive(0)
  }, [q])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] fade-in"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search Martis docs"
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-start justify-center pt-[12vh] px-4">
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="cmdk-anim w-full max-w-[640px] bg-ink-850/95 backdrop-blur-xl ring-1 ring-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
            <Icons.Search size={18} className="text-ink-300" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search docs, fields, commands…"
              className="flex-1 bg-transparent text-[15px] text-white placeholder:text-ink-400 outline-none"
            />
            <kbd className="kbd">Esc</kbd>
          </div>

          <div className="max-h-[420px] overflow-y-auto py-2">
            {flat.length === 0 ? (
              <div className="px-5 py-10 text-center text-ink-300">
                <div className="text-sm">
                  No results for &ldquo;
                  <span className="text-white">{q}</span>&rdquo;
                </div>
                <div className="text-xs mt-1 text-ink-400">
                  Try &ldquo;fields&rdquo;, &ldquo;metrics&rdquo;, or &ldquo;install&rdquo;
                </div>
              </div>
            ) : (
              grouped.map(([group, items]) => (
                <div key={group} className="mb-1">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-ink-400">
                    {group}
                  </div>
                  {items.map((it) => {
                    const idx = flat.indexOf(it)
                    const isActive = idx === active
                    const Ico = Icons[it.icon] ?? Icons.Hash
                    return (
                      <button
                        type="button"
                        key={`${it.href}-${idx}`}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => {
                          onClose()
                          navigate(it.href)
                        }}
                        className={`w-full flex items-center gap-3 mx-0 px-4 h-11 cursor-pointer text-left ${
                          isActive ? 'bg-cobalt-500/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-md ${
                            isActive
                              ? 'bg-cobalt-500/20 text-cobalt-300'
                              : 'bg-ink-800 text-ink-300'
                          }`}
                        >
                          <Ico size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13.5px] text-white truncate">
                            {it.title}
                          </div>
                          <div className="text-[11.5px] text-ink-300 truncate">
                            {it.desc || it.href}
                          </div>
                        </div>
                        {isActive && (
                          <Icons.CornerDownLeft
                            size={13}
                            className="text-cobalt-300"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between px-4 h-10 border-t border-white/5 bg-ink-900/50 text-[11px] text-ink-300 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↵</kbd> open
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>powered by</span>
              <span className="text-ink-200">martis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
