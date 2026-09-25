import { AgencyValue } from '@/components/landing/AgencyValue'
import { CodeUI } from '@/components/landing/CodeUI'
import { ComparisonTeaser } from '@/components/landing/ComparisonTeaser'
import { CtaBanner } from '@/components/landing/CtaBanner'
import { EngineeringProof } from '@/components/landing/EngineeringProof'
import { Hero } from '@/components/landing/Hero'
import { ProductChapters } from '@/components/landing/ProductChapters'
import { Showcase } from '@/components/landing/Showcase'
import { ProofStrip } from '@/components/marketing/ProofStrip'
import { SiteShell } from '@/components/site/SiteShell'
import { loadPackagistStats, loadReleaseManifest } from '@/lib/generated-data'

// Both snapshots are validated at load (src/lib/generated-data.ts): an
// invalid one fails the build, so the proof strip only ever shows the
// generated values.
const release = loadReleaseManifest()
const stats = loadPackagistStats()

/**
 * `/`: the homepage narrative (design spec 6), in conversion order:
 * hero, proof, agency value, code to interface, product chapters,
 * comparison, real media, engineering proof and the final call to
 * action. The server HTML is the finished page: nothing starts hidden,
 * so it reads the same without JavaScript and under reduced motion.
 */
export default function Landing() {
  return (
    <SiteShell>
      <main id="main-content" tabIndex={-1} className="home">
        <Hero />
        <section className="home-proof" aria-labelledby="home-proof-heading">
          <h2 id="home-proof-heading" className="sr-only">
            Martis at a glance
          </h2>
          <div className="site-container">
            <ProofStrip release={release} stats={stats} />
          </div>
        </section>
        <AgencyValue />
        <CodeUI />
        <ProductChapters />
        <ComparisonTeaser />
        <Showcase />
        <EngineeringProof />
        <CtaBanner />
      </main>
    </SiteShell>
  )
}
