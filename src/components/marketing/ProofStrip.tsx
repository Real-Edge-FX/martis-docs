import { formatCount, formatLaravelRequirement, formatPhpRequirement, formatVersion } from '@/lib/generated-data'
import type { PackagistStats, SiteReleaseManifest } from '@/types/generated-data'

const UNAVAILABLE = 'Data temporarily unavailable'

// Always UTC and the `en-US` locale, so the server render and the
// hydrating client render produce the exact same string (spec 15.3,
// decision 3: "Format dates and numbers deterministically").
const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

interface ProofStripProps {
  release: SiteReleaseManifest | null
  stats: PackagistStats | null
}

interface ProofItem {
  key: string
  label: string
  value: string
  /** Extra text for assistive tech only, e.g. the Pest/Vitest split. */
  detail?: string
}

function releaseItems(release: SiteReleaseManifest | null): ProofItem[] {
  if (!release) {
    return [
      { key: 'version', label: 'Stable version', value: UNAVAILABLE },
      { key: 'tests', label: 'Tests passing', value: UNAVAILABLE },
      { key: 'requirements', label: 'Requires', value: UNAVAILABLE },
    ]
  }
  return [
    { key: 'version', label: 'Stable version', value: formatVersion(release.version) },
    {
      key: 'tests',
      label: 'Tests passing',
      value: formatCount(release.totalTests),
      detail: `${formatCount(release.pestTests)} Pest, ${formatCount(release.vitestTests)} Vitest`,
    },
    {
      key: 'requirements',
      label: 'Requires',
      value: `${formatPhpRequirement(release.phpRequirement)} · ${formatLaravelRequirement(release.laravelRequirement)}`,
    },
  ]
}

function statsItem(stats: PackagistStats | null): ProofItem {
  if (!stats) {
    return { key: 'downloads', label: 'Packagist downloads', value: UNAVAILABLE }
  }
  return {
    key: 'downloads',
    label: 'Packagist downloads',
    value: formatCount(stats.total),
    detail: `as of ${DATE_FORMATTER.format(new Date(stats.fetchedAt))} UTC`,
  }
}

/**
 * The compact proof strip under the hero (design spec 6.2): stable
 * version, total tests, PHP/Laravel requirements and Packagist
 * downloads, all read from the generated snapshots. `release` or
 * `stats` being `null` (a validation or fetch failure upstream) never
 * falls back to a stale number: the affected values render the neutral
 * "Data temporarily unavailable" state instead.
 */
export function ProofStrip({ release, stats }: ProofStripProps) {
  const items = [...releaseItems(release), statsItem(stats)]

  return (
    <dl className="proof-strip">
      {items.map((item) => (
        <div className="proof-strip__item" key={item.key}>
          <dt className="proof-strip__label">{item.label}</dt>
          <dd>
            <span className="proof-strip__value">{item.value}</span>
            {item.detail ? <span className="proof-strip__detail"> ({item.detail})</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
