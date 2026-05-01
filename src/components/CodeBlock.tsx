import { useState } from 'react'
import { Icons } from '@/components/icons'

interface CodeBlockProps {
  code: string
  /** Language hint (`php`, `ts`, `bash`). Used by the simple inline
   *  highlighter that ships with the prototype; replace with shiki
   *  later if richer highlighting is needed. */
  lang?: string
  /** Tab-bar filename rendered in the chrome. */
  filename?: string
  /** Render gutter line numbers. */
  lineNumbers?: boolean
}

/**
 * Code block matching the design-system reference. Until shiki is
 * wired in, a tiny tokenising pass over PHP/TS/JS keywords + strings
 * + comments is good enough to ship the landing screenshots without
 * a grey block. The output uses the `.tok-*` classes defined in
 * `globals.css`.
 */
export function CodeBlock({ code, lang = 'php', filename, lineNumbers = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    })
  }

  const lines = code.split('\n')

  return (
    <div className="rounded-xl ring-1 ring-white/10 bg-ink-950 overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-3 h-9 bg-ink-850 border-b border-white/5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-300">
            <Icons.Hash size={11} />
            {filename}
          </div>
          <button
            type="button"
            onClick={copy}
            className="h-6 w-6 grid place-items-center rounded hover:bg-white/5 text-ink-300 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {copied ? <Icons.Check size={12} /> : <Icons.Copy size={12} />}
          </button>
        </div>
      )}
      <pre className="p-5 overflow-x-auto text-[12.5px] leading-[1.65] font-mono">
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-4">
              {lineNumbers && (
                <span className="select-none text-ink-500 text-right w-7 shrink-0">{i + 1}</span>
              )}
              <span
                className="flex-1"
                dangerouslySetInnerHTML={{ __html: highlight(line, lang) || '&nbsp;' }}
              />
            </div>
          ))}
        </code>
      </pre>
    </div>
  )
}

// Tiny, deliberately-naive syntax highlighter. Good enough for the
// landing/code samples; full shiki kicks in once we wire it.
//
// Tokeniser over the raw source line (NOT the escaped HTML) prevents
// the previous regex-cascade bug, where the keyword pass matched the
// literal word `class` inside `<span class="tok-str">` it had just
// generated, leaking attribute markup into rendered text such as
// `class="tok-str">'name';`. We tokenise first, escape per-token, and
// only emit HTML at the end.
type Tok = { cls: string | null; text: string }

const KEYWORDS = new Set([
  'class', 'extends', 'implements', 'public', 'protected', 'private',
  'static', 'function', 'return', 'use', 'namespace', 'new', 'null',
  'true', 'false', 'const', 'interface', 'abstract', 'throw', 'throws',
  'if', 'else', 'foreach', 'for', 'while', 'in', 'out', 'as', 'from',
  'import', 'export', 'default', 'async', 'await', 'let', 'var', 'type',
])

function highlight(line: string, lang: string): string {
  if (lang === 'bash' || lang === 'shell') {
    const m = /^(\$ )(.+)$/.exec(line)
    if (m) {
      return '<span class="tok-pun">' + escape(m[1]) + '</span>'
        + '<span class="tok-var">' + escape(m[2]) + '</span>'
    }
    return escape(line)
  }

  const tokens: Tok[] = []
  let i = 0
  const n = line.length

  // Single regex with alternation, scanned linearly so each character
  // belongs to exactly one token. Order matters: comments and strings
  // come first so identifiers inside them are not classified.
  const re = /(\/\/.*)|('[^']*'|"[^"]*")|(\$[A-Za-z_]\w*)|([A-Za-z_]\w*)/g
  let lastEnd = 0
  for (let m = re.exec(line); m; m = re.exec(line)) {
    if (m.index > lastEnd) {
      tokens.push({ cls: null, text: line.slice(lastEnd, m.index) })
    }
    if (m[1] !== undefined) {
      tokens.push({ cls: 'tok-com', text: m[1] })
    } else if (m[2] !== undefined) {
      tokens.push({ cls: 'tok-str', text: m[2] })
    } else if (m[3] !== undefined) {
      tokens.push({ cls: 'tok-var', text: m[3] })
    } else if (m[4] !== undefined) {
      const word = m[4]
      if (KEYWORDS.has(word)) {
        tokens.push({ cls: 'tok-kw', text: word })
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ cls: 'tok-cls', text: word })
      } else {
        tokens.push({ cls: null, text: word })
      }
    }
    lastEnd = m.index + m[0].length
    i = lastEnd
  }
  if (i < n) {
    tokens.push({ cls: null, text: line.slice(i) })
  }

  return tokens
    .map((t) => (t.cls ? '<span class="' + t.cls + '">' + escape(t.text) + '</span>' : escape(t.text)))
    .join('')
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
