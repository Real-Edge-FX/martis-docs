# Martis Docs

Official documentation site for the [Martis](https://github.com/Real-Edge-FX/martis-package) Laravel admin engine.

Live at **https://martis-docs.realedgefx.com**.

## Stack

- **Vite 6** + **React 18** + **TypeScript** — single-page app, lazy routes per surface.
- **Tailwind CSS v4** — design tokens defined in `src/styles/globals.css`.
- **MDX** (`@mdx-js/rollup`) — every doc page is an MDX module under `src/content/`.
- **react-router-dom v6** — `/` (landing) and `/docs/*` (docs shell with sidebar/TOC).
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

`pnpm test:prerender` (`node scripts/prerender.test.mjs`) is a fast smoke test over the files a `pnpm build` just produced: every expected file exists, and a sample page carries real content and its canonical tag.

`pnpm preview` serves the built site at <http://localhost:4173>, but it falls back to the root `index.html` for any unmatched path (Vite's SPA default) — visiting a deep route without a trailing slash (`/docs`, not `/docs/`) serves the wrong prerendered page there and can show hydration warnings that do not reflect a real bug. Apache does not have this quirk (it resolves a directory request to its `index.html`, per `public/.htaccess`). To verify a specific route's own prerendered HTML locally, request it with a trailing slash, or serve `dist/` with a plain static file server instead.

## Content sync

Most docs are mirrored from `martis-package/docs/*.md` so the site cannot drift from the package source. The mapping is declared explicitly in `scripts/sync-docs.mjs`:

```bash
pnpm sync-docs           # copies + transforms package docs into src/content/
pnpm sync-docs --check   # exits non-zero if any synced page is stale (CI gate)
```

Each `.md` is rewritten into `.mdx` with:

- a frontmatter block (title, description, sourcePath),
- relative `[link](other.md)` rewritten to `/docs/<slug>`,
- self-closing void HTML (`<br>`, `<hr>`, `<img>`, ...) so MDX is happy,
- escaped `{` outside fenced code blocks (avoid spurious JSX expressions).

A few pages (`getting-started/quick-start.mdx`, `getting-started/troubleshooting.mdx`, `reference/api.mdx`) are hand-authored: they live only in this repo because the package source has no equivalent.

## Project layout

```
martis-docs/
├── public/
│   ├── icon.svg
│   └── search-index.json     # generated, gitignored
├── scripts/
│   ├── sync-docs.mjs         # martis-package/docs -> src/content
│   └── build-search-index.mjs
├── src/
│   ├── components/
│   │   ├── docs/             # sidebar, TOC, breadcrumbs, pagination
│   │   ├── icons/            # 22 stroke icons
│   │   ├── landing/          # hero, features, code panel, footer, top bar
│   │   ├── CmdK.tsx          # cmd+K palette
│   │   ├── CodeBlock.tsx     # filename chrome + naive PHP highlighter
│   │   ├── LoadingScreen.tsx
│   │   └── Logo.tsx          # cube SVG with optional wordmark
│   ├── content/              # MDX docs (synced + hand-authored)
│   ├── data/landing.ts       # marketing copy, stats, code samples, version
│   ├── lib/
│   │   ├── docs-tree.ts      # /docs nav + prev/next helpers
│   │   ├── mdx-loader.ts     # glob import of src/content/**/*.mdx
│   │   ├── search.ts         # static + full-text index
│   │   └── cmdk-context.tsx
│   ├── pages/                # Landing, Docs, NotFound
│   ├── styles/               # globals.css, prose.css
│   └── types/mdx.d.ts
├── index.html
├── vite.config.ts
└── tsconfig.json
```

## Deployment

The official production host is **getmartis.com**, on Hostinger shared hosting (Apache/LiteSpeed). The site is fully prerendered (see Build above): there is no server-side render step and no SPA fallback, so deploy = build locally and `rsync` `dist/` into the domain docroot over SSH.

```bash
bash scripts/deploy.sh
```

`scripts/deploy.sh`:

1. `pnpm build` (regenerates `dist/`: prerendered HTML per route, `sitemap.xml`, `robots.txt`, and `.htaccess` copied from `public/`).
2. Asserts `dist/.htaccess` and `dist/404.html` both exist. `dist/404.html` is written by `scripts/prerender.mjs`, not copied here anymore — copying `index.html` over it (the old SPA-fallback safety net) would ship the wrong `<title>`, canonical and `noindex` for every 404.
3. `rsync -a --delete dist/` over SSH (host `147.79.113.74`, port `65002`, user `u498269178`) into `domains/getmartis.com/public_html/`.
4. Smoke `curl` against `https://getmartis.com`: `/`, `/docs`, `/docs/getting-started/installation`, `/product` and `/search-index.json` (expect HTTP 200), plus a made-up path (expects HTTP 404).

Hostinger allows SSH **password** auth only (no keys, no SFTP batch). The script reads the password at the prompt, or from `MARTIS_DOCS_SSH_PASS` for non-interactive runs; it is never written to disk.

### `.htaccess`

`public/.htaccess` (copied into `dist/` by Vite) maps every canonical, slash-less route straight to its prerendered file — no SPA fallback:

- `Options -Indexes -MultiViews` and `DirectoryIndex index.html`: serve each route directory's `index.html`; no directory listings, no content-negotiation guessing.
- `DirectorySlash Off`: a request for `/product` (no trailing slash — the canonical form) is served directly instead of Apache 301-redirecting it to add the slash first. Safe here because every asset and internal link in this build is an absolute path (`/assets/…`, `/docs/…`), never relative — the one documented caveat of turning this off.
- A `mod_rewrite` rule 301s a trailing-slash request for a real route (`/product/`) down to its slash-less canonical form (`/product`); `/` itself is excluded (it has no slash-less form).
- Another `mod_rewrite` rule internally rewrites a route's clean URL (`/product`) to its prerendered file (`product/index.html`) when that file exists, without changing what the browser shows.
- `ErrorDocument 404 /404.html` returns a real HTTP 404 with the prerendered not-found page's own markup for anything that does not match a route, including the literal `/404` URL (there is no `dist/404/` directory to match).

Not validated against a real Apache instance yet (none available while writing it) — validate on the real Hostinger/LiteSpeed host before relying on it in production.

### CI gate

`.github/workflows/ci.yml` runs on every pull request and on pushes to `main`/`release/**` (Node 22): `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:prerender`, then `pnpm smoke:dist` — `scripts/smoke-dist.mjs`, which checks that `dist/` is complete and correct (every route has its own title/description/canonical/Open Graph tags and real content, referenced `/assets/` files exist, `search-index.json`/`sitemap.xml`/`robots.txt`/`.htaccess` are consistent with the route registry, and nothing leaks a local hostname or a machine path) before anything can merge. Runnable locally the same way: `pnpm smoke:dist`.

> The previous LAN setup (`192.168.50.21` + Caddy + Nginx Proxy Manager + `martis-docs.realedgefx.com`, driven by `.github/workflows/deploy.yml`) is retired. That workflow targets a self-hosted runner that no longer applies.

## Source of truth

Documentation lives in `martis-package/docs/`. Always edit there and re-run `pnpm sync-docs` here. The CI gate (`pnpm sync-docs --check`) blocks merges that fall out of sync.
