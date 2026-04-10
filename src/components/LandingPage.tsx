import React from 'react';

const CODE_SNIPPET = `// Define a resource
class PostResource extends Resource
{
    public static function model(): string
    {
        return Post::class;
    }

    public function fields(Request $request): array
    {
        return [
            Text::make('title')
                ->sortable()->searchable(),
            Textarea::make('body')
                ->hideFromIndex(),
            BelongsTo::make('category_id', 'Category')
                ->titleAttribute('name'),
            DateTime::make('published_at')
                ->sortable()->nullable(),
        ];
    }
}`;

const FEATURES = [
  {
    icon: '⚡',
    title: 'Resource-Driven CRUD',
    desc: 'Define one PHP resource class and get a production-ready index, detail, create, edit, and delete interface — zero frontend code.',
  },
  {
    icon: '🧩',
    title: '32 Built-in Field Types',
    desc: 'Text, Select, BelongsToMany, Trix, Code, Currency, Sparkline and more — every field ships with display, form, and validation logic built in.',
  },
  {
    icon: '🔧',
    title: 'Override-First Architecture',
    desc: 'Replace any component — field renderer, layout, drawer, or entire page — without forking the package. Four-tier resolution system.',
  },
  {
    icon: '🎯',
    title: 'Context-Aware Fields',
    desc: 'The backend is the single source of truth. Fields automatically adapt to index, detail, create, and update contexts.',
  },
  {
    icon: '🛡️',
    title: 'Policy-Based Authorization',
    desc: 'Full Nova v5-compatible authorization: viewAny, view, create, update, delete, attach, detach — resolved via Laravel policies.',
  },
  {
    icon: '🚀',
    title: 'Powerful Actions System',
    desc: 'Inline, bulk, destructive, queued, and pivot actions with custom React modals. Rich ActionResponse types.',
  },
];

const PHILOSOPHY = [
  {
    label: 'React-First Frontend',
    desc: 'Built on React 18 + PrimeReact + Tailwind CSS. Every UI element is a proper React component — no Blade on the frontend.',
    color: '#6366f1',
  },
  {
    label: 'Backend as Source of Truth',
    desc: 'The /schema endpoint drives the entire UI. Field visibility, ordering, and permissions are resolved server-side.',
    color: '#8b5cf6',
  },
  {
    label: 'Composer Package',
    desc: 'Install via Composer. Publish config and assets. Stay up to date with standard version management.',
    color: '#06b6d4',
  },
  {
    label: 'Full Escape Hatches',
    desc: 'Sane defaults everywhere. Every default is replaceable — from field renderers to entire resource pages.',
    color: '#3b82f6',
  },
];

function HeroCode() {
  return (
    <div style={{
      background: '#0d1117',
      borderRadius: 12,
      border: '1px solid #30363d',
      overflow: 'hidden',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: '1.6',
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        background: '#161b22',
        padding: '10px 16px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        borderBottom: '1px solid #30363d',
      }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        <span style={{ marginLeft: 8, color: '#8b949e', fontSize: 12 }}>PostResource.php</span>
      </div>
      <pre style={{
        margin: 0,
        padding: '20px 24px',
        overflowX: 'auto',
        color: '#e6edf3',
      }}>
        <code dangerouslySetInnerHTML={{
          __html: CODE_SNIPPET
            .replace(/\bclass\b/g, '<span style="color:#ff7b72">class</span>')
            .replace(/\bextends\b/g, '<span style="color:#ff7b72">extends</span>')
            .replace(/\bpublic\b/g, '<span style="color:#ff7b72">public</span>')
            .replace(/\bstatic\b/g, '<span style="color:#ff7b72">static</span>')
            .replace(/\bfunction\b/g, '<span style="color:#ff7b72">function</span>')
            .replace(/\breturn\b/g, '<span style="color:#ff7b72">return</span>')
            .replace(/'[^']+'/g, (m) => `<span style="color:#a5d6ff">${m}</span>`)
            .replace(/\/\/ .+/g, (m) => `<span style="color:#8b949e">${m}</span>`)
            .replace(/\b(Text|Textarea|BelongsTo|DateTime|Resource|Request)\b/g, '<span style="color:#ffa657">$1</span>')
        }} />
      </pre>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#f1f5f9',
      background: '#020817',
      minHeight: '100vh',
    }}>
      {/* HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        background: 'rgba(2,8,23,0.9)',
        backdropFilter: 'blur(12px)',
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Martis" style={{ height: 36 }} />
          </a>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a href="/getting-started/introduction/" style={navLinkStyle}>Docs</a>
            <a href="/core/resources/" style={navLinkStyle}>Resources</a>
            <a href="/reference/api/" style={navLinkStyle}>API</a>
            <a href="https://github.com/Real-Edge-FX/martis" target="_blank" rel="noopener"
              style={{
                ...navLinkStyle,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <svg height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '100px 24px 80px',
        background: 'linear-gradient(135deg, #020817 0%, #0f0b2d 40%, #0c1a3b 70%, #020817 100%)',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />
        {/* Glow effects */}
        <div style={{
          position: 'absolute', top: -200, left: '20%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: 0, right: '10%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 64,
          alignItems: 'center',
          position: 'relative',
        }}>
          {/* Left - copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 24,
              fontSize: 13, color: '#a5b4fc',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />
              Laravel Admin Engine · v1.x
            </div>

            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 24,
              background: 'linear-gradient(135deg, #f1f5f9 30%, #a5b4fc 70%, #67e8f9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              The Laravel<br />Admin Engine
            </h1>

            <p style={{
              fontSize: 20,
              lineHeight: 1.7,
              color: '#94a3b8',
              marginBottom: 16,
              maxWidth: 480,
            }}>
              React-first. Resource-driven. Override-first.
            </p>
            <p style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: '#64748b',
              marginBottom: 40,
              maxWidth: 480,
            }}>
              Define a PHP resource class and get a complete, production-ready admin interface.
              No frontend code required. No template limitations.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
              <a href="/getting-started/installation/" style={primaryBtnStyle}>
                Get Started →
              </a>
              <a href="https://github.com/Real-Edge-FX/martis" target="_blank" rel="noopener" style={ghostBtnStyle}>
                View on GitHub
              </a>
            </div>

            {/* Install command */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 8, padding: '10px 18px',
              fontFamily: 'monospace', fontSize: 14, color: '#a5b4fc',
            }}>
              <span style={{ color: '#475569', userSelect: 'none' }}>$</span>
              <span>composer require martis/martis</span>
            </div>
          </div>

          {/* Right - code preview */}
          <div>
            <HeroCode />
          </div>
        </div>

        {/* Hero Image Showcase */}
        <div style={{
          maxWidth: 1200,
          margin: '64px auto 0',
          position: 'relative',
        }}>
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
          }}>
            <div style={{
              background: '#161b22',
              padding: '10px 16px',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              borderBottom: '1px solid rgba(99,102,241,0.2)',
            }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
              <span style={{ marginLeft: 8, color: '#8b949e', fontSize: 12 }}>Martis Admin Panel</span>
            </div>
            <img
              src="/hero.png"
              alt="Martis Admin Dashboard Preview"
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section style={{ padding: '80px 24px', background: '#030d1a' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              color: '#f1f5f9',
            }}>Everything you need, built-in</h2>
            <p style={{ color: '#64748b', fontSize: 18, maxWidth: 560, margin: '0 auto' }}>
              From field types to authorization — Martis ships production-ready primitives for every admin requirement.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 12,
                padding: '28px 24px',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.4)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.15)';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{
                  fontSize: 17, fontWeight: 600, color: '#f1f5f9',
                  marginBottom: 10, lineHeight: 1.3,
                }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section style={{ padding: '80px 24px', background: '#020817' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginBottom: 16,
              color: '#f1f5f9',
            }}>Built on solid principles</h2>
            <p style={{ color: '#64748b', fontSize: 18, maxWidth: 520, margin: '0 auto' }}>
              Every decision in Martis traces back to a clear philosophy.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 24,
          }}>
            {PHILOSOPHY.map((p, i) => (
              <div key={i} style={{
                background: 'rgba(15,23,42,0.5)',
                border: `1px solid ${p.color}22`,
                borderRadius: 12,
                padding: '32px 28px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  width: 4, height: '100%',
                  background: `linear-gradient(180deg, ${p.color} 0%, ${p.color}44 100%)`,
                }} />
                <h3 style={{
                  fontSize: 18, fontWeight: 600,
                  color: '#f1f5f9', marginBottom: 12,
                }}>{p.label}</h3>
                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUICK INSTALL */}
      <section style={{
        padding: '80px 24px',
        background: 'linear-gradient(135deg, #0f0b2d 0%, #0c1a3b 100%)',
        borderTop: '1px solid rgba(99,102,241,0.15)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 16,
            color: '#f1f5f9',
          }}>Up and running in minutes</h2>
          <p style={{ color: '#64748b', fontSize: 18, marginBottom: 40 }}>
            Martis is a standard Composer package. Install it, run the installer, define your first resource.
          </p>

          <div style={{
            background: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: 12,
            textAlign: 'left',
            overflow: 'hidden',
            fontFamily: 'monospace',
          }}>
            <div style={{
              background: '#161b22',
              padding: '10px 16px',
              borderBottom: '1px solid #30363d',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: '#8b949e', fontSize: 13 }}>Terminal</span>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {[
                ['$', 'composer require martis/martis', '#a5b4fc'],
                ['$', 'php artisan martis:install', '#a5b4fc'],
                ['$', 'php artisan make:martis-resource Post', '#a5b4fc'],
              ].map(([prompt, cmd, color], i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 12 : 0 }}>
                  <span style={{ color: '#475569', userSelect: 'none' }}>{prompt}</span>
                  <span style={{ color }}>{cmd}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ color: '#475569', fontSize: 14, marginTop: 20 }}>
            Requires PHP 8.2+ and Laravel 11+
          </p>
        </div>
      </section>

      {/* NOVA PARITY */}
      <section style={{ padding: '80px 24px', background: '#030d1a' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 16,
            padding: '48px 40px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 40,
            alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontSize: 12, fontWeight: 600, letterSpacing: '0.1em',
                color: '#6366f1', textTransform: 'uppercase', marginBottom: 16,
              }}>Nova v5 Parity</div>
              <h2 style={{
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 700,
                color: '#f1f5f9',
                marginBottom: 16,
                letterSpacing: '-0.02em',
              }}>
                Functionally equivalent to Laravel Nova v5 — and beyond
              </h2>
              <p style={{ color: '#64748b', fontSize: 16, lineHeight: 1.7, marginBottom: 0 }}>
                Same resource model. Same field API. Same authorization contract. Martis extends further with
                React-first architecture, four-tier override resolution, and full escape hatches at every layer.
              </p>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <a href="/reference/parity-map/" style={primaryBtnStyle}>
                View Parity Map
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '100px 24px',
        background: 'linear-gradient(135deg, #020817 0%, #0f0b2d 50%, #020817 100%)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: 20,
            background: 'linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 60%, #67e8f9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Start building today
          </h2>
          <p style={{ color: '#64748b', fontSize: 18, lineHeight: 1.7, marginBottom: 40 }}>
            Read the docs, explore the API, and deploy your first Martis-powered admin panel in minutes.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/getting-started/introduction/" style={primaryBtnStyle}>
              Read the Docs →
            </a>
            <a href="/getting-started/installation/" style={ghostBtnStyle}>
              Installation Guide
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(99,102,241,0.15)',
        padding: '40px 24px',
        background: '#020817',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Martis" style={{ height: 28 }} />
            <span style={{ color: '#475569', fontSize: 14 }}>
              Laravel Admin Engine · MIT License
            </span>
          </div>
          <nav style={{ display: 'flex', gap: 24 }}>
            {[
              ['Docs', '/getting-started/introduction/'],
              ['Resources', '/core/resources/'],
              ['Fields', '/core/fields/'],
              ['GitHub', 'https://github.com/Real-Edge-FX/martis'],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{
                color: '#475569', fontSize: 14, textDecoration: 'none',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = '#a5b4fc'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = '#475569'}
              >{label}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: 6,
  transition: 'color 0.2s, background 0.2s',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  color: '#fff',
  textDecoration: 'none',
  padding: '12px 28px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const ghostBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(99,102,241,0.1)',
  color: '#a5b4fc',
  textDecoration: 'none',
  padding: '12px 28px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  border: '1px solid rgba(99,102,241,0.3)',
  cursor: 'pointer',
  transition: 'background 0.2s, border-color 0.2s',
};
