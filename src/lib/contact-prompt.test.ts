import { describe, expect, it } from 'vitest'
import { CONTACT_PROMPT_KEY, markContactPromptShown, markContactPromptSubmitted, shouldShowContactPrompt } from './contact-prompt'

const morning = new Date(2026, 9, 8, 9, 0)
const evening = new Date(2026, 9, 8, 22, 0)
const nextDay = new Date(2026, 9, 9, 8, 0)

describe('contact prompt schedule', () => {
  it('shows once per calendar day', () => {
    expect(shouldShowContactPrompt(morning)).toBe(true)
    markContactPromptShown(morning)
    expect(shouldShowContactPrompt(evening)).toBe(false)
    expect(shouldShowContactPrompt(nextDay)).toBe(true)
  })

  it('stays closed for 30 days after a message was sent', () => {
    markContactPromptSubmitted(morning)
    expect(shouldShowContactPrompt(nextDay)).toBe(false)
    expect(shouldShowContactPrompt(new Date(2026, 10, 9))).toBe(true)
  })

  it('stays closed when storage is unavailable or read-only', () => {
    expect(shouldShowContactPrompt(morning, () => { throw new Error('blocked') })).toBe(false)
    const readOnly = { getItem: () => null, setItem: () => { throw new Error('quota') } } as unknown as Storage
    expect(shouldShowContactPrompt(morning, () => readOnly)).toBe(false)
  })

  it('recovers from a corrupted entry', () => {
    localStorage.setItem(CONTACT_PROMPT_KEY, '{not json')
    expect(shouldShowContactPrompt(morning)).toBe(true)
  })
})
