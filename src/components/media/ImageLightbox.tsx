import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icons } from '@/components/icons'

export interface LightboxItem {
  src: string
  alt: string
  label: string
}

export function ImageLightbox({ items, activeIndex, onIndexChange, onClose }: {
  items: LightboxItem[]
  activeIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
}) {
  const [zoomed, setZoomed] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const item = items[activeIndex]

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight' && items.length > 1) onIndexChange((activeIndex + 1) % items.length)
      if (event.key === 'ArrowLeft' && items.length > 1) onIndexChange((activeIndex - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [activeIndex, items.length, onClose, onIndexChange])

  useEffect(() => setZoomed(false), [activeIndex])

  if (!item) return null

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.label} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="lightbox__toolbar">
        <div><small>Product view</small><strong>{item.label}</strong></div>
        <button type="button" onClick={() => setZoomed((value) => !value)} aria-label={zoomed ? 'Zoom out' : 'Zoom in'}>{zoomed ? '100%' : 'Zoom'}</button>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close enlarged image"><Icons.Close size={20} /></button>
      </div>
      <div className={`lightbox__canvas${zoomed ? ' is-zoomed' : ''}`}>
        <img src={item.src} alt={item.alt} />
      </div>
      {items.length > 1 && <div className="lightbox__navigation">
        <button type="button" onClick={() => onIndexChange((activeIndex - 1 + items.length) % items.length)} aria-label="Previous image">← Previous</button>
        <span>{activeIndex + 1} / {items.length}</span>
        <button type="button" onClick={() => onIndexChange((activeIndex + 1) % items.length)} aria-label="Next image">Next →</button>
      </div>}
    </div>,
    document.body,
  )
}
