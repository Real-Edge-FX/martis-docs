# Getmartis Foundation and Prerender Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a fundação testável, o registo central de rotas, metadados por página e a pré-renderização estática necessária ao redesign.

**Architecture:** `App` deixa de possuir o router e passa a renderizar uma árvore partilhada por `BrowserRouter` e `StaticRouter`. Um build SSR separado expõe `render(url)`, e um script Node gera HTML por rota a partir do template do cliente, incluindo SEO, sitemap, robots e 404.

**Tech Stack:** React 18, React Router 6, TypeScript 5, Vite 6, Vitest, Testing Library, jsdom.

## Global Constraints

- Trabalhar em `martis-docs`, numa work branch criada a partir da release branch confirmada.
- Manter React 18, Vite 6, TypeScript, MDX e React Router 6.
- HTML principal, links e comando de instalação têm de funcionar sem JavaScript.
- Cada rota pública tem title, description, canonical e Open Graph próprios.
- Código, testes, comentários e commits em inglês.

---

### Task 1: Test harness and deterministic commands

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.tsx`
- Create: `src/test/render-route.tsx`

**Interfaces:**
- Consumes: configuração Vite e alias `@/*` existentes.
- Produces: comandos `pnpm lint`, `pnpm typecheck`, `pnpm test` e ambiente jsdom reutilizado pelas fases seguintes.

- [ ] **Step 1: Escrever o teste mínimo que monta a aplicação**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'

it('renders the home route', async () => {
  render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>)
  expect(await screen.findByRole('main')).toBeInTheDocument()
})
```

- [ ] **Step 2: Executar o teste e confirmar a falha de infraestrutura**

Run: `pnpm exec vitest run src/test/smoke.test.tsx`

Expected: FAIL porque Vitest, jsdom e jest-dom ainda não estão configurados.

- [ ] **Step 3: Instalar e configurar a infraestrutura**

Run:

```bash
pnpm add -D vitest jsdom @testing-library/react @testing-library/jest-dom eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y
```

Adicionar a `package.json`: `lint: eslint . --max-warnings=0`, `typecheck: tsc -b`, `test: vitest run` e `test:watch: vitest`. Criar `vitest.config.ts` com `environment: 'jsdom'`, alias `@`, `setupFiles: ['./src/test/setup.ts']` e `css: false`. Em `setup.ts`, importar `@testing-library/jest-dom/vitest`, limpar o DOM após cada teste e definir stubs de `matchMedia`, `scrollTo` e `ResizeObserver`.

Criar o helper consumido pelos planos seguintes:

```tsx
// src/test/render-route.tsx
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { App } from '@/App'

export function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>)
}
```

- [ ] **Step 4: Executar todas as verificações**

Run: `pnpm lint && pnpm typecheck && pnpm test`

Expected: PASS, incluindo `renders the home route`.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml tsconfig.json vitest.config.ts src/test
git commit -m "test: add docs site test harness"
```

---

### Task 2: Central route and metadata registry

**Files:**
- Create: `src/lib/site-routes.ts`
- Create: `src/lib/site-routes.test.ts`
- Create: `src/lib/seo.ts`
- Create: `src/lib/seo.test.ts`
- Create: `src/components/site/DocumentMeta.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `DOC_FLAT` from `src/lib/docs-tree.ts`.
- Produces: `SITE_URL`, `PUBLIC_ROUTES`, `getRouteMeta(pathname)` e `DocumentMeta`.

- [ ] **Step 1: Escrever testes de rotas e canonical**

```ts
import { expect, it } from 'vitest'
import { getRouteMeta, PUBLIC_ROUTES } from './site-routes'

it('contains every required marketing route exactly once', () => {
  expect(PUBLIC_ROUTES).toEqual(expect.arrayContaining([
    '/', '/product', '/for-agencies', '/compare',
    '/compare/nova', '/compare/filament', '/docs', '/changelog', '/404',
  ]))
  expect(new Set(PUBLIC_ROUTES).size).toBe(PUBLIC_ROUTES.length)
})

it('returns route-specific canonical metadata', () => {
  expect(getRouteMeta('/for-agencies')).toMatchObject({
    canonical: 'https://getmartis.com/for-agencies',
    title: expect.stringContaining('Agencies'),
  })
})
```

- [ ] **Step 2: Confirmar que os testes falham**

Run: `pnpm test -- src/lib/site-routes.test.ts src/lib/seo.test.ts`

Expected: FAIL porque os módulos não existem.

- [ ] **Step 3: Implementar contratos e helpers**

```ts
export const SITE_URL = 'https://getmartis.com'

export interface RouteMeta {
  path: string
  title: string
  description: string
  canonical: string
  image: string
  noIndex?: boolean
}

export function getRouteMeta(pathname: string): RouteMeta {
  const exact = ROUTE_META.find(({ path }) => path === pathname)
  if (exact) return exact
  const doc = DOC_FLAT.find(({ slug }) => `/docs/${slug}` === pathname)
  if (doc) return {
    path: pathname,
    title: `${doc.label} · Martis docs`,
    description: `Learn about ${doc.label} in Martis.`,
    canonical: `${SITE_URL}${pathname}`,
    image: `${SITE_URL}/social/docs.png`,
  }
  return NOT_FOUND_META
}
```

Definir `ROUTE_META` com as nove rotas e o copy aprovado. Implementar `serializeMeta(meta)` em `src/lib/seo.ts` para produzir tags escapadas e `DocumentMeta` para atualizar title/meta/canonical no cliente após navegação.

- [ ] **Step 4: Executar testes e typecheck**

Run: `pnpm test -- src/lib/site-routes.test.ts src/lib/seo.test.ts && pnpm typecheck`

Expected: PASS e zero erros TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/lib/site-routes.ts src/lib/site-routes.test.ts src/lib/seo.ts src/lib/seo.test.ts src/components/site/DocumentMeta.tsx
git commit -m "feat: centralize public routes and metadata"
```

---

### Task 3: Browser/server entry split

**Files:**
- Create: `src/entry-client.tsx`
- Create: `src/entry-server.tsx`
- Create: `src/entry-server.test.tsx`
- Create: `src/lib/render-context.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Docs.tsx`
- Modify: `src/lib/mdx-loader.ts`
- Delete: `src/main.tsx`
- Modify: `index.html`

**Interfaces:**
- Consumes: `App`, `getRouteMeta(pathname)` e `serializeMeta(meta)`.
- Produces: `render(url): Promise<{ html: string; head: string; status: number }>` e `RenderContext` com o módulo MDX inicial.

- [ ] **Step 1: Escrever o teste SSR**

```tsx
import { expect, it } from 'vitest'
import { render } from './entry-server'

it('renders meaningful HTML and metadata without a browser', async () => {
  const result = await render('/for-agencies')
  expect(result.status).toBe(200)
  expect(result.html).toContain('For Laravel agencies')
  expect(result.head).toContain('https://getmartis.com/for-agencies')
})

it('marks unknown routes as 404', async () => {
  expect((await render('/missing')).status).toBe(404)
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/entry-server.test.tsx`

Expected: FAIL com `Cannot find module './entry-server'`.

- [ ] **Step 3: Implementar entradas universal e cliente**

`entry-client.tsx` usa `hydrateRoot` quando `#root` tem conteúdo e `createRoot` apenas em desenvolvimento sem markup. Antes de hidratar uma rota docs, resolve o mesmo módulo com `await loadMdx(slug)`. `entry-server.tsx` resolve o MDX antes de `renderToString`, envolve `App` em `StaticRouter location={url}`, calcula 404 pela metadata e devolve o contrato testado. `App.tsx` deixa de importar qualquer router de topo; contém apenas `Routes`, providers e `DocumentMeta`.

O contexto evita que `Docs.tsx` dependa de `useEffect` no primeiro render:

```tsx
export interface InitialDocument {
  slug: string
  module: MdxModule
}

const RenderContext = createContext<InitialDocument | null>(null)

export function RenderProvider({ initialDocument, children }: PropsWithChildren<{ initialDocument: InitialDocument | null }>) {
  return <RenderContext.Provider value={initialDocument}>{children}</RenderContext.Provider>
}

export function useInitialDocument(slug: string) {
  const value = useContext(RenderContext)
  return value?.slug === slug ? value.module : null
}
```

Exportar `MdxModule` de `mdx-loader.ts`. `DocPage` inicializa o estado com `useInitialDocument(slug)?.default ?? null`; só faz import assíncrono em navegações subsequentes. O teste SSR deve ainda verificar que `/docs/getting-started/installation` contém o H1 real e não contém o loading screen.

Atualizar `index.html` com `<!--app-head-->`, `<div id="root"><!--app-html--></div>` e `/src/entry-client.tsx`.

- [ ] **Step 4: Executar SSR, testes de UI e typecheck**

Run: `pnpm test -- src/entry-server.test.tsx src/test/smoke.test.tsx && pnpm typecheck`

Expected: PASS; nenhum acesso a `window` durante SSR.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/entry-client.tsx src/entry-server.tsx src/entry-server.test.tsx src/lib/render-context.tsx src/lib/mdx-loader.ts src/pages/Docs.tsx src/test/smoke.test.tsx index.html
git rm src/main.tsx
git commit -m "feat: add universal client and server entries"
```

---

### Task 4: Static prerender pipeline

**Files:**
- Create: `vite.ssr.config.ts`
- Create: `scripts/prerender.mjs`
- Create: `scripts/prerender.test.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: server bundle `render(url)` and `PUBLIC_ROUTES`.
- Produces: `dist/<route>/index.html`, `dist/404.html`, `dist/sitemap.xml` e `dist/robots.txt`.

- [ ] **Step 1: Escrever o teste de artefactos**

```js
import assert from 'node:assert/strict'
import fs from 'node:fs'

for (const file of [
  'dist/index.html',
  'dist/product/index.html',
  'dist/docs/index.html',
  'dist/404.html',
  'dist/sitemap.xml',
  'dist/robots.txt',
]) {
  assert.equal(fs.existsSync(file), true, `${file} must exist`)
}
const product = fs.readFileSync('dist/product/index.html', 'utf8')
assert.match(product, /<main/)
assert.match(product, /rel="canonical" href="https:\/\/getmartis\.com\/product"/)
console.log('Prerender artifacts validated.')
```

- [ ] **Step 2: Confirmar a falha antes da implementação**

Run: `rm -rf dist dist-ssr && pnpm build && node scripts/prerender.test.mjs`

Expected: FAIL porque `dist/product/index.html` não existe.

- [ ] **Step 3: Implementar build SSR e prerender**

Adicionar a `package.json`:

```json
{
  "scripts": {
    "build:client": "vite build",
    "build:ssr": "vite build --config vite.ssr.config.ts",
    "prerender": "node scripts/prerender.mjs",
    "build": "pnpm build-search && pnpm build:client && pnpm build:ssr && pnpm prerender",
    "test:prerender": "node scripts/prerender.test.mjs"
  }
}
```

`vite.ssr.config.ts` gera `dist-ssr/entry-server.js` a partir de `src/entry-server.tsx`. `prerender.mjs` lê `dist/index.html`, chama `render()` para cada rota, substitui os dois marcadores, escreve por rota, gera sitemap apenas com rotas indexáveis e copia o HTML de `/404` para `dist/404.html`. Adicionar `dist-ssr/` ao `.gitignore`.

- [ ] **Step 4: Executar o build do zero**

Run: `rm -rf dist dist-ssr && pnpm build && pnpm test:prerender`

Expected: `Prerender artifacts validated.` e exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .gitignore vite.ssr.config.ts scripts/prerender.mjs scripts/prerender.test.mjs
git commit -m "feat: prerender every public route"
```

---

### Task 5: Distribution smoke and CI gate

**Files:**
- Create: `scripts/smoke-dist.mjs`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: conteúdo final de `dist/`.
- Produces: comando `pnpm smoke:dist` e CI obrigatória antes do deploy.

- [ ] **Step 1: Escrever assertions do smoke**

Criar `scripts/smoke-dist.mjs` para percorrer `PUBLIC_ROUTES`, mapear cada rota para o respetivo HTML e falhar se não encontrar `<main`, title, canonical único, `#root` com conteúdo, script cliente ou se encontrar `localhost`. Validar ainda `search-index.json`, sitemap, robots e 404.

Executar o controlo negativo:

```bash
cp dist/product/index.html /tmp/martis-product.html
printf '<html><div id="root"></div></html>' > dist/product/index.html
if pnpm smoke:dist; then exit 1; fi
mv /tmp/martis-product.html dist/product/index.html
```

Expected: o smoke falha ao detetar ausência de conteúdo/canonical.

- [ ] **Step 2: Confirmar o sucesso no artefacto restaurado**

Run: `pnpm smoke:dist`

Expected: resumo com número de rotas e zero falhas.

- [ ] **Step 3: Criar CI completa**

`.github/workflows/ci.yml` corre em pull requests e pushes para `main`/`release/**`, com Node 22:

```yaml
- run: corepack enable
- run: pnpm install --frozen-lockfile
- run: pnpm lint
- run: pnpm typecheck
- run: pnpm test
- run: pnpm build
- run: pnpm smoke:dist
```

Remover do workflow de deploy a cópia SPA `cp dist/index.html dist/404.html`; a 404 passa a ser gerada pelo prerender.

- [ ] **Step 4: Executar a gate local equivalente**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm smoke:dist`

Expected: todos os comandos com exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/smoke-dist.mjs .github/workflows/ci.yml .github/workflows/deploy.yml
git commit -m "ci: require prerender and distribution smoke checks"
```
