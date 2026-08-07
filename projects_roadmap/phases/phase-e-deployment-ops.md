# Phase E — Deployment & Ops

**Status: 🟡 Partially done.** A free-tier demo deployment went live 2026-08-06 so Victor's dad can test the app for real. Docker, CI, staging, monitoring, and the real long-term hosting decision are all still open. See `todo.md` for the current concrete backlog and `decisions.md` for the hosting decision history.

## Objective
Get the app actually running somewhere real, safely.

## Why it exists
None of the earlier phases matter until Victor's dad can actually use the app outside Victor's laptop.

## Dependencies
Phases A–D functionally complete (they are).

## Deliverables (original scope, written 2026-07-24 assuming a cloud-PaaS-first path)
Dockerized backend, CI pipeline (lint/test/migration-check on PR), staging environment, hosting (originally scoped as Railway/Render + managed Postgres, frontend on Vercel/Netlify/Cloudflare Pages), nightly backups, Sentry + uptime monitoring, real secrets rotated and stored in the host's env config.

## What actually happened (2026-08-01 → 2026-08-06)
1. **2026-08-01**: Victor decided to self-host on an existing work server for roughly the first year before migrating to a real online host, deferring this phase's original cloud-PaaS plan. This superseded the original Deliverables list above.
2. **2026-08-06**: Victor's dad wanted to test the app now, ahead of that longer self-host timeline. Rather than wait, a **free-tier cloud demo deployment** was stood up instead — Vercel (frontend) + Render (backend) + Neon (Postgres), wired together via a Vercel proxy rewrite so the `sameSite=strict` session cookie keeps working across the two domains without weakening cookie security. GitHub repo renamed `khartel/vae-inventory` to match. This is explicitly a **testing/demo deployment**, not a decision to abandon the self-host plan — see `decisions.md`.

## Risks
- The free-tier demo stack has real limits (Render cold-starts, Neon free-tier limits, no backup policy, secrets generated for demo purposes only) — documented in `architecture.md`, must not be silently treated as permanent infrastructure.
- First real deployment (whichever one ends up "production") always surfaces environment drift — a staging environment is the standard mitigation and still doesn't exist yet.

## Expected outcome (not yet reached)
A live, monitored, backed-up production deployment Victor's dad can actually depend on day-to-day — as opposed to the current live-but-temporary demo he can currently *test* with. The remaining gap is tracked concretely in `todo.md`.
