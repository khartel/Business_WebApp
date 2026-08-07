# Phase C — Core Feature Screens

**Status: ✅ Done (2026-07-25), then continuously extended through 2026-08-05.** Full change log in `completed.md`.

## Objective
Build out the actual product surface: Dashboard, Products, Warehouses/Stock, Sales/Register, Team, Reports, Business management (SuperAdmin), Platform Admin.

## Why it exists
This is the actual product Victor's dad and his staff use daily.

## Dependencies
Phase B's shell and API client.

## Deliverables (original scope)
One screen at a time, each wired to its real backend endpoint, each covering the golden path and the obvious edge cases (empty states, low-stock warnings, insufficient-stock errors on sale, permission-gated actions per role).

## Risks (as assessed at the time)
Scope creep — resisted by flagging "nice to have" ideas as backlog instead of building them inline. In practice this phase never really "closed" — it kept absorbing new, explicitly-requested features (POS rework, customer/credit ledger, alternate pack sizes, low-stock rules, report exports) well past its original scope, each one discussed and scoped before building rather than added speculatively.

## Expected outcome
Full feature parity with what the backend supports, usable end-to-end. Achieved, then substantially exceeded — see `completed.md` for the full list, which includes:
- The business-picker + POS home-screen IA rework (2026-07-25).
- Real `Customer` entity with a full credit ledger, partial payments (2026-07-25).
- Alternate pack sizes / unit conversion (2026-07-31).
- Reports date filtering + CSV/PDF export (2026-07-26).
- Settings-configurable low-stock alert rule (2026-08-05).

Five real, previously-unknown bugs were found and fixed during the original Phase C verification pass alone (see `completed.md` for detail) — this phase is the source of most of this project's "verify live, not just should-work" discipline documented in `instructions.md`.
