# Current backlog

Last reviewed: 2026-08-06. Grouped by phase — see `phases/` for the full context on each. Phases A–D have no open items.

## Phase E — Deployment & Ops (the only phase with real open work)

- [ ] **Decide the real long-term hosting path**, once Victor's dad has tested the current free-tier demo (Vercel + Render + Neon) — self-host at work (original plan) vs. staying on a paid cloud tier vs. a hybrid. See `decisions.md`. Nothing below this line should be over-invested-in until this is decided, since some of it (backup strategy, monitoring target) depends on the answer.
- [ ] Dockerize the backend (`Dockerfile` + `docker-compose.yml` with Postgres for local dev) — useful regardless of the hosting decision above.
- [ ] CI pipeline (GitHub Actions: lint + backend Jest + frontend Vitest + Prisma migration-diff check on every PR).
- [ ] Staging environment, separate DB, once the real production host is chosen.
- [ ] Extend `/api/health` to a real DB connectivity check (`SELECT 1`), so uptime monitoring means something.
- [ ] Uptime monitoring (UptimeRobot free tier or equivalent) once there's a real production URL to watch.
- [ ] Backup policy for the real production database (nightly dump to object storage, retained ~30 days, or the equivalent managed feature) — depends on the hosting decision.
- [ ] Rotate `JWT_SECRET`/`MASTER_KEY` to fresh values before treating any deployment as real production (the current values were generated for the free-tier demo).
- [ ] Decide whether `POST /api/auth/register` should become invite-only before any wider real-world exposure (currently open registration — fine while the only users are Victor's dad's businesses).

## Small, non-blocking niceties

- [ ] Delete the dead empty `backend/src/socket/` directory (leftover from the removed `socket.io` dependency).
- [ ] Extend frontend test coverage past `Login` — no other page has a component-level integration test yet (pure-logic unit tests exist for units/permissions/format). Not urgent; grow opportunistically.
- [ ] Add `compression` middleware to the backend — cheap, not yet done.
- [ ] Extend pagination to products/warehouses/team/stock-movements lists once any of them grow past a page or two in real use. Not needed at current data volumes.

## Explicitly not on this list

Everything from the original "Known issues" review (2026-07-24) and every feature request through 2026-08-05 is done — see `completed.md`. Don't re-derive a backlog from the old known-issues sections; they're historical, not current.
