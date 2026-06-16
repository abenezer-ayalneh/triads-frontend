# Rollover-home on re-entry extends to Classic Extra play

## Status

accepted — extends [ADR-0001](./0001-daily-rollover-routes-home-on-reentry.md)

## Context

ADR-0001 sends a player **home** when they re-enter a backgrounded Daily across
an Eastern-time Daily Rollover, so the next play passes through the
Brain-Warming Intro. Its scope was explicitly limited to _Daily_ states — the
Eastern Day Watcher is started only when `gameMode === 'daily'`.

Classic Extra play was never covered. The `/classic` route starts no watcher at
all, and the Play-More Prompt left open over the home screen is not dismissed on
re-entry. So a player who finished yesterday's Daily and started a bonus game
would return the next morning to yesterday's "play your next bonus game" screen
instead of today's Play Now.

This is purely a **client** staleness problem. The server already presents a
clean slate at Eastern midnight: `DailyTriadAttempt` and `DailyClassicExtraUsage`
are both keyed by `(anonymousId, puzzleDate)`, so a new Eastern day reports the
Daily as not-completed and bonus usage as zero (and bonus play locked until the
Daily is done). There is no server-side progress to wipe.

## Decision

The ADR-0001 rule — **re-entry after a Daily Rollover routes the player home** —
applies to **all play modes, including Classic Extra**, not just the Daily.

- **Trigger:** re-entry only (focus / visibility change), never the live midnight
  timer. An actively-focused player is never yanked off their screen mid-play,
  exactly as in ADR-0001.
- **Surfaces:**
    - The `/classic` game-play route records a load-time Eastern date and routes
      home on a re-entry rollover, mirroring the Daily route.
    - The home screen dismisses the Play-More Prompt and Review dialogs on a
      re-entry rollover, so neither lingers over the refreshed home view.

## Consequences

- A player who backgrounds an in-progress Classic Extra and returns after the
  rollover loses that board. Accepted: the bonus game was counted against
  `DailyClassicExtraUsage` when it _started_ (yesterday's date), so abandoning the
  unfinished board does not affect today's allowance, and it matches how an
  in-progress Daily is already abandoned on re-entry.
- The Eastern Day Watcher's re-entry callback is no longer Daily-specific. A
  future change must keep the load-time-date anchor recorded on **every** play
  route (Classic and Daily) or stale bonus screens resurface.
