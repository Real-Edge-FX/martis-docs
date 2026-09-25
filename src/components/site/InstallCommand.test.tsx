import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { COPIED_RESET_MS, InstallCommand } from './InstallCommand'

describe('InstallCommand', () => {
  it('renders the command as selectable text, usable without JavaScript', () => {
    render(<InstallCommand command="composer require martis/martis" />)
    const code = screen.getByText('composer require martis/martis')
    expect(code.tagName).toBe('CODE')
  })

  it('copies the install command and announces success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallCommand command="composer require martis/martis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    expect(writeText).toHaveBeenCalledWith('composer require martis/martis')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('copies the install command and exposes a manual fallback', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'))
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallCommand command="composer require martis/martis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    expect(screen.getByText('Select and copy the command')).toBeInTheDocument()
  })

  it('shows the fallback status visibly for a sighted user, not only announced to assistive tech', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'))
    Object.assign(navigator, { clipboard: { writeText } })
    render(<InstallCommand command="composer require martis/martis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    const status = screen.getByText('Select and copy the command')
    // sr-only would hide it from sighted users while keeping it in the
    // accessibility tree; the fallback must be visible next to the
    // button, not just announced.
    expect(status).not.toHaveClass('sr-only')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('exposes the status announcement politely for assistive tech', () => {
    render(<InstallCommand command="composer require martis/martis" />)
    const status = screen.getByRole('status', { hidden: true })
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  describe('the Copied confirmation', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    async function copyWithFakeTimers() {
      // Only the timer functions: promises (the clipboard call) still settle.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const writeText = vi.fn().mockResolvedValue(undefined)
      // userEvent (earlier tests) leaves `navigator.clipboard` as a getter.
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
      const view = render(<InstallCommand command="composer require martis/martis" />)
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
      })
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
      return view
    }

    it('returns the button to idle after a couple of seconds', async () => {
      await copyWithFakeTimers()
      act(() => {
        vi.advanceTimersByTime(COPIED_RESET_MS - 1)
      })
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.getByRole('button', { name: 'Copy install command' })).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('')
    })

    it('clears its pending reset when unmounted', async () => {
      const { unmount } = await copyWithFakeTimers()
      expect(vi.getTimerCount()).toBeGreaterThan(0)
      unmount()
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  it('does not arm a reset timer when unmounted while the clipboard write is still pending', async () => {
    // Real timers for `writeText`'s own microtask resolution; fake ones
    // only to observe whether a `setTimeout` got scheduled afterwards.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let resolveWrite: () => void = () => {}
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveWrite = resolve
        }),
    )
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    const { unmount } = render(<InstallCommand command="composer require martis/martis" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    })
    // The click started the copy, but `writeText` has not resolved yet:
    // unmount before it does, the way a fast navigation away would. The
    // effect cleanup already ran (mounted.current is now false).
    unmount()

    await act(async () => {
      resolveWrite()
      // Let the resumed `await` in `handleCopy` continue past the unmount.
      await Promise.resolve()
    })

    // Without the mounted guard, the resumed handler would still call
    // `setTimeout` unconditionally (it operates on a plain ref, not
    // React state, so React unmounting the component does not stop it)
    // and arm a reset timer that nothing will ever clear, because the
    // effect's own cleanup already ran before the write settled.
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
  })

  it('does not re-select the command or set the fallback status when unmounted while the clipboard write is still failing', async () => {
    let rejectWrite: (error: Error) => void = () => {}
    const writeText = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectWrite = reject
        }),
    )
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

    const { unmount } = render(<InstallCommand command="composer require martis/martis" />)
    await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
    unmount()

    // Resolving/rejecting after unmount must not throw (e.g. from
    // `selectCommand` touching a detached node) and must not warn.
    const consoleError = vi.spyOn(console, 'error')
    await expect(
      act(async () => {
        rejectWrite(new Error('blocked'))
        await Promise.resolve()
      }),
    ).resolves.not.toThrow()
    expect(consoleError).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
