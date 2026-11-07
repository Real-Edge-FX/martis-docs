import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { InstallCommand } from '@/components/site/InstallCommand'
import { SiteShell } from '@/components/site/SiteShell'
import { ProductVisual } from '@/components/marketing/ProductVisual'
import { AGENCY_VALUE, PRODUCT_CHAPTERS, RELEASE } from '@/data/site'
import { SHOWCASE } from '@/data/showcase'
import { usePackagistDownloads } from '@/hooks/usePackagistDownloads'
import { useCountUp, useTilt } from '@/hooks/useMotion'

const code = `class ClientResource extends Resource
{
    public function fields(Request $request): array
    {
        return [
            Text::make('name')->searchable(),
            Email::make('email')->sortable(),
            Badge::make('status')->map([
                'active' => 'success',
                'paused' => 'warning',
            ]),
        ];
    }
}`

export default function Landing() {
  return (
    <SiteShell>
      <main id="main-content">
        <section className="hero-section">
          <HeroMotion />
          <div className="hero-orbit hero-orbit--one" />
          <div className="hero-orbit hero-orbit--two" />
          <div className="site-container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span /> Open-source admin foundation for Laravel agencies</p>
              <h1>The admin foundation your agency can <em>ship again.</em></h1>
              <p className="hero-lede">Turn repeatable client work into a repeatable delivery system—without giving up React, Laravel or control of the final product.</p>
              <div className="hero-actions">
                <Link className="button button--primary" to="/docs/getting-started/installation">Install Martis <Icons.ArrowRight size={16} /></Link>
                <Link className="button button--ghost" to="/product">See how it works</Link>
              </div>
              <div className="license-proof"><Icons.Check size={14} /><strong>MIT licensed · No paid tier</strong><span>No per-project fee</span></div>
              <InstallCommand />
            </div>
            <HeroProduct />
          </div>
        </section>

        <ProofStrip />

        <section className="section section--paper">
          <div className="site-container">
            <SectionIntro eyebrow="The agency advantage" title={<>Stop rebuilding the <em>starting line.</em></>} body="Your value is the client-specific work. Martis standardises everything that should already be solved before that work begins." dark />
            <div className="agency-value-grid">
              {AGENCY_VALUE.map((item) => <article key={item.number} className="agency-value-card reveal spotlight"><span>{item.number}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}
            </div>
          </div>
        </section>

        <section className="section code-product-section">
          <div className="site-container">
            <SectionIntro eyebrow="From resource to interface" title={<>Write the intent.<br /><em>Ship the workflow.</em></>} body="A concise PHP resource becomes a complete React operating surface—searchable, sortable and ready to extend." />
            <div className="code-product-grid reveal">
              <div className="code-window"><div className="code-window__head"><span>app/Martis/ClientResource.php</span><span>PHP</span></div><pre><code>{code}</code></pre></div>
              <ProductVisual image="/screenshots/resource-index.png" label="Clients · Resource index" />
            </div>
          </div>
        </section>

        <section className="section chapter-preview">
          <div className="site-container">
            <SectionIntro eyebrow="One delivery system" title={<>Everything between the model<br />and a <em>confident handover.</em></>} body="Six connected parts, designed as one foundation rather than a bag of unrelated components." />
            <div className="chapter-preview__grid">
              {PRODUCT_CHAPTERS.map((chapter) => {
                const Icon = Icons[chapter.icon]
                return <Link to={`/product#${chapter.id}`} key={chapter.id} className="chapter-card reveal spotlight"><div><span>{chapter.number}</span><Icon size={18} /></div><h3>{chapter.title}</h3><p>{chapter.kicker}</p><Icons.ArrowRight size={15} /></Link>
              })}
            </div>
          </div>
        </section>

        <section className="section comparison-callout">
          <div className="site-container comparison-callout__inner">
            <div><p className="eyebrow eyebrow--light"><span /> Make the right trade-off</p><h2>Not every team needs the <em>same kind</em> of admin.</h2><p>Compare licensing, frontend architecture and extension models using dated claims and official sources.</p></div>
            <div className="comparison-callout__cards">
              <Link to="/compare/nova"><small>Explicit comparison</small><strong>Martis vs Nova</strong><Icons.ArrowRight size={16} /></Link>
              <Link to="/compare/filament"><small>Explicit comparison</small><strong>Martis vs Filament</strong><Icons.ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        <section className="section gallery-section">
          <div className="site-container">
            <SectionIntro eyebrow="Real product, not a concept" title={<>The operating surface<br /><em>your clients will use.</em></>} body="Captured from the Martis Playground—the same Laravel application used to validate the package." />
            <div className="gallery-grid reveal">
              <ProductVisual image="/screenshots/dashboard.png" label="Executive dashboard" />
              <ProductVisual image="/screenshots/resource-create.png" label="Resource creation" />
              <ProductVisual image="/screenshots/system-cache.png" label="System operations" />
            </div>
          </div>
        </section>

        <section className="section built-with">
          <div className="site-container">
            <div className="reveal"><SectionIntro eyebrow="Built with Martis" title={<>Already running<br /><em>real businesses.</em></>} body="Products in production use Martis as their operating surface. See their screens, and what each one takes from the foundation." /></div>
            <div className="built-with__grid">
              {SHOWCASE.map((project) => (
                <Link key={project.id} to={`/showcase#${project.id}`} className="built-with__card reveal spotlight">
                  <div className="built-with__shot"><img src={project.screens[0].src} alt={`${project.name} — ${project.screens[0].label}`} width="1440" height="900" loading="lazy" /></div>
                  <div className="built-with__meta"><small>{project.kind}</small><strong>{project.name}</strong><p>{project.summary}</p><span>See the project <Icons.ArrowRight size={14} /></span></div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section final-cta">
          <div className="final-cta__glow" />
          <AmbientVideo className="final-cta__motion" name="cta" />
          <div className="site-container final-cta__inner">
            <p className="eyebrow"><span /> Your next client project</p>
            <h2>Start with the part<br />you would otherwise <em>rebuild.</em></h2>
            <p>Open source. Production-minded. Designed to become your agency’s admin foundation.</p>
            <InstallCommand />
            <div className="final-cta__links"><Link to="/docs/getting-started/quick-start">Read the quick start <Icons.ArrowRight size={14} /></Link><a href="https://github.com/Real-Edge-FX/martis-package">View on GitHub <Icons.ArrowRight size={14} /></a></div>
          </div>
        </section>
      </main>
    </SiteShell>
  )
}

function ProofStrip() {
  const downloads = usePackagistDownloads()
  const stats: Array<[string | number, string]> = [
    [`v${RELEASE.version}`, 'Current release'],
    [RELEASE.tests, 'Tests passing'],
    [RELEASE.laravel, 'Supported'],
    [downloads.total, 'Packagist installs'],
  ]
  return <section className="proof-strip" aria-label="Product proof"><div className="site-container proof-strip__inner">{stats.map(([value, label]) => <div key={label}><strong>{typeof value === 'number' ? <CountUp value={value} /> : value}</strong><span>{label}</span></div>)}<a href="https://github.com/Real-Edge-FX/martis-package"><Icons.GitHub size={16} /> Inspect the source</a></div></section>
}

function SectionIntro({ eyebrow, title, body, dark = false }: { eyebrow: string; title: ReactNode; body: string; dark?: boolean }) {
  return <header className={`section-intro ${dark ? 'section-intro--dark' : ''}`}><p className="eyebrow"><span /> {eyebrow}</p><h2>{title}</h2><p>{body}</p></header>
}

/**
 * Ambient loop behind the hero (generated artwork, ping-pong so it loops
 * without a cut). Reduced motion keeps the still poster.
 */
function HeroMotion() {
  return <AmbientVideo className="hero-motion" name="hero" />
}

/** A muted generated loop (`/media/{name}-loop.*`); reduced motion keeps the poster. */
function AmbientVideo({ className, name }: { className: string; name: string }) {
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  // Phones get the MP4 alone: Safari is strict about the WebM it is served.
  const [narrow] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches)
  const still = reduced
  const videoRef = useRef<HTMLVideoElement>(null)

  // React sets `muted` as a property, not as the attribute iOS Safari needs
  // before it allows autoplay; set both and start playback explicitly. iOS
  // also leaves the loop paused when the page comes back from the
  // back/forward cache or the app returns to the foreground, pauses it off
  // screen, and blocks autoplay in Low Power Mode until a gesture: resume it
  // on each of those moments.
  useEffect(() => {
    const video = videoRef.current
    if (!video || still) return
    video.muted = true
    video.defaultMuted = true
    video.setAttribute('muted', '')
    const resume = () => {
      if (document.visibilityState === 'hidden' || !video.paused) return
      video.play()?.catch(() => undefined)
    }
    resume()
    const onVisibility = () => resume()
    const events: Array<[EventTarget, string]> = [
      [window, 'pageshow'], [window, 'focus'], [document, 'visibilitychange'],
      [window, 'touchstart'], [window, 'scroll'], [window, 'pointerdown'],
    ]
    events.forEach(([target, type]) => target.addEventListener(type, onVisibility, { passive: true }))
    video.addEventListener('canplay', resume)
    const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => { if (entry?.isIntersecting) resume() })
    observer?.observe(video)
    return () => {
      events.forEach(([target, type]) => target.removeEventListener(type, onVisibility))
      video.removeEventListener('canplay', resume)
      observer?.disconnect()
    }
  }, [still])

  return (
    <div className={className} aria-hidden="true">
      {still ? (
        <img src={`/media/${name}-poster.webp`} alt="" />
      ) : (
        <video ref={videoRef} autoPlay muted loop playsInline preload="auto" poster={`/media/${name}-poster.webp`}>
          {narrow ? (
            // Phones: a light MP4 (about 300 KB).
            <source src={`/media/loops/${name}-loop-mobile.mp4`} type="video/mp4" />
          ) : (
            <>
              <source src={`/media/loops/${name}-loop.webm`} type="video/webm" />
              <source src={`/media/loops/${name}-loop.mp4`} type="video/mp4" />
            </>
          )}
        </video>
      )}
    </div>
  )
}

function CountUp({ value }: { value: number }) {
  const [ref, shown] = useCountUp<HTMLSpanElement>(value)
  return <span ref={ref} aria-label={value.toLocaleString('en-US')}>{shown.toLocaleString('en-US')}</span>
}

function HeroProduct() {
  const ref = useTilt<HTMLDivElement>(5)
  return (
    <div className="hero-product" ref={ref}>
      <div className="hero-product__badge"><span><i className="live-dot" />Built with Martis</span><strong>Ready for client delivery</strong></div>
      <ProductVisual />
    </div>
  )
}
