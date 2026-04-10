---
title: 'Architectural Decisions'
description: 'Key architectural decisions behind Martis — why it is built the way it is.'
sidebar:
  order: 3
---

This page documents the key architectural decisions that shape the Martis package — why it works the way it does and what trade-offs were made. Understanding these decisions helps you extend the package confidently and predict its behaviour.

---

## ADR-001: React-First Frontend

**Status:** Accepted

**Decision:** The admin panel UI is built with React 18 and TypeScript. Blade templates are not used for the panel UI.

**Rationale:** React provides the strongest ecosystem for building complex, interactive UIs with real-time data. TypeScript gives compile-time safety across the component tree. This choice enables the Override System — since components are React, any component can be swapped out with a custom React implementation, including third-party packages from the broader React ecosystem. Blade-based panels cannot offer this level of extensibility without reverting to template string concatenation.

---

## ADR-002: Resource-Driven Model

**Status:** Accepted

**Decision:** Every entity in the admin panel is described by a `Resource` class. The resource is the single source of truth for fields, actions, filters, policies, and UI configuration.

**Rationale:** A central resource class makes the panel predictable. Adding a new entity requires only one file. All configuration — what fields appear, what is searchable, what actions are available, who can create/edit/delete — lives in one place. This mirrors the way Laravel Nova v5 works, which is the standard that most Laravel developers already know.

---

## ADR-003: Override-First Architecture

**Status:** Accepted

**Decision:** Every UI component in Martis can be replaced with a custom React component without modifying the package source.

**Rationale:** No admin package can anticipate every UI requirement. Rather than providing hundreds of configuration options or requiring users to fork the package, Martis uses a 4-tier component resolution chain: explicit component key → per-resource override → per-type override → built-in default. This means users get sensible defaults for free, but can replace any component at any scope — a single field instance, all fields of a type, or the global default — without touching Martis internals. See [Override System](./overrides) for details.

---

## ADR-004: Contract-First API Design

**Status:** Accepted

**Decision:** Every public method on `Resource` and `Field` is defined in a corresponding PHP contract (`ResourceContract`, `FieldContract`). The backend never renders HTML — all panel communication goes through JSON.

**Rationale:** Contracts enforce extensibility at every layer. Third-party developers can create custom field types or resource implementations as long as they satisfy the contract. PHPStan level 8 validates conformance. JSON-only communication between backend and frontend means the same resource can power different frontends (web, mobile, API clients) without any backend changes.

---

## ADR-005: react-i18next for Internationalization

**Status:** Accepted

**Decision:** All strings in the frontend are translated via react-i18next. There are no hardcoded UI strings. The backend uses standard Laravel PHP language files.

**Supported locales:** EN, PT-BR, PT-PT

**Rationale:** Admin panels are often deployed in multilingual organisations. Supporting multiple locales from day one means users never need to monkey-patch strings. Translations are published to `lang/vendor/martis/` and can be overridden like any other Laravel vendor resource. Frontend translations are served via `GET /martis/api/translations/{locale}` and loaded at startup — no build step required to add or change a locale.

---

## ADR-006: Action Model

**Status:** Accepted

**Decision:** Custom operations on resources are expressed as `Action` classes — not as controller methods, form requests, or route macros. Four action types are provided: standard (bulk), inline (per-row), standalone (no selection), and sole (exactly one record).

**Rationale:** Actions give a consistent UI surface for all custom operations. An action class encapsulates the authorization check, input fields, and handler in one place. The admin UI automatically renders the correct modal, dropdown, and confirmation dialog based on action metadata. This prevents logic from leaking into routes or controllers outside the admin panel scope.

---

## ADR-007: TanStack Query for Server State

**Status:** Accepted

**Decision:** All data fetching, caching, and invalidation in the frontend uses TanStack Query (React Query v5).

**Rationale:** TanStack Query provides automatic cache invalidation after mutations, background refetch, stale-while-revalidate, and optimistic updates — all without custom state management code. After an action runs, the index list is invalidated automatically. This removes an entire category of "data looks stale" bugs that plague custom admin implementations.

---

## ADR-008: Phosphor Icons

**Status:** Accepted

**Decision:** Resource icons are provided by the Phosphor Icons library (MIT licence, 1,512 icons, multiple weights).

**Rationale:** Phosphor provides a consistent visual style with React-native components. Icons are referenced by kebab-case or PascalCase name in the `icon()` method on a resource. The library supports regular, bold, fill, duotone, thin, and light weights, giving visual flexibility without requiring a custom icon pipeline.

---

## ADR-009: Separate Composer Package

**Status:** Accepted

**Decision:** Martis is distributed as a standalone Composer package (`martis/martis`), not as a Laravel starter kit or skeleton application.

**Rationale:** A package install leaves the user's application fully intact. There is no starter kit to maintain, no opinionated directory structure imposed, and no risk of package updates conflicting with application code. Users install one package and get the admin panel. Upgrades are handled by `composer update`.

---

## ADR-010: Artisan-Based Install and Scaffolding

**Status:** Accepted

**Decision:** Installation, resource creation, field scaffolding, component generation, and user creation are all driven by Artisan commands (`martis:install`, `martis:resource`, `martis:field`, `martis:action`, `martis:component`, `martis:user`).

**Rationale:** Artisan commands integrate naturally into Laravel workflows. They are scriptable, repeatable, and easy to document. Users who already know `php artisan make:model` immediately understand `php artisan martis:resource`. Commands also provide guardrails — the install command runs migrations, publishes assets, and creates the config file in the correct order, preventing misconfiguration.
