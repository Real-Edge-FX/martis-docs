import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { Icons } from '@/components/icons'

type CopyStatus = 'idle' | 'copied' | 'fallback'

const COPY_LABEL = 'Copy install command'
const COPIED_STATUS = 'Copied'
const FALLBACK_STATUS = 'Select and copy the command'
/** How long the "Copied" confirmation stays before the button returns to idle. */
export const COPIED_RESET_MS = 2000

const STATUS_TEXT: Record<CopyStatus, string> = {
  idle: '',
  copied: COPIED_STATUS,
  fallback: FALLBACK_STATUS,
}

interface InstallCommandProps {
  /** The shell command to display and copy, e.g. `composer require martis/martis`. */
  command: string
  /** Optional class hook for layout (hero vs. final CTA placement). */
  className?: string
}

/**
 * The install command block used in the hero and the final CTA (design
 * spec 6.1 and 6.9). The command text lives in the server-rendered
 * `<code>` and is selectable without JavaScript (spec 16, "clipboard
 * bloqueado"). The copy button is a progressive enhancement: it calls
 * `navigator.clipboard.writeText`, and when that throws (blocked
 * permission, insecure context, no JS-free fallback available) it
 * selects the command text instead and points the reader at manual
 * copy. Either outcome is announced through a polite live region so
 * assistive tech hears the result without moving focus.
 */
export function InstallCommand({ command, className }: InstallCommandProps) {
  const codeRef = useRef<HTMLElement>(null)
  const [status, setStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // `handleCopy` awaits `navigator.clipboard.writeText` before touching
  // state; if the component unmounts while that promise is pending (a
  // fast navigation away, or a test that unmounts mid-copy), the resumed
  // handler must not call `setState` on an unmounted component or arm a
  // reset timer nothing will ever clear.
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    // Never leave a pending reset behind after the component unmounts.
    return () => {
      mounted.current = false
      clearTimeout(resetTimer.current)
    }
  }, [])

  const selectCommand = () => {
    const node = codeRef.current
    const selection = window.getSelection?.()
    if (!node || !selection) return
    const range = document.createRange()
    range.selectNodeContents(node)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    try {
      await navigator.clipboard.writeText(command)
      if (!mounted.current) return
      setStatus('copied')
      // The confirmation is transient: after a moment the button offers
      // to copy again. The manual-copy fallback below stays, because the
      // reader still has to act on it.
      clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setStatus('idle'), COPIED_RESET_MS)
    } catch {
      if (!mounted.current) return
      clearTimeout(resetTimer.current)
      selectCommand()
      setStatus('fallback')
    }
  }

  const copied = status === 'copied'

  return (
    <div className={['install-command', className].filter(Boolean).join(' ')}>
      <span className="install-command__prompt" aria-hidden="true">
        $
      </span>
      <code ref={codeRef} className="install-command__code">
        {command}
      </code>
      <button
        type="button"
        className="install-command__copy"
        onClick={handleCopy}
        aria-label={copied ? COPIED_STATUS : COPY_LABEL}
        data-copied={copied || undefined}
      >
        {copied ? <Icons.Check aria-hidden="true" size={14} /> : <Icons.Copy aria-hidden="true" size={14} />}
      </button>
      {/* Visible next to the button so a sighted user whose clipboard
       *  call fails (or succeeds) sees the outcome too, not just hears
       *  it. `role="status"`/`aria-live="polite"` still announce it to
       *  assistive tech from this same, visible element. The CSS gives
       *  it a reserved min-width (the longest status string) so its
       *  text appearing does not shift the row. */}
      <span className="install-command__status" role="status" aria-live="polite">
        {STATUS_TEXT[status]}
      </span>
    </div>
  )
}
