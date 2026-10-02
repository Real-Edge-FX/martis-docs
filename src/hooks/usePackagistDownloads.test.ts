import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RELEASE } from '@/data/site'
import { PACKAGIST_URL, usePackagistDownloads } from './usePackagistDownloads'

function packagist(downloads: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve({ package: { downloads } }) })
}

afterEach(() => {
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

describe('usePackagistDownloads', () => {
  it('starts from the deploy count and switches to the live Packagist count', async () => {
    const fetchMock = packagist({ total: RELEASE.downloads + 57, monthly: 188, daily: 11 })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => usePackagistDownloads())

    expect(result.current.total).toBe(RELEASE.downloads)
    await waitFor(() => expect(result.current).toEqual({ total: RELEASE.downloads + 57, monthly: 188 }))
    expect(fetchMock).toHaveBeenCalledWith(PACKAGIST_URL, expect.anything())
  })

  it('keeps the deploy count when Packagist fails or answers something else', async () => {
    for (const fetchMock of [
      vi.fn().mockRejectedValue(new TypeError('offline')),
      packagist({ total: 300, monthly: 10 }, false),
      packagist({ total: '300', monthly: 10 }),
      packagist(undefined),
    ]) {
      vi.stubGlobal('fetch', fetchMock)
      const { result, unmount } = renderHook(() => usePackagistDownloads())

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      await Promise.resolve()
      expect(result.current).toEqual({ total: RELEASE.downloads, monthly: RELEASE.monthlyDownloads })
      unmount()
    }
  })

  it('never shows less than the deploy count', async () => {
    vi.stubGlobal('fetch', packagist({ total: 1, monthly: 1 }))

    const { result } = renderHook(() => usePackagistDownloads())

    await waitFor(() => expect(result.current.monthly).toBe(1))
    expect(result.current.total).toBe(RELEASE.downloads)
  })

  it('asks Packagist once per session and reuses the count on the next page', async () => {
    const fetchMock = packagist({ total: RELEASE.downloads + 5, monthly: 9 })
    vi.stubGlobal('fetch', fetchMock)

    const first = renderHook(() => usePackagistDownloads())
    await waitFor(() => expect(first.result.current.total).toBe(RELEASE.downloads + 5))
    first.unmount()

    const second = renderHook(() => usePackagistDownloads())

    expect(second.result.current.total).toBe(RELEASE.downloads + 5)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
