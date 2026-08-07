# Phase A — Backend Hardening & Security Fix

**Status: ✅ Done (2026-07-24).** Full change log in `completed.md`.

## Objective
Close the cross-business data leak, add real request validation, and clean up the auth/error-handling foundation everything else builds on.

## Why it exists
This was a live data-isolation bug at the time — every later phase (new frontend, new features) would have inherited that risk if it shipped first. Foundation had to be fixed before building on it.

## Dependencies
None — pure backend work on the existing codebase.

## Deliverables
- `belongsToBusiness` enforced on every nested route (warehouse, team, product, stock, transaction, report).
- `zod` validation on every endpoint.
- `AppError`/`asyncHandler` cleanup, replacing scattered try/catch.
- Login-specific rate limiting.
- Rotated `JWT_SECRET`/`MASTER_KEY` (dev values; real secrets generated at each real deploy).
- Admin-driven password reset endpoint, replacing ad-hoc scripts.
- Integration tests proving business A cannot read business B's data.

## Risks (as assessed at the time)
Touching every route file is mechanical but easy to miss one — mitigated with the integration test suite as the actual proof, not manual review alone.

## Expected outcome
The backend became safe to onboard a second real business/employee onto. Achieved and verified — see `completed.md` for the full list of fixes, including a second serious bug found while building the test suite (a migration that silently never added the `mustChangePassword` column, which would have broken login on any fresh deploy).
