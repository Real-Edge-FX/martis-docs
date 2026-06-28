import { type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'

type RevealVariant = 'up' | 'fade' | 'scale'

const VARIANTS: Record<RevealVariant, Variants> = {
  up: {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.96 },
    show: { opacity: 1, scale: 1 },
  },
}

interface RevealProps {
  children: ReactNode
  className?: string
  /** Animation flavour. Defaults to a gentle rise. */
  variant?: RevealVariant
  /** Seconds of delay before the element animates in. */
  delay?: number
  /** When true, children animate in sequence (pair with `RevealItem`). */
  stagger?: boolean
  /** Stagger gap in seconds between children. */
  staggerGap?: number
  as?: 'div' | 'section' | 'ul' | 'li' | 'span'
}

/**
 * Scroll-triggered reveal wrapper built on `motion`. Animates once when
 * it enters the viewport. Honours `prefers-reduced-motion`: when the user
 * opts out, children render immediately with no transform so layout and
 * legibility are never affected.
 *
 * For staggered groups, set `stagger` on the container and wrap each child
 * in `<RevealItem>` — the container drives the timeline, the items inherit it.
 */
export function Reveal({
  children,
  className,
  variant = 'up',
  delay = 0,
  stagger = false,
  staggerGap = 0.08,
  as = 'div',
}: RevealProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  if (stagger) {
    return (
      <MotionTag
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '0px 0px -10% 0px' }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: staggerGap, delayChildren: delay } },
        }}
      >
        {children}
      </MotionTag>
    )
  }

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={VARIANTS[variant]}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </MotionTag>
  )
}

interface RevealItemProps {
  children: ReactNode
  className?: string
  variant?: RevealVariant
  as?: 'div' | 'li' | 'span'
}

/** A single item inside a staggered `<Reveal stagger>` container. */
export function RevealItem({ children, className, variant = 'up', as = 'div' }: RevealItemProps) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as]

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      variants={VARIANTS[variant]}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
