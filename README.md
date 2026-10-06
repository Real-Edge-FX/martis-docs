# Martis Docs

Official documentation site for the [Martis](https://github.com/Real-Edge-FX/martis-package) Laravel admin engine.

Live at **https://martis-docs.realedgefx.com**.

## Stack

- **Vite 6** + **React 18** + **TypeScript** — single-page app, lazy routes per surface.
- **Tailwind CSS v4** — design tokens defined in `src/styles/globals.css`.
- **MDX** (`@mdx-js/rollup`) — every doc page is an MDX module under `src/content/`.
- **react-router-dom v6** — `/` (landing) and `/docs/*` (docs shell with sidebar/TOC).
- **Cmd+K palette** — static index built from `DOC_NAV` plus a JSON full-text index over the MDX bodies, generated at build time.

No Astro, no SSG, no server runtime. Caddy serves `dist/` as static files; the SPA boots from `index.html` and lazy-loads each doc as its own JS chunk.

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

Outputs to `dist/`. The build runs:

1. `node scripts/build-search-index.mjs` — builds `public/search-index.json` from the MDX bodies.
2. `tsc -b` — type-checks `src/`.
3. `vite build` — produces the static bundle in `dist/`.

`pnpm preview` serves the built site at <http://localhost:4173>.

## Content sync

Most docs are mirrored from `martis-package/docs/*.md` so the site cannot drift from the package source. The mapping is declared explicitly in `scripts/sync-docs.mjs`. `scripts/deploy.sh` runs this against the docs of the release it publishes, so `src/content` is never committed out of sync with the live site and no separate docs PR is needed for a release; use the commands below only for local iteration on a doc page (against the sibling `martis-package` checkout) or to check a work-in-progress package doc before it's tagged:

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
│   │   ├── site/             # site shell (header, nav, footer) of the redesign
│   │   ├── CmdK.tsx          # cmd+K palette
│   │   ├── CodeBlock.tsx     # filename chrome + naive PHP highlighter
│   │   ├── LoadingScreen.tsx
│   │   └── Logo.tsx          # cube SVG with optional wordmark
│   ├── content/              # MDX docs (synced + hand-authored)
│   ├── data/site.ts          # RELEASE (version, test count), product copy
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

Four pages are hand-authored and never synced (`LINK_ONLY` in `scripts/sync-docs.mjs`): `auth/roles`, `getting-started/quick-start`, `getting-started/troubleshooting` and `core/gates`. `scripts/hand-authored-sources.json` holds the sha256 of the package doc each one was last reviewed against, and the sync fails when a source no longer matches. When it stops, read the package diff (`git log -p <old-tag>..<tag> -- docs/<file>`), carry every user-facing change into `src/content/<slug>.mdx`, then run `node scripts/sync-docs.mjs --package-dir <package> --accept-hand-authored` and commit the updated JSON with the page.

`scripts/deploy.sh`:

1. Resolves the release numbers (see below), then fetches `martis-package/docs/` at the matching tag and runs `scripts/sync-docs.mjs` against it, so the deploy always publishes the docs of the release it's shipping. **No separate docs PR is needed**: this replaces the old flow where a docs sync landed on `main` ahead of the deploy.
2. Runs `pnpm build` and verifies that the SPA rewrite file reached `dist/`.
3. Creates `dist/404.html` as an additional SPA fallback.
4. Publishes `dist/` with `rsync --delete` to `domains/getmartis.com/public_html/`.
5. Smoke-tests `/`, `/docs`, `/compare`, `/contact`, and `/search-index.json` on production.

Guarantees, in order: the checkout must be clean and at `origin/main` (`MARTIS_DOCS_DEPLOY_ANY_REF=1` for a deliberate preview); the release numbers the site shows (`RELEASE.version`, `RELEASE.tests`, `RELEASE.downloads`, `RELEASE.monthlyDownloads` in `src/data/site.ts`) are rewritten from their sources by `node scripts/release-stats.mjs --write` (the latest martis-package GitHub release, the README "Test coverage" total at that tag, and Packagist); `src/content` is synced from the martis-package docs at that same tag (fetched from `codeload.github.com`, or `gh api .../tarball/...` if the repo is private); both `src/data/site.ts` and `src/content` are restored to their committed state after the deploy (the EXIT trap also removes the temp tarball dir); a source that does not answer stops the deploy; and after the upload the live chunks must carry that version and test count. `node scripts/release-stats.mjs --check` tells whether the committed values are current (run `--write` and open a PR when they are not).

The deploy prefers the dedicated SSH key and falls back to a password read at runtime or supplied through `MARTIS_DOCS_SSH_PASS`. Credentials are never written by the script. Deep links are handled by `public/.htaccess`.

> The old Caddy deployment at `martis-docs.realedgefx.com` is retired. `.github/workflows/deploy.yml` is kept as dispatch-only historical reference and does not run on pushes.

## Contact form delivery

The static contact form reads its delivery URL from `VITE_CONTACT_ENDPOINT` at build time. Copy `.env.example` to the deployment environment and keep the variable configured there; the React components never contain the recipient address.

The current example uses FormSubmit's JSON endpoint for `lfmoura@gmail.com`. Before production deployment:

1. Deploy to staging with `VITE_CONTACT_ENDPOINT` configured.
2. Submit one authorised test message from `/contact`.
3. Open the activation email received by `lfmoura@gmail.com` and approve that endpoint.
4. Submit a second test and confirm the success state and email delivery.

Automated tests inject a fake transport and never send real messages. If the endpoint is absent or unavailable, the form keeps the entered content visible and presents a retryable error.

## Source of truth

Documentation lives in `martis-package/docs/`. Always edit there and re-run `pnpm sync-docs` here. The CI gate (`pnpm sync-docs --check`) blocks merges that fall out of sync.
