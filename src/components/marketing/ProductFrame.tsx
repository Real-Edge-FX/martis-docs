interface ProductFrameProps {
  src: string
  alt: string
  width: number
  height: number
  /** The formatted release version this screenshot was captured at, e.g. `formatVersion(release.version)`. */
  version: string
  /** Marks the hero frame: loads eagerly with a high fetch priority. Every other frame is lazy. */
  priority?: boolean
  className?: string
}

/**
 * The "real product frame" used in the hero (spec 6.1) and repeated
 * through the page: a screenshot from the Playground presented as a
 * plain browser chrome, not a decorative device mockup (spec 12,
 * "screenshots integrados na composição, não dentro de mockups de
 * dispositivos decorativos"), tagged with the release version it was
 * captured at so the reader knows how current the proof is.
 */
export function ProductFrame({ src, alt, width, height, version, priority = false, className }: ProductFrameProps) {
  return (
    <figure className={['product-frame', className].filter(Boolean).join(' ')}>
      <div className="product-frame__chrome" aria-hidden="true">
        <span className="product-frame__dot" />
        <span className="product-frame__dot" />
        <span className="product-frame__dot" />
      </div>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className="product-frame__image"
        style={{ aspectRatio: `${width} / ${height}` }}
      />
      <figcaption className="product-frame__version">{version}</figcaption>
    </figure>
  )
}
