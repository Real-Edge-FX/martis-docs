import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LoadingScreen } from '@/components/LoadingScreen'
import { CmdKProvider } from '@/lib/cmdk-context'
import { ThemeProvider } from '@/lib/theme'
import { DocumentMeta } from '@/components/site/DocumentMeta'
import { ScrollManager } from '@/components/site/ScrollManager'

// Lazy-load the two top-level surfaces so the landing's CSS / JS
// budget does not pay for the docs renderer (and vice-versa). Both
// chunks are fetched on demand at the route level.
const Landing = lazy(() => import('@/pages/Landing'))
const Product = lazy(() => import('@/pages/Product'))
const ForAgencies = lazy(() => import('@/pages/ForAgencies'))
const Compare = lazy(() => import('@/pages/Compare'))
const CompareProduct = lazy(() => import('@/pages/CompareProduct'))
const Changelog = lazy(() => import('@/pages/Changelog'))
const Contact = lazy(() => import('@/pages/Contact'))
const Docs = lazy(() => import('@/pages/Docs'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export function App() {
  return (
    <ThemeProvider>
      <CmdKProvider>
        <DocumentMeta />
        <ScrollManager />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/product" element={<Product />} />
            <Route path="/for-agencies" element={<ForAgencies />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare/:product" element={<CompareProduct />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/docs/*" element={<Docs />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </CmdKProvider>
    </ThemeProvider>
  )
}
