import { useRef, useState } from 'react'
import { ImageLightbox } from '@/components/media/ImageLightbox'
import { Icons } from '@/components/icons'

export function ProductVisual({ image = '/screenshots/resource-index.png', label = 'Client operations', expandable = true }: { image?: string; label?: string; expandable?: boolean }) {
  const [open, setOpen] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)
  const alt = `Martis interface — ${label}`
  const close = () => {
    setOpen(false)
    requestAnimationFrame(() => openerRef.current?.focus())
  }

  return (
    <figure className="product-visual">
      <div className="product-visual__chrome">
        <span /><span /><span />
        <p>{label}</p>
        <span className="product-visual__live">Live product</span>
      </div>
      <div className="product-visual__image-wrap">
        {expandable ? <button ref={openerRef} type="button" className="product-visual__open" onClick={() => setOpen(true)} aria-label={`Enlarge image: ${label}`}>
          <img src={image} alt={alt} width="1280" height="800" />
          <span><Icons.Search size={15} /> Enlarge</span>
        </button> : <img src={image} alt={alt} width="1280" height="800" />}
      </div>
      {open && <ImageLightbox items={[{ src: image, alt, label }]} activeIndex={0} onIndexChange={() => undefined} onClose={close} />}
    </figure>
  )
}
