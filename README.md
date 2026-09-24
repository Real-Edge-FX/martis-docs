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

The official production host is **getmartis.com**, on Hostinger shared hosting (Apache/LiteSpeed). The site is static, so deploy = build locally and `rsync` `dist/` into the domain docroot over SSH.

```bash
bash scripts/deploy.sh
```

`scripts/deploy.sh`:

1. `pnpm build` (regenerates `dist/`, including `.htaccess` shipped from `public/`).
2. `cp dist/index.html dist/404.html` as a SPA fallback safety net.
3. `rsync -a --delete dist/` over SSH (host `147.79.113.74`, port `65002`, user `u498269178`) into `domains/getmartis.com/public_html/`.
4. Smoke `curl` against `/`, `/docs`, and `/search-index.json` on `https://getmartis.com`.

Hostinger allows SSH **password** auth only (no keys, no SFTP batch). The script reads the password at the prompt, or from `MARTIS_DOCS_SSH_PASS` for non-interactive runs; it is never written to disk. SPA deep links work via `public/.htaccess`, which rewrites unknown paths to `/index.html`.

> The previous LAN setup (`192.168.50.21` + Caddy + Nginx Proxy Manager + `martis-docs.realedgefx.com`, driven by `.github/workflows/deploy.yml`) is retired. That workflow targets a self-hosted runner that no longer applies.

## Source of truth

Documentation lives in `martis-package/docs/`. Always edit there and re-run `pnpm sync-docs` here. The CI gate (`pnpm sync-docs --check`) blocks merges that fall out of sync.
