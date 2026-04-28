import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { prevNext } from '@/lib/docs-tree'

interface PaginationProps {
  slug: string
}

export function DocsPagination({ slug }: PaginationProps) {
  const { prev, next } = prevNext(slug)
  return (
    <div className="mt-16 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
      {prev ? (
        <Link
          to={`/docs/${prev.slug}`}
          className="group p-5 rounded-xl ring-1 ring-white/5 hover:bg-ink-850 hover:ring-white/10 transition"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-400 flex items-center gap-1.5">
            <Icons.ChevronRight size={11} className="rotate-180" />
            Previous
          </div>
          <div className="mt-1 text-[15px] font-medium text-white">{prev.label}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/docs/${next.slug}`}
          className="group p-5 rounded-xl ring-1 ring-white/5 hover:bg-ink-850 hover:ring-white/10 transition text-right"
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-400 flex items-center justify-end gap-1.5">
            Next <Icons.ChevronRight size={11} />
          </div>
          <div className="mt-1 text-[15px] font-medium text-white">{next.label}</div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
