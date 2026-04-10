---
title: Introduction
description: What is Martis, why it exists, and how it fits into the Laravel ecosystem.
sidebar:
  order: 0
---

Martis is a full-featured **admin engine for Laravel** — not a dashboard generator, not a boilerplate, not a wrapper. It is a structured, opinionated framework for building production-quality admin panels with a clear architectural contract between backend and frontend.

## What Martis Is

At its core, Martis gives you:

- A **Resource** abstraction that maps to Eloquent models
- A rich set of **Field types** that define what data looks like in each context
- A **React frontend** driven entirely by the backend schema
- An **override system** that lets you replace any component without forking
- A **Composer package** you install and maintain like any other Laravel dependency

## The Core Philosophy

### Backend as Source of Truth

The backend defines what fields exist, which fields appear in which contexts, what validation rules apply, and what the user is authorized to see. The React frontend fetches the schema and renders it — it does not make decisions about visibility or authorization.

### React-First Frontend

Every UI element in Martis is a React component. There are no Blade views on the frontend. This means the UI is consistent, composable, and replaceable. You can swap out individual field renderers, entire page layouts, or override specific resource views — all without touching the package source.

### Override-First Architecture

Every default in Martis is replaceable. The four-tier resolution system (Project → Override → Custom → Default) ensures you can customize any part of the UI while staying on the upgrade path.

### Composer Package

Martis is distributed as a Composer package. You install it, publish its assets, configure it via `config/martis.php`, and update it with `composer update` like any other dependency. There is no "eject" step.

## What Martis Is Not

- **Not a Nova clone** — It targets functional parity in several areas, but the architecture and DX are different by design.
- **Not a code generator** — Resources are live PHP classes that Martis reads at runtime, not generated files you copy and forget.
- **Not a standalone app** — It runs inside your existing Laravel application, using your models, policies, and database.
- **Not a frontend framework** — It ships React components, but you can replace any of them.

## Requirements

| Dependency | Version |
|------------|---------|
| PHP | 8.2+ |
| Laravel | 11+ or 12+ |
| Node.js | 20+ |
| pnpm | 8+ |

## Next Steps

→ [Installation Guide](/getting-started/installation/)
→ [Quick Start](/getting-started/quickstart/)
