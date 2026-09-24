import { describe, expect, it, vi } from 'vitest'
import { assertConsoleSilent } from './assert-console-silent'

describe('assertConsoleSilent', () => {
  it('restores every spy even when the assertion throws, so it cannot cascade into a later test', () => {
    const originalError = console.error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    spy('boom') // an unexpected call: what assertConsoleSilent exists to catch

    expect(() => assertConsoleSilent([spy])).toThrow()
    // The throw above must not have skipped the restore: console.error is
    // back to what it was before spyOn, not still the mocked spy
    // implementation. A bare "assert, then restore" with no try/finally
    // (the historical bug this replaces) gets this wrong — the assertion
    // throwing exits the function immediately, so mockRestore() for every
    // spy, not only the one that failed, never runs at all.
    expect(console.error).toBe(originalError)
  })

  it('does not throw, and still restores, when no spy in the list was called', () => {
    const originalError = console.error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => assertConsoleSilent([spy])).not.toThrow()
    expect(console.error).toBe(originalError)
  })

  it('restores every spy in the list, not only the first, even when an earlier one fails', () => {
    const originalError = console.error
    const originalWarn = console.warn
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy('boom') // only the first spy in the list was called

    expect(() => assertConsoleSilent([errorSpy, warnSpy])).toThrow()

    expect(console.error).toBe(originalError)
    expect(console.warn).toBe(originalWarn)
  })
})
