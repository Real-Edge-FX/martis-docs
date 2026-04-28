import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { findBySlug } from '@/lib/docs-tree'

interface BreadcrumbsProps {
  slug: string
}

export function DocsBreadcrumbs({ slug }: BreadcrumbsProps) {
  const item = findBySlug(slug)
  return (
    <div className="flex items-center gap-1.5 text-[12px] text-ink-300 font-mono mb-6">
      <Link to="/" className="hover:text-white">
        Home
      </Link>
      <Icons.ChevronRight size={11} className="text-ink-500" />
      <Link to="/docs" className="hover:text-white">
        Docs
      </Link>
      {item && (
        <>
          <Icons.ChevronRight size={11} className="text-ink-500" />
          <span className="text-ink-200">{item.group}</span>
          <Icons.ChevronRight size={11} className="text-ink-500" />
          <span className="text-white">{item.label}</span>
        </>
      )}
    </div>
  )
}
