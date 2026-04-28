import { Link, useLocation } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { DOC_NAV } from '@/lib/docs-tree'

export function DocsSidebar() {
  const { pathname } = useLocation()
  // pathname is /docs/<slug> — strip the prefix to compare with the
  // tree entries. We compare with `startsWith('/docs/')` to keep the
  // matching loose against trailing slashes.
  const currentSlug = pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '')

  return (
    <aside className="hidden lg:block w-[260px] shrink-0 sticky top-16 self-start max-h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-4">
      {DOC_NAV.map((g) => (
        <div key={g.group} className="mb-6">
          <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-400">
            {g.group}
          </div>
          <ul className="space-y-px">
            {g.items.map((item) => {
              const Ico = Icons[item.icon] ?? Icons.Hash
              const active = item.slug === currentSlug
              return (
                <li key={item.slug}>
                  <Link
                    to={`/docs/${item.slug}`}
                    title={item.tooltip}
                    className={`flex items-center gap-2.5 h-8 px-2 rounded-md text-[13px] transition-colors ${
                      active
                        ? 'bg-cobalt-500/15 text-white'
                        : 'text-ink-200 hover:text-white hover:bg-white/[0.03]'
                    }`}
                  >
                    <Ico
                      size={13}
                      className={active ? 'text-cobalt-300' : 'text-ink-400'}
                    />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        title={item.tooltip}
                        aria-label={item.tooltip}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ink-800 text-ink-300"
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
