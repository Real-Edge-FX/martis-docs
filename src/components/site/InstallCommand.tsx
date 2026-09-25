import { useRef, useState, type MouseEvent } from 'react'
import { Icons } from '@/components/icons'

const COPY_LABEL = 'Copy install command'
const COPIED_STATUS = 'Copied'
const FALLBACK_STATUS = 'Select and copy the command'

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
  const [status, setStatus] = useState('')

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
      setStatus(COPIED_STATUS)
    } catch {
      selectCommand()
      setStatus(FALLBACK_STATUS)
    }
  }

  return (
    <div className={['install-command', className].filter(Boolean).join(' ')}>
      <span className="install-command__prompt" aria-hidden="true">
        $
      </span>
      <code ref={codeRef} className="install-command__code">
        {command}
      </code>
      <button type="button" className="install-command__copy" onClick={handleCopy}>
        <Icons.Copy aria-hidden="true" size={14} />
        <span className="sr-only">{COPY_LABEL}</span>
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </div>
  )
}
