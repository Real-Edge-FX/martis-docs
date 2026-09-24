# Getmartis Marketing and Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema visual aprovado e as páginas Home, Product e For Agencies com prova real, copy orientado a agências e conversão para instalação.

**Architecture:** Componentes partilhados vivem em `components/site`; padrões editoriais e de produto vivem em `components/marketing`. O conteúdo estruturado fica em módulos de dados tipados, mantendo JSX focado em composição e permitindo testes de copy sem acoplar ao layout.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4, Motion, Vitest, Testing Library, Playwright, axe-core.

## Global Constraints

- Product Cinema é a direção principal; tipografia editorial é usada como contraste, não como ornamento dominante.
- Paleta exata: Night `#080A10`, Surface `#10131C`, Elevated `#171B27`, Line `#2B3245`, Primary `#F4F5FA`, Muted `#A5ADBD`, Cobalt `#7187FF`, Violet `#A674FF`, Proof green `#56C98B`, Editorial paper `#F2F0E9`, Editorial ink `#14151A`.
- Fontes: Geist, Instrument Serif e Geist Mono, autoalojadas.
- Movimento entre 180–700 ms; sem glow em loop, cursor spotlight ou parallax contínuo.
- O primeiro viewport contém audiência, headline, `MIT licensed · No paid tier`, CTA e comando de instalação.
- Validar 375, 768, 1024 e 1440 px.

---

### Task 1: Tokens, fonts and shared site shell

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/motion.css`
- Modify: `src/styles/globals.css`
- Create: `public/fonts/geist-latin.woff2`
- Create: `public/fonts/geist-mono-latin.woff2`
- Create: `public/fonts/instrument-serif-latin.woff2`
- Create: `src/components/site/SiteHeader.tsx`
- Create: `src/components/site/SiteFooter.tsx`
- Create: `src/components/site/SiteShell.tsx`
- Create: `src/components/site/SiteShell.test.tsx`
- Modify: `index.html`

**Interfaces:**
- Consumes: `Logo`, router `Link` e rotas da Fase 1.
- Produces: `SiteShell({ children, surface })`, `SiteHeader` e `SiteFooter` usados por todas as páginas.

- [ ] **Step 1: Escrever testes de navegação e mensagem legal**

```tsx
it('exposes primary navigation and the install action', () => {
  render(<MemoryRouter><SiteShell><main>Content</main></SiteShell></MemoryRouter>)
  expect(screen.getByRole('link', { name: 'Product' })).toHaveAttribute('href', '/product')
  expect(screen.getByRole('link', { name: 'For Agencies' })).toHaveAttribute('href', '/for-agencies')
  expect(screen.getByRole('link', { name: 'Install Martis' })).toHaveAttribute('href', '/docs/getting-started/installation')
  expect(screen.getByText(/MIT licensed · No paid tier/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/components/site/SiteShell.test.tsx`

Expected: FAIL porque `SiteShell` não existe.

- [ ] **Step 3: Implementar tokens e shell**

Definir custom properties semânticas em `tokens.css`, incluindo superfícies light/dark, texto, focus ring, container e spacing. `motion.css` define durações/easing e desliga transições não essenciais em `prefers-reduced-motion`. Remover Google Fonts de `index.html`, declarar três `@font-face` com `font-display: swap` e preload apenas de Geist regular.

`SiteHeader` inclui Product, For Agencies, Compare, Docs, GitHub e Install Martis; menu mobile usa `aria-expanded`, fecha com Escape e restitui foco. `SiteFooter` liga para Docs, Compare, Changelog, GitHub e MIT.

```tsx
export function SiteShell({ children, surface = 'marketing' }: PropsWithChildren<{ surface?: 'marketing' | 'docs' }>) {
  return (
    <div className="site-shell" data-surface={surface}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader surface={surface} />
      {children}
      <SiteFooter />
    </div>
  )
}
```

- [ ] **Step 4: Testar shell e acessibilidade básica**

Run: `pnpm test -- src/components/site/SiteShell.test.tsx && pnpm typecheck`

Expected: PASS e zero erros.

- [ ] **Step 5: Commit**

```bash
git add src/styles src/components/site public/fonts index.html
git commit -m "feat: add the Martis site design system"
```

---

### Task 2: Conversion and proof primitives

**Files:**
- Create: `src/components/site/InstallCommand.tsx`
- Create: `src/components/site/InstallCommand.test.tsx`
- Create: `src/components/marketing/ProofStrip.tsx`
- Create: `src/components/marketing/ProductFrame.tsx`
- Create: `src/components/marketing/Chapter.tsx`
- Create: `src/components/marketing/MediaFigure.tsx`
- Create: `src/data/product.ts`
- Modify: `src/data/landing.ts`

**Interfaces:**
- Consumes: `SiteReleaseManifest`, `PackagistStats` e media manifest da Fase 4, inicialmente através dos snapshots versionados.
- Produces: `InstallCommand`, `ProofStrip`, `ProductFrame`, `Chapter`, `MediaFigure` e `PRODUCT_CHAPTERS`.

- [ ] **Step 1: Escrever testes do comando e prova**

```tsx
it('copies the install command and exposes a manual fallback', async () => {
  const writeText = vi.fn().mockRejectedValue(new Error('blocked'))
  Object.assign(navigator, { clipboard: { writeText } })
  render(<InstallCommand command="composer require martis/martis" />)
  await userEvent.click(screen.getByRole('button', { name: 'Copy install command' }))
  expect(screen.getByText('Select and copy the command')).toBeInTheDocument()
})

it('labels unavailable proof data without inventing a value', () => {
  render(<ProofStrip release={null} stats={null} />)
  expect(screen.getAllByText('Data temporarily unavailable').length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/components/site/InstallCommand.test.tsx`

Expected: FAIL porque os componentes não existem.

- [ ] **Step 3: Implementar os primitives**

O comando usa `navigator.clipboard.writeText`, seleciona o `<code>` quando falha e anuncia o estado via `aria-live="polite"`. `ProofStrip` aceita dados nulos e mostra versão, testes, requisitos e downloads. `MediaFigure` exige `alt`, `caption`, `width` e `height`; reserva aspect ratio e usa `loading="lazy"` fora do hero.

Definir:

```ts
export type ProductChapterId = 'model' | 'operate' | 'secure' | 'adapt' | 'extend' | 'ship'

export interface ProductChapterData {
  id: ProductChapterId
  title: string
  outcome: string
  agencyScenario: string
  docsHref: string
  mediaId: string
  code: { language: 'php' | 'tsx' | 'bash'; filename: string; source: string }
}
```

- [ ] **Step 4: Executar testes e typecheck**

Run: `pnpm test -- src/components/site/InstallCommand.test.tsx && pnpm typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/InstallCommand.tsx src/components/site/InstallCommand.test.tsx src/components/marketing src/data/product.ts src/data/landing.ts
git commit -m "feat: add reusable conversion and product proof components"
```

---

### Task 3: Homepage narrative

**Files:**
- Rewrite: `src/pages/Landing.tsx`
- Rewrite: `src/components/landing/Hero.tsx`
- Create: `src/components/landing/AgencyValue.tsx`
- Create: `src/components/landing/ProductChapters.tsx`
- Create: `src/components/landing/ComparisonTeaser.tsx`
- Create: `src/components/landing/EngineeringProof.tsx`
- Rewrite: `src/components/landing/CtaBanner.tsx`
- Create: `src/pages/Landing.test.tsx`
- Delete: `src/components/landing/AuroraBackdrop.tsx`
- Delete: `src/components/landing/Spotlight.tsx`

**Interfaces:**
- Consumes: primitives da Task 2 e dados gerados.
- Produces: homepage completa na rota `/`.

- [ ] **Step 1: Escrever teste da narrativa e ordem**

```tsx
it('presents the approved agency narrative in conversion order', () => {
  renderRoute('/')
  const main = screen.getByRole('main')
  expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent('The admin foundation your agency can ship again.')
  expect(within(main).getByText('MIT licensed · No paid tier')).toBeInTheDocument()
  expect(within(main).getByRole('link', { name: 'Install Martis' })).toBeVisible()
  expect(within(main).getByText('Start from a proven baseline')).toBeInTheDocument()
  expect(within(main).getByRole('link', { name: /Compare with Nova and Filament/i })).toHaveAttribute('href', '/compare')
})
```

- [ ] **Step 2: Confirmar que o copy atual falha**

Run: `pnpm test -- src/pages/Landing.test.tsx`

Expected: FAIL na headline e nas secções de agência.

- [ ] **Step 3: Implementar as nove secções**

Compor por esta ordem: header, hero, proof strip, agency value, code-to-UI, product chapters, comparison teaser, real media, engineering proof, CTA e footer. Remover cursor spotlight, WebGL aurora, loops e contadores animados. O frame de produto acima da dobra usa poster responsivo com prioridade de fetch e dimensões explícitas.

```tsx
export default function Landing() {
  return <SiteShell><main id="main-content">
    <Hero />
    <ProofStrip release={release} stats={stats} />
    <AgencyValue />
    <CodeUI />
    <ProductChapters />
    <ComparisonTeaser />
    <Showcase />
    <EngineeringProof />
    <CtaBanner />
  </main></SiteShell>
}
```

- [ ] **Step 4: Executar testes, build e inspeção SSR**

Run: `pnpm test -- src/pages/Landing.test.tsx && pnpm build && rg -n "The admin foundation|MIT licensed" dist/index.html`

Expected: ambos os textos aparecem no HTML pré-renderizado.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx src/pages/Landing.test.tsx src/components/landing
git commit -m "feat: rebuild the homepage for agency conversion"
```

---

### Task 4: Product page

**Files:**
- Create: `src/pages/Product.tsx`
- Create: `src/pages/Product.test.tsx`
- Create: `src/components/marketing/ChapterNav.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `PRODUCT_CHAPTERS`, `Chapter` e `SiteShell`.
- Produces: rota `/product` com os seis capítulos e deep links estáveis.

- [ ] **Step 1: Escrever o teste dos seis capítulos**

```tsx
it('renders every product chapter with a docs link', () => {
  renderRoute('/product')
  for (const name of ['Model', 'Operate', 'Secure', 'Adapt', 'Extend', 'Ship']) {
    expect(screen.getByRole('heading', { name })).toBeInTheDocument()
  }
  expect(screen.getAllByRole('link', { name: /Read the docs/i })).toHaveLength(6)
})
```

- [ ] **Step 2: Confirmar a falha da rota**

Run: `pnpm test -- src/pages/Product.test.tsx`

Expected: FAIL porque `/product` ainda não renderiza `Product`.

- [ ] **Step 3: Implementar página e navegação de capítulos**

Cada capítulo apresenta outcome, cenário de agência, media, código, requisitos e link de docs. `ChapterNav` é sticky em desktop, scrollável em mobile e usa links de fragmento nativos. Não introduzir scroll-spy obrigatório para compreender a página.

```tsx
export default function Product() {
  return <SiteShell><main id="main-content">
    <header><p>Product</p><h1>One foundation. Six parts of delivery.</h1></header>
    <ChapterNav chapters={PRODUCT_CHAPTERS} />
    {PRODUCT_CHAPTERS.map((chapter) => <Chapter key={chapter.id} chapter={chapter} />)}
    <CtaBanner />
  </main></SiteShell>
}
```

- [ ] **Step 4: Testar e verificar HTML**

Run: `pnpm test -- src/pages/Product.test.tsx && pnpm build && rg -n "Model|Operate|Secure|Adapt|Extend|Ship" dist/product/index.html`

Expected: PASS e os seis títulos no HTML.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Product.tsx src/pages/Product.test.tsx src/components/marketing/ChapterNav.tsx src/App.tsx
git commit -m "feat: add the product narrative page"
```

---

### Task 5: For Agencies page and responsive visual QA

**Files:**
- Create: `src/pages/ForAgencies.tsx`
- Create: `src/pages/ForAgencies.test.tsx`
- Create: `src/components/marketing/AgencyCycle.tsx`
- Create: `src/components/marketing/AdoptionChecklist.tsx`
- Create: `tests/e2e/marketing.spec.ts`
- Create: `playwright.config.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `SiteShell`, `InstallCommand` e rota `/for-agencies`.
- Produces: página de agência e cobertura E2E dos quatro breakpoints.

- [ ] **Step 1: Escrever teste de conteúdo**

```tsx
it('connects the product to repeatable client delivery', () => {
  renderRoute('/for-agencies')
  for (const text of ['Win the next project', 'Build with a repeatable system', 'Hand over with confidence', 'Maintain across clients', 'Protect margin']) {
    expect(screen.getByRole('heading', { name: text })).toBeInTheDocument()
  }
  expect(screen.getByText('baseline → customize → deliver → maintain → reuse')).toBeInTheDocument()
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/pages/ForAgencies.test.tsx`

Expected: FAIL porque a rota não existe.

- [ ] **Step 3: Implementar página e E2E**

Adicionar Playwright e `@axe-core/playwright`. O E2E visita `/`, `/product` e `/for-agencies` em 375×844, 768×1024, 1024×768 e 1440×900; confirma ausência de overflow horizontal, CTA visível, menu utilizável e zero violações axe de impacto critical/serious.

```tsx
export default function ForAgencies() {
  return <SiteShell><main id="main-content">
    <header><p>For Laravel agencies</p><h1>Build a baseline once. Keep shipping it.</h1></header>
    <AgencyCycle steps={['baseline', 'customize', 'deliver', 'maintain', 'reuse']} />
    <AdoptionChecklist />
    <InstallCommand command="composer require martis/martis" />
  </main></SiteShell>
}
```

- [ ] **Step 4: Executar a gate visual**

Run: `pnpm test && pnpm build && pnpm exec playwright test tests/e2e/marketing.spec.ts`

Expected: 12 combinações de página/viewport passam. Rever manualmente os screenshots de falha antes de atualizar qualquer baseline.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ForAgencies.tsx src/pages/ForAgencies.test.tsx src/components/marketing/AgencyCycle.tsx src/components/marketing/AdoptionChecklist.tsx src/App.tsx tests/e2e/marketing.spec.ts playwright.config.ts package.json pnpm-lock.yaml
git commit -m "feat: add the agency delivery page"
```

---

### Task 6: Performance and visual regression gate

**Files:**
- Create: `lighthouserc.cjs`
- Create: `tests/e2e/visual.spec.ts`
- Create: `tests/e2e/visual.spec.ts-snapshots/.gitkeep`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: build pré-renderizado e páginas de marketing concluídas.
- Produces: `pnpm test:visual` e `pnpm test:performance`.

- [ ] **Step 1: Criar testes visuais antes de aceitar baselines**

```ts
for (const route of ['/', '/product', '/for-agencies']) {
  test(`${route} matches the approved composition`, async ({ page }) => {
    await page.goto(route)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(page).toHaveScreenshot(`${route.replaceAll('/', '-') || 'home'}.png`, {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.005,
    })
  })
}
```

- [ ] **Step 2: Executar sem baselines e rever as imagens geradas**

Run: `pnpm exec playwright test tests/e2e/visual.spec.ts`

Expected: FAIL com snapshots ausentes. Rever cada imagem contra os mockups aprovados antes de usar `--update-snapshots`.

- [ ] **Step 3: Configurar budgets Lighthouse**

```js
module.exports = {
  ci: {
    collect: { staticDistDir: './dist', url: ['http://localhost/', 'http://localhost/product/', 'http://localhost/for-agencies/'] },
    assert: { assertions: {
      'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
      'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      'interactive': ['error', { maxNumericValue: 3500 }],
      'categories:accessibility': ['error', { minScore: 0.95 }],
      'categories:seo': ['error', { minScore: 0.95 }],
    } },
  },
}
```

Instalar `@lhci/cli`, adicionar scripts e guardar baselines Playwright aprovados. INP é medido em produção por RUM; o threshold de 200 ms fica configurado no provider de analytics quando este for autorizado, sem introduzir cookies por defeito.

- [ ] **Step 4: Executar a gate completa**

Run: `pnpm build && pnpm test:visual && pnpm test:performance`

Expected: snapshots passam; LCP ≤ 2500 ms, CLS ≤ 0.1, accessibility/SEO ≥ 0.95.

- [ ] **Step 5: Commit**

```bash
git add lighthouserc.cjs tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots .github/workflows/ci.yml package.json pnpm-lock.yaml
git commit -m "test: enforce marketing visual and performance budgets"
```
