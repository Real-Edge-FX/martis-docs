# Getmartis Redesign — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Coordenar a implementação completa do novo getmartis.com, desde a fundação pré-renderizada até ao deploy de release coerente com a tag do pacote.

**Architecture:** O trabalho está dividido em quatro planos sequenciais, cada um com um resultado utilizável e uma revisão própria. `martis-docs` mantém a aplicação pública, dados gerados e deployment; `martis-playground` fornece apenas o estado determinístico para media; `martis-package` mantém o gate que autoriza a criação da tag.

**Tech Stack:** React 18, React Router 6, TypeScript 5, Vite 6, MDX 3, Tailwind CSS 4, Vitest, Testing Library, Playwright, axe-core, GitHub Actions, Node.js 22.

## Global Constraints

- A prosa e a interface entregues no produto são em inglês; comentários, nomes e commits também são em inglês.
- O público prioritário são agências que entregam vários projetos Laravel a clientes.
- A headline principal é `The admin foundation your agency can ship again.`.
- A mensagem `MIT licensed · No paid tier` aparece no primeiro viewport e no CTA final.
- Marketing é dark-first; documentação suporta dark/light com preferência persistida.
- Manter React, Vite, TypeScript, MDX e React Router; não migrar de framework.
- Pré-renderizar todas as rotas públicas e hidratar no cliente.
- Comparações usam apenas fontes oficiais, data de verificação e prazo máximo de 90 dias.
- Não usar testemunhos, logos de clientes ou números de negócio sem prova e autorização.
- Media vem do Playground determinístico nos viewports 1440×900, 1024×768 e 390×844.
- Cumprir WCAG 2.2 AA e os orçamentos LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms.
- Toda a criação de tag atualiza e valida site, docs, dados e media antes da publicação.
- Nunca criar uma work branch a partir de `main` ou `develop`; confirmar a release branch com o utilizador antes de executar cada plano.

---

## Ordem de execução

| Fase | Plano | Repositório principal | Resultado verificável |
| --- | --- | --- | --- |
| 1 | [Foundation and prerender](./2026-09-24-getmartis-redesign-01-foundation-prerender.md) | `martis-docs` | Todas as rotas produzem HTML e metadados sem JavaScript |
| 2 | [Marketing and design system](./2026-09-24-getmartis-redesign-02-marketing-design.md) | `martis-docs` | Home, Product e For Agencies completas e responsivas |
| 3 | [Docs, comparisons and changelog](./2026-09-24-getmartis-redesign-03-docs-compare-changelog.md) | `martis-docs` | Docs dark/light, pesquisa, comparações e changelog funcionais |
| 4 | [Data, media, release and deploy](./2026-09-24-getmartis-redesign-04-release-pipeline.md) | `martis-docs`, `martis-package`, `martis-playground` | Tag e deploy bloqueados até todos os artefactos corresponderem ao mesmo SHA |

## Gates entre fases

- [ ] **Gate 1:** concluir a Fase 1 com testes unitários, integração SSR, `pnpm build` e smoke do HTML pré-renderizado.
- [ ] **Gate 2:** concluir a Fase 2 com snapshots nos quatro breakpoints, axe sem violações críticas e revisão visual humana.
- [ ] **Gate 3:** concluir a Fase 3 com links/fontes válidos, comparações frescas, MDX compilado e pesquisa navegável por teclado.
- [ ] **Gate 4:** executar uma release de ensaio sem tag, seguida de uma release real idempotente e smoke de produção.

## Estratégia de branches

1. Confirmar a release branch ativa antes de iniciar cada fase.
2. Criar uma work branch por fase: `feat/site-prerender`, `feat/marketing-redesign`, `feat/docs-compare-changelog` e `chore/release-site-pipeline`.
3. Para a parte do `martis-package`, criar uma branch separada `chore/gated-release-pipeline` a partir da release branch do pacote aprovada pelo utilizador.
4. Fazer merge por ordem. Não iniciar a fase seguinte enquanto o respetivo gate não passar.

## Contratos partilhados

Os planos seguintes dependem destes contratos, definidos na Fase 1 e preenchidos na Fase 4:

```ts
export interface SiteReleaseManifest {
  version: string
  packageCommit: string
  docsCommit?: string
  releaseHeadline: string
  phpRequirement: string
  laravelRequirement: string
  pestTests: number
  vitestTests: number
  totalTests: number
  generatedAt: string
}

export interface PackagistStats {
  package: 'martis/martis'
  total: number
  monthly: number
  daily: number
  fetchedAt: string
  sourceUrl: string
}

export interface ProductMediaManifest {
  packageVersion: string
  packageCommit: string
  route: string
  viewport: { width: number; height: number }
  theme: 'light' | 'dark'
  locale: string
  capturedAt: string
  checksum: string
}
```

## Verificação final do programa

Executar no `martis-docs`:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm validate:content
pnpm build
pnpm smoke:dist
```

Resultado esperado: todos os comandos terminam com exit code 0; o smoke confirma as dez rotas obrigatórias, canonical, versão, SHA, assets, search index, sitemap, robots e 404.

Executar no `martis-package`:

```bash
composer install --no-interaction
vendor/bin/pest --no-coverage
vendor/bin/phpstan analyse --no-progress --memory-limit=2G
vendor/bin/pint --test
npm ci
npm run test
npm run lint -- --max-warnings=0
npm run build
```

Resultado esperado: todas as suites passam e o build publicado permanece idêntico às fontes.
