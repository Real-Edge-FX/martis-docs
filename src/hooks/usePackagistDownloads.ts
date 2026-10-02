import { useEffect, useState } from 'react'
import { RELEASE } from '@/data/site'

/** Packagist's package endpoint; it answers any origin (`Access-Control-Allow-Origin: *`). */
export const PACKAGIST_URL = 'https://packagist.org/packages/martis/martis.json'

/** sessionStorage key of the last count read, so a page change does not ask again. */
const CACHE_KEY = 'martis-docs:packagist-downloads'
const CACHE_TTL_MS = 60 * 60 * 1000

export interface Downloads {
  total: number
  monthly: number
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function readCache(): Downloads | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (raw === null) return null
    const cached = JSON.parse(raw) as { total?: unknown; monthly?: unknown; at?: unknown }
    if (!isCount(cached.total) || !isCount(cached.monthly) || typeof cached.at !== 'number') return null
    if (Date.now() - cached.at > CACHE_TTL_MS) return null
    return { total: cached.total, monthly: cached.monthly }
  } catch {
    return null
  }
}

function writeCache(downloads: Downloads): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...downloads, at: Date.now() }))
  } catch {
    // Storage blocked (private mode, quota): the next page asks again.
  }
}

/**
 * The Packagist install count of `martis/martis`, read live in the browser.
 *
 * Starts from the count the last deploy wrote (`RELEASE.downloads`), so the
 * page never shows an empty or zero stat, then asks Packagist and switches to
 * its count. Installs happen through Composer at any time, so the stat follows
 * them between deploys; Packagist's own CDN refreshes it about every 12 hours.
 * A failed or malformed answer keeps the deploy's count, and the count never
 * goes below it.
 */
export function usePackagistDownloads(): Downloads {
  const fallback: Downloads = { total: RELEASE.downloads, monthly: RELEASE.monthlyDownloads }
  const [downloads, setDownloads] = useState<Downloads>(() => readCache() ?? fallback)

  useEffect(() => {
    if (readCache() !== null) return

    const controller = new AbortController()

    fetch(PACKAGIST_URL, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { package?: { downloads?: { total?: unknown; monthly?: unknown } } } | null) => {
        const live = payload?.package?.downloads
        if (!isCount(live?.total) || !isCount(live?.monthly)) return

        const next = {
          total: Math.max(live.total, RELEASE.downloads),
          monthly: live.monthly,
        }
        writeCache(next)
        setDownloads(next)
      })
      .catch(() => {
        // Offline, blocked or aborted: the deploy's count stays.
      })

    return () => controller.abort()
  }, [])

  return downloads
}
