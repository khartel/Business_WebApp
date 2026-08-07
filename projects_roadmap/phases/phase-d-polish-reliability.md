# Phase D — Polish & Reliability

**Status: ✅ Done (2026-07-25), extended through 2026-08-05.** Full change log in `completed.md`.

## Objective
Make the app feel trustworthy day-to-day — loading states, error boundaries, receipt printing, responsive layout for tablet/phone use on a shop floor.

## Why it exists
A tool Victor's dad and his staff rely on daily needs to fail gracefully, not blank-screen or silently lose a sale.

## Dependencies
Phase C screens needed to exist first.

## Deliverables
- Global error boundary.
- Consistent loading/empty/error states across screens, with retry.
- Receipt print flow (real `window.print()`, `@media print` rules).
- Responsive breakpoints (mobile nav drawer, scrollable tables instead of clipped ones).
- Basic accessibility pass (focus-visible rings, aria-labels on icon-only buttons).

## Risks (as assessed at the time)
"Polish" can expand indefinitely — timeboxed to a fixed, agreed list rather than left open-ended.

## Expected outcome
An app that feels finished, not a prototype. Achieved and re-verified multiple times as later features landed — most recently the detail-popup Sheet→Dialog conversion and receipt print-pagination fixes (2026-08-02/03, see `completed.md`), which fixed real print-layout bugs only catchable by generating actual PDF output, not just screenshot emulation.

## Note
This phase's scope (reliability/polish) was deliberately kept separate from the parallel "finish the glassmorphic visual redesign on every remaining screen" work — Victor confirmed that split explicitly rather than letting the two blend together.
