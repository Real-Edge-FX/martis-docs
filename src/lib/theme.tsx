import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type ThemePreference = 'system' | 'light' | 'dark'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (preference: ThemePreference) => void
}

const STORAGE_KEY = 'martis-theme'
const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initialPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' || stored === 'light' ? stored : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(initialPreference)
  const [system, setSystem] = useState<ResolvedTheme>(systemTheme)
  const resolvedTheme = preference === 'system' ? system : preference

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystem(query.matches ? 'dark' : 'light')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
    if (preference === 'system') window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, preference)
  }, [preference, resolvedTheme])

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}

export function ThemeToggle() {
  const { resolvedTheme, setPreference } = useTheme()
  const next = resolvedTheme === 'dark' ? 'light' : 'dark'
  return <button className="theme-toggle" type="button" aria-label={`Use ${next} theme`} onClick={() => setPreference(next)}><span aria-hidden="true">{resolvedTheme === 'dark' ? '☼' : '◐'}</span><span>{next === 'light' ? 'Light' : 'Dark'}</span></button>
}
