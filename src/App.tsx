import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CmdKProvider } from '@/lib/cmdk-context'

// Lazy-load the two top-level surfaces so the landing's CSS / JS
// budget does not pay for the docs renderer (and vice-versa). Both
// chunks are fetched on demand at the route level.
const Landing = lazy(() => import('@/pages/Landing'))
const Docs = lazy(() => import('@/pages/Docs'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function App() {
  return (
    <CmdKProvider>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/docs/*" element={<Docs />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </CmdKProvider>
  )
}
