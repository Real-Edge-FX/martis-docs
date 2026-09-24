# Getmartis Data, Media, Release and Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatizar dados públicos, media do Playground e uma release em duas fases que impeça a criação de tags quando site, docs, estatísticas ou artefactos não correspondem ao SHA do pacote.

**Architecture:** `martis-docs` gera snapshots validados e um bundle `dist.tar.gz` imutável, guardado numa draft release de staging. `martis-package` só cria a tag após verificar o manifesto desse staging; depois despacha `martis-docs` para publicar exatamente o tarball e checksum validados. O Playground é uma dependência de captura, nunca uma fonte de lógica de produto.

**Tech Stack:** Node.js 22, TypeScript, Playwright, Docker Compose/Make, GitHub Actions, GitHub CLI, Packagist API, rsync, SHA-256.

## Global Constraints

- Esta fase altera três repositórios; confirmar a release branch de cada um antes de criar work branches.
- Não codificar caminhos de máquina; todos os caminhos vêm de checkout, workspace ou inputs.
- O browser nunca consulta Packagist, GitHub ou Playground em runtime.
- Dados de release falham fechados; o workflow diário preserva o último snapshot válido.
- O `dist` publicado é byte a byte o mesmo que foi validado antes da tag.
- A mesma versão/SHA pode ser repetida sem duplicar tag, release ou deploy.
- Segredos têm permissões mínimas e nunca são impressos.

---

### Task 1: Generated data contracts and loaders

**Files (`martis-docs`):**
- Create: `src/types/generated-data.ts`
- Create: `src/lib/generated-data.ts`
- Create: `src/lib/generated-data.test.ts`
- Create: `src/data/generated/release.json`
- Create: `src/data/generated/packagist.json`
- Modify: `src/data/landing.ts`
- Modify: `src/components/landing/Hero.tsx`
- Modify: `src/components/landing/StatStrip.tsx`

**Interfaces:**
- Produces: `SiteReleaseManifest`, `PackagistStats`, `loadReleaseManifest()` e `loadPackagistStats()`.
- Consumes: JSON versionado gerado pelas Tasks 2 e 3.

- [ ] **Step 1: Escrever testes de schema e fallback**

```ts
it('rejects a release whose totals do not add up', () => {
  expect(() => parseReleaseManifest({
    version: '1.40.0', packageCommit: 'a'.repeat(40), releaseHeadline: 'Release',
    phpRequirement: '^8.3', laravelRequirement: '^12.0|^13.0',
    pestTests: 100, vitestTests: 20, totalTests: 119,
    generatedAt: '2026-09-24T10:00:00.000Z',
  })).toThrow('totalTests must equal pestTests + vitestTests')
})

it('rejects negative download values', () => {
  expect(() => parsePackagistStats({ package: 'martis/martis', total: -1 })).toThrow()
})
```

- [ ] **Step 2: Confirmar a falha**

Run: `pnpm test -- src/lib/generated-data.test.ts`

Expected: FAIL porque os parsers não existem.

- [ ] **Step 3: Implementar tipos e parsers sem dependência runtime**

Definir exatamente os três contratos aprovados no plano mestre. Validar ISO dates, SHA hexadecimal de 40 caracteres, versão sem `v`, inteiros não negativos, soma de testes e package literal `martis/martis`. Importar JSON estaticamente. Remover `VERSION`, `RELEASE_HEADLINE` e total de testes manuais de `landing.ts`.

- [ ] **Step 4: Executar testes e confirmar ausência de valores manuais**

Run: `pnpm test -- src/lib/generated-data.test.ts && ! rg -n "export const (VERSION|RELEASE_HEADLINE)|2,325|3,990" src/data src/components`

Expected: PASS; `rg` não encontra constantes antigas.

- [ ] **Step 5: Commit**

```bash
git add src/types/generated-data.ts src/lib/generated-data.ts src/lib/generated-data.test.ts src/data/generated src/data/landing.ts src/components/landing/Hero.tsx src/components/landing/StatStrip.tsx
git commit -m "feat: consume validated release and download data"
```

---

### Task 2: Packagist snapshot generator and daily workflow

**Files (`martis-docs`):**
- Create: `scripts/fetch-packagist-stats.mjs`
- Create: `scripts/fetch-packagist-stats.test.mjs`
- Create: `.github/workflows/update-packagist.yml`
- Modify: `package.json`

**Interfaces:**
- Produces: `fetchPackagistStats(fetchImpl, now)` e `src/data/generated/packagist.json`.
- Consumes: `https://packagist.org/packages/martis/martis.json`.

- [ ] **Step 1: Escrever testes com fetch injetado**

```js
const fakeFetch = async () => ({
  ok: true,
  json: async () => ({ package: { downloads: { total: 190, monthly: 125, daily: 3 } } }),
})
assert.deepEqual(await fetchPackagistStats(fakeFetch, new Date('2026-09-24T12:00:00Z')), {
  package: 'martis/martis', total: 190, monthly: 125, daily: 3,
  fetchedAt: '2026-09-24T12:00:00.000Z',
  sourceUrl: 'https://packagist.org/packages/martis/martis.json',
})
await assert.rejects(() => fetchPackagistStats(async () => ({ ok: false, status: 503 }), new Date()), /503/)
```

- [ ] **Step 2: Confirmar a falha**

Run: `node scripts/fetch-packagist-stats.test.mjs`

Expected: FAIL porque a função não existe.

- [ ] **Step 3: Implementar fetch atómico e workflow diário**

O script valida content-type/schema, timeout de 10 s e escreve primeiro para ficheiro temporário antes de rename. Suporta `--check-fresh=24` sem alterar ficheiros. O workflow corre diariamente e manualmente: checkout, install, fetch, `git diff --quiet`; se mudou, cria commit `chore: refresh Packagist download stats`, executa a gate completa e despacha o deploy. Se o fetch falhar, não faz commit nem escreve zeros.

```yaml
on:
  schedule:
    - cron: '17 5 * * *'
  workflow_dispatch:
```

- [ ] **Step 4: Testar sucesso, 503 e dados inválidos**

Run: `node scripts/fetch-packagist-stats.test.mjs && node scripts/fetch-packagist-stats.mjs --check-fresh=24`

Expected: fixtures passam; o snapshot versionado é válido e recente no contexto de release.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-packagist-stats.mjs scripts/fetch-packagist-stats.test.mjs .github/workflows/update-packagist.yml package.json
git commit -m "ci: refresh Packagist stats without runtime requests"
```

---

### Task 3: Release manifest generator from real package test reports

**Files (`martis-docs`):**
- Create: `scripts/generate-release-data.mjs`
- Create: `scripts/generate-release-data.test.mjs`
- Create: `scripts/fixtures/pest-junit.xml`
- Create: `scripts/fixtures/vitest-report.json`
- Modify: `package.json`
- Modify: `.gitignore`

**Files (`martis-package`):**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `generateReleaseManifest({ packageDir, pestReport, vitestReport, version, packageCommit, generatedAt })`.
- Consumes: `composer.json`, `package.json`, JUnit Pest e JSON Vitest do SHA candidato.

- [ ] **Step 1: Escrever teste de manifesto**

```js
const manifest = await generateReleaseManifest({
  packageDir: fixturePackage,
  pestReport: 'scripts/fixtures/pest-junit.xml',
  vitestReport: 'scripts/fixtures/vitest-report.json',
  version: '1.40.0',
  packageCommit: 'a'.repeat(40),
  generatedAt: '2026-09-24T12:00:00.000Z',
})
assert.equal(manifest.totalTests, manifest.pestTests + manifest.vitestTests)
assert.equal(manifest.phpRequirement, '^8.3')
assert.equal(manifest.laravelRequirement, '^12.0|^13.0')
```

- [ ] **Step 2: Confirmar a falha**

Run: `node scripts/generate-release-data.test.mjs`

Expected: FAIL porque o gerador não existe.

- [ ] **Step 3: Implementar relatórios e geração**

No pacote, adicionar comandos CI equivalentes a:

```bash
vendor/bin/pest --log-junit build/reports/pest.xml
npm run test -- --reporter=json --outputFile=build/reports/vitest.json
```

O gerador confirma que `package.json.version === version`, que `packageCommit` resolve no checkout, extrai constraints de `composer.json`, soma suites e recusa relatórios com falhas/skips inesperados. `releaseHeadline` é input explícito limitado a 90 caracteres; não é inferido de commits.

- [ ] **Step 4: Executar fixtures e uma geração local real**

Run no pacote: `vendor/bin/pest --log-junit build/reports/pest.xml && npm run test -- --reporter=json --outputFile=build/reports/vitest.json`

Run nos docs: `node scripts/generate-release-data.test.mjs && pnpm generate:release -- --version=1.39.0 --package-dir=../martis-package --package-sha=$(git -C ../martis-package rev-parse HEAD) --headline="Current stable release"`

Expected: manifesto válido e total igual à soma dos relatórios.

- [ ] **Step 5: Commit em cada repositório**

```bash
# martis-docs
git add scripts/generate-release-data.mjs scripts/generate-release-data.test.mjs scripts/fixtures package.json .gitignore src/data/generated/release.json
git commit -m "ci: generate site release data from package reports"

# martis-package
git add .github/workflows/ci.yml
git commit -m "ci: publish machine-readable test reports"
```

---

### Task 4: Deterministic Playground media

**Files (`martis-playground`):**
- Create: `database/seeders/MarketingDemoSeeder.php`
- Create: `tests/Feature/MarketingDemoSeederTest.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Modify: `Makefile`

**Files (`martis-docs`):**
- Create: `scripts/capture-product-media.mjs`
- Create: `scripts/capture-product-media.test.mjs`
- Create: `scripts/media-scenarios.mjs`
- Create: `src/data/generated/media.json`
- Create: `public/product/.gitkeep`
- Modify: `package.json`

**Interfaces:**
- Produces: `ProductMediaManifest[]`, screenshots AVIF/WebP e posters.
- Consumes: Playground disponível por `PLAYGROUND_BASE_URL`, seed `marketing-demo` e SHA do pacote.

- [ ] **Step 1: Escrever o teste do seed e manifesto**

```php
it('creates deterministic marketing demo records', function () {
    $this->seed(MarketingDemoSeeder::class);
    expect(Client::query()->orderBy('id')->pluck('name')->all())
        ->toBe(['Acme Studio', 'Northstar Health', 'Orbit Retail']);
});
```

```js
assert.deepEqual(validateMediaManifest(validManifest), [])
assert.match(validManifest.checksum, /^[a-f0-9]{64}$/)
```

- [ ] **Step 2: Confirmar ambas as falhas**

Run no Playground: `make command CMD="artisan test --filter=MarketingDemoSeederTest"`

Run nos docs: `node scripts/capture-product-media.test.mjs`

Expected: FAIL porque seed e capturador ainda não existem.

- [ ] **Step 3: Implementar seed e cenários**

O seed é idempotente, usa dados fictícios fixos, força locale `en` e não depende do relógio. `make marketing-demo` limpa a base de demonstração, instala Martis e corre apenas esse seed. Os cenários cobrem dashboard, resource index, filters, create/edit, relationships, actions, permissions e theme. Playwright autentica com credenciais geradas no job e nunca as escreve no manifesto.

Capturar exatamente 1440×900, 1024×768 e 390×844; guardar `<scenario>-<width>x<height>.<format>`, calcular SHA-256 e escrever manifesto ordenado. Clips opcionais têm máximo oito segundos, poster e alternativa estática.

- [ ] **Step 4: Executar captura e verificar estabilidade**

Run:

```bash
cd ../martis-playground && make marketing-demo
cd ../martis-docs && pnpm capture:media
cp src/data/generated/media.json /tmp/media-first.json
pnpm capture:media
diff -u /tmp/media-first.json src/data/generated/media.json
```

Expected: só `capturedAt` pode variar; checksums e ordem mantêm-se. Normalizar `capturedAt` no teste de estabilidade.

- [ ] **Step 5: Commit em cada repositório**

```bash
# martis-playground
git add database/seeders/MarketingDemoSeeder.php database/seeders/DatabaseSeeder.php tests/Feature/MarketingDemoSeederTest.php Makefile
git commit -m "test: add deterministic marketing demo data"

# martis-docs
git add scripts/capture-product-media.mjs scripts/capture-product-media.test.mjs scripts/media-scenarios.mjs src/data/generated/media.json public/product package.json
git commit -m "feat: capture versioned product media from the playground"
```

---

### Task 5: Stage one immutable site artifact before tagging

**Files (`martis-docs`):**
- Create: `scripts/package-release-artifact.mjs`
- Create: `scripts/verify-release-artifact.mjs`
- Create: `scripts/release-artifact.test.mjs`
- Create: `scripts/generate-social-images.mjs`
- Create: `public/social/.gitkeep`
- Create: `.github/workflows/stage-release.yml`
- Modify: `package.json`

**Interfaces:**
- Produces: draft GitHub Release `site-v<version>-<packageSha7>` com `dist.tar.gz`, `dist.tar.gz.sha256` e `release-manifest.json`.
- Consumes: `version`, `package_sha`, `release_headline` e checkouts exatos dos três repositórios.

- [ ] **Step 1: Escrever teste de verificação do tarball**

```js
await createArtifact({ distDir: fixtureDist, outDir, manifest })
await verifyArtifact({ archive: `${outDir}/dist.tar.gz`, checksumFile: `${outDir}/dist.tar.gz.sha256`, expectedVersion: '1.40.0', expectedPackageSha: 'a'.repeat(40) })
await fs.appendFile(`${outDir}/dist.tar.gz`, 'tampered')
await assert.rejects(() => verifyArtifact({ archive: `${outDir}/dist.tar.gz`, checksumFile: `${outDir}/dist.tar.gz.sha256`, expectedVersion: '1.40.0', expectedPackageSha: 'a'.repeat(40) }), /checksum/i)
```

- [ ] **Step 2: Confirmar a falha**

Run: `node scripts/release-artifact.test.mjs`

Expected: FAIL porque os helpers não existem.

- [ ] **Step 3: Implementar staging workflow**

O workflow `workflow_dispatch` recebe versão, SHA e headline; usa um environment protegido `site-release-staging`; faz checkout de `martis-docs@main`, `martis-package@<sha>` e `martis-playground@main`; executa sync docs `--check`, testes package, geração de dados, fetch Packagist, capture media, geração de imagens sociais, validações, build e smoke. `generate-social-images.mjs` abre as rotas `/`, `/product`, `/for-agencies`, `/compare` e `/docs` num viewport 1200×630, injeta o badge da versão e guarda PNGs determinísticos em `public/social/`. Depois cria o tar uma única vez, checksum e manifesto:

```json
{
  "schemaVersion": 1,
  "version": "1.40.0",
  "packageCommit": "40-character-sha",
  "docsCommit": "40-character-sha",
  "archive": "dist.tar.gz",
  "sha256": "64-character-digest"
}
```

Publicar os três ficheiros numa draft release do repo docs. Se a draft já existir, verificar assets; substituir apenas quando todos os inputs e SHAs são idênticos, caso contrário falhar.

- [ ] **Step 4: Executar dry-run local**

Run: `pnpm release:artifact -- --version=1.39.0 --package-sha=$(git -C ../martis-package rev-parse HEAD) --docs-sha=$(git rev-parse HEAD) && pnpm release:verify -- --version=1.39.0 --package-sha=$(git -C ../martis-package rev-parse HEAD)`

Expected: checksum válido, manifesto coerente e tar sem caminhos absolutos.

- [ ] **Step 5: Commit**

```bash
git add scripts/package-release-artifact.mjs scripts/verify-release-artifact.mjs scripts/release-artifact.test.mjs scripts/generate-social-images.mjs public/social .github/workflows/stage-release.yml package.json
git commit -m "ci: stage immutable site artifacts before package tags"
```

---

### Task 6: Gate package tag and publish the exact staged artifact

**Files (`martis-package`):**
- Rewrite: `.github/workflows/release.yml`
- Create: `scripts/verify-site-release.mjs`
- Create: `scripts/verify-site-release.test.mjs`

**Files (`martis-docs`):**
- Create: `.github/workflows/publish-release.yml`
- Create: `scripts/smoke-production.mjs`
- Create: `scripts/smoke-production.test.mjs`
- Replace: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: draft release e assets produzidos pela Task 5.
- Produces: tag/release do pacote e deployment do mesmo `dist.tar.gz`.

- [ ] **Step 1: Escrever testes do gate e smoke**

```js
assert.doesNotThrow(() => verifySiteRelease(manifest, { version: '1.40.0', packageCommit: 'a'.repeat(40) }))
assert.throws(() => verifySiteRelease(manifest, { version: '1.40.1', packageCommit: 'a'.repeat(40) }), /version mismatch/)
assert.throws(() => verifySiteRelease(manifest, { version: '1.40.0', packageCommit: 'b'.repeat(40) }), /commit mismatch/)
```

O teste do smoke usa um servidor fixture e confirma falha para canonical incorreto, asset 404, versão errada, `localhost` no HTML e resposta HTML devolvida para URL de JavaScript.

- [ ] **Step 2: Confirmar as falhas**

Run no pacote: `node scripts/verify-site-release.test.mjs`

Run nos docs: `node scripts/smoke-production.test.mjs`

Expected: FAIL porque os validadores não existem.

- [ ] **Step 3: Reescrever o release do pacote como gate fechado**

O workflow dispatch recebe `version`, `sha` e `site_staging_tag`. Antes de criar a tag:

1. confirma que SHA pertence a `main` e que `package.json.version`/CHANGELOG correspondem;
2. descarrega `release-manifest.json` da draft release de `martis-docs` com `MARTIS_RELEASE_TOKEN`;
3. verifica versão, package SHA, docs SHA e assets/checksum;
4. confirma CI requerida no SHA via GitHub API;
5. cria tag apenas se ainda não existe; se existe, exige que aponte para o mesmo SHA;
6. cria/atualiza GitHub Release com notas do CHANGELOG;
7. despacha `publish-release.yml` no repo docs com staging tag, versão e SHA;
8. aguarda conclusão e falha se o deploy não tiver sucesso.

Definir `permissions: contents: write, actions: read` e serializar por `release-<version>`.

- [ ] **Step 4: Implementar publicação imutável e smoke**

`publish-release.yml` usa environment protegido `production`, descarrega os três assets da draft, volta a verificar checksum/manifesto, extrai para diretório temporário validado e usa `rsync -a --delete` para o root Caddy. Nunca chama `pnpm build`.

`smoke-production.mjs` valida `/`, `/product`, `/for-agencies`, `/compare`, `/compare/nova`, `/compare/filament`, `/docs`, `/docs/getting-started/installation`, `/changelog` e uma rota inexistente; verifica status, title, canonical, versão, SHA no meta `martis:release`, stats, assets, search index, sitemap e robots. Após sucesso, publica a draft release de staging e anota deployment URL/checksum.

Substituir `deploy.yml` por um workflow que só permita deploy diário validado de Packagist ou chamada de `publish-release.yml`; remover deploy direto em qualquer push para `main`.

- [ ] **Step 5: Testar idempotência sem criar uma tag real**

Executar workflows contra versão de ensaio `1.39.0-site-dry-run` com `create_tag=false`. Repetir duas vezes e confirmar: um único staging tag, checksum igual, zero tags package, e nenhum rebuild no publish. Depois executar os testes locais:

```bash
# martis-package
node scripts/verify-site-release.test.mjs

# martis-docs
node scripts/smoke-production.test.mjs
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm validate:content && pnpm build && pnpm smoke:dist
```

Expected: tudo passa e a repetição não cria artefactos divergentes.

- [ ] **Step 6: Commit em cada repositório**

```bash
# martis-package
git add .github/workflows/release.yml scripts/verify-site-release.mjs scripts/verify-site-release.test.mjs
git commit -m "ci: gate package releases on a staged site artifact"

# martis-docs
git add .github/workflows/publish-release.yml .github/workflows/deploy.yml scripts/smoke-production.mjs scripts/smoke-production.test.mjs
git commit -m "ci: publish the validated site artifact after release"
```

---

### Task 7: Production rehearsal and operational documentation

**Files (`martis-docs`):**
- Create: `docs/RELEASE_OPERATIONS.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-24-getmartis-redesign-design.md`

**Files (`martis-package`):**
- Modify: `docs/release-process.md`

**Interfaces:**
- Consumes: workflows concluídos nas Tasks 5 e 6.
- Produces: runbook único para preparação, publicação, retry e rollback.

- [ ] **Step 1: Escrever o runbook com comandos reais**

Documentar inputs, nomes dos environments/secrets, como iniciar staging com `gh workflow run`, como inspecionar o manifesto, como publicar, como repetir a mesma versão/SHA e como recuperar o `dist.tar.gz` anterior. Incluir a regra: rollback muda apenas o deployment; nunca move ou recria uma tag do pacote.

- [ ] **Step 2: Executar uma rehearsal sem tag**

Run:

```bash
gh workflow run stage-release.yml -R Real-Edge-FX/martis-docs -f version=1.39.0 -f package_sha=$(git -C ../martis-package rev-parse HEAD) -f release_headline="Release pipeline rehearsal"
gh run watch -R Real-Edge-FX/martis-docs --exit-status
```

Expected: draft staging release com três assets e checksum válido.

- [ ] **Step 3: Verificar rollback e retry**

Reexecutar staging com os mesmos inputs, confirmar que não há duplicação; executar publish para um target de staging, correr smoke, repor o artefacto anterior e repetir smoke.

- [ ] **Step 4: Executar a checklist de aceitação final**

Confirmar os 12 critérios da spec, com links para runs, checksums e resultados Lighthouse/axe. Não marcar critérios por inferência.

- [ ] **Step 5: Commit documental**

```bash
# martis-docs
git add README.md docs/RELEASE_OPERATIONS.md docs/superpowers/specs/2026-09-24-getmartis-redesign-design.md
git commit -m "docs: document the gated site release process"

# martis-package
git add docs/release-process.md
git commit -m "docs: require the staged site release gate"
```
