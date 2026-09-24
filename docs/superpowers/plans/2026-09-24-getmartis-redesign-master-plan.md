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

---

## Adenda de execução (24 de setembro de 2026)

Decisões tomadas com o utilizador na revisão prévia dos planos contra o código real. Prevalecem sobre o texto dos planos 01 a 04 onde houver diferença.

### Base, branches e paragens

- A produção (getmartis.com, v1.39.0) vive em `docs/v1.16.1-compat-notifications`, 92 commits à frente do `main` de 29 de junho. A `release/getmartis-redesign-v2` parte dessa branch; o `main` só recebe tudo no fim, pelo PR da release, fundido pelo utilizador na web.
- Em cada fronteira de fase, a branch de produção é integrada na release para não acumular deriva de conteúdo.
- Cada fase tem a sua work branch a partir da release. O agente faz push, abre o PR para a release e faz o merge quando o gate da fase passa.
- A release branch confirmada vale para as Fases 1 a 3. Paragens obrigatórias: revisão visual humana do Gate 2 e checkpoint antes da Fase 4, que mexe em três repositórios.

### Resoluções aceites

1. **Alvo de deploy.** O deploy real é o `scripts/deploy.sh` para a Hostinger (Apache/LiteSpeed); o `.github/workflows/deploy.yml` fica desativado. Na Fase 1, o `public/.htaccess` passa a servir `<rota>/index.html` sem redirecionamento para a barra final, devolve 404 real com `404.html` e deixa de reescrever tudo para `/index.html`; o `scripts/deploy.sh` deixa de copiar `index.html` por cima de `404.html`. Na Fase 4, a publicação é feita na Hostinger por SSH, e não no root Caddy.
2. **Contratos de dados.** A Task 1 do Plano 04 é executada como Task 6 da Fase 1. Os snapshots `release.json` e `packagist.json` são semeados com os valores reais atuais e passam a ser gerados na Fase 4.
3. **Páginas provisórias.** A Fase 1 cria páginas mínimas (`main`, H1 e ligação para a instalação) para `/product`, `/for-agencies`, `/compare`, `/compare/nova`, `/compare/filament` e `/changelog`. As Fases 2 e 3 substituem-nas; os respetivos passos RED falham pela ausência dos headings aprovados.
4. **SSR com páginas lazy.** `entry-server.tsx` usa `renderToPipeableStream` com `onAllReady`, em vez de `renderToString`, e `entry-client.tsx` pré-carrega o chunk da rota antes de `hydrateRoot`.
5. **Teste da Home.** `MIT licensed · No paid tier` é verificado separadamente no hero e no CTA final, em vez de um único `getByText` dentro do `main`.
6. **Teste do validador de comparações.** A fixture inválida usa um domínio oficial em `http://`; a allowlist de domínios tem um teste próprio.
7. **Changelog.** O parser aceita `-` e `—` entre versão e data, normaliza as categorias pelo prefixo (Added, Changed, Fixed, Removed, Security, Deprecated, Breaking), converte Migration, Recovery e Notes for consumers em notas de upgrade, exclui as categorias internas (Tests, Internal, Stats, Validation, Vendor, Documentation, Docs) e falha perante uma categoria sem mapeamento. O JSON gerado é versionado; o build não depende de `../martis-package`.
8. **Caminhos e inputs.** O documento do pacote é `internal/release-process.md`, não `docs/release-process.md`. As referências a `StatStrip.tsx` no Plano 04 passam a `ProofStrip`. O ensaio usa um input booleano `dry_run` com a versão real, em vez de `create_tag=false` e `1.39.0-site-dry-run`.
9. **Verificação antes da tag.** O `pre-tag-check.sh` do workspace passa a ler `src/data/generated/release.json`; a alteração é feita na Fase 4, quando o processo de release muda.
10. **Mockups aprovados.** Versionados em `docs/superpowers/specs/2026-09-24-getmartis-redesign-mockups/`; são a referência da revisão visual.

### Pontos em aberto para o checkpoint da Fase 4

- Nem o `martis-package` nem o `martis-playground` têm release branch.
- A checkout do Playground tem alterações de outra sessão por commitar; o trabalho da Fase 4 corre numa worktree.
- `lmelomoura/martis-playground` é privado e exige um token com acesso aos três repositórios.
- Segredos e environments (`MARTIS_RELEASE_TOKEN`, chave SSH de deploy, `site-release-staging`, `production`) são criados pelo utilizador.
- Impedir tags fora do pipeline exige um ruleset de tags nas definições do `martis-package`, que o plano não prevê.
- Definir que execução da matriz Pest (PHP × Laravel) alimenta o manifesto e a política para os testes skipped esperados.
