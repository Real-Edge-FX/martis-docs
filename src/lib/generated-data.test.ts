import { describe, expect, it } from 'vitest'
import {
  parseReleaseManifest,
  parsePackagistStats,
  loadReleaseManifest,
  loadPackagistStats,
  formatVersion,
  formatCount,
  formatPhpRequirement,
  formatLaravelRequirement,
} from './generated-data'

const VALID_RELEASE = {
  version: '1.39.0',
  packageCommit: '57c41e462caeddea706b9e2f8505cda2b91df00c',
  releaseHeadline: 'PrimeReact theme reads the Martis tokens',
  phpRequirement: '^8.3',
  laravelRequirement: '^12.0|^13.0',
  pestTests: 3118,
  vitestTests: 872,
  totalTests: 3990,
  generatedAt: '2026-09-24T10:00:00.000Z',
}

const VALID_PACKAGIST = {
  package: 'martis/martis',
  total: 190,
  monthly: 125,
  daily: 3,
  fetchedAt: '2026-09-24T16:07:17.000Z',
  sourceUrl: 'https://packagist.org/packages/martis/martis.json',
}

describe('parseReleaseManifest', () => {
  it('parses a fully valid manifest', () => {
    expect(parseReleaseManifest(VALID_RELEASE)).toEqual(VALID_RELEASE)
  })

  it('accepts an optional docsCommit', () => {
    const withDocsCommit = { ...VALID_RELEASE, docsCommit: 'a'.repeat(40) }
    expect(parseReleaseManifest(withDocsCommit)).toEqual(withDocsCommit)
  })

  it('rejects a non-object input', () => {
    expect(() => parseReleaseManifest(null)).toThrow('release manifest must be an object')
    expect(() => parseReleaseManifest('1.39.0')).toThrow('release manifest must be an object')
  })

  it('rejects a version with a "v" prefix', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, version: 'v1.39.0' })).toThrow(/version/)
  })

  it('accepts a semver version with a prerelease suffix', () => {
    const withPrerelease = { ...VALID_RELEASE, version: '1.40.0-beta.1' }
    expect(parseReleaseManifest(withPrerelease)).toEqual(withPrerelease)
  })

  it('rejects a version that is not semver', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, version: '1.39' })).toThrow(/version/)
  })

  it('rejects a packageCommit that is not 40 lowercase hex characters', () => {
    expect(() =>
      parseReleaseManifest({ ...VALID_RELEASE, packageCommit: 'A'.repeat(40) }),
    ).toThrow(/packageCommit/)
    expect(() =>
      parseReleaseManifest({ ...VALID_RELEASE, packageCommit: 'a'.repeat(39) }),
    ).toThrow(/packageCommit/)
  })

  it('rejects an invalid docsCommit when present', () => {
    expect(() =>
      parseReleaseManifest({ ...VALID_RELEASE, docsCommit: 'not-a-sha' }),
    ).toThrow(/docsCommit/)
  })

  it('rejects an empty releaseHeadline', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, releaseHeadline: '' })).toThrow(
      /releaseHeadline/,
    )
  })

  it('rejects a releaseHeadline longer than 90 characters', () => {
    expect(() =>
      parseReleaseManifest({ ...VALID_RELEASE, releaseHeadline: 'x'.repeat(91) }),
    ).toThrow(/releaseHeadline/)
  })

  it('rejects an empty phpRequirement', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, phpRequirement: '' })).toThrow(
      /phpRequirement/,
    )
  })

  it('rejects an empty laravelRequirement', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, laravelRequirement: '' })).toThrow(
      /laravelRequirement/,
    )
  })

  it('rejects a negative pestTests', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, pestTests: -1 })).toThrow(/pestTests/)
  })

  it('rejects a non-integer vitestTests', () => {
    expect(() => parseReleaseManifest({ ...VALID_RELEASE, vitestTests: 1.5 })).toThrow(
      /vitestTests/,
    )
  })

  it('rejects a release whose totals do not add up', () => {
    expect(() =>
      parseReleaseManifest({
        version: '1.40.0',
        packageCommit: 'a'.repeat(40),
        releaseHeadline: 'Release',
        phpRequirement: '^8.3',
        laravelRequirement: '^12.0|^13.0',
        pestTests: 100,
        vitestTests: 20,
        totalTests: 119,
        generatedAt: '2026-09-24T10:00:00.000Z',
      }),
    ).toThrow('totalTests must equal pestTests + vitestTests')
  })

  it('rejects a generatedAt that is not ISO-8601 UTC', () => {
    expect(() =>
      parseReleaseManifest({ ...VALID_RELEASE, generatedAt: '2026-09-24 10:00:00' }),
    ).toThrow(/generatedAt/)
  })

  it('rejects a generatedAt that is not a real date', () => {
    expect(() =>
      parseReleaseManifest({ ...VALID_RELEASE, generatedAt: '2026-02-30T10:00:00.000Z' }),
    ).toThrow(/generatedAt/)
  })
})

describe('parsePackagistStats', () => {
  it('parses a fully valid stats object', () => {
    expect(parsePackagistStats(VALID_PACKAGIST)).toEqual(VALID_PACKAGIST)
  })

  it('rejects a non-object input', () => {
    expect(() => parsePackagistStats(undefined)).toThrow('packagist stats must be an object')
  })

  it('rejects negative download values', () => {
    expect(() => parsePackagistStats({ package: 'martis/martis', total: -1 })).toThrow()
  })

  it('rejects a package other than martis/martis', () => {
    expect(() =>
      parsePackagistStats({ ...VALID_PACKAGIST, package: 'martis/other' }),
    ).toThrow(/package/)
  })

  it('rejects a non-integer monthly value', () => {
    expect(() => parsePackagistStats({ ...VALID_PACKAGIST, monthly: 12.5 })).toThrow(/monthly/)
  })

  it('rejects a non-integer daily value', () => {
    expect(() => parsePackagistStats({ ...VALID_PACKAGIST, daily: '3' })).toThrow(/daily/)
  })

  it('rejects a fetchedAt that is not ISO-8601 UTC', () => {
    expect(() =>
      parsePackagistStats({ ...VALID_PACKAGIST, fetchedAt: '24-09-2026' }),
    ).toThrow(/fetchedAt/)
  })

  it('rejects a sourceUrl other than the Packagist URL', () => {
    expect(() =>
      parsePackagistStats({ ...VALID_PACKAGIST, sourceUrl: 'https://example.com/martis.json' }),
    ).toThrow(/sourceUrl/)
  })
})

describe('loadReleaseManifest / loadPackagistStats', () => {
  it('parses the committed release snapshot', () => {
    expect(() => loadReleaseManifest()).not.toThrow()
    expect(loadReleaseManifest().version).toBe('1.39.0')
  })

  it('parses the committed packagist snapshot', () => {
    expect(() => loadPackagistStats()).not.toThrow()
    expect(loadPackagistStats().package).toBe('martis/martis')
  })
})

describe('formatVersion', () => {
  it('prefixes the version with "v"', () => {
    expect(formatVersion('1.39.0')).toBe('v1.39.0')
  })

  it('throws on an empty version', () => {
    expect(() => formatVersion('')).toThrow()
  })
})

describe('formatCount', () => {
  it('formats with en-US thousands separators', () => {
    expect(formatCount(3990)).toBe('3,990')
  })

  it('formats small numbers without a separator', () => {
    expect(formatCount(190)).toBe('190')
  })

  it('throws on a negative count', () => {
    expect(() => formatCount(-1)).toThrow()
  })

  it('throws on a non-integer count', () => {
    expect(() => formatCount(3.5)).toThrow()
  })
})

describe('formatPhpRequirement', () => {
  it('formats a caret requirement', () => {
    expect(formatPhpRequirement('^8.3')).toBe('PHP 8.3+')
  })

  it('throws on a requirement it cannot read', () => {
    expect(() => formatPhpRequirement('>=8.3')).toThrow()
  })
})

describe('formatLaravelRequirement', () => {
  it('formats a two-alternative requirement into a major-version range', () => {
    expect(formatLaravelRequirement('^12.0|^13.0')).toBe('Laravel 12/13')
  })

  it('sorts majors ascending regardless of input order', () => {
    expect(formatLaravelRequirement('^13.0|^12.0')).toBe('Laravel 12/13')
  })

  it('deduplicates alternatives that share a major version', () => {
    expect(formatLaravelRequirement('^12.0|^12.1')).toBe('Laravel 12')
  })

  it('throws on a requirement it cannot read', () => {
    expect(() => formatLaravelRequirement('^12.0 || dev-main')).toThrow()
  })
})
