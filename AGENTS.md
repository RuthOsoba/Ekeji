<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Ekeji agent guide

This repository is a React + TypeScript marketplace app built with Vite, TanStack Router, TanStack Query, and a shadcn-style UI system. Keep changes aligned with the app’s existing patterns: modular, feature-first, and easy to scale.

## Core architecture

- `src/routes/`: page-level route definitions and route-specific composition only.
  - Routes should stay thin and compose reusable components.
  - Keep route metadata, validation, and shell layout here.
- `src/components/ekeji/`: product/domain-specific components for Ekeji features.
  - This is where marketplace logic, feature UI, and app-specific composition live.
  - Reuse existing components before creating new ones.
- `src/components/ui/`: base reusable UI primitives.
  - These should remain generic and design-system-like.
  - Prefer extending existing primitives instead of creating one-off UI components here.
- `src/hooks/`: reusable hooks for auth, queries, and cross-feature logic.
- `src/lib/`: pure helper functions, typed domain logic, formatting, filtering, and business rules.
  - Prefer this for data shaping, filtering, calculation, and parsers instead of burying logic inside components.
- `src/integrations/`: API/service clients and external integration code.
- `src/styles.css`: global styling and theme tokens.

## Component separation and responsibility boundaries

- Keep routes simple and declarative. They should mount shared layout and pass data to components, not contain business logic.
- Put marketplace-specific UI into dedicated components under `src/components/ekeji/`.
- Keep generic UI primitives in `src/components/ui/` and avoid app-specific logic there.
- Prefer composition over large monolithic components.
- If a component grows too large, split it into smaller presentational and container pieces.
- Reuse `MarketplaceBrowser` for shared marketplace listing/filter behavior across public listing surfaces so the Home and Explore flows stay consistent.

## Clean code guidelines

- Prefer small, focused functions and descriptive names.
- Avoid duplicate logic; extract shared logic into `src/lib/` or `src/hooks/`.
- Keep JSX readable and avoid excessive inline logic. Move conditions, filters, and transforms into named functions.
- Use TypeScript types consistently. Prefer derived types and domain-specific utility types over `any`.
- Use existing app conventions and aliases such as `@/` rather than relative import chains when possible.
- Keep loading, empty, and error states explicit and user-friendly.
- Preserve accessibility: labels, semantic structure, focus states, and keyboard-friendly controls.

## Scalability and maintainability

- Prefer centralized data-fetching patterns with TanStack Query rather than ad hoc fetch logic in components.
- Keep query keys and fetch functions structured and predictable.
- Co-locate domain logic and transformations near the relevant feature domain.
- Avoid scattering one feature’s logic across unrelated files.
- If a feature is reused in multiple pages, extract it to a shared component or hook.
- Follow the existing pattern of composition:
  - page/route
  - shell/layout
  - feature component
  - hook or lib helper
- Keep the visual system consistent with Tailwind utilities and shadcn-style patterns already used across the app.

## Repo-specific conventions

- Public marketplace browsing should use the canonical `MarketplaceBrowser` component and shared filter behavior.
- Keep `AppShell`, `SiteHeader`, and `SiteFooter` responsible for layout while route pages provide content-specific structure.
- Prefer using the existing `useSession`, `useSaved`, and `useFitProfile` hooks over creating duplicate state patterns.
- Put business rules such as filter logic, formatting, and fit logic in `src/lib/` rather than directly in UI components.
- Keep feature-specific constants and configuration near the relevant module instead of scattering them inline.

## Change checklist for agents

Before editing, check whether the change belongs in:
- `src/routes/` for page composition
- `src/components/ekeji/` for app-specific feature UI
- `src/components/ui/` for reusable primitive UI
- `src/hooks/` for shared state/data behavior
- `src/lib/` for pure logic, calculations, and transformations
- `src/integrations/` for external API concerns

When implementing new features:
- reuse existing patterns before introducing new abstractions
- keep responsibilities separated and explicit
- ensure the change is easy to test and understand
- avoid broad rewrites if a focused, local change will do

## Final expectations

Aim for code that is:
- modular and easy to follow
- typed and explicit
- consistent with current Ekeji patterns
- scalable as the marketplace grows
- clean enough for future contributors to understand quickly
