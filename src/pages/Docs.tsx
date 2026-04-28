import { useEffect, useState, type ComponentType } from 'react'
import { Navigate, Routes, Route, useParams, useLocation, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { TopBar } from '@/components/landing/TopBar'
import { Footer } from '@/components/landing/Footer'
import { DocsSidebar } from '@/components/docs/Sidebar'
import { Toc } from '@/components/docs/Toc'
import { DocsBreadcrumbs } from '@/components/docs/Breadcrumbs'
import { DocsPagination } from '@/components/docs/Pagination'
import { LoadingScreen } from '@/components/LoadingScreen'
import { mdxComponents } from '@/components/docs/MdxComponents'
import { DOC_DEFAULT_SLUG, findBySlug } from '@/lib/docs-tree'
import { loadMdx } from '@/lib/mdx-loader'

/**
 * `/docs/*` route. Renders the doc shell (sidebar + breadcrumbs +
 * MDX article + on-this-page TOC + prev/next). The actual MDX module
 * is dynamically imported by slug so each page is its own chunk.
 */
export default function Docs() {
  return (
    <div className="min-h-screen bg-ink-900 text-ink-100">
      <TopBar />
      <div className="max-w-[1280px] mx-auto px-6 flex gap-8">
        <DocsSidebar />
        <Routes>
          <Route index element={<Navigate to={DOC_DEFAULT_SLUG} replace />} />
          <Route path="*" element={<DocPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

function DocPage() {
  const params = useParams<{ '*': string }>()
  const { hash } = useLocation()
  const slug = (params['*'] ?? '').replace(/^\/+|\/+$/g, '')
  const [Component, setComponent] = useState<ComponentType | null>(null)
  const [notFound, setNotFound] = useState(false)
  const meta = findBySlug(slug)

  useEffect(() => {
    setComponent(null)
    setNotFound(false)
    if (!slug) return
    const loader = loadMdx(slug)
    if (!loader) {
      setNotFound(true)
      return
    }
    let cancelled = false
    loader.then((mod) => {
      if (cancelled) return
      setComponent(() => mod.default)
      if (mod.frontmatter?.title) {
        document.title = `${mod.frontmatter.title} · Martis docs`
      } else if (meta) {
        document.title = `${meta.label} · Martis docs`
      }
    })
    return () => {
      cancelled = true
    }
  }, [slug, meta])

  // After the MDX module mounts, honour the URL hash by scrolling to
  // the matching heading. Without this, hitting `/docs/foo#bar` directly
  // (or having React Router navigate via Link to a hashed URL) leaves
  // the page at the top — the headings only get IDs once the article
  // is rendered, so the browser's default scroll-to-hash misses them.
  useEffect(() => {
    if (!Component || !hash) return
    const id = hash.startsWith('#') ? hash.slice(1) : hash
    const el = document.getElementById(decodeURIComponent(id))
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'auto', block: 'start' })
      })
    }
  }, [Component, hash])

  // Slug change → scroll to top so a fresh page does not inherit the
  // previous page's scroll position. Skipped when there is a hash.
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0 })
  }, [slug, hash])

  if (notFound) {
    return <DocNotFound slug={slug} />
  }

  if (!Component) {
    return (
      <main className="flex-1 min-w-0 py-12">
        <LoadingScreen />
      </main>
    )
  }

  return (
    <>
      <main className="flex-1 min-w-0 py-12">
        <DocsBreadcrumbs slug={slug} />
        <article className="prose-martis max-w-3xl">
          <MDXProvider components={mdxComponents}>
            <Component />
          </MDXProvider>
        </article>
        <DocsPagination slug={slug} />
      </main>
      <Toc slug={slug} />
    </>
  )
}

function DocNotFound({ slug }: { slug: string }) {
  return (
    <main className="flex-1 min-w-0 py-12">
      <h1 className="text-3xl font-medium text-white tracking-tight">Doc not found</h1>
      <p className="mt-3 text-ink-200">
        No MDX file is registered at <code>/src/content/{slug}.mdx</code>.
      </p>
      <Link
        to="/docs"
        className="mt-6 inline-flex items-center gap-2 h-9 px-4 rounded-lg btn-primary text-white text-[13px]"
      >
        Back to docs
      </Link>
    </main>
  )
}
