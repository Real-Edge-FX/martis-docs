import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { Icons } from '@/components/icons'
import { Reveal, RevealItem } from '@/components/landing/Reveal'

interface ShowcaseItem {
  src: string
  title: string
  desc: string
}

const ITEMS: ShowcaseItem[] = [
  { src: '/screenshots/dashboard.png',          title: 'Dashboards',      desc: 'Multi-dashboard with metric cards, filters, polling' },
  { src: '/screenshots/resource-index.png',     title: 'Resource index',  desc: 'Sticky filters, sort, pagination, per-row actions' },
  { src: '/screenshots/resource-create.png',    title: 'Create form',     desc: 'Multi-column grid, reactive fields, save variants' },
  { src: '/screenshots/system-cache.png',       title: 'System cache',    desc: 'Per-subsystem toggle, version, clear' },
  { src: '/screenshots/profile.png',            title: 'Profile & 2FA',   desc: 'Avatar, TOTP enrolment, recovery codes' },
  { src: '/screenshots/login.png',              title: 'Authentication',  desc: 'Login, SSO, locale switcher' },
]

/** A screenshot frame that tilts toward the cursor in 3D. */
function Tilt({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 160, damping: 18 })
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 160, damping: 18 })

  if (reduce) {
    return (
      <div className="rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden">{children}</div>
    )
  }

  return (
    <motion.div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        mx.set((e.clientX - r.left) / r.width)
        my.set((e.clientY - r.top) / r.height)
      }}
      onMouseLeave={() => {
        mx.set(0.5)
        my.set(0.5)
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="rounded-xl ring-1 ring-white/10 bg-ink-900 overflow-hidden will-change-transform"
    >
      {children}
    </motion.div>
  )
}

/**
 * "Real screens from real apps" — gallery section. Each tile links back
 * to the docs home so visitors land on the navigation tree.
 */
export function Showcase() {
  return (
    <section id="components" className="py-24 relative">
      <div className="max-w-[1280px] mx-auto px-6">
        <Reveal className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div className="max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-cobalt-300 mb-3">
              A tour
            </div>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] tracking-[-0.025em] leading-[1.1] font-medium text-white">
              Real screens from real apps.
            </h2>
          </div>
          <Link
            to="/docs/getting-started/installation"
            className="text-[13px] text-ink-200 hover:text-white inline-flex items-center gap-1.5"
          >
            Browse the full docs <Icons.ArrowRight size={13} />
          </Link>
        </Reveal>

        <Reveal stagger staggerGap={0.06} className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ITEMS.map((i) => (
            <RevealItem key={i.title}>
              <Link to="/docs/getting-started/installation" className="group block">
                <Tilt>
                  <img
                    src={i.src}
                    alt={i.title}
                    className="w-full block transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </Tilt>
                <div className="mt-3 text-[14px] font-medium text-white">{i.title}</div>
                <div className="text-[12.5px] text-ink-300">{i.desc}</div>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
