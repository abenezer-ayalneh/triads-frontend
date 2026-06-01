# Daily rollover routes the player home on re-entry instead of auto-starting the new puzzle

## Status

accepted

## Context

When a daily game is left open in a tab across the Eastern-time day change, the
Eastern Day Watcher fired `restartGame()`, which loaded the new puzzle straight
into `PLAYING` state with bubbles populated. This bypassed the Brain-Warming
Intro — the deliberate animated Play ritual that lives only on the home page —
so returning to the tab in the morning showed a fully-loaded board with no entry
experience.

## Decision

At a Daily Rollover the player is sent to the **home page** rather than having
the new puzzle auto-started, so the next play passes through the Brain-Warming
Intro. Specifics:

- **Trigger:** only the **re-entry** path (tab focus / visibility change)
  navigates home. The live midnight timer does **not** interrupt an
  actively-focused player; they are left to finish and get the new puzzle the
  next time they re-enter.
- **Scope:** applies to all daily states — in-progress, completed (WON/LOST),
  no-schedule (EMPTY), and ERROR.
- **Staleness anchor:** the daily view records a **load-time Eastern date**
  whenever it loads any content. On re-entry, today's Eastern date is compared
  against that anchor to decide the view is stale. This is robust even if the
  midnight timer already fired, and uniformly covers states that have no
  `puzzleDate`.
- **Watcher API:** the Eastern Day Watcher exposes two separate callbacks — a
  timer rollover and a re-entry rollover — so the home page can keep refreshing
  its calendar label on the timer while game-play reacts only to re-entry.

The stale `localStorage` daily session needs no special cleanup: on the next
entry `initializeDailyGame` declines to restore a session whose date no longer
matches today, so a fresh puzzle loads.

## Considered options

- **Auto-start the new puzzle on `/daily`** (prior behavior) — rejected: skips
  the Brain-Warming Intro every day for anyone who leaves the tab open.
- **Drop into a pre-game state on `/daily`** — rejected: would duplicate the
  brain-warming ritual onto the daily route instead of reusing the single
  existing entry point on home.
- **Navigate even an actively-focused player at the midnight tick** — rejected:
  yanks a mid-move player off their board.

## Consequences

- The Eastern Day Watcher's single internal date key is no longer the source of
  truth for game-play staleness; the load-time anchor is. A future change to the
  watcher must preserve the two-callback split or re-entry detection breaks.
- A player who keeps the completed-result view focused across midnight will see
  an expired countdown until they re-focus the tab; accepted as cosmetic.
