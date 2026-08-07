# Target production architecture

Right-sized for "a real small business tool used by a family and a handful of staff," not venture-scale SaaS. Where a standard production checklist would normally call for something heavier, that's called out explicitly so nobody adds it later out of habit. Status markers: ✅ done, 🟡 partially done / temporary, ⬜ not started.

## Backend & API ✅ (mostly done)

- **Keep the current shape**: Express + layered `routes → controllers → services → Prisma`. No rewrite to NestJS/microservices — see `phase-00-analysis.md` §13.
- ✅ IDOR closed (`belongsToBusiness` on every nested router).
- ✅ `zod` validation at every boundary.
- ✅ `AppError`/`asyncHandler` — controllers have no try/catch.
- ⬜ Background jobs: still none needed. If/when something genuinely async and heavy shows up, a `node-cron` task or a `pending_jobs` table is enough — full Redis+Bull would be overkill at this scale.
- ⬜ File uploads: not present. If product photos are wanted later, target S3-compatible object storage (Cloudflare R2) rather than Postgres or local disk.
- ⬜ Notifications: low-stock alerts already compute server-side; surfacing them beyond the in-app dashboard (e.g. email digest) is a future nicety, not scoped.

## Database ✅ (mostly done)

- Schema stays as-is — well-normalized (see `phase-00-analysis.md` §5).
- ✅ N+1 patterns fixed in `report.service.js`/`product.service.js`.
- ✅ Migrations via Prisma Migrate, immutable-once-applied discipline followed throughout.
- 🟡 **Hosting**: currently Neon (free tier) for the demo deploy. Whether this is the long-term production database depends on the still-open hosting decision (`decisions.md` — "Hosting: free-tier test deploy vs. long-term plan"). Don't build backup/monitoring automation against Neon specifically until that's settled.
- ⬜ **Backups**: no real policy yet for whatever ends up being production. Target: nightly `pg_dump` to object storage (R2/S3) retained ~30 days, or the equivalent managed feature if the eventual host provides one. That's the entire backup strategy needed here — no multi-region replication.
- ⬜ Soft-delete is already correctly scoped (Product/Customer/Warehouse) — no further schema-level work needed here.

## Authentication & Authorization ✅ (done, with accepted tradeoffs)

- ✅ JWT + httpOnly cookie only, `sameSite=strict`. Kept even across the Vercel/Render domain split via the Vercel proxy rewrite (`decisions.md`) rather than weakened to `sameSite=none`.
- ✅ No refresh-token rotation — accepted tradeoff at this scale, documented in `decisions.md`. Revisit only if the trust model changes (e.g. if this ever stops being "a family + a few staff").
- ✅ Self-service password reset (SuperAdmin, via Brevo email) + admin-driven team-member reset.
- ✅ TOTP 2FA, real (any authenticator app).
- ✅ RBAC: three-role model, enforced per-business.
- ⬜ Registration is still open (`POST /api/auth/register`, no invite gate). Worth a decision before wide real-world use: should new SuperAdmin signup become invite-only / admin-created? Not urgent while the only real users are Victor's dad's businesses.

## Infrastructure 🟡 (temporary demo state, real decision pending)

- **Current state (2026-08-06)**: Vercel (frontend, free) + Render (backend, free) + Neon (Postgres, free), wired together via a Vercel rewrite proxy so the browser sees one origin. This exists so Victor's dad can test the app for real — it is explicitly not the final answer (see `decisions.md`).
- **Known limits of the current setup**: Render's free tier cold-starts after 15 min idle (30-50s first request); Neon's free tier has its own limits worth checking before treating it as permanent; secrets currently in use (`JWT_SECRET`, `MASTER_KEY`) were generated for this demo and should be rotated again before anything resembling a real production launch.
- **Two paths forward, to be decided later** (see `decisions.md` for the original self-host plan that this demo deploy has temporarily superseded):
  1. Stay on a cloud PaaS (Vercel + a paid Render/Railway tier + a paid Postgres tier) — least operational burden, ongoing cost.
  2. Self-host on Victor's work server (the original plan, deferred 2026-08-01) — near-zero cost, more setup/maintenance burden, Victor controls the hardware.
  Either way, Docker Compose for local orchestration (below) is useful regardless of which path is chosen — don't skip it while waiting on this decision.

## Security ✅ (done for current scale)

- ✅ IDOR fixed, rate limiting (login + forgot-password specific), CORS env-driven, Helmet defaults, zod validation closing most injection/malformed-input risk, Prisma parameterization preventing SQL injection.
- ⬜ Rotate `JWT_SECRET`/`MASTER_KEY` to fresh values before treating any deployment as real production (not just a demo).
- CSRF: `sameSite=strict` + no state-changing GETs already mitigate most risk for this threat model — a dedicated CSRF token remains optional, not urgent.

## Performance ✅ (done for current scale)

- No Redis/caching layer needed yet — revisit only if dashboard/report load times become noticeably slow.
- ✅ Route-level code-splitting done (2026-08-01).
- ⬜ Pagination exists on transactions only — extend to products/warehouses/team/stock-movements once any of those lists grow past a page or two in practice. Not needed today.
- `compression` middleware not yet added — cheap to add whenever Phase E infrastructure work resumes.

## Scalability & Reliability 🟡

- ✅ Stateless API (JWT, no server-side session memory) — horizontal scaling is trivial *if* ever needed.
- ⬜ **In-memory rate limiter** would silently misbehave the moment there's more than one backend instance. Not a problem today (single Render instance); flag before ever scaling horizontally.
- ✅ Structured logging (`pino`), replacing bare `console.log`.
- ⬜ No error tracking service (Sentry or equivalent) — a deliberate cost/complexity tradeoff, not an oversight. Revisit if production incidents start being hard to diagnose from logs alone.
- ⬜ `/api/health` is a pure liveness probe — extend it to a real `SELECT 1` DB check so uptime monitoring (e.g. UptimeRobot free tier) actually means something.
- ⬜ No documented disaster-recovery/restore procedure yet — depends on the hosting decision above.

## DevOps ⬜ (the main open phase)

- **Git workflow**: trunk-based, `main` + short-lived work, already followed in practice.
- ⬜ **CI**: GitHub Actions running lint + test suite + a Prisma migration-diff check on every PR. Not set up yet.
- ⬜ **Docker**: containerize the backend (`Dockerfile` + a `docker-compose.yml` with Postgres for local dev) — useful regardless of which hosting path is eventually chosen, and closes the "environment drift" gap that's currently the biggest real risk in this project's process (see `phase-00-analysis.md` §12).
- ⬜ **Staging**: one cheap environment, separate DB, so future changes are never tested against real business data. Currently every change is verified against a real dev/demo environment directly.
- ⬜ **Testing strategy**: backend integration tests already prove the IDOR class of bug can't regress (`business-scoping.test.js`) — good, keep extending this pattern for any new cross-business-boundary logic. Frontend test coverage is thin (see `phase-00-analysis.md` §10) — grow it opportunistically, not as a blocking gate today.

## What this project deliberately does NOT need (don't add these out of habit)

- Redis, message queues, event-driven architecture, microservices, multi-region infrastructure, Kubernetes.
- A repository layer or DI container in the backend.
- Refresh-token rotation or per-session revocation granularity.
- A dedicated CSRF token mechanism.
- Soft-delete on every entity (only Product/Customer/Warehouse need it).

Revisit any of the above only if real usage genuinely outgrows "a few small businesses, a handful of staff each, run by a family."
