import { useRef, useState } from 'react'
import { Icons } from '@/components/icons'

export function InstallCommand({ compact = false }: { compact?: boolean }) {
  const codeRef = useRef<HTMLElement>(null)
  const [state, setState] = useState<'idle' | 'copied' | 'fallback'>('idle')
  const command = 'composer require martis/martis'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command)
      setState('copied')
      window.setTimeout(() => setState('idle'), 1800)
    } catch {
      const selection = window.getSelection()
      const range = document.createRange()
      if (codeRef.current && selection) {
        range.selectNodeContents(codeRef.current)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      setState('fallback')
    }
  }

  return (
    <div className={`install-command ${compact ? 'install-command--compact' : ''}`}>
      <span className="install-prompt" aria-hidden="true">$</span>
      <code ref={codeRef}>{command}</code>
      <button type="button" onClick={copy} aria-label="Copy install command">
        {state === 'copied' ? <Icons.Check size={16} /> : <Icons.Copy size={16} />}
        <span>{state === 'copied' ? 'Copied' : 'Copy'}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Install command copied' : state === 'fallback' ? 'Select and copy the command' : ''}
      </span>
    </div>
  )
}
