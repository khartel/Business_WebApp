# Phase 0 — Deep Codebase Analysis

Last verified against the live codebase: 2026-08-06 (backend `package.json`, `schema.prisma`, `app.js`, folder structure read directly; feature history cross-checked against the migrated `completed.md`).

## 1. Overall purpose

VAE Inventory (internal codename `vae-inventory`, GitHub repo `khartel/vae-inventory`) is inventory + sales tracking for multiple small businesses under one login. Domain model:

- **User** — global identity, `Role` enum `SUPERADMIN`/`ADMIN`/`EMPLOYEE`.
- **SuperAdmin** owns one or more **Businesses**.
- **Business** has **Warehouses** (stock locations), **Products**, **Team members** (via `BusinessUser`, a per-business role join table — a user's role can differ per business), **Customers** (with a credit ledger), **Transactions** (sales), **StockMovements** (restocks + warehouse-to-warehouse transfers), and an **AuditLog**.
- Sales are recorded against the business's primary warehouse, decrementing stock atomically.
- A separate **Platform Admin** surface, gated by a static `X-Master-Key` header, lets the developer (Victor) manage/delete SuperAdmin accounts directly — an internal ops tool, not customer-facing.

Product family naming: this is one product ("VAE Inventory") under a planned future umbrella ("VAE Systems"). Nothing about the umbrella brand exists in the app yet.

## 2. Folder structure & architecture

```
backend/
  prisma/           schema.prisma, migrations/, prisma.config.ts
  src/
    routes/         → controllers/ → services/ (business logic + Prisma) → utils/
    middleware/      authenticate, authorize, belongsToBusiness, masterkey, validate
    validators/       one zod schema module per resource
    socket/           EMPTY — dead leftover directory from a removed socket.io dependency, never cleaned up
  tests/            Jest + Supertest, business-scoping (IDOR) + auth suites
frontend/
  src/
    pages/          one file per route, pages/auth/ and pages/settings/ as subfolders
    components/     one folder per domain (products, warehouses, customers, pos, reports, settings, team, transactions, businesses, stock, layout, auth) + components/ui (shadcn primitives, auto-generated, not hand-commented)
    context/        AuthContext, ThemeContext
    hooks/          shared query/mutation hooks
    lib/             api-client (axios + ApiError), csv.ts, pdf.ts, units.ts, i18n
    services/        one *.service.ts per backend resource, thin axios wrappers
    locales/fr/       15 namespace JSON files + errors.json
    test/            Vitest setup
    types/            shared TS interfaces
```

Backend is a classic layered Express app: no repository layer beyond Prisma itself, no DI container. This is a deliberate, correct fit for the project's scale (see `decisions.md`) — not an oversight to "fix" later.

**One piece of dead weight found during this analysis**: `backend/src/socket/` is an empty directory left over from when `socket.io` was a dependency (removed 2026-08-02, see `completed.md`). Harmless, but should be deleted as part of any future cleanup pass — it currently signals "realtime features exist" to anyone browsing the tree, which is false.

## 3. Backend flow

Request lifecycle: `helmet` → CORS (env-driven `CLIENT_URL` allowlist, `+ localhost:*` in non-production) → rate limiters (general + a stricter login limiter + a forgot-password limiter) → `cookie-parser` → `pino-http` structured request logging → mounted routers → 404 handler → global error handler (`AppError`-aware, `pino` structured logging with request id/user id).

Nested business routers (`warehouse`, `team`, `product`, `stock`, `transaction`, `report`) all run `authenticate` then `belongsToBusiness` before the resource logic — this is the fix for what was originally a cross-business IDOR bug (Phase A). `belongsToBusiness` also sets `req.businessRole`, which `authorize(...roles)` checks in preference to the JWT's global `role` claim, so a user who is ADMIN in Business A and EMPLOYEE in Business B gets the correct enforcement in each (Phase A/late-July fix — see `decisions.md`).

Prisma access goes through one singleton (`backend/src/utils/prisma.js`): a `pg.Pool` wrapped in `@prisma/adapter-pg`'s `PrismaPg` driver adapter, not Prisma's default query engine. Migrations run through the same adapter via `backend/prisma.config.ts` (Prisma 7's config-file-based CLI wiring — `migrate deploy` reads `DATABASE_URL` from there, not from a `url =` line in `schema.prisma`, which deliberately has none).

## 4. Frontend flow

Vite + React 19 + React Router 7 + TanStack Query v5 + React Hook Form + zod + Tailwind v4 + shadcn/ui (Radix primitives). Auth state: `AuthContext` backed by TanStack Query's `/auth/me`; `activeBusinessId` persisted in `localStorage` as a UI preference only (the session token never leaves the httpOnly cookie).

Current IA: login → `/` is `SelectBusiness`, a business-picker landing page (every role, every login) → selecting a business lands on `/pos`, a search-driven cash-register screen that is the business "home." Sidebar order: Dashboard, Register, Customers, Products, Warehouses, Stock Movements, Team, Reports, Businesses, Settings (Settings is its own SUPERADMIN-only card-grid hub under `/settings/*`).

Every business-scoped page and Settings sub-page is `React.lazy`-loaded behind one `<Suspense>` boundary (route-level code-splitting, done 2026-08-01). Auth/landing pages stay eager. Visual language is glassmorphic (translucent blurred `Card`/`Dialog` surfaces, near-black cinematic dark mode) applied consistently via shared primitives rather than per-page — this is why most visual reworks in this project's history touched 2-3 shared components and cascaded everywhere, instead of N page-by-page edits.

## 5. Database design

`schema.prisma` (verified in full 2026-08-06): `User` → `Business` (owned) → `BusinessUser` (join, per-business role) → `Warehouse` → `WarehouseStock` (per warehouse+product quantity, nullable `lowStockThreshold` override) → `Product` (soft-delete) → `ProductUnit` (alternate pack sizes, e.g. "dozen" = 12 base units) → `Transaction`/`TransactionItem` (sales, with `discountPercent`, `unitLabel`/`unitQuantity` display fields, `amountTendered`/`changeGiven` for cash) → `CreditPayment` (a real ledger, not a binary paid flag) → `StockMovement` (`RESTOCK`/`TRANSFER`, nullable `fromWarehouseId`) → `Customer` (soft-delete) → `AuditLog` (denormalized `actorName`/business-name-via-metadata snapshots so entries stay readable after the thing they describe is gone).

UUID PKs throughout. Cascade deletes are correct and deliberate (`Business.owner` was the one relation missing `onDelete: Cascade`, found and fixed in Phase C). `Business.currency` is auto-derived from `country` via a static map. Low-stock alerting is a two-part live rule: `Business.defaultLowStockThreshold` (flat fallback) + `Business.lowStockThresholdsByUnit` (per-unit map), resolved at read time against a stock row's nullable per-product override — see `decisions.md`.

**Migrations**: Prisma Migrate, applied incrementally, immutable once applied (a broken migration is always fixed with a new migration, never edited in place — this bit the project once, Phase A, `mustChangePassword` column). One migration required a hand-authored backfill `UPDATE` before a `NOT NULL` constraint could apply safely to existing production rows (low-stock feature, 2026-08-05) — a pattern worth reusing whenever a nullable→required column change ships after real data already exists.

## 6. Authentication flow

Username/password → bcrypt compare → JWT (24h, or 30d "remember me"), delivered **only** via an httpOnly, `sameSite=strict`, `secure`-in-production cookie (never echoed in the JSON body — an XSS-surface fix from Phase A). `authenticate` middleware reads the cookie (or an `Authorization: Bearer` header) and additionally checks the token's `tokenVersion` claim against the stored `User.tokenVersion` — logout increments this, which revokes every session for that user at once (no per-session granularity, an accepted tradeoff, see `decisions.md`).

TOTP 2FA (any authenticator app, `otplib` + `qrcode`) is real, not stubbed: a login with 2FA enabled returns a 5-minute-lived special-purpose JWT (`purpose: "2fa-pending"`) instead of a session, exchanged for the real session via a second endpoint once the 6-digit code verifies (`tolerance: 30` — see the note in §9 below on why that matters). Password reset for the business owner reuses the exact same short-lived-JWT-with-`purpose` idiom (`purpose: "password-reset"`, 30 minutes), sent via Brevo email; completing a reset also revokes all other sessions.

New team members get a deterministic default password (`Biz@{username}{last4ofphone}`) and `mustChangePassword: true`. A SuperAdmin/Admin can also force-reset a non-owner teammate's password from the Team page (a random 10-character password from an ambiguous-character-free charset — deliberately not the guessable default-password pattern, since a reset can be triggered repeatedly).

RBAC is the three-role model (`SUPERADMIN`/`ADMIN`/`EMPLOYEE`), enforced per-business via `req.businessRole` (see §3).

## 7. API design

REST, one router file per resource, mounted under `/api`. Every response goes through `sendSuccess`/`sendError` — a single predictable envelope shape across all ~9 resource groups. Validation is `zod` at every boundary via `validate(schema)` middleware. Errors are `AppError(message, statusCode)`, formatted centrally.

Pagination exists on transactions; not yet extended to products/warehouses/team/stock-movements lists (flagged, not urgent at current data volumes — see `todo.md`). CSV and PDF export exist for every report tab and Stock Movements, built client-side from data already fetched (no dedicated export endpoints) — a deliberate choice to avoid a second backend code path per report.

## 8. External services

- **Neon** (Postgres) — production/demo database, chosen over Render's own free Postgres specifically to avoid its 30-day free-tier expiry (2026-08-06, see `decisions.md`).
- **Brevo** (transactional email, API key not SMTP) — password-reset and welcome emails. Requires the sending IP to be authorized in Brevo's dashboard (hit once in production, see `completed.md` 2026-08-01).
- **Render** (backend hosting, free tier) — cold-starts after 15 minutes idle (30-50s first request). Explicitly a demo-tier choice, not the final production host.
- **Vercel** (frontend hosting, free tier) — also proxies `/api/*` to Render (`frontend/vercel.json`) so the browser sees one origin, which is what keeps the `sameSite=strict` session cookie working across the Vercel/Render domain split without weakening it to `sameSite=none`.

No object storage, no CDN beyond what Vercel/Render provide by default, no background job runner, no queue — none are needed yet (see `architecture.md`).

## 9. Dependencies

**Backend** (`backend/package.json`, verified 2026-08-06): Express 5, Prisma 7 via `@prisma/adapter-pg` (not the default engine), `zod` (genuinely used everywhere, not dead — an earlier known-issue, now resolved), `bcryptjs`, `jsonwebtoken`, `otplib`+`qrcode` (2FA), `@getbrevo/brevo` (email), `helmet`, `express-rate-limit`, `cors`, `cookie-parser`, `date-fns`, `pino`/`pino-http`/`pino-pretty` (structured logging). `socket.io` was removed (2026-08-02 audit) — but see §2, the empty folder wasn't cleaned up. Dev: Jest + Supertest + a Babel transform specifically to let Jest parse `otplib`'s ESM-only transitive deps (`@scure/base`, `@noble/hashes`) — Node's native `require()` handles this transparently at runtime, Jest's module system doesn't, hence the workaround (see `completed.md`, 2026-08-01).

**Frontend** (`frontend/package.json`, verified 2026-08-06): React 19, React Router 7, TanStack Query 5, React Hook Form + zod + `@hookform/resolvers`, Tailwind 4, `radix-ui` (unified package) + `shadcn`, `i18next`/`react-i18next`, `jspdf`/`jspdf-autotable`, `ogl` (WebGL, auth-screen background effect only), `sonner` (toasts), `axios`. Dev/test: Vitest + React Testing Library + jsdom + oxlint.

Both dependency trees are lean — no unused/dead packages currently present in `package.json` (the one historical dead dependency, `socket.io`, is already removed).

## 10. Technical debt (current, not historical)

Ranked by what would actually bite first:

1. **No CI, no Docker, no staging environment.** Every change ships by editing the running dev server directly and verifying manually/via Playwright. Fine for a single-developer project at this stage; will not scale past that without automation, and is the single largest gap in "production-ready" as commonly understood.
2. **`/api/health` doesn't check DB connectivity** — it's a pure liveness probe (`{ success: true }` unconditionally). An uptime monitor pointed at it can't actually detect "app is up but DB is unreachable."
3. **No error-tracking service** (Sentry or equivalent) — a deliberate cost/complexity tradeoff (see `decisions.md`), but it means production exceptions are only visible in whatever's capturing `pino`'s output on the host, not searchable/alertable.
4. **Frontend test coverage is thin** — Vitest + RTL exist and 20 tests pass, but only `Login` has a full component-level integration test; everything else is pure-logic unit tests (units/permissions/format) plus ad-hoc Playwright walkthroughs per feature batch (not committed, not regression-proof).
5. **In-memory rate limiting** (`express-rate-limit`'s default store) — correct for a single app instance (which is all this project runs), but would silently stop working correctly the moment there's more than one backend instance behind a load balancer. Not a bug today; a landmine if horizontal scaling is ever added without also addressing this.
6. **No backup policy for whatever ends up being the real production database.** Neon's free tier has some point-in-time recovery built in, but nothing here is an intentional, documented, tested backup/restore procedure.
7. **`backend/src/socket/`** — empty dead directory, cosmetic but worth deleting.
8. **Reset-token and rate-limiting accepted risks** (stateless JWT not single-use-tracked; per-IP not per-email rate limiting) — documented, deliberate, low-severity at this scale, not debt to silently "fix" without revisiting the tradeoff first.

## 11. Security, performance, scalability

**Security**: IDOR-closed (Phase A, re-verified since via integration tests), per-business RBAC, `zod` validation everywhere, Prisma parameterized queries (no raw SQL string interpolation seen anywhere in services), `helmet` defaults, CORS env-driven, login/forgot-password-specific rate limits, secrets rotated for local dev (`.env`, never committed) but **must be rotated again to fresh values before any real production deploy** — the current free-tier `JWT_SECRET`/`MASTER_KEY` were generated for this demo and should not be treated as permanent. CSRF risk is mitigated by `sameSite=strict` + no state-changing GETs; no dedicated CSRF token, an accepted tradeoff for the small trusted user base.

**Performance**: N+1 query patterns from the original 2026-07-24 review are fixed (`report.service.js`, `product.service.js`). Route-level code-splitting is done. No caching layer — not needed at current query volume. Pagination exists on transactions only.

**Scalability**: stateless API (JWT-only, no server-side session memory) — horizontal scaling is architecturally trivial *if* ever needed, given the in-memory-rate-limiter caveat above is addressed first. Nothing here is asynchronous enough to justify a queue/event-driven architecture, and shouldn't be built preemptively.

## 12. Missing production-grade features

Docker, CI/CD, staging, monitoring/alerting, error tracking, tested backup/restore, DB-aware health check, load-tested rate limiting story for multi-instance deployment. All tracked in `todo.md` under Phase E, none started beyond the temporary free-tier demo deploy.

## 13. Assessment

**What's good — keep as-is:**
- The service/controller/route layering. Clean, consistent, easy to extend. Do not introduce a repository layer, DI container, or NestJS-style rewrite — there is no problem here that would justify the churn.
- Schema design: sound normalization, correct cascade rules (after the one Phase C fix), sensible use of `@@unique`, live-resolved business rules (low-stock) over baked-in defaults.
- The `AppError`/`asyncHandler`/`sendSuccess`/`sendError` conventions — consistent everywhere, cheap to keep consistent going forward.
- Soft-delete + audit trail scope (three entities, not everything) — right-sized, not dogmatic.
- i18n architecture (source-English-as-key) — low friction for the ~450 existing strings and for anything added later.
- Verification discipline (see `instructions.md`) — this is process, not code, but it's the reason this project has shipped as much as it has with few regressions reaching "done."

**What's bad / should be improved (not rewritten):**
- No CI/Docker/staging — the biggest real gap, tracked as the remainder of Phase E.
- `/api/health` should do a real `SELECT 1` DB check.
- The dead `backend/src/socket/` folder should just be deleted.
- Frontend test coverage should grow past "one page has an integration test" over time — not urgent, but don't let it stay this thin indefinitely.

**What should be rewritten:** nothing identified. There is no component in this codebase where the analysis concluded "this needs to be thrown away and redone" — every gap found is additive (add CI, add a health check, add tests), not corrective of a bad design.

**What should stay unchanged:** the layered backend architecture, the glassmorphic shared-primitive frontend approach, the JWT+cookie auth model (no refresh-token rotation — an accepted, documented tradeoff at this scale), the soft-delete/audit scope, and the "small business tool" scale target itself. Nothing here should be re-scoped toward SaaS-at-scale assumptions this project doesn't need.
