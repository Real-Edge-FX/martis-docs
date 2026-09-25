import { fetchPriorityAttribute } from './fetch-priority'

interface MediaFigureProps {
  src: string
  /** Required: describes the screenshot's content, never decorative. */
  alt: string
  /** Required: benefit-oriented caption shown under the image. */
  caption: string
  /** Required: the image's real pixel width, used to reserve layout space. */
  width: number
  /** Required: the image's real pixel height, used to reserve layout space. */
  height: number
  /** Marks an above-the-fold image (the hero frame): loads eagerly with a
   *  high fetch priority instead of the default lazy loading. */
  priority?: boolean
  className?: string
}

/**
 * A captioned product screenshot (design spec 6.7, 13 "Screenshots").
 * `width`/`height` are mandatory so the browser reserves the aspect
 * ratio before the image loads (CLS budget in spec 17). Every image is
 * `loading="lazy"` unless it is the hero frame, marked `priority`, which
 * instead loads eagerly with `fetchpriority="high"`. Until Phase 4 wires
 * `ProductMediaManifest`, `src` points at the committed files in
 * `public/screenshots/`.
 */
export function MediaFigure({ src, alt, caption, width, height, priority = false, className }: MediaFigureProps) {
  return (
    <figure className={['media-figure', className].filter(Boolean).join(' ')}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        {...fetchPriorityAttribute(priority)}
        className="media-figure__image"
        style={{ aspectRatio: `${width} / ${height}` }}
      />
      <figcaption className="media-figure__caption">{caption}</figcaption>
    </figure>
  )
}
