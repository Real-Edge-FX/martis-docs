import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, it } from 'vitest'

// `CodeBlock`'s `<pre>` (src/components/CodeBlock.tsx) only takes
// `tabIndex={0}` once it overflows, and WCAG 2.4.7 then needs a visible
// focus indicator on it. `src/pages/Docs.tsx` still renders the legacy
// `TopBar`/`Footer` shell, not `SiteShell`, so the `.site-shell
// :focus-visible` rule in site.css never reaches a code block on a docs
// page: the rule has to live unscoped, in globals.css, which every page
// loads.

const globalsCssRaw = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8')
// Strip comments first: a selector search over the raw text would also
// match prose in a comment (this file's own comment above the rule
// mentions `.site-shell` by name to explain why the rule is *not*
// scoped to it).
const globalsCss = globalsCssRaw.replace(/\/\*[\s\S]*?\*\//g, '')

it('gives a focusable code block a visible focus-visible outline, not scoped to .site-shell', () => {
  const rules = [...globalsCss.matchAll(/([^{}]*\.code-block__pre:focus-visible[^{}]*)\{([^}]*)\}/g)]
  expect(rules.length).toBeGreaterThan(0)
  for (const [, selector, body] of rules) {
    expect(selector).not.toMatch(/\.site-shell/)
    expect(body).toMatch(/outline(?:-style)?:\s*[^;]*solid/)
    expect(body).not.toMatch(/outline:\s*none/)
  }
})
