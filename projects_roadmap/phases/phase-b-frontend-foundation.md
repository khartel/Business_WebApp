# Phase B — Frontend Foundation

**Status: ✅ Done (2026-07-24).** Full change log in `completed.md`.

## Objective
Stand up the new React app's skeleton — build tooling, routing, auth flow, layout shell, and the visual design system — before building individual feature screens.

## Why it exists
Every screen after this depends on a shared layout (sidebar/navbar), a shared API client, and an established look. Building screens before this existed would have meant redoing them later.

## Dependencies
Phase A's auth endpoints (cookie-only login) needed to be in place first, so the frontend was built against the corrected contract, not the old one.

## Deliverables
- Vite + React app scaffolded (TypeScript, Victor's explicit call — better autocomplete/error-catching while learning, and shadcn/ui is TS-first).
- Tailwind + design tokens generated via the `ui-ux-pro-max` skill, steered to match a reference screenshot (dark sidebar, KPI cards, clean tables) rather than the skill's own generic recommendation.
- React Router routes for auth/dashboard/etc.
- TanStack Query API client wired to the backend with cookie-based auth.
- Login/register/change-password pages.
- The app shell (sidebar nav, top bar, business switcher).

## Risks (as assessed at the time)
Getting the visual direction wrong early is expensive to unwind — mitigated by validating the shell + one real screen (Dashboard) before building the rest on the same patterns.

## Expected outcome
A running, styled app shell with working login, ready to receive feature screens. Achieved — verified end-to-end via a headless-browser walkthrough. Also found and fixed a real CORS bug (hardcoded origin allowlist breaking on a Vite port fallback) along the way.

## Note
Superseded visually by a later ground-up redesign (see `completed.md`, "Auth UI redesign + light/dark theme" and "Frontend rework — premium glass redesign + new IA," both 2026-07-25) — Phase B's shell was real and functional, but Victor's follow-up feedback pushed the visual language further than this phase originally delivered. The IA (business picker → POS as home) also postdates this phase.
