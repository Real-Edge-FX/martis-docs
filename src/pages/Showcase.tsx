import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '@/hooks/useMotion'
import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { SiteShell } from '@/components/site/SiteShell'
import { ImageLightbox } from '@/components/media/ImageLightbox'
import { SHOWCASE, type ShowcaseProject } from '@/data/showcase'

export default function Showcase() {
  return (
    <SiteShell>
      <main id="main-content">
        <section className="page-hero showcase-hero">
          <div className="site-container">
            <p className="eyebrow"><span /> Built with Martis</p>
            <h1>Real products,<br /><em>running on Martis.</em></h1>
            <p>Screens captured from the staging environments of products built on Martis, with what each one takes from the foundation and what its team built on top.</p>
          </div>
        </section>

        {SHOWCASE.map((project, index) => <ShowcaseEntry key={project.id} project={project} index={index} />)}

        <section className="section compact-cta">
          <div className="site-container">
            <div>
              <p className="eyebrow"><span /> Your product here</p>
              <h2>Built something<br /><em>with Martis?</em></h2>
              <Link className="text-link" to="/contact">Tell us about it <Icons.ArrowRight size={14} /></Link>
            </div>
            <Link className="button button--primary" to="/docs/getting-started/installation">Start a project <Icons.ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}

function ShowcaseEntry({ project, index }: { project: ShowcaseProject; index: number }) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)
  const screen = project.screens[active]
  const autoplay = !paused && lightbox === null && project.screens.length > 1 && !prefersReducedMotion()

  // Cycle through the screens; hovering or focusing the stage holds it.
  useEffect(() => {
    if (!autoplay) return
    const timer = window.setTimeout(() => setActive((i) => (i + 1) % project.screens.length), 6000)
    return () => window.clearTimeout(timer)
  }, [autoplay, active, project.screens.length])
  const items = project.screens.map((s) => ({ src: s.src, alt: `${project.name} — ${s.label}`, label: s.label }))

  return (
    <section className="section showcase-entry" id={project.id}>
      <div className="site-container">
        <div className="showcase-entry__head reveal">
          <div>
            <p className="showcase-entry__index">{String(index + 1).padStart(2, '0')} · {project.kind}</p>
            <h2>{project.name}</h2>
            <p className="showcase-entry__summary">{project.summary}</p>
          </div>
          <dl className="showcase-entry__stats">
            {project.stats.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>

        <div className="showcase-stage reveal" data-autoplay={autoplay} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <figure className="product-visual showcase-stage__frame">
            <div className="product-visual__chrome">
              <span /><span /><span />
              <p>{screen.label}</p>
              <span className="product-visual__live">Staging</span>
            </div>
            <button ref={openerRef} type="button" className="showcase-stage__image" onClick={() => setLightbox(active)} aria-label={`Enlarge image: ${screen.label}`}>
              {project.screens.map((s, i) => (
                <img key={s.src} src={s.src} alt={`${project.name} — ${s.label}`} width="1440" height="900" loading={i === 0 ? 'eager' : 'lazy'} data-active={i === active} />
              ))}
              <span><Icons.Search size={15} /> Enlarge</span>
            </button>
          </figure>
          <ol className="showcase-stage__thumbs" aria-label={`${project.name} screens`}>
            {project.screens.map((s, i) => (
              <li key={s.src}>
                <button type="button" aria-pressed={i === active} onClick={() => setActive(i)}>
                  <img src={s.src} alt="" width="240" height="150" loading="lazy" />
                  <span><strong>{s.label}</strong>{s.caption}</span>
                  {i === active && <i className="showcase-stage__progress" key={active} aria-hidden="true" />}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="showcase-entry__body">
          <div className="showcase-entry__about reveal">
            <p className="eyebrow"><span /> The project</p>
            <p>{project.description}</p>
          </div>
          <div className="showcase-entry__uses">
            <p className="eyebrow reveal"><span /> What it uses from Martis</p>
            <ul>
              {project.martis.map((item) => (
                <li key={item.title} className="reveal spotlight"><Icons.Check size={15} /><div><strong>{item.title}</strong><p>{item.body}</p></div></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {lightbox !== null && (
        <ImageLightbox
          items={items}
          activeIndex={lightbox}
          onIndexChange={setLightbox}
          onClose={() => { setLightbox(null); requestAnimationFrame(() => openerRef.current?.focus()) }}
        />
      )}
    </section>
  )
}
