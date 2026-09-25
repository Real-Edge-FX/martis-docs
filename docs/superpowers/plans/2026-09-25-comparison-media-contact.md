# Comparison, Media and Contact Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the Martis comparison experience, fix route scroll restoration, add an accessible product-image lightbox and provide a working contact form.

**Architecture:** Typed comparison data remains the single source for overview and detail pages. Cross-cutting navigation and lightbox behaviour live in focused reusable components. The static contact page submits through a configurable build-time endpoint with explicit validation and no runtime storage.

**Tech Stack:** React 18, React Router 6, TypeScript, Vitest, Testing Library, Vite, CSS.

## Global Constraints

- Remove all links to Laravel Nova and Filament websites.
- Preserve honest, dated comparison copy without winner scores.
- Normal route navigation starts at the top; valid hash navigation remains intact.
- Lightbox supports keyboard, focus restoration and mobile layouts.
- Contact messages are delivered to `lfmoura@gmail.com`; automated tests never send real messages.
- Use English for code, tests, comments and repository documentation.

---

### Task 1: Route scroll restoration

**Files:**
- Create: `src/components/site/ScrollManager.tsx`
- Create: `src/components/site/ScrollManager.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `ScrollManager(): null`, mounted once inside the router context.

- [ ] Write a failing test that renders at `/compare/filament`, changes pathname without a hash and expects `window.scrollTo({ top: 0, left: 0, behavior: 'auto' })`.
- [ ] Add a hash case that expects no forced top scroll.
- [ ] Run `pnpm test -- src/components/site/ScrollManager.test.tsx` and confirm failure because the component does not exist.
- [ ] Implement `ScrollManager` with `useLocation()` and a pathname/hash effect.
- [ ] Mount it beside `DocumentMeta` in `App`.
- [ ] Re-run the focused test and commit with `fix: restore the top of routed pages`.

### Task 2: Rich comparison data and pages

**Files:**
- Create: `src/data/comparison.ts`
- Create: `src/data/comparison.test.ts`
- Modify: `src/data/site.ts`
- Modify: `src/pages/Compare.tsx`
- Modify: `src/pages/CompareProduct.tsx`
- Modify: `src/pages/MarketingPages.test.tsx`
- Modify: `src/styles/globals.css`

**Interfaces:**
- Produces: `COMPARISON_CRITERIA: ComparisonCriterion[]` and `COMPARISON_PRODUCTS: Record<ComparedProduct, ComparisonProduct>`.
- `ComparisonCriterion` contains `id`, `category`, `label`, `implication`, and values for `martis`, `nova`, and `filament`.

- [ ] Add tests requiring at least ten complete criteria and asserting that comparison routes contain no anchors whose host is Nova or Filament.
- [ ] Run focused tests and confirm they fail on the current four-row matrix and external links.
- [ ] Create the typed dataset with licence, cost, frontend, execution model, Laravel boundary, customisation, extensibility, auth, ecosystem, agency reuse, learning profile and best-fit criteria.
- [ ] Rebuild `/compare` with a sticky desktop matrix, explanatory implications and responsive criterion cards.
- [ ] Rebuild detail pages with decision snapshot, thematic side-by-side analysis, agency implications, choose-when panels and FAQ.
- [ ] Replace external source links with an internal `/contact?topic=correction` link and a reviewed date.
- [ ] Add responsive styles and re-run focused tests.
- [ ] Commit with `feat: deepen product comparisons`.

### Task 3: Accessible image lightbox

**Files:**
- Create: `src/components/media/ImageLightbox.tsx`
- Create: `src/components/media/ImageLightbox.test.tsx`
- Modify: `src/components/marketing/ProductVisual.tsx`
- Modify: `src/styles/globals.css`

**Interfaces:**
- Produces: `ImageLightbox` with `items`, `activeIndex`, `onIndexChange`, and `onClose` props.
- `ProductVisual` opens its screenshot when `expandable` is not explicitly false.

- [ ] Add failing interaction tests for opening, accessible dialog labelling, Escape close, next/previous navigation and focus restoration.
- [ ] Run the focused test and confirm failure because no dialog exists.
- [ ] Implement the portal-backed dialog, body scroll lock, focus management and keyboard navigation.
- [ ] Make product images buttons with visible hover/focus affordance and an “Enlarge image” label.
- [ ] Add contained-image and mobile control styles; respect reduced motion.
- [ ] Re-run tests and commit with `feat: add product image lightbox`.

### Task 4: Contact page and delivery adapter

**Files:**
- Create: `src/lib/contact.ts`
- Create: `src/lib/contact.test.ts`
- Create: `src/components/contact/ContactForm.tsx`
- Create: `src/components/contact/ContactForm.test.tsx`
- Create: `src/pages/Contact.tsx`
- Modify: `src/App.tsx`
- Modify: `src/lib/site-routes.ts`
- Modify: `src/components/site/DocumentMeta.tsx`
- Modify: `src/components/site/SiteShell.tsx`
- Modify: `src/pages/ForAgencies.tsx`
- Modify: `src/pages/Compare.tsx`
- Modify: `src/pages/CompareProduct.tsx`
- Modify: `src/styles/globals.css`
- Modify: `.env.example`

**Interfaces:**
- Produces: `submitContact(payload, fetchImpl)` using `VITE_CONTACT_ENDPOINT`.
- `ContactPayload` contains `name`, `email`, optional `company`, `project`, `consent`, and hidden `website` honeypot.

- [ ] Add failing unit tests for validation, endpoint absence, successful submission and service errors using a fake fetch.
- [ ] Add failing component tests for required fields, submitting state and success/error messages.
- [ ] Implement the adapter with JSON POST, timeout and safe error messages.
- [ ] Implement `/contact` with the four approved fields, consent, honeypot and status region.
- [ ] Configure `.env.example` for a FormSubmit-compatible endpoint that delivers to `lfmoura@gmail.com`; keep the destination out of rendered components.
- [ ] Add Contact to the footer and conversion CTAs to agency and comparison pages.
- [ ] Re-run focused tests and commit with `feat: add agency contact flow`.

### Task 5: Integration and visual verification

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-09-25-comparison-media-contact-design.md` only if implementation constraints require clarification.

**Interfaces:**
- Consumes all components and routes from Tasks 1–4.

- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and `git diff --check`.
- [ ] Verify `/compare`, both detail pages, `/contact`, gallery interactions and route-top behaviour in the local browser.
- [ ] Check 390, 768, 1024 and 1440 pixel viewports with no horizontal overflow.
- [ ] Confirm via DOM inspection that no Nova or Filament outbound link remains.
- [ ] Document contact endpoint activation and staging-only delivery test in `README.md`.
- [ ] Commit with `docs: document contact delivery and comparison maintenance`.

