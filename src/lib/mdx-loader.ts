import type { ComponentType } from 'react'

interface MdxModule {
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
