# Martis Docs

Official documentation site for the Martis Laravel Admin Engine.

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

The static site is output to `dist/`.

## Documentation Sync

Documentation content is synced from the main Martis package repository (`packages/martis/docs/`).

**To sync documentation after changes in the package:**

```bash
./scripts/sync-docs.sh
```

**To check for drift (used in CI):**

```bash
./scripts/sync-docs.sh --check
```

## Deployment

The site runs on the server at `192.168.50.21:3000`, served by Caddy from the `dist/` directory.

After building, the static files are served directly — no Node.js runtime required in production.

### Deploy steps

1. Run `make sync-docs` to pull latest docs from the package
2. Run `make build` to build the site
3. Caddy serves `dist/` automatically — no restart needed

## Content Structure

```
src/content/docs/
├── index.mdx                    # Landing page (splash)
├── getting-started/
│   ├── introduction.md          # Manually maintained
│   ├── installation.md          # Synced from package
│   ├── quickstart.md            # Synced from package
│   └── troubleshooting.md       # Synced from package
├── core/
│   ├── resources.md             # Synced from package
│   ├── fields.md                # Synced from package
│   ├── relationships.md         # Synced from package
│   ├── actions.md               # Synced from package
│   ├── overrides.md             # Synced from package
│   ├── authentication.md        # Synced from package
│   ├── configuration.md         # Synced from package
│   └── components.md            # Synced from package
└── reference/
    ├── api.md                   # Synced from package
    ├── stack.md                 # Synced from package
    ├── decisions.md             # Synced from package
    └── parity-map.md            # Synced from package
```

Files marked "Synced from package" are overwritten by `scripts/sync-docs.sh`.  
**Do not edit synced files directly** — edit the source in `packages/martis/docs/` instead.

## Doc Sync Policy

This project reflects the official Martis documentation. The sync mechanism ensures public docs never drift from the package source. CI blocks builds when drift is detected.

**Source of truth:** `packages/martis/docs/` in the main Martis repository.
