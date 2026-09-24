import { createContext, useContext, type PropsWithChildren } from 'react'
import { matchPath } from 'react-router-dom'
import { docSlugFromSplat, loadMdx, type MdxModule } from '@/lib/mdx-loader'

/** The MDX module of the docs page a URL renders, resolved before the first render. */
export interface InitialDocument {
  slug: string
  module: MdxModule
}

const RenderContext = createContext<InitialDocument | null>(null)

/**
 * Hands the first render the docs page module that `loadInitialDocument`
 * resolved, so `DocPage` renders the article straight away instead of
 * importing it in an effect: effects never run on the server, and the
 * hydrating client must produce the same markup the server did.
 */
export function RenderProvider({
  initialDocument,
  children,
}: PropsWithChildren<{ initialDocument: InitialDocument | null }>) {
  return <RenderContext.Provider value={initialDocument}>{children}</RenderContext.Provider>
}

/** The initial document's module when `slug` is the page first rendered, otherwise `null`. */
export function useInitialDocument(slug: string): MdxModule | null {
  const value = useContext(RenderContext)
  return value?.slug === slug ? value.module : null
}

/**
 * Resolves the MDX module of the docs page `pathname` renders (the
 * `/docs/*` route in `App`), or `null` for any other route and for a
 * slug with no MDX file. The server and client entries both call it
 * with the URL being rendered, so their first renders match.
 */
export async function loadInitialDocument(pathname: string): Promise<InitialDocument | null> {
  const slug = docSlugFromSplat(matchPath('/docs/*', pathname)?.params['*'])
  const load = slug ? loadMdx(slug) : null
  return load ? { slug, module: await load } : null
}
