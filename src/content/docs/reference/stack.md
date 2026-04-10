---
title: 'Technology Stack'
description: 'The technologies that power Martis — backend, frontend, and tooling.'
sidebar:
  order: 2
---

Martis is built on a carefully chosen stack that prioritizes developer experience, performance, and extensibility.

## Backend

| Component | Version | Notes |
|-----------|---------|-------|
| PHP | 8.2+ | Minimum requirement |
| Laravel | 11, 12 | Supported versions |
| Composer | 2.x | PHP dependency management |

Martis is distributed as a **Composer package** and requires no additional infrastructure. It integrates directly into your existing Laravel application.

## Frontend

| Component | Version | Notes |
|-----------|---------|-------|
| React | 18 | UI framework — rendered server-side bootstrapped |
| TypeScript | 5.x | Strict mode throughout |
| Vite | 6 | Build tool; assets pre-compiled and published |
| React Router | 6 | Client-side routing with code splitting |
| TanStack Query | — | Server state management and caching |
| PrimeReact | — | UI component library (DataTable, Dropdown, etc.) |
| react-i18next | — | Internationalization (EN, PT-BR, PT-PT out of the box) |
| Phosphor Icons | — | Icon library (1,512+ icons) |
| Tailwind CSS | — | Utility-first CSS with dark mode support |

Frontend assets are **pre-compiled** and shipped with the package. You do not need Node.js or a build step in your application to use Martis.

## Admin Panel

The admin panel is a **React SPA** served from `/martis` (configurable). It communicates with your Laravel application via a dedicated REST API automatically registered by the package.

- Routes are registered under `/api/martis/` by default
- Auth is delegated to your application's configured guard
- All resources are auto-discovered from `app/Martis/`

## Testing (Package Development)

If you are contributing to Martis itself:

| Tool | Purpose |
|------|---------|
| Pest PHP | PHP unit and feature tests |
| Vitest | TypeScript unit tests |
| Playwright | End-to-end browser tests |
| PHPStan | Static analysis (level 8) |
| Laravel Pint | PHP code formatter |
| ESLint | TypeScript linter |

## API Documentation

Martis uses [Scramble](https://scramble.dedoc.co/) for automatic API documentation. When installed in development mode, the OpenAPI spec is available at `/docs/api`.

## Architecture Decisions

See [Architectural Decisions](decisions) for the rationale behind major design choices.
