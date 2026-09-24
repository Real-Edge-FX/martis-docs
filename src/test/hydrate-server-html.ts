import { act } from '@testing-library/react'
import { hydrateRoot, type Root } from 'react-dom/client'
import { vi } from 'vitest'
import { prepareClientApp } from '@/lib/client-app'

export interface HydratedPage {
  container: HTMLElement
  /** The server's `<main>`, captured before hydration. */
  serverMain: Element | null
  onRecoverableError: ReturnType<typeof vi.fn>
  root: Root
}

/** Puts `html` (a server render of `url`) into a `#root` container exactly
 *  as the static HTML shell does, then hydrates it with the tree
 *  `entry-client.tsx` mounts (`prepareClientApp`). */
export async function hydrateServerHtml(url: string, html: string): Promise<HydratedPage> {
  const container = document.createElement('div')
  container.id = 'root'
  container.innerHTML = html
  document.body.appendChild(container)
  const serverMain = container.querySelector('main')

  window.history.pushState({}, '', url)
  const app = await prepareClientApp(window.location.pathname)

  const onRecoverableError = vi.fn()
  let root!: Root
  await act(async () => {
    root = hydrateRoot(container, app, { onRecoverableError })
  })
  return { container, serverMain, onRecoverableError, root }
}

/** Whether React has recorded taking ownership of `node` (the
 *  `__reactFiber$<id>` property react-dom attaches to every DOM node it
 *  manages). An untouched node would pass every other hydration
 *  assertion trivially; this proves hydration actually reached it. */
export function hasReactFiber(node: Element): boolean {
  return Object.keys(node).some((key) => key.startsWith('__reactFiber$'))
}
