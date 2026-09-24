import { useEffect, useState, type ComponentType } from 'react'
import { Routes, Route, useParams, useLocation, Link } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { TopBar } from '@/components/landing/TopBar'
import { Footer } from '@/components/landing/Footer'
import { DocsSidebar } from '@/components/docs/Sidebar'
import { Toc } from '@/components/docs/Toc'
import { DocsBreadcrumbs } from '@/components/docs/Breadcrumbs'
import { DocsPagination } from '@/components/docs/Pagination'
import { LoadingScreen } from '@/components/LoadingScreen'
import { mdxComponents } from '@/components/docs/MdxComponents'
import { DOC_NAV } from '@/lib/docs-tree'
import { docSlugFromSplat, hasMdx, loadMdx } from '@/lib/mdx-loader'
import { useInitialDocument } from '@/lib/render-context'

/**
 * `/docs/*` route. Renders the doc shell (sidebar + breadcrumbs +
 * MDX article + on-this-page TOC + prev/next). The actual MDX module
 * is dynamically imported by slug so each page is its own chunk; the
 * page the app first renders arrives already resolved through
 * `RenderProvider` instead.
 */
export default function Docs() {
  return (
    <div className="min-h-screen bg-ink-900 text-ink-100">
      <TopBar />
      <div className="max-w-[1280px] mx-auto px-6 flex gap-8">
        <DocsSidebar />
        <Routes>
          <Route index element={<DocsIndex />} />
          <Route path="*" element={<DocPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

/**
 * Minimal `/docs` index: every `DOC_NAV` group as a list of links, so the
 * prerendered page has real content and navigation without JavaScript.
 * Phase 3 replaces it with the full docs home.
 */
function DocsIndex() {
  return (
    <main className="flex-1 min-w-0 py-12">
      <h1 className="text-3xl font-medium text-white tracking-tight">Documentation</h1>
      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        {DOC_NAV.map((group) => (
          <section key={group.group}>
            <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-400">
              {group.group}
            </h2>
            <ul className="mt-3 space-y-2">
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link to={`/docs/${item.slug}`} className="text-[14px] text-ink-200 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}

function DocPage() {
  const params = useParams<{ '*': string }>()
  const { hash } = useLocation()
  const slug = docSlugFromSplat(params['*'])
  // The page the app first rendered (on the server, or before hydrating)
  // comes resolved from `RenderProvider`, so it renders on the first pass;
  // every other page is imported by the effect below. Components are
  // functions, so both the initial state and the setters wrap them.
  const initialModule = useInitialDocument(slug)
  const [Component, setComponent] = useState<ComponentType | null>(
    () => initialModule?.default ?? null,
  )
  const notFound = slug !== '' && !hasMdx(slug)

  // A fresh slug means a fresh MDX module: swap it during render (before
  // this paints) so a stale page is never shown under the new URL while
  // the loader below fetches its replacement.
  const [prevSlug, setPrevSlug] = useState(slug)
  if (slug !== prevSlug) {
    setPrevSlug(slug)
    setComponent(() => initialModule?.default ?? null)
  }

  useEffect(() => {
    if (!slug || initialModule) return
    const loader = loadMdx(slug)
    if (!loader) return
    let cancelled = false
    loader.then((mod) => {
      if (cancelled) return
      setComponent(() => mod.default)
    })
    return () => {
      cancelled = true
    }
  }, [slug, initialModule])

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
