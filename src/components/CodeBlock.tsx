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
 * wired in, a tiny regex pass over PHP/TS/JS keywords + strings +
 * comments is good enough to ship the landing screenshots without
 * a placeholder grey block. The output uses the `.tok-*` classes
 * defined in `globals.css`.
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
function highlight(line: string, lang: string): string {
  let out = escape(line)

  if (lang === 'bash' || lang === 'shell') {
    out = out.replace(/^(\$ )(.+)$/, '<span class="tok-pun">$1</span><span class="tok-var">$2</span>')
    return out
  }

  // Comments first so the patterns below do not chew them.
  out = out.replace(/(\/\/.*)$/g, '<span class="tok-com">$1</span>')

  // Strings (single + double).
  out = out.replace(/('[^']*'|"[^"]*")/g, '<span class="tok-str">$1</span>')

  // PHP / TS keywords.
  out = out.replace(
    /\b(class|extends|implements|public|protected|private|static|function|return|use|namespace|new|null|true|false|const|interface|abstract|throw|throws|if|else|foreach|for|while|in|out|as|from|import|export|default|async|await|let|const|var|type)\b/g,
    '<span class="tok-kw">$1</span>',
  )

  // PHP variables ($foo) — keep name token coloured.
  out = out.replace(/(\$[A-Za-z_]\w*)/g, '<span class="tok-var">$1</span>')

  // ClassName / TypeName (CapitalCase identifiers).
  out = out.replace(/\b([A-Z][A-Za-z0-9]*)\b/g, '<span class="tok-cls">$1</span>')

  return out
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
