import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import tailwind from '@tailwindcss/vite'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// MDX is the source of truth for documentation pages. Each `.mdx` in
// `src/content/` exports a default React component, plus its
// frontmatter (title, description, order) as a named export. The
// router glob-imports them at build time so the sidebar tree and the
// per-page metadata both come from the same source.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
      '@content': path.resolve(projectRoot, 'src/content'),
    },
  },
  plugins: [
    {
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [
          remarkGfm,
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      }),
      enforce: 'pre',
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwind(),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1024,
  },
  server: {
    port: 5173,
  },
})
