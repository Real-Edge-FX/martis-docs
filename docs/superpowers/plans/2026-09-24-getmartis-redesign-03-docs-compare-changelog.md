# Getmartis Docs, Compare and Changelog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar a documentação num produto dark/light, criar comparações explícitas e verificáveis com Nova e Filament, e publicar um changelog navegável.

**Architecture:** O shell de docs reutiliza os tokens do site e recebe um `ThemeProvider` SSR-safe. Comparações e releases são dados validados no build; as páginas apenas compõem dados já tipados e nunca fazem fetch em runtime.

**Tech Stack:** React, TypeScript, MDX, React Router, Vitest, Testing Library, Playwright, axe-core, Node.js.

## Global Constraints

- Docs suporta light/dark, sistema por defeito e preferência persistida.
- Usar tooltips acessíveis; não depender de `title` nativo para UI Martis.
- Comparações usam fontes oficiais, data, metodologia e “when to choose each”.
- Nenhuma alegação comparativa pode ter mais de 90 dias.
- Sem winner badges, ataques, rankings inventados ou inferências apresentadas como factos.
- Pesquisa é utilizável por teclado e tem URL partilhável.

---

### Task 1: Theme provider and responsive docs shell

**Files:**
- Create: `src/lib/theme.tsx`
- Create: `src/lib/theme.test.tsx`
- Create: `src/components/site/ThemeToggle.tsx`
- Rewrite: `src/pages/Docs.tsx`
- Modify: `src/components/docs/Sidebar.tsx`
- Modify: `src/components/docs/Toc.tsx`
- Modify: `src/styles/prose.css`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Produces: `ThemeProvider`, `useTheme()` e `ThemeToggle`.
- Consumes: `SiteShell`, `DOC_NAV`, `loadMdx` e `mdxComponents`.

- [ ] **Step 1: Escrever testes de tema**

```tsx
function ThemeProbe() {
  const { resolvedTheme } = useTheme()
  return <output data-testid="theme">{resolvedTheme}</output>
}

it('uses the system theme until the user chooses one', () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  render(<ThemeProvider><ThemeProbe /></ThemeProvider>)
  expect(screen.getByTestId('theme')).toHaveTextContent('dark')
})

it('persists an explicit light preference', async () => {
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>)
  await userEvent.click(screen.getByRole('button', { name: 'Use light theme' }))
  expect(localStorage.getItem('martis-theme')).toBe('light')
  expect(document.documentElement).toHaveAttribute('data-theme', 'light')
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/lib/theme.test.tsx`

Expected: FAIL porque `ThemeProvider` não existe.

- [ ] **Step 3: Implementar tema e shell**

O estado permitido é `system | light | dark`; resolver sistema apenas após mount, mas emitir um script inline mínimo em `index.html` para evitar flash. Em `Sidebar`, substituir `title` por um componente tooltip acessível acionável por hover e foco. Em mobile, expor sidebar num drawer com botão, Escape, foco contido e scroll bloqueado.

```ts
export type ThemePreference = 'system' | 'light' | 'dark'

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}
```

- [ ] **Step 4: Executar testes e build SSR**

Run: `pnpm test -- src/lib/theme.test.tsx && pnpm build && pnpm smoke:dist`

Expected: PASS sem hydration warnings.

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme.tsx src/lib/theme.test.tsx src/components/site/ThemeToggle.tsx src/pages/Docs.tsx src/components/docs src/styles index.html
git commit -m "feat: add accessible light and dark documentation themes"
```

---

### Task 2: Docs landing and shareable search

**Files:**
- Create: `src/pages/DocsHome.tsx`
- Create: `src/pages/SearchResults.tsx`
- Create: `src/pages/SearchResults.test.tsx`
- Create: `src/data/docs-journeys.ts`
- Modify: `src/pages/Docs.tsx`
- Modify: `src/lib/search.ts`
- Modify: `src/components/CmdK.tsx`
- Modify: `src/lib/site-routes.ts`

**Interfaces:**
- Produces: `/docs` com percursos e `/docs/search?q=...` com resultados.
- Consumes: `searchStatic(query)` e `searchFullText(query)`.

- [ ] **Step 1: Escrever teste de resultados por query string**

```tsx
it('renders a shareable search result page', async () => {
  renderRoute('/docs/search?q=filters')
  expect(screen.getByRole('heading', { name: 'Search documentation' })).toBeInTheDocument()
  expect(await screen.findByRole('link', { name: /Filters/i })).toHaveAttribute('href', '/docs/core/filters')
})
```

- [ ] **Step 2: Confirmar a falha da rota**

Run: `pnpm test -- src/pages/SearchResults.test.tsx`

Expected: FAIL porque `/docs/search` é tratado como um slug MDX inexistente.

- [ ] **Step 3: Implementar percursos e pesquisa**

`DocsHome` apresenta Install, Build a resource, Add filters/actions, Customize, Secure e Upgrade. `SearchResults` lê `q` de `useSearchParams`, funde/deduplica resultados e anuncia a contagem por `aria-live`. O Cmd+K mantém navegação rápida e inclui ação `View all results` para `/docs/search?q=<encoded>`.

```tsx
const [params] = useSearchParams()
const query = params.get('q')?.trim() ?? ''
const hits = query ? dedupeSearchHits([...searchStatic(query), ...fullTextHits]) : []
return <main id="main-content"><h1>Search documentation</h1><output aria-live="polite">{hits.length} results</output><SearchResultList hits={hits} /></main>
```

- [ ] **Step 4: Testar teclado, zero resultados e URL**

Run: `pnpm test -- src/pages/SearchResults.test.tsx src/components/CmdK.test.tsx && pnpm typecheck`

Expected: PASS para query preenchida, vazia, sem resultados, Escape e Enter.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DocsHome.tsx src/pages/SearchResults.tsx src/pages/SearchResults.test.tsx src/data/docs-journeys.ts src/pages/Docs.tsx src/lib/search.ts src/components/CmdK.tsx src/components/CmdK.test.tsx src/lib/site-routes.ts
git commit -m "feat: add docs journeys and shareable search"
```

---

### Task 3: Comparison data contract and validation

**Files:**
- Create: `src/data/comparison/types.ts`
- Create: `src/data/comparison/nova.ts`
- Create: `src/data/comparison/filament.ts`
- Create: `scripts/validate-comparisons.mjs`
- Create: `scripts/validate-comparisons.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `ComparisonClaim`, `ComparisonPageData` e comando `pnpm validate:comparisons`.
- Consumes: apenas URLs oficiais de Martis, Laravel Nova e Filament.

- [ ] **Step 1: Escrever fixtures inválidas e o teste do validador**

```js
const invalid = {
  id: 'nova-license',
  criterion: 'License',
  product: 'nova',
  value: 'Commercial',
  explanation: 'Nova requires a license.',
  sourceUrl: 'http://example.com',
  sourceLabel: '',
  checkedAt: '2025-01-01',
}
assert.deepEqual(validateClaim(invalid, new Date('2026-09-24')), [
  'sourceUrl must use HTTPS',
  'sourceLabel is required',
  'checkedAt is older than 90 days',
])
```

- [ ] **Step 2: Confirmar a falha**

Run: `node scripts/validate-comparisons.test.mjs`

Expected: FAIL porque o módulo validador não existe.

- [ ] **Step 3: Implementar contrato e dados editoriais**

```ts
export interface ComparisonClaim {
  id: string
  criterion: string
  product: 'martis' | 'nova' | 'filament'
  value: string
  explanation: string
  sourceUrl: string
  sourceLabel: string
  checkedAt: string
}
```

`validate-comparisons.mjs` importa os dados compilados, recusa IDs duplicados, campos vazios, HTTP, datas futuras ou com mais de 90 dias e domínios fora da allowlist oficial. Adicionar `validate:comparisons` a `validate:content`. Os valores devem ser transcritos das fontes oficiais no momento da implementação; a conclusão editorial deve identificar-se como `editorialNote`, não como claim factual.

- [ ] **Step 4: Executar validador e controlo negativo**

Run: `node scripts/validate-comparisons.test.mjs && pnpm validate:comparisons`

Expected: fixtures inválidas são recusadas e os dados reais passam.

- [ ] **Step 5: Commit**

```bash
git add src/data/comparison scripts/validate-comparisons.mjs scripts/validate-comparisons.test.mjs package.json
git commit -m "feat: add sourced comparison data"
```

---

### Task 4: Comparison pages

**Files:**
- Create: `src/pages/Compare.tsx`
- Create: `src/pages/CompareProduct.tsx`
- Create: `src/pages/Compare.test.tsx`
- Create: `src/components/compare/ComparisonTable.tsx`
- Create: `src/components/compare/ChoiceGuidance.tsx`
- Create: `src/components/compare/SourceList.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ComparisonPageData` de Nova e Filament.
- Produces: `/compare`, `/compare/nova`, `/compare/filament` e ligação `Report a correction`.

- [ ] **Step 1: Escrever teste de equilíbrio editorial**

```tsx
it.each(['nova', 'filament'])('explains when to choose both Martis and %s', (product) => {
  renderRoute(`/compare/${product}`)
  expect(screen.getByRole('heading', { name: 'Choose Martis when…' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: new RegExp(`Choose ${product}`, 'i') })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Report a correction' })).toHaveAttribute('href', expect.stringContaining('issues/new'))
  expect(screen.queryByText(/winner/i)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/pages/Compare.test.tsx`

Expected: FAIL porque as rotas ainda apontam para 404.

- [ ] **Step 3: Implementar overview e detalhe**

`ComparisonTable` usa `<table>`, `<caption>`, headers com `scope` e notas expansíveis por botão. Em mobile mantém a tabela scrollável e oferece cartões semanticamente equivalentes apenas se a ordem de leitura continuar correta. `SourceList` mostra label, domínio e `checkedAt`; `Report a correction` pré-preenche o título do issue sem incluir texto não confiável.

```tsx
export default function CompareProduct({ data }: { data: ComparisonPageData }) {
  return <SiteShell><main id="main-content">
    <ChoiceGuidance martis={data.chooseMartisWhen} alternative={data.chooseAlternativeWhen} alternativeName={data.alternativeName} />
    <ComparisonTable claims={data.claims} />
    <SourceList claims={data.claims} />
    <a href={data.correctionUrl}>Report a correction</a>
  </main></SiteShell>
}
```

- [ ] **Step 4: Testar páginas e validação de conteúdo**

Run: `pnpm test -- src/pages/Compare.test.tsx && pnpm validate:comparisons && pnpm build`

Expected: PASS; as três rotas têm HTML pré-renderizado.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Compare.tsx src/pages/CompareProduct.tsx src/pages/Compare.test.tsx src/components/compare src/App.tsx
git commit -m "feat: publish evidence-based product comparisons"
```

---

### Task 5: Generated changelog

**Files:**
- Create: `scripts/build-changelog.mjs`
- Create: `scripts/build-changelog.test.mjs`
- Create: `src/data/generated/changelog.json`
- Create: `src/types/changelog.ts`
- Create: `src/pages/Changelog.tsx`
- Create: `src/pages/Changelog.test.tsx`
- Modify: `src/App.tsx`
- Modify: `package.json`

**Interfaces:**
- Consumes: `../martis-package/CHANGELOG.md` no build sincronizado.
- Produces: `ChangelogRelease[]` e rota `/changelog`.

- [ ] **Step 1: Escrever teste do parser**

```js
const markdown = `## [1.40.0] - 2026-09-24\n### Added\n- New filters.\n### Breaking\n- Rename hook.`
assert.deepEqual(parseChangelog(markdown)[0], {
  version: '1.40.0',
  date: '2026-09-24',
  sections: [
    { category: 'Added', items: ['New filters.'] },
    { category: 'Breaking', items: ['Rename hook.'] },
  ],
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `node scripts/build-changelog.test.mjs`

Expected: FAIL porque `parseChangelog` não existe.

- [ ] **Step 3: Implementar parser e página**

O parser aceita categorias Added, Changed, Fixed, Removed, Security e Breaking; preserva Markdown inline seguro, gera URL oficial de release e falha em headings de versão sem conteúdo. A página filtra por versão/categoria via query string e dá permalink `#v1-40-0` a cada release. Integrar geração antes de `build-search`.

```ts
export interface ChangelogRelease {
  version: string
  date: string
  releaseUrl: string
  sections: Array<{ category: 'Added' | 'Changed' | 'Fixed' | 'Removed' | 'Security' | 'Breaking'; items: string[] }>
}
```

- [ ] **Step 4: Executar testes e build**

Run: `node scripts/build-changelog.test.mjs && pnpm test -- src/pages/Changelog.test.tsx && pnpm build`

Expected: PASS e `dist/changelog/index.html` contém a release atual.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-changelog.mjs scripts/build-changelog.test.mjs src/data/generated/changelog.json src/types/changelog.ts src/pages/Changelog.tsx src/pages/Changelog.test.tsx src/App.tsx package.json
git commit -m "feat: generate and publish the Martis changelog"
```

---

### Task 6: Documentation E2E and accessibility gate

**Files:**
- Create: `tests/e2e/docs.spec.ts`
- Create: `tests/e2e/compare.spec.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: servidor de preview definido em `playwright.config.ts`.
- Produces: gate E2E de docs, pesquisa, temas e comparações.

- [ ] **Step 1: Escrever os percursos E2E**

Cobrir: abrir `/docs`, escolher Install, navegar anterior/seguinte, abrir Cmd+K, pesquisar `filters`, abrir `/docs/search?q=filters`, alternar light/dark, recarregar e confirmar persistência; em comparações, abrir fontes, expandir notas e verificar `Report a correction`.

- [ ] **Step 2: Executar e observar falhas reais**

Run: `pnpm exec playwright test tests/e2e/docs.spec.ts tests/e2e/compare.spec.ts`

Expected: qualquer falha aponta para comportamento específico, não para timeout genérico.

- [ ] **Step 3: Corrigir seletores e adicionar axe**

Usar roles/labels, não classes CSS. Executar `AxeBuilder` em docs light/dark e páginas de comparação, recusando `critical` e `serious`.

```ts
const results = await new AxeBuilder({ page }).analyze()
expect(results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious')).toEqual([])
```

- [ ] **Step 4: Executar gate completa da fase**

Run: `pnpm validate:content && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec playwright test`

Expected: exit code 0 em todos os comandos.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e .github/workflows/ci.yml
git commit -m "test: gate docs and comparisons with end-to-end checks"
```
