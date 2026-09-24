/**
 * The three data contracts from the master plan's "Contratos partilhados"
 * section (`docs/superpowers/plans/2026-09-24-getmartis-redesign-master-plan.md`).
 *
 * Every release fact the site shows (version, release headline, test
 * totals, PHP/Laravel requirements, Packagist downloads, captured product
 * media) is read from a JSON snapshot that satisfies one of these shapes.
 * Nothing here is hand-maintained: the site never derives these values
 * itself and never fetches them at runtime (see `src/lib/generated-data.ts`).
 *
 * `ProductMediaManifest` is type-only for now — its generator and the
 * parser that validates it land in a later phase.
 */

export interface SiteReleaseManifest {
  version: string
  packageCommit: string
  docsCommit?: string
  releaseHeadline: string
  phpRequirement: string
  laravelRequirement: string
  pestTests: number
  vitestTests: number
  totalTests: number
  generatedAt: string
}

export interface PackagistStats {
  package: 'martis/martis'
  total: number
  monthly: number
  daily: number
  fetchedAt: string
  sourceUrl: string
}

export interface ProductMediaManifest {
  packageVersion: string
  packageCommit: string
  route: string
  viewport: { width: number; height: number }
  theme: 'light' | 'dark'
  locale: string
  capturedAt: string
  checksum: string
}
