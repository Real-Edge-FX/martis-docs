import { useEffect, useMemo, useState } from 'react'
import { Icons } from '@/components/icons'

export interface Heading {
  id: string
  text: string
  level: 2 | 3
}

interface TocProps {
  /** Page slug, used to build the "Edit on GitHub" link. */
  slug: string
}

/**
 * Right-rail "On this page" TOC. Reads `<h2 id="...">` and
 * `<h3 id="...">` from the rendered MDX article on mount, listens
 * to scroll, and highlights whichever heading the user is currently
 * past. Quiet when the article has no headings.
 */
export function Toc({ slug }: TocProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    // Wait one tick for MDX to mount before harvesting headings.
    const id = window.setTimeout(() => {
      const article = document.querySelector('article.prose-martis')
      if (!article) return
      const nodes = Array.from(
        article.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]'),
      )
      setHeadings(
        nodes.map((n) => ({
          id: n.id,
          text: n.innerText.trim(),
          level: (n.tagName === 'H2' ? 2 : 3) as 2 | 3,
        })),
      )
    }, 0)
    return () => window.clearTimeout(id)
  }, [slug])

  useEffect(() => {
    if (headings.length === 0) return
    const onScroll = () => {
      const offsets = headings
        .map((h) => {
          const el = document.getElementById(h.id)
          return el ? { id: h.id, top: el.getBoundingClientRect().top } : null
        })
        .filter((x): x is { id: string; top: number } => x !== null)
      const passed = offsets.filter((o) => o.top < 120)
      if (passed.length) {
        setActive(passed[passed.length - 1]!.id)
      } else if (offsets[0]) {
        setActive(offsets[0].id)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [headings])

  const githubUrl = useMemo(
    () =>
      `https://github.com/Real-Edge-FX/martis-docs/blob/main/src/content/${slug}.mdx`,
    [slug],
  )

  if (headings.length === 0) {
    return (
      <aside className="hidden xl:block w-[200px] shrink-0 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto py-8 pl-4">
        <div className="space-y-2">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[12px] text-ink-300 hover:text-white"
          >
            <Icons.GitHub size={12} /> Edit on GitHub
          </a>
        </div>
      </aside>
    )
  }

  return (
    <aside className="hidden xl:block w-[200px] shrink-0 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto py-8 pl-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400 pb-3">
        On this page
      </div>
      <ul className="space-y-2 border-l border-white/5">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: h.level === 3 ? 24 : 16 }}
            className={active === h.id ? 'border-l-2 -ml-px border-cobalt-400' : ''}
          >
            <a
              href={`#${h.id}`}
              className={`text-[12.5px] block leading-snug ${
                active === h.id ? 'text-white' : 'text-ink-300 hover:text-white'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[12px] text-ink-300 hover:text-white"
        >
          <Icons.GitHub size={12} /> Edit on GitHub
        </a>
      </div>
    </aside>
  )
}
