import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PackagistStats, SiteReleaseManifest } from '@/types/generated-data'
import { ProofStrip } from './ProofStrip'

const release: SiteReleaseManifest = {
  version: '1.39.1',
  packageCommit: 'a'.repeat(40),
  releaseHeadline: 'A release',
  phpRequirement: '^8.3',
  laravelRequirement: '^12.0||^13.0',
  pestTests: 3185,
  vitestTests: 872,
  totalTests: 4057,
  generatedAt: '2026-09-24T00:00:00.000Z',
}

const stats: PackagistStats = {
  package: 'martis/martis',
  total: 190,
  monthly: 40,
  daily: 2,
  fetchedAt: '2026-09-24T12:00:00.000Z',
  sourceUrl: 'https://packagist.org/packages/martis/martis.json',
}

describe('ProofStrip', () => {
  it('shows the generated release and packagist facts', () => {
    render(<ProofStrip release={release} stats={stats} />)
    expect(screen.getByText('v1.39.1')).toBeInTheDocument()
    expect(screen.getByText('4,057')).toBeInTheDocument()
    expect(screen.getByText(/3,185 Pest/)).toBeInTheDocument()
    expect(screen.getByText(/872 Vitest/)).toBeInTheDocument()
    expect(screen.getByText('PHP 8.3+ · Laravel 12/13')).toBeInTheDocument()
    expect(screen.getByText('190')).toBeInTheDocument()
    expect(screen.getByText(/as of/i)).toBeInTheDocument()
  })

  it('labels unavailable proof data without inventing a value', () => {
    render(<ProofStrip release={null} stats={null} />)
    expect(screen.getAllByText('Data temporarily unavailable').length).toBeGreaterThan(0)
  })

  it('keeps requirements and downloads available when only stats are missing', () => {
    render(<ProofStrip release={release} stats={null} />)
    expect(screen.getByText('v1.39.1')).toBeInTheDocument()
    expect(screen.getByText('Data temporarily unavailable')).toBeInTheDocument()
  })
})
