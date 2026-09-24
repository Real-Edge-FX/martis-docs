import type { PackagistStats, SiteReleaseManifest } from '@/types/generated-data'
import releaseSnapshot from '@/data/generated/release.json'
import packagistSnapshot from '@/data/generated/packagist.json'

/**
 * The only Packagist URL a valid `PackagistStats` snapshot may cite.
 * `parsePackagistStats` rejects anything else; the fetcher that produces
 * `packagist.json` (a later phase) must read from exactly this URL.
 */
export const PACKAGIST_SOURCE_URL = 'https://packagist.org/packages/martis/martis.json'

const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/
const COMMIT_HASH = /^[0-9a-f]{40}$/
const ISO_UTC_TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{3})?Z$/
const CARET_REQUIREMENT = /^\^(\d+)\.(\d+)(?:\.\d+)?$/

// --- Field-level validators. Each one either returns the narrowed value or
// throws an Error naming the offending field, so parseReleaseManifest and
// parsePackagistStats can read top-to-bottom as "one line per field". ---

function validateObject(input: unknown, label: string): Record<string, unknown> {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error(`${label} must be an object`)
  }
  return input as Record<string, unknown>
}

function validateNonEmptyString(value: unknown, field: string, maxLength?: number): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${field} must be a non-empty string`)
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new Error(`${field} must be at most ${maxLength} characters`)
  }
  return value
}

function validateExactString<T extends string>(value: unknown, field: string, expected: T): T {
  if (value !== expected) {
    throw new Error(`${field} must be exactly "${expected}"`)
  }
  return expected
}

function validateSemver(value: unknown, field: string): string {
  if (typeof value !== 'string' || !SEMVER.test(value)) {
    throw new Error(`${field} must be a semver string without a "v" prefix (e.g. "1.39.0")`)
  }
  return value
}

function validateCommitHash(value: unknown, field: string): string {
  if (typeof value !== 'string' || !COMMIT_HASH.test(value)) {
    throw new Error(`${field} must be a 40-character lowercase hex string`)
  }
  return value
}

function validateNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer`)
  }
  return value
}

function validateIsoUtcTimestamp(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp (YYYY-MM-DDTHH:mm:ss(.sss)Z)`)
  }
  const match = ISO_UTC_TIMESTAMP.exec(value)
  if (!match) {
    throw new Error(`${field} must be an ISO-8601 UTC timestamp (YYYY-MM-DDTHH:mm:ss(.sss)Z)`)
  }
  const [, year, month, day, hour, minute, second] = match.map(Number)
  const date = new Date(value)
  const isRealDate =
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute &&
    date.getUTCSeconds() === second
  if (!isRealDate) {
    throw new Error(`${field} must be a real date`)
  }
  return value
}

/**
 * Validates and narrows an unknown value into a `SiteReleaseManifest`.
 * Throws on the first invalid field (checked in declaration order), so a
 * broken snapshot fails loudly instead of shipping a half-guessed release
 * badge. See `loadReleaseManifest` for the loader that reads the committed
 * snapshot through this parser.
 */
export function parseReleaseManifest(input: unknown): SiteReleaseManifest {
  const value = validateObject(input, 'release manifest')

  const version = validateSemver(value.version, 'version')
  const packageCommit = validateCommitHash(value.packageCommit, 'packageCommit')
  const docsCommit =
    value.docsCommit === undefined ? undefined : validateCommitHash(value.docsCommit, 'docsCommit')
  const releaseHeadline = validateNonEmptyString(value.releaseHeadline, 'releaseHeadline', 90)
  const phpRequirement = validateNonEmptyString(value.phpRequirement, 'phpRequirement')
  const laravelRequirement = validateNonEmptyString(value.laravelRequirement, 'laravelRequirement')
  const pestTests = validateNonNegativeInteger(value.pestTests, 'pestTests')
  const vitestTests = validateNonNegativeInteger(value.vitestTests, 'vitestTests')
  const totalTests = validateNonNegativeInteger(value.totalTests, 'totalTests')
  if (totalTests !== pestTests + vitestTests) {
    throw new Error('totalTests must equal pestTests + vitestTests')
  }
  const generatedAt = validateIsoUtcTimestamp(value.generatedAt, 'generatedAt')

  return {
    version,
    packageCommit,
    ...(docsCommit === undefined ? {} : { docsCommit }),
    releaseHeadline,
    phpRequirement,
    laravelRequirement,
    pestTests,
    vitestTests,
    totalTests,
    generatedAt,
  }
}

/**
 * Validates and narrows an unknown value into `PackagistStats`. Throws on
 * the first invalid field (checked in declaration order). See
 * `loadPackagistStats` for the loader that reads the committed snapshot
 * through this parser.
 */
export function parsePackagistStats(input: unknown): PackagistStats {
  const value = validateObject(input, 'packagist stats')

  const pkg = validateExactString(value.package, 'package', 'martis/martis')
  const total = validateNonNegativeInteger(value.total, 'total')
  const monthly = validateNonNegativeInteger(value.monthly, 'monthly')
  const daily = validateNonNegativeInteger(value.daily, 'daily')
  const fetchedAt = validateIsoUtcTimestamp(value.fetchedAt, 'fetchedAt')
  const sourceUrl = validateExactString(value.sourceUrl, 'sourceUrl', PACKAGIST_SOURCE_URL)

  return { package: pkg, total, monthly, daily, fetchedAt, sourceUrl }
}

/**
 * Reads the committed `src/data/generated/release.json` snapshot through
 * `parseReleaseManifest`. The JSON is imported statically (no runtime
 * fetch): an invalid snapshot throws here, which fails tests, SSR and the
 * build instead of shipping a bad value.
 */
export function loadReleaseManifest(): SiteReleaseManifest {
  return parseReleaseManifest(releaseSnapshot)
}

/**
 * Reads the committed `src/data/generated/packagist.json` snapshot through
 * `parsePackagistStats`. Same static-import, fail-closed contract as
 * `loadReleaseManifest`.
 */
export function loadPackagistStats(): PackagistStats {
  return parsePackagistStats(packagistSnapshot)
}

// --- Formatters. Each one turns a validated manifest field into the exact
// string the landing page renders. They stay deliberately small: given a
// shape they cannot read, they throw rather than guess at a rendering. ---

/** `'1.39.0'` -> `'v1.39.0'`. */
export function formatVersion(version: string): string {
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('formatVersion requires a non-empty version string')
  }
  return `v${version}`
}

/** `3990` -> `'3,990'`. Always formats with the `en-US` locale so server and client render the same digits. */
export function formatCount(count: number): string {
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) {
    throw new Error('formatCount requires a non-negative integer')
  }
  return count.toLocaleString('en-US')
}

function parseCaretRequirement(part: string): { major: string; minor: string } | null {
  const match = CARET_REQUIREMENT.exec(part.trim())
  return match ? { major: match[1], minor: match[2] } : null
}

/** `'^8.3'` -> `'PHP 8.3+'`. Throws on any requirement shape other than a single `^major.minor(.patch)` caret range. */
export function formatPhpRequirement(requirement: string): string {
  const parsed = parseCaretRequirement(requirement)
  if (!parsed) {
    throw new Error(`formatPhpRequirement cannot read requirement "${requirement}"`)
  }
  return `PHP ${parsed.major}.${parsed.minor}+`
}

/**
 * `'^12.0|^13.0'` -> `'Laravel 12/13'`. Splits on `|`/`||`, reads the major
 * version out of each `^major.minor(.patch)` alternative, deduplicates and
 * sorts ascending. Throws on any alternative that is not a caret range.
 */
export function formatLaravelRequirement(requirement: string): string {
  const alternatives = requirement.split(/\|\|?/)
  const majors = alternatives.map((part) => {
    const parsed = parseCaretRequirement(part)
    if (!parsed) {
      throw new Error(`formatLaravelRequirement cannot read requirement "${requirement}"`)
    }
    return Number(parsed.major)
  })
  const uniqueMajors = [...new Set(majors)].sort((a, b) => a - b)
  return `Laravel ${uniqueMajors.join('/')}`
}
