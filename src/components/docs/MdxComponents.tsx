import type { ComponentProps } from 'react'
import { CodeBlock } from '@/components/CodeBlock'

/**
 * Component overrides applied to MDX-rendered HTML. The MDX provider
 * passes `<pre>` blocks through here so we can render them with our
 * styled `CodeBlock` instead of the default browser preformatted
 * element.
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
}
