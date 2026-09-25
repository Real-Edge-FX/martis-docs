import { useEffect, useRef, useState } from 'react'
import { Icons } from '@/components/icons'
import { useOverflowFocusable } from '@/hooks/useOverflowFocusable'

type CopyStatus = 'idle' | 'copied' | 'fallback'

/** How long the "Copied" confirmation stays before the button offers to copy again. */
export const COPY_RESET_MS = 1400

const STATUS_TEXT: Record<CopyStatus, string> = {
  idle: '',
  copied: 'Copied',
  fallback: 'Select and copy the code',
}

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
  const [status, setStatus] = useState<CopyStatus>('idle')
  const codeRef = useRef<HTMLElement>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // The clipboard promise can settle after the block unmounts (a fast
  // navigation away): the resumed handler must not set state or arm a
  // reset timer nothing would ever clear.
  const mounted = useRef(true)
  // Whether the block currently needs a keyboard-reachable scroller (see
  // useOverflowFocusable): true until measured otherwise, so the tab stop
  // is present without JavaScript too. Re-measures whenever `code` or
  // `lang` change under the same instance, not just at mount.
  const { ref: preRef, focusable } = useOverflowFocusable<HTMLPreElement>(`${lang}:${code}`)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(resetTimer.current)
    }
  }, [])

  // Same progressive enhancement as InstallCommand: when the clipboard is
  // blocked or missing, select the code so the reader can copy it by hand,
  // and say so in the visible status next to the button.
  function selectCode() {
    const node = codeRef.current
    const selection = window.getSelection?.()
    if (!node || !selection) return
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  async function copy() {
    clearTimeout(resetTimer.current)
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(code)
      if (!mounted.current) return
      setStatus('copied')
      resetTimer.current = setTimeout(() => setStatus('idle'), COPY_RESET_MS)
    } catch {
      if (!mounted.current) return
      selectCode()
      setStatus('fallback')
    }
  }

  const copied = status === 'copied'

  const lines = code.split('\n')

  return (
    <div className="rounded-xl ring-1 ring-white/10 bg-ink-950 overflow-hidden">
      {filename && (
        <div className="flex items-center justify-between px-3 h-9 bg-ink-850 border-b border-white/5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-ink-300">
            <Icons.Hash aria-hidden="true" size={11} />
            {filename}
          </div>
          <div className="flex items-center gap-2">
            {/* Visible, so a sighted reader whose clipboard is blocked sees the
             *  manual-copy instruction too; `role="status"` announces the same
             *  text politely without moving focus. */}
            <span role="status" aria-live="polite" className="text-[11px] font-mono text-ink-300">
              {STATUS_TEXT[status]}
            </span>
            <button
              type="button"
              onClick={copy}
              className="h-6 w-6 grid place-items-center rounded hover:bg-white/5 text-ink-300 hover:text-white transition-colors"
              aria-label={copied ? 'Copied' : 'Copy code'}
            >
              {copied ? <Icons.Check aria-hidden="true" size={12} /> : <Icons.Copy aria-hidden="true" size={12} />}
            </button>
          </div>
        </div>
      )}
      {/* Long lines scroll horizontally. A scrollable region must be
       *  focusable to be scrolled by keyboard (WCAG 2.1.1 / axe
       *  scrollable-region-focusable), and there is no way to know
       *  without JavaScript whether this block actually overflows — so it
       *  starts (server HTML and first client render) as a tab stop with
       *  a name, and only loses that, post-mount, once measured as not
       *  needing it (useOverflowFocusable). Spread so the attributes are
       *  absent entirely (not just falsy) once dropped. */}
      <pre
        ref={preRef}
        data-testid="code-block-pre"
        {...(focusable
          ? {
              tabIndex: 0,
              role: 'group',
              'aria-label': filename ? `Code: ${filename}` : `Code sample (${lang})`,
            }
          : {})}
        className="code-block__pre p-5 overflow-x-auto text-[12.5px] leading-[1.65] font-mono"
      >
        <code ref={codeRef}>
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
