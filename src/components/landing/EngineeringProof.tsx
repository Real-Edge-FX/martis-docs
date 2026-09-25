import { Link } from 'react-router-dom'
import { GITHUB_URL, LICENSE_URL } from '@/components/site/site-links'
import {
  formatCount,
  formatLaravelRequirement,
  formatPhpRequirement,
  formatVersion,
  loadReleaseManifest,
} from '@/lib/generated-data'

const HEADING_ID = 'home-engineering-heading'

// Every figure below comes from the validated release snapshot
// (src/data/generated/release.json), never from copy in this file.
const release = loadReleaseManifest()
const VERSION = formatVersion(release.version)
const SOURCE_URL = `${GITHUB_URL}/tree/${VERSION}`

interface ProofPoint {
  title: string
  body: string
}

const POINTS: ProofPoint[] = [
  {
    title: 'Architecture',
    body: 'A Laravel package with a React and TypeScript single-page panel. Resources, fields and policies are PHP; overrides are your own application code.',
  },
  {
    title: 'Tests',
    body: `${formatCount(release.totalTests)} tests pass on the ${VERSION} release: ${formatCount(release.pestTests)} Pest and ${formatCount(release.vitestTests)} Vitest.`,
  },
  {
    title: 'Compatibility',
    body: `${formatPhpRequirement(release.phpRequirement)} and ${formatLaravelRequirement(release.laravelRequirement)}, installed with Composer into an existing application.`,
  },
  {
    title: 'Open source',
    body: 'MIT licensed, with no paid tier, no license keys and the full source in a public repository.',
  },
]

/**
 * "Technical depth" (design spec 6.8): architecture, tests,
 * compatibility and the open-source model, each checkable at its source:
 * the tagged code on GitHub, the changelog and the docs. No logos or
 * testimonials (none are authorized and verifiable yet).
 */
export function EngineeringProof() {
  return (
    <section className="home-section" aria-labelledby={HEADING_ID}>
      <div className="site-container">
        <header className="home-section__head">
          <div>
            <p className="home-kicker">Engineering proof</p>
            <h2 id={HEADING_ID} className="home-h2">
              Built to be checked, not taken on trust.
            </h2>
          </div>
          <p className="home-section__copy">
            Read the code, the release history and the documentation before you put Martis in front of a client.
          </p>
        </header>

        <ul className="home-engineering">
          {POINTS.map((point) => (
            <li key={point.title} className="home-engineering__point">
              <h3 className="home-engineering__title">{point.title}</h3>
              <p className="home-engineering__body">{point.body}</p>
            </li>
          ))}
        </ul>

        <ul className="home-engineering__links">
          <li>
            <a href={SOURCE_URL} className="home-link">
              Read the {VERSION} source on GitHub
            </a>
          </li>
          <li>
            <Link to="/changelog" className="home-link">
              Read the changelog
            </Link>
          </li>
          <li>
            <Link to="/docs" className="home-link">
              Browse the documentation
            </Link>
          </li>
          <li>
            <a href={LICENSE_URL} className="home-link home-link--muted">
              MIT license
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}
