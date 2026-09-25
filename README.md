# Martis Docs

Official documentation site for the [Martis](https://github.com/Real-Edge-FX/martis-package) Laravel admin foundation.

Live at **https://getmartis.com**.

## Stack

- **Vite 6** + **React 18** + **TypeScript** — single-page app, lazy routes per surface.
- **Tailwind CSS v4** — the site design system's tokens (fonts, palette, semantic and motion tokens) live in `src/styles/tokens.css` and `src/styles/motion.css`; `src/styles/globals.css` imports them and keeps the legacy docs-surface palette.
- **MDX** (`@mdx-js/rollup`) — every doc page is an MDX module under `src/content/`.
- **react-router-dom v6** — the marketing pages `/` (home), `/product` and `/for-agencies`, the comparison pages `/compare`, `/compare/nova` and `/compare/filament`, `/changelog`, and `/docs/*` (docs shell with sidebar/TOC). The route registry is `src/lib/site-routes.ts`.
- **Cmd+K palette** — static index built from `DOC_NAV` plus a JSON full-text index over the MDX bodies, generated at build time.

No Astro, no server runtime at request time. `pnpm build` prerenders every public route to static HTML (see Build below), so each page ships real markup, `<title>`, description, canonical and Open Graph tags without running JavaScript first. Apache/LiteSpeed serves `dist/` as static files; every page then hydrates the same SPA shell and lazy-loads its own JS chunk.

## Development

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The dev script first regenerates `public/search-index.json` so the Cmd+K palette has fresh data.

## Build

```bash
pnpm build
```

Outputs to `dist/`. The build chains four steps:

1. `pnpm build-search` (`node scripts/build-search-index.mjs`) — builds `public/search-index.json` from the MDX bodies.
2. `pnpm build:client` (`vite build`) — produces the client bundle and `dist/index.html`, the template every prerendered page starts from.
3. `pnpm build:ssr` (`vite build --config vite.ssr.config.ts`) — compiles `src/entry-server.tsx` to `dist-ssr/entry-server.js`, a Node-executable module exporting `render(url)` plus `PUBLIC_ROUTES`, `getRouteMeta` and `SITE_URL`.
4. `pnpm prerender` (`node scripts/prerender.mjs`) — calls `render()` for every route in `PUBLIC_ROUTES` and writes each as static HTML: `dist/index.html`, `dist/<route>/index.html` per route, `dist/404.html` for the not-found page, plus `dist/sitemap.xml` (indexable routes only) and `dist/robots.txt`.

Type-checking is a separate gate, not part of `build`: run `pnpm typecheck` (`tsc -b`) yourself, or let CI run it.

`pnpm test:prerender` runs the Node test scripts under `scripts/`: the unit tests for `prerender.mjs`, `smoke-dist.mjs`, `sync-docs.mjs`, `build-search-index.mjs` and `serve-dist.mjs`, the static checks over `deploy.sh` (`deploy-script.test.mjs`) and `lighthouserc.cjs` (`lighthouserc.test.mjs`), and `prerender.test.mjs`, which checks the files a `pnpm build` just produced (every expected file exists, a sample page carries real content and its canonical tag, and `dist-ssr/` holds no `public/` files). Run it after `pnpm build`.

`pnpm preview` serves the built site at <http://localhost:4173>, but it falls back to the root `index.html` for any unmatched path (Vite's SPA default) — visiting a deep route without a trailing slash (`/docs`, not `/docs/`) serves the wrong prerendered page there and can show hydration warnings that do not reflect a real bug. Apache does not have this quirk (it resolves a directory request to its `index.html`, per `public/.htaccess`). To verify a specific route's own prerendered HTML locally, request it with a trailing slash, or serve `dist/` with a plain static file server instead.

## Content sync

Most docs are mirrored from `martis-package/docs/*.md` so the site cannot drift from the package source. The mapping is declared explicitly in `scripts/sync-docs.mjs`:

```bash
pnpm sync-docs                                # copies + transforms package docs into src/content/
pnpm sync-docs --check                        # exits non-zero if any synced page is stale
pnpm sync-docs --package-dir <path>           # read the package from somewhere other than ../martis-package
MARTIS_PACKAGE_DIR=<path> pnpm sync-docs      # same, via environment variable
```

`--package-dir` (and `MARTIS_PACKAGE_DIR`) name the **martis-package repository root**, resolved against the current working directory, defaulting to the sibling checkout (`../martis-package`). This is what makes it possible to sync from a specific tag instead of the live checkout, which may carry unreleased work:

```bash
git -C ../martis-package archive <tag> docs | tar -x -C <path>
pnpm sync-docs --check --package-dir <path>   # <path>/docs is what archive produced
```

Run `--check` locally before opening a PR. It is not part of `.github/workflows/ci.yml` — that workflow only checks out this repo, and the check needs the sibling `martis-package` repo alongside it.

Each `.md` is rewritten into `.mdx` with:

- a frontmatter block (title, description, sourcePath),
- relative `[link](other.md)` (also `../other.md` from a page in a subfolder) rewritten to `/docs/<slug>`,
- any other relative link target that still resolves inside the package repository — a source file, or a `docs/*.md` page deliberately left out of the sync (dev-only docs) — rewritten to `https://github.com/Real-Edge-FX/martis-package/blob/main/<path>` (`tree/main/<path>` for a directory target) instead, since a relative link to a package file works on GitHub but 404s once mirrored onto this site. `#anchors`, including line anchors like `#L10`, are kept. A target that would escape the package repository root entirely fails the sync loudly (file and line) rather than silently shipping a broken link.
- self-closing void HTML (`<br>`, `<hr>`, `<img>`, ...) so MDX is happy,
- escaped `{` outside fenced code blocks (avoid spurious JSX expressions).

`--check` also guards against a relative link/image target or a relative `href`/`src` in inline HTML anywhere under `src/content/` — synced pages and hand-authored ones alike, since a hand-authored `.mdx` is never fed through the rewriting above and can carry a raw relative link of its own. It also rejects any URL scheme other than `http:`, `https:` and `mailto:` (`javascript:`, `data:`, `file:`, ...). Any survivor is reported as `file:line` and fails the check.

A few pages (`getting-started/quick-start.mdx`, `getting-started/troubleshooting.mdx`, `auth/roles.mdx`, `core/gates.mdx`) are hand-authored: they live only in this repo because the package source has no equivalent, or because the site intentionally diverges from it.

## Project layout

```
martis-docs/
├── public/
│   ├── brand/                # logo, icon, Open Graph cover, backdrops
│   ├── fonts/                # self-hosted Geist, Geist Mono, Instrument Serif (OFL)
│   ├── screenshots/          # product screenshots (captured at PRODUCT_MEDIA_VERSION)
│   └── search-index.json     # generated, gitignored
├── scripts/
│   ├── sync-docs.mjs         # martis-package/docs -> src/content
│   ├── build-search-index.mjs
│   ├── prerender.mjs         # static HTML per route, sitemap, robots
│   ├── serve-dist.mjs        # production-faithful static server for E2E/Lighthouse
│   └── smoke-dist.mjs        # artifact gate over dist/
├── src/
│   ├── components/
│   │   ├── site/             # site shell: header, mobile menu, footer, install command, document meta
│   │   ├── marketing/        # product chapters, chapter nav, media, proof strip, agency cycle, adoption checklist
│   │   ├── landing/          # homepage sections (hero, chapters, showcase, proof, CTA) + legacy docs top bar/footer
│   │   ├── docs/             # sidebar, TOC, breadcrumbs, pagination
│   │   ├── icons/            # stroke icons
│   │   ├── CmdK.tsx          # cmd+K palette
│   │   ├── CodeBlock.tsx     # filename chrome + naive PHP highlighter
│   │   ├── LoadingScreen.tsx
│   │   └── Logo.tsx          # cube SVG with optional wordmark
│   ├── content/              # MDX docs (synced + hand-authored)
│   ├── data/
│   │   ├── landing.ts        # shared marketing copy: INSTALL_COMMAND, legacy top-bar links
│   │   ├── product.ts        # the six product chapters, their code samples and screenshots
│   │   └── generated/        # validated release + Packagist snapshots (every number on the site)
│   ├── lib/
│   │   ├── site-routes.ts    # public route registry + per-route metadata
│   │   ├── generated-data.ts # snapshot parsers + formatters
│   │   ├── docs-tree.ts      # /docs nav + prev/next helpers
│   │   ├── mdx-loader.ts     # glob import of src/content/**/*.mdx
│   │   ├── search.ts         # static + full-text index
│   │   └── cmdk-context.tsx
│   ├── pages/                # Landing, Product, ForAgencies, Docs, NotFound, ProvisionalPage
│   ├── styles/               # tokens.css, motion.css, site.css, marketing.css, home.css, globals.css, prose.css
│   └── types/
├── tests/e2e/                # Playwright: marketing.spec.ts (E2E + axe), visual.spec.ts (pixel baselines)
├── index.html
├── lighthouserc.cjs          # Lighthouse CI budgets
├── playwright.config.ts
├── vite.config.ts
└── tsconfig.json
```

## Deployment

The official production host is **getmartis.com**, on Hostinger shared hosting (Apache/LiteSpeed). The site is fully prerendered (see Build above): there is no server-side render step and no SPA fallback, so deploy = build locally and `rsync` `dist/` into the domain docroot over SSH.

```bash
bash scripts/deploy.sh
```

`scripts/deploy.sh`:

1. Refuses to run when `git status --porcelain` is not empty, so only committed code is published.
2. `pnpm build` (regenerates `dist/`: prerendered HTML per route, `sitemap.xml`, `robots.txt`, and both `.htaccess` files copied from `public/`), then `pnpm smoke:dist`, the same artifact gate CI runs.
3. Asserts `dist/.htaccess` and `dist/404.html` both exist. `dist/404.html` is written by `scripts/prerender.mjs`, not copied here anymore — copying `index.html` over it (the old SPA-fallback safety net) would ship the wrong `<title>`, canonical and `noindex` for every 404.
4. `rsync -a --delete dist/` over SSH (host `147.79.113.74`, port `65002`, user `u498269178`) into `domains/getmartis.com/public_html/`.
5. Smoke `curl` against `https://getmartis.com`: `/`, `/docs`, `/docs/getting-started/installation`, `/product` and `/search-index.json` (expect HTTP 200), a made-up path and `/docs/core` (expect HTTP 404), and `/product/` and `/docs/index.html` (expect HTTP 301).

Hostinger allows SSH **password** auth only (no keys, no SFTP batch). The script reads the password at the prompt, or from `MARTIS_DOCS_SSH_PASS` for non-interactive runs; it is never written to disk.

### `.htaccess`

`public/.htaccess` (copied into `dist/` by Vite) maps every canonical, slash-less route straight to its prerendered file — no SPA fallback:

- `Options -Indexes -MultiViews` and `DirectoryIndex index.html`: serve each route directory's `index.html`; no directory listings, no content-negotiation guessing.
- `DirectorySlash Off`: a request for `/product` (no trailing slash — the canonical form) is served directly instead of Apache 301-redirecting it to add the slash first. Safe here because every asset and internal link in this build is an absolute path (`/assets/…`, `/docs/…`), never relative — the one documented caveat of turning this off.
- `/index.html` and `/<route>/index.html` 301 to the clean URL (`/`, `/<route>`), matched on `%{THE_REQUEST}` so the internal rewrite below never triggers it.
- A directory with no `index.html` of its own (`/docs/core`, `/assets`) answers the branded 404 instead of a 403.
- A `mod_rewrite` rule 301s a trailing-slash request for a real route (`/product/`) down to its slash-less canonical form (`/product`); `/` itself is excluded (it has no slash-less form).
- Another `mod_rewrite` rule internally rewrites a route's clean URL (`/product`) to its prerendered file (`product/index.html`) when that file exists, without changing what the browser shows.
- `ErrorDocument 404 /404.html` returns a real HTTP 404 with the prerendered not-found page's own markup for anything that does not match a route, including the literal `/404` URL (there is no `dist/404/` directory to match).
- Caching: HTML and `search-index.json` are `no-cache`; other static files keep their name across releases (`/brand`, `/screenshots`) and get `max-age=3600`. Only Vite's fingerprinted files get `max-age=31536000, immutable`, from `public/assets/.htaccess` (copied to `dist/assets/.htaccess`).

`pnpm smoke:dist` checks both files: the 404 handler, `DirectorySlash Off` and the slash-less rewrite are present, no SPA fallback survives (`FallbackResource`, or a `RewriteRule` of any pattern targeting `/index.html`), and the year-long immutable cache applies only under `/assets/`.

Validated against a local Apache 2.4 with `mod_rewrite`, `mod_dir` and `mod_headers`, not against LiteSpeed: check it on the real Hostinger host too (`scripts/deploy.sh` probes a few of these URLs after every deploy).

### CI gate

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`/`release/**` (Node 22), as two jobs:

1. **`build-and-test`**: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:prerender`, then `pnpm smoke:dist` — `scripts/smoke-dist.mjs`, which checks that `dist/` is complete and correct (every route has its own title/description/canonical/Open Graph tags and real content, referenced `/assets/` files exist, `search-index.json`/`sitemap.xml`/`robots.txt`/`.htaccess` are consistent with the route registry, and nothing leaks a local hostname or a machine path) before anything can merge. Runnable locally the same way: `pnpm smoke:dist`.
2. **`browser-checks`** (depends on `build-and-test`): installs Chromium (`pnpm exec playwright install --with-deps chromium`), rebuilds `dist/`, then runs `pnpm test:e2e` (Playwright + axe, see below) and `pnpm test:performance` (Lighthouse CI budgets, see below) against it. On failure it uploads the Playwright HTML report and the raw Lighthouse CI results as build artifacts.

> The previous LAN setup (`192.168.50.21` + Caddy + Nginx Proxy Manager + `martis-docs.realedgefx.com`, driven by `.github/workflows/deploy.yml`) is retired. That workflow targets a self-hosted runner that no longer applies.

### Browser gates (E2E, visual, performance)

Three Playwright-driven suites cover the three redesigned marketing pages (`/`, `/product`, `/for-agencies`), all served through `scripts/serve-dist.mjs` against a real `pnpm build` output (not `vite preview`; see that script's and `playwright.config.ts`'s own comments for why: preview's SPA fallback would hide a slash-less route resolving to its own prerendered file).

- **`pnpm test:e2e`** (`tests/e2e/marketing.spec.ts`, the `chromium` Playwright project): at the four validation breakpoints (375, 768, 1024, 1440 px) checks no horizontal overflow, the primary CTA is visible, zero critical/serious axe violations, no console errors, and that the mobile navigation menu opens, exposes every primary link and closes on Escape with focus back on its toggle (and, with JavaScript disabled, still opens natively and exposes its links). It also walks `/` and `/product` backwards with Shift+Tab at 375 and 1440 px and asserts no focused element sits under the sticky header or ChapterNav (WCAG 2.2 2.4.11), and measures every install command against the viewport at 320 and 375 px (WCAG 1.4.10; the page's `overflow-x: clip` would otherwise hide an overflowing row from the page-level check). This is the suite CI runs.
- **`pnpm test:visual`** (`tests/e2e/visual.spec.ts`, the `visual` Playwright project): one full-page pixel snapshot per route per validation breakpoint (12 total), with reduced motion and `animations: 'disabled'`, `maxDiffPixelRatio: 0.005`. Before each capture, every `<img>`'s `loading` attribute is stripped and awaited via `decode()`, and `document.fonts.ready` is awaited, so a screenshot never captures a still-loading lazy image or an unswapped fallback font. Every region that renders generated data is masked, because it changes on a data refresh or a Martis release independently of any real visual change: the home page's proof strip (`.proof-strip`, live Packagist download counts and a fetch timestamp) and engineering section (`.home-engineering`, the release's version and test counts), and the footer's version line (`.site-footer__meta`, every page). A release that changes only the version and test counts therefore needs no new baselines; a copy change, or a change to the PHP or Laravel requirement the /product Ship chapter reads from the manifest, does. **Local-only, not run in CI**: Playwright's screenshots are platform-specific (font rendering and anti-aliasing differ per OS), so a baseline captured on macOS never byte-matches a Linux CI runner. Baselines live in `tests/e2e/visual.spec.ts-snapshots/`; regenerate an approved change with `pnpm exec playwright test tests/e2e/visual.spec.ts --project=visual --update-snapshots` and review every changed image against the approved mockups before committing.
- **`pnpm test:performance`** (`lighthouserc.cjs`, Lighthouse CI): budgets `largest-contentful-paint` ≤ 2500 ms, `cumulative-layout-shift` ≤ 0.1, `categories:accessibility` ≥ 0.95 and `categories:seo` ≥ 0.95, for `/`, `/product` and `/for-agencies`, 5 runs per URL. Every assertion sets `aggregationMethod: 'median-run'`, so it is checked against the median run; LHCI's default (`optimistic`) would check the most favorable run instead, letting one fast run out of five pass a page whose typical load misses the budget. There is no time-to-interactive assertion: the spec's budgets are LCP, CLS and INP. Uses `settings.throttlingMethod: 'devtools'` (mobile profile: 150 ms RTT, 1.6 Mbps, 4x CPU, replayed through real Chrome DevTools Protocol throttling), not Lighthouse's `simulate` default: against a loopback static server, `simulate` estimates a throttled timeline from every request the page *started* before the observed paint, which on this site counts the JS entry, every route chunk and every font as if they contended for bandwidth on the LCP critical path even though none of them gate it (the LCP element is the prerendered lede paragraph already in the static HTML — `Load Delay`/`Load Time` are 0, the observed LCP *is* FCP). That inflated `/` and `/product` to 3.4-4.1 s under `simulate` on an otherwise-fast page; `devtools` measures the real, throttled timeline instead (~1.6 s on every route). See `lighthouserc.cjs`'s own comment for the full explanation. Uses `startServerCommand`/`scripts/serve-dist.mjs` rather than Lighthouse CI's built-in `staticDistDir`, for the same routing-fidelity reason `test:e2e` does.

  INP (Interaction to Next Paint) is a field metric — real users' interaction latency — and cannot be measured by a lab tool like Lighthouse, so it is out of scope for `lighthouserc.cjs`. It is measured in production only by Real User Monitoring (RUM), once an analytics provider is authorized; the 200 ms threshold is then configured on that provider, without introducing cookies by default.

## Source of truth

Documentation lives in `martis-package/docs/`. Always edit there and re-run `pnpm sync-docs` here. Run `pnpm sync-docs --check` locally before opening a PR to confirm nothing has drifted — CI cannot run it (it needs the sibling `martis-package` checkout), so this is a manual gate, not an automated one.
