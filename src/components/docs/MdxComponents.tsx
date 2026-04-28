import type { ComponentProps } from 'react'
import { Link } from 'react-router-dom'
import { CodeBlock } from '@/components/CodeBlock'

/**
 * Component overrides applied to MDX-rendered HTML.
 *
 * - `<pre>` is unwrapped into our styled `CodeBlock` so syntax-aware
 *   chrome (filename row, copy button, naive highlight) shows up.
 *
 * - `<a>` is rewritten:
 *     * `/...` → React Router `<Link>` so internal navigation stays
 *       inside the SPA. Without this every internal link in synced
 *       markdown triggered a full page reload, which destroyed scroll
 *       position, history (the user-reported "back button doesn't
 *       work"), and search-palette state.
 *     * `http(s)://` → plain `<a target="_blank" rel="noopener">`
 *     * `#anchor`, `mailto:`, `tel:` → plain `<a>` (browser handles).
 */
export const mdxComponents = {
  pre: (props: ComponentProps<'pre'>) => {
    // MDX wraps `<pre>` around `<code className="language-xyz">`.
    // We pull the language hint and the code text out of the child.
    const child = props.children as
      | { props?: { className?: string; children?: string } }
      | undefined
    const className = child?.props?.className ?? ''
    const lang = (className.match(/language-(\w+)/)?.[1] ?? 'text').toLowerCase()
    const code = (child?.props?.children ?? '').toString().replace(/\n$/, '')
    return <CodeBlock code={code} lang={lang} />
  },
  a: ({ href = '', children, ...rest }: ComponentProps<'a'>) => {
    const isExternal = /^https?:\/\//i.test(href)
    const isInternalRoute = href.startsWith('/')

    if (isInternalRoute) {
      // Strip any incoming `to`/`href` so the React Router `to` prop
      // is the single source of truth.
      const linkRest: Record<string, unknown> = { ...rest }
      delete linkRest.to
      delete linkRest.href
      return (
        <Link to={href} {...linkRest}>
          {children}
        </Link>
      )
    }
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      )
    }
    // Hash, mail, tel — let the browser handle.
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}
