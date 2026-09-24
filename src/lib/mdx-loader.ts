import type { ComponentType } from 'react'

/** A compiled MDX page: its React component plus the frontmatter export. */
export interface MdxModule {
  default: ComponentType
  frontmatter?: {
    title?: string
    description?: string
    [k: string]: unknown
  }
}

// Vite glob: every MDX under src/content/ becomes a lazy import. Each
// importer returns the module on demand so the docs route only loads
// the page the user is reading. The keys come back as relative paths
// like `/src/content/getting-started/installation.mdx` — we strip the
// boilerplate so the public lookup is by `slug`.
const modules = import.meta.glob<MdxModule>('/src/content/**/*.mdx')

const bySlug: Record<string, () => Promise<MdxModule>> = {}
for (const [path, loader] of Object.entries(modules)) {
  const slug = path
    .replace(/^\/src\/content\//, '')
    .replace(/\.mdx$/, '')
    // Treat `/index` as the parent slug — `core/index.mdx` ⇒ `core`.
    .replace(/\/index$/, '')
  bySlug[slug] = loader
}

/** Turns the `/docs/*` route splat (`getting-started/installation/`) into a slug
 *  (`getting-started/installation`) by trimming leading and trailing slashes. */
export function docSlugFromSplat(splat: string | undefined): string {
  return (splat ?? '').replace(/^\/+|\/+$/g, '')
}

export function loadMdx(slug: string): Promise<MdxModule> | null {
  const loader = bySlug[slug]
  return loader ? loader() : null
}

export function hasMdx(slug: string): boolean {
  return slug in bySlug
}

export function listSlugs(): string[] {
  return Object.keys(bySlug).sort()
}
