import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CmdK } from '@/components/CmdK'

interface CmdKContextValue {
  open: boolean
  show: () => void
  hide: () => void
  toggle: () => void
}

const CmdKContext = createContext<CmdKContextValue | null>(null)

/**
 * Mounts the Cmd+K palette once at the app root and exposes show/hide
 * to any descendant via `useCmdK()`. The hotkey (⌘K on macOS, Ctrl+K
 * elsewhere) is bound globally here so every surface honours it without
 * each page re-binding the listener.
 */
export function CmdKProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const show = useCallback(() => setOpen(true), [])
  const hide = useCallback(() => setOpen(false), [])
  const toggle = useCallback(() => setOpen((v) => !v), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggle()
      } else if (e.key === '/' && !isFormElement(e.target)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  const value = useMemo<CmdKContextValue>(
    () => ({ open, show, hide, toggle }),
    [open, show, hide, toggle],
  )

  return (
    <CmdKContext.Provider value={value}>
      {children}
      <CmdK open={open} onClose={hide} />
    </CmdKContext.Provider>
  )
}

export function useCmdK(): CmdKContextValue {
  const ctx = useContext(CmdKContext)
  if (!ctx) {
    throw new Error('useCmdK must be used inside <CmdKProvider>')
  }
  return ctx
}

function isFormElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  )
}
