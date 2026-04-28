import { useEffect } from 'react'
import { TopBar } from '@/components/landing/TopBar'
import { Hero } from '@/components/landing/Hero'
import { StatStrip } from '@/components/landing/StatStrip'
import { FeatureGrid } from '@/components/landing/FeatureGrid'
import { CodeUI } from '@/components/landing/CodeUI'
import { Stack } from '@/components/landing/Stack'
import { Footer } from '@/components/landing/Footer'

/**
 * `/` — single-page marketing surface for the docs site.
 *
 * Sections come from `design-system/Martis Docs/src/landing.jsx`,
 * each ported to its own component under `components/landing/` so
 * the file boundaries match the section boundaries on the page.
 */
export default function Landing() {
  useEffect(() => {
    document.title = 'Martis — The Laravel Admin Engine'
  }, [])

  return (
    <div className="min-h-screen bg-ink-900 text-ink-100">
      <TopBar />
      <main>
        <Hero />
        <StatStrip />
        <FeatureGrid />
        <CodeUI />
        <Stack />
      </main>
      <Footer />
    </div>
  )
}
