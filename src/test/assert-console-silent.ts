import { expect, type MockInstance } from 'vitest'

/**
 * Asserts that none of `spies` was called, then restores every one of
 * them to its original implementation — restoring inside a `finally`, so
 * an unexpected console call (the assertion failing) still leaves every
 * spy torn down instead of staying installed and cascading into a later
 * test in the same file.
 *
 * Restore cannot run *before* the assertion instead (a literal
 * "restore-then-assert"): `mockRestore()` also clears the spy's recorded
 * calls (it cascades through `mockReset`/`mockClear`), so asserting
 * afterwards would always trivially pass — the very call this function
 * exists to catch would already be erased. See
 * assert-console-silent.test.ts, which fails exactly this way against
 * that ordering.
 *
 * Shared by src/entry-server.test.tsx and src/pages/Docs.test.tsx, the
 * two SSR/render-heavy suites that spy on console.error (and, for SSR,
 * console.warn) to catch React/React Router misuse — so the fix lives in
 * one place instead of two copies that could drift apart.
 */
export function assertConsoleSilent(spies: readonly MockInstance[]): void {
  try {
    for (const spy of spies) {
      expect(spy).not.toHaveBeenCalled()
    }
  } finally {
    for (const spy of spies) {
      spy.mockRestore()
    }
  }
}
