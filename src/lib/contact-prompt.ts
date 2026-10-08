/**
 * When the timed contact prompt may open: at most once per calendar day
 * per browser, and not for 30 days after a message was sent from it.
 * Storage that cannot be read or written keeps the prompt closed rather
 * than reopening it on every visit.
 */
export const CONTACT_PROMPT_KEY = 'martis.contactPrompt'
export const CONTACT_PROMPT_DELAY_MS = 20000
const SUBMITTED_QUIET_DAYS = 30

interface PromptState {
  lastShown?: string
  submittedAt?: number
}

const today = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

function read(storage: Storage): PromptState {
  const raw = storage.getItem(CONTACT_PROMPT_KEY)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as PromptState : {}
  } catch {
    return {}
  }
}

function write(storage: Storage, state: PromptState) {
  storage.setItem(CONTACT_PROMPT_KEY, JSON.stringify(state))
}

export function shouldShowContactPrompt(now = new Date(), storage: () => Storage = () => window.localStorage): boolean {
  try {
    const store = storage()
    const state = read(store)
    if (state.lastShown === today(now)) return false
    if (state.submittedAt && now.getTime() - state.submittedAt < SUBMITTED_QUIET_DAYS * 86400000) return false
    // Probe a write so a read-only store never shows the prompt each visit.
    write(store, state)
    return true
  } catch {
    return false
  }
}

export function markContactPromptShown(now = new Date(), storage: () => Storage = () => window.localStorage) {
  try {
    const store = storage()
    write(store, { ...read(store), lastShown: today(now) })
  } catch { /* storage unavailable: nothing to remember */ }
}

export function markContactPromptSubmitted(now = new Date(), storage: () => Storage = () => window.localStorage) {
  try {
    const store = storage()
    write(store, { ...read(store), submittedAt: now.getTime() })
  } catch { /* storage unavailable: nothing to remember */ }
}
